import type {AvatarImagePartContainer} from '../AvatarImagePartContainer';
import type {AvatarImageBodyPartContainer} from '../AvatarImageBodyPartContainer';

/**
 * Cache layer storing rendered body part containers indexed by a composite
 * key derived from the part list frame state.
 *
 * Uses a key cache (Map<number, string>) to avoid recomputing composite keys
 * on repeated lookups for the same frame index, matching the AS3 _keyCache Dictionary.
 *
 * @see sources/win63_version/habbo/avatar/cache/AvatarImageDirectionCache.as
 */
export class AvatarImageDirectionCache
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageDirectionCache.as::KEY_SEPARATOR
    public static readonly KEY_SEPARATOR: string = '/';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageDirectionCache.as::NO_FRAMES_KEY
    public static readonly NO_FRAMES_KEY: string = '-';

    private _partList: AvatarImagePartContainer[];
    private _cache: Map<string, AvatarImageBodyPartContainer>;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageDirectionCache.as::_keyCache
    private _keyCache: Map<number, string>;

    constructor(partList: AvatarImagePartContainer[])
    {
        this._partList = partList;
        this._cache = new Map();
        this._keyCache = new Map();
    }

    /**
	 * Returns the part list used to build this direction cache.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageDirectionCache.as::getPartList()
    public getPartList(): AvatarImagePartContainer[]
    {
        return this._partList;
    }

    /**
	 * Gets a cached body part container for the given frame index.
	 *
	 * @param frameIndex - The animation frame index
	 * @returns The cached container, or null if not found
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageDirectionCache.as::getImageContainer()
    public getImageContainer(frameIndex: number): AvatarImageBodyPartContainer | null
    {
        const key = this.getCacheKey(frameIndex);

        return this._cache.get(key) || null;
    }

    /**
	 * Stores a body part container for the given frame index, disposing
	 * any previously cached container at the same key.
	 *
	 * @param container - The body part container to cache
	 * @param frameIndex - The animation frame index
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageDirectionCache.as::updateImageContainer()
    public updateImageContainer(container: AvatarImageBodyPartContainer, frameIndex: number): void
    {
        const key = this.getCacheKey(frameIndex);
        const existing = this._cache.get(key);

        if(existing)
        {
            const old = existing as AvatarImageBodyPartContainer;

            if(old) old.dispose();
        }

        this._cache.set(key, container);
    }

    /**
	 * Disposes all cached containers and clears references.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageDirectionCache.as::dispose()
    public dispose(): void
    {
        for(const container of this._cache.values())
        {
            if(container) container.dispose();
        }

        this._cache = null!;
        this._partList = null!;
        this._keyCache = null!;
    }

    /**
	 * Builds a composite cache key from all part containers' cacheable keys.
	 * Caches the computed key per frame index to avoid redundant recomputation.
	 *
	 * @param frameIndex - The animation frame index
	 * @returns The composite cache key
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageDirectionCache.as::getCacheKey()
    private getCacheKey(frameIndex: number): string
    {
        if(!this._partList || this._partList.length === 0)
        {
            return AvatarImageDirectionCache.NO_FRAMES_KEY;
        }

        const cached = this._keyCache.get(frameIndex);

        if(cached) return cached;

        const partContainer = this._partList[0];
        let key = partContainer.getCacheableKey(frameIndex);
        const length = this._partList.length;

        for(let i = 1; i < length; i++)
        {
            key += AvatarImageDirectionCache.KEY_SEPARATOR + this._partList[i].getCacheableKey(frameIndex);
        }

        this._keyCache.set(frameIndex, key);

        return key;
    }
}
