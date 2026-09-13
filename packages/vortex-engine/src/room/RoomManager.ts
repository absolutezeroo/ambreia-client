/**
 * RoomManager
 *
 * Based on AS3: com.sulake.room.RoomManager
 *
 * Manages room instances and their objects. Implements IRoomInstanceContainer
 * to create room objects with proper logic and visualization.
 *
 * @see sources/win63_version/room/RoomManager.as
 */
import {Component, type IContext} from '@core/runtime';
import {Logger} from '@core';
import type {IRoomManager} from './IRoomManager';
import type {IRoomInstance} from './IRoomInstance';
import type {IRoomInstanceContainer} from './IRoomInstanceContainer';
import type {IRoomManagerListener} from './IRoomManagerListener';
import type {IRoomContentLoader} from './IRoomContentLoader';
import type {IRoomObject} from './object/IRoomObject';
import type {IRoomObjectController} from './object/IRoomObjectController';
import type {IRoomObjectManager} from './IRoomObjectManager';
import type {IRoomObjectFactory} from './IRoomObjectFactory';
import type {IRoomObjectVisualizationFactory} from './object/IRoomObjectVisualizationFactory';
import type {IRoomObjectSpriteVisualization} from './object/visualization/IRoomObjectSpriteVisualization';
import {RoomInstance} from './RoomInstance';
import {RoomContentLoadedEvent} from './events/RoomContentLoadedEvent';

const log = Logger.getLogger('room.RoomManager');

/**
 * Room manager states.
 *
 * @see AS3 RoomManager lines 22-30
 */
export const RoomManagerState = {
    ERROR: -1,
    LOADING: 0,
    LOADED: 1,
    INITIALIZING: 2,
    INITIALIZED: 3,
} as const;

export class RoomManager extends Component implements IRoomManager, IRoomInstanceContainer
{
    /**
    * Content processing time limit per frame (ms).
    *
    * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::CONTENT_PROCESSING_TIME_LIMIT_MILLISECONDS
    */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::CONTENT_PROCESSING_TIME_LIMIT_MILLISECONDS
    private static readonly CONTENT_PROCESSING_TIME_LIMIT_MILLISECONDS = 40;

