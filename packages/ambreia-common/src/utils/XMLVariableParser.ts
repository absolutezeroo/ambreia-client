import {OrderedMap} from './OrderedMap';

/**
 * Parses Flash's `<variables><var key="..." .../></variables>` documents into an
 * {@link OrderedMap}.
 *
 * This is the format the client's *configuration* XML assets use, as opposed to the
 * `<layout>`/`<skin>` documents `WindowParser` builds windows from — the notification
 * config (`habbo_notifications_config_xml`) is the one such asset in the dump. AS3 keeps
 * it as its own class because `WindowParser`, `BitmapSkinParser` and
 * `XMLPropertyArrayParser` all call into it for the `<variables>` blocks nested inside
 * their own documents.
 *
 * The class is obfuscated as `_SafeCls_3252` in the primary tree; the name is recovered
 * from `sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/utils/XMLVariableParser.as`,
 * where the same methods are unobfuscated.
 *
 * AS3 deviation, stated rather than hidden: `parseValueType()`'s `Point` and `Rectangle`
 * cases return `flash.geom` instances. This port has no core Point/Rectangle class, so
 * they return the plain `{x, y}` / `{x, y, width, height}` shape the rest of the port
 * already passes around (see `IHabboToolbar.getRect()`). No shipped asset uses either
 * type — both cases exist so a future one does not silently fall through to the throw.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as
 */
