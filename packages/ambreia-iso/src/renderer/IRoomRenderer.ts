/**
 * IRoomRenderer
 *
 * Based on AS3: com.sulake.room.renderer.IRoomRenderer
 *
 * Extended renderer interface that adds canvas management on top of the base renderer.
 *
 * @see sources/win63_version/room/renderer/IRoomRenderer.as
 */
import type {IRoomRendererBase} from './IRoomRendererBase';
import type {IRoomRenderingCanvas} from './IRoomRenderingCanvas';

export interface IRoomRenderer extends IRoomRendererBase
{
    roomObjectVariableAccurateZ: string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderer.as::createCanvas()
    createCanvas(id: number, width: number, height: number, scale: number): IRoomRenderingCanvas;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderer.as::getCanvas()
    getCanvas(id: number): IRoomRenderingCanvas | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderer.as::disposeCanvas()
    disposeCanvas(id: number): boolean;
}
