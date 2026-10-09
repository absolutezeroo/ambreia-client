import {AmbreiaDirectory, httpBytes} from './AmbreiaDirectory';
import type {FetchBytes} from './AmbreiaDirectory';
import {decodeMasterKey, encryptedLayout} from './AmbreiaLayout';

/** The families served as .ambreia directories (spec 2026-10-09-ambreia-everything). */
export const ASSET_FAMILIES = ['clothing', 'effects', 'room', 'pets', 'furniture'] as const;

export type AssetFamily = typeof ASSET_FAMILIES[number];

/**
 * The families, plus `icons`: the hotel's catalogue icons, which only tools ask for (the imager
 * serves them); null when config.json does not name it.
 */
export type IAssetDirectories = Readonly<Record<AssetFamily, AmbreiaDirectory> & {icons: AmbreiaDirectory | null}>;

/** config.json → `asset-packs`: a directory URL per family and the master key of encrypted ones. */
export type IAssetPacksSettings = Partial<Record<AssetFamily | 'icons', string>> & {key?: string};

/**
 * One AmbreiaDirectory per family. Every family is required: there is no .nitro to fall back on, so a
 * missing one would draw nothing, silently. The key's layout is shared; a key WebCrypto cannot use
 * (no secure origin) makes every encrypted directory unreadable, which each loader reports once.
 */
export function openAssetDirectories(settings: IAssetPacksSettings, interpolate: (text: string) => string = text => text, fetch: FetchBytes = httpBytes): IAssetDirectories
{
    const missing = ASSET_FAMILIES.filter(family => !settings[family]);

    if(missing.length > 0) throw new Error(`asset-packs: no directory for ${missing.join(', ')}`);

    const layout = settings.key ? encryptedLayout(decodeMasterKey(settings.key)) : null;

    // Handled here so a key that cannot be used is not also an unhandled rejection; the directories
    // still await the original promise and fail with its reason.
    layout?.catch(() => undefined);

    const open = (url: string): AmbreiaDirectory => new AmbreiaDirectory(interpolate(url), fetch, layout);

    return {
        ...Object.fromEntries(ASSET_FAMILIES.map(family => [family, open(settings[family]!)])) as Record<AssetFamily, AmbreiaDirectory>,
        icons: settings.icons ? open(settings.icons) : null
    };
}
