/**
 * Boots the client's room-object pipeline headlessly.
 *
 * Same principle as `AvatarRenderService`: nothing here reimplements a visualization.
 * `RoomContentLoader`, `RoomObjectFactory`, `RoomObjectVisualizationFactory`, `RoomManager`
 * and the forty-odd `Furniture*Visualization` classes are the engine's own, running unmodified
 * — only the browser APIs under them are replaced (`shim/`). A furni imager that reinvents the
 * layer/direction/colour rules drifts from the room the first time either side is touched, and
 * the drift shows up as a catalog thumbnail that does not match the item you just placed.
 *
 * What is *not* booted is `RoomEngine`. It is a DI `Component` with hard dependencies on the
 * window manager, the toolbar, the catalog and the session manager; a hard dependency on an
 * IID nothing provides locks a component forever with nothing logged. So the four collaborators
 * it would have wired are wired here directly — which is all `RoomEngine.getFurnitureImage()`
 * actually uses them for.
 *
 * The one thing this class cannot borrow is the rasterizer.
 * `RoomObjectSpriteVisualization.getImage()` and `RoomRenderingCanvas` both end at
 * `Vortex.instance.application.renderer.extract.canvas()`, and there is no PixiJS renderer in
 * Node. The sprites themselves are plain data (`getSprite(i)` → texture + offset + depth +
 * tint), so `render/composeSprites.ts` draws them on a 2D canvas instead — which is what AS3's
 * own `BitmapData.draw()` loop did before PixiJS existed.
 */
import {EventEmitter} from 'eventemitter3';
import {createCanvas} from '@napi-rs/canvas';
import type {Canvas} from '@napi-rs/canvas';
import {Logger} from '@core/utils/Logger';
import type {CoreComponentContext} from '@core/runtime/CoreComponentContext';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import {IID_RoomManager} from '@iid/IIDRoomManager';
import {RoomManager} from '@room/RoomManager';
import type {IRoomInstance} from '@room/IRoomInstance';
import type {IRoomObjectController} from '@room/object/IRoomObjectController';
import {RoomContentLoadedEvent} from '@room/events/RoomContentLoadedEvent';
import {RoomContentLoader} from '@habbo/room/RoomContentLoader';
import {RoomObjectFactory} from '@habbo/room/RoomObjectFactory';
import {RoomObjectVisualizationFactory} from '@habbo/room/object/RoomObjectVisualizationFactory';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {RoomVisualizationData} from '@habbo/room/object/visualization/room/RoomVisualizationData';
import type {NitroAsset} from '@core/assets/NitroAsset';
import {FurnitureDataParser} from '@habbo/session/furniture/FurnitureDataParser';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {HabboConfigurationManager} from '@habbo/configuration/HabboConfigurationManager';

const log = Logger.getLogger('imager.room.RoomStack');

/** How long boot waits for furnidata and for the placeholder libraries. */
const BOOT_TIMEOUT_MS = 120_000;

/** How long a single request waits for one furni's `.nitro` bundle. */
const CONTENT_TIMEOUT_MS = 30_000;

/** How often {@link RoomStack.pumpUntil} runs a frame while it waits. */
const PUMP_INTERVAL_MS = 10;

/** `RoomContentLoader.ROOM_CONTENT` — the type the room's own bundle registers under. */
const ROOM_CONTENT_TYPE = 'room';

export class RoomStack
{
    private _contentLoader: RoomContentLoader;
    private _roomManager: RoomManager;
    private _floorItems: Map<number, IFurnitureData> = new Map();
    private _wallItems: Map<number, IFurnitureData> = new Map();
    private _roomVisualizationData: RoomVisualizationData | null = null;

    /** Types whose load has already been awaited, successfully or not. */
    private _settledContent: Set<string> = new Set();

    private constructor(
        contentLoader: RoomContentLoader,
        roomManager: RoomManager
    )
    {
        this._contentLoader = contentLoader;
        this._roomManager = roomManager;
    }

