/**
 * RoomEngineZoomEvent
 *
 * @see source_as_win63/habbo/room/events/RoomEngineZoomEvent.as
 *
 * Event dispatched when the room zoom level changes.
 */
import {RoomEngineEvent} from './RoomEngineEvent';

export class RoomEngineZoomEvent extends RoomEngineEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineZoomEvent.as::ROOM_ZOOM
    public static readonly ROOM_ZOOM = 'REE_ROOM_ZOOM';

    constructor(roomId: number, level: number, isFlipForced: boolean = false)
    {
        super(RoomEngineZoomEvent.ROOM_ZOOM, roomId);
        this._level = level;
        this._isFlipForced = isFlipForced;
    }

    private _level: number = 1;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineZoomEvent.as::get level()
    get level(): number
    {
        return this._level;
    }

    private _isFlipForced: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineZoomEvent.as::get isFlipForced()
    get isFlipForced(): boolean
    {
        return this._isFlipForced;
    }
}
