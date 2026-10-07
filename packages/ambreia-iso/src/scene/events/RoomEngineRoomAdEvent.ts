/**
 * RoomEngineRoomAdEvent
 *
 * @see source_as_win63/habbo/room/events/RoomEngineRoomAdEvent.as
 *
 * Event dispatched for room advertisement interactions at the engine level.
 */
import {RoomEngineObjectEvent} from './RoomEngineObjectEvent';

export class RoomEngineRoomAdEvent extends RoomEngineObjectEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineRoomAdEvent.as::FURNI_CLICK
    public static readonly FURNI_CLICK = 'RERAE_FURNI_CLICK';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineRoomAdEvent.as::FURNI_DOUBLE_CLICK
    public static readonly FURNI_DOUBLE_CLICK = 'RERAE_FURNI_DOUBLE_CLICK';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineRoomAdEvent.as::TOOLTIP_SHOW
    public static readonly TOOLTIP_SHOW = 'RERAE_TOOLTIP_SHOW';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineRoomAdEvent.as::TOOLTIP_HIDE
    public static readonly TOOLTIP_HIDE = 'RERAE_TOOLTIP_HIDE';

    constructor(type: string, roomId: number, objectId: number, category: number)
    {
        super(type, roomId, objectId, category);
    }
}
