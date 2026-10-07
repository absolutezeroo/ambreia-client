/**
 * RoomEngineDragWithMouseEvent
 *
 * @see source_as_win63/habbo/room/events/RoomEngineDragWithMouseEvent.as
 *
 * Event dispatched when drag operations begin or end in the room.
 */
import {RoomEngineEvent} from './RoomEngineEvent';

export class RoomEngineDragWithMouseEvent extends RoomEngineEvent
{
    public static readonly DRAG_START = 'REDWME_DRAG_START';
    public static readonly DRAG_END = 'REDWME_DRAG_END';

    constructor(type: string, roomId: number)
    {
        super(type, roomId);
    }
}
