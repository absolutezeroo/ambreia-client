import type {AvatarImageDirectionCache} from './AvatarImageDirectionCache';

/**
 * Cache layer mapping direction (number) to AvatarImageDirectionCache.
 * Tracks last access time for idle eviction.
 *
 * @see sources/win63_version/habbo/avatar/cache/AvatarImageActionCache.as
 */
export class AvatarImageActionCache
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageActionCache.as::_cache
    private _cache: Map<string, AvatarImageDirectionCache>;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageActionCache.as::_lastAccessTime
    private _lastAccessTime: number;

    constructor()
    {
        this._cache = new Map();
        this._lastAccessTime = Date.now();
    }

    /**
	 * Gets the direction cache for the given direction.
	 *
	 * @param direction - The avatar direction (0-7)
	 * @returns The direction cache, or null if not found
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageActionCache.as::getDirectionCache()
    public getDirectionCache(direction: number): AvatarImageDirectionCache | null
    {
        return this._cache.get(direction.toString()) || null;
    }

    /**
	 * Stores a direction cache for the given direction.
	 *
	 * @param direction - The avatar direction (0-7)
	 * @param cache - The direction cache to store
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageActionCache.as::updateDirectionCache()
    public updateDirectionCache(direction: number, cache: AvatarImageDirectionCache): void
    {
        this._cache.set(direction.toString(), cache);
    }

    /**
	 * Updates the last access timestamp.
	 *
	 * @param time - The timestamp in milliseconds
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageActionCache.as::setLastAccessTime()
    public setLastAccessTime(time: number): void
    {
        this._lastAccessTime = time;
    }

    /**
	 * Gets the last access timestamp.
	 *
	 * @returns The timestamp in milliseconds
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageActionCache.as::getLastAccessTime()
    public getLastAccessTime(): number
    {
        return this._lastAccessTime;
    }

    /**
	 * Disposes all direction caches and clears the map.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageActionCache.as::dispose()
    public dispose(): void
    {
        if(!this._cache) return;

        for(const cache of this._cache.values())
        {
            if(cache) cache.dispose();
        }

        this._cache.clear();
    }
}
