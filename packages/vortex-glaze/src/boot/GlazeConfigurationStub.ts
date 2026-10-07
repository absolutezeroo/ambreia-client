/**
 * GlazeConfigurationStub — the property source behind `${…}` in a layout's `asset_uri`.
 *
 * **Without it every externally-hosted image in a layout renders as nothing.** 189 of the shipped
 * layouts write `asset_uri` as `${image.library.url}guilds/group_bg.png`, and `ResourceManager`
 * resolves that through `windowManager.interpolate()`, which GlazeBoot points at this stub. Glaze
 * deliberately skips the real `HabboConfigurationManager` (it drags in the communication manager
 * and the external-variables download); before this stub `interpolate()` returned `''` and the
 * loader was handed an empty URI — no request, no image, no warning. Window backgrounds, badges and
 * every other CDN-hosted bitmap silently vanished, while the skin atlases (which are in the local
 * bundle) kept rendering, so the layouts looked half-drawn rather than broken.
 *
 * Only the three URL properties layouts actually reference are seeded; the rest of `${…}` in the
 * XML are localization keys, which `GlazeLocalizationStub` answers instead. The values mirror the
 * hotel's `external_variables.json` — override them with `VITE_GLAZE_IMAGE_LIBRARY_URL` when
 * pointing Glaze at a different hotel.
 *
 * `interpolate()` reproduces `HabboConfigurationManager.interpolate()` exactly, **including its
 * all-or-nothing failure**: one unknown key blanks the whole string rather than leaving it partly
 * expanded. Diverging there would make Glaze render URIs the client never would.
 */
export class GlazeConfigurationStub
{
    /** Matches `HabboConfigurationManager.INTERPOLATION_DEPTH_LIMIT`. */
    private static readonly INTERPOLATION_DEPTH_LIMIT: number = 3;

    /** The hotel's own values, from `external_variables.json`. */
    private static readonly DEFAULT_IMAGE_LIBRARY_URL: string = 'http://vortex-assets.local/c_images/';

    private readonly _properties: Map<string, string> = new Map();

    public constructor(overrides: Record<string, string> | null = null)
    {
        const override = (import.meta.env?.VITE_GLAZE_IMAGE_LIBRARY_URL ?? null) as string | null;
        const base = override ?? GlazeConfigurationStub.DEFAULT_IMAGE_LIBRARY_URL;

        this._properties.set('image.library.url', base);
        this._properties.set('image.library.questing.url', `${base}Quests/`);
        this._properties.set('url.prefix', base);

        for(const [key, value] of Object.entries(overrides ?? {}))
        {
            this._properties.set(key, value);
        }
    }

    public propertyExists(key: string): boolean
    {
        return this._properties.has(key);
    }

    public getProperty(key: string): string
    {
        return this._properties.get(key) ?? '';
    }

    public setProperty(key: string, value: string): void
    {
        this._properties.set(key, value);
    }

    public getBoolean(key: string): boolean
    {
        const value = this._properties.get(key);

        return value === '1' || value === 'true';
    }

    public getInteger(key: string, defaultValue: number): number
    {
        const parsed = parseInt(this._properties.get(key) ?? '', 10);

        return Number.isNaN(parsed) ? defaultValue : parsed;
    }

    /** See the class note: an unknown key blanks the whole string, as the real manager does. */
    public interpolate(value: string): string
    {
        if(!value) return value;

        let interpolated = value;
        let limit = GlazeConfigurationStub.INTERPOLATION_DEPTH_LIMIT;

        while(limit-- > 0)
        {
            if(!interpolated.includes('${')) break;

            let unknown = false;

            const next = interpolated.replace(/\$\{([^}]*)\}/g, (_match, key: string) =>
            {
                if(!this.propertyExists(key))
                {
                    unknown = true;

                    return '';
                }

                return this.getProperty(key);
            });

            if(unknown) return '';

            interpolated = next;
        }

        return interpolated;
    }

    /** Glaze is served over plain HTTP in dev, so the real HTTPS rewrite has nothing to do here. */
    public updateUrlProtocol(url: string): string
    {
        return url;
    }
}
