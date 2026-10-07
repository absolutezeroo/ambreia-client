/**
 * RoomEngineRoomColorEvent
 *
 * Based on AS3: com.sulake.habbo.room.events.RoomEngineRoomColorEvent
 *
 * Event for room color changes.
 */
import {RoomEngineEvent} from './RoomEngineEvent';

export class RoomEngineRoomColorEvent extends RoomEngineEvent
{
    public static readonly RERCE_ROOM_COLOR = 'RERCE_ROOM_COLOR';

    constructor(roomId: number, color: number, light: number, backgroundOnly: boolean)
    {
        super(RoomEngineRoomColorEvent.RERCE_ROOM_COLOR, roomId);
        this._color = color;
        this._light = light;
        this._backgroundOnly = backgroundOnly;
    }

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineRoomColorEvent.as::_color
    private _color: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineRoomColorEvent.as::get color()
    get color(): number
    {
        return this._color;
    }

    private _light: number;

    get light(): number
    {
        return this._light;
    }

    private _backgroundOnly: boolean;

    get backgroundOnly(): boolean
    {
        return this._backgroundOnly;
    }
}
