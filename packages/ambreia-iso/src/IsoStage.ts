import {EventEmitter} from 'eventemitter3';
import {autoDetectRenderer} from 'pixi.js';
import type {Renderer} from 'pixi.js';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import {RoomManager} from './RoomManager';
import type {IRoomInstance} from './IRoomInstance';
import type {IRoomObjectController} from './object/IRoomObjectController';
import type {IRoomObjectSpriteVisualization} from './object/visualization/IRoomObjectSpriteVisualization';
import type {IsoModule} from './object/IIsoRegistries';
import {createRoomRegistries} from './object/createRoomRegistries';
import {RoomContentLoadedEvent} from './events/RoomContentLoadedEvent';
import {Vector3d} from './utils/Vector3d';
import {DEFAULT_ROOM_MODULES} from './defaultRoomModules';
import {RoomContentLoader} from './scene/RoomContentLoader';
import {RoomObjectFactory} from './scene/RoomObjectFactory';
import {RoomObjectVisualizationFactory} from './scene/object/RoomObjectVisualizationFactory';
import {RoomObjectCategoryEnum} from './scene/object/RoomObjectCategoryEnum';
import {RoomObjectVariableEnum} from './scene/object/RoomObjectVariableEnum';
import {RoomObjectRoomUpdateMessage} from './scene/messages/RoomObjectRoomUpdateMessage';
import {RoomObjectDataUpdateMessage} from './scene/messages/RoomObjectDataUpdateMessage';
import {LegacyStuffData} from './scene/object/data/LegacyStuffData';
import type {RoomVisualizationData} from './scene/object/visualization/room/RoomVisualizationData';
import {buildRoomVisualizationData} from './scene/RoomVisualizationDataBuilder';
import type {LegacyWallGeometry} from './scene/utils/LegacyWallGeometry';
import {applyDoorMask, buildPlaneParser, buildWallGeometry, findDoor, floorHeights} from './scene/RoomFloorBuilder';
import type {IRoomDoor} from './scene/RoomFloorBuilder';
import type {IFurnitureData} from './furniture/data/IFurnitureData';
import type {NitroAsset} from '@ambreia/common/assets/NitroAsset';
import {validateRoomData} from './IIsoRoomData';
import type {IIsoFloorItem, IIsoRoomData, IIsoTile, IIsoWallItem} from './IIsoRoomData';
import {IsoView} from './IsoView';
import type {IIsoView} from './IsoView';

const log = Logger.getLogger('iso.IsoStage');

/** RoomEngine.initializeRoom()'s defaults, until a room says otherwise. */
const DEFAULT_FLOOR_TYPE = '111';
const DEFAULT_WALL_TYPE = '201';
const DEFAULT_LANDSCAPE_TYPE = '1';

/** The room object of a room: one per room, in its own category. */
const ROOM_OBJECT_ID = 0;

/** The scale wall item positions are computed at (LegacyWallGeometry's, as the client's). */
const WALL_GEOMETRY_SCALE = 64;

const BOOT_TIMEOUT_MS = 120_000;
const CONTENT_TIMEOUT_MS = 30_000;
const PUMP_INTERVAL_MS = 10;

export interface IIsoStageOptions
{
    /** Shared artwork (pets read their common layers from it). */
    assets: IAssetLibrary;
    /** A configuration property, already interpolated (`flash.dynamic.download.url`…). */
    property(key: string): string;
    /** The hotel's furnidata: what tells a furni class from a wall item, and its revision. */
    furniData: readonly IFurnitureData[];
    /** The room modules; default scene, furniture, avatars and effects. */
    modules?: readonly IsoModule[];
    /** Draws avatars and mannequins; none = they are not drawn. */
    avatarRenderer?: IAvatarRenderManager | null;
    /** A PixiJS renderer for views drawn to a canvas (IIsoView.render()); see createOffscreenRenderer(). */
    renderer?: Renderer | null;
}

/** One loaded room: its instance, its geometry, and the editor's ids mapped to iso's. */
interface IStageRoom
{
    instance: IRoomInstance;
    data: IIsoRoomData;
    heights: number[];
    door: IRoomDoor | null;
    wallGeometry: LegacyWallGeometry;
    ids: Map<string, number>;
    /** The other way: internal id → the editor's id as given (string or number). */
    items: Map<number, string | number>;
    nextId: number;
}

/**
 * A room loaded and drawn without a game session (spec §9 J4, plan D5): the map editor, the
 * sandbox and the imager build rooms through it. RoomEngine.initializeRoom() and the furni adds
 * of RoomMessageHandler, from the editor's zone format instead of server messages.
 */
