import {Rectangle, Graphics} from 'pixi.js';
import type {Container} from 'pixi.js';
import type {IVector3d} from '@ambreia/iso/utils/IVector3d';
import {Vector3d} from '@ambreia/iso/utils/Vector3d';
import type {IRoomEngine} from '../IRoomEngine';
import {RoomPlaneParser} from '@ambreia/iso/scene/object/RoomPlaneParser';
import {RoomId} from '@ambreia/iso/utils/RoomId';
import {RoomEngineEvent} from '@ambreia/iso/scene/events/RoomEngineEvent';
import {RoomEngineObjectEvent} from '@ambreia/iso/scene/events/RoomEngineObjectEvent';
import type {IGetImageListener} from '@ambreia/iso/scene/IGetImageListener';
import type {ImageResult} from '@ambreia/iso/scene/ImageResult';
import type {IStuffData} from '@ambreia/iso/scene/object/data/IStuffData';
import {LegacyStuffData} from '@ambreia/iso/scene/object/data/LegacyStuffData';
import type {IRoomObjectModelController} from '@ambreia/iso/object/IRoomObjectModelController';
import type {IRoomObjectController} from '@ambreia/iso/object/IRoomObjectController';
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import {RoomObjectVariableEnum} from '@ambreia/iso/scene/object/RoomObjectVariableEnum';
import type {IRoomObject} from '@ambreia/iso/object/IRoomObject';

interface IPoint
{
    x: number;
    y: number;
}

/**
 * Renders a small, isolated room used to preview a single furniture item,
 * wall item, pet or avatar outside of any real room the user is in.
 *
 * AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as
 *
 * TS notes:
 * - AS3 drives updatePreviewRoomView() from the engine's REOE_ADDED /
 *   REOE_CONTENT_UPDATED / REE_INITIALIZED events. The equivalent
 *   content-loaded event isn't fully available here, so the previewer also
 *   registers a per-frame canvas-sync callback (registerCanvasSyncCallback)
 *   to re-run the framing math, in addition to wiring the available engine
 *   events.
 * - The engine members this class needs — isInitialized, runUpdate,
 *   disableUpdate, changeObjectState, updateObjectUserAction,
 *   updateObjectWallItemLocation — were added to IRoomEngine on 2026-08-09;
 *   before that every call site here was a documented no-op.
 */
export class RoomPreviewer
{
    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::PREVIEW_CANVAS_ID
    private static readonly PREVIEW_CANVAS_ID: number = 1;
    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::PREVIEW_OBJECT_ID
    private static readonly PREVIEW_OBJECT_ID: number = 1;

    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::addAvatarIntoRoom()
    // Name DERIVED: the 135 AS3 passes as the head direction.
    private static readonly PREVIEW_HEAD_DIRECTION: number = 135;

    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::addAvatarIntoRoom()
    // Name DERIVED: the 1 AS3 passes as the user type — a plain user, not a pet or a bot.
    private static readonly PREVIEW_USER_TYPE: number = 1;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::PREVIEW_OBJECT_LOCATION_X
    private static readonly PREVIEW_OBJECT_LOCATION_X: number = 2;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::PREVIEW_OBJECT_LOCATION_Y
    private static readonly PREVIEW_OBJECT_LOCATION_Y: number = 2;
    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::PREVIEW_WALL_ITEM_DEFAULT_DIRECTION
    private static readonly PREVIEW_WALL_ITEM_DEFAULT_DIRECTION: number = 90;

    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::PREVIEW_WALL_ITEM_MIRRORED_DIRECTION
    private static readonly PREVIEW_WALL_ITEM_MIRRORED_DIRECTION: number = 180;

    /**
     * The x/y pair is deliberately asymmetric: mirroring the item swaps them, which is how one
     * constant serves both walls of the preview room's corner.
     */
    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::PREVIEW_WALL_ITEM_LOCATION
    private static readonly PREVIEW_WALL_ITEM_LOCATION = {x: 0.5, y: 2.3, z: 1.8};

    /**
     * AS3 inlines this as a bare `3.6` in getPreviewWallItemZ() — the preview room's wall height,
     * against which a wall item is vertically centred. Name DERIVED; the literal is unnamed in AS3.
     */
    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::getPreviewWallItemZ()
    private static readonly PREVIEW_WALL_HEIGHT: number = 3.6;

    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::ALLOWED_IMAGE_CUT
    private static readonly ALLOWED_IMAGE_CUT: number = 0.25;

    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::SCALE_NORMAL
    public static readonly SCALE_NORMAL: number = 64;
    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::SCALE_SMALL
    public static readonly SCALE_SMALL: number = 32;

