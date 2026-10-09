/**
 * RoomRenderingCanvas
 *
 * Based on AS3: com.sulake.room.renderer.RoomSpriteCanvas (class_3523)
 *
 * Main rendering canvas for room visualization.
 * Owns a flat display list of ExtendedSprite children.
 * Each frame: reads sprite data from visualizations, builds a SortableSprite list,
 * sorts by Z, and creates/updates canvas-owned ExtendedSprite display objects.
 * Hit-testing iterates ExtendedSprite children backwards (front to back).
 *
 * @see sources/win63_version/room/renderer/class_3523.as
 */
import {RoomPlaneData} from '../object/RoomPlaneData';
import type {IRoomLight, IRoomLightingEmitter, RoomLighting} from './RoomLighting';
import {FurnitureLights} from '../../furniture/FurnitureLights';
import {Container, type Filter, Graphics, Rectangle, RenderTexture, Sprite, Text, type Renderer, Texture} from 'pixi.js';
import {
    FRAME_CHANNEL_NET,
    FRAME_CHANNEL_PIXI,
    FRAME_CHANNEL_ROOM_OBJECTS,
    FRAME_CHANNEL_ROOM_SORT,
    FRAME_CHANNEL_ROOM_SPRITES,
    FRAME_CHANNEL_UI,
    FrameTimings
} from '@ambreia/common/utils/FrameTimings';
import type {IRoomObjectSpriteVisualization} from '../../object/visualization/IRoomObjectSpriteVisualization';
import type {IRoomObject} from '../../object/IRoomObject';
import type {IRoomRenderingCanvas as IRoomRenderingCanvasInterface} from '../../renderer/IRoomRenderingCanvas';
import type {IRoomRenderingCanvasMouseListener} from '../../renderer/IRoomRenderingCanvasMouseListener';
import type {IRoomSpriteCanvasContainer} from '../../renderer/IRoomSpriteCanvasContainer';
import {RoomGeometry} from '../../utils/RoomGeometry';
import {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {Vector3d} from '../../utils/Vector3d';
import {RoomShakingEffect} from '../../utils/RoomShakingEffect';
import {RoomRotatingEffect} from '../../utils/RoomRotatingEffect';
import {RoomEnterEffect} from '../../utils/RoomEnterEffect';
import {RoomObjectSpriteType} from '../../object/enum/RoomObjectSpriteType';
import {ExtendedSprite} from './utils/ExtendedSprite';
import {SortableSprite} from './utils/SortableSprite';
import {ObjectMouseData} from './utils/ObjectMouseData';
import {RoomCullingMode} from './RoomCullingMode';
import {RoomObjectUserTypes} from '../object/RoomObjectUserTypes';
import {RoomObjectVariableEnum} from '../object/RoomObjectVariableEnum';
import type {IVector3d} from '../../utils/IVector3d';
import {RoomObjectSpriteData} from '@ambreia/common/graphics/RoomObjectSpriteData';
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import {StringUtil} from '@ambreia/common/utils/StringUtil';
import {Canvas} from '@ambreia/common/utils/Canvas';

export type {IRoomRenderingCanvasMouseListener};

interface IObjectSpriteCache {
    /**
     * The room object's numeric id, kept so the payload can name what a sprite belongs to. AS3
     * stores it on its own cache item for the same reason; this port's map is keyed by the id's
     * string form, which is not the same thing once it has to go into JSON.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/cache/_SafeCls_4432.as::objectId
    objectId: number;
    initialized: boolean;
    instanceId: number;
    updateId: number;
    geometryUpdateId: number;
    objectUpdateId: number;
    objectUpdateLoc: Vector3d;
    screenLoc: Vector3d;
    roundedLoc: Vector3d;
    locationChanged: boolean;
    screenX: number;
    screenY: number;
    screenZ: number;

    /**
     * Whether the object carries `roomObjectVariableAccurateZ` — read once here rather than per
     * frame, because it is written at creation and never changes. See its two readers:
     * `getCachedScreenLocation()`, which skips the tile rounding for it, and `renderObject()`,
     * which takes it as "this object is not resting on a tile".
     */
    // TS-only: AS3 reads the model in both places; the port caches the answer, which is constant.
    accurateZ: boolean;

    // TS-only: the three below feed the stacking DEVIATION in renderObject().
    /** A resting object's tile key, height above its floor, and base depth before re-basing. */
    stackTile: number;
    stackHeight: number;
    stackBase: number;
    /** A ground object's most-forward sprite depth, kept so a cache hit can still report it. */
    groundFront: number;
    spriteCount: number;
    sprites: SortableSprite[];
}

/**
 * Stored visualization entry — visualization + its room object.
 */
/** One hidden avatar's x-ray, reused from frame to frame (RoomRenderingCanvas.updateXray()). */
interface IXraySlot
{
    /** The finished picture, shown over the room. */
    view: Sprite;
    /** Everywhere minus what hides the avatar; and the avatar tinted, minus that cut. */
    cut: RenderTexture;
    picture: RenderTexture;
    white: Sprite;
    stamp: Container;
    stamps: Sprite[];
    body: Container;
    copies: Sprite[];
    eraser: Container;
}

// An object's sprites on a raised tile stay just in front of the floor piece under them.
const RAISED_SPRITE_DEPTH = RoomPlaneData.RAISED_FLOOR_DEPTH - 0.05;

export class RoomRenderingCanvas implements IRoomRenderingCanvasInterface 
{
    /**
    * How far outside the viewport an avatar's anchor may sit and still be updated, in canvas pixels.
    *
    * The anchor is a point, and the sprites hanging off it reach furthest upwards — an avatar's own
    * sprite sits at roughly `-height + scale/4`, and effects and additions go further still. This is
    * around four tiles at the default scale, chosen to be wrong in the safe direction: too large only
    * costs a few avatars' worth of updates, too small pops a limb at the edge of the screen.
    *
    * One figure per direction, because a single symmetric one was the first attempt and it culled only
    * a quarter of a two-thousand-avatar room. Four tiles of slack on every side of a *point* is mostly
    * spent below the avatar, where there is nothing to clip: everything hangs above the anchor, which
    * sits at its feet. Splitting keeps the same safety overhead, where clipping would actually show,
    * and stops paying for it in the three directions that never needed it.
    */
    // TS-only: see `RoomCullingMode`.
    private static readonly AVATAR_CULL_MARGIN_TOP = 192;

    // TS-only: see `AVATAR_CULL_MARGIN_TOP`.
    private static readonly AVATAR_CULL_MARGIN_BOTTOM = 64;

    // TS-only: see `AVATAR_CULL_MARGIN_TOP`.
    private static readonly AVATAR_CULL_MARGIN_SIDE = 96;

    /** The object types drawn by an avatar visualization, and so the ones `RoomCullingMode` covers. */
    // TS-only: see `RoomCullingMode`.
    private static readonly AVATAR_CULLABLE_TYPES: ReadonlySet<string> = new Set(Object.values(RoomObjectUserTypes));

    // AS3: sources/win63_version/room/renderer/class_3523.as::SKIP_FRAME_COUNT_FOR_UPDATE_INTERVAL
    private static readonly SKIP_FRAME_COUNT_FOR_UPDATE_INTERVAL = 50;

    // AS3: sources/win63_version/room/renderer/class_3523.as::FRAME_COUNT_FOR_UPDATE_INTERVAL
    private static readonly FRAME_COUNT_FOR_UPDATE_INTERVAL = 50;

    // AS3: sources/win63_version/room/renderer/class_3523.as::SLOW_FRAME_UPDATE_INTERVAL
    private static readonly SLOW_FRAME_UPDATE_INTERVAL = 60;

    // AS3: sources/win63_version/room/renderer/class_3523.as::FAST_FRAME_UPDATE_INTERVAL
    private static readonly FAST_FRAME_UPDATE_INTERVAL = 50;

    // AS3: sources/win63_version/room/renderer/class_3523.as::MAXIMUM_VALID_FRAME_UPDATE_INTERVAL
    private static readonly MAXIMUM_VALID_FRAME_UPDATE_INTERVAL = 1000;

    private static readonly REALLY_SLOW_FRAME_UPDATE_INTERVAL = 60 * 3;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_sortableSpriteList
    private _sortableSpriteList: SortableSprite[] = [];
    private _objectSpriteCaches: Map<string, IObjectSpriteCache> = new Map();
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_spritePool
    private _spritePool: ExtendedSprite[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_spriteCount
    private _spriteCount: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_activeSpriteCount
    private _activeSpriteCount: number = 0;

    /**
	 * How many pooled sprites the last render actually used
	 *
	 * Not the pool size: `_spriteCount` is what has been allocated, this is what is on screen.
	 * Protected in AS3 because only a subclass's debug overlay reads it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3073.as::get activeSpriteCount()
    protected get activeSpriteCount(): number
    {
        return this._activeSpriteCount;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3073.as::_SafeStr_8663 (name derived: written by set pingMs)
    private _pingMs: number = 0;

    /**
	 * Latest measured round-trip to the server, for the debug overlay to print
	 *
	 * The canvas only stores it — nothing here measures or draws it yet.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3073.as::set pingMs()
    set pingMs(value: number)
    {
        this._pingMs = value;
    }

    // TS-only: AS3 declares the setter alone; exposed so the stored value is readable rather than
    // write-only.
    get pingMs(): number
    {
        return this._pingMs;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_mouseActiveObjects
    private _mouseActiveObjects: Map<string, ObjectMouseData> = new Map();
    // AS3: sources/win63_version/room/renderer/class_3523.as::_eventCache
    private _eventCache: Map<string, RoomSpriteMouseEvent> = new Map();
    private _mouseLocationX: number = 0;
    private _mouseLocationY: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_mouseOldX
    private _mouseOldX: number = -10000000;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_mouseOldY
    private _mouseOldY: number = -10000000;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_mouseCheckCount
    private _mouseCheckCount: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_mouseSpriteWasHit
    private _mouseSpriteWasHit: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_eventId
    private _eventId: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_renderTimeStamp
    private _renderTimeStamp: number = -1;
    // AS3: sources/win63_version/room/renderer/class_3523.as::_skipObjectUpdate
    private _skipObjectUpdate: boolean = false;
    // AS3: sources/win63_version/room/renderer/class_3523.as::_runningSlow
    private _runningSlow: boolean = false;
    private _updateIntervalFrameCount: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_averageUpdateInterval
    private _averageUpdateInterval: number = 0;
    private _averageRenderTime: number = 0;
    private _lastRenderTime: number = 0;
    private _haltedFrameInterval: number = 0;
    private _skipSpriteVisibilityChecking: boolean = false;
    private _useExclusionRects: boolean = false;
    private _exclusionRects: { left: number; top: number; right: number; bottom: number }[] = [];
    private _displayTransformDirty: boolean = true;
    private _lastRenderedWidth: number = -1;
    private _lastRenderedHeight: number = -1;
    private readonly _roomObjectContainer: IRoomSpriteCanvasContainer;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_master
    private readonly _master: Container;
    // AS3: sources/win63_version/room/renderer/class_3523.as::_display
    private readonly _display: Container;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_spriteMask
    private _spriteMask: Graphics | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_id
    private readonly _id: number;

    constructor(container: IRoomSpriteCanvasContainer, id: number, width: number, height: number, scale: number) 
    {
        this._roomObjectContainer = container;
        this._id = id;
        this._width = width;
        this._height = height;
        // AS3: _scale = 1 (display scale), _Str_6356 = scale (geometry scale)
        this._scale = 1;

        // AS3: _master = new Sprite(), _display = new Sprite() added to _master
        this._master = new Container();
        this._master.label = `RoomRenderingCanvas_${id}`;
        this._master.eventMode = 'none';
        this._master.interactiveChildren = false;

        this._display = new Container();
        this._display.label = 'canvas';
        this._display.eventMode = 'none';
        this._display.interactiveChildren = false;
        this._display.sortableChildren = false;
        this._master.addChild(this._display);

        this._xray.label = 'xray';
        this._master.addChild(this._xray);

        // Create geometry with default direction (isometric view)
        this._geometry = new RoomGeometry(
            scale,
            new Vector3d(-135, 30, 0),
            new Vector3d(11, 11, 5),
            new Vector3d(-135, 0.5, 0)
        );
    }

    private _fpsCounterEnabled: boolean = false;

    /**
     * The `:showstats` overlay (AS3 var_478/var_381 TextFields). Lives on `_master`
     * (screen space, top-right), a sibling of `_display` so it doesn't pan/zoom with
     * the room. Created lazily on first enabled update; kept but hidden when disabled.
     */
    private _fpsOverlay: Container | null = null;
    private _fpsText: Text | null = null;
    private _fpsBackground: Graphics | null = null;

    // AS3: sources/win63_version/room/renderer/class_3523.as::get fpsCounterEnabled()
    get fpsCounterEnabled(): boolean
    {
        return this._fpsCounterEnabled;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::set fpsCounterEnabled()
    set fpsCounterEnabled(value: boolean)
    {
        this._fpsCounterEnabled = value;

        if(value)
        {
            // Show the overlay immediately instead of waiting for the next periodic
            // interval tick (~50 frames), so `:showstats` gives instant feedback.
            this.updateFpsOverlay();
        }
        // AS3 clears both TextFields' text when disabled; here we hide the overlay.
        else if(this._fpsOverlay)
        {
            this._fpsOverlay.visible = false;
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_useMask
    private _useMask: boolean = false;

    // AS3: sources/win63_version/room/renderer/class_3523.as::get useMask()
    get useMask(): boolean 
    {
        return this._useMask;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::set useMask()
    set useMask(value: boolean) 
    {
        if(value === this._useMask) 
        {
            return;
        }

        this._useMask = value;
        this.updateMask();
    }

    get id(): number 
    {
        return this._id;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::_geometry
    private _geometry: RoomGeometry;

    /**
	 * Above this, a sprite's pixels are not read back to average them.
	 *
	 * It is a cost ceiling, not a correctness one: the read is a full upload-and-scan per sprite,
	 * and the sprites it exists for — badges, wall photos, thumbnails — are all small.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/cache/_SafeCls_4404.as::MAX_SIZE_FOR_AVG_COLOR
    private static readonly MAX_SIZE_FOR_AVG_COLOR: number = 200;

    /**
     * How far above its tile's floor an object has to sit before it counts as resting on furniture
     * rather than on the ground. Same tolerance `RoomEngine.fixedUserLocation()` uses to decide the
     * same question.
     */
    // TS-only: see the DEVIATION in renderObject().
    private static readonly STACK_EPSILON: number = 0.02;

    /**
     * Depth an object resting on furniture is pulled forward per unit of height, so that within
     * one tile's stack the higher object draws over the lower. Deliberately tiny: it only orders
     * the stack against itself. Beating the support's own forward layers is done per tile, by
     * `_tileGroundFront` — see the DEVIATION in {@link renderObject}.
     */
    // TS-only: see the DEVIATION in renderObject().
    private static readonly STACK_TIE: number = 0.01;

    /**
     * Per tile, this frame: the most-forward sprite depth of any object resting on the ground there.
     * Tile key is `x * 65536 + y`. Cleared at the start of every frame; never reallocated.
     */
    // TS-only: see the DEVIATION in renderObject().
    private _tileGroundFront: Map<number, number> = new Map();

    // TS-only: the resting objects drawn this frame, re-based against `_tileGroundFront` before the sort.
    private _stackedThisFrame: IObjectSpriteCache[] = [];

    /**
     * The floor's own altitude at a tile, excluding anything stacked on it — `RoomEngine` wires this
     * to the room's `LegacyWallGeometry`. Null on a canvas with no room behind it (previews,
     * thumbnails), where every object then sorts exactly as the AS3 does.
     */
    // TS-only: no AS3 counterpart; feeds the DEVIATION in renderObject().
    public floorHeightAt: ((x: number, y: number) => number | null) | null = null;

    /**
     * True where the floor is raised above the room's lowest: drawn as a solid piece that sorts
     * among the objects (RoomPlaneData.sortTile), RAISED_FLOOR_DEPTH behind its tile. Null draws
     * every object as on flat ground.
     */
    // TS-only: see renderObject().
    public raisedFloorAt: ((x: number, y: number) => boolean) | null = null;

    /**
     * Avatars something hides, drawn again over everything, tinted and see-through, cut to the shape
     * of what is in front of them (updateXray()): a character behind a staircase or a furni stays in
     * sight without the part still in view being veiled.
     */
    // TS-only: see updateXray().
    private readonly _xray: Container = new Container();
    // TS-only: updateXray()'s slots, one per hidden avatar, reused from frame to frame.
    private readonly _xraySlots: IXraySlot[] = [];
    // TS-only: per avatar object, its sorted sprite indices this frame; and one avatar's occluders.
    private readonly _xrayAvatars: Map<string, number[]> = new Map();
    private readonly _xrayOccluders: number[] = [];

    // TS-only: see the lighting setter.
    private _lighting: RoomLighting | null = null;
    // TS-only: the furni lights found this frame (updateLighting()), reused, and by object id.
    private readonly _furniLights: IRoomLight[] = [];
    private readonly _furniLightOf: Map<string, IRoomLight> = new Map();
    private readonly _furniLightBest: Map<string, number> = new Map();
    // TS-only: the images that give light this frame (updateLighting()), reused.
    private readonly _emitters: IRoomLightingEmitter[] = [];

    /**
     * The room's light (RoomLighting), multiplied over the scene below the see-through avatars;
     * null draws the room as lit by day, the way Habbo did. Drawn with pixiRenderer.
     */
    // TS-only: no AS3 counterpart.
    get lighting(): RoomLighting | null
    {
        return this._lighting;
    }

    set lighting(value: RoomLighting | null)
    {
        this._lighting?.view.removeFromParent();
        this._lighting = value;

        if(value !== null) this._master.addChildAt(value.view, this._master.getChildIndex(this._xray));
    }

    /** The renderer the x-ray masks are stamped with (updateXray()); null leaves hidden avatars hidden. */
    // TS-only: see updateXray().
    public pixiRenderer: (() => Renderer | null) | null = null;
    // TS-only: the see-through copy's tint and alpha.
    private static readonly XRAY_TINT: number = 0x7088ff;
    private static readonly XRAY_ALPHA: number = 0.55;
    /**
     * Fade the raised floor that hides the player's avatar or the tile under the pointer
     * (updateOcclusion()). The game turns it on; an editor showing the room as built leaves it off.
     */
    // TS-only: see updateOcclusion().
    public seeThrough: boolean = false;
    // TS-only: the buildings (RoomPlaneData.sortGroup) and furni (object ids) see-through this frame.
    private readonly _fadedGroups: Set<number> = new Set();
    private readonly _fadedFurni: Set<string> = new Set();
    // TS-only: the sorted indices of the player's own avatar sprites this frame.
    private readonly _ownIndices: number[] = [];
    // TS-only: a see-through sprite's alpha (updateOcclusion()).
    private static readonly FADE_ALPHA: number = 0.4;
    // TS-only: hidesOwn() probes a HIDE_PROBES × HIDE_PROBES grid where two sprites overlap.
    private static readonly HIDE_PROBES: number = 5;

    // The depth z AS3 passes to setDepthVector() while rotating. Literal in both call sites there.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::doMagic()
    private static readonly ROTATION_DEPTH_Z: number = 5;

    // Name DERIVED (`_SafeStr_6428`): obfuscated in every tree; true while the shake effect runs.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::_SafeStr_6428
    private _shaking: boolean = false;

    // Name DERIVED (`_SafeStr_4756`): obfuscated in every tree; 0 when not rotating, otherwise the
    // per-frame yaw increment (the testing tools AS3 builds set it to other values).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::_SafeStr_4756
    private _rotationStep: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::_rotationOrigin
    private _rotationOrigin: Vector3d | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::_rotationRodLength
    private _rotationRodLength: number = 0;

    // Name DERIVED (`_SafeStr_5214`): obfuscated in every tree; the camera direction to restore.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::_SafeStr_5214
    private _savedDirection: Vector3d | null = null;

    // Name DERIVED (`_SafeStr_6854`): obfuscated in every tree; the camera location to restore.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::_SafeStr_6854
    private _savedLocation: Vector3d | null = null;

    // Name DERIVED (`_SafeStr_5069`): obfuscated in every tree; frames elapsed inside the shake.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::_SafeStr_5069
    private _shakeTick: number = 0;

    // AS3: sources/win63_version/room/renderer/class_3523.as::get geometry()
    get geometry(): RoomGeometry 
    {
        return this._geometry;
    }

    private _width: number = 0;

    // AS3: sources/win63_version/room/renderer/class_3523.as::get width()
    get width(): number 
    {
        return this._width * this._scale;
    }

    private _height: number = 0;

    // AS3: sources/win63_version/room/renderer/class_3523.as::get height()
    get height(): number 
    {
        return this._height * this._scale;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_screenOffsetX
    private _screenOffsetX: number = 0;

    // AS3: sources/win63_version/room/renderer/class_3523.as::get screenOffsetX()
    get screenOffsetX(): number 
    {
        return this._screenOffsetX;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::set screenOffsetX()
    set screenOffsetX(value: number) 
    {
        if(value === this._screenOffsetX) 
        {
            return;
        }

        this._mouseLocationX -= (value - this._screenOffsetX);
        this._screenOffsetX = value;
        this._displayTransformDirty = true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_screenOffsetY
    private _screenOffsetY: number = 0;

    // AS3: sources/win63_version/room/renderer/class_3523.as::get screenOffsetY()
    get screenOffsetY(): number 
    {
        return this._screenOffsetY;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::set screenOffsetY()
    set screenOffsetY(value: number) 
    {
        if(value === this._screenOffsetY) 
        {
            return;
        }

        this._mouseLocationY -= (value - this._screenOffsetY);
        this._screenOffsetY = value;
        this._displayTransformDirty = true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_scale
    private _scale: number = 1;

    // AS3: sources/win63_version/room/renderer/class_3523.as::get scale()
    get scale(): number 
    {
        return this._scale;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as::_mouseListener
    private _mouseListener: IRoomRenderingCanvasMouseListener | null = null;

    get mouseListener(): IRoomRenderingCanvasMouseListener | null 
    {
        return this._mouseListener;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::set mouseListener()
    set mouseListener(value: IRoomRenderingCanvasMouseListener | null) 
    {
        this._mouseListener = value;
    }

    private _disposed: boolean = false;

    get disposed(): boolean 
    {
        return this._disposed;
    }

    /**
     * The display container (added to PixiJS stage).
     * AS3: get displayObject() returns _master.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::get displayObject()
    get container(): Container
    {
        return this._master;
    }

    // DEVIATION: AS3's is `getObjectId(sprite:_SafeCls_4441):String` — a four-line null guard around
    //   `sprite.identifier`, `protected`, and called from nowhere in the primary tree
    //   (`grep -rn "\.getObjectId(" com/sulake/` finds no call site at all). The port reads
    //   `extSprite.identifier` at the one place that wants it, in `handleMouseEvent()`'s hit walk.
    //   Its two siblings in the old marker here — `getPlaneSortableSprites()` and
    //   `getRoomObjectCacheItem()` — were ported on 2026-09-05: that marker said this port "keeps
    //   no such cache" as AS3's `_roomObjectCache`, and `_objectSpriteCaches` above is one.
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_3073.as::getObjectId()

    private static compareSortableSprites(a: SortableSprite, b: SortableSprite): number
    {
        return b.z - a.z;
    }

    /**
     * Renders the room at 1:1 scale with no screen offset and captures it to a
     * canvas. The AS3 version also lowers Stage.quality for the capture and
     * restores it afterward; PixiJS has no per-render quality knob, so that
     * step is dropped as a non-portable Flash-ism.
     *
     * **The capture is framed on the viewport, not on the content**, and that is the whole
     * correctness of it. `renderer.extract.canvas(target)` with no frame crops to the target's own
     * bounding box and normalises it to (0,0) — so the returned canvas starts at whatever corner
     * the room's *content* happens to reach, which is usually well outside the visible area.
     * `snapshotRoomCanvasToBitmap()` then offsets it by `region.left`/`region.top`, which are
     * **screen** coordinates, and the two origins do not agree: the photo comes out shifted, and a
     * small region (the room thumbnail) lands off the content entirely and reads black.
     *
     * Passing `frame` fixes the origin at the viewport's top-left and the size at the canvas's own,
     * which is the space the callers are working in. It also settles a PixiJS v8 warning —
     * "Mask bounds, renderable is not inside the root container" — for the right reason rather than
     * by deleting something: the extract treats `_display` as its own root, while `updateMask()`
     * parents `_spriteMask` to `_master`, a *sibling*, so Pixi could not resolve the mask while
     * computing bounds. With an explicit frame there are no bounds to compute.
     *
     * This is AS3's capture, not a deviation. It sizes its `BitmapData` from `_display` and draws
     * with a `Matrix` translated by `-bounds.x, -bounds.y` — the same "put the interesting corner at
     * the origin" move, expressed the way Flash expresses it.
     *
     * @see sources/win63_version/room/renderer/class_3523.as::takeScreenShot() line 313
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::takeScreenShot()
    takeScreenShot(renderer: Renderer): HTMLCanvasElement
    {
        this._skipSpriteVisibilityChecking = true;

        const savedScale = this._scale;
        const savedOffsetX = this._screenOffsetX;
        const savedOffsetY = this._screenOffsetY;

        this.setScale(1);
        this._screenOffsetX = 0;
        this._screenOffsetY = 0;

        this.render(-1, true);

        const canvas = renderer.extract.canvas({
            target: this._display,
            frame: new Rectangle(0, 0, this._width, this._height),
        }) as HTMLCanvasElement;

        this._skipSpriteVisibilityChecking = false;
        this.setScale(savedScale);
        this._screenOffsetX = savedOffsetX;
        this._screenOffsetY = savedOffsetY;

        return canvas;
    }

    /**
	 * Every drawn sprite as a flat payload record — what the camera serialises into the photo.
	 *
	 * A fresh array of fresh records, deliberately: `SpriteDataCollector.getFurniData()` appends
	 * culled avatars and mannequin parts to it and adds offsets to their `x`/`y`/`z` in place, and
	 * doing that to the renderer's own list would move objects on screen.
	 *
	 * Room planes are excluded — they go through `getPlaneSortableSprites()` — and so is any sprite
	 * with no library asset name, which is one the receiving end could not resolve.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3073.as::getSortableSpriteList()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/cache/_SafeCls_4404.as::getSortableSpriteList()
    getSortableSpriteList(): RoomObjectSpriteData[]
    {
        const list: RoomObjectSpriteData[] = [];

        for(const cache of this._objectSpriteCaches.values())
        {
            for(const sortable of cache.sprites)
            {
                const sprite = sortable.sprite;

                if(sprite === null) continue;
                if(sprite.spriteType === RoomObjectSpriteType.ROOM_PLANE) continue;
                if(sprite.libraryAssetName === '') continue;

                list.push(this.toSpriteData(cache.objectId, sortable, sprite));
            }
        }

        return list;
    }

    /**
	 * Fills one payload record from a drawn sprite.
	 *
	 * The last branch is the one that matters: for a sprite whose picture is a *download* — a wall
	 * photo, a group badge, a skewed thumbnail — the payload carries the image's average colour in
	 * place of pixels it cannot include, and marks an external wall image as needing a frame drawn
	 * round it. AS3 caps that read at 200x200, which is what keeps it off large sprites.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/cache/_SafeCls_4404.as::getSortableSpriteList()
    private toSpriteData(objectId: number, sortable: SortableSprite, sprite: IRoomObjectSprite): RoomObjectSpriteData
    {
        const data = new RoomObjectSpriteData();

        data.objectId = objectId;

        // The mirror correction, taken back out. `renderObject()` moves a flipped sprite's origin to
        // the mirrored edge — `sortable.x = finalX + (flipH ? width : 0)` — because this port
        // mirrors with `scale.x = -1`, which reflects about the anchor, where AS3 baked the flip
        // into the bitmap and kept the top-left. That is a fact about how this canvas draws, and the
        // payload is not about this canvas: AS3 writes `sortable.x` straight out and its value is
        // the visual left edge whether or not the sprite is flipped.
        //
        // Sent uncorrected, a mirrored sprite landed one full width to the right of where it
        // belongs — per layer, so an object made of several came apart by the difference between
        // their widths. A pet was the visible case: its three body layers are 28, 21 and 13 wide,
        // and only its mirrored directions (4, 5 and 6, which `dog.nitro` aliases off 2, 1 and 0)
        // were wrong.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/cache/_SafeCls_4404.as::getSortableSpriteList()
        data.x = Math.round(sortable.x - (sprite.flipH ? sprite.width : 0));
        data.y = Math.round(sortable.y - (sprite.flipV ? sprite.height : 0));
        data.z = sortable.z;
        data.name = StringUtil.nonNull(sprite.libraryAssetName);
        data.flipH = sprite.flipH;
        data.alpha = sprite.alpha;
        data.color = sprite.color.toString();
        data.blendMode = sprite.blendMode;
        data.width = sprite.width;
        data.height = sprite.height;
        data.objectType = sprite.objectType ?? '';
        data.posture = sprite.assetPosture ?? '';

        const skewed = RoomRenderingCanvas.isSkewedSprite(sprite);

        if(skewed)
        {
            // Which way the shear leans is decided by the wall the sprite is on, and the two walls
            // are the even and odd directions.
            data.skew = sprite.direction % 4 === 0 ? -0.5 : 0.5;
        }

        const isDownloadedImage = data.name.indexOf('%image.library.url%') >= 0
            || data.name.indexOf('%group.badge.url%') >= 0;

        if((skewed || isDownloadedImage)
            && data.width <= RoomRenderingCanvas.MAX_SIZE_FOR_AVG_COLOR
            && data.height <= RoomRenderingCanvas.MAX_SIZE_FOR_AVG_COLOR)
        {
            data.color = Canvas.averageColor(sprite.texture).toString();

            if(data.objectType.indexOf('external_image_wallitem') === 0) data.frame = true;
        }

        return data;
    }

    /**
	 * The two sprite kinds drawn on a wall at an angle, which is what `skew` exists for: an
	 * external image's thumbnail and a guild forum's.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/cache/_SafeCls_4404.as::isSkewedSprite()
    private static isSkewedSprite(sprite: IRoomObjectSprite): boolean
    {
        const objectType = sprite.objectType;

        if(!objectType) return false;
        if(sprite.tag !== 'THUMBNAIL') return false;

        return objectType.indexOf('external_image_wallitem') === 0 || objectType.indexOf('guild_forum') === 0;
    }

    /**
	 * The room's own plane sprites — floor, walls, landscape — as drawn.
	 *
	 * The complement of {@link getSortableSpriteList}: that one excludes exactly what this returns.
	 * These stay `SortableSprite`s because the caller wants their live geometry, not a flat record.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3073.as::getPlaneSortableSprites()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/cache/_SafeCls_4404.as::getPlaneSortableSprites()
    getPlaneSortableSprites(): SortableSprite[]
    {
        const planes: SortableSprite[] = [];

        for(const cache of this._objectSpriteCaches.values())
        {
            for(const sortable of cache.sprites)
            {
                if(sortable.sprite?.spriteType === RoomObjectSpriteType.ROOM_PLANE) planes.push(sortable);
            }
        }

        return planes;
    }

    /**
	 * The per-object sprite cache entry, or null when the object drew nothing this frame.
	 *
	 * `screenZ` is the depth the canvas gave the object before any sprite's own `relativeDepth` —
	 * what `SpriteDataCollector` needs for an avatar that draws as parts, since the composed sprite
	 * whose depth AS3 reads does not exist in that mode.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3073.as::getRoomObjectCacheItem()
    getRoomObjectCacheItem(objectId: string): {objectId: number; screenZ: number; sprites: SortableSprite[]} | null
    {
        return this._objectSpriteCaches.get(objectId) ?? null;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::skipSpriteVisibilityChecking()
    skipSpriteVisibilityChecking(): void 
    {
        this._skipSpriteVisibilityChecking = true;
        this.render(-1, true);
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::resumeSpriteVisibilityChecking()
    resumeSpriteVisibilityChecking(): void 
    {
        this._skipSpriteVisibilityChecking = false;
        this._displayTransformDirty = true;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::initialize()
    // Creates/updates a Sprite named "mask" and assigns it to _display.mask when
    /**
     * Initialize canvas dimensions.
     * AS3: initialize(width, height)
     */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_3074.as::initialize()
    initialize(width: number, height: number): void 
    {
        if(width < 1) width = 1;
        if(height < 1) height = 1;
        this._width = width;
        this._height = height;
        this.updateMask();
        this._displayTransformDirty = true;
    }

    /**
     * Set the display zoom scale.
     * AS3: class_3523.setScale() updates var_337 only and does not recreate RoomGeometry.
     */
    setScale(
        scale: number,
        point: { x: number; y: number } | null = null,
        offset: { x: number; y: number } | null = null
    ): void 
    {
        if(scale === this._scale) return;

        if(point === null) 
        {
            point = {x: this._width / 2, y: this._height / 2};
        }

        if(offset === null) 
        {
            offset = point;
        }

        const localX = (point.x - this._master.x - this._screenOffsetX) / this._scale;
        const localY = (point.y - this._master.y - this._screenOffsetY) / this._scale;

        this._scale = scale;
        this._displayTransformDirty = true;
        this.screenOffsetX = (offset.x - this._master.x) - localX * scale;
        this.screenOffsetY = (offset.y - this._master.y) - localY * scale;
        this.updateDisplayTransform();
    }

    setScreenOffset(x: number, y: number): void 
    {
        this.screenOffsetX = x;
        this.screenOffsetY = y;
    }

    /**
     * Main render loop. Called each frame.
     * Based on AS3 RoomSpriteCanvas.render()
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as line 390
     */
    /**
	 * Applies the room-wide shake and rotate effects to the geometry, once per frame
	 *
	 * Both are camera moves, not object moves: shaking adds a per-frame sine wobble to the
	 * geometry's *direction*, and rotating swings its location around the point where its view
	 * axis meets the floor plane — a rod of fixed length, so the room turns without the camera
	 * drifting toward or away from it.
	 *
	 * The saved direction and location are what makes either reversible. They are captured when
	 * the effect starts and written back when it stops, so a room that was shaken returns exactly
	 * to the camera it had rather than to a default.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::doMagic()
    private doMagic(): void
    {
        if(this._geometry === null) return;

        if(this._rotationStep !== 0)
        {
            let direction = this._geometry.direction;

            this._geometry.direction = new Vector3d(direction.x + this._rotationStep, direction.y, direction.z);
            direction = this._geometry.direction;
            this._geometry.setDepthVector(new Vector3d(direction.x, direction.y, RoomRenderingCanvas.ROTATION_DEPTH_Z));

            const location = new Vector3d();

            location.assign(this._rotationOrigin);

            const yaw = (direction.x + 180) / 180 * Math.PI;
            const pitch = direction.y / 180 * Math.PI;

            location.x += this._rotationRodLength * Math.cos(yaw) * Math.cos(pitch);
            location.y += this._rotationRodLength * Math.sin(yaw) * Math.cos(pitch);
            location.z += this._rotationRodLength * Math.sin(pitch);

            this._geometry.location = location;

            this._savedLocation = new Vector3d();
            this._savedLocation.assign(location);
            this._savedDirection = new Vector3d();
            this._savedDirection.assign(this._geometry.direction);
        }

        // Both edges of the flag matter: the effect turning off has to run changeShaking() too,
        // because that is what restores the saved direction below.
        if(RoomShakingEffect.isVisualizationOn() !== this._shaking) this.changeShaking();

        if(RoomRotatingEffect.isVisualizationOn()) this.changeRotation();

        if(this._shaking)
        {
            this._shakeTick++;

            const wobble = new Vector3d(
                Math.sin(this._shakeTick * 5 / 180 * Math.PI) * 2,
                Math.sin(this._shakeTick / 180 * Math.PI) * 5,
                Math.sin(this._shakeTick * 10 / 180 * Math.PI) * 2
            );

            this._geometry.direction = Vector3d.sum(this._savedDirection, wobble) ?? this._geometry.direction;
        }
        else
        {
            this._shakeTick = 0;

            if(this._savedDirection !== null) this._geometry.direction = this._savedDirection;
        }
    }

    /**
	 * Toggles shaking, capturing the camera direction to wobble around on the way in
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::changeShaking()
    private changeShaking(): void
    {
        this._shaking = !this._shaking;

        if(!this._shaking || this._geometry === null) return;

        const direction = this._geometry.direction;

        this._savedDirection = new Vector3d(direction.x, direction.y, direction.z);
    }

    /**
	 * Starts or stops the rotation, and computes the rod it turns on
	 *
	 * The pivot is where the camera's own view axis crosses the floor plane; the rod is the
	 * distance from there to the camera. Turning is then a matter of walking that rod, which is
	 * why `doMagic()` recomputes the location from the angle rather than accumulating offsets.
	 * A room that is shaking is left alone — the two effects would fight over `direction`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::changeRotation()
    private changeRotation(): void
    {
        if(this._shaking || this._geometry === null) return;

        if(this._rotationStep === 0)
        {
            const location = this._geometry.location;
            const axis = this._geometry.directionAxis;

            this._savedLocation = new Vector3d();
            this._savedLocation.assign(location);
            this._savedDirection = new Vector3d();
            this._savedDirection.assign(this._geometry.direction);

            const pivot = RoomGeometry.getIntersectionVector(
                location, axis, new Vector3d(0, 0, 0), new Vector3d(0, 0, 1)
            );

            if(pivot === null) return;

            this._rotationOrigin = new Vector3d(pivot.x, pivot.y, pivot.z);
            this._rotationRodLength = Vector3d.dif(pivot, location)?.length ?? 0;
            this._rotationStep = 1;

            return;
        }

        this._rotationStep = 0;

        if(this._savedLocation !== null) this._geometry.location = this._savedLocation;

        if(this._savedDirection !== null)
        {
            this._geometry.direction = this._savedDirection;
            this._geometry.setDepthVector(
                new Vector3d(this._savedDirection.x, this._savedDirection.y, RoomRenderingCanvas.ROTATION_DEPTH_Z)
            );
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3074.as::render()
    render(time: number, force: boolean = false): void
    {
        this.doMagic();

        if(time === -1)
        {
            time = this._renderTimeStamp + 1;
        }

        if(this._geometry === null) 
        {
            return;
        }

        if(time === this._renderTimeStamp && !force) 
        {
            return;
        }

        this._skipObjectUpdate = !this._skipObjectUpdate;
        this.calculateUpdateInterval(time);

        const renderStartedAt = performance.now();

        if(this._width !== this._lastRenderedWidth || this._height !== this._lastRenderedHeight) 
        {
            force = true;
        }

        if(this._displayTransformDirty) 
        {
            force = true;
        }

        // Update display position (AS3: display.x/y/scaleX/scaleY)
        this.updateDisplayTransform();

        let spriteIndex = 0;

        // Iterate all visualizations, update them, build SortableSprite list
        // AS3: for each room object → _Str_24532()
        const objectCount = this._roomObjectContainer.getRoomObjectCount();

        // The three phases below are billed separately to the `:showstats` budget. `room` as a whole
        // was measured at ~80ms with 40 walking avatars — the entire frame — and the three do very
        // different work: `obj` runs each object's visualization update (where an avatar may
        // recompose its canvas and upload a texture), `sort` is a comparison sort over the sprite
        // list, `spr` writes PixiJS display properties. Splitting them is the difference between
        // knowing the room loop is slow and knowing which part of it to fix.
        FrameTimings.begin(FRAME_CHANNEL_ROOM_OBJECTS);

        this._tileGroundFront.clear();
        this._stackedThisFrame.length = 0;

        for(let i = 0; i < objectCount; i++)
        {
            const object = this._roomObjectContainer.getRoomObjectWithIndex(i);
            const objectId = this._roomObjectContainer.getRoomObjectIdWithIndex(i);

            if(object !== null && objectId !== null)
            {
                spriteIndex += this.renderObject(object, objectId, time, force, spriteIndex);
            }
        }

        // A resting object only has to outrank what holds it up, so it is pulled forward to just
        // ahead of the most-forward sprite on the ground of its own tile - and no further. See the
        // DEVIATION in renderObject(); it has to wait until every object has reported its tile.
        for(const stacked of this._stackedThisFrame)
        {
            const front = this._tileGroundFront.get(stacked.stackTile);

            if(front === undefined) continue;

            const shift = front - RoomRenderingCanvas.STACK_TIE * stacked.stackHeight - stacked.stackBase;

            if(shift >= 0) continue;

            for(let i = 0; i < stacked.spriteCount; i++)
            {
                stacked.sprites[i].z += shift;
            }
        }

        FrameTimings.end(FRAME_CHANNEL_ROOM_OBJECTS);
        FrameTimings.begin(FRAME_CHANNEL_ROOM_SORT);

        // AS3: _sortableSpriteList.sortOn("z", DESCENDING | NUMERIC)
        this._sortableSpriteList.sort(RoomRenderingCanvas.compareSortableSprites);

        // Trim excess sortable sprites
        if(spriteIndex < this._sortableSpriteList.length)
        {
            this._sortableSpriteList.length = spriteIndex;
        }

        FrameTimings.end(FRAME_CHANNEL_ROOM_SORT);
        FrameTimings.begin(FRAME_CHANNEL_ROOM_SPRITES);

        // Update ExtendedSprites from sorted list
        for(let i = 0; i < spriteIndex; i++)
        {
            const sortable = this._sortableSpriteList[i];

            if(sortable !== null)
            {
                this.updateSprite(i, sortable);
            }
        }

        // Hide/pool unused sprites beyond spriteIndex
        this.cleanSprites(spriteIndex);
        this.updateOcclusion(spriteIndex);
        this.updateLighting(spriteIndex, time);

        FrameTimings.end(FRAME_CHANNEL_ROOM_SPRITES);

        this._renderTimeStamp = time;
        this._lastRenderedWidth = this._width;
        this._lastRenderedHeight = this._height;
        this._displayTransformDirty = false;
        this._lastRenderTime = performance.now() - renderStartedAt;
    }

    /**
     * Handle mouse events by hit-testing against all room sprites.
     * Based on AS3 RoomSpriteCanvas.handleMouseEvent()
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as line 1005
     */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_3074.as::handleMouseEvent()
    handleMouseEvent(
        x: number, y: number, type: string,
        altKey: boolean = false, ctrlKey: boolean = false,
        shiftKey: boolean = false, buttonDown: boolean = false
    ): boolean 
    {
        type = this.normalizeMouseEventType(type);

        // Convert to canvas-local coords (AS3: subtract screenOffset, divide by scale)
        x = x - this._screenOffsetX;
        y = y - this._screenOffsetY;
        this._mouseLocationX = x / this._scale;
        this._mouseLocationY = y / this._scale;

        // Optimization: skip redundant mouseMove checks within same frame
        if(this._mouseCheckCount > 0 && type === 'mouseMove') 
        {
            return this._mouseSpriteWasHit;
        }

        this._mouseSpriteWasHit = this.checkMouseHits(
            Math.floor(this._mouseLocationX),
            Math.floor(this._mouseLocationY),
            type, altKey, ctrlKey, shiftKey, buttonDown
        );
        this._mouseCheckCount++;

        // AS3 wires "click"/"doubleClick" to a second, dedicated native-event
        // listener (clickHandler → checkMouseClickHits) that hit-tests only
        // clickHandling sprites (ad-banner furniture), independent of and in
        // addition to the roll-over/click routing above.
        if(type === 'click' || type === 'doubleClick') 
        {
            this.checkMouseClickHits(
                Math.floor(this._mouseLocationX),
                Math.floor(this._mouseLocationY),
                type === 'doubleClick',
                altKey, ctrlKey, shiftKey, buttonDown
            );
        }

        return this._mouseSpriteWasHit;
    }

    /**
     * Get the canvas ID.
     *
     * @see sources/win63_version/room/renderer/class_3523.as line 1346
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::getId()
    getId(): number 
    {
        return this._id;
    }

    /**
     * Per-frame update for mouse event processing.
     * Based on AS3 RoomSpriteCanvas.update()
     *
     * @see sources/win63_version/room/renderer/class_3523.as line 1326
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::update()
    update(): void 
    {
        if(this._mouseCheckCount === 0) 
        {
            this.checkMouseHits(
                Math.floor(this._mouseLocationX),
                Math.floor(this._mouseLocationY),
                'mouseMove'
            );
        }

        this._mouseCheckCount = 0;
        this._eventId++;
    }

    suppressMouseUpdate(): void 
    {
        this._mouseCheckCount = 1;
    }

    /**
     * @deprecated Use update() instead. Kept for backward compatibility.
     */
    updateMouseState(): void 
    {
        this.update();
    }

    // AS3: .../src/com/sulake/room/renderer/_SafeCls_3074.as::dispose()
    dispose(): void 
    {
        if(this._disposed) return;

        this.cleanSprites(0);

        if(this._geometry !== null) 
        {
            this._geometry.dispose();
        }

        // Dispose pooled sprites
        for(const sprite of this._spritePool) 
        {
            sprite.dispose();
        }

        this._spritePool = [];
        this._sortableSpriteList = [];
        this._objectSpriteCaches.clear();
        this._mouseActiveObjects.clear();
        this._eventCache.clear();
        this._mouseListener = null;
        this._display.mask = null;

        if(this._spriteMask !== null) 
        {
            if(this._spriteMask.parent !== null) 
            {
                this._spriteMask.parent.removeChild(this._spriteMask);
            }

            this._spriteMask.destroy();
            this._spriteMask = null;
        }

        for(const slot of this._xraySlots)
        {
            slot.cut.destroy(true);
            slot.picture.destroy(true);
        }
        this._master.destroy({children: true});

        // Children (incl. the fps overlay) are destroyed by the cascade above.
        this._fpsOverlay = null;
        this._fpsText = null;
        this._fpsBackground = null;
        this._disposed = true;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::roomObjectRemoved()
    roomObjectRemoved(objectId: string): void 
    {
        this.disposeObjectSpriteCache(objectId);
    }

    // useMask is enabled.
    private updateMask(): void 
    {
        if(this._spriteMask === null) 
        {
            this._spriteMask = new Graphics();
            this._spriteMask.label = 'mask';
        }

        this._spriteMask.clear();
        this._spriteMask.rect(0, 0, this._width, this._height);
        this._spriteMask.fill(0);

        if(this._useMask) 
        {
            if(this._spriteMask.parent !== this._master) 
            {
                this._master.addChild(this._spriteMask);
            }

            this._display.mask = this._spriteMask;
        }
        else 
        {
            if(this._spriteMask.parent === this._master) 
            {
                this._master.removeChild(this._spriteMask);
            }

            this._display.mask = null;
        }
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::calculateUpdateInterval()
    private calculateUpdateInterval(time: number): void 
    {
        if(this._renderTimeStamp <= 0) 
        {
            return;
        }

        const updateInterval = time - this._renderTimeStamp;

        if(updateInterval > RoomRenderingCanvas.REALLY_SLOW_FRAME_UPDATE_INTERVAL) 
        {
            this._haltedFrameInterval = updateInterval;
        }

        if(updateInterval > RoomRenderingCanvas.MAXIMUM_VALID_FRAME_UPDATE_INTERVAL) 
        {
            return;
        }

        this._updateIntervalFrameCount++;

        if(this._updateIntervalFrameCount === RoomRenderingCanvas.SKIP_FRAME_COUNT_FOR_UPDATE_INTERVAL + 1) 
        {
            this._averageUpdateInterval = updateInterval;
            this._averageRenderTime = this._lastRenderTime;

            return;
        }

        if(this._updateIntervalFrameCount <= RoomRenderingCanvas.SKIP_FRAME_COUNT_FOR_UPDATE_INTERVAL + 1) 
        {
            return;
        }

        const frameCount = this._updateIntervalFrameCount - RoomRenderingCanvas.SKIP_FRAME_COUNT_FOR_UPDATE_INTERVAL;

        this._averageUpdateInterval = this._averageUpdateInterval * (frameCount - 1) / frameCount + updateInterval / frameCount;
        this._averageRenderTime = this._averageRenderTime * (frameCount - 1) / frameCount + this._lastRenderTime / frameCount;

        if(this._updateIntervalFrameCount > RoomRenderingCanvas.SKIP_FRAME_COUNT_FOR_UPDATE_INTERVAL + RoomRenderingCanvas.FRAME_COUNT_FOR_UPDATE_INTERVAL) 
        {
            this._updateIntervalFrameCount = RoomRenderingCanvas.SKIP_FRAME_COUNT_FOR_UPDATE_INTERVAL;

            if(!this._runningSlow && this._averageUpdateInterval > RoomRenderingCanvas.SLOW_FRAME_UPDATE_INTERVAL) 
            {
                this._runningSlow = true;
            }
            else if(this._runningSlow && this._averageUpdateInterval < RoomRenderingCanvas.FAST_FRAME_UPDATE_INTERVAL) 
            {
                this._runningSlow = false;
            }

            if(this._fpsCounterEnabled)
            {
                this.updateFpsOverlay();
            }

            this._haltedFrameInterval = 0;
        }
    }

    /**
     * Draws the `:showstats` overlay — FPS, average render time, JS heap and any
     * halted-frame interval — top-right of the canvas, in screen space.
     *
     * AS3 drew two red Verdana-9 TextFields (var_478 with a black background,
     * var_381 without) whose text is
     * `"<fps> fps\nrender <ms>ms\nmem <MB> MB[\nhalted <ms>ms]"`. Here a single red
     * Text over a translucent black box reproduces the visible result. Refreshed
     * only on the periodic interval tick (~50 frames), never per frame.
     *
     * AS3: sources/win63_version/room/renderer/class_3523.as::calculateUpdateInterval()
     */
    // TS-only: AS3 printed its one figure with a plain `int()` cast, and this port floored it at
    // "<1.0". That floor is wrong for three channels being compared against each other: a frame
    // budget of 0.9 / 0.4 / 0.2 ms collapses to three identical "<1.0" and answers nothing. Two
    // decimals, no floor — the whole point of the split is telling small numbers apart.
    private static formatMillis(value: number): string
    {
        return value.toFixed(2);
    }

    private updateFpsOverlay(): void
    {
        if(!this._fpsOverlay)
        {
            this._fpsBackground = new Graphics();
            this._fpsText = new Text({
                text: '',
                style: {fontFamily: 'Verdana, sans-serif', fontSize: 9, fill: 0xff3300, lineHeight: 11, align: 'left'}
            });
            this._fpsText.x = 3;
            this._fpsText.y = 2;

            this._fpsOverlay = new Container();
            this._fpsOverlay.label = 'fpsCounter';
            this._fpsOverlay.eventMode = 'none';
            this._fpsOverlay.interactiveChildren = false;
            this._fpsOverlay.addChild(this._fpsBackground, this._fpsText);
            this._master.addChild(this._fpsOverlay);
        }

        const fps = this._averageUpdateInterval > 0 ? 1000 / this._averageUpdateInterval : 0;

        // AS3's single `render` figure is this port's `room` line: it only ever covered the inside
        // of render() above. `pixi` (draw submission) and `ui` (the Canvas2D window composite) are
        // this port's own stages and were invisible until FrameTimings; without them the overlay
        // cannot account for the frame, which is how a full-viewport per-frame blit went unnoticed.
        const room = RoomRenderingCanvas.formatMillis(this._averageRenderTime);
        const pixi = RoomRenderingCanvas.formatMillis(FrameTimings.average(FRAME_CHANNEL_PIXI));
        const ui = RoomRenderingCanvas.formatMillis(FrameTimings.average(FRAME_CHANNEL_UI));
        const net = RoomRenderingCanvas.formatMillis(FrameTimings.average(FRAME_CHANNEL_NET));

        // The room split is indented under its total: at 40 walking avatars `room` was the whole
        // frame, so the three sub-figures are the ones that decide what to fix.
        const roomObjects = RoomRenderingCanvas.formatMillis(FrameTimings.average(FRAME_CHANNEL_ROOM_OBJECTS));
        const roomSort = RoomRenderingCanvas.formatMillis(FrameTimings.average(FRAME_CHANNEL_ROOM_SORT));
        const roomSprites = RoomRenderingCanvas.formatMillis(FrameTimings.average(FRAME_CHANNEL_ROOM_SPRITES));

        let text = `${fps.toFixed(1)} fps\nroom ${room}ms`
            + `\n  obj ${roomObjects}ms\n  sort ${roomSort}ms\n  spr ${roomSprites}ms`
            + `\npixi ${pixi}ms\nui ${ui}ms\nnet ${net}ms`;

        // System.totalMemory in AS3; browsers only expose it via the non-standard
        // performance.memory (Chromium). Omit the line where it's unavailable.
        const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;

        if(memory)
        {
            text += `\nmem ${Math.round(memory.usedJSHeapSize / 1000000)} MB`;
        }

        if(this._haltedFrameInterval > 0)
        {
            text += `\nhalted ${Math.round(this._haltedFrameInterval)}ms`;
        }

        const label = this._fpsText!;

        label.text = text;

        const background = this._fpsBackground!;

        background.clear();
        background.rect(0, 0, label.width + 6, label.height + 4);
        background.fill({color: 0x000000, alpha: 0.6});

        // Top-left of the canvas (AS3 anchored it top-right; left is the requested layout).
        this._fpsOverlay.x = 4;
        this._fpsOverlay.y = 2;
        this._fpsOverlay.visible = true;
    }

    /**
     * Process a single room object's sprites into the SortableSprite list.
     * Based on AS3 RoomSpriteCanvas._Str_24532()
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as line 514
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::renderObject()
    private renderObject(
        object: IRoomObject,
        objectId: string,
        time: number,
        force: boolean,
        startIndex: number
    ): number 
    {
        const visualization = object.getVisualization() as IRoomObjectSpriteVisualization | null;

        if(visualization === null) 
        {
            this.disposeObjectSpriteCache(objectId);
            return 0;
        }

        const cache = this.getObjectSpriteCache(objectId);

        // Set every frame rather than only on creation: an id is cheap and a cache entry outlives
        // the object whose id it was keyed under only if the map key is reused, which it is not.
        cache.objectId = object.getId();

        const screenPos = this.getCachedScreenLocation(object, cache);

        if(screenPos === null) 
        {
            this.disposeObjectSpriteCache(objectId);
            return 0;
        }

        if(RoomCullingMode.avatars
            && RoomRenderingCanvas.AVATAR_CULLABLE_TYPES.has(object.getType())
            && !this.avatarNearViewport(screenPos))
        {
            // Only when it still holds something. A persistently off-screen avatar would otherwise
            // pay a dispose and a re-create every frame for a cache that is already empty, which at
            // nine hundred of them is its own cost.
            if(cache.sprites.length > 0)
            {
                this.disposeObjectSpriteCache(objectId);
            }

            // Zero, and the cache emptied with it, because the sortables it owns also live in the
            // shared `_sortableSpriteList`. Returning a count without releasing them would leave
            // stale entries to be sorted and drawn. This is the same path an object leaving the room
            // already takes.
            return 0;
        }

        // Update the visualization (may change sprite z-values)
        visualization.update(
            this._geometry,
            time,
            !cache.initialized || cache.spriteCount > 0 || force,
            this._skipObjectUpdate && this._runningSlow
        );

        if(cache.locationChanged) 
        {
            force = true;
        }

        // Screen center offset (AS3: screenX += _wd / 2, screenY += _ht / 2)
        const screenX = Math.floor(screenPos.x) + Math.floor(this._width / 2);
        const screenY = Math.floor(screenPos.y) + Math.floor(this._height / 2);

        // Base Z with sub-pixel offset (AS3: 1.2E-7 * x)
        let baseZ = screenPos.z;

        if(screenPos.x > 0)
        {
            baseZ += screenPos.x * 1.2e-7;
        }
        else 
        {
            baseZ += (-screenPos.x) * 1.2e-7;
        }

        // See the DEVIATION below `cache.screenY = screenY` for what these decide.
        const location = object.getLocation();
        const floorHeight = this.floorHeightAt?.(Math.round(location.x), Math.round(location.y)) ?? location.z;
        const onTile = !cache.accurateZ && floorHeight >= 0 && this.floorHeightAt !== null;
        const stacked = onTile && (location.z - floorHeight) > RoomRenderingCanvas.STACK_EPSILON;
        const raised = !cache.accurateZ && (this.raisedFloorAt?.(Math.round(location.x), Math.round(location.y)) ?? false);

        const instanceId = visualization.getInstanceId();
        const updateId = visualization.getUpdateID();

        // A resting object never takes the early-out: its sprites are re-based every frame after
        // the object loop, against a support that may itself have moved.
        if(!force &&
            !stacked &&
            cache.initialized &&
            cache.instanceId === instanceId &&
            cache.updateId === updateId &&
            cache.screenX === screenX &&
            cache.screenY === screenY &&
            cache.screenZ === baseZ)
        {
            if(onTile)
            {
                this.recordGroundFront(object, location, cache.groundFront);
            }

            return cache.spriteCount;
        }

        cache.initialized = true;
        cache.instanceId = instanceId;
        cache.updateId = updateId;
        cache.screenX = screenX;
        cache.screenY = screenY;

        // DEVIATION: an object resting on furniture drops the *backward* half of its layer offsets,
        //   so it outranks the thing holding it up. A positive layer offset sinks a sprite behind
        //   what shares its tile - classic3_floor2 carries z=4, so 4*sqrt(0.5)=2.828 - which is what
        //   keeps a rug under the chair standing on it. Correct on the ground, backwards once the
        //   item is stacked: measured, hc_exe_s_table spanned z=[3.574 .. 5.700] across its nine
        //   layers and the rug resting on it sat at 4.986, sandwiched between them and cut in half.
        //
        //   Altitude cannot arbitrate instead, and that is deliberate in the AS3: the canvas builds
        //   its geometry with the view at 30 degrees but the depth axis at 0.5 (RoomGeometry's 4th
        //   argument, _SafeCls_3073.as:175), giving depth=(-0.7071,-0.7071,-0.0087). A tile step is
        //   worth 0.7071 of depth and a whole unit of height 0.0087 - 1.2% of it. So Habbo sorts on
        //   floor position alone and shows this bug.
        //
        //   Resting on furniture is the whole condition, and `z > 0` is not it: every object on a
        //   raised floor tile carries that tile's own altitude, so testing against zero fired on all
        //   of them - which is how a furni standing on a platform came to draw over an avatar on the
        //   ground in front of it. The floor's altitude at the object's own tile is the datum, and
        //   only the canvas can reach it, which is why this is here and not in FurnitureVisualization.
        //
        //   Dropping the offsets is half of it, and on its own it does nothing here. Measured from
        //   the pack: `classic3_floor2` carries z=-4000/-8000, so +2.828/+5.657 - the clamp takes
        //   both to 0. `hc_exe_table` carries z=1000..3000, which through SizeData's `z / -1000` is
        //   *negative*: -0.707 .. -2.127. Six of its nine layers are therefore still in front of a
        //   clamped 0, and the rug went back under the table it stands on. Clamping cannot reach
        //   them - the offsets it removes are the stacked object's own, and the ones that beat it
        //   belong to the support. So the object's base depth is pulled forward as well.
        //
        //   How far is a per-tile question, not a per-height one. It used to be one scalar,
        //   STACK_LIFT = 2.5 per unit of height: sized for `hc_exe_table`, it pulled every stack
        //   2.5 depth units forward per unit - a one-unit stack 3.5 tiles, a four-high stack of
        //   crates fourteen - and drew it over an avatar standing on the tile in front, which sits
        //   only 0.7071 + 0.01 ahead. Now every object on the ground reports its most-forward
        //   sprite to `_tileGroundFront` for each tile it covers, and after the object loop a
        //   resting object is pulled to just ahead of that value on its own tile (STACK_TIE per
        //   unit of height orders the stack against itself). A plain support (p50 of the pack:
        //   0.071 forward) now lifts what rests on it by that much instead of by 2.5.
        //
        //   ponytail: two ceilings. A support whose front layers already reach past the next tile
        //   (a quarter of the pack reaches 0.709) takes what rests on it that far too - the same
        //   distance its own layers go in the AS3. And a resting object is keyed on its own origin
        //   tile, so it misses a support that covers some other tile under it only if that
        //   support's footprint does not include the origin.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3073.as::renderObject()
        //
        //   A negative floor height is not a floor: `RoomPlaneParser` writes TILE_BLOCKED (-110) and
        //   TILE_HOLE (-100) into the map, and fills the whole border of the room with the first of
        //   them. Read as an altitude those make everything above them look stacked by a hundred
        //   units - including the room object itself, whose location sits on one of those border
        //   tiles. That clamped every floor and wall plane's +1000 depth to 0 and put the room's own
        //   geometry in among the furniture.
        //
        //   And a wall item is not resting on anything either. It hangs on a wall, so
        //   `LegacyWallGeometry.getLocation()` gives it a z measured *up the wall* while the tile
        //   under it reads 0 - which makes every one of them look stacked by its own hanging
        //   height, permanently. Measured in a live room: `xmas08_icewall` at z=1.797 took a
        //   4.492 lift and had its +1.061 backward layer offset clamped to 0, so it drew about
        //   eight tiles too far forward - over an avatar standing in front of it. The two
        //   `external_image_wallitem_poster_small` beside it were identical. `accurateZ` is the
        //   discriminator and it is not a convenience: `object_accurate_z_value` is written on
        //   every wall item and only on wall items (AS3 `_SafeCls_90.as::addObjectWallItem()`
        //   l.3297, this port's `RoomEngine.addRoomObjectWallItem()`), and it means "this z is
        //   exact, do not round it to a tile" - which is the same thing as "not on a tile".
        if(stacked)
        {
            baseZ -= RoomRenderingCanvas.STACK_TIE * (location.z - floorHeight);
        }

        cache.screenZ = baseZ;

        const spriteCount = visualization.spriteCount;
        let localCount = 0;

        for(let i = 0; i < spriteCount; i++) 
        {
            const sprite = visualization.getSprite(i);

            if(sprite === null || !sprite.visible) 
            {
                continue;
            }

            // AS3: if(asset == null) continue
            if(sprite.texture === null) 
            {
                continue;
            }

            const finalX = screenX + sprite.offsetX + this._screenOffsetX;
            const finalY = screenY + sprite.offsetY + this._screenOffsetY;
            const spriteWidth = sprite.width > 0 ? sprite.width : sprite.texture.width;
            const spriteHeight = sprite.height > 0 ? sprite.height : sprite.texture.height;

            if(!this.rectangleVisible(finalX, finalY, spriteWidth, spriteHeight)) 
            {
                continue;
            }

            // Get or create SortableSprite.
            // AS3: RoomObjectSortableSpriteCacheItem.addSprite() pushes the new
            // SortableSprite into the per-object cache, and RoomSpriteCanvas pushes
            // that same reference into the global _sortableSpriteList only when it is
            // created. Existing cached sprites stay in the global list and keep the
            // previous sorted order between frames.
            let sortable: SortableSprite;

            if(localCount < cache.sprites.length) 
            {
                sortable = cache.sprites[localCount];
            }
            else 
            {
                sortable = new SortableSprite();
                cache.sprites.push(sortable);
                this._sortableSpriteList.push(sortable);
            }

            sortable.name = objectId;
            sortable.tileX = Math.round(location.x);
            sortable.tileY = Math.round(location.y);
            sortable.worldX = location.x;
            sortable.worldY = location.y;
            sortable.direction = object.getDirection()?.x ?? 0;
            sortable.objectType = object.getType();
            sortable.fadable = sprite.spriteType !== RoomObjectSpriteType.ROOM_PLANE && RoomRenderingCanvas.isFurni(sortable.objectType);
            sortable.sprite = sprite;

            // An avatar's drawn sprite is one composed bitmap and has no library asset name of its
            // own, so the canvas gives it the object's: `avatar_<id>`. Nothing resolves that name —
            // it is a key. `SpriteDataCollector.getFurniData()` looks for it to read the drawn
            // avatar's depth and baseline before merging in the figure's real part records.
            //
            // `i === 0` is the port's own guard and it is load-bearing. AS3 tests the sprite type
            // alone because an avatar there *is* one sprite; here, in sprite-parts mode, every body
            // part inherits `mainSprite.spriteType` (`AvatarVisualization.updatePartSprites()`), so
            // testing the type alone named all fifteen of them. Two consequences, both seen in a
            // photo: the parts stopped being dropped by `getSortableSpriteList()`'s empty-name
            // filter and went out as fifteen unresolvable `avatar_<id>` records, and the baseline
            // above was read off whichever part came first in the cache instead of off the whole
            // avatar — which drew the figure some thirty pixels above its own feet. Sprite 0 is the
            // composed image (`updateMainSprite()` takes `getSprite(0)`), and in sprite-parts mode
            // it is the textureless anchor, which the `sprite.texture === null` check above has
            // already skipped — so there, correctly, nothing is named at all.
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_3073.as::renderObject()
            if(i === 0
                && (sprite.spriteType === RoomObjectSpriteType.AVATAR
                    || sprite.spriteType === RoomObjectSpriteType.AVATAR_OWN))
            {
                sprite.libraryAssetName = object.getAvatarLibraryAssetName();
            }

            // AS3 bakes the mirror into the bitmap itself (getBitmapData(asset, name, flipH, flipV,
            // color)), so a flipped sprite keeps the same top-left origin and occupies the same rect
            // as an unflipped one. This port mirrors with Pixi's scale.x/y = -1 instead, which
            // reflects around the anchor at (0,0) and therefore throws the sprite a full width (or
            // height) off. Move the origin to the mirrored edge so the drawn pixels land exactly
            // where a baked flip would put them; the offsetX/offsetY above stay the visual top-left,
            // which is what rectangleVisible() culls against. Same correction the image path already
            // applies - see RoomObjectSpriteVisualization.createDisplaySprite().
            sortable.x = finalX - this._screenOffsetX + (sprite.flipH ? spriteWidth : 0);
            sortable.y = finalY - this._screenOffsetY + (sprite.flipV ? spriteHeight : 0);
            // See the DEVIATION above `const location` for why a stacked object loses the backward
            // half of its layer offsets. Negative ones are kept: they are what orders an avatar's
            // own parts, and its body against the furniture it stands on. Room planes are exempt
            // whatever the object looks like: their +1000 is what holds the floor and the walls
            // behind every object in the room, and nothing may be allowed to clamp it.
            let relativeDepth = stacked && sprite.spriteType !== RoomObjectSpriteType.ROOM_PLANE
                ? Math.min(sprite.relativeDepth, 0)
                : sprite.relativeDepth;

            // TS-only: on a raised tile the floor is a piece sorted RAISED_FLOOR_DEPTH behind the
            // tile, not +1000: a sprite set further back than that (an avatar's shadow is +1) would
            // go under the floor it stands on.
            if(raised && sprite.spriteType !== RoomObjectSpriteType.ROOM_PLANE)
            {
                relativeDepth = Math.min(relativeDepth, RAISED_SPRITE_DEPTH);
            }

            sortable.z = baseZ + relativeDepth + 3.7e-11 * (startIndex + localCount);

            localCount++;
        }

        cache.spriteCount = localCount;

        if(localCount < cache.sprites.length)
        {
            for(let i = localCount; i < cache.sprites.length; i++)
            {
                cache.sprites[i].dispose();
            }

            cache.sprites.length = localCount;
        }

        if(stacked)
        {
            cache.stackTile = RoomRenderingCanvas.tileKey(Math.round(location.x), Math.round(location.y));
            cache.stackHeight = location.z - floorHeight;
            cache.stackBase = baseZ;
            this._stackedThisFrame.push(cache);
        }
        else if(onTile)
        {
            let front = Infinity;

            for(let i = 0; i < localCount; i++)
            {
                const sortable = cache.sprites[i];

                if(sortable.sprite?.spriteType !== RoomObjectSpriteType.ROOM_PLANE && sortable.z < front)
                {
                    front = sortable.z;
                }
            }

            cache.groundFront = front;
            this.recordGroundFront(object, location, front);
        }

        return localCount;
    }

    // TS-only: see the DEVIATION in renderObject().
    private static tileKey(x: number, y: number): number
    {
        return x * 65536 + y;
    }

    /**
     * Reports a ground object's most-forward sprite depth on every tile of its footprint, the way
     * `TileObjectMap` walks it. Anything without a furniture size - an avatar, a pet - covers one.
     */
    // TS-only: see the DEVIATION in renderObject().
    private recordGroundFront(object: IRoomObject, location: IVector3d, front: number): void
    {
        if(front === Infinity) return;

        const model = object.getModel();
        let sizeX = Math.max(1, model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_X) || 1);
        let sizeY = Math.max(1, model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_Y) || 1);
        const direction = object.getDirection();
        const dir = direction ? Math.trunc((Math.trunc(direction.x + 45) % 360) / 90) : 0;

        if(dir === 1 || dir === 3)
        {
            const swap = sizeX;
            sizeX = sizeY;
            sizeY = swap;
        }

        const originX = Math.round(location.x);
        const originY = Math.round(location.y);

        for(let y = originY; y < originY + sizeY; y++)
        {
            for(let x = originX; x < originX + sizeX; x++)
            {
                const key = RoomRenderingCanvas.tileKey(x, y);
                const known = this._tileGroundFront.get(key);

                if(known === undefined || front < known)
                {
                    this._tileGroundFront.set(key, front);
                }
            }
        }
    }

    /**
     * Whether an avatar's anchor is close enough to the viewport to be worth updating.
     *
     * Anchor-based, and therefore generous rather than exact: the object's sprites are not built yet
     * — building them is what this is deciding whether to do — so there is no rectangle to test, only
     * the point they hang off. `AVATAR_CULL_MARGIN` covers how far they reach from it.
     *
     * Mirrors `rectangleVisible()`'s scale handling rather than reimplementing it differently, so the
     * two tests agree about where the viewport is.
     */
    // TS-only: see `RoomCullingMode`.
    private avatarNearViewport(screenPos: { x: number; y: number }): boolean
    {
        let x = Math.floor(screenPos.x) + Math.floor(this._width / 2) + this._screenOffsetX;
        let y = Math.floor(screenPos.y) + Math.floor(this._height / 2) + this._screenOffsetY;
        let top = RoomRenderingCanvas.AVATAR_CULL_MARGIN_TOP;
        let bottom = RoomRenderingCanvas.AVATAR_CULL_MARGIN_BOTTOM;
        let side = RoomRenderingCanvas.AVATAR_CULL_MARGIN_SIDE;

        if(this._scale !== 1)
        {
            x = (x - this._screenOffsetX) * this._scale + this._screenOffsetX;
            y = (y - this._screenOffsetY) * this._scale + this._screenOffsetY;
            top *= this._scale;
            bottom *= this._scale;
            side *= this._scale;
        }

        // The box the sprites would occupy against the viewport — the same intersection test
        // `rectangleVisible()` performs, on an estimated rectangle rather than a measured one.
        return (x + side) >= 0
            && (x - side) <= this._width
            && (y + bottom) >= 0
            && (y - top) <= this._height;
    }

    // AS3: sources/win63_version/room/renderer/class_3523.as::rectangleVisible()
    private rectangleVisible(x: number, y: number, width: number, height: number): boolean
    {
        if(this._skipSpriteVisibilityChecking) 
        {
            return true;
        }

        if(this._scale !== 1) 
        {
            x = (x - this._screenOffsetX) * this._scale + this._screenOffsetX;
            y = (y - this._screenOffsetY) * this._scale + this._screenOffsetY;
            width *= this._scale;
            height *= this._scale;
        }

        if(x < this._width && x + width >= 0 && y < this._height && y + height >= 0) 
        {
            if(!this._useExclusionRects) 
            {
                return true;
            }

            return this.rectangleVisibleWithExclusion(x, y, width, height);
        }

        return false;
    }

    /**
     * Culls a rect if it's fully contained within any registered exclusion
     * region. Dormant in AS3: the gating flag and exclusion list are declared
     * but never populated anywhere in class_3523.as, so this path is
     * unreachable there too — ported for structural parity.
     *
     * @see sources/win63_version/room/renderer/class_3523.as::rectangleVisibleWithExclusion() line 711
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::rectangleVisibleWithExclusion()
    private rectangleVisibleWithExclusion(x: number, y: number, width: number, height: number): boolean 
    {
        if(x < 0) 
        {
            width += x;
            x = 0;
        }

        if(y < 0) 
        {
            height += y;
            y = 0;
        }

        if(x + width >= this._width) 
        {
            width -= this._width + 1 - (x + width);
        }

        if(y + height >= this._height) 
        {
            height -= this._height + 1 - (y + height);
        }

        for(const rect of this._exclusionRects) 
        {
            if(x >= rect.left && x + width < rect.right && y >= rect.top && y + height < rect.bottom) 
            {
                return false;
            }
        }

        return true;
    }

    /** Get-or-create, exactly as AS3's does; the cache holder itself is folded into this class. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/cache/_SafeCls_4404.as::getObjectCache()
    private getObjectSpriteCache(objectId: string): IObjectSpriteCache
    {
        let cache = this._objectSpriteCaches.get(objectId);

        if(cache === undefined) 
        {
            cache = {
                // The map key is `<category>_<id>` for some callers and a bare id for others, so it
                // is not parseable; `renderObject()` sets the real one from the object itself.
                objectId: -1,
                initialized: false,
                instanceId: -1,
                updateId: -1,
                geometryUpdateId: -1,
                objectUpdateId: -1,
                objectUpdateLoc: new Vector3d(),
                screenLoc: new Vector3d(),
                roundedLoc: new Vector3d(),
                locationChanged: false,
                screenX: 0,
                screenY: 0,
                screenZ: 0,
                accurateZ: false,
                stackTile: 0,
                stackHeight: 0,
                stackBase: 0,
                groundFront: Infinity,
                spriteCount: 0,
                sprites: []
            };
            this._objectSpriteCaches.set(objectId, cache);
        }

        return cache;
    }

    private getCachedScreenLocation(object: IRoomObject, cache: IObjectSpriteCache): Vector3d | null 
    {
        const location = object.getLocation();
        const geometryUpdateId = this._geometry.updateId;
        const objectUpdateId = object.getUpdateID();
        let locationChanged = false;

        if(geometryUpdateId !== cache.geometryUpdateId || objectUpdateId !== cache.objectUpdateId) 
        {
            cache.objectUpdateId = objectUpdateId;

            if(geometryUpdateId !== cache.geometryUpdateId ||
                location.x !== cache.objectUpdateLoc.x ||
                location.y !== cache.objectUpdateLoc.y ||
                location.z !== cache.objectUpdateLoc.z) 
            {
                cache.geometryUpdateId = geometryUpdateId;
                cache.objectUpdateLoc.assign(location);
                locationChanged = true;
            }
        }

        cache.locationChanged = locationChanged;

        if(locationChanged) 
        {
            const screenLocation = this._geometry.getScreenPosition(location);

            if(screenLocation === null) 
            {
                return null;
            }

            const accurateZVariable = this._roomObjectContainer.roomObjectVariableAccurateZ;
            const accurateZ = accurateZVariable ? object.getModel().getNumber(accurateZVariable) : NaN;

            cache.accurateZ = !Number.isNaN(accurateZ) && accurateZ !== 0;

            if(Number.isNaN(accurateZ) || accurateZ === 0)
            {
                cache.roundedLoc.x = Math.round(location.x);
                cache.roundedLoc.y = Math.round(location.y);
                cache.roundedLoc.z = location.z;

                if(cache.roundedLoc.x !== location.x || cache.roundedLoc.y !== location.y) 
                {
                    const roundedScreenLocation = this._geometry.getScreenPosition(cache.roundedLoc);

                    cache.screenLoc.assign(screenLocation);

                    if(roundedScreenLocation !== null) 
                    {
                        cache.screenLoc.z = roundedScreenLocation.z;
                    }
                }
                else 
                {
                    cache.screenLoc.assign(screenLocation);
                }
            }
            else 
            {
                cache.screenLoc.assign(screenLocation);
            }

            cache.screenLoc.x = Math.round(cache.screenLoc.x);
            cache.screenLoc.y = Math.round(cache.screenLoc.y);
        }

        return cache.screenLoc;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/cache/_SafeCls_4404.as::removeObjectCache()
    private disposeObjectSpriteCache(objectId: string): void
    {
        const cache = this._objectSpriteCaches.get(objectId);

        if(cache !== undefined) 
        {
            for(let i = 0; i < cache.sprites.length; i++) 
            {
                cache.sprites[i].dispose();
            }

            cache.sprites.length = 0;
        }

        this._objectSpriteCaches.delete(objectId);
    }

    /**
     * Sees through what hides the player, as an RPG does with a building the player walks behind:
     *
     * - a raised floor building (RoomPlaneData.sortGroup: the raised tiles joined edge to edge) or a
     *   furni turns see-through, all of it, while it hides the player's own avatar, and only then.
     *   It hides it when, drawn after it, it is opaque somewhere the avatar is (hidesOwn()).
     * - the building whose side (a wall) is under the pointer turns see-through too, and that side
     *   lets the mouse through, so a tile behind a wall can be clicked. A top stays clickable: it is
     *   floor; so does a see-through furni.
     * - any other avatar a raised piece still hides is drawn again over everything, tinted and
     *   see-through, cut to the shape of the pieces in front of it (updateXray()).
     */
    // TS-only: no AS3 counterpart; Habbo had no floor anything could stand behind.
    private updateOcclusion(count: number): void
    {
        const list = this._sortableSpriteList;
        const groups = this._fadedGroups;
        const furni = this._fadedFurni;
        const own = this._ownIndices;

        groups.clear();
        furni.clear();
        own.length = 0;

        if(this.seeThrough)
        {
            for(let i = 0; i < count; i++)
            {
                const sprite = list[i]?.sprite;

                if(sprite?.texture && sprite.spriteType === RoomObjectSpriteType.AVATAR_OWN) own.push(i);
            }

            const mouseX = this._mouseLocationX;
            const mouseY = this._mouseLocationY;

            for(let j = 0; j < count; j++)
            {
                const entry = list[j];
                const piece = entry?.sprite?.piece ?? null;

                if(!entry?.sprite?.texture || (piece === null && !entry.fadable)) continue;

                if(piece !== null && groups.has(piece.group)) continue;
                if(piece === null && furni.has(entry.name)) continue;

                if(this.hidesOwn(j))
                {
                    if(piece !== null) groups.add(piece.group);
                    else furni.add(entry.name);
                }
                else if(piece !== null && piece.side && this.spriteHit(j, mouseX, mouseY))
                {
                    groups.add(piece.group);
                }
            }
        }

        for(let j = 0; j < count; j++)
        {
            const extSprite = this.getSprite(j);
            const entry = list[j];
            const sprite = entry?.sprite;

            if(extSprite === null || !sprite) continue;

            const piece = sprite.piece;
            const seeThrough = piece !== null ? groups.has(piece.group) : entry.fadable && furni.has(entry.name);

            if(seeThrough)
            {
                if(extSprite.alpha !== RoomRenderingCanvas.FADE_ALPHA) extSprite.alpha = RoomRenderingCanvas.FADE_ALPHA;
                extSprite.faded = true;
                extSprite.fadedSide = piece !== null && piece.side;
            }
            else if(extSprite.faded)
            {
                extSprite.faded = false;
                extSprite.fadedSide = false;
                extSprite.alpha = sprite.alpha / 255;
            }
        }

        this.updateXray(count);
    }

    /** True when the sprite drawn at `index` hides one of the player's own avatar sprites (hides()). */
    // TS-only: see updateOcclusion().
    private hidesOwn(index: number): boolean
    {
        for(const i of this._ownIndices)
        {
            if(i >= index) break;
            if(this.hides(i, index)) return true;
        }

        return false;
    }

    /**
     * True when the sprite drawn at `front` hides the one drawn at `back`: drawn after it, and
     * opaque at one of a few points where that one is opaque too.
     */
    // TS-only: see updateOcclusion().
    private hides(back: number, front: number): boolean
    {
        const behind = this.getSprite(back);
        const ahead = this.getSprite(front);

        if(behind === null || ahead === null || back >= front) return false;

        const [bl, bt, br, bb] = RoomRenderingCanvas.bounds(behind);
        const [fl, ft, fr, fb] = RoomRenderingCanvas.bounds(ahead);
        const left = Math.max(fl, bl);
        const top = Math.max(ft, bt);
        const right = Math.min(fr, br);
        const bottom = Math.min(fb, bb);

        if(left >= right || top >= bottom) return false;

        for(let gy = 0; gy < RoomRenderingCanvas.HIDE_PROBES; gy++)
        {
            for(let gx = 0; gx < RoomRenderingCanvas.HIDE_PROBES; gx++)
            {
                const x = left + (right - left) * (gx + 0.5) / RoomRenderingCanvas.HIDE_PROBES;
                const y = top + (bottom - top) * (gy + 0.5) / RoomRenderingCanvas.HIDE_PROBES;

                if(this.spriteHit(back, x, y) && this.spriteHit(front, x, y)) return true;
            }
        }

        return false;
    }

    /** A furni, by object type: not an avatar (user, pet, bot), the room or the tile cursor. */
    // TS-only: see SortableSprite.fadable.
    private static isFurni(type: string): boolean
    {
        return type !== RoomObjectUserTypes.USER && type !== RoomObjectUserTypes.PET && type !== RoomObjectUserTypes.BOT
            && type !== RoomObjectUserTypes.RENTABLE_BOT && type !== 'room' && type !== 'tile_cursor';
    }

    /** The drawn rectangle of a sprite, left, top, right, bottom (a mirrored one extends leftward). */
    // TS-only: see hidesOwn().
    private static bounds(sprite: ExtendedSprite): [number, number, number, number]
    {
        const width = sprite.texture.width;
        const height = sprite.texture.height;
        const left = sprite.scale.x < 0 ? sprite.x - width : sprite.x;
        const top = sprite.scale.y < 0 ? sprite.y - height : sprite.y;

        return [left, top, left + width, top + height];
    }

    /** True when the sprite drawn at `index` is opaque at canvas point (x, y), mirrors folded back. */
    // TS-only: the same fold as checkMouseHits().
    private spriteHit(index: number, x: number, y: number): boolean
    {
        const sprite = this.getSprite(index);

        if(sprite === null) return false;

        let localX = x - sprite.x;
        let localY = y - sprite.y;

        if(sprite.scale.x < 0) localX = -localX - 1;
        if(sprite.scale.y < 0) localY = -localY - 1;

        return sprite.hitTest(localX, localY);
    }

    /** Draws the room's light map (lighting), the lantern at the feet of the player's own avatar. */
    // TS-only: see the lighting setter.
    private updateLighting(count: number, time: number): void
    {
        const renderer = this.pixiRenderer?.() ?? null;

        if(this._lighting === null || renderer === null) return;

        const list = this._sortableSpriteList;
        let own: {x: number; y: number} | null = null;

        for(let i = 0; i < count && own === null; i++)
        {
            if(list[i]?.sprite?.spriteType === RoomObjectSpriteType.AVATAR_OWN) own = {x: list[i].worldX, y: list[i].worldY};
        }

        // Furni light the room as their own files say (FurnitureLights): the image a furni shows
        // tells how it lights, so its direction, state and animation are followed. One light per
        // furni, its brightest image's.
        let furni = 0;
        let emitters = 0;
        const glowing = this._furniLightOf;
        const best = this._furniLightBest;

        glowing.clear();
        best.clear();

        for(let i = 0; i < count && this._lighting.furniLights; i++)
        {
            const entry = list[i];
            const sprite = entry?.sprite;
            const frame = sprite?.visible && entry.fadable ? FurnitureLights.lightOf(sprite.assetName) : null;

            if(frame === null) continue;

            // The image that gives the light shows full bright.
            const drawn = this.getSprite(i);

            if(drawn !== null && drawn.texture !== Texture.EMPTY)
            {
                const emitter = this._emitters[emitters] ?? {texture: Texture.EMPTY, x: 0, y: 0, scaleX: 1, scaleY: 1};

                emitter.texture = drawn.texture;
                emitter.x = this._screenOffsetX + this._scale * drawn.x;
                emitter.y = this._screenOffsetY + this._scale * drawn.y;
                emitter.scaleX = this._scale * drawn.scale.x;
                emitter.scaleY = this._scale * drawn.scale.y;
                this._emitters[emitters++] = emitter;
            }

            let light = glowing.get(entry.name);

            if(light === undefined)
            {
                light = this._furniLights[furni] ?? {x: 0, y: 0, z: 0, color: 0, radius: 0, intensity: 0, facing: {x: 0, y: 0}};
                this._furniLights[furni++] = light;
                glowing.set(entry.name, light);
                best.set(entry.name, -1);
            }

            if(frame.level <= best.get(entry.name)!) continue;

            // Its front, from its direction: 0° faces -y, 90° +x, 180° +y, 270° -x.
            const angle = entry.direction * Math.PI / 180;

            best.set(entry.name, frame.level);
            light.x = entry.worldX + frame.x;
            light.y = entry.worldY + frame.y;
            light.z = Math.max(0, this._lighting.floor?.heightAt(entry.tileX, entry.tileY) ?? 0) + frame.z;
            light.color = frame.color;
            light.radius = frame.radius;
            light.intensity = frame.intensity * frame.level;
            light.height = 0;
            light.spread = frame.spread ?? undefined;
            light.facing = frame.spread === null ? undefined : light.facing ?? {x: 0, y: 0};

            if(light.facing)
            {
                light.facing.x = Math.sin(angle);
                light.facing.y = -Math.cos(angle);
            }
        }

        this._lighting.render(renderer, this._geometry, this._width, this._height, this._screenOffsetX, this._screenOffsetY, this._scale, own, time,
            this._furniLights, furni, this._emitters, emitters);
    }

    /**
     * Draws again, over everything, tinted and see-through, every avatar something still hides — a
     * raised floor piece or a furni that did not turn see-through — cut to the exact shape of what
     * hides it, so only what that covers shows through and what is still in view is not veiled.
     * Composed by hand in two textures the size of the avatar (erase blending), not with a Pixi
     * mask: a sprite mask over this layer drew nothing at all.
     */
    // TS-only: see updateOcclusion().
    private updateXray(count: number): void
    {
        const renderer = this.pixiRenderer?.() ?? null;
        const list = this._sortableSpriteList;
        const avatars = this._xrayAvatars;
        const occluders = this._xrayOccluders;
        let used = 0;

        if(avatars.size > 256) avatars.clear();

        for(const indices of avatars.values()) indices.length = 0;

        for(let i = 0; i < count && renderer !== null; i++)
        {
            const entry = list[i];
            const type = entry?.sprite?.spriteType;

            if(!entry?.sprite?.texture || (type !== RoomObjectSpriteType.AVATAR && type !== RoomObjectSpriteType.AVATAR_OWN)) continue;

            let indices = avatars.get(entry.name);

            if(indices === undefined)
            {
                indices = [];
                avatars.set(entry.name, indices);
            }

            indices.push(i);
        }

        for(const [name, indices] of avatars)
        {
            if(renderer === null || indices.length === 0) continue;

            occluders.length = 0;

            for(let j = indices[0] + 1; j < count; j++)
            {
                const entry = list[j];
                const piece = entry?.sprite?.piece ?? null;

                if(!entry?.sprite?.texture || entry.name === name) continue;

                const hiding = piece !== null ? !this._fadedGroups.has(piece.group) : entry.fadable && !this._fadedFurni.has(entry.name);

                if(!hiding) continue;

                for(const i of indices)
                {
                    if(i >= j) break;

                    if(this.hides(i, j))
                    {
                        occluders.push(j);
                        break;
                    }
                }
            }

            if(occluders.length === 0) continue;

            const slot = this.xraySlot(used++);
            let left = Infinity;
            let top = Infinity;
            let right = -Infinity;
            let bottom = -Infinity;

            for(const i of indices)
            {
                const sprite = this.getSprite(i);

                if(sprite === null) continue;

                const [l, t, r, b] = RoomRenderingCanvas.bounds(sprite);

                left = Math.min(left, l);
                top = Math.min(top, t);
                right = Math.max(right, r);
                bottom = Math.max(bottom, b);
            }

            left = Math.floor(left);
            top = Math.floor(top);

            const width = Math.max(1, Math.ceil(right) - left);
            const height = Math.max(1, Math.ceil(bottom) - top);

            if(slot.view.width !== width || slot.view.height !== height)
            {
                slot.cut.resize(width, height);
                slot.picture.resize(width, height);
                slot.white.width = width;
                slot.white.height = height;
            }

            // The cut: everywhere, minus what hides the avatar. Then the avatar, tinted, minus the cut:
            // what is left is the part hidden. One picture, so its parts do not darken where they meet.
            renderer.render({container: slot.white, target: slot.cut, clear: true});
            RoomRenderingCanvas.copyInto(slot.stamps, slot.stamp, occluders, i => this.getSprite(i), -left, -top, null);
            renderer.render({container: slot.stamp, target: slot.cut, clear: false});
            RoomRenderingCanvas.copyInto(slot.copies, slot.body, indices, i => this.getSprite(i), -left, -top, RoomRenderingCanvas.XRAY_TINT);
            renderer.render({container: slot.body, target: slot.picture, clear: true});
            renderer.render({container: slot.eraser, target: slot.picture, clear: false});
            slot.view.position.set(left, top);
            slot.view.visible = true;
        }

        for(let i = used; i < this._xraySlots.length; i++) this._xraySlots[i].view.visible = false;
    }

    /** The `n`th x-ray slot, made on first use (see updateXray()). */
    // TS-only: see updateXray().
    private xraySlot(n: number): IXraySlot
    {
        let slot = this._xraySlots[n];

        if(slot === undefined)
        {
            const cut = RenderTexture.create({width: 1, height: 1});
            const picture = RenderTexture.create({width: 1, height: 1});
            const white = new Sprite(Texture.WHITE);
            const stamp = new Container();
            const eraser = new Container();
            const view = new Sprite(picture);

            const cutSprite = new Sprite(cut);

            // The cut is taken away from what is under it (so are the stamps, copyInto()). Set on the
            // sprites themselves: a render() root's blend mode does not reach its children.
            cutSprite.blendMode = 'erase';
            eraser.addChild(cutSprite);
            view.alpha = RoomRenderingCanvas.XRAY_ALPHA;
            this._xray.addChild(view);
            slot = {view, cut, picture, white, stamp, stamps: [], body: new Container(), copies: [], eraser};
            this._xraySlots.push(slot);
        }

        return slot;
    }

    /**
     * Shows in `parent` a copy of each sprite drawn at `indices`, shifted by (dx, dy), reusing and
     * hiding the `pool`'s sprites; tinted for an x-ray copy, erasing for a stamp.
     */
    // TS-only: see updateXray().
    private static copyInto(pool: Sprite[], parent: Container, indices: number[], spriteAt: (i: number) => ExtendedSprite | null, dx: number, dy: number, tint: number | null): void
    {
        let n = 0;

        for(const i of indices)
        {
            const source = spriteAt(i);

            if(source === null) continue;

            let copy = pool[n];

            if(copy === undefined)
            {
                copy = new Sprite();

                if(tint !== null) copy.tint = tint;
                else copy.blendMode = 'erase';

                pool.push(copy);
                parent.addChild(copy);
            }

            copy.texture = source.texture;
            copy.position.set(source.x + dx, source.y + dy);
            copy.scale.set(source.scale.x, source.scale.y);
            copy.visible = true;
            n++;
        }

        for(let i = n; i < pool.length; i++) pool[i].visible = false;
    }

    private updateDisplayTransform(): void 
    {
        // The see-through avatars and their masks are drawn in _display's space.
        this._xray.position.set(this._screenOffsetX, this._screenOffsetY);
        this._xray.scale.set(this._scale);

        if(this._display.x !== this._screenOffsetX) 
        {
            this._display.x = this._screenOffsetX;
        }

        if(this._display.y !== this._screenOffsetY) 
        {
            this._display.y = this._screenOffsetY;
        }

        if(this._display.scale.x !== this._scale) 
        {
            this._display.scale.x = this._scale;
        }

        if(this._display.scale.y !== this._scale) 
        {
            this._display.scale.y = this._scale;
        }
    }

    /**
     * Update or create an ExtendedSprite at the given display index.
     * Based on AS3 RoomSpriteCanvas.updateSprite()
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as line 704
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::updateSprite()
    private updateSprite(index: number, sortable: SortableSprite): void 
    {
        const sprite = sortable.sprite;

        if(sprite === null) 
        {
            return;
        }

        let extSprite: ExtendedSprite;
        let isNewSprite = false;

        if(index >= this._spriteCount) 
        {
            // Need a new ExtendedSprite — pop from pool or create
            if(this._spritePool.length > 0) 
            {
                extSprite = this._spritePool.pop()!;
            }
            else 
            {
                extSprite = new ExtendedSprite();
            }

            this._display.addChild(extSprite);
            this._spriteCount++;
            isNewSprite = true;
        }
        else 
        {
            extSprite = this._display.children[index] as ExtendedSprite;

            if(!extSprite) 
            {
                return;
            }

            // Handle varyingDepth changes (AS3: remove and re-add)
            if(extSprite.varyingDepth !== sprite.varyingDepth) 
            {
                if(extSprite.varyingDepth && !sprite.varyingDepth) 
                {
                    this._display.removeChildAt(index);
                    this._spritePool.push(extSprite);
                    this.updateSprite(index, sortable);
                    return;
                }

                // Insert new sprite at this position
                const newSprite = this._spritePool.length > 0 ? this._spritePool.pop()! : new ExtendedSprite();
                this._display.addChildAt(newSprite, index);
                extSprite = newSprite;
                isNewSprite = true;
            }
        }

        // Update sprite properties if changed
        // AS3: if(_Str_17574(instanceId, updateId))
        if(extSprite.needsUpdate(sprite.instanceId, sprite.updateId)) 
        {
            extSprite.alphaTolerance = sprite.alphaTolerance;

            const alpha = sprite.alpha / 255;

            if(extSprite.alpha !== alpha) 
            {
                extSprite.alpha = alpha;
            }

            extSprite.identifier = sortable.name;
            extSprite.tag = sprite.tag;
            extSprite.varyingDepth = sprite.varyingDepth;
            extSprite.clickHandling = sprite.clickHandling;
            extSprite.skipMouseHandling = sprite.skipMouseHandling;

            // Set texture (AS3: bitmapData = getBitmapData(asset, ...))
            if(sprite.texture !== null) 
            {
                extSprite.setTexture(sprite.texture);
            }
            else 
            {
                extSprite.setTexture(null);
            }

            // AS3: updateEnterRoomEffect(extSprite, sprite, RoomEnterEffect.isVisualizationOn())
            // only applies the dim/reveal override for freshly created sprites — the
            // call on the update path always passes `false` in AS3 and is a no-op.
            this.updateEnterRoomEffect(extSprite, sprite.spriteType, isNewSprite && RoomEnterEffect.isVisualizationOn());

            // Handle flipping
            if(sprite.flipH) 
            {
                extSprite.scale.x = -1;
            }
            else 
            {
                extSprite.scale.x = 1;
            }

            if(sprite.flipV) 
            {
                extSprite.scale.y = -1;
            }
            else 
            {
                extSprite.scale.y = 1;
            }

            // Tint (color)
            if(sprite.color !== 0xFFFFFF) 
            {
                extSprite.tint = sprite.color;
            }
            else 
            {
                extSprite.tint = 0xFFFFFF;
            }

            // Blend mode
            extSprite.blendMode = sprite.blendMode as any;

            // Selection-highlight filters — mirror the room object sprite's filters (set by
            // FurnitureVisualization.filters, e.g. RoomObjectHighLighter's wired-pick desaturation)
            // onto the PixiJS display object. Runs only on the change path (needsUpdate gate), so no
            // per-frame filter churn.
            if(sprite.filters !== null && sprite.filters.length > 0)
            {
                extSprite.filters = sprite.filters as Filter[];
            }
            else if(extSprite.filters != null)
            {
                extSprite.filters = [];
            }
        }

        // Always update position
        if(extSprite.x !== sortable.x) 
        {
            extSprite.x = sortable.x;
        }

        if(extSprite.y !== sortable.y) 
        {
            extSprite.y = sortable.y;
        }

        extSprite.offsetX = sprite.offsetX;
        extSprite.offsetY = sprite.offsetY;
        extSprite.visible = true;

        this._activeSpriteCount = Math.max(this._activeSpriteCount, index + 1);
    }

    /**
     * Applies the new-user room-enter dim/reveal override to a freshly created
     * sprite. Dormant unless RoomEnterEffect.init() has been triggered elsewhere
     * (habbo/toolbar NUX flow), matching AS3 behavior where this is a no-op until
     * the effect is armed.
     *
     * @see sources/win63_version/room/renderer/class_3523.as::updateEnterRoomEffect() line 879
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::updateEnterRoomEffect()
    private updateEnterRoomEffect(extSprite: ExtendedSprite, spriteType: number, active: boolean): void 
    {
        if(!active || extSprite.texture === Texture.EMPTY) 
        {
            return;
        }

        switch(spriteType) 
        {
            case RoomObjectSpriteType.ROOM_PLANE:
                extSprite.alpha = RoomEnterEffect.getDelta(0.9);
                break;
            case RoomObjectSpriteType.AVATAR:
                extSprite.alpha = RoomEnterEffect.getDelta(0.5);
                break;
            case RoomObjectSpriteType.AVATAR_OWN:
                break;
            default:
                extSprite.alpha = RoomEnterEffect.getDelta(0.1);
                break;
        }
    }

    /**
     * Hide or pool unused sprites beyond the active count.
     * Based on AS3 RoomSpriteCanvas._Str_20677()
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::cleanSprites()
    private cleanSprites(activeCount: number): void 
    {
        if(activeCount < this._activeSpriteCount || this._activeSpriteCount === 0) 
        {
            for(let i = this._spriteCount - 1; i >= activeCount; i--) 
            {
                const extSprite = this._display.children[i] as ExtendedSprite;

                if(extSprite) 
                {
                    extSprite.setTexture(null);
                    extSprite.visible = false;
                }
            }
        }

        this._activeSpriteCount = activeCount;
    }

    /**
     * Get an ExtendedSprite at the given display index.
     * AS3: getSprite()
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::getSprite()
    private getSprite(index: number): ExtendedSprite | null 
    {
        if(index < 0 || index >= this._spriteCount) 
        {
            return null;
        }

        return this._display.children[index] as ExtendedSprite ?? null;
    }

    /**
     * Core hit-test method. Iterates sprites in reverse order (front to back).
     * Based on AS3 RoomSpriteCanvas._Str_19207()
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as line 1069
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::checkMouseHits()
    private checkMouseHits(
        x: number, y: number, type: string,
        altKey: boolean = false, ctrlKey: boolean = false,
        shiftKey: boolean = false, buttonDown: boolean = false
    ): boolean 
    {
        let wasHit = false;
        const hitObjectIds: Set<string> = new Set();

        // Iterate from frontmost to backmost (AS3: i from _activeSpriteCount-1 downto 0)
        for(let i = this._activeSpriteCount - 1; i >= 0; i--) 
        {
            const extSprite = this.getSprite(i);

            // A faded side (updateOcclusion()) lets the mouse through to what it was hiding.
            if(extSprite === null || !extSprite.visible || extSprite.fadedSide) 
            {
                continue;
            }

            // Hit test in sprite-local coordinates.
            // A mirrored sprite is drawn with a negative scale anchored on its mirrored edge (see
            // where sortable.x/y are computed), so screen-space deltas run backwards for it and land
            // in [-size, 0) - which hitTest() rejects outright, making every flipped sprite
            // unclickable. Fold the delta back into texture space, which is what hitTest() probes:
            // for width W the visual offset is localX + W, and the mirrored column is
            // W - 1 - (localX + W) = -localX - 1. AS3 needs none of this because it bakes the flip
            // into the bitmap, so its draw and its hit test share one orientation.
            let localX = x - extSprite.x;
            let localY = y - extSprite.y;

            if(extSprite.scale.x < 0) localX = -localX - 1;
            if(extSprite.scale.y < 0) localY = -localY - 1;

            if(!extSprite.hitTest(localX, localY))
            {
                continue;
            }

            if(extSprite.skipMouseHandling) 
            {
                continue;
            }

            // Skip click-handling sprites for non-click events (AS3 pattern)
            if(extSprite.clickHandling && (type === 'click' || type === 'doubleClick')) 
            {
                continue;
            }

            const objectId = extSprite.identifier;

            if(hitObjectIds.has(objectId)) 
            {
                continue;
            }

            const spriteTag = extSprite.tag;
            const activeData = this._mouseActiveObjects.get(objectId);

            // Handle roll-over/roll-out transitions
            if(activeData !== undefined && activeData.spriteTag !== spriteTag) 
            {
                const rollOutEvent = this.createMouseEvent(
                    0, 0, 0, 0, 'rollOut', activeData.spriteTag,
                    altKey, ctrlKey, shiftKey, buttonDown
                );

                this.bufferMouseEvent(rollOutEvent, objectId);
            }

            let event: RoomSpriteMouseEvent;

            if(type === 'mouseMove' && (activeData === undefined || activeData.spriteTag !== spriteTag)) 
            {
                // New object or different sprite → send roll_over
                event = this.createMouseEvent(
                    x, y, localX, localY,
                    'rollOver', spriteTag,
                    altKey, ctrlKey, shiftKey, buttonDown
                );
            }
            else 
            {
                event = this.createMouseEvent(
                    x, y, localX, localY,
                    type, spriteTag,
                    altKey, ctrlKey, shiftKey, buttonDown
                );
                event.spriteOffsetX = extSprite.offsetX;
                event.spriteOffsetY = extSprite.offsetY;
            }

            // Update active object tracking
            if(activeData === undefined) 
            {
                const newData = new ObjectMouseData();

                newData.objectId = objectId;
                newData.spriteTag = spriteTag;

                this._mouseActiveObjects.set(objectId, newData);
            }
            else 
            {
                activeData.spriteTag = spriteTag;
            }

            // Only buffer if coordinates changed, or it's not mouse_move
            if(type !== 'mouseMove' || x !== this._mouseOldX || y !== this._mouseOldY) 
            {
                this.bufferMouseEvent(event, objectId);
            }

            hitObjectIds.add(objectId);
            wasHit = true;
        }

        // Generate roll_out events for objects no longer under the mouse
        // AS3: iterate _mouseActiveObjects keys, remove those not in hitObjectIds
        const keysToRemove: string[] = [];

        for(const [objectId, data] of this._mouseActiveObjects) 
        {
            if(!hitObjectIds.has(objectId)) 
            {
                const rollOutEvent = this.createMouseEvent(
                    0, 0, 0, 0, 'rollOut', data.spriteTag,
                    altKey, ctrlKey, shiftKey, buttonDown
                );
                this.bufferMouseEvent(rollOutEvent, objectId);
                keysToRemove.push(objectId);
            }
        }

        for(const key of keysToRemove) 
        {
            this._mouseActiveObjects.delete(key);
        }

        // Process all buffered events
        this.processMouseEvents();

        this._mouseOldX = x;
        this._mouseOldY = y;

        return wasHit;
    }

    /**
     * Hit-tests only clickHandling sprites (ad-banner furniture with a click
     * URL) for a click/doubleClick, independent of the normal roll-over/click
     * routing in checkMouseHits() (which deliberately skips clickHandling
     * sprites for click events).
     *
     * @see sources/win63_version/room/renderer/class_3523.as::checkMouseClickHits() line 1133
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::checkMouseClickHits()
    private checkMouseClickHits(
        x: number, y: number, isDoubleClick: boolean,
        altKey: boolean = false, ctrlKey: boolean = false,
        shiftKey: boolean = false, buttonDown: boolean = false
    ): boolean 
    {
        const type = isDoubleClick ? 'doubleClick' : 'click';
        const hitObjectIds: Set<string> = new Set();
        let wasHit = false;

        for(let i = this._activeSpriteCount - 1; i >= 0; i--) 
        {
            const extSprite = this.getSprite(i);

            if(extSprite === null || !extSprite.clickHandling || extSprite.fadedSide) 
            {
                continue;
            }

            const localX = x - extSprite.x;
            const localY = y - extSprite.y;

            if(extSprite.hitTest(localX, localY)) 
            {
                const objectId = extSprite.identifier;

                if(!hitObjectIds.has(objectId)) 
                {
                    const spriteTag = extSprite.tag;
                    const event = this.createMouseEvent(
                        x, y, localX, localY,
                        type, spriteTag,
                        altKey, ctrlKey, shiftKey, buttonDown
                    );

                    this.bufferMouseEvent(event, objectId);
                    hitObjectIds.add(objectId);
                }
            }

            wasHit = true;
        }

        this.processMouseEvents();

        return wasHit;
    }

    /**
     * Create a RoomSpriteMouseEvent.
     * Based on AS3 RoomSpriteCanvas._Str_11609()
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::createMouseEvent()
    private createMouseEvent(
        x: number, y: number,
        localX: number, localY: number,
        type: string, spriteTag: string,
        altKey: boolean, ctrlKey: boolean,
        shiftKey: boolean, buttonDown: boolean
    ): RoomSpriteMouseEvent 
    {
        // AS3: screenX = x - (wd/2), screenY = y - (ht/2)
        const screenX = x - Math.floor(this._width / 2);
        const screenY = y - Math.floor(this._height / 2);
        const canvasId = `canvas_${this._id}`;
        const eventId = `${canvasId}_${this._eventId}`;

        return new RoomSpriteMouseEvent(
            type, eventId, canvasId, spriteTag,
            screenX, screenY,
            localX, localY,
            ctrlKey, altKey, shiftKey, buttonDown
        );
    }

    private normalizeMouseEventType(type: string): string 
    {
        switch(type) 
        {
            case 'mouse_move':
                return 'mouseMove';
            case 'mouse_down':
                return 'mouseDown';
            case 'mouse_up':
                return 'mouseUp';
            case 'double_click':
                return 'doubleClick';
            case 'roll_over':
                return 'rollOver';
            case 'roll_out':
                return 'rollOut';
            default:
                return type;
        }
    }

    /**
     * Buffer a mouse event for later processing.
     * Based on AS3 RoomSpriteCanvas._Str_14715()
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::bufferMouseEvent()
    private bufferMouseEvent(event: RoomSpriteMouseEvent, objectId: string): void 
    {
        this._eventCache.set(objectId, event);
    }

    /**
     * Process all buffered mouse events by dispatching to room objects.
     * Based on AS3 RoomSpriteCanvas._Str_20604()
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomSpriteCanvas.as line 1175
     */
    // AS3: sources/win63_version/room/renderer/class_3523.as::processMouseEvents()
    private processMouseEvents(): void 
    {
        for(const [objectId, event] of this._eventCache) 
        {
            const object = this.findObjectById(objectId);

            if(!object) 
            {
                continue;
            }

            if(this._mouseListener) 
            {
                this._mouseListener.processRoomCanvasMouseEvent(event, object, this._geometry);
            }
            else 
            {
                const handler = object.getMouseHandler();

                if(handler) 
                {
                    handler.mouseEvent(event, this._geometry);
                }
            }
        }

        this._eventCache.clear();
    }

    /**
     * Find a room object by its composite objectId string.
     * AS3: container.getRoomObject(objectId)
     */
    private findObjectById(objectId: string): IRoomObject | null 
    {
        return this._roomObjectContainer.getRoomObject(objectId);
    }
}
