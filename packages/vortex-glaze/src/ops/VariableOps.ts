import type {IWindow} from '@ambreia/ui/IWindow';
import {PropertyStruct} from '@ambreia/ui/utils/index';
import type {IGlazeVar} from '../state/VariablesModel';

/**
 * Layout `<variables>` editing support.
 *
 * The saved XML is the source of truth ({@link VariablesModel}) because the live
 * `WindowController` faithfully discards `<var>` properties — AS3's base class has
 * an empty `set properties`. Controllers that *do* consume them (item lists, text,
 * bitmaps…) override that setter, so re-assigning the property array after an edit
 * updates those windows on the spot; for every other window the edit only shows
 * after a reload, which is exactly what the Flash client does.
 */

/** Mirrors `WindowParser`'s own `castValue()` for the flat `value="…"` forms. */
export function castVarValue(raw: string, type: string): unknown
{
    switch(type.toLowerCase())
    {
        case 'boolean':
            return raw.trim().toLowerCase() === 'true';
        case 'int':
        case 'number':
        {
            const parsed = Number(raw);

            return Number.isNaN(parsed) ? 0 : parsed;
        }
        case 'uint':
        {
            const parsed = Number.parseInt(raw, 10);

            return Number.isNaN(parsed) ? 0 : parsed >>> 0;
        }
        case 'hex':
            return Number.parseInt(raw.replace(/^0x/i, ''), 16) >>> 0;
        case 'array':
            return raw.split(',').map((entry) => entry.trim()).filter((entry) => entry.length > 0);
        default:
            return raw;
    }
}

/**
 * Pushes the node's simple variables into the live window. Complex vars (`Point`,
 * `Rectangle`, `Array`, `Map` sub-trees) have no flat form to rebuild from and are
 * left to the XML round-trip.
 */
export function applyVariablesLive(window: IWindow, vars: IGlazeVar[]): void
{
    if(!window || window.disposed)
    {
        return;
    }

    const properties = vars
        .filter((entry) => !entry.complex)
        .map((entry) => new PropertyStruct(entry.key, castVarValue(entry.value, entry.type)));

    if(properties.length > 0)
    {
        window.properties = properties;
    }
}
