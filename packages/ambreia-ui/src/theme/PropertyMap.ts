import type {IPropertyMap} from './IPropertyMap';
import {PropertyStruct} from '../utils/PropertyStruct';

/**
 * Implementation of IPropertyMap using a Map of PropertyStruct entries.
 *
 * Provides typed convenience methods for adding boolean, int, uint,
 * number, string, hex, and array properties. Each entry is stored as
 * a PropertyStruct keyed by name.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/theme/PropertyMap.as
 */
export class PropertyMap implements IPropertyMap
{
    private _properties: Map<string, PropertyStruct> = new Map();

    /**
	 * Retrieves the value for the given key.
	 *
	 * @param key - The property key
	 * @returns The property value, or undefined if not found
	 */
    public getValue(key: string): unknown
    {
        const prop = this._properties.get(key);

        return prop ? prop.value : undefined;
    }

    /**
	 * Sets the value for the given key.
	 *
	 * @param key - The property key
	 * @param value - The value to set
	 */
    public setValue(key: string, value: unknown): void
    {
        const existing = this._properties.get(key);

        if(existing)
        {
            existing.value = value;
        }
        else
        {
            this._properties.set(key, new PropertyStruct(key, value));
        }
    }

    /**
	 * Checks whether a property with the given key exists.
	 *
	 * @param key - The property key
	 * @returns True if the key exists
	 */
    public hasValue(key: string): boolean
    {
        return this._properties.has(key);
    }

    /**
	 * Returns all property keys.
	 *
	 * @returns Array of key strings
	 */
    public getKeys(): string[]
    {
        return Array.from(this._properties.keys());
    }

    /**
	 * Returns the PropertyStruct for the given key.
	 *
	 * @param key - The property key
	 * @returns The PropertyStruct, or null if not found
	 */
    public get(key: string): PropertyStruct | null
    {
        return this._properties.get(key) ?? null;
    }

    /**
	 * Adds a boolean property.
	 *
	 * @param key - The property key
	 * @param value - The boolean value
	 */
    // AS3: .../src/com/sulake/core/window/theme/PropertyMap.as::addBoolean()
    public addBoolean(key: string, value: boolean): void
    {
        this._properties.set(key, new PropertyStruct(key, value, PropertyStruct.BOOLEAN));
    }

    /**
	 * Adds an integer property.
	 *
	 * @param key - The property key
	 * @param value - The integer value
	 */
    // AS3: .../src/com/sulake/core/window/theme/PropertyMap.as::addInt()
    public addInt(key: string, value: number): void
    {
        this._properties.set(key, new PropertyStruct(key, value, PropertyStruct.INT));
    }

    /**
	 * Adds an unsigned integer property.
	 *
	 * @param key - The property key
	 * @param value - The uint value
	 */
    // AS3: .../src/com/sulake/core/window/theme/PropertyMap.as::addUint()
    public addUint(key: string, value: number): void
    {
        this._properties.set(key, new PropertyStruct(key, value, PropertyStruct.UINT));
    }

    /**
	 * Adds a hex-encoded unsigned integer property.
	 *
	 * @param key - The property key
	 * @param value - The hex value
	 */
    // AS3: .../src/com/sulake/core/window/theme/PropertyMap.as::addHex()
    public addHex(key: string, value: number): void
    {
        this._properties.set(key, new PropertyStruct(key, value, PropertyStruct.HEX));
    }

    /**
	 * Adds a floating-point number property.
	 *
	 * @param key - The property key
	 * @param value - The number value
	 */
    // AS3: .../src/com/sulake/core/window/theme/PropertyMap.as::addNumber()
    public addNumber(key: string, value: number): void
    {
        this._properties.set(key, new PropertyStruct(key, value, PropertyStruct.NUMBER));
    }

    /**
	 * Adds a string property.
	 *
	 * @param key - The property key
	 * @param value - The string value
	 */
    // AS3: .../src/com/sulake/core/window/theme/PropertyMap.as::addString()
    public addString(key: string, value: string): void
    {
        this._properties.set(key, new PropertyStruct(key, value, PropertyStruct.STRING));
    }

    /**
	 * Adds an array property.
	 *
	 * @param key - The property key
	 * @param value - The array value
	 */
    // AS3: .../src/com/sulake/core/window/theme/PropertyMap.as::addArray()
    public addArray(key: string, value: unknown[]): void
    {
        this._properties.set(key, new PropertyStruct(key, value, PropertyStruct.ARRAY));
    }

    /**
	 * Adds a string enumeration property with a set of allowed values.
	 *
	 * @param key - The property key
	 * @param value - The initial value
	 * @param range - The allowed values
	 */
    // AS3: .../src/com/sulake/core/window/theme/PropertyMap.as::addEnumeration()
    public addEnumeration(key: string, value: string, range: string[]): void
    {
        this._properties.set(key, new PropertyStruct(key, value, PropertyStruct.STRING, false, range));
    }

    /**
	 * Creates a shallow clone of this PropertyMap.
	 *
	 * @returns A new PropertyMap with the same entries
	 */
    // AS3: .../src/com/sulake/core/window/theme/PropertyMap.as::clone()
    public clone(): PropertyMap
    {
        const copy = new PropertyMap();

        for(const [key, prop] of this._properties)
        {
            copy._properties.set(key, prop);
        }

        return copy;
    }

    /**
	 * Disposes all properties in this map.
	 */
    public dispose(): void
    {
        this._properties.clear();
    }
}
