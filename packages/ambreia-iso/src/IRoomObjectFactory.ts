/**
 * IRoomObjectFactory Interface
 *
 * Based on AS3: com.sulake.room.IRoomObjectFactory
 *
 * Factory interface for creating room object logic and managers.
 * Visualization creation is handled by IRoomObjectVisualizationFactory.
 *
 * @see source_as_win63/room/IRoomObjectFactory.as
 */
import type {EventEmitter} from 'eventemitter3';
import type {IRoomObjectEventHandler} from './object/logic/IRoomObjectEventHandler';
import type {IRoomObjectManager} from './IRoomObjectManager';

export interface IRoomObjectFactory
{
    // AS3: .../src/com/sulake/room/IRoomObjectFactory.as::get events()
    readonly events: EventEmitter;

    // AS3: .../src/com/sulake/room/IRoomObjectFactory.as::addObjectEventListener()
    addObjectEventListener(callback: (event: unknown) => void): void;

    // AS3: .../src/com/sulake/room/IRoomObjectFactory.as::removeObjectEventListener()
    removeObjectEventListener(callback: (event: unknown) => void): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/IRoomObjectFactory.as::createRoomObjectLogic()
    createRoomObjectLogic(type: string): IRoomObjectEventHandler | null;

    // AS3: .../src/com/sulake/room/IRoomObjectFactory.as::createRoomObjectManager()
    createRoomObjectManager(): IRoomObjectManager;
}
