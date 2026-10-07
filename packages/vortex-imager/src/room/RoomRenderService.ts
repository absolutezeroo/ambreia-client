/**
 * Renders furniture and whole rooms out of the client's own room pipeline.
 *
 * Two routes, one mechanism. A furni preview is a room with a single object in it at the
 * origin; a room render is the same room with the plane object and every stored item added.
 * Both end in `render/composeSprites.ts`, which draws what the visualizations produced.
 *
 * The placement maths below is `RoomRenderingCanvas.renderObject()` and the room set-up is
 * `RoomEngine.initializeRoom()` / `addRoomObjectFurniture()` / `addRoomObjectWallItem()` —
 * cited at each step. Nothing here decides how a furni looks; that is the visualization's job,
 * and it is the client's class doing it.
 *
 * @see packages/vortex-engine/src/habbo/room/renderer/RoomRenderingCanvas.ts
 * @see packages/ambreia-game/src/room/RoomEngine.ts
 */
import {Logger} from '@ambreia/common/utils/Logger';
import {Vector3d} from '@ambreia/iso/utils/Vector3d';
import {RoomGeometry} from '@ambreia/iso/utils/RoomGeometry';
import type {IRoomObjectController} from '@ambreia/iso/object/IRoomObjectController';
import type {IRoomObjectSpriteVisualization} from '@ambreia/iso/object/visualization/IRoomObjectSpriteVisualization';
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import {RoomObjectVariableEnum} from '@ambreia/iso/scene/object/RoomObjectVariableEnum';
import {RoomPlaneParser} from '@ambreia/iso/scene/object/RoomPlaneParser';
import {LegacyWallGeometry} from '@ambreia/iso/scene/utils/LegacyWallGeometry';
import {RoomObjectRoomUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectRoomUpdateMessage';
import {RoomObjectRoomMaskUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectRoomMaskUpdateMessage';
import {RoomObjectDataUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectDataUpdateMessage';
import {LegacyStuffData} from '@ambreia/iso/scene/object/data/LegacyStuffData';
import {PetFigureData} from '@ambreia/avatar/pets/PetFigureData';
import type {RoomStack} from './RoomStack';
import type {IFurnitureRequest, IPetRequest, IRoomRequest, ImagerQuery} from './FurnitureRequest';
import {RoomNotFoundError, RoomRequestError} from './FurnitureRequest';
import type {IRoomItemRow, IRoomRow} from '../db/Database';
import {collectSprites, composeSprites} from '../render/composeSprites';
import type {ISpriteLayer} from '../render/composeSprites';
import {canvasToPng} from '../render/encode';

const log = Logger.getLogger('imager.room.RoomRenderService');

/**
 * `RoomEngine.getGenericRoomObjectImage()`'s geometry, verbatim: the isometric view every
 * catalog thumbnail and inventory icon in the client is rendered from. A furni preview that
 * used a different angle would not match the one beside it in the catalog.
 */
const PREVIEW_DIRECTION = new Vector3d(-135, 30, 0);
const PREVIEW_LOCATION = new Vector3d(11, 11, 5);

/**
 * `RoomRenderingCanvas`'s geometry. The fourth vector is the depth direction, and leaving it
 * off is not cosmetic — it is what sorts an object standing behind another behind it.
 */
const ROOM_DEPTH_DIRECTION = new Vector3d(-135, 0.5, 0);

/** `FloorHeightMapMessageParser.TILE_BLOCKED` — the height a hole in the model reads as. */
const TILE_BLOCKED = -110;

/**
 * The two door orientations `RoomMessageHandler.onFloorHeightMap()` detects, in the degrees it
 * records them as. There is no third: Habbo rooms only ever have their entrance cut into the
 * left or the back wall, since those are the only two a viewer can see through.
 */
const DOOR_DIR_LEFT = 90;
const DOOR_DIR_BACK = 180;

/** How many objects a single room render will build before it gives up. */
const MAX_ROOM_OBJECTS = 4_000;

/**
 * `FurnitureVisualization.UPDATE_INTERVAL` — the port's own animation cadence, ~24fps.
 *
 * It matters that a frame is a *time* step and not another call: `update()` returns early while
 * `time < _lastUpdateTime + 41`, so calling it repeatedly with the same time — which is what
 * `RoomEngine.getGenericRoomObjectImage()`'s `frameCount` loop does — advances nothing once the
 * first few calls have caught `_lastUpdateTime` up to it.
 */
const ANIMATION_FRAME_MS = 41;

export class RoomRenderService
{
    private _stack: RoomStack;
    private _sequence: number = 0;

    constructor(stack: RoomStack)
    {
        this._stack = stack;
    }

    /**
	 * Resolves what a furniture query is asking for.
	 *
	 * `class=` names the `.nitro` bundle directly and is what a tool that already read
	 * furnidata will send. `id=` is the furnidata sprite id, which is what the database stores
	 * and what every other Habbo imaging URL uses, so both are accepted and `class=` wins.
	 */
    resolveFurniture(query: ImagerQuery): { type: string; category: number; colorIndex: number } | null
    {
        const loader = this._stack.contentLoader;
        const className = readSingle(query, 'class');

        if(className !== null)
        {
            const floorId = loader.getActiveObjectTypeId(className);
            const wallId = loader.getWallItemTypeId(className);
            const wall = readSingle(query, 'wallitem') === '1' || floorId < 0 && wallId >= 0;
            const id = wall ? wallId : floorId;

            // A name in neither map is a name furnidata has never heard of. Rendering it anyway
            // is what the room does — `RoomManager.createRoomObject()` falls back to the
            // placeholder library — and it would answer a typo with a 200 and a grey box.
            if(id < 0)
            {
                throw new RoomNotFoundError(`No furni named "${className}" in furnidata`);
            }

            return {
                type: className,
                category: wall ? RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL : RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE,
                colorIndex: wall ? loader.getWallItemColorIndex(id) : loader.getActiveObjectColorIndex(id)
            };
        }

        const id = Number(readSingle(query, 'id'));

        if(!Number.isFinite(id)) return null;

        // Floor first: the two id spaces overlap, and a furnidata id that exists in both is far
        // more often a floor item. `wallitem=1` forces the other side.
        const forceWall = readSingle(query, 'wallitem') === '1';
        const floorType = forceWall ? null : loader.getActiveObjectType(id);

        if(floorType !== null)
        {
            return {
                type: floorType,
                category: RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE,
                colorIndex: loader.getActiveObjectColorIndex(id)
            };
        }

        const wallType = loader.getWallItemType(id, readSingle(query, 'extra'));

        if(wallType === null) throw new RoomNotFoundError(`No furni with sprite id ${id} in furnidata`);

        return {
            type: wallType,
            category: RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL,
            colorIndex: loader.getWallItemColorIndex(id)
        };
    }

    /**
	 * Renders one furni.
	 *
	 * Mirrors `RoomEngine.getGenericRoomObjectImage()` up to the point where that method hands
	 * the sprites to PixiJS: same model variables, same geometry, same `update()` sequence.
	 */
    async renderFurniture(request: IFurnitureRequest): Promise<Buffer>
    {
        return this.composeFurniture(request, async composite => canvasToPng(composite.canvas, request.zoom));
    }

    /**
	 * Where the furni's own position falls in the image `renderFurniture()` returns for the same
	 * request, in output pixels. That position is the centre of the furni's tile at its height, so
	 * an editor that draws the image there puts the furni where the room would.
	 */
    async furnitureAnchor(request: IFurnitureRequest): Promise<{ x: number; y: number; width: number; height: number }>
    {
        return this.composeFurniture(request, async composite =>
        {
            const zoom = request.zoom > 0 ? request.zoom : 1;

            return {
                x: Math.round(-composite.originX * zoom),
                y: Math.round(-composite.originY * zoom),
                width: Math.max(1, Math.round(composite.canvas.width * zoom)),
                height: Math.max(1, Math.round(composite.canvas.height * zoom))
            };
        });
    }

    private async composeFurniture<T>(
        request: IFurnitureRequest,
        finish: (composite: NonNullable<ReturnType<typeof composeSprites>>) => Promise<T>
    ): Promise<T>
    {
        const roomKey = this.nextRoomKey();

        try
        {
            const object = await this._stack.createObject(roomKey, 1, request.type, request.category);

            if(object === null)
            {
                throw new RoomRequestError(`No such furni: "${request.type}"`);
            }

            const model = object.getModelController();

            model.setNumber(RoomObjectVariableEnum.FURNITURE_COLOR, request.colorIndex);
            model.setString(RoomObjectVariableEnum.FURNITURE_EXTRAS, request.extra ?? '');

            object.setDirection(new Vector3d(request.direction, 0, 0));
            object.setState(request.state, 0);

            // Through the logic, and with real stuff data, for the same reason the room route
            // does it that way: `writeRoomObjectModel()` is what puts the state into
            // `furniture_data`, which is where a multi-state visualization reads it back.
            if(request.state > -1)
            {
                const stuffData = new LegacyStuffData();

                stuffData.setString(String(request.state));

                object.getEventHandler()?.processUpdateMessage(
                    new RoomObjectDataUpdateMessage(request.state, stuffData)
                );
            }

            const visualization = object.getVisualization() as IRoomObjectSpriteVisualization | null;

            if(visualization === null)
            {
                throw new RoomRequestError(`"${request.type}" has no visualization`);
            }

            const geometry = new RoomGeometry(request.scale, PREVIEW_DIRECTION, PREVIEW_LOCATION);

            advanceVisualization(visualization, geometry, request.frame);

            const layers = collectSprites(visualization, 0, 0, 0);
            const composite = composeSprites(layers, {backgroundColor: request.backgroundColor});

            geometry.dispose();

            if(composite === null)
            {
                throw new RoomRequestError(`"${request.type}" rendered nothing — no visible sprites`);
            }

            return await finish(composite);
        }
        finally
        {
            this._stack.disposeRoom(roomKey);
        }
    }

    /**
	 * Resolves what a pet query is asking for.
	 *
	 * `type=` is either the pet's own name (`dog`) or its numeric type id, which is what the
	 * wire and the `pets` table carry. Both are needed downstream and each gives the other:
	 * the content loader keys its bundles on the name, and the figure payload carries the id.
	 * The catalogue itself is the hotel's — `pet.configuration`, read by
	 * `RoomContentLoader.initPetData()` — so a name this hotel does not offer 404s here rather
	 * than downloading a bundle that is not there.
	 */
    resolvePet(query: ImagerQuery): { type: string; typeId: number } | null
    {
        const loader = this._stack.contentLoader;
        const raw = readSingle(query, 'type');

        if(raw === null) return null;

        if(/^\d+$/.test(raw))
        {
            const type = loader.getPetType(Number(raw));

            if(type === null) throw new RoomNotFoundError(`No pet with type id ${raw}`);

            return {type, typeId: Number(raw)};
        }

        const typeId = loader.getPetTypeId(raw);

        if(typeId < 0) throw new RoomNotFoundError(`No pet named "${raw}" in pet.configuration`);

        return {type: raw, typeId};
    }

    /**
	 * Renders one pet.
	 *
	 * `RoomEngine.getGenericRoomObjectImage()`'s category-100 branch, which is the one the
	 * catalog's pet previews go through: the figure payload is parsed back by the engine's own
	 * `PetFigureData`, its fields become model variables, and `AnimatedPetVisualization` reads
	 * them. Nothing here decides what a pet looks like.
	 *
	 * The one thing that is *not* a copy is the direction. `getPetImage()` is called with
	 * `new Vector3d(90)` by every widget — a pet preview is always shown from one angle — where
	 * this takes the same 0–7 `direction` the furniture and avatar routes take, times 45.
	 */
    async renderPet(request: IPetRequest): Promise<Buffer>
    {
        const roomKey = this.nextRoomKey();

        try
        {
            const object = await this._stack.createObject(
                roomKey,
                1,
                request.type,
                RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
            );

            if(object === null)
            {
                throw new RoomRequestError(`No such pet: "${request.type}"`);
            }

            const model = object.getModelController();
            const figure = new PetFigureData(request.figure);

            model.setNumber(RoomObjectVariableEnum.PET_PALETTE_INDEX, figure.paletteId);
            model.setNumber(RoomObjectVariableEnum.PET_COLOR, figure.color);
            model.setNumber(RoomObjectVariableEnum.HEAD_DIRECTION, request.headDirection);

            if(figure.headOnly) model.setNumber(RoomObjectVariableEnum.PET_HEAD_ONLY, 1);

            if(figure.customLayerIds.length > 0)
            {
                model.setNumberArray(RoomObjectVariableEnum.PET_CUSTOM_LAYER_IDS, figure.customLayerIds);
                model.setNumberArray(RoomObjectVariableEnum.PET_CUSTOM_PART_IDS, figure.customPartIds);
                model.setNumberArray(RoomObjectVariableEnum.PET_CUSTOM_PALETTE_IDS, figure.customPaletteIds);
            }

            if(request.posture !== null) model.setString(RoomObjectVariableEnum.AVATAR_POSTURE, request.posture);
            if(request.gesture !== null) model.setString(RoomObjectVariableEnum.AVATAR_GESTURE, request.gesture);

            object.setDirection(new Vector3d(request.direction, 0, 0));
            object.setState(-1, 0);

            const visualization = object.getVisualization() as IRoomObjectSpriteVisualization | null;

            if(visualization === null)
            {
                throw new RoomRequestError(`"${request.type}" has no visualization`);
            }

            const geometry = new RoomGeometry(request.scale, PREVIEW_DIRECTION, PREVIEW_LOCATION);

            advanceVisualization(visualization, geometry, request.frame);

            const layers = collectSprites(visualization, 0, 0, 0);
            const composite = composeSprites(layers, {backgroundColor: request.backgroundColor});

            geometry.dispose();

            if(composite === null)
            {
                throw new RoomRequestError(`"${request.type}" rendered nothing — no visible sprites`);
            }

            return await canvasToPng(composite.canvas, request.zoom);
        }
        finally
        {
            this._stack.disposeRoom(roomKey);
        }
    }

    /**
	 * Renders a whole room: the model's floor and walls, then every item standing on them.
	 *
	 * The canvas is sized to what was actually drawn rather than to a viewport, so a large room
	 * comes back large instead of cropped. That is the one thing this does differently from the
	 * client, which renders into a fixed canvas and pans a camera over it.
	 */
    async renderRoom(request: IRoomRequest, room: IRoomRow, items: IRoomItemRow[]): Promise<Buffer>
    {
        const roomKey = this.nextRoomKey();

        try
        {
            const tiles = parseModel(room.model);

            if(tiles.width === 0 || tiles.height === 0)
            {
                throw new RoomRequestError(`Room ${room.id} has an empty model`);
            }

            const door = detectDoor(tiles, room);
            const planeParser = this.buildPlaneParser(tiles, room, door);
            const wallGeometry = buildWallGeometry(tiles, room, request.scale);

            const geometry = new RoomGeometry(
                request.scale,
                PREVIEW_DIRECTION,
                new Vector3d(tiles.width / 2, tiles.height / 2, 0),
                ROOM_DEPTH_DIRECTION
            );

            applyDoorDisplacement(geometry, door);

            const layers: ISpriteLayer[] = [];
            const objects: IRoomObjectController[] = [];

            await this.addRoomPlanes(roomKey, room, request, planeParser, door, objects);

            if(request.furniture)
            {
                await this.addRoomItems(roomKey, items, wallGeometry, objects);
            }

            // Every object exists before anything is drawn, and one frame of the room runs over
            // all of them. `RoomInstance.update()` is what ticks each object's logic, and a logic
            // is what settles the object's own state — the sprites are only read afterwards. The
            // client gets this from its ticker sixty times a second; a single render needs it
            // exactly once, and it has to be after the last object is added.
            this._stack.pump();

            for(const object of objects) this.collectObject(object, geometry, layers, request.frame);

            const composite = composeSprites(layers, {backgroundColor: request.backgroundColor});

            geometry.dispose();
            planeParser.dispose();
            wallGeometry.dispose();

            if(composite === null)
            {
                throw new RoomRequestError(`Room ${room.id} rendered nothing`);
            }

            log.debug(`Room ${room.id}: ${layers.length} sprites, ${composite.canvas.width}x${composite.canvas.height}`);

            return await canvasToPng(composite.canvas, request.zoom);
        }
        finally
        {
            this._stack.disposeRoom(roomKey);
        }
    }

    /**
	 * Builds the room object — the floor and wall planes.
	 *
	 * Every step is `RoomEngine.initializeRoom()`: the parser goes on the model, the logic is
	 * initialized from it, and the three decoration ids arrive as update messages. Skipping the
	 * messages does not render an undecorated room — it renders planes with no material at all,
	 * which is to say nothing.
	 */
    private async addRoomPlanes(
        roomKey: string,
        room: IRoomRow,
        request: IRoomRequest,
        planeParser: RoomPlaneParser,
        door: IDoor | null,
        objects: IRoomObjectController[]
    ): Promise<void>
    {
        const object = await this._stack.createObject(roomKey, 0, 'room', RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM);

        if(object === null)
        {
            log.warn(`Room ${room.id}: could not create the room object — planes will be missing`);

            return;
        }

        const model = object.getModelController();
        const handler = object.getEventHandler();

        // Before anything else: this is what gives the floor and wall planes their materials.
        // `RoomManager.createRoomObject()` already initialized the visualization from the
        // factory's data, which has the layout but no textures; `RoomEngine` overrides it with
        // the bundle-backed one at exactly this point, and so does this.
        const roomData = this._stack.roomVisualizationData;

        if(roomData !== null)
        {
            (object.getVisualization() as IRoomObjectSpriteVisualization | null)?.initialize(roomData);
        }

        model.setObject(RoomObjectVariableEnum.ROOM_PLANE_PARSER, planeParser);
        handler?.initialize(planeParser);

        handler?.processUpdateMessage(
            new RoomObjectRoomUpdateMessage(
                RoomObjectRoomUpdateMessage.ROOM_FLOOR_UPDATE,
                request.floorType ?? room.floorType
            )
        );

        // `hide_walls` on the room row is the player's own "hide walls" setting, and `walls=0`
        // is the caller's. Either one hiding them wins.
        if(request.walls && !room.hideWalls)
        {
            handler?.processUpdateMessage(
                new RoomObjectRoomUpdateMessage(
                    RoomObjectRoomUpdateMessage.ROOM_WALL_UPDATE,
                    request.wallType ?? room.wallType
                )
            );
            handler?.processUpdateMessage(
                new RoomObjectRoomUpdateMessage(
                    RoomObjectRoomUpdateMessage.ROOM_LANDSCAPE_UPDATE,
                    request.landscapeType ?? room.landscapeType
                )
            );
        }

        model.setNumber(RoomObjectVariableEnum.ROOM_FLOOR_HEIGHT, planeParser.floorHeight, true);
        model.setNumber(RoomObjectVariableEnum.ROOM_WALL_HEIGHT, planeParser.wallHeight, true);

        this.applyDoorMask(object, door);

        objects.push(object);
    }

    /**
	 * Cuts the doorway out of the wall.
	 *
	 * `RoomEngine.initializeRoom()`, and every term of it matters. The mask goes at the door's
	 * *half-tile* position — `x + 0.5` for a door in the left wall, `y + 0.5` for one in the
	 * back wall — because that is where the wall plane is; an integer tile centre sits half a
	 * tile inside the room and matches no plane, so the mask is silently dropped and the
	 * doorway is walled over. What that looks like is not an obvious bug: the door tile's floor
	 * plane still draws, so the wall gets a floor-coloured square pasted onto it.
	 *
	 * The three `ROOM_DOOR_*` model variables take the offset back off again, which is AS3's
	 * own asymmetry: the mask wants the wall, the variables want the tile.
	 */
    private applyDoorMask(object: IRoomObjectController, door: IDoor | null): void
    {
        if(door === null) return;

        const model = object.getModelController();

        object.getEventHandler()?.processUpdateMessage(new RoomObjectRoomMaskUpdateMessage(
            RoomObjectRoomMaskUpdateMessage.ADD_MASK,
            'door_0',
            RoomObjectRoomMaskUpdateMessage.MASK_TYPE_DOOR,
            new Vector3d(door.x, door.y, door.z),
            RoomObjectRoomMaskUpdateMessage.MASK_CATEGORY_HOLE
        ));

        model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_X, door.dir === DOOR_DIR_LEFT ? door.x - 0.5 : door.x, true);
        model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_Y, door.dir === DOOR_DIR_BACK ? door.y - 0.5 : door.y, true);
        model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_Z, door.z, true);
        model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_DIR, door.dir, true);
    }

    /**
	 * Adds every stored item.
	 *
	 * Floor items sit on their tile; wall items go through `LegacyWallGeometry.getLocation()`,
	 * which is the same call `RoomMessageHandler` makes for the wire's `:w=x,y l=dx,dy r`
	 * string — the emulator stores that string's four numbers as columns, so it is rebuilt
	 * from them here rather than re-serialized and re-parsed.
	 */
    private async addRoomItems(
        roomKey: string,
        items: IRoomItemRow[],
        wallGeometry: LegacyWallGeometry,
        objects: IRoomObjectController[]
    ): Promise<void>
    {
        const loader = this._stack.contentLoader;

        for(const item of items)
        {
            if(objects.length >= MAX_ROOM_OBJECTS)
            {
                log.warn(`Stopped at ${MAX_ROOM_OBJECTS} objects; the rest of the room is not drawn`);

                return;
            }

            const wall = item.productType === 1;
            const stuff = parseStuffData(item.extraData);

            // A poster's variant number is its legacy string, not the JSON wrapper around it:
            // `getWallItemType()` appends it to `poster` to pick the bundle.
            const type = wall
                ? loader.getWallItemType(item.spriteId, stuff.legacy === '' ? null : stuff.legacy)
                : loader.getActiveObjectType(item.spriteId);

            if(type === null)
            {
                log.debug(`Item ${item.id}: sprite ${item.spriteId} is not in furnidata`);

                continue;
            }

            const category = wall ? RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL : RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE;
            const object = await this._stack.createObject(roomKey, item.id, type, category);

            if(object === null) continue;

            const location = wall
                ? wallGeometry.getLocation(item.x, item.y, item.wallOffset, item.z, item.direction === 4 ? 'l' : 'r')
                : new Vector3d(item.x, item.y, item.z);

            object.setLocation(location);
            object.setDirection(new Vector3d((item.direction % 8) * 45, 0, 0));

            const model = object.getModelController();

            model.setNumber(
                RoomObjectVariableEnum.FURNITURE_COLOR,
                wall ? loader.getWallItemColorIndex(item.spriteId) : loader.getActiveObjectColorIndex(item.spriteId),
                !wall
            );
            model.setNumber(RoomObjectVariableEnum.FURNITURE_TYPE_ID, item.spriteId);

            model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA, stuff.state);

            // The client's own sequence, and the whole of it: build the stuff data, then hand it
            // to the *logic* in a data-update message. The logic is what calls `setState()`, what
            // writes `furniture_data` from the legacy string, and what stamps
            // `furniture_state_update_time` — which `AnimatedFurnitureVisualization` reads to
            // decide whether to restart an animation. Setting the state directly on the object
            // instead, as this used to, skips all three: a lamp stayed off, a gate stayed shut,
            // and anything animated sat on its first frame.
            const stuffData = new LegacyStuffData();

            stuffData.setString(stuff.legacy);

            object.getEventHandler()?.processUpdateMessage(new RoomObjectDataUpdateMessage(stuff.state, stuffData));

            objects.push(object);
        }
    }

    /**
	 * Updates one object's visualization and appends its sprites, placed in room space.
	 *
	 * `RoomRenderingCanvas.renderObject()`, minus the viewport: the screen position is rounded
	 * the way `getCachedScreenLocation()` rounds it, and the `1.2e-7 * |x|` term that breaks
	 * depth ties between two objects at the same z is kept — without it, two items on the same
	 * tile row swap places depending on insertion order.
	 */
    private collectObject(
        object: IRoomObjectController,
        geometry: RoomGeometry,
        layers: ISpriteLayer[],
        frame: number = 0
    ): void
    {
        const visualization = object.getVisualization() as IRoomObjectSpriteVisualization | null;

        if(visualization === null) return;

        advanceVisualization(visualization, geometry, frame);

        const screen = geometry.getScreenPosition(object.getLocation());

        if(screen === null) return;

        const screenX = Math.round(screen.x);
        const screenY = Math.round(screen.y);
        const depth = screen.z + Math.abs(screen.x) * 1.2e-7;

        layers.push(...collectSprites(visualization, screenX, screenY, depth, layers.length));
    }

    /**
	 * Turns the model's tile heights into planes.
	 *
	 * `RoomMessageHandler.onFloorHeightMap()`, with the door coming from `room_models` instead
	 * of being detected from the neighbour pattern — the server already knows where it is. The
	 * two `setTileHeight()` calls around `initializeFromTileData()` are that method's, and they
	 * are not redundant: the first makes the door tile solid so a floor plane is generated
	 * under it, the second raises it by a wall's height so the doorway is cut through.
	 */
    private buildPlaneParser(tiles: ITileMap, room: IRoomRow, door: IDoor | null): RoomPlaneParser
    {
        const parser = new RoomPlaneParser();

        parser.reset();
        parser.initializeTileMap(tiles.width, tiles.height);

        for(let y = 0; y < tiles.height; y++)
        {
            for(let x = 0; x < tiles.width; x++) parser.setTileHeight(x, y, tiles.heights[y * tiles.width + x]);
        }

        if(door !== null) parser.setTileHeight(door.tileX, door.tileY, door.z);

        parser.initializeFromTileData(room.wallHeight, door === null ? undefined : {x: door.tileX, y: door.tileY});

        if(door !== null) parser.setTileHeight(door.tileX, door.tileY, door.z + parser.wallHeight);

        return parser;
    }

    dispose(): void
    {
        this._stack.dispose();
    }

    /** One room per request, so a render never sees the previous one's furniture. */
    private nextRoomKey(): string
    {
        this._sequence++;

        return `imager_${this._sequence}`;
    }
}