    /**
	 * Brings the pipeline up on an already-booted core.
	 *
	 * It takes the avatar service's context rather than building its own: the asset library,
	 * the configuration manager and the DI container are the same ones, and a second
	 * `HabboConfigurationManager` would mean a second `external_variables` download and two
	 * copies of the hotel config that can disagree.
	 */
    static async boot(
        context: CoreComponentContext,
        assetLibrary: IAssetLibrary,
        configuration: HabboConfigurationManager
    ): Promise<RoomStack>
    {
        // `RoomManager.createRoomObject()` reads `context.configuration` for the three external
        // image base URLs it pushes into every visualization. On the client that field is set
        // during bootstrap; nothing sets it here, and an unset one silently gives every
        // visualization empty base URLs.
        context.configuration = configuration;

        const contentLoader = new RoomContentLoader();
        const visualizationFactory = new RoomObjectVisualizationFactory();
        const objectFactory = new RoomObjectFactory();
        const roomManager = new RoomManager(context);

        // `RoomEngine`'s own wiring (`_visualizationFactory.assets = assetLibrary`). Furniture
        // never reads it, which is why this parameter sat unused; a pet does —
        // `AnimatedPetVisualizationData.commonAssets` is where the shared pet artwork comes
        // from, and without it a pet renders its body and none of the common layers.
        visualizationFactory.assets = assetLibrary;

        const stack = new RoomStack(contentLoader, roomManager);

        await stack.loadFurniData(configuration);

        contentLoader.sessionDataManager = stack.createFurniDataSource();
        contentLoader.visualizationFactory = visualizationFactory;
        // Two arguments, not three: `initialize()` stopped taking an asset library when content
        // types got one collection each. The stray one was landing in `configurationManager`,
        // and only went unnoticed because `AssetLibrary` is a `Component` and its `getProperty()`
        // forwards to the same configuration anyway.
        contentLoader.initialize(new EventEmitter(), configuration);

        roomManager.setObjectFactory(objectFactory);
        roomManager.setVisualizationFactory(visualizationFactory);
        roomManager.setContentLoader(contentLoader);

        // `RoomInstance.update()` only ticks the categories registered here, and it is what runs
        // each object's *logic* — the half of an object that reacts to its own data rather than
        // to the geometry. `RoomEngine.initializeRoomInstance()` registers 0, 10, 20, 100 and
        // 200; the cursor category is the only one nothing here ever creates.
        for(const category of [
            RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
        ])
        {
            roomManager.addObjectUpdateCategory(category);
        }

        context.attachComponent(roomManager, [IID_RoomManager]);

        // `Component` defers initComponent() to a microtask, and `initialize()` buffers itself
        // until that has run. Yielding once here means the call below takes the real path
        // instead of the pending one.
        await Promise.resolve();

        // A downloaded bundle is only *queued* by `onContentLoaded()`; what actually builds its
        // graphic asset collection and re-initializes the objects waiting on it is
        // `processLoadedContentTypes()`, and the only caller of that is `update()`. The client
        // gets it from the ticker every frame. There is no ticker here, so the throttle it
        // exists to respect is meaningless — a render is one frame, and it should drain the
        // whole queue.
        roomManager.limitContentProcessing = false;

        const ready = new Promise<void>((resolve) =>
        {
            roomManager.initialize(null, {
                roomManagerInitialized: (): void => resolve(),
                contentLoaded: (type, success): void =>
                {
                    if(!success) log.warn(`Placeholder content "${type}" failed to load`);
                },
                objectInitialized: (): void => {},
                objectsInitialized: (): void => {}
            });
        });

        await withTimeout(stack.pumpUntil(ready), BOOT_TIMEOUT_MS);

        // After the placeholder types are in: the room bundle has to be downloaded before its
        // textures can be read out of it.
        stack.loadRoomVisualizationData();

        log.info('Room pipeline ready');

        return stack;
    }

    get contentLoader(): RoomContentLoader
    {
        return this._contentLoader;
    }

