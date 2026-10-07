/**
 * RoomObjectModel
 *
 * Based on AS3: com.sulake.room.object.RoomObjectModel
 *
 * Stores room object state as key-value pairs.
 * Supports numbers, strings, and arrays with optional immutability.
 */
import type {IRoomObjectModelController} from './IRoomObjectModelController';

export class RoomObjectModel implements IRoomObjectModelController
{
    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::MAP_KEYS_PREFIX
    private static readonly MAP_KEYS_PREFIX = 'ROMC_MAP_KEYS_';
    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::MAP_VALUES_PREFIX
    private static readonly MAP_VALUES_PREFIX = 'ROMC_MAP_VALUES_';

    private _numbers: Map<string, number> = new Map();
    private _strings: Map<string, string> = new Map();
    private _numberArrays: Map<string, number[]> = new Map();
    private _stringArrays: Map<string, string[]> = new Map();
    private _objects: Map<string, unknown> = new Map();

    private _immutableNumbers: Set<string> = new Set();
    private _immutableStrings: Set<string> = new Set();
    private _immutableNumberArrays: Set<string> = new Set();
    private _immutableStringArrays: Set<string> = new Set();
    private _immutableObjects: Set<string> = new Set();

    private _updateID: number = 0;

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::dispose()
    dispose(): void
    {
        this._numbers.clear();
        this._strings.clear();
        this._numberArrays.clear();
        this._stringArrays.clear();
        this._objects.clear();

        this._immutableNumbers.clear();
        this._immutableStrings.clear();
        this._immutableNumberArrays.clear();
        this._immutableStringArrays.clear();
        this._immutableObjects.clear();
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::hasNumber()
    hasNumber(key: string): boolean
    {
        return this._numbers.has(key);
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::hasNumberArray()
    hasNumberArray(key: string): boolean
    {
        return this._numberArrays.has(key);
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::hasString()
    hasString(key: string): boolean
    {
        return this._strings.has(key);
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::hasStringArray()
    hasStringArray(key: string): boolean
    {
        return this._stringArrays.has(key);
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::getNumber()
    getNumber(key: string): number
    {
        return this._numbers.get(key) ?? NaN;
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::getString()
    getString(key: string): string
    {
        return this._strings.get(key) ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/RoomObjectModel.as::getNumberArray()
    // AS3 slices before returning - `readonly` here is compile-time only and a cast bypasses it,
    // so return a copy to actually prevent external mutation of the stored array.
    getNumberArray(key: string): readonly number[] | null
    {
        const value = this._numberArrays.get(key);

        return value !== undefined ? value.slice() : null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/RoomObjectModel.as::getStringArray()
    getStringArray(key: string): readonly string[] | null
    {
        const value = this._stringArrays.get(key);

        return value !== undefined ? value.slice() : null;
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::getStringToStringMap()
    getStringToStringMap(key: string): Map<string, string>
    {
        const result = new Map<string, string>();

        const keys = this.getStringArray(RoomObjectModel.MAP_KEYS_PREFIX + key);
        const values = this.getStringArray(RoomObjectModel.MAP_VALUES_PREFIX + key);

        if(keys !== null && values !== null && keys.length === values.length)
        {
            for(let i = 0; i < keys.length; i++)
            {
                result.set(keys[i], values[i]);
            }
        }

        return result;
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::setNumber()
    setNumber(key: string, value: number, immutable: boolean = false): void
    {
        if(this._immutableNumbers.has(key))
        {
            return;
        }

        if(immutable)
        {
            this._immutableNumbers.add(key);
        }

        if(this._numbers.get(key) !== value)
        {
            this._numbers.set(key, value);
            this._updateID++;
        }
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::setString()
    setString(key: string, value: string, immutable: boolean = false): void
    {
        if(this._immutableStrings.has(key))
        {
            return;
        }

        if(immutable)
        {
            this._immutableStrings.add(key);
        }

        if(this._strings.get(key) !== value)
        {
            this._strings.set(key, value);
            this._updateID++;
        }
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::setNumberArray()
    setNumberArray(key: string, value: number[], immutable: boolean = false): void
    {
        if(value === null)
        {
            return;
        }

        if(this._immutableNumberArrays.has(key))
        {
            return;
        }

        if(immutable)
        {
            this._immutableNumberArrays.add(key);
        }

        const existingArray = this._numberArrays.get(key);

        if(existingArray !== undefined && existingArray.length === value.length)
        {
            let same = true;

            for(let i = value.length - 1; i >= 0; i--)
            {
                if(value[i] !== existingArray[i] || typeof value[i] !== 'number')
                {
                    same = false;
                    break;
                }
            }

            if(same) return;
        }

        this._numberArrays.set(key, value.slice());
        this._updateID++;
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::setStringArray()
    setStringArray(key: string, value: string[], immutable: boolean = false): void
    {
        if(value === null)
        {
            return;
        }

        if(this._immutableStringArrays.has(key))
        {
            return;
        }

        if(immutable)
        {
            this._immutableStringArrays.add(key);
        }

        const existingArray = this._stringArrays.get(key);

        if(existingArray !== undefined && existingArray.length === value.length)
        {
            let same = true;

            for(let i = value.length - 1; i >= 0; i--)
            {
                if(value[i] !== existingArray[i] || typeof value[i] !== 'string')
                {
                    same = false;
                    break;
                }
            }

            if(same) return;
        }

        this._stringArrays.set(key, value.slice());
        this._updateID++;
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::setStringToStringMap()
    setStringToStringMap(key: string, value: Map<string, string>, immutable: boolean = false): void
    {
        if(value === null)
        {
            return;
        }

        const keys = Array.from(value.keys());
        const values = Array.from(value.values());

        this.setStringArray(RoomObjectModel.MAP_KEYS_PREFIX + key, keys, immutable);
        this.setStringArray(RoomObjectModel.MAP_VALUES_PREFIX + key, values, immutable);
    }

    getObject(key: string): unknown
    {
        return this._objects.get(key) ?? null;
    }

    setObject(key: string, value: unknown, immutable: boolean = false): void
    {
        if(this._immutableObjects.has(key))
        {
            return;
        }

        if(immutable)
        {
            this._immutableObjects.add(key);
        }

        this._objects.set(key, value);
        this._updateID++;
    }

    // AS3: .../src/com/sulake/room/object/RoomObjectModel.as::getUpdateID()
    getUpdateID(): number
    {
        return this._updateID;
    }
}