/**
 * Builds a visualization's sprite set and advances it `frame` animation frames.
 *
 * The first update at time 0 is what produces the sprites at all; each further one steps the
 * clock by {@link ANIMATION_FRAME_MS}, which is the only way an animation moves — see that
 * constant. A furni with no animation is unaffected by the extra passes.
 */
function advanceVisualization(
    visualization: IRoomObjectSpriteVisualization,
    geometry: RoomGeometry,
    frame: number
): void
{
    visualization.update(geometry, 0, true, false);

    for(let i = 1; i <= frame; i++) visualization.update(geometry, i * ANIMATION_FRAME_MS, true, false);
}

interface ITileMap
{
    width: number;
    height: number;

    /** Row-major, `TILE_BLOCKED` for a hole. */
    heights: number[];
}

/**
 * A detected doorway.
 *
 * `x`/`y` carry AS3's half-tile offset — the position of the *wall* the door is cut into, which
 * is what the mask and the depth displacement are keyed on. `tileX`/`tileY` are the floor tile
 * it stands on, which is what the plane parser wants.
 */
interface IDoor
{
    x: number;
    y: number;
    z: number;

    /** {@link DOOR_DIR_LEFT} or {@link DOOR_DIR_BACK}. */
    dir: number;

    tileX: number;
    tileY: number;
}

