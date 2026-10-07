import type {IDisposable} from '../IDisposable';

/**
 * Insertion-ordered key/value store with index-based access, matching AS3's
 * `flash.utils.Dictionary` + parallel-array proxy pattern.
 *
 * AS3 deviation: the source class is literally named `Map` (confirmed via
 * sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as, whose own
 * `callProperty()` even returns the string "Map" for `toString()`), but that
 * name collides with the built-in JS/TS `Map`, so it is ported here as
 * `OrderedMap`. AS3's `for each(x in map)` (iterates values) and
 * `map[key]`/`map[key] = value` (Proxy get/setProperty) are represented here
 * as `values()` and `getValue()`/`setValue()`.
 *
 * AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as
 * (win63 decompiles this as _SafeCls_481 in both source trees)
 */
export class OrderedMap<K = unknown, V = unknown> implements IDisposable 
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::_dictionary
    private _dictionary: Map<K, V> | null = new Map();

    private _values: V[] = [];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::_keys
    private _keys: K[] = [];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::get length()
    get length(): number 
    {
        return this._values.length;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::get disposed()
    get disposed(): boolean 
    {
        return this._dictionary === null;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::dispose()
    dispose(): void 
    {
        this._dictionary = null;
        this._values = [];
        this._keys = [];
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::reset()
    reset(): void 
    {
        this._dictionary = new Map();
        this._values = [];
        this._keys = [];
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::unshift()
    unshift(key: K, value: V): boolean 
    {
        if(!this._dictionary || this._dictionary.has(key)) return false;

        this._dictionary.set(key, value);
        this._values.unshift(value);
        this._keys.unshift(key);

        return true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::add()
    add(key: K, value: V): boolean 
    {
        if(!this._dictionary || this._dictionary.has(key)) return false;

        this._dictionary.set(key, value);
        this._values.push(value);
        this._keys.push(key);

        return true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::setProperty()
    setValue(key: K, value: V): void 
    {
        if(!this._dictionary) return;

        this._dictionary.set(key, value);

        const index = this._keys.indexOf(key);

        if(index === -1) 
        {
            this._values.push(value);
            this._keys.push(key);
        }
        else 
        {
            this._values[index] = value;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_481.as::replace()
    replace(key: K, value: V): boolean 
    {
        if(!this._dictionary || !this._dictionary.has(key)) return false;

        const index = this._keys.indexOf(key);

        this._dictionary.set(key, value);
        this._values[index] = value;

        return true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::remove()
    remove(key: K): V | null 
    {
        if(!this._dictionary) return null;

        const value = this._dictionary.get(key);

        if(value === undefined) return null;

        const index = this._keys.indexOf(key);

        if(index >= 0) 
        {
            this._values.splice(index, 1);
            this._keys.splice(index, 1);
        }

        this._dictionary.delete(key);

        return value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::getWithIndex()
    getWithIndex(index: number): V | null 
    {
        if(index < 0 || index >= this._values.length) return null;

        return this._values[index];
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::getKey()
    getKey(index: number): K | null 
    {
        if(index < 0 || index >= this._keys.length) return null;

        return this._keys[index];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_481.as::getValueByIndex()
    getValueByIndex(index: number): V | null 
    {
        return this.getWithIndex(index);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::getKeys()
    getKeys(): K[] 
    {
        return this._keys.slice();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::hasKey()
    hasKey(key: K): boolean 
    {
        return this._dictionary?.has(key) ?? false;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::getProperty() / getValue()
    getValue(key: K): V | null 
    {
        return this._dictionary?.get(key) ?? null;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::getValues()
    getValues(): V[] 
    {
        return this._values.slice();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::hasValue()
    hasValue(value: V): boolean 
    {
        return this._values.indexOf(value) > -1;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::indexOf()
    indexOf(value: V): number 
    {
        return this._values.indexOf(value);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::concatenate()
    concatenate(other: OrderedMap<K, V>): void 
    {
        for(const key of other.getKeys()) 
        {
            this.add(key, other.getValue(key) as V);
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::clone()
    clone(): OrderedMap<K, V> 
    {
        const copy = new OrderedMap<K, V>();

        copy.concatenate(this);

        return copy;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/Map.as::getValues()
    // Renamed: `getValues()` is what this returns; AS3's `nextValue()` is the flash_proxy hook that
    // makes `for each..in` walk the same array, and has no counterpart here.
    values(): V[]
    {
        return this._values;
    }

    [Symbol.iterator](): Iterator<V> 
    {
        return this._values[Symbol.iterator]();
    }
}
