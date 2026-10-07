/**
 * IRoomRendererBase
 *
 * Based on AS3: com.sulake.room.renderer.IRoomRendererBase
 *
 * Base interface for room renderers. Provides object management and update cycle.
 *
 * @see sources/win63_version/room/renderer/IRoomRendererBase.as
 */
import type {IRoomObject} from '../object/IRoomObject';

export interface IRoomRendererBase
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRendererBase.as::dispose()
    dispose(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRendererBase.as::reset()
    reset(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRendererBase.as::feedRoomObject()
    feedRoomObject(object: IRoomObject): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRendererBase.as::removeRoomObject()
    removeRoomObject(object: IRoomObject): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRendererBase.as::update()
    update(time: number): void;
}