/**
 * Finds the doorway in the tile map.
 *
 * `RoomMessageHandler.onFloorHeightMap()`, verbatim down to the two neighbour patterns. The
 * server does not send a door: the client works it out from the shape of the map, an open tile
 * with three blocked neighbours, and the pattern that matches decides which wall it is cut into.
 *
 * `room_models.door_x`/`door_y` narrow the search to that one tile — exactly the role
 * `RoomEntryTileMessageParser` plays in the client — rather than replacing the detection, because
 * the *direction* is not in the database and is what the whole thing turns on.
 *
 * @see packages/ambreia-game/src/room/RoomMessageHandler.ts::onFloorHeightMap()
 */
function detectDoor(tiles: ITileMap, room: IRoomRow): IDoor | null
{
    const heightAt = (x: number, y: number): number =>
    {
        if(x < 0 || x >= tiles.width || y < 0 || y >= tiles.height) return TILE_BLOCKED;

        return tiles.heights[y * tiles.width + x];
    };

    for(let y = 0; y < tiles.height; y++)
    {
        for(let x = 0; x < tiles.width; x++)
        {
            const height = heightAt(x, y);

            // AS3's own guard: an edge tile in *both* axes cannot be a door.
            if(!(y > 0 && y < tiles.height - 1 || x > 0 && x < tiles.width - 1)) continue;

            if(height === TILE_BLOCKED) continue;

            if(x !== room.doorX || y !== room.doorY) continue;

            // Blocked above, left and below — a gap in the left wall, facing right.
            if(heightAt(x, y - 1) === TILE_BLOCKED
                && heightAt(x - 1, y) === TILE_BLOCKED
                && heightAt(x, y + 1) === TILE_BLOCKED)
            {
                return {x: x + 0.5, y, z: height, dir: DOOR_DIR_LEFT, tileX: x, tileY: y};
            }

            // Blocked above, left and right — a gap in the back wall, facing down.
            if(heightAt(x, y - 1) === TILE_BLOCKED
                && heightAt(x - 1, y) === TILE_BLOCKED
                && heightAt(x + 1, y) === TILE_BLOCKED)
            {
                return {x, y: y + 0.5, z: height, dir: DOOR_DIR_BACK, tileX: x, tileY: y};
            }
        }
    }

    log.debug(`No door found at (${room.doorX}, ${room.doorY}) for room ${room.id}`);

    return null;
}

