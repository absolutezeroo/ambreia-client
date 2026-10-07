/**
 * RoomObjectWallMouseEvent
 *
 * @see source_as_win63/habbo/room/events/RoomObjectWallMouseEvent.as
 *
 * Mouse event for wall interactions with wall geometry.
 */
import {RoomObjectMouseEvent} from '../../events/RoomObjectMouseEvent';
import type {IRoomObject} from '../../object/IRoomObject';
import type {IVector3d} from '../../utils/IVector3d';
import {Vector3d} from '../../utils/Vector3d';

export class RoomObjectWallMouseEvent extends RoomObjectMouseEvent
{
    constructor(
        type: string,
        object: IRoomObject | null,
        eventId: string,
        wallLocation: IVector3d,
        wallWidth: IVector3d,
        wallHeight: IVector3d,
        x: number,
        y: number,
        direction: number,
        altKey: boolean = false,
        ctrlKey: boolean = false,
        shiftKey: boolean = false,
        buttonDown: boolean = false
    )
    {
        super(type, object, eventId, altKey, ctrlKey, shiftKey, buttonDown);
        this._wallLocation = new Vector3d();
        this._wallLocation.assign(wallLocation);
        this._wallWidth = new Vector3d();
        this._wallWidth.assign(wallWidth);
        this._wallHeight = new Vector3d();
        this._wallHeight.assign(wallHeight);
        this._x = x;
        this._y = y;
        this._direction = direction;
    }

    private _wallLocation: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectWallMouseEvent.as::get wallLocation()
    get wallLocation(): IVector3d
    {
        return this._wallLocation;
    }

    private _wallWidth: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectWallMouseEvent.as::get wallWidth()
    get wallWidth(): IVector3d
    {
        return this._wallWidth;
    }

    private _wallHeight: Vector3d;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectWallMouseEvent.as::get wallHeight()
    get wallHeight(): IVector3d
    {
        return this._wallHeight;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectWallMouseEvent.as::_x
    private _x: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectWallMouseEvent.as::get x()
    get x(): number
    {
        return this._x;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectWallMouseEvent.as::_y
    private _y: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectWallMouseEvent.as::get y()
    get y(): number
    {
        return this._y;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectWallMouseEvent.as::_direction
    private _direction: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectWallMouseEvent.as::get direction()
    get direction(): number
    {
        return this._direction;
    }
}
