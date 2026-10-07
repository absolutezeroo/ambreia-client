/**
 * IRoomObjectModelController Interface
 *
 * Based on AS3: com.sulake.room.object.IRoomObjectModelController
 *
 * Read-write interface for room object state storage.
 * Extends IRoomObjectModel with setter methods.
 */
import type {IRoomObjectModel} from './IRoomObjectModel';

export interface IRoomObjectModelController extends IRoomObjectModel
{
    // AS3: .../src/com/sulake/room/object/IRoomObjectModelController.as::setNumber()
    setNumber(key: string, value: number, immutable?: boolean): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModelController.as::setString()
    setString(key: string, value: string, immutable?: boolean): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModelController.as::setNumberArray()
    setNumberArray(key: string, value: number[], immutable?: boolean): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModelController.as::setStringArray()
    setStringArray(key: string, value: string[], immutable?: boolean): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModelController.as::setStringToStringMap()
    setStringToStringMap(key: string, value: Map<string, string>, immutable?: boolean): void;

    setObject(key: string, value: unknown, immutable?: boolean): void;
}