/**
 * Pushes the door tile two thousand units away along its own axis.
 *
 * `RoomEngine.initializeRoom()`'s last door step, and the reason the doorway looks like a hole
 * rather than a patch: the door tile sits *outside* the wall, so without this it sorts in front
 * of it and is drawn over the wall it is supposed to be seen through.
 */
function applyDoorDisplacement(geometry: RoomGeometry, door: IDoor | null): void
{
    if(door === null) return;

    const position = new Vector3d(
        door.dir === DOOR_DIR_LEFT ? door.x - 0.5 : door.x,
        door.dir === DOOR_DIR_BACK ? door.y - 0.5 : door.y,
        door.z
    );

    geometry.setDisplacement(
        position,
        door.dir === DOOR_DIR_LEFT ? new Vector3d(-2000, 0, 0) : new Vector3d(0, -2000, 0)
    );
}

/**
 * Decodes a `room_models.model` string.
 *
 * Character mapping is `FloorHeightMapMessageParser.parse()`: `x` is a hole, everything else is
 * `parseInt(char, 36)` — so `0`–`9` are 0–9 and `a`–`z` continue at 10–35. Rows are padded to
 * the widest one with holes, which is what the emulator's own `CompileModelFromString()` does
 * with a short row.
 *
 * @see packages/ambreia-protocol/src/parser/room/engine/FloorHeightMapMessageParser.ts
 */
