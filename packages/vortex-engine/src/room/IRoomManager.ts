/**
 * IRoomManager Interface
 *
 * Based on AS3: com.sulake.room.IRoomManager
 *
 * Interface for the room manager that creates and manages room instances.
 */
import type {IRoomInstance} from './IRoomInstance';
import type {IRoomManagerListener} from './IRoomManagerListener';
import type {IRoomContentLoader} from './IRoomContentLoader';

export interface IRoomManager
{
    // AS3: .../src/com/sulake/room/IRoomManager.as::initialize()
    initialize(data: unknown, listener: IRoomManagerListener): boolean;

    // AS3: .../src/com/sulake/room/IRoomManager.as::update()
    update(time: number): void;

    // AS3: .../src/com/sulake/room/IRoomManager.as::setContentLoader()
    setContentLoader(loader: IRoomContentLoader): void;

    // AS3: .../src/com/sulake/room/IRoomManager.as::addObjectUpdateCategory()
    addObjectUpdateCategory(category: number): void;

    // AS3: .../src/com/sulake/room/IRoomManager.as::removeObjectUpdateCategory()
    removeObjectUpdateCategory(category: number): void;

    // AS3: .../src/com/sulake/room/IRoomManager.as::createRoom()
    createRoom(id: string, data: unknown): IRoomInstance | null;

    // AS3: .../src/com/sulake/room/IRoomManager.as::disposeRoom()
    disposeRoom(id: string): boolean;

    // AS3: .../src/com/sulake/room/IRoomManager.as::getRoom()
    getRoom(id: string): IRoomInstance | null;

    // AS3: .../src/com/sulake/room/IRoomManager.as::getRoomWithIndex()
    getRoomWithIndex(index: number): IRoomInstance | null;

    // AS3: .../src/com/sulake/room/IRoomManager.as::getRoomCount()
    getRoomCount(): number;

    // AS3: .../src/com/sulake/room/IRoomManager.as::isContentAvailable()
    isContentAvailable(type: string): boolean;
}