    // AS3: .../src/com/sulake/habbo/room/preview/RoomPreviewer.as::AUTOMATIC_STATE_CHANGE_INTERVAL
    private static readonly AUTOMATIC_STATE_CHANGE_INTERVAL: number = 2500;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::_roomEngine
    private _roomEngine: IRoomEngine | null;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::var_68
    private _previewRoomId: number = 1;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::var_1699
    private _currentPreviewObjectType: number = 0;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::var_399
    private _currentPreviewObjectCategory: number = 0;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::var_1908
    private _currentPreviewObjectData: string = '';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::_currentPreviewRectangle
    private _currentPreviewRectangle: Rectangle | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::_currentPreviewCanvasWidth
    private _currentPreviewCanvasWidth: number = 0;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::var_1478
    private _currentPreviewCanvasHeight: number = 0;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::var_510
    private _currentPreviewScale: number = 64;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::var_1596
    private _zoomChanged: boolean = false;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::var_1259
    private _automaticStateChange: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::_previousAutomaticStateChangeTime
    private _previousAutomaticStateChangeTime: number = 0;
    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::_addViewOffset
    private _addViewOffset: IPoint = {x: 0, y: 0};
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::_disableUpdate
    private _disableUpdate: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::_centerWallItems
    private _centerWallItems: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::set centerWallItems()
    set centerWallItems(value: boolean)
    {
        this._centerWallItems = value;
    }

    // TS-only: AS3 renders this preview onto the same unified Flash display
    // list as the surrounding window chrome, so wherever the room scene has
    // no geometry, the inventory window's own background naturally shows
    // through underneath. Here the room preview is a separate PixiJS canvas
    // layered as a DisplayObject behind a "hole" punched in the UI canvas
    // (see WindowComposite.ts's clearRect for WindowType.DISPLAY_OBJECT_WRAPPER)
    // — so an area with no room geometry has nothing to fall back to and
    // shows through to whatever is behind the browser page entirely. Paint a
    // flat fill matching the classic inventory body colour behind the scene
    // so growth of the preview area (a legitimate stretch — see
    // RoomPreviewerWidget.ts) reveals this colour instead of see-through.
    private static readonly PREVIEW_BACKGROUND_COLOR = 0xeceae0;
    private _backgroundFill: Graphics | null = null;

    // Re-entrancy guard: the ported engine re-emits REE_INITIALIZED from
    // initializeRoomVisuals() (which updateObjectRoom() maps onto), so without
    // this flag onRoomInitialized() → updateObjectRoom() would recurse forever.
    private _updatingObjectRoom: boolean = false;

    private readonly updatePreviewRoomViewBound = (): void => this.updatePreviewRoomView();
    private readonly onRoomObjectAddedBound = (event: RoomEngineObjectEvent): void =>
        this.onRoomObjectAdded(event.roomId, event.objectId, event.category);