    /**
	 * The floor and wall rasterizers, loaded with the room bundle's own textures.
	 *
	 * This is the one piece of room set-up that lives in `RoomEngine` rather than in
	 * `RoomManager`, so nothing in the pipeline wired above produces it:
	 * `onRoomContentReady()` reads `roomVisualization` out of `HabboRoomContent.nitro`, turns
	 * every texture in the bundle into a canvas, and pushes the result into the room object's
	 * visualization — and `RoomEngine.getRoomObjectVisualization()` re-injects it over whatever
	 * the visualization factory built.
	 *
	 * Skip it and the room still renders: `RoomPlane` falls back to a flat fill when its
	 * rasterizer has no material, so the floor comes out a solid white and the walls solid
	 * grey, with nothing logged. That is exactly what this service did before this existed, and
	 * it looked plausible enough to ship.
	 *
	 * `null` when the bundle has no `roomVisualization` key — the flat fallback then applies,
	 * with a warning.
	 */
    get roomVisualizationData(): RoomVisualizationData | null
    {
        return this._roomVisualizationData;
    }

    /** Floor-item furnidata, keyed by the sprite id the `furniture_definitions` row carries. */
    get floorItems(): ReadonlyMap<number, IFurnitureData>
    {
        return this._floorItems;
    }

    get wallItems(): ReadonlyMap<number, IFurnitureData>
    {
        return this._wallItems;
    }

    /**
	 * Creates (or reuses) a room to hang objects on.
	 *
	 * Rooms are per-request and disposed with {@link disposeRoom}; a shared one would leak the
	 * previous request's furniture into the next render.
	 */
    createRoom(roomId: string): IRoomInstance | null
    {
        return this._roomManager.getRoom(roomId) ?? this._roomManager.createRoom(roomId, null);
    }

    disposeRoom(roomId: string): void
    {
        this._roomManager.disposeRoom(roomId);
    }

    /**
	 * Downloads one object type's `.nitro` bundle and waits for it.
	 *
	 * The client does not wait — it builds the object against the placeholder library and lets
	 * `updateObjectContents()` swap the real content in when it lands. A single HTTP response
	 * has nowhere to put a placeholder, so the request blocks here instead and the object is
	 * created afterwards, already initialized.
	 */
    async ensureContent(type: string): Promise<void>
    {
        if(this._settledContent.has(type)) return;

        if(this._contentLoader.isLoaded(type) && this._contentLoader.getGraphicAssetCollection(type) !== null)
        {
            this._settledContent.add(type);

            return;
        }

        const events = new EventEmitter();

        const arrival = new Promise<void>((resolve) =>
        {
            const settle = (): void => resolve();

            events.once(RoomContentLoadedEvent.CONTENT_LOAD_SUCCESS, settle);
            events.once(RoomContentLoadedEvent.CONTENT_LOAD_FAILURE, settle);
            events.once(RoomContentLoadedEvent.CONTENT_LOAD_CANCEL, settle);
        });

        // Returns false both when the load could not start *and* when it was already in flight
        // or already registered, so the return value says nothing useful; the events do.
        this._contentLoader.loadObjectContent(type, events);

        await withTimeout(arrival, CONTENT_TIMEOUT_MS).catch(() =>
        {
            log.warn(`Content for "${type}" did not load in time; rendering without it`);
        });

        // The bundle has arrived, but the collection it becomes is built by `update()`. Without
        // this the object created next gets a placeholder library and renders a grey box.
        this.pump();

        this._settledContent.add(type);
    }

    /**
	 * Creates one room object, with its content already downloaded.
	 *
	 * `category` is a `RoomObjectCategoryEnum` value: 0 for the room itself, 10 for floor
	 * furniture, 20 for wall items.
	 */
    async createObject(
        roomId: string,
        objectId: number,
        type: string,
        category: number
    ): Promise<IRoomObjectController | null>
    {
        if(category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM) await this.ensureContent(type);

        const room = this.createRoom(roomId);

        if(room === null) return null;

        return room.createRoomObject(objectId, type, category) as IRoomObjectController | null;
    }

