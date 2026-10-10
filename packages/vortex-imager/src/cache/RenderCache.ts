/**
 * Caches rendered PNGs, and collapses concurrent renders of the same image into one.
 *
 * The de-duplication matters more than the cache does. A room full of one guild, or a forum
 * page listing the same avatar twenty times, arrives as twenty simultaneous requests for
 * identical bytes; without this they would each composite from scratch on the one thread the
 * renderer has.
 */
import {LRUCache} from 'lru-cache';
import type {DiskCache} from './DiskCache';

export class RenderCache
{
    private _entries: LRUCache<string, Buffer>;
    private _inFlight: Map<string, Promise<Buffer>> = new Map();
    private _disk: DiskCache | null;

    /**
	 * @param disk Second tier, for images whose key fully describes their pixels — see
	 *   `DiskCache`. `null` keeps the cache memory-only, which is what a room needs.
	 */
    constructor(maxEntries: number, ttlMs: number, disk: DiskCache | null = null)
    {
        this._entries = new LRUCache<string, Buffer>({
            max: Math.max(1, maxEntries),
            ttl: ttlMs > 0 ? ttlMs : undefined
        });
        this._disk = disk;
    }

    get size(): number
    {
        return this._entries.size;
    }

    /** The disk tier, once the asset build it is keyed on is known (after the avatar pipeline boots). */
    attachDisk(disk: DiskCache | null): void
    {
        this._disk = disk;
    }

    async resolve(key: string, render: () => Promise<Buffer>): Promise<{ buffer: Buffer; hit: boolean }>
    {
        const cached = this._entries.get(key);

        if(cached !== undefined) return {buffer: cached, hit: true};

        const pending = this._inFlight.get(key);

        if(pending !== undefined) return {buffer: await pending, hit: true};

        if(this._disk !== null)
        {
            const stored = await this._disk.read(key);

            if(stored !== null)
            {
                this._entries.set(key, stored);

                return {buffer: stored, hit: true};
            }
        }

        const task = render();

        this._inFlight.set(key, task);

        try
        {
            const buffer = await task;

            this._entries.set(key, buffer);

            // Awaited rather than fired and forgotten: it costs a millisecond on the one request
            // that rendered, and a rejected floating promise on a full disk would take the
            // process down instead of the warning `DiskCache.write()` logs.
            if(this._disk !== null) await this._disk.write(key, buffer);

            return {buffer, hit: false};
        }
        finally
        {
            this._inFlight.delete(key);
        }
    }

    clear(): void
    {
        this._entries.clear();
    }
}
