import type {IRoomContentConfiguration} from '@ambreia/iso/scene/IRoomContentConfiguration';

/** `${a}` inside `${b}` inside… stops here, as the client's configuration manager stops. */
const INTERPOLATION_DEPTH_LIMIT = 10;

/**
 * The hotel's legacy properties as the imager needs them: a map with `${key}` interpolation, read
 * by the room engine (IRoomContentConfiguration) and by the routes (`image.library.badgepart.url`,
 * `flash.client.url`). It is what the imager used to boot the client's whole DI container and
 * configuration manager for (AV-02): the imager stands on avatar, iso and common since.
 *
 * A protocol-relative URL resolves to https: a headless renderer has no page to take a scheme from.
 */
export class ImagerProperties implements IRoomContentConfiguration
{
    private readonly _values: Map<string, string>;
    private readonly _resolved = new Map<string, string>();

    constructor(values: Readonly<Record<string, string>>)
    {
        this._values = new Map(Object.entries(values));
    }

    public has(key: string): boolean
    {
        return this._values.has(key);
    }

    public getProperty(key: string): string
    {
        const cached = this._resolved.get(key);

        if(cached !== undefined) return cached;

        let value = this.interpolate(this._values.get(key) ?? '');

        if(value.startsWith('//')) value = `https:${value}`;

        this._resolved.set(key, value);

        return value;
    }

    public getBoolean(key: string): boolean
    {
        const value = this._values.get(key);

        return value !== undefined && (value === '1' || value.toLowerCase() === 'true');
    }

    /** `${key}` replaced by the key's raw value, again while a replacement brings new ones; an unknown key empties the whole text. */
    public interpolate(text: string): string
    {
        let result = text;

        for(let depth = 0; depth < INTERPOLATION_DEPTH_LIMIT && result.includes('${'); depth++)
        {
            let missing = false;

            result = result.replace(/\$\{([^}]*)\}/g, (_match, key: string) =>
            {
                const value = this._values.get(key);

                if(value === undefined) missing = true;

                return value ?? '';
            });

            if(missing) return '';
        }

        return result;
    }
}
