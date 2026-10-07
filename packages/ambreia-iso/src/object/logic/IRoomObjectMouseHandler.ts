/**
 * IRoomObjectMouseHandler Interface
 *
 * Based on AS3: com.sulake.room.object.logic.IRoomObjectMouseHandler
 *
 * Interface for handling mouse events on room objects.
 */
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';

export interface IRoomObjectMouseHandler
{
    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectMouseHandler.as::mouseEvent()
    mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void;
}
