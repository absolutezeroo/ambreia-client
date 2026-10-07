/**
 * IRoomObjectModel Interface
 *
 * Based on AS3: com.sulake.room.object.IRoomObjectModel
 *
 * Read-only interface for room object state storage.
 * Stores numbers, strings, and arrays indexed by string keys.
 */
export interface IRoomObjectModel
{
    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::hasNumber()
    hasNumber(key: string): boolean;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::hasNumberArray()
    hasNumberArray(key: string): boolean;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::hasString()
    hasString(key: string): boolean;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::hasStringArray()
    hasStringArray(key: string): boolean;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::getNumber()
    getNumber(key: string): number;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::getString()
    getString(key: string): string;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::getNumberArray()
    getNumberArray(key: string): readonly number[] | null;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::getStringArray()
    getStringArray(key: string): readonly string[] | null;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::getStringToStringMap()
    getStringToStringMap(key: string): Map<string, string>;

    getObject(key: string): unknown;

    // AS3: .../src/com/sulake/room/object/IRoomObjectModel.as::getUpdateID()
    getUpdateID(): number;
}