export class IsoStage
{
    private readonly _options: IIsoStageOptions;
    private readonly _manager: RoomManager;
    private readonly _loader: RoomContentLoader;
    private readonly _rooms: Map<string, IStageRoom> = new Map();
    private readonly _settledContent: Set<string> = new Set();
    private _roomData: RoomVisualizationData | null = null;
    private _time: number = 0;
    private _disposed: boolean = false;

    private constructor(options: IIsoStageOptions, manager: RoomManager, loader: RoomContentLoader)
    {
        this._options = options;
        this._manager = manager;
        this._loader = loader;
    }

    /**
     * A renderer of its own for a host without PixiJS, to pass as `renderer` (browser only). The
     * background is opaque, in the host's colour: on a transparent one a room sprite composites
     * black where it should not (seen in the sandbox's canvas page).
     */
    // ponytail: opaque only; find the offending sprite's alpha if a host needs a transparent view.
    static createOffscreenRenderer(width: number = 800, height: number = 600, background: number = 0x000000): Promise<Renderer>
    {
        return autoDetectRenderer({width, height, background, backgroundAlpha: 1, antialias: false}) as Promise<Renderer>;
    }

    /** Builds the room pipeline and waits for its placeholder content (room, cursor, fallbacks). */
    static async create(options: IIsoStageOptions): Promise<IsoStage>
    {
        const registries = createRoomRegistries(options.modules ?? DEFAULT_ROOM_MODULES);
        const visualizations = new RoomObjectVisualizationFactory(registries.visualizations);
        const loader = new RoomContentLoader();
        const manager = new RoomManager({
            property: (key: string): string => options.property(key),
            flag: (key: string): boolean => ['1', 'true'].includes(options.property(key))
        });

        visualizations.assets = options.assets;
        visualizations.avatarRenderManager = options.avatarRenderer ?? null;

        loader.furniDataSource = {
            getFurniData: (): IFurnitureData[] => [...options.furniData],
            removeFurniDataListener: (): void => {}
        };
        loader.visualizationFactory = visualizations;
        loader.initialize(new EventEmitter(), {getProperty: (key: string): string => options.property(key)});

        manager.setObjectFactory(new RoomObjectFactory(registries.logics));
        manager.setVisualizationFactory(visualizations);
        manager.setContentLoader(loader);

        for(const category of [RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER])
        {
            manager.addObjectUpdateCategory(category);
        }

        const stage = new IsoStage(options, manager, loader);

        manager.start();
        manager.limitContentProcessing = false;

        await withTimeout(stage.pumpUntil(new Promise<void>((resolve) =>
        {
            manager.initialize(null, {
                roomManagerInitialized: (): void => resolve(),
                contentLoaded: (type: string, success: boolean): void =>
                {
                    if(!success) log.warn(`Placeholder content "${type}" failed to load`);
                },
                objectInitialized: (): void => {},
                objectsInitialized: (): void => {}
            });
        })), BOOT_TIMEOUT_MS, 'the room content did not load');

        stage._roomData = buildRoomVisualizationData(loader.getAssetByName('room') as NitroAsset | null);

        return stage;
    }

    /** Builds a room from the editor's data; rejects, naming the field, when the data is invalid. */
    async loadRoom(roomId: string, data: IIsoRoomData): Promise<IRoomInstance>
    {
        const problem = validateRoomData(data);

        if(problem !== null) throw new Error(`Invalid room data: ${problem}`);

        this.disposeRoom(roomId);

        const instance = this._manager.createRoom(roomId, null);

        if(instance === null) throw new Error(`Room ${roomId} could not be created`);

        const heights = floorHeights(data.floor);
        const wallHeight = data.wallHeight ?? 0;
        const room: IStageRoom = {
            instance,
            data,
            heights,
            door: findDoor(data.floor, heights),
            wallGeometry: buildWallGeometry(data.floor, heights, wallHeight, WALL_GEOMETRY_SCALE),
            ids: new Map(),
            items: new Map(),
            nextId: 1
        };

        this._rooms.set(roomId, room);
        this.buildRoomObject(room);

        for(const item of data.decor) await this.addItem(roomId, item);
        for(const item of data.wallDecor) await this.addItem(roomId, item);

        this.pump();

        return instance;
    }

    /** A view of the room: a PixiJS container, or a canvas for a host without PixiJS. */
    createView(roomId: string, width: number, height: number, scale: number = 64): IIsoView | null
    {
        const room = this._rooms.get(roomId);

        if(!room) return null;

        const floor = room.data.floor;

        return IsoView.create({
            instance: room.instance,
            get door(): IRoomDoor | null { return room.door; },
            width: floor.width,
            length: floor.length,
            heightAt: (x: number, y: number): number => Math.max(0, room.heights[y * floor.width + x]),
            itemIdOf: (id: number): string | number | null => room.items.get(id) ?? null
        }, width, height, scale, () => this._options.renderer ?? null);
    }

