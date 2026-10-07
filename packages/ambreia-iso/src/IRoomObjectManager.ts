/**
 * IRoomObjectManager Interface
 *
 * Based on AS3: com.sulake.room.IRoomObjectManager
 *
 * Interface for managing room objects within a category.
 */
import type {IRoomObject} from './object/IRoomObject';
import type {IRoomObjectController} from './object/IRoomObjectController';

export interface IRoomObjectManager
{
    readonly objectCount: number;
    readonly objects: IRoomObject[];

    // AS3: .../src/com/sulake/room/IRoomObjectManager.as::dispose()
    dispose(): void;

    // AS3: .../src/com/sulake/room/IRoomObjectManager.as::reset()
    reset(): void;

    // AS3: .../src/com/sulake/room/IRoomObjectManager.as::getObject()
    getObject(id: number): IRoomObject | null;

    getObjectByIndex(index: number): IRoomObject | null;

    // AS3: .../src/com/sulake/room/IRoomObjectManager.as::createObject()
    createObject(id: number, stateCount: number, type: string): IRoomObjectController | null;

    // AS3: .../src/com/sulake/room/IRoomObjectManager.as::disposeObject()
    disposeObject(id: number): boolean;

    // AS3: .../src/com/sulake/room/IRoomObjectManager.as::getObjectWithIndexAndType()
    getObjectWithIndexAndType(index: number, type: string): IRoomObjectController | null;

    // AS3: .../src/com/sulake/room/IRoomObjectManager.as::getObjectCountForType()
    getObjectCountForType(type: string): number;
}
