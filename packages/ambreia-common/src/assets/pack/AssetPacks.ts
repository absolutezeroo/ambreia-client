import type {AssetPack} from './AssetPack';

/**
 * Where packs stand in for .nitro files: a pack mounted on a directory answers for every
 * `<directory>/<name>.nitro` it holds (NitroBundleLoader asks before fetching). Global like the
 * asset loaders that consult it, which AssetLibrary creates itself.
 */
export class AssetPacks
{
    private static readonly MOUNTS: Array<{directory: string; pack: AssetPack}> = [];

    /** `directory` is the URL the .nitro files are fetched under (`…/dcr/hof_furni/`). */
    static mount(directory: string, pack: AssetPack): void
    {
        const normalized = directory.endsWith('/') ? directory : `${directory}/`;

        AssetPacks.MOUNTS.push({directory: normalized, pack});
    }

    static unmountAll(): void
    {
        AssetPacks.MOUNTS.length = 0;
    }

    /** The pack and piece name standing in for `url`, or null (not a mounted .nitro, or the pack is broken). */
    static resolve(url: string): {pack: AssetPack; name: string} | null
    {
        const path = url.split(/[?#]/)[0];

        if(!path.endsWith('.nitro')) return null;

        for(const {directory, pack} of AssetPacks.MOUNTS)
        {
            if(pack.broken || !path.startsWith(directory)) continue;

            const name = path.slice(directory.length, -'.nitro'.length);

            if(name.length > 0 && !name.includes('/')) return {pack, name};
        }

        return null;
    }
}