    /**
	 * The five states a room's content can be in, as AS3 numbers them
	 *
	 * Declared and never read — in AS3 either, where nothing outside this class references them.
	 * They are kept so the state space is written down somewhere rather than implied by the
	 * loading code.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::ROOM_MANAGER_ERROR
    public static readonly ROOM_MANAGER_ERROR = -1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::ROOM_MANAGER_LOADING
    public static readonly ROOM_MANAGER_LOADING = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::ROOM_MANAGER_LOADED
    public static readonly ROOM_MANAGER_LOADED = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::ROOM_MANAGER_INITIALIZING
    public static readonly ROOM_MANAGER_INITIALIZING = 2;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::ROOM_MANAGER_INITIALIZED
    public static readonly ROOM_MANAGER_INITIALIZED = 3;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::_rooms
    private _rooms: Map<string, IRoomInstance> = new Map();
    private _contentLoader: IRoomContentLoader | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::_objectFactory
    private _objectFactory: IRoomObjectFactory | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::_visualizationFactory
    private _visualizationFactory: IRoomObjectVisualizationFactory | null = null;
    private _listener: IRoomManagerListener | null = null;
    private _updateCategories: Set<number> = new Set();
    private _pendingTypes: Set<string> = new Set();
    private _loadedContentTypes: string[] = [];
    private _skipContentProcessing: boolean = false;

    constructor(context: IContext)
    {
        super(context);

        // AS3 registers the content-load listeners in its constructor (lines 68-70),
        // once and for the object's whole life. The old code registered them inside
        // initialize(), which runs later and again on every call — so events that
        // fired before the first initialize() were missed, and repeated initialize()
        // calls stacked duplicate handlers.
        this.events.on(RoomContentLoadedEvent.CONTENT_LOAD_SUCCESS, this.onContentLoaded, this);
        this.events.on(RoomContentLoadedEvent.CONTENT_LOAD_FAILURE, this.onContentLoaded, this);
        this.events.on(RoomContentLoadedEvent.CONTENT_LOAD_CANCEL, this.onContentLoaded, this);
    }

    private _limitContentProcessing: boolean = true;

    /**
	 * Whether to throttle content processing to 40ms per frame.
	 *
	 * @see AS3 RoomManager lines 80-82
	 */
    get limitContentProcessing(): boolean
    {
        return this._limitContentProcessing;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::set limitContentProcessing()
    set limitContentProcessing(value: boolean)
    {
        this._limitContentProcessing = value;
    }

    private _state: number = RoomManagerState.LOADING;

    /**
	 * Pending init data — stored when initialize() is called before initComponent().
	 *
	 * @see AS3 RoomManager var_3149
	 */
    private _pendingInitData: unknown = null;

    /**
	 * Pending listener — stored when initialize() is called before initComponent().
	 *
	 * @see AS3 RoomManager var_85
	 */
    private _pendingListener: IRoomManagerListener | null = null;

    get state(): number
    {
        return this._state;
    }

    /**
	 * Set the object factory used to create room object logic.
	 *
	 * Deliberately a setter, not a DI dependency — see setVisualizationFactory().
	 */
    setObjectFactory(factory: IRoomObjectFactory): void
    {
        this._objectFactory = factory;
    }

    /**
	 * Set the visualization factory used to create room object visualizations.
	 *
	 * AS3 (RoomManager.as:83-92) resolves both factories through DI, declaring
	 * IIDRoomObjectFactory and IIDRoomObjectVisualizationFactory in its dependencies getter. That
	 * works there because RoomObjectFactory extends Component and a SWF component library
	 * (binaryData/HabboRoomObjectLogicLib.as, via RoomObjectFactoryBootstrap and its manifest)
	 * registers it against those IIDs at runtime.
	 *
	 * This port has no component-library loader — libraries are ES modules resolved at build time
	 * (see CoreComponentContext.loadLibraries()) — and RoomObjectFactory is a plain class, not a
	 * Component. Declaring the AS3 dependencies here would block on IIDs nothing ever announces and
	 * RoomManager would never initialize. RoomEngine pushes both factories in from its own
	 * IID_RoomManager callback instead (RoomEngine.ts:273-291).
	 *
	 * Ordering is safe because IID_RoomManager has exactly one consumer: RoomEngine, which cannot
	 * create rooms before that required dependency resolves, and resolving it is what injects these.
	 * A second consumer of IID_RoomManager would break that guarantee and get a factory-less
	 * manager — createRoomObject() would then silently build objects with no visualization.
	 */
    setVisualizationFactory(factory: IRoomObjectVisualizationFactory): void
    {
        this._visualizationFactory = factory;
    }

    /**
	 * Called when the component is unlocked (all DI dependencies resolved).
	 *
	 * Sets state to LOADED and processes any pending initialize() call
	 * that arrived before the component was ready.
	 *
	 * @see AS3 RoomManager.initComponent() lines 96-106
	 */
    protected override initComponent(): void
    {
        this._state = RoomManagerState.LOADED;

        if(this._pendingInitData !== null || this._pendingListener !== null)
        {
            const data = this._pendingInitData;
            const listener = this._pendingListener;

            this._pendingInitData = null;
            this._pendingListener = null;

            this.initialize(data, listener!);
        }
    }

    /**
	 * Initialize the room manager.
	 *
	 * If called before initComponent() (state == LOADING), stores data
	 * for deferred initialization. Otherwise proceeds immediately.
	 *
	 * @see AS3 RoomManager.initialize() lines 133-175
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::initialize()
    initialize(data: unknown, listener: IRoomManagerListener): boolean
    {
        // AS3: if state == 0 (LOADING), buffer for later
        if(this._state === RoomManagerState.LOADING)
        {
            if(this._pendingInitData !== null)
            {
                return false;
            }

            this._pendingInitData = data;
            this._pendingListener = listener;

            return true;
        }

        if(this._state >= RoomManagerState.INITIALIZING)
        {
            return false;
        }

        if(this._contentLoader === null)
        {
            return false;
        }

        this._listener = listener;

        // Content-load listeners are registered once in the constructor (AS3 parity),
        // not here — see the constructor.

        // Load placeholder types
        const placeHolderTypes = this._contentLoader.getPlaceHolderTypes();

        for(const type of placeHolderTypes)
        {
            if(!this._pendingTypes.has(type))
            {
                this._contentLoader.loadObjectContent(type, this.events);
                this._pendingTypes.add(type);
            }
        }

        this._state = RoomManagerState.INITIALIZING;

        // If no pending types, mark as initialized immediately
        if(this._pendingTypes.size === 0)
        {
            this._state = RoomManagerState.INITIALIZED;

            if(this._listener)
            {
                this._listener.roomManagerInitialized(true);
            }
        }

        return true;
    }

    /**
	 * Set the content loader.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::setContentLoader()
    setContentLoader(loader: IRoomContentLoader): void
    {
        if(this._contentLoader)
        {
            this._contentLoader.dispose();
        }

        this._contentLoader = loader;
    }

    /**
	 * Add an object update category.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::addObjectUpdateCategory()
    addObjectUpdateCategory(category: number): void
    {
        if(this._updateCategories.has(category))
        {
            return;
        }

        this._updateCategories.add(category);

        // Add to all existing rooms
        for(const room of this._rooms.values())
        {
            room.addObjectUpdateCategory(category);
        }
    }

    /**
	 * Remove an object update category.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::removeObjectUpdateCategory()
    removeObjectUpdateCategory(category: number): void
    {
        if(!this._updateCategories.delete(category))
        {
            return;
        }

        // Remove from all existing rooms
        for(const room of this._rooms.values())
        {
            room.removeObjectUpdateCategory(category);
        }
    }

    /**
	 * Create a new room instance.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::createRoom()
    createRoom(id: string, _data: unknown): IRoomInstance | null
    {
        if(this._state < RoomManagerState.INITIALIZED)
        {
            // `debug`, not `warn`: both callers handle the null. `RoomEngine.getGenericRoomObjectImage()`
            // returns an empty ImageResult, which is exactly what AS3's own `PetImageWidget.refresh()`
            // expects — it asks for a pet image before the engine can serve one and falls back to
            // `placeholder_pet_png`. Five of these fired on every boot for a path the client handles
            // by design, which is what `warn` is not for (.claude/rules/10-conventions.md).
            log.debug(`Cannot create room — manager not initialized (state: ${this._state})`);

            return null;
        }

        if(this._rooms.has(id))
        {
            return null;
        }

        const room = new RoomInstance(id, this);
        this._rooms.set(id, room);

        // Add update categories to the new room
        for(const category of this._updateCategories)
        {
            room.addObjectUpdateCategory(category);
        }

        return room;
    }

    /**
	 * Get a room by ID.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::getRoom()
    getRoom(id: string): IRoomInstance | null
    {
        return this._rooms.get(id) ?? null;
    }

    /**
	 * Get a room by index.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::getRoomWithIndex()
    getRoomWithIndex(index: number): IRoomInstance | null
    {
        if(index < 0 || index >= this._rooms.size)
        {
            return null;
        }

        let i = 0;

        for(const room of this._rooms.values())
        {
            if(i === index) return room;
            i++;
        }

        return null;
    }

    /**
	 * Get the number of rooms.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::getRoomCount()
    getRoomCount(): number
    {
        return this._rooms.size;
    }

    /**
	 * Dispose a room.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::disposeRoom()
    disposeRoom(id: string): boolean
    {
        const room = this._rooms.get(id);

        if(room)
        {
            room.dispose();
            this._rooms.delete(id);
            // AS3 drops the per-room logic data on BOTH paths — whether or not the room was there
            // to dispose — because a room that failed to register may still have accumulated
            // VariableFx configs from a message that arrived first.
            this._objectFactory?.disposeRoomLogicData(id);

            return true;
        }

        this._objectFactory?.disposeRoomLogicData(id);

        return false;
    }

    // AS3: sources/AIR-1.0.31/scripts/com/sulake/room/RoomManager.as::updateVariableFxConfigs()
    updateVariableFxConfigs(id: string, configs: unknown[]): void
    {
        // AS3 also calls `_visualizationFactory.updateVariableFxConfigs()` here. That half is the
        // visualization config store, which this port has not ported yet — it belongs with the
        // renderers, not with the logic. The logic half below is complete.
        // TODO(AS3): sources/AIR-1.0.31/scripts/com/sulake/room/RoomManager.as::updateVariableFxConfigs()
        //   — add the `_visualizationFactory.updateVariableFxConfigs(id, configs)` call once
        //   RoomObjectVisualizationFactory has its VariableFx config store.
        this._objectFactory?.updateVariableFxConfigs(id, configs);
    }

    // AS3: sources/AIR-1.0.31/scripts/com/sulake/room/RoomManager.as::removeVariableFxConfigs()
    removeVariableFxConfigs(id: string, configIds: number[]): void
    {
        // TODO(AS3): sources/AIR-1.0.31/scripts/com/sulake/room/RoomManager.as::removeVariableFxConfigs()
        //   — same missing half as updateVariableFxConfigs() above.
        this._objectFactory?.removeVariableFxConfigs(id, configIds);
    }

    /**
	 * Check if content is available for a type.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::isContentAvailable()
    // "Available" means the type's graphic asset collection is loaded - NOT
    // hasInternalContent(), which answers a different question ("is this type handled internally",
    // true only for user/bot/... and never for furniture or pets).
    //
    // With hasInternalContent() here, this returned false for every pet, so
    // RoomEngine.getGenericRoomObjectImage() always took its `!isRoomObjectContentAvailable(type)`
    // path and parked the listener in _pendingImageListeners. That queue is only drained by
    // resolvePendingImageListeners(), which fires on content *load* - so the first request worked
    // (the .nitro was loading anyway) and every later one hung forever against already-cached
    // content, i.e. the image appeared once and never came back.
    // This answered `hasInternalContent(type)` for a while, which is a different question ("is
    // this type handled internally", true for user/bot and never for furniture or pets). Every pet
    // therefore read as unavailable, RoomEngine.getGenericRoomObjectImage() always parked its
    // listener in _pendingImageListeners, and that queue only drains on content *load* — so a
    // catalog pet preview appeared once and never again against cached content.
    //
    // Returning AS3's bare `getGraphicAssetCollection(type) != null` was worse: createRoomObject()
    // built the object against the *place-holder* library while this method, re-asked a few lines
    // later against a browser-cached .nitro, already answered "available". The two guards
    // disagreed about the same instant and getImage() drew nothing at all.
    //
    // Both guards now ask the same two-part question — the collection exists *and* isLoaded() —
    // and createRoomObject() marks the object uninitialised on the same condition, so
    // updateObjectContents() re-initialises it when the content actually lands
    // (processLoadedContentTypes() -> updateObjectContents()). Keep the two in step: changing one
    // without the other is what produced both failures above.
    // AS3: sources/win63_version/room/RoomManager.as::isContentAvailable()
    isContentAvailable(type: string): boolean
    {
        if(this._contentLoader)
        {
            return this._contentLoader.getGraphicAssetCollection(type) != null && this._contentLoader.isLoaded(type);
        }

        return false;
    }

    /**
	 * Update all rooms. Processes loaded content first (with throttling).
	 *
	 * @see AS3 RoomManager.update() lines 593-608
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::update()
    update(_time: number): void
    {
        this.processLoadedContentTypes();

        for(const room of this._rooms.values())
        {
            room.update();
        }
    }

    /**
	 * Create a room object with visualization and logic.
	 *
	 * This is called by RoomInstance.createRoomObject() to actually create the object.
	 * Uses createObjectInternal() on the room to avoid recursion.
	 *
	 * @see sources/win63_version/room/RoomManager.as lines 278-363
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::createRoomObject()
    createRoomObject(roomId: string, objectId: number, type: string, category: number): IRoomObject | null
    {
        const room = this.getRoom(roomId);

        if(!room)
        {
            return null;
        }

        // Cast to RoomInstance to access createObjectInternal
        const roomInstance = room as RoomInstance;

        // Resolve content types. For content that has internal handling (users, etc.),
        // use the type directly. Otherwise resolve from content loader.
        let contentType: string = type;
        let visualizationType: string | null = type;
        let logicType: string | null = type;
        let initialized = true;
        let assetCollection = this._contentLoader?.getGraphicAssetCollection(contentType) ?? null;
        let visualizationConfig: unknown | null = null;
        if(this._contentLoader && !this._contentLoader.hasInternalContent(type))
        {
            // A GraphicAssetCollection can exist in the registry (registered
            // synchronously the moment loading starts) before its async fetch/parse
            // has actually populated it with assets. Treating "collection object
            // exists" as "content ready" left objects marked initialized=true while
            // still asset-less, which permanently skips the updateObjectContents()
            // re-initialization pass once the real content finishes loading.
            if(assetCollection === null || !this._contentLoader.isLoaded(type))
            {
                this._contentLoader.loadObjectContent(type, this.events);
                contentType = this._contentLoader.getPlaceHolderType(type);
                assetCollection = this._contentLoader.getGraphicAssetCollection(contentType);
                initialized = false;
            }

            visualizationType = this._contentLoader.getVisualizationType(contentType);
            logicType = this._contentLoader.getLogicType(contentType);

            visualizationConfig = this._contentLoader.getVisualizationXML(contentType);
        }

        // Create the object using createObjectInternal (not createRoomObject to avoid recursion)
        const stateCount = 1;
        const object = roomInstance.createObjectInternal(objectId, stateCount, type, category);

        if(!object)
        {
            return null;
        }

        const controller = object as IRoomObjectController;

        // Create visualization
        if(this._visualizationFactory && visualizationType)
        {
            const visualization = this._visualizationFactory.createRoomObjectVisualization(visualizationType);

            if(visualization)
            {
                const spriteViz = visualization as IRoomObjectSpriteVisualization;
                spriteViz.assetCollection = assetCollection;
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::createRoomObject() (line 343)
                spriteViz.setExternalBaseUrls(
                    this.context.configuration?.getProperty('stories.image_url_base') ?? '',
                    this.context.configuration?.getProperty('extra_data_service_url') ?? '',
                    this.context.configuration?.getBoolean('extra_data_batches_enabled') ?? false
                );

                // Get or create cached visualization data
                const vizData = this._visualizationFactory.getRoomObjectVisualizationData(
                    contentType, visualizationType, visualizationConfig
                );

                if(vizData)
                {
                    spriteViz.initialize(vizData);
                }

                controller.setVisualization(visualization);
            }
        }

        // Create and assign logic
        if(this._objectFactory && logicType)
        {
            const logic = this._objectFactory.createRoomObjectLogic(logicType);

            if(logic)
            {
                controller.setEventHandler(logic);
                logic.object = controller;

                // Only initialize logic here when real content is already available.
                // FurnitureLogic.initialize() locks several model variables
                // (furniture_allowed_directions, furniture_size_x/y/z, ...) with
                // RoomObjectModel's immutable flag (matching real AS3's own
                // setNumberArray/setNumber semantics - the first `protect=true` write
                // wins and all subsequent writes to that key are silently ignored).
                // Calling this with placeholder content would permanently lock those
                // variables to the placeholder's generic values, and the real
                // re-initialization from updateObjectContents() below would then be
                // silently dropped once the real content loads. When using placeholder
                // content (initialized=false), leave logic uninitialized here and let
                // updateObjectContents() perform the one real initialize() call once
                // the actual content is ready.
                if(initialized)
                {
                    logic.initialize(visualizationConfig);
                }
            }
        }

        // Mark as initialized only if content was already available
        if(initialized)
        {
            controller.setInitialized(true);
        }

        // Notify content loader
        if(this._contentLoader)
        {
            this._contentLoader.roomObjectCreated(object, roomId);
        }

        return object;
    }

    /**
	 * Create a room object manager.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::createRoomObjectManager()
    createRoomObjectManager(): IRoomObjectManager
    {
        if(this._objectFactory)
        {
            return this._objectFactory.createRoomObjectManager();
        }

        // Fallback - should not happen
        throw new Error('[RoomManager] No object factory available');
    }

    override dispose(): void
    {
        if(this.disposed) return;

        // Remove event listeners
        this.events.off(RoomContentLoadedEvent.CONTENT_LOAD_SUCCESS, this.onContentLoaded, this);
        this.events.off(RoomContentLoadedEvent.CONTENT_LOAD_FAILURE, this.onContentLoaded, this);
        this.events.off(RoomContentLoadedEvent.CONTENT_LOAD_CANCEL, this.onContentLoaded, this);

        // Dispose all rooms
        for(const room of this._rooms.values())
        {
            room.dispose();
        }

        this._rooms.clear();

        if(this._contentLoader)
        {
            this._contentLoader.dispose();
            this._contentLoader = null;
        }

        this._listener = null;
        this._objectFactory = null;
        this._visualizationFactory = null;
        this._updateCategories.clear();
        this._pendingTypes.clear();
        this._loadedContentTypes.length = 0;

        super.dispose();
    }

    /**
	 * Handle content load completion events.
	 *
	 * @see AS3 RoomManager.onContentLoaded() lines 425-444
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::onContentLoaded()
    private onContentLoaded(type: string | null): void
    {
        // AS3 ignores the event entirely once the content loader is gone.
        if(this._contentLoader === null)
        {
            return;
        }

        if(type === null)
        {
            if(this._listener)
            {
                this._listener.contentLoaded('', false);
            }

            return;
        }

        // AS3 de-dups (indexOf < 0): a type already queued is not pushed again, so the
        // same content is not re-processed. The old body pushed unconditionally.
        if(this._loadedContentTypes.indexOf(type) < 0)
        {
            this._loadedContentTypes.push(type);
        }
    }

    /**
	 * Process queued content types with frame budget throttling.
	 * Re-initializes existing objects when their content becomes available.
	 *
	 * @see AS3 RoomManager.processLoadedContentTypes() lines 446-494
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::processLoadedContentTypes()
    private processLoadedContentTypes(): void
    {
        if(this._skipContentProcessing)
        {
            this._skipContentProcessing = false;

            return;
        }

        if(this._loadedContentTypes.length === 0)
        {
            return;
        }

        const startTime = performance.now();

        while(this._loadedContentTypes.length > 0)
        {
            const type = this._loadedContentTypes.shift()!;

            // AS3 (RoomManager.as:443-458) guards on both the visualization XML and the
            // graphic asset collection, reporting contentLoaded(type, false) and
            // returning from the whole method on either miss. The "room" bundle passes
            // both once RoomContentLoader.hasVisualizationData() recognises the Nitro
            // `roomVisualization` key; all six placeholder types were verified to report
            // hasVisualizationXML=true and a non-null collection here.
            if(this._contentLoader !== null && !this._contentLoader.hasVisualizationXML(type))
            {
                if(this._listener)
                {
                    this._listener.contentLoaded(type, false);
                }

                return;
            }

            if(this._contentLoader !== null && this._contentLoader.getGraphicAssetCollection(type) == null)
            {
                if(this._listener)
                {
                    this._listener.contentLoaded(type, false);
                }

                return;
            }

            // Re-initialize existing objects of this type
            this.updateObjectContents(type);

            // Notify listener
            if(this._listener)
            {
                this._listener.contentLoaded(type, true);
            }

            // Check if still waiting for placeholder content. AS3 only calls this while
            // types are still pending (RoomManager.as:465); once _pendingTypes empties
            // (initialization complete) later content loads must not re-enter it.
            if(this._pendingTypes.size > 0)
            {
                this.processInitialContentLoad(type);
            }

            // Throttle: defer to next frame if over budget
            if(this._limitContentProcessing && (performance.now() - startTime) >= RoomManager.CONTENT_PROCESSING_TIME_LIMIT_MILLISECONDS)
            {
                this._skipContentProcessing = true;

                break;
            }
        }
    }

    /**
	 * Check if a loaded placeholder type completes initialization.
	 *
	 * @see AS3 RoomManager.processInitialContentLoad() lines 386-423
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::processInitialContentLoad()
    private processInitialContentLoad(type: string): void
    {
        // AS3 RoomManager.as:368-404.
        if(this._state === RoomManagerState.ERROR)
        {
            return;
        }

        if(this._contentLoader === null)
        {
            this._state = RoomManagerState.ERROR;

            return;
        }

        if(this._contentLoader.getGraphicAssetCollection(type) != null)
        {
            this._pendingTypes.delete(type);

            if(this._pendingTypes.size === 0)
            {
                this._state = RoomManagerState.INITIALIZED;

                if(this._listener)
                {
                    this._listener.roomManagerInitialized(true);
                }
            }
        }
        else
        {
            this._state = RoomManagerState.ERROR;

            if(this._listener)
            {
                this._listener.roomManagerInitialized(false);
            }
        }
    }

    /**
	 * Re-initialize all existing objects of a given type when content becomes available.
	 *
	 * @see AS3 RoomManager.updateObjectContents() lines 496-591
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as::updateObjectContents()
    private updateObjectContents(contentType: string): void
    {
        if(!this._contentLoader || !this._visualizationFactory || !this._objectFactory)
        {
            return;
        }

        const visualizationType = this._contentLoader.getVisualizationType(contentType);
        const logicType = this._contentLoader.getLogicType(contentType);
        const visualizationConfig = this._contentLoader.getVisualizationXML(contentType);

        for(const room of this._rooms.values())
        {
            const roomInstance = room as RoomInstance;
            const managerIds = roomInstance.getObjectManagerIds();
            let allInitialized = true;
            // AS3's _loc10_: at least one object was actually initialised this pass.
            // Without it, objectsInitialized fires even when nothing changed.
            let anyInitialized = false;

            for(const categoryId of managerIds)
            {
                const objectCount = room.getObjectCount(categoryId);

                for(let j = objectCount - 1; j >= 0; j--)
                {
                    const object = room.getObjectWithIndex(j, categoryId);

                    if(!object || object.getType() !== contentType)
                    {
                        continue;
                    }

                    if(object.isInitialized())
                    {
                        continue;
                    }

                    const controller = object as IRoomObjectController;

                    // Create new visualization
                    if(visualizationType)
                    {
                        const visualization = this._visualizationFactory.createRoomObjectVisualization(visualizationType);

                        if(visualization)
                        {
                            const spriteViz = visualization as IRoomObjectSpriteVisualization;
                            spriteViz.assetCollection = this._contentLoader.getGraphicAssetCollection(contentType);
                            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as (line 560)
                            spriteViz.setExternalBaseUrls(
                                this.context.configuration?.getProperty('stories.image_url_base') ?? '',
                                this.context.configuration?.getProperty('extra_data_service_url') ?? '',
                                this.context.configuration?.getBoolean('extra_data_batches_enabled') ?? false
                            );
                            const vizData = this._visualizationFactory.getRoomObjectVisualizationData(
                                contentType, visualizationType, visualizationConfig
                            );

                            if(vizData)
                            {
                                spriteViz.initialize(vizData);
                            }

                            controller.setVisualization(visualization);
                        }
                    }

                    // Create new logic handler
                    if(logicType)
                    {
                        const logic = this._objectFactory.createRoomObjectLogic(logicType);

                        if(logic)
                        {
                            controller.setEventHandler(logic);
                            logic.object = controller;
                            logic.initialize(visualizationConfig);
                        }
                    }

                    controller.setInitialized(true);

                    if(this._listener)
                    {
                        this._listener.objectInitialized(room.id, object.getId(), categoryId);
                        anyInitialized = true;
                    }
                }

                // Check if all objects in category are initialized
                for(let j = room.getObjectCount(categoryId) - 1; j >= 0; j--)
                {
                    const obj = room.getObjectWithIndex(j, categoryId);

                    if(obj && !obj.isInitialized())
                    {
                        allInitialized = false;

                        break;
                    }
                }
            }

            // AS3 passes the room id (via _rooms.getKey), not the content type, and only
            // fires when at least one object was initialised this pass. The old body
            // handed objectsInitialized the content type ("pet3"), so any listener
            // expecting a room id got a string it could not resolve.
            if(allInitialized && anyInitialized && this._listener)
            {
                this._listener.objectsInitialized(room.id);
            }
        }
    }
}
