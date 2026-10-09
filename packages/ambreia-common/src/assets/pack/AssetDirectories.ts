import {AmbreiaDirectory, httpBytes} from './AmbreiaDirectory';
import type {FetchBytes} from './AmbreiaDirectory';
import {decodeMasterKey, encryptedLayout} from './AmbreiaLayout';

/** The families served as .ambreia directories (spec 2026-10-09-ambreia-everything). */
export const ASSET_FAMILIES = ['clothing', 'effects', 'room', 'pets', 'furniture'] as const;

export type AssetFamily = typeof ASSET_FAMILIES[number];

/**
 * The families, plus `icons`: the hotel's catalogue icons, which only tools read (the imager serves
 * them to the map editor); the client never asks it for anything.
 */
export type IAssetDirectories = Readonly<Record<AssetFamily | 'icons', AmbreiaDirectory>>;

/** config.json → `asset-packs`: a directory URL per family and the master key of encrypted ones. */
export type IAssetPacksSettings = Partial<Record<AssetFamily | 'icons', string>> & {key?: string};

/**
 * One AmbreiaDirectory per family. A family config.json leaves out is the asset host's own
 * `${url.prefix}/ambreia/<family>/`: a deployment without a config.json (the Docker images) still
 * finds its assets, and only the key of encrypted directories has to come from it. The key's layout is
 * shared; a key WebCrypto cannot use (no secure origin) makes every encrypted directory unreadable,
 * which each loader reports once.
 */
export function openAssetDirectories(settings: IAssetPacksSettings, interpolate: (text: string) => string = text => text, fetch: FetchBytes = httpBytes): IAssetDirectories
{
    const layout = settings.key ? encryptedLayout(decodeMasterKey(settings.key)) : null;

    // Handled here so a key that cannot be used is not also an unhandled rejection; the directories
    // still await the original promise and fail with its reason.
    layout?.catch(() => undefined);

    const open = (family: AssetFamily | 'icons'): [string, AmbreiaDirectory] =>
        [family, new AmbreiaDirectory(interpolate(settings[family] ?? `\${url.prefix}/ambreia/${family}/`), fetch, layout)];

    return Object.fromEntries([...ASSET_FAMILIES, 'icons' as const].map(open)) as unknown as IAssetDirectories;
}
