import {z} from 'zod';
import {AppSection, LegacySection} from './AppConfig';
import type {AppConfig} from './AppConfig';
import {ConfigError} from './ConfigError';

export {ConfigError};

/** One source of configuration, by name: 'defaults', 'config.json', 'url'. Later ones win. */
export interface IConfigSource
{
    readonly name: string;
    readonly values: Readonly<Record<string, unknown>>;
}

/** The configuration, loaded once, validated and frozen (spec §5). */
export interface IKernelConfig
{
    readonly app: Readonly<AppConfig>;
    readonly legacy: Readonly<Record<string, string>>;
    /** A feature's own section, with its defaults and `enabled` (true unless switched off). */
    section<C = Record<string, unknown>>(id: string): Readonly<C & {enabled: boolean}>;
}

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** Objects merge key by key; anything else (arrays included) is replaced. */
function merge(base: Plain, over: Readonly<Plain>): Plain
{
    const out: Plain = {...base};

    for(const [key, value] of Object.entries(over))
    {
        out[key] = isPlain(value) && isPlain(out[key]) ? merge(out[key] as Plain, value) : value;
    }

    return out;
}

function deepFreeze<T>(value: T): T
{
    if(typeof value === 'object' && value !== null && !Object.isFrozen(value))
    {
        Object.freeze(value);

        for(const child of Object.values(value)) deepFreeze(child);
    }

    return value;
}

/**
 * Merges the sources in order, validates each section against its schema, and freezes the
 * result. Every faulty field ends up in one ConfigError; a section no schema knows is only a
 * warning (a feature removed while its section stayed in config.json, §5.6).
 */
export function loadConfig(sources: readonly IConfigSource[], sections: ReadonlyMap<string, z.ZodObject>): {config: IKernelConfig; warnings: string[]}
{
    const merged = sources.reduce<Plain>((values, source) => merge(values, source.values), {});
    const issues: string[] = [];
    const warnings: string[] = [];

    const parse = <S extends z.ZodType>(name: string, schema: S, value: unknown): z.infer<S> | null =>
    {
        const result = schema.safeParse(value);

        if(result.success) return result.data;

        for(const issue of result.error.issues)
        {
            issues.push(`${[name, ...issue.path.map(String)].join('.')}: ${issue.message}`);
        }

        return null;
    };

    for(const name of Object.keys(merged))
    {
        if(name === 'app' || name === 'legacy' || sections.has(name)) continue;

        const from = [...sources].reverse().find(source => name in source.values)?.name ?? 'the configuration';

        warnings.push(`unknown section "${name}" in ${from} (a removed feature?)`);
    }

    const app = parse('app', AppSection, merged.app ?? {});
    const legacy = parse('legacy', LegacySection, merged.legacy ?? {});
    const parsed = new Map<string, unknown>();

    for(const [id, schema] of sections)
    {
        // Every section can be switched off (§5.3); the kernel adds the field, a feature never does.
        parsed.set(id, parse(id, schema.extend({enabled: z.boolean().default(true)}), merged[id] ?? {}));
    }

    if(issues.length > 0) throw new ConfigError(issues);

    const config: IKernelConfig = {
        app: deepFreeze(app!),
        legacy: deepFreeze(legacy!),
        section: <C>(id: string): Readonly<C & {enabled: boolean}> =>
        {
            if(!parsed.has(id)) throw new Error(`No configuration section "${id}": no feature declares it`);

            return parsed.get(id) as Readonly<C & {enabled: boolean}>;
        }
    };

    for(const section of parsed.values()) deepFreeze(section);

    return {config: Object.freeze(config), warnings};
}
