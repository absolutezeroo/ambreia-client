/**
 * HabboRoomRendererFactory
 *
 * Habbo-specific renderer factory used by RoomEngine through IID_RoomRendererFactory.
 */
import type {IRoomRenderer} from '../../renderer/IRoomRenderer';
import {RoomRendererFactory} from '../../renderer/RoomRendererFactory';
import {HabboRoomRenderer} from './HabboRoomRenderer';

export class HabboRoomRendererFactory extends RoomRendererFactory
{
    override createRenderer(): IRoomRenderer
    {
        return new HabboRoomRenderer();
    }
}
