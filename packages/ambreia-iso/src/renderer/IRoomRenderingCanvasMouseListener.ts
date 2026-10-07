/**
 * IRoomRenderingCanvasMouseListener
 *
 * Based on AS3: com.sulake.room.renderer.IRoomRenderingCanvasMouseListener
 *
 * Listener interface for processing mouse events from a rendering canvas.
 *
 * @see sources/win63_version/room/renderer/IRoomRenderingCanvasMouseListener.as
 */
import type {RoomSpriteMouseEvent} from '../events/RoomSpriteMouseEvent';
import type {IRoomObject} from '../object/IRoomObject';
import type {IRoomGeometry} from '../utils/IRoomGeometry';

export interface IRoomRenderingCanvasMouseListener
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvasMouseListener.as::processRoomCanvasMouseEvent()
    processRoomCanvasMouseEvent(event: RoomSpriteMouseEvent, object: IRoomObject, geometry: IRoomGeometry): void;
}
