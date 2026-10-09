/**
 * SortableSprite
 *
 * Based on AS3: com.sulake.room.renderer.utils.SortableSprite
 *
 * Holds sprite data and z-order for sorting during canvas rendering.
 * The canvas builds a flat list of SortableSprites each frame,
 * sorts by z descending, then maps to ExtendedSprite display children.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as
 */
import type {IRoomObjectSprite} from '../../../object/visualization/IRoomObjectSprite';
import type {ISortableSprite} from '../../../object/visualization/ISortableSprite';

export class SortableSprite implements ISortableSprite
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::Z_INFINITY
    public static readonly Z_INFINITY: number = 100000000;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::name
    public name: string = '';

    /** The tile its object stands on, and whether it may fade (RoomRenderingCanvas.updateOcclusion()). */
    // TS-only: see RoomRenderingCanvas.updateOcclusion().
    public tileX: number = 0;
    // TS-only: see tileX.
    public tileY: number = 0;
    // TS-only: see tileX. A furni, not an avatar, a room plane or the tile cursor.
    public fadable: boolean = false;
    // TS-only: its object's type (a furni's class name), for the lights it gives (updateLighting()).
    public objectType: string = '';
    // TS-only: where its object stands, in tiles, unrounded: a lantern follows a walking avatar smoothly.
    public worldX: number = 0;
    // TS-only: see worldX.
    public worldY: number = 0;
    // TS-only: which way its object faces, in degrees (a furni's rotation × 45): a screen lights its front.
    public direction: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::_x
    private _x: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::get x()
    get x(): number 
    {
        return this._x;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::set x()
    set x(value: number) 
    {
        this._x = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::_y
    private _y: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::get y()
    get y(): number 
    {
        return this._y;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::set y()
    set y(value: number) 
    {
        this._y = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::_z
    private _z: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::get z()
    get z(): number 
    {
        return this._z;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::set z()
    set z(value: number) 
    {
        this._z = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::_sprite
    private _sprite: IRoomObjectSprite | null = null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::get sprite()
    get sprite(): IRoomObjectSprite | null 
    {
        return this._sprite;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::set sprite()
    set sprite(value: IRoomObjectSprite | null) 
    {
        this._sprite = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/SortableSprite.as::dispose()
    dispose(): void 
    {
        this._sprite = null;
        this._z = -(SortableSprite.Z_INFINITY);
    }
}