function parseModel(model: string): ITileMap
{
    const rows = model.trim().toLowerCase().replace(/\r\n/g, '\r').replace(/\n/g, '\r').split('\r')
        .map((row) => row.trim())
        .filter((row) => row.length > 0);

    const height = rows.length;
    const width = rows.reduce((widest, row) => Math.max(widest, row.length), 0);
    const heights: number[] = new Array(width * height).fill(TILE_BLOCKED);

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            const char = rows[y].charAt(x);

            if(char === '' || char === 'x') continue;

            const parsed = Number.parseInt(char, 36);

            heights[y * width + x] = Number.isNaN(parsed) ? TILE_BLOCKED : parsed;
        }
    }

    return {width, height, heights};
}

/**
 * The geometry wall items are positioned against.
 *
 * `RoomMessageHandler.onFloorHeightMap()` builds one of these beside the plane parser and fills
 * it with the same heights; `getLocation()` then turns a wall coordinate into a room one. The
 * scale has to be the render's, because the local offsets in a wall position are in pixels at
 * that scale.
 */
function buildWallGeometry(tiles: ITileMap, room: IRoomRow, scale: number): LegacyWallGeometry
{
    const geometry = new LegacyWallGeometry();

    geometry.initialize(tiles.width, tiles.height, room.wallHeight);
    geometry.scale = scale;

    for(let y = 0; y < tiles.height; y++)
    {
        for(let x = 0; x < tiles.width; x++) geometry.setTileHeight(x, y, tiles.heights[y * tiles.width + x]);
    }

    return geometry;
}