export class XMLVariableParser
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::_SafeStr_10403
    // (name derived from its value "hex"; obfuscated in every tree, unlike its INT/NUMBER siblings)
    public static readonly HEX: string = 'hex';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::INT
    public static readonly INT: string = 'int';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::_SafeStr_10303
    // (name derived from its value "uint"; obfuscated in every tree)
    public static readonly UINT: string = 'uint';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::NUMBER
    public static readonly NUMBER: string = 'Number';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::FLOAT
    public static readonly FLOAT: string = 'float';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::BOOLEAN
    public static readonly BOOLEAN: string = 'Boolean';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::BOOL
    public static readonly BOOL: string = 'bool';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::STRING
    public static readonly STRING: string = 'String';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::_SafeStr_10434
    // (name derived from its value "Point"; obfuscated in every tree, unlike RECTANGLE next to it)
    public static readonly POINT: string = 'Point';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::RECTANGLE
    public static readonly RECTANGLE: string = 'Rectangle';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::ARRAY
    public static readonly ARRAY: string = 'Array';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::MAP
    public static readonly MAP: string = 'Map';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::KEY
    private static readonly KEY: string = 'key';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::TYPE
    private static readonly TYPE: string = 'type';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::VALUE
    private static readonly VALUE: string = 'value';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::TRUE
    private static readonly TRUE: string = 'true';

    /**
     * Parses every `<var>` in `nodes` into `target`, returning how many were seen.
     *
     * `types`, when given, collects each entry's declared type in document order — AS3's
     * third parameter, used by `XMLPropertyArrayParser` to keep a parallel type list.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::parseVariableList()
    public static parseVariableList(
        nodes: Element[] | HTMLCollection,
        target: OrderedMap<string, unknown>,
        types: string[] | null = null
    ): number
    {
        const list = Array.from(nodes) as Element[];

        for(const node of list)
        {
            XMLVariableParser.parseVariableToken(node, target, types);
        }

        return list.length;
    }

    /**
     * One `<var>`: its key comes from the `key` attribute, or from a `<key>` child when the
     * attribute is absent; its type from the `type` attribute, defaulting to `String`.
     *
     * A `value` *attribute* is cast in place. Otherwise a `<value>` child is looked for, and
     * the type is re-read from its first element child's own tag name — that is how
     * `<value><Map>…</Map></value>` becomes a nested map regardless of what `type` said.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::parseVariableToken()
    private static parseVariableToken(
        node: Element,
        target: OrderedMap<string, unknown>,
        types: string[] | null = null
    ): void
    {
        let key: string;

        if(node.hasAttribute(XMLVariableParser.KEY))
        {
            key = node.getAttribute(XMLVariableParser.KEY) ?? '';
        }
        else
        {
            key = XMLVariableParser.firstChildElement(node, XMLVariableParser.KEY)?.textContent ?? '';
        }

        let type: string = XMLVariableParser.STRING;

        if(node.hasAttribute(XMLVariableParser.TYPE))
        {
            type = node.getAttribute(XMLVariableParser.TYPE) ?? XMLVariableParser.STRING;
        }

        const value: string | null = node.hasAttribute(XMLVariableParser.VALUE)
            ? node.getAttribute(XMLVariableParser.VALUE)
            : null;

        if(value !== null)
        {
            target.setValue(key, XMLVariableParser.castStringToType(value, type));
        }
        else
        {
            const valueNode = XMLVariableParser.firstChildElement(node, XMLVariableParser.VALUE);

            if(valueNode !== null)
            {
                const typeNode = XMLVariableParser.firstChildElement(valueNode, null);

                // AS3 reads `.localName()` off this node unconditionally and would throw on a
                // `<value>` holding bare text. Skipping keeps a malformed asset from taking the
                // whole parse down, and no shipped asset reaches it.
                if(typeNode !== null)
                {
                    type = typeNode.localName;

                    target.setValue(key, XMLVariableParser.parseValueType(typeNode, type));
                }
            }
            else if(type === XMLVariableParser.MAP || type === XMLVariableParser.ARRAY)
            {
                target.setValue(key, XMLVariableParser.parseValueType(node, type));
            }
        }

        if(types !== null)
        {
            types.push(type);
        }
    }

    /**
     * Casts an attribute string to its declared type.
     *
     * `Boolean` accepts the literal "true" *or* any positive integer — a hotel writing
     * `value="1"` gets `true`, which a plain `=== 'true'` test would silently drop.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::castStringToType()
    public static castStringToType(value: string, type: string): unknown
    {
        switch(type)
        {
            case XMLVariableParser.UINT:
                return XMLVariableParser.toUint(value);
            case XMLVariableParser.INT:
                return XMLVariableParser.toInt(value);
            case XMLVariableParser.NUMBER:
            case XMLVariableParser.FLOAT:
                return XMLVariableParser.toNumber(value);
            case XMLVariableParser.BOOLEAN:
            case XMLVariableParser.BOOL:
                return value === XMLVariableParser.TRUE || XMLVariableParser.toInt(value) > 0;
            case XMLVariableParser.HEX:
                return XMLVariableParser.toUint(value);
            case XMLVariableParser.ARRAY:
                return value.split(',');
            default:
                return value;
        }
    }

    /**
     * Reads a `<value>`'s element child, whose tag name *is* the type.
     *
     * `Array` and `Map` both parse their children into an `OrderedMap`; `Array` then drops
     * the keys and keeps the values in insertion order.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::parseValueType()
    public static parseValueType(node: Element, type: string): unknown
    {
        switch(type)
        {
            case XMLVariableParser.STRING:
                return node.textContent ?? '';
            case XMLVariableParser.POINT:
                return {
                    x: XMLVariableParser.toNumber(node.getAttribute('x')),
                    y: XMLVariableParser.toNumber(node.getAttribute('y'))
                };
            case XMLVariableParser.RECTANGLE:
                return {
                    x: XMLVariableParser.toNumber(node.getAttribute('x')),
                    y: XMLVariableParser.toNumber(node.getAttribute('y')),
                    width: XMLVariableParser.toNumber(node.getAttribute('width')),
                    height: XMLVariableParser.toNumber(node.getAttribute('height'))
                };
            case XMLVariableParser.ARRAY:
            {
                const entries = new OrderedMap<string, unknown>();

                XMLVariableParser.parseVariableList(node.children, entries);

                return entries.getValues();
            }
            case XMLVariableParser.MAP:
            {
                const entries = new OrderedMap<string, unknown>();

                XMLVariableParser.parseVariableList(node.children, entries);

                return entries;
            }
            default:
                throw new Error(`Unable to parse data type "${type}", unknown type!`);
        }
    }

    /**
     * First element child, optionally matching a tag name.
     *
     * E4X's `child()` skips whitespace-only text nodes by default, which is what makes
     * `child(0)[0]` land on `<Map>` in AS3; `children` is the DOM equivalent, elements only.
     */
    // TS-only: E4X's `child()`/`attribute()` have no DOM counterpart, so the lookup is factored out.
    private static firstChildElement(node: Element, tagName: string | null): Element | null
    {
        for(const child of Array.from(node.children))
        {
            if(tagName === null || child.localName === tagName)
            {
                return child;
            }
        }

        return null;
    }

    /**
     * AS3's `Number()` on a non-numeric string yields NaN, and `int()`/`uint()` of NaN is 0 —
     * reproduced here rather than letting NaN escape into a layout coordinate.
     */
    // TS-only: AS3's implicit numeric coercion, made explicit.
    private static toNumber(value: string | null): number
    {
        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : 0;
    }

    // TS-only: AS3's `int()` cast.
    private static toInt(value: string | null): number
    {
        return Math.trunc(XMLVariableParser.toNumber(value));
    }

    // TS-only: AS3's `uint()` cast.
    private static toUint(value: string | null): number
    {
        return XMLVariableParser.toInt(value) >>> 0;
    }
}