    /** The loaded room, for a host that reads it (counts, objects). */
    getRoom(roomId: string): IRoomInstance | null
    {
        return this._rooms.get(roomId)?.instance ?? null;
    }

    /** Adds one furni (a stroke of the editor): no reload. */
    async addItem(roomId: string, item: IIsoFloorItem | IIsoWallItem): Promise<void>
    {
        const room = this._rooms.get(roomId);

        if(!room) return;

        const wall = 'side' in item;
        const type = (wall ? this._loader.getWallItemType(item.definition, item.state || null) : this._loader.getActiveObjectType(item.definition)) ?? item.class;
        const category = wall ? RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL : RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE;

        await this.ensureContent(type);

        const key = String(item.id);
        const id = room.ids.get(key) ?? room.nextId++;

        room.ids.set(key, id);
        room.items.set(id, item.id);

        const object = room.instance.createRoomObject(id, type, category) as IRoomObjectController | null;

        if(object === null)
        {
            log.warn(`${wall ? 'Wall item' : 'Furni'} ${key} (${type}) could not be created`);

            return;
        }

        this.placeItem(room, object, item);
    }

    /** Moves, turns or changes the state of a furni already in the room. */
    async updateItem(roomId: string, item: IIsoFloorItem | IIsoWallItem): Promise<void>
    {
        const room = this._rooms.get(roomId);
        const id = room?.ids.get(String(item.id));
        const category = 'side' in item ? RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL : RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE;
        const object = id === undefined ? null : room!.instance.getObject(id, category) as IRoomObjectController | null;

        if(!room || object === null || object.getType() !== this.typeOf(item))
        {
            this.removeItem(roomId, item.id);
            await this.addItem(roomId, item);

            return;
        }

        this.placeItem(room, object, item);
    }

    removeItem(roomId: string, id: string | number): void
    {
        const room = this._rooms.get(roomId);
        const internal = room?.ids.get(String(id));

        if(!room || internal === undefined) return;

        room.instance.disposeObject(internal, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);
        room.instance.disposeObject(internal, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL);
        room.ids.delete(String(id));
        room.items.delete(internal);
    }

    /** Changes one tile: the floor and wall planes are rebuilt, the furniture stays. */
    setTile(roomId: string, x: number, y: number, tile: IIsoTile): void
    {
        const room = this._rooms.get(roomId);

        if(!room) return;

        const {floor} = room.data;

        if(x < 0 || y < 0 || x >= floor.width || y >= floor.length) return;

        floor.tiles[y * floor.width + x] = tile;
        room.heights = floorHeights(floor);
        room.door = findDoor(floor, room.heights);
        room.wallGeometry.setTileHeight(x, y, room.heights[y * floor.width + x]);
        room.instance.disposeObject(ROOM_OBJECT_ID, RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM);
        this.buildRoomObject(room);
    }

    /** One frame: the logics, then every view's sprites. `deltaMs` since the previous call. */
    update(deltaMs: number): void
    {
        this._time += deltaMs;
        this._manager.update(this._time);

        for(const room of this._rooms.values()) room.instance.getRenderer()?.update(this._time);
    }

    disposeRoom(roomId: string): void
    {
        const room = this._rooms.get(roomId);

        if(!room) return;

        room.wallGeometry.dispose();
        this._manager.disposeRoom(roomId);
        this._rooms.delete(roomId);
    }

    /** The floor and wall planes, their materials and the doorway: RoomEngine.initializeRoom(). */
    private buildRoomObject(room: IStageRoom): void
    {
        const object = room.instance.createRoomObject(ROOM_OBJECT_ID, 'room', RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM) as IRoomObjectController | null;

        if(object === null)
        {
            log.warn('The room object could not be created: no floor or walls');

            return;
        }

        const {data} = room;
        const planes = buildPlaneParser(data.floor, room.heights, data.wallHeight ?? 0, room.door);
        const model = object.getModelController();
        const handler = object.getEventHandler();

        // The bundle-backed data gives the planes their materials; the factory's has none.
        if(this._roomData !== null) (object.getVisualization() as IRoomObjectSpriteVisualization | null)?.initialize(this._roomData);

        model.setObject(RoomObjectVariableEnum.ROOM_PLANE_PARSER, planes);
        handler?.initialize(planes);
        handler?.processUpdateMessage(new RoomObjectRoomUpdateMessage(RoomObjectRoomUpdateMessage.ROOM_FLOOR_UPDATE, data.floorType ?? DEFAULT_FLOOR_TYPE));
        handler?.processUpdateMessage(new RoomObjectRoomUpdateMessage(RoomObjectRoomUpdateMessage.ROOM_WALL_UPDATE, data.wallType ?? DEFAULT_WALL_TYPE));
        handler?.processUpdateMessage(new RoomObjectRoomUpdateMessage(RoomObjectRoomUpdateMessage.ROOM_LANDSCAPE_UPDATE, data.landscapeType ?? DEFAULT_LANDSCAPE_TYPE));
        model.setNumber(RoomObjectVariableEnum.ROOM_FLOOR_HEIGHT, planes.floorHeight, true);
        model.setNumber(RoomObjectVariableEnum.ROOM_WALL_HEIGHT, planes.wallHeight, true);
        applyDoorMask(object, room.door);
    }

