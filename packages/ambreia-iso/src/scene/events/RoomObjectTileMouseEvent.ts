/**
 * RoomObjectTileMouseEvent
 *
 * @see source_as_win63/habbo/room/events/RoomObjectTileMouseEvent.as
 *
 * Mouse event for tile interactions with tile coordinates.
 */
import {RoomObjectMouseEvent} from '../../events/RoomObjectMouseEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectTileMouseEvent extends RoomObjectMouseEvent
{
    constructor(
        type: string,
        object: IRoomObject | null,
        eventId: string,
        tileX: number,
        tileY: number,
        tileZ: number,
        altKey: boolean = false,
        ctrlKey: boolean = false,
        shiftKey: boolean = false,
        buttonDown: boolean = false
    )
    {
        super(type, object, eventId, altKey, ctrlKey, shiftKey, buttonDown);
        this._tileX = tileX;
        this._tileY = tileY;
        this._tileZ = tileZ;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectTileMouseEvent.as::_tileX
    private _tileX: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectTileMouseEvent.as::get tileX()
    get tileX(): number
    {
        return this._tileX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectTileMouseEvent.as::_tileY
    private _tileY: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectTileMouseEvent.as::get tileY()
    get tileY(): number
    {
        return this._tileY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectTileMouseEvent.as::_tileZ
    private _tileZ: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectTileMouseEvent.as::get tileZ()
    get tileZ(): number
    {
        return this._tileZ;
    }

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectTileMouseEvent.as::get tileXAsInt()
    get tileXAsInt(): number
    {
        return Math.trunc(this._tileX + 0.499);
    }

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectTileMouseEvent.as::get tileYAsInt()
    get tileYAsInt(): number
    {
        return Math.trunc(this._tileY + 0.499);
    }

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectTileMouseEvent.as::get tileZAsInt()
    get tileZAsInt(): number
    {
        return Math.trunc(this._tileZ + 0.499);
    }
}
