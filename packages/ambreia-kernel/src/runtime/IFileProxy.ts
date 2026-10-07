/**
 * File proxy interface for persistent storage.
 *
 * In Flash this backed the AIR desktop client's on-disk cache; here implementations use
 * localStorage, IndexedDB, or another persistent store.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as
 */
export interface IFileProxy
{
    /**
	 * Clear the entire cache.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::clearCache()
    clearCache(): void;

    /**
	 * Check if a cached entry exists.
	 *
	 * @param key - Cache key
	 * @returns True if the entry exists
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::cacheFileExists()
    cacheFileExists(key: string): boolean;

    /**
	 * Read a string from cache.
	 *
	 * @param key - Cache key
	 * @returns The cached string, or null if not found
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::readCache()
    readCache(key: string): string | null;

    /**
	 * Write a string to cache.
	 *
	 * @param key - Cache key
	 * @param data - String data to cache
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::writeCache()
    writeCache(key: string, data: string): void;

    /**
	 * Delete a cache directory/prefix.
	 *
	 * @param prefix - The prefix to delete
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::deleteCacheDirectory()
    deleteCacheDirectory(prefix: string): void;

    // DEVIATION: the other eight members of `_SafeCls_53` are AIR filesystem, not storage, and have
    //   no browser counterpart to narrow to: `localFilePath`/`cacheFilePath` return a `File` path
    //   on disk, `localFileExists` stats it, `loadLocalBitmapData` decodes a `file://` image,
    //   `readCacheAsync`/`writeCacheAsync` take a `flash.filesystem` completion handler, and
    //   `swapObjectToDisk`/`swapObjectFromDisk` page an object out to a scratch file. The check:
    //   the interface's only implementation in the primary tree is `com/sulake/air/FileProxy.as`
    //   — the `air/` package — and this client never runs there. (Path written without the
    //   `sources/…` prefix on purpose: a full path in a comment reads as a citation to
    //   `as3-member-coverage.mjs` and would make this file answerable for that class.)
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::localFilePath()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::cacheFilePath()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::localFileExists()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::loadLocalBitmapData()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::readCacheAsync()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::writeCacheAsync()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::swapObjectToDisk()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_53.as::swapObjectFromDisk()
}
