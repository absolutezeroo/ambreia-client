/**
 * RoomRendererFactory
 *
 * Based on AS3: com.sulake.room.renderer.class_2015
 *
 * Factory component that creates RoomRenderer instances.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomRendererFactory.as
 */
import type {IRoomRendererFactory} from './IRoomRendererFactory';
import type {IRoomRenderer} from './IRoomRenderer';
import {RoomRenderer} from './RoomRenderer';

// DEVIATION: a Component in AS3; a plain class registered with attachInstance since J4.
export class RoomRendererFactory implements IRoomRendererFactory
{
    /**
	 * Create a new room renderer.
	 *
	 * @see AS3 class_2015 lines 16-19
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomRendererFactory.as::createRenderer()
    createRenderer(): IRoomRenderer
    {
        return new RoomRenderer();
    }
}
