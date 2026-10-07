/**
 * HabboRoomRenderer
 *
 * Concrete room renderer for Habbo room canvases.
 *
 * AS3 RoomEngine.createRoomCanvas() obtains an IRoomRenderer from the room
 * renderer factory, attaches it to the room instance, then asks it to create
 * the IRoomRenderingCanvas. The base RoomRenderer keeps that lifecycle; this
 * subclass provides the Habbo RoomRenderingCanvas implementation.
 */
import {RoomRenderer} from '../../renderer/RoomRenderer';
import type {IRoomRenderingCanvas} from '../../renderer/IRoomRenderingCanvas';
import {RoomRenderingCanvas} from './RoomRenderingCanvas';

export class HabboRoomRenderer extends RoomRenderer
{
    protected override createCanvasInstance(id: number, width: number, height: number, scale: number): IRoomRenderingCanvas
    {
        return new RoomRenderingCanvas(this, id, width, height, scale);
    }
}
