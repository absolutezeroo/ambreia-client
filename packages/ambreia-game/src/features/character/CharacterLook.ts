/** The server's name shape (NameChangePolicy): 3 to 15 letters, digits, `-`, `.` or `_`. */
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 15;

export interface INameRules
{
    length: boolean;
    chars: boolean;
    spaces: boolean;
}

/** Each rule the creation screen lists, checked as the server will. Uniqueness only it can tell. */
export function nameRules(name: string): INameRules
{
    return {
        length: name.length >= NAME_MIN_LENGTH && name.length <= NAME_MAX_LENGTH,
        chars: /^[\p{L}\p{N}._\s-]*$/u.test(name) && name.length > 0,
        spaces: !/\s/.test(name)
    };
}

export function isNameValid(name: string): boolean
{
    const rules = nameRules(name);

    return rules.length && rules.chars && rules.spaces;
}

/** A figure string's parts by type: `hr-115-42.hd-195-19` → hr → [115, 42]. */
function parts(figure: string): Map<string, number[]>
{
    const result = new Map<string, number[]>();

    for(const part of figure.split('.'))
    {
        const [type, ...values] = part.split('-');

        if(type && values.length > 0) result.set(type, values.map(Number));
    }

    return result;
}

function write(map: Map<string, number[]>): string
{
    return [...map].map(([type, values]) => [type, ...values].join('-')).join('.');
}

/** The set of a part type (`hr`), or null when the figure has none. */
export function partSet(figure: string, type: string): number | null
{
    return parts(figure).get(type)?.[0] ?? null;
}

/** The first colour of a part type, or null. */
export function partColor(figure: string, type: string): number | null
{
    return parts(figure).get(type)?.[1] ?? null;
}

/** Puts another set on a part type, keeping its colours (or the given one when it had none). */
export function withPartSet(figure: string, type: string, setId: number, fallbackColor: number): string
{
    const map = parts(figure);
    const colors = map.get(type)?.slice(1) ?? [];

    map.set(type, [setId, ...(colors.length > 0 ? colors : [fallbackColor])]);

    return write(map);
}

/** Recolours a part type's first colour; a figure without that part is left alone. */
export function withPartColor(figure: string, type: string, colorId: number): string
{
    const map = parts(figure);
    const values = map.get(type);

    if(!values) return figure;

    map.set(type, [values[0], colorId, ...values.slice(2)]);

    return write(map);
}