/**
 * Turns a stored `furniture.extra_data` into the legacy string and state the client would have
 * got off the wire.
 *
 * The emulator keeps an item's whole state as JSON — `{"stuff":{"Data":"1",…}}` for a normal
 * one, `{"wired":{…}}` for a wired box, `{}` for an item with nothing to say — and
 * `Logic.StuffData.GetSnapshot()` turns the `stuff.Data` half of that into the legacy string the
 * wire carries. `FurnitureDataParser.parseObjectData()` then reads the state back out of exactly
 * that string, defaulting to 0 when it is not a number, which is what `{}` and a wired box both
 * come to.
 *
 * Rows predating the JSON format store the bare string, so it is accepted too.
 */
function parseStuffData(extraData: string | null): { legacy: string; state: number }
{
    const raw = extraData === null ? '' : extraData.trim();
    let legacy = raw;

    if(raw.startsWith('{'))
    {
        legacy = '';

        try
        {
            const parsed = JSON.parse(raw) as { stuff?: { Data?: unknown } };
            const data = parsed.stuff?.Data;

            if(typeof data === 'string' || typeof data === 'number') legacy = String(data);
        }
        catch
        {
            // Not the JSON it looked like. The client would read an empty legacy string here
            // too, since the server could not have serialized this into stuff data either.
        }
    }

    const state = Number.parseFloat(legacy);

    return {legacy, state: Number.isNaN(state) ? 0 : Number.parseInt(legacy, 10)};
}

function readSingle(query: ImagerQuery, key: string): string | null
{
    const value = query[key];
    const single = Array.isArray(value) ? value[0] : value;

    return single === undefined || single === '' ? null : single;
}