    /**
	 * Runs one frame of the room manager.
	 *
	 * This is the client's ticker, called by hand. `update()` is what drains the queue of
	 * downloaded-but-unprocessed content types and what re-initializes objects whose bundle
	 * arrived after they were created — both of which the imager needs at precise moments
	 * rather than sixty times a second.
	 */
    pump(): void
    {
        this._roomManager.update(0);
    }

    /**
	 * Pumps frames until `settled` resolves.
	 *
	 * Boot needs this because the placeholder libraries finish downloading asynchronously and
	 * each one only becomes usable on the next `update()`. A plain `await` would sit there
	 * forever waiting for a frame nobody is going to run.
	 */
    async pumpUntil(settled: Promise<void>): Promise<void>
    {
        let done = false;

        void settled.then(() =>
        {
            done = true;
        });

        while(!done)
        {
            this.pump();

            await new Promise<void>((resolve) => setTimeout(resolve, PUMP_INTERVAL_MS));
        }

        await settled;
    }

    dispose(): void
    {
        this._roomManager.dispose();
        this._contentLoader.dispose();
    }

    /**
	 * Builds the room's plane rasterizers out of `HabboRoomContent.nitro`.
	 *
	 * `RoomEngine.onRoomContentReady()`, with one simplification: that method reads each
	 * texture back with `renderer.extract.canvas()` because PixiJS may have dropped the
	 * CPU-side bitmap after uploading it to the GPU. Nothing is uploaded anywhere here — the
	 * shim's `TextureSource.resource` *is* the canvas the bundle was decoded into — so each
	 * frame is simply cut out of its atlas.
	 *
	 * The double registration of every name, with and without the `room_` library prefix, is
	 * that method's too and is not optional: the bundle's spritesheet frames carry the prefix
	 * (`room_floor_texture_64_0_floor_basic`) and the `roomVisualization` JSON references them
	 * without it.
	 *
	 * The lookup goes through the *content loader*, not the core asset library it was handed:
	 * `addAssetLibraryCollection()` gives every content type an `AssetLibraryCollection` of its
	 * own, so `room` is registered in a library named after it and nowhere else. This used to
	 * read the shared library because that is where the port put every asset before those
	 * per-type collections existed, and the miss is silent — the warning below is all it says,
	 * and a flat white floor is a plausible enough room to ship.
	 */
    private loadRoomVisualizationData(): void
    {
        const asset = this._contentLoader.getAssetByName(ROOM_CONTENT_TYPE) as NitroAsset | null;
        const data = asset?.jsonData as { roomVisualization?: unknown } | null;
        const visualization = data?.roomVisualization ?? null;

        if(asset === null || visualization === null)
        {
            log.warn('HabboRoomContent.nitro has no roomVisualization — floors and walls render flat');

            return;
        }

        const textures = new Map<string, Canvas>();
        const prefix = `${ROOM_CONTENT_TYPE}_`;

        for(const [name, texture] of asset.textures)
        {
            const canvas = frameToCanvas(texture as unknown as IDrawableTexture);

            if(canvas === null) continue;

            textures.set(name, canvas);

            if(name.startsWith(prefix)) textures.set(name.slice(prefix.length), canvas);
        }

        const roomData = new RoomVisualizationData();

        roomData.initialize(visualization);
        roomData.initializeAssetCollection(textures as unknown as Map<string, HTMLCanvasElement>);

        this._roomVisualizationData = roomData;

        log.debug(`Room visualization data initialized with ${textures.size} textures`);
    }

