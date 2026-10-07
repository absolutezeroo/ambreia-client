/**
 * IRoomInstanceContainer Interface
 *
 * Based on AS3: com.sulake.room.IRoomInstanceContainer
 *
 * Interface for the container that manages room instances.
 */
import type {IRoomObject} from './object/IRoomObject';
import type {IRoomObjectManager} from './IRoomObjectManager';

export interface IRoomInstanceContainer
{
    // AS3: .../src/com/sulake/room/IRoomInstanceContainer.as::createRoomObject()
    createRoomObject(roomId: string, objectId: number, type: string, category: number): IRoomObject | null;

    // AS3: .../src/com/sulake/room/IRoomInstanceContainer.as::createRoomObjectManager()
    createRoomObjectManager(): IRoomObjectManager;
}