    private readonly onRoomInitializedBound = (event: RoomEngineEvent): void => this.onRoomInitialized(event);

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::RoomPreviewer()
    constructor(roomEngine: IRoomEngine, previewRoomId: number = 1)
    {
        this._roomEngine = roomEngine;
        this._previewRoomId = RoomId.makeRoomPreviewerId(previewRoomId);

        if(this._roomEngine)
        {
            // AS3 listens to "REOE_ADDED"/"REOE_CONTENT_UPDATED"; the ported engine
            // surfaces object placement through REOE_ADDED.
            this._roomEngine.events.on(RoomEngineObjectEvent.REOE_ADDED, this.onRoomObjectAddedBound);
            this._roomEngine.events.on(RoomEngineEvent.REE_INITIALIZED, this.onRoomInitializedBound);

            // TS deviation (see class doc comment): re-run the framing math every
            // frame because the AS3 content-loaded event isn't fully available.
            this._roomEngine.registerCanvasSyncCallback(this.updatePreviewRoomViewBound);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::get previewRoomId()
    get previewRoomId(): number
    {
        return this._previewRoomId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::get isRoomEngineReady()
    get isRoomEngineReady(): boolean
    {
        return this._roomEngine !== null && this._roomEngine.isInitialized;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::createRoomForPreviews()
    createRoomForPreviews(): void
    {
        if(!this._roomEngine) return;

        const size = 7;
        const parser = new RoomPlaneParser();

        parser.initializeTileMap(size + 2, size + 2);

        for(let y = 1; y < 1 + size; y++)
        {
            for(let x = 1; x < 1 + size; x++)
            {
                parser.setTileHeight(x, y, 0);
            }
        }

        parser.initializeFromTileData();
        this._roomEngine.initializeRoom(this._previewRoomId, parser);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::reset()
    reset(disposing: boolean): void
    {
        if(this._roomEngine)
        {
            this._roomEngine.disposeObjectFurniture(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID);
            this._roomEngine.disposeObjectWallItem(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID);
            this._roomEngine.disposeObjectUser(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID);

            if(!disposing)
            {
                this.updatePreviewRoomView();
            }
        }

        this._currentPreviewObjectCategory = -2;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::addFurnitureIntoRoom()
    addFurnitureIntoRoom(type: number, direction: IVector3d, stuffData: IStuffData | null = null, extra: string | null = null): number
    {
        const data: IStuffData = stuffData ?? new LegacyStuffData();

        if(this.isRoomEngineReady)
        {
            if(this._currentPreviewObjectCategory === 10 && this._currentPreviewObjectType === type)
            {
                return 1;
            }

            this.reset(false);
            this._currentPreviewObjectType = type;
            this._currentPreviewObjectCategory = 10;
            this._currentPreviewObjectData = '';

            // AS3 passes the full IStuffData (param7) straight through to addObjectFurniture()
            // and an empty string ("") for the separate `extra` field (param12) - this port was
            // previously collapsing the real stuff data down to `getLegacyString()` and stuffing
            // it into the `extra` slot instead, which loses everything but format-0's single
            // string (e.g. a guild's groupId/badgeCode/colors array never survived past index 0).
            if(this._roomEngine!.addRoomObjectFurniture(
                this._previewRoomId,
                RoomPreviewer.PREVIEW_OBJECT_ID,
                type,
                new Vector3d(RoomPreviewer.PREVIEW_OBJECT_LOCATION_X, RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y, 0),
                direction,
                0,
                '',
                Number.NaN,
                -1,
                0,
                '',
                true,
                data,
                // AS3 passes `false` for `realRoomObject` from both preview call sites: a previewed
                // item must not behave like one placed in a room (no dimmer dialog, no jukebox
                // playlist, no crackable click) — see `RoomEngine.addRoomObjectFurniture()`.
                false
            ))
            {
                this._previousAutomaticStateChangeTime = RoomPreviewer.getTimer();
                this._automaticStateChange = true;

                const object = this._roomEngine!.getRoomObject(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);

                if(object)
                {
                    if(extra !== null)
                    {
                        (object.getModel() as IRoomObjectModelController).setString('furniture_extras', extra);
                    }
                }

                this.updatePreviewRoomView();
            }
        }

        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::addWallItemIntoRoom()
    addWallItemIntoRoom(type: number, direction: IVector3d, legacyString: string): number
    {
        if(this.isRoomEngineReady)
        {
            if(this._currentPreviewObjectCategory === 20 && this._currentPreviewObjectType === type && this._currentPreviewObjectData === legacyString)
            {
                return 1;
            }

            this.reset(false);
            this._currentPreviewObjectType = type;
            this._currentPreviewObjectCategory = 20;
            this._currentPreviewObjectData = legacyString;

            if(this._roomEngine!.addRoomObjectWallItem(
                this._previewRoomId,
                RoomPreviewer.PREVIEW_OBJECT_ID,
                type,
                new Vector3d(0.5, 2.3, 1.8),
                direction,
                0,
                legacyString,
                Number.NaN,
                -1,
                0,
                '',
                false
            ))
            {
                this._previousAutomaticStateChangeTime = RoomPreviewer.getTimer();
                this._automaticStateChange = true;

                // AS3 marks the preview wall item's invisible layer so its "invisible"
                // sprite is hidden (see FurnitureVisualization furniture_invisible_layer).
                const object = this._roomEngine!.getRoomObject(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);

                if(object !== null)
                {
                    this.applyInvisibleLayerState(object);
                }

                return 1;
            }
        }

        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::applyInvisibleLayerState()
    private applyInvisibleLayerState(object: IRoomObject | null): void
    {
        if(object === null || this._roomEngine === null)
        {
            return;
        }

        const model = object.getModel() as IRoomObjectModelController | null;

        if(model === null)
        {
            return;
        }

        model.setNumber('furniture_invisible_layer', 1);
    }

    /**
     * A single-direction furni cannot be turned, which is what greys the rotate button out. The
     * direction set comes off the object's own model — `furniture_allowed_directions`, written when
     * the furni's visualization data is applied — not from the engine.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::canRotatePreviewFurniture()
    canRotatePreviewFurniture(): boolean
    {
        const directions = this.getPreviewFurnitureAllowedDirections();

        return directions !== null && directions.length > 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::rotatePreviewFurniture()
    rotatePreviewFurniture(clockwise: boolean): boolean
    {
        const object = this.getPreviewFurnitureObject();

        if(object === null) return false;

        const direction = this.getValidPreviewFurnitureDirection(object, clockwise);

        // Nothing to do when the set has a single entry: the "next" direction is the current one.
        if(direction === object.getDirection().x) return false;

        object.setDirection(new Vector3d(direction));

        // `true` forces the view update through even when `disableUpdate` is set — the user asked
        // for this one.
        this.updatePreviewRoomView(true);
        this.updateRoomEngine();

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::canRotatePreviewWallItem()
    canRotatePreviewWallItem(): boolean
    {
        return this.getPreviewWallItemObject() !== null;
    }

    /**
     * A wall item has only two orientations — the left wall (90°) and the right one (180°) — so
     * this flips rather than steps. The location has to move with it, because the preview room's
     * two walls meet at a corner.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::rotatePreviewWallItem()
    rotatePreviewWallItem(): boolean
    {
        const object = this.getPreviewWallItemObject();

        if(object === null) return false;

        const direction = RoomPreviewer.isPreviewWallItemMirrored(object.getDirection().x)
            ? RoomPreviewer.PREVIEW_WALL_ITEM_DEFAULT_DIRECTION
            : RoomPreviewer.PREVIEW_WALL_ITEM_MIRRORED_DIRECTION;

        object.setDirection(new Vector3d(direction));

        this.updatePreviewWallItemLocation(object);

        // The framing rectangle is rebuilt from scratch: the item just moved across the corner, so
        // the accumulated bounds no longer describe it.
        this._currentPreviewRectangle = null;

        this.updatePreviewRoomView(true);
        this.updateRoomEngine();

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getPreviewFurnitureObject()
    private getPreviewFurnitureObject(): IRoomObjectController | null
    {
        if(!this.isRoomEngineReady || this._currentPreviewObjectCategory !== RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
        {
            return null;
        }

        return this._roomEngine!.getRoomObject(
            this._previewRoomId,
            RoomPreviewer.PREVIEW_OBJECT_ID,
            this._currentPreviewObjectCategory
        ) as IRoomObjectController | null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getPreviewFurnitureAllowedDirections()
    private getPreviewFurnitureAllowedDirections(): readonly number[] | null
    {
        const object = this.getPreviewFurnitureObject();

        if(object === null || object.getModel() === null) return null;

        return object.getModel().getNumberArray(RoomObjectVariableEnum.FURNITURE_ALLOWED_DIRECTIONS);
    }

    /**
     * Steps one place through the allowed-direction set. When the current direction is not in the
     * set at all — a furni whose data changed under it — AS3 does not fall back to index 0: it
     * finds where the current direction *would* sort, so the turn still goes the way the user
     * expects. That search is preserved verbatim, modulo included.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getValidPreviewFurnitureDirection()
    private getValidPreviewFurnitureDirection(object: IRoomObjectController | null, clockwise: boolean): number
    {
        if(object === null || object.getModel() === null) return 0;

        const directions = object.getModel().getNumberArray(RoomObjectVariableEnum.FURNITURE_ALLOWED_DIRECTIONS);
        let direction = object.getDirection().x;

        if(directions === null || directions.length === 0) return direction;

        let index = directions.indexOf(direction);

        if(index < 0)
        {
            index = 0;

            for(const allowed of directions)
            {
                if(direction <= allowed) break;

                index++;
            }

            index %= directions.length;
        }

        index = clockwise
            ? (index + 1) % directions.length
            : (index - 1 + directions.length) % directions.length;

        direction = directions[index];

        return direction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getPreviewWallItemObject()
    private getPreviewWallItemObject(): IRoomObjectController | null
    {
        if(!this.isRoomEngineReady || this._currentPreviewObjectCategory !== RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            return null;
        }

        return this._roomEngine!.getRoomObject(
            this._previewRoomId,
            RoomPreviewer.PREVIEW_OBJECT_ID,
            this._currentPreviewObjectCategory
        ) as IRoomObjectController | null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::isPreviewWallItemMirrored()
    private static isPreviewWallItemMirrored(direction: number): boolean
    {
        // The double modulo normalises a negative direction; JS `%` keeps the sign, as AS3's did.
        return ((direction % 360) + 360) % 360 === RoomPreviewer.PREVIEW_WALL_ITEM_MIRRORED_DIRECTION;
    }

    /**
     * Swaps the x/y of the fixed preview location when mirrored — the two walls are symmetric about
     * the corner, so the same pair of numbers describes both, exchanged.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updatePreviewWallItemLocation()
    private updatePreviewWallItemLocation(object: IRoomObjectController | null): void
    {
        if(object === null || this._roomEngine === null) return;

        const mirrored = RoomPreviewer.isPreviewWallItemMirrored(object.getDirection().x);
        const x = mirrored ? RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.y : RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.x;
        const y = mirrored ? RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.x : RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.y;

        this._roomEngine.updateObjectWallItemLocation(
            this._previewRoomId,
            RoomPreviewer.PREVIEW_OBJECT_ID,
            new Vector3d(x, y, RoomPreviewer.getPreviewWallItemZ(object))
        );
    }

    /**
     * Centres the item vertically on a 3.6-unit wall using its own height and centre offset.
     *
     * AS3's fallback branch here is decompilation damage — `!isNaN(null.z)` / `return null.z`,
     * which would throw. The intent is plainly the object's own location z, so that is what this
     * does; the final fallback is the fixed preview z, as in AS3.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getPreviewWallItemZ()
    private static getPreviewWallItemZ(object: IRoomObjectController | null): number
    {
        if(object !== null && object.getModel() !== null)
        {
            const sizeZ = object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_Z);
            const centerZ = object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_CENTER_Z);

            if(!isNaN(sizeZ) && !isNaN(centerZ))
            {
                return (RoomPreviewer.PREVIEW_WALL_HEIGHT - sizeZ) / 2 + centerZ;
            }
        }

        const location = object?.getLocation() ?? null;

        if(location !== null && !isNaN(location.z)) return location.z;

        return RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.z;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::addAvatarIntoRoom()
    // DEVIATION: AS3 also takes the effect to wear; the RPG has no avatar effects (M1d §6.2).
    addAvatarIntoRoom(figure: string): number
    {
        if(this.isRoomEngineReady)
        {
            this.reset(false);
            this._currentPreviewObjectType = 1;
            this._currentPreviewObjectCategory = 100;
            this._currentPreviewObjectData = figure;

            // AS3: `addObjectUser(roomId, 1, Vector3d(2,2,0), Vector3d(90,0,0), 135, 1, figure)`.
            //
            // This used to call `addRoomObjectUser()` with the **figure** in its `type` parameter.
            // That parameter is the object *type* — it picks the logic and the visualization — so
            // the preview created an object typed `hd-180-1.ch-…`, which resolves to neither, and
            // no avatar was ever built. `addObjectUser()` is the AS3-shaped call: it takes the user
            // type and the figure separately and delivers the figure through the object's own
            // update message.
            if(this._roomEngine!.addObjectUser(
                this._previewRoomId,
                RoomPreviewer.PREVIEW_OBJECT_ID,
                new Vector3d(RoomPreviewer.PREVIEW_OBJECT_LOCATION_X, RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y, 0),
                new Vector3d(90, 0, 0),
                RoomPreviewer.PREVIEW_HEAD_DIRECTION,
                RoomPreviewer.PREVIEW_USER_TYPE,
                figure
            ))
            {
                this._previousAutomaticStateChangeTime = RoomPreviewer.getTimer();
                this._automaticStateChange = true;
                this.updateUserGesture(1);
                this.updateUserPosture('std');
            }

            this.updatePreviewRoomView();

            return 1;
        }

        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updateUserPosture()
    updateUserPosture(posture: string, parameter: string = ''): void
    {
        if(this.isRoomEngineReady)
        {
            this._roomEngine!.updateRoomObjectUserPosture(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, posture, parameter);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updateUserGesture()
    updateUserGesture(gesture: number): void
    {
        if(this.isRoomEngineReady)
        {
            this._roomEngine!.updateRoomObjectUserGesture(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, gesture);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updateObjectUserFigure()
    updateObjectUserFigure(figure: string, gender: string | null = null, isRiding: boolean = false): boolean
    {
        if(this.isRoomEngineReady)
        {
            return this._roomEngine!.updateRoomObjectUserFigure(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, figure, gender, isRiding);
        }

        return false;
    }

    /**
          * AS3 passes a fifth `parameter` argument through to the engine
     * (`updateObjectUserAction(roomId, id, action, value, parameter)`); this port's engine method
     * stops at four, so the parameter is accepted for signature parity and dropped. Nothing is
     * lost: no caller in the whole primary tree passes it, the one branch that would use it feeds
     * `RoomObjectAvatarCarryObjectUpdateMessage.itemName`, and no AvatarLogic — nor anything else
     * under `habbo/room/` — ever reads that field.
     */
    // DEVIATION: the fifth argument is accepted and dropped, for the reason set out just above —
    //   checked, not assumed: no caller in the primary tree passes it and nothing reads the field
    //   it would feed. The marker is what tells `--unused-params` this one is answered.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updateObjectUserAction()
    updateObjectUserAction(action: string, value: number, _parameter: string | null = null): void
    {
        if(this.isRoomEngineReady)
        {
            this._roomEngine!.updateObjectUserAction(
                this._previewRoomId,
                RoomPreviewer.PREVIEW_OBJECT_ID,
                action,
                value
            );
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updateAvatarDirectionAndLocation()
    updateAvatarDirectionAndLocation(bodyDirection: number, headDirection: number, location: IVector3d | null = null): void
    {
        if(this.isRoomEngineReady)
        {
            const target = location ?? new Vector3d(RoomPreviewer.PREVIEW_OBJECT_LOCATION_X, RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y, 0);

            this._roomEngine!.updateRoomObjectUser(
                this._previewRoomId,
                RoomPreviewer.PREVIEW_OBJECT_ID,
                target,
                target,
                new Vector3d(bodyDirection * 45, 0, 0),
                headDirection * 45,
                false,
                0
            );
        }
    }

    /**
     * A manual state change also stops the automatic cycling: once the user has clicked, the
     * preview stays on the state they chose.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::changeRoomObjectState()
    changeRoomObjectState(): void
    {
        if(this.isRoomEngineReady)
        {
            this._automaticStateChange = false;

            // An avatar has no state to cycle.
            if(this._currentPreviewObjectCategory !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
            {
                this._roomEngine!.changeObjectState(
                    this._previewRoomId,
                    RoomPreviewer.PREVIEW_OBJECT_ID,
                    this._currentPreviewObjectCategory
                );
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::checkAutomaticRoomObjectStateChange()
    private checkAutomaticRoomObjectStateChange(): void
    {
        if(this._automaticStateChange)
        {
            const now = RoomPreviewer.getTimer();
            if(now > this._previousAutomaticStateChangeTime + RoomPreviewer.AUTOMATIC_STATE_CHANGE_INTERVAL)
            {
                this._previousAutomaticStateChangeTime = now;

                if(this.isRoomEngineReady)
                {
                    // Note AS3 does *not* exempt the avatar category here, unlike
                    // changeRoomObjectState() above. Preserved.
                    this._roomEngine!.changeObjectState(
                        this._previewRoomId,
                        RoomPreviewer.PREVIEW_OBJECT_ID,
                        this._currentPreviewObjectCategory
                    );
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getRoomCanvas()
    getRoomCanvas(width: number, height: number): Container | null
    {
        if(this._roomEngine)
        {
            const canvas = this._roomEngine.createRoomCanvas(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, width, height, this._currentPreviewScale);

            this._roomEngine.setRoomCanvasMask(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, true);

            const geometry = this._roomEngine.getRoomCanvasGeometry(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);
            if(geometry !== null)
            {
                geometry.adjustLocation(new Vector3d(2, 2, 0), 30);
            }

            this._currentPreviewCanvasWidth = width;
            this._currentPreviewCanvasHeight = height;

            if(canvas)
            {
                this._backgroundFill = new Graphics();
                this.redrawBackgroundFill(width, height);
                canvas.addChildAt(this._backgroundFill, 0);
            }

            return canvas;
        }

        return null;
    }

    private redrawBackgroundFill(width: number, height: number): void
    {
        if(!this._backgroundFill) return;

        this._backgroundFill
            .clear()
            .rect(0, 0, Math.max(1, width), Math.max(1, height))
            .fill(RoomPreviewer.PREVIEW_BACKGROUND_COLOR);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::modifyRoomCanvas()
    modifyRoomCanvas(width: number, height: number): void
    {
        if(this._roomEngine)
        {
            this._currentPreviewCanvasWidth = width;
            this._currentPreviewCanvasHeight = height;
            this._roomEngine.modifyRoomCanvas(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, width, height);
            this.redrawBackgroundFill(width, height);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::set addViewOffset()
    set addViewOffset(value: IPoint)
    {
        this._addViewOffset = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::get addViewOffset()
    get addViewOffset(): IPoint
    {
        return this._addViewOffset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updatePreviewObjectBoundingRectangle()
    private updatePreviewObjectBoundingRectangle(offset: IPoint | null): void
    {
        const source = this._roomEngine!.getRoomObjectBoundingRectangle(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory, RoomPreviewer.PREVIEW_CANVAS_ID);

        if(source !== null && offset !== null)
        {
            const rectangle = new Rectangle(source.left, source.top, source.width, source.height);

            rectangle.x += -(this._currentPreviewCanvasWidth >> 1) - offset.x;
            rectangle.y += -(this._currentPreviewCanvasHeight >> 1) - offset.y;

            if(this._currentPreviewRectangle === null)
            {
                this._currentPreviewRectangle = rectangle;
            }
            else
            {
                const current = this._currentPreviewRectangle;
                const union = current.clone();
                union.enlarge(rectangle);

                if(union.width - current.width > (this._currentPreviewCanvasWidth - current.width) >> 1
					|| union.height - current.height > (this._currentPreviewCanvasHeight - current.height) >> 1
					|| current.width < 1
					|| current.height < 1)
                {
                    this._currentPreviewRectangle = union;
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::validatePreviewSize()
    private validatePreviewSize(point: IPoint): IPoint
    {
        const rectangle = this._currentPreviewRectangle;

        if(rectangle === null || rectangle.width < 1 || rectangle.height < 1)
        {
            return point;
        }

        if(this.isRoomEngineReady)
        {
            const geometry = this._roomEngine!.getRoomCanvasGeometry(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);
            const maxWidth = this._currentPreviewCanvasWidth * (1 + RoomPreviewer.ALLOWED_IMAGE_CUT);
            const maxHeight = this._currentPreviewCanvasHeight * (1 + RoomPreviewer.ALLOWED_IMAGE_CUT);

            if(rectangle.width > maxWidth || rectangle.height > maxHeight)
            {
                if(this.isZoomEnabled())
                {
                    if(this._roomEngine!.getRoomCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID) !== 0.5)
                    {
                        this._roomEngine!.setRoomCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, 0.5);
                        this._currentPreviewScale = 32;
                        this._zoomChanged = true;
                        point.x >>= 1;
                        point.y >>= 1;
                        RoomPreviewer.dividePreviewRectangleByFour(rectangle);
                    }
                }
                else if(geometry !== null && geometry.isZoomedIn())
                {
                    geometry.performZoomOut();
                    this._currentPreviewScale = 32;
                    this._zoomChanged = true;
                    point.x >>= 1;
                    point.y >>= 1;
                    RoomPreviewer.dividePreviewRectangleByFour(rectangle);
                }
            }
            else if((rectangle.width << 1) < maxWidth - 5 && (rectangle.height << 1) < maxHeight - 5)
            {
                if(this.isZoomEnabled())
                {
                    if(this._roomEngine!.getRoomCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID) !== 1 && !this._zoomChanged)
                    {
                        this._roomEngine!.setRoomCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, 1);
                        this._currentPreviewScale = 64;
                        point.x <<= 1;
                        point.y <<= 1;
                    }
                }
                else if(geometry !== null && !geometry.isZoomedIn() && !this._zoomChanged)
                {
                    geometry.performZoomIn();
                    this._currentPreviewScale = 64;
                    point.x <<= 1;
                    point.y <<= 1;
                }
            }
        }

        return point;
    }

    // AS3 counterpart: the ">>= 2" applied to every edge of _currentPreviewRectangle
    // in validatePreviewSize() (divides each edge by four).
    private static dividePreviewRectangleByFour(rectangle: Rectangle): void
    {
        const left = rectangle.left >> 2;
        const right = rectangle.right >> 2;
        const top = rectangle.top >> 2;
        const bottom = rectangle.bottom >> 2;

        rectangle.x = left;
        rectangle.y = top;
        rectangle.width = right - left;
        rectangle.height = bottom - top;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::zoomIn()
    zoomIn(): void
    {
        if(this.isRoomEngineReady)
        {
            if(this.isZoomEnabled())
            {
                this._roomEngine!.setRoomCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, 1);
            }

            const geometry = this._roomEngine!.getRoomCanvasGeometry(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);
            if(!geometry)
            {
                return;
            }

            geometry.performZoomIn();
        }

        this._currentPreviewScale = 64;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::zoomOut()
    zoomOut(): void
    {
        if(this.isRoomEngineReady)
        {
            if(this.isZoomEnabled())
            {
                this._roomEngine!.setRoomCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, 0.5);
            }
            else
            {
                const geometry = this._roomEngine!.getRoomCanvasGeometry(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);
                if(!geometry)
                {
                    return;
                }

                geometry.performZoomOut();
            }
        }

        this._currentPreviewScale = 32;
    }

    // AS3: sources/win63_version/habbo/room/preview/RoomPreviewer.as::updateAvatarDirection()
    updateAvatarDirection(direction: number, headDirection: number): void
    {
        if(this.isRoomEngineReady)
        {
            this._roomEngine!.updateRoomObjectUser(
                this._previewRoomId,
                RoomPreviewer.PREVIEW_OBJECT_ID,
                new Vector3d(2, 2, 0),
                new Vector3d(2, 2, 0),
                new Vector3d(direction * 45, 0, 0),
                headDirection * 45,
                false,
                0
            );
        }
    }

    /**
     * Note the last argument is dropped, exactly as AS3 does: the parameter is declared but the
     * call below hard-codes `false`, so a caller asking to skip the model update does not get it.
     * Preserved rather than "fixed".
     *
     * The `_updatingObjectRoom` re-entrancy guard is a leftover from when this mapped to
     * `initializeRoomVisuals()`, which re-emitted REE_INITIALIZED; `updateObjectRoom()` does not,
     * but the guard is harmless and `onRoomInitialized()` still reads it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updateObjectRoom()
    updateObjectRoom(floorType: string | null = null, wallType: string | null = null, landscapeType: string | null = null, _skipModelUpdate: boolean = false): boolean
    {
        if(!this.isRoomEngineReady) return false;

        this._updatingObjectRoom = true;

        try
        {
            return this._roomEngine!.updateObjectRoom(this._previewRoomId, floorType, wallType, landscapeType, false);
        }
        finally
        {
            this._updatingObjectRoom = false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updateRoomWallsAndFloorVisibility()
    updateRoomWallsAndFloorVisibility(wallsVisible: boolean, floorVisible: boolean = true): void
    {
        if(this.isRoomEngineReady)
        {
            this._roomEngine!.updateObjectRoomVisibilities(this._previewRoomId, wallsVisible, floorVisible);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getCanvasOffset()
    private getCanvasOffset(point: IPoint): IPoint | null
    {
        const rectangle = this._currentPreviewRectangle;

        if(rectangle === null)
        {
            return point;
        }

        const isCenteredWallItem = this._centerWallItems && this._currentPreviewObjectCategory === 20;

        if(isCenteredWallItem && (rectangle.width < 1 || rectangle.height < 1))
        {
            if(this._addViewOffset.x !== point.x)
            {
                return {x: this._addViewOffset.x, y: point.y};
            }

            return null;
        }

        if(rectangle.width < 1 || rectangle.height < 1)
        {
            return point;
        }

        let x = isCenteredWallItem ? this._addViewOffset.x : -(rectangle.left + rectangle.right) >> 1;
        let y = -(rectangle.top + rectangle.bottom) >> 1;
        const verticalMargin = this._currentPreviewCanvasHeight - rectangle.height >> 1;

        if(verticalMargin > 10)
        {
            y += Math.min(15, verticalMargin - 10);
        }
        else if(this._currentPreviewObjectCategory !== 100)
        {
            y += 5 - Math.max(0, verticalMargin / 2);
        }
        else
        {
            y -= 5 - Math.min(0, verticalMargin / 2);
        }

        y += this._addViewOffset.y;

        if(!isCenteredWallItem)
        {
            x += this._addViewOffset.x;
        }

        const deltaX = (x - point.x) | 0;
        const deltaY = (y - point.y) | 0;

        if(deltaX !== 0 || deltaY !== 0)
        {
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if(distance > 10)
            {
                x = point.x + deltaX * 10 / distance;
                y = point.y + deltaY * 10 / distance;
            }

            return {x, y};
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updatePreviewRoomView()
    updatePreviewRoomView(force: boolean = false): void
    {
        if(this._disableUpdate && !force)
        {
            return;
        }

        this.checkAutomaticRoomObjectStateChange();

        if(this.isRoomEngineReady)
        {
            const screenOffset = this._roomEngine!.getRoomCanvasScreenOffset(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);

            if(screenOffset !== null)
            {
                let offset: IPoint = {x: screenOffset.x, y: screenOffset.y};

                this.updatePreviewObjectBoundingRectangle(offset);

                if(this._currentPreviewRectangle !== null)
                {
                    const previousScale = this._currentPreviewScale;

                    offset = this.validatePreviewSize(offset);

                    const canvasOffset = this.getCanvasOffset(offset);
                    if(canvasOffset !== null)
                    {
                        this._roomEngine!.setRoomCanvasScreenOffset(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, canvasOffset);
                    }

                    if(this._currentPreviewScale !== previousScale)
                    {
                        this._currentPreviewRectangle = null;
                    }
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::set disableUpdate()
    set disableUpdate(value: boolean)
    {
        this._disableUpdate = value;
    }

    /**
     * Freezes the *engine's* frame tick, not just this previewer's view updates — that is what
     * `disableUpdate` above does. The catalog uses this while rebuilding a page.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::set disableRoomEngineUpdate()
    set disableRoomEngineUpdate(value: boolean)
    {
        if(this.isRoomEngineReady)
        {
            this._roomEngine!.disableUpdate = value;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::onRoomInitialized()
    private onRoomInitialized(event: RoomEngineEvent): void
    {
        if(event === null)
        {
            return;
        }

        // Guard against the initializeRoomVisuals() re-emit of REE_INITIALIZED
        // triggered by updateObjectRoom() below (see updateObjectRoom's comment).
        if(this._updatingObjectRoom)
        {
            return;
        }

        if(event.type === RoomEngineEvent.REE_INITIALIZED)
        {
            if(event.roomId === this._previewRoomId)
            {
                if(this._roomEngine)
                {
                    this.updateObjectRoom('110', '99999', null);
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::onRoomObjectAdded()
    private onRoomObjectAdded(roomId: number, objectId: number, category: number): void
    {
        if(roomId === this._previewRoomId && objectId === RoomPreviewer.PREVIEW_OBJECT_ID && category === this._currentPreviewObjectCategory)
        {
            this._currentPreviewRectangle = null;
            this._zoomChanged = false;
            this._roomEngine!.getRoomObject(roomId, objectId, category);
        }
    }

    /**
     * Forces one engine pass right now, so a rotation is visible before the next frame. AS3's
     * `runUpdate()` is `update(1)` — a fixed one-millisecond step, deliberately not the real clock:
     * passing the wall time here made the engine believe a whole session had elapsed in one tick.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::updateRoomEngine()
    updateRoomEngine(): void
    {
        if(this.isRoomEngineReady)
        {
            this._roomEngine!.runUpdate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getGenericRoomObjectImage()
    getGenericRoomObjectImage(
        classType: string,
        imageType: string,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener | null,
        backgroundColor: number = 0,
        extras: string | null = null,
        stuffData: IStuffData | null = null,
        state: number = -1,
        frameCount: number = -1,
        objectData: string | null = null
    ): ImageResult | null
    {
        if(this.isRoomEngineReady)
        {
            return this._roomEngine!.getGenericRoomObjectImage(
                classType, imageType, direction, scale, listener, backgroundColor, extras, stuffData, state, frameCount, objectData);
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getRoomObjectImage()
    getRoomObjectImage(category: number, direction: IVector3d, scale: number, listener: IGetImageListener | null, backgroundColor: number = 0): ImageResult | null
    {
        if(this.isRoomEngineReady && listener !== null)
        {
            return this._roomEngine!.getRoomObjectImage(
                this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, category, direction, scale, listener, backgroundColor);
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::getRoomObjectCurrentImage()
    // TS deviation: returns HTMLCanvasElement instead of AS3's BitmapData - both are synchronous,
    // in-memory rasterizations (see IRoomObjectVisualization.getImage()'s own doc comment);
    // converting to ImageBitmap would need this to become async, which would change the
    // "give me the currently-rendered frame right now" pull semantics this method exists for.
    getRoomObjectCurrentImage(): HTMLCanvasElement | null
    {
        if(this.isRoomEngineReady)
        {
            const object = this._roomEngine!.getRoomObject(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, 100);

            if(object)
            {
                const visualization = object.getVisualization();

                if(visualization) return visualization.getImage(0xFFFFFF, -1);
            }
        }

        return null;
    }

    // AS3 counterpart: flash.utils.getTimer()
    private static getTimer(): number
    {
        return Math.floor(performance.now());
    }

    /**
     * Picks which of the two zoom mechanisms the previewer uses: the engine's canvas scale when the
     * flag is on, the room geometry's own zoom otherwise. AS3 reads it off the engine through a
     * cast to its Component base; the port declares `getBoolean` on IRoomEngine instead.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::validatePreviewSize()
    private isZoomEnabled(): boolean
    {
        return this._roomEngine?.getBoolean('zoom.enabled') ?? false;
    }

    /**
	 * Hands the preview's rendering canvas back to the room engine.
	 *
	 * TS-only, and it is not optional here the way it is in AS3. Flash parents the
	 * canvas into the widget's own window (`RoomPreviewerWidget.as`), so disposing
	 * that window removes it from the display list and AS3's `dispose()` can — and
	 * does — ignore it entirely. This port parents it onto the shared root PixiJS
	 * stage (see `RoomEngine.createRoomCanvas()`), which nothing else tears down:
	 * left alone, a disposed previewer's fully-rendered mini-room stayed on the
	 * stage forever, frozen at its last screen position and still drawing, showing
	 * through every transparent hole the window composite punches for the room
	 * view. That is the furniture "ghost" left behind after closing the
	 * catalog/inventory.
	 */
    releaseRoomCanvas(): void
    {
        this._roomEngine?.disposeRenderingCanvas(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::dispose()
    dispose(): void
    {
        this.reset(true);
        this.releaseRoomCanvas();

        if(this._roomEngine)
        {
            this._roomEngine.events.off(RoomEngineObjectEvent.REOE_ADDED, this.onRoomObjectAddedBound);
            this._roomEngine.events.off(RoomEngineEvent.REE_INITIALIZED, this.onRoomInitializedBound);
            this._roomEngine.unregisterCanvasSyncCallback(this.updatePreviewRoomViewBound);
        }

        this._backgroundFill?.destroy();
        this._backgroundFill = null;
        this._roomEngine = null;
    }
}
