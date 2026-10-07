/**
 * IRoomRendererFactory
 *
 * Based on AS3: com.sulake.room.renderer.IRoomRendererFactory
 *
 * Factory interface for creating room renderer instances.
 *
 * @see sources/win63_version/room/renderer/IRoomRendererFactory.as
 */
import type {IRoomRenderer} from './IRoomRenderer';

export interface IRoomRendererFactory
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRendererFactory.as::createRenderer()
    createRenderer(): IRoomRenderer;
}