    /**
	 * Reads the hotel's furnidata through the client's own parser.
	 *
	 * `RoomContentLoader` needs it to answer `getActiveObjectType(typeId)` — the sprite id to
	 * class name mapping every furni route and every stored room item goes through. On the
	 * client `SessionDataManager` owns this; booting that component would mean booting the
	 * communication manager with it, so the parser is driven directly and the two maps it
	 * fills are handed to the content loader through a source object of the shape it reads
	 * (exactly two methods — see {@link createFurniDataSource}).
	 */
    private async loadFurniData(configuration: HabboConfigurationManager): Promise<void>
    {
        const url = configuration.getProperty('furnidata.load.url');

        if(!url)
        {
            log.warn('furnidata.load.url is not set — furniture and room rendering are disabled');

            return;
        }

        const parser = new FurnitureDataParser(
            this._floorItems,
            this._wallItems,
            new Map<string, number[]>(),
            new Map<string, number[]>(),

            // A sink, not the real manager. Nothing here renders a furniture name, and booting
            // the localization manager would pull the whole text pipeline in for strings with
            // no reader — but passing `null` is not the way to say that: the parser logs an
            // *error* per item when the manager is missing (deliberately, so a client that
            // loses it is diagnosed in seconds), and that is 55,000 error lines on every boot.
            // The stub keeps that diagnostic meaningful where it matters.
            createLocalizationSink()
        );

        await withTimeout(new Promise<void>((resolve) =>
        {
            parser.events.once('FDP_furniture_data_ready', () => resolve());
            parser.loadData(url);
        }), BOOT_TIMEOUT_MS);

        log.info(`Furnidata: ${this._floorItems.size} floor items, ${this._wallItems.size} wall items`);
    }

    /**
	 * The two methods `RoomContentLoader.initFurnitureData()` calls on its session data
	 * manager, and nothing else. Cast rather than implemented: `ISessionDataManager` declares
	 * well over a hundred members, and stubbing them all would hide which two actually matter.
	 */
    private createFurniDataSource(): ISessionDataManager
    {
        const source = {
            getFurniData: (): IFurnitureData[] => [...this._floorItems.values(), ...this._wallItems.values()],
            removeFurniDataListener: (): void => {}
        };

        return source as unknown as ISessionDataManager;
    }
}

/**
 * The one method `FurnitureDataParser` calls on a localization manager, discarding what it
 * writes. Cast rather than implemented for the same reason the furnidata source above is:
 * `IHabboLocalizationManager` is a large interface and stubbing all of it would hide which
 * single member is actually reached.
 */
function createLocalizationSink(): IHabboLocalizationManager
{
    return {updateLocalization: (): void => {}} as unknown as IHabboLocalizationManager;
}

/** The part of a shim `Texture` this file reads — see `render/composeSprites.ts` for why. */
interface IDrawableTexture
{
    frame: { x: number; y: number; width: number; height: number };
    source: { resource: unknown };
    trim?: { x: number; y: number };
    orig?: { width: number; height: number };
}

/**
 * Cuts one frame out of its atlas into a canvas of its own.
 *
 * The canvas is the *untrimmed* size with the pixels at their trim offset, because the plane
 * rasterizers tile these as materials and treat each one as a whole cell — handing them the
 * packed rectangle instead would shift and shrink the pattern.
 */
function frameToCanvas(texture: IDrawableTexture | null): Canvas | null
{
    const source = texture?.source?.resource;

    if(!texture || !source) return null;

    const frame = texture.frame;
    const trim = texture.trim ?? {x: 0, y: 0};
    const orig = texture.orig ?? {width: frame.width, height: frame.height};

    if(orig.width < 1 || orig.height < 1 || frame.width < 1 || frame.height < 1) return null;

    const canvas = createCanvas(Math.ceil(orig.width), Math.ceil(orig.height));
    const context = canvas.getContext('2d');

    context.imageSmoothingEnabled = false;
    context.drawImage(
        source as Parameters<typeof context.drawImage>[0],
        frame.x, frame.y, frame.width, frame.height,
        trim.x, trim.y, frame.width, frame.height
    );

    return canvas;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T>
{
    return new Promise<T>((resolve, reject) =>
    {
        const timer = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);

        promise.then(
            (value) =>
            {
                clearTimeout(timer);
                resolve(value);
            },
            (error) =>
            {
                clearTimeout(timer);
                reject(error);
            }
        );
    });
}
