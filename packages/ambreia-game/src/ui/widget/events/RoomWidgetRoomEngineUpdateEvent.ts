import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

/**
 * The room switched between normal and game mode. Widgets that must not be reachable during a
 * game — the me-menu among them — listen for this rather than polling the engine.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRoomEngineUpdateEvent.as
 */
export class RoomWidgetRoomEngineUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: .../widget/events/RoomWidgetRoomEngineUpdateEvent.as::GAME_MODE
    public static readonly GAME_MODE: string = 'RWREUE_GAME_MODE';

    // AS3: .../widget/events/RoomWidgetRoomEngineUpdateEvent.as::NORMAL_MODE
    public static readonly NORMAL_MODE: string = 'RWREUE_NORMAL_MODE';

    // AS3: .../widget/events/RoomWidgetRoomEngineUpdateEvent.as::_roomId
    // Name DERIVED (`_SafeStr_6722`): the field behind `get roomId()`.
    private _roomId: number = 0;

    // AS3: .../widget/events/RoomWidgetRoomEngineUpdateEvent.as::RoomWidgetRoomEngineUpdateEvent()
    // The two Flash Event flags AS3 forwards are dropped.
    constructor(type: string, roomId: number)
    {
        super(type);

        this._roomId = roomId;
    }

    // AS3: .../widget/events/RoomWidgetRoomEngineUpdateEvent.as::get roomId()
    public get roomId(): number
    {
        return this._roomId;
    }
}
