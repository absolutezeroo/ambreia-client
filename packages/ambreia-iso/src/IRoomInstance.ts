/**
 * IRoomInstance Interface
 *
 * Based on AS3: com.sulake.room.IRoomInstance
 *
 * Interface for a room instance that manages objects.
 *
 * @see sources/win63_version/room/RoomInstance.as
 */
import type {IRoomObject} from './object/IRoomObject';
import type {IRoomRendererBase} from './renderer/IRoomRendererBase';

export interface IRoomInstance
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomInstance.as::get id()
    readonly id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/IRoomInstance.as::hasValueForName()
    hasValueForName(key: string): boolean;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::getNumber()
    getNumber(key: string): number;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::setNumber()
    setNumber(key: string, value: number, immutable?: boolean): void;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::getString()
    getString(key: string): string;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::setString()
    setString(key: string, value: string, immutable?: boolean): void;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::dispose()
    dispose(): void;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::update()
    update(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomInstance.as::addObjectUpdateCategory()
    addObjectUpdateCategory(category: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomInstance.as::removeObjectUpdateCategory()
    removeObjectUpdateCategory(category: number): void;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::setRenderer()
    setRenderer(renderer: IRoomRendererBase | null): void;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::getRenderer()
    getRenderer(): IRoomRendererBase | null;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::createRoomObject()
    createRoomObject(id: number, type: string, category: number): IRoomObject | null;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::getObject()
    getObject(id: number, category: number): IRoomObject | null;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::getObjects()
    getObjects(category: number): IRoomObject[];

    // AS3: .../src/com/sulake/room/IRoomInstance.as::disposeObject()
    disposeObject(id: number, category: number): boolean;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::getObjectCount()
    getObjectCount(category: number): number;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::getObjectWithIndexAndType()
    getObjectWithIndexAndType(index: number, type: string, category: number): IRoomObject | null;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::getObjectCountForType()
    getObjectCountForType(type: string, category: number): number;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::getObjectWithIndex()
    getObjectWithIndex(index: number, category: number): IRoomObject | null;

    // AS3: .../src/com/sulake/room/IRoomInstance.as::disposeObjects()
    disposeObjects(category: number): number;
}