    /**
     * Location, direction and state, as the client sets them from its add/update messages. The
     * state goes to the logic in a data update, as the client does: the logic is what sets the
     * state and stamps the update time an animation restarts from.
     */
    private placeItem(room: IStageRoom, object: IRoomObjectController, item: IIsoFloorItem | IIsoWallItem): void
    {
        const model = object.getModelController();
        const state = Number.parseInt(item.state, 10);
        const stuffData = new LegacyStuffData();

        if('side' in item)
        {
            const side = item.side === 'Left' ? 'l' : 'r';

            object.setLocation(room.wallGeometry.getLocation(item.x, item.y, item.offsetX, item.offsetY, side));
            object.setDirection(new Vector3d(room.wallGeometry.getDirection(side), 0, 0));
            model.setNumber(RoomObjectVariableEnum.FURNITURE_COLOR, this._loader.getWallItemColorIndex(item.definition));
        }
        else
        {
            object.setLocation(new Vector3d(item.x, item.y, item.z));
            object.setDirection(new Vector3d((item.rotation % 8) * 45, 0, 0));
            model.setNumber(RoomObjectVariableEnum.FURNITURE_COLOR, this._loader.getActiveObjectColorIndex(item.definition), true);
        }

        model.setNumber(RoomObjectVariableEnum.FURNITURE_TYPE_ID, item.definition);
        stuffData.setString(item.state);
        object.getEventHandler()?.processUpdateMessage(new RoomObjectDataUpdateMessage(Number.isNaN(state) ? 0 : state, stuffData));
    }

    private typeOf(item: IIsoFloorItem | IIsoWallItem): string
    {
        return ('side' in item ? this._loader.getWallItemType(item.definition, item.state || null) : this._loader.getActiveObjectType(item.definition)) ?? item.class;
    }

    /** Waits for a type's bundle, or gives up after a while and draws its placeholder. */
    private async ensureContent(type: string): Promise<void>
    {
        if(this._settledContent.has(type)) return;

        if(!(this._loader.isLoaded(type) && this._loader.getGraphicAssetCollection(type) !== null))
        {
            const events = new EventEmitter();
            const arrival = new Promise<void>((resolve) =>
            {
                events.once(RoomContentLoadedEvent.CONTENT_LOAD_SUCCESS, () => resolve());
                events.once(RoomContentLoadedEvent.CONTENT_LOAD_FAILURE, () => resolve());
                events.once(RoomContentLoadedEvent.CONTENT_LOAD_CANCEL, () => resolve());
            });

            this._loader.loadObjectContent(type, events);
            await withTimeout(arrival, CONTENT_TIMEOUT_MS, `the content of "${type}" did not load`)
                .catch((error: Error) => log.warn(`${error.message}; drawn as a placeholder`));
            this.pump();
        }

        this._settledContent.add(type);
    }

    private pump(): void
    {
        this._manager.update(this._time);
    }

    private async pumpUntil(settled: Promise<void>): Promise<void>
    {
        let done = false;

        void settled.then(() => { done = true; });

        while(!done)
        {
            this.pump();
            await new Promise<void>(resolve => setTimeout(resolve, PUMP_INTERVAL_MS));
        }

        await settled;
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        for(const roomId of [...this._rooms.keys()]) this.disposeRoom(roomId);

        this._manager.dispose();
    }
}

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T>
{
    return new Promise<T>((resolve, reject) =>
    {
        const timer = setTimeout(() => reject(new Error(`${what} within ${ms} ms`)), ms);

        promise.then(
            (value) => { clearTimeout(timer); resolve(value); },
            (error: unknown) => { clearTimeout(timer); reject(error); }
        );
    });
}
