/**
 * Key-value property struct for custom window properties.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/PropertyStruct.as
 */
export class PropertyStruct
{
    public static readonly HEX: string = 'hex';
    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::INT
    public static readonly INT: string = 'int';
    public static readonly UINT: string = 'uint';
    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::NUMBER
    public static readonly NUMBER: string = 'Number';
    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::BOOLEAN
    public static readonly BOOLEAN: string = 'Boolean';
    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::STRING
    public static readonly STRING: string = 'String';
    public static readonly POINT: string = 'Point';
    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::RECTANGLE
    public static readonly RECTANGLE: string = 'Rectangle';
    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::ARRAY
    public static readonly ARRAY: string = 'Array';
    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::MAP
    public static readonly MAP: string = 'Map';

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::_key
    private _key: string;
    private _value: unknown;
    private _type: string;
    private _valid: boolean;
    private _range: string[] | null;

    constructor(key: string, value: unknown, type: string = PropertyStruct.STRING, valid: boolean = false, range: string[] | null = null)
    {
        this._key = key;
        this._value = value;
        this._type = type;
        this._valid = valid;
        this._range = range;
    }

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::get key()
    public get key(): string
    {
        return this._key;
    }

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::get value()
    public get value(): unknown
    {
        return this._value;
    }

    // TS-only: AS3 has no `value` setter - `withValue()` returns a new struct instead.
    // Kept for the ported callers that mutate a struct they already own.
    public set value(value: unknown)
    {
        this._value = value;
    }

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::get type()
    public get type(): string
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::get valid()
    public get valid(): boolean
    {
        return this._valid;
    }

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::get range()
    public get range(): string[] | null
    {
        return this._range;
    }

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::withValue()
    public withValue(newValue: unknown): PropertyStruct
    {
        let changed = true;

        switch(this._type)
        {
            case PropertyStruct.UINT:
            case PropertyStruct.HEX:
                changed = ((this._value as number) >>> 0) !== ((newValue as number) >>> 0);
                break;
            case PropertyStruct.INT:
                changed = ((this._value as number) | 0) !== ((newValue as number) | 0);
                break;
            case PropertyStruct.NUMBER:
                changed = (this._value as number) !== (newValue as number);
                break;
            case PropertyStruct.BOOLEAN:
                changed = !!(this._value) !== !!(newValue);
                break;
            case PropertyStruct.STRING:
                changed = String(this._value) !== String(newValue);
                break;
            case PropertyStruct.ARRAY:
            {
                // AS3 only treats two arrays as comparable when both are non-null and of
                // equal length; anything else stays `changed`. Without this case every
                // array-typed write allocated a fresh struct and invalidated the window,
                // even when the contents were identical.
                const previous = this._value as unknown[] | null;
                const next = newValue as unknown[] | null;

                if(Array.isArray(previous) && Array.isArray(next) && previous.length === next.length)
                {
                    changed = false;

                    for(let i = 0; i < next.length; i++)
                    {
                        if(previous[i] !== next[i])
                        {
                            changed = true;
                            break;
                        }
                    }
                }
                break;
            }
        }

        if(changed)
        {
            return new PropertyStruct(this._key, newValue, this._type, true, this._range);
        }

        return this;
    }

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::withNameSpace()
    public withNameSpace(namespace: string): PropertyStruct
    {
        return new PropertyStruct(`${namespace}:${this._key}`, this._value, this._type, this._valid, this._range);
    }

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::withoutNameSpace()
    public withoutNameSpace(): PropertyStruct
    {
        return new PropertyStruct(this._key.replace(/.*:/, ''), this._value, this._type, this._valid, this._range);
    }

    // TS-only: no AS3 counterpart; AS3 copies through `withNameSpace()`/`withValue()`.
    public clone(): PropertyStruct
    {
        return new PropertyStruct(this._key, this._value, this._type, this._valid, this._range);
    }

    // AS3: .../src/com/sulake/core/window/utils/PropertyStruct.as::toString()
    public toString(): string
    {
        switch(this._type)
        {
            case PropertyStruct.HEX:
                return '0x' + ((this._value as number) >>> 0).toString(16);
            case PropertyStruct.BOOLEAN:
                return this._value ? 'true' : 'false';
            case PropertyStruct.POINT:
            {
                const point = this._value as { x: number; y: number };

                return `Point(${point.x}, ${point.y})`;
            }
            case PropertyStruct.RECTANGLE:
            {
                const rect = this._value as { x: number; y: number; width: number; height: number };

                return `Rectangle(${rect.x}, ${rect.y}, ${rect.width}, ${rect.height})`;
            }
            default:
                return String(this._value);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/PropertyStruct.as::toXMLString()
    // Debug-only XML dump of a single property; has no current caller (reached only through
    // WindowParser.windowToXMLString()'s own <variables> block, itself uncalled).
    public toXMLString(): string
    {
        switch(this._type)
        {
            case PropertyStruct.MAP:
            {
                const map = this._value as { length: number; getKey(i: number): unknown; getWithIndex(i: number): unknown } | null;
                let xml = `<var key="${this._key}">\r<value>\r<${this._type}>\r`;

                if(map)
                {
                    for(let i = 0; i < map.length; i++)
                    {
                        const entryValue = map.getWithIndex(i);

                        xml += `<var key="${map.getKey(i)}" value="${entryValue}" type="${typeof entryValue}" />\r`;
                    }
                }

                return xml + `</${this._type}>\r</value>\r</var>`;
            }

            case PropertyStruct.ARRAY:
            {
                const arr = (this._value as unknown[] | null) ?? [];
                let xml = `<var key="${this._key}">\r<value>\r<${this._type}>\r`;

                for(let i = 0; i < arr.length; i++)
                {
                    xml += `<var key="${i}" value="${arr[i]}" type="${typeof arr[i]}" />\r`;
                }

                return xml + `</${this._type}>\r</value>\r</var>`;
            }

            case PropertyStruct.POINT:
            {
                const point = this._value as { x: number; y: number };

                return `<var key="${this._key}">\r<value>\r<${this._type}>\r` +
                    `<var key="x" value="${point.x}" type="int" />\r` +
                    `<var key="y" value="${point.y}" type="int" />\r` +
                    `</${this._type}>\r</value>\r</var>`;
            }

            case PropertyStruct.RECTANGLE:
            {
                const rect = this._value as { x: number; y: number; width: number; height: number };

                return `<var key="${this._key}">\r<value>\r<${this._type}>\r` +
                    `<var key="x" value="${rect.x}" type="int" />\r` +
                    `<var key="y" value="${rect.y}" type="int" />\r` +
                    `<var key="width" value="${rect.width}" type="int" />\r` +
                    `<var key="height" value="${rect.height}" type="int" />\r` +
                    `</${this._type}>\r</value>\r</var>`;
            }

            case PropertyStruct.HEX:
                return `<var key="${this._key}" value="0x${((this._value as number) >>> 0).toString(16)}" type="${this._type}" />`;

            default:
                return `<var key="${this._key}" value="${this._value}" type="${this._type}" />`;
        }
    }
}
