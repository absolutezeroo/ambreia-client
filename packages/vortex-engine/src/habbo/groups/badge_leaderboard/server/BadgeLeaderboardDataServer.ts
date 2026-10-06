/**
 * BadgeLeaderboardDataServer — the caching layer between the leaderboard view and the wire.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/groups/badge_leaderboard/server/BadgeLeaderboardDataServer.as
 *
 * The board shows 10 rows at a time but the server answers in 50-row chunks, so paging inside a
 * chunk costs nothing and only every fifth page crosses the network. Three rules follow from that:
 *
 * - a page is delivered from cache immediately if its chunk is present, and the chunk is refreshed
 *   behind it when older than `STALE_AFTER_MS`;
 * - the *next* chunk is prefetched once the reader is within `PREFETCH_BOUNDARY_DISTANCE` pages of
 *   the end of the current one;
 * - a chunk already in flight is never requested twice (`inFlightChunkIndices`).
 *
 * `deliverPage()` carries the only subtle guard: a page is dropped if it is no longer the one
 * asked for, or if this exact (request, chunk-sync-time) pair has already been delivered — which
 * is what stops a prefetch reply from re-rendering a page the user is already looking at.
 *
 * Every cache is keyed per `(type, rarity)` board, so switching filters and switching back does not
 * re-fetch.
 */
import type {IMessageComposer} from '@core/communication/messages/IMessageComposer';
import type {BadgeLeaderboardMessageParser} from '@habbo/communication/messages/parser/users/BadgeLeaderboardMessageParser';
import {
    GetBadgeLeaderboardMessageComposer
} from '@habbo/communication/messages/outgoing/users/GetBadgeLeaderboardMessageComposer';
import {BadgeLeaderboardPageData} from '../BadgeLeaderboardPageData';
import {BadgeLeaderboardDataServerChunk} from './BadgeLeaderboardDataServerChunk';
import {BadgeLeaderboardDataServerContext} from './BadgeLeaderboardDataServerContext';
import {BadgeLeaderboardResolvedPage} from './BadgeLeaderboardResolvedPage';

export class BadgeLeaderboardDataServer
{
    // AS3: BadgeLeaderboardDataServer.as::PAGE_SIZE
    public static readonly PAGE_SIZE: number = 10;

    /** Derived name — `_SafeStr_10760`: rows per request, and per cached chunk. */
    // AS3: BadgeLeaderboardDataServer.as::_SafeStr_10760
    private static readonly CHUNK_SIZE: number = 50;

    // AS3: BadgeLeaderboardDataServer.as::PAGES_PER_FETCH
    private static readonly PAGES_PER_FETCH: number = 5;

    // AS3: BadgeLeaderboardDataServer.as::STALE_AFTER_MS
    private static readonly STALE_AFTER_MS: number = 60000;

    // AS3: BadgeLeaderboardDataServer.as::PREFETCH_BOUNDARY_DISTANCE
    private static readonly PREFETCH_BOUNDARY_DISTANCE: number = 1;

    // AS3: BadgeLeaderboardDataServer.as::_disposed
    private _disposed: boolean = false;

    /** Derived name — `_SafeStr_7088`: the controller's `send()`. */
    // AS3: BadgeLeaderboardDataServer.as::_SafeStr_7088
    private _send: ((composer: IMessageComposer<unknown[]>) => void) | null;

    /** Derived name — `_SafeStr_7228`: context key -> context. AS3 keys a `Dictionary`. */
    // AS3: BadgeLeaderboardDataServer.as::_SafeStr_7228
    private _contexts: Map<string, BadgeLeaderboardDataServerContext> = new Map();

    // AS3: BadgeLeaderboardDataServer.as::_activeContextKey
    private _activeContextKey: string | null = null;

    /** Derived name — `_SafeStr_7743`: the page currently asked for. */
    // AS3: BadgeLeaderboardDataServer.as::_SafeStr_7743
    private _activePage: number = 0;

    // AS3: BadgeLeaderboardDataServer.as::_activeCallback
    private _activeCallback: ((data: BadgeLeaderboardPageData) => void) | null = null;

    /** Derived name — `_SafeStr_7788`: incremented per `requestPage()`, so a reply can be dated. */
    // AS3: BadgeLeaderboardDataServer.as::_SafeStr_7788
    private _requestCounter: number = 0;

    // AS3: BadgeLeaderboardDataServer.as::_activeDeliveredChunkSyncTime
    private _activeDeliveredChunkSyncTime: number = -1;

    /** Derived name — `_SafeStr_8054`: the request the last delivery belonged to. */
    // AS3: BadgeLeaderboardDataServer.as::_SafeStr_8054
    private _activeDeliveredRequest: number = -1;

    // AS3: BadgeLeaderboardDataServer.as::BadgeLeaderboardDataServer()
    constructor(send: ((composer: IMessageComposer<unknown[]>) => void) | null)
    {
        this._send = send;
    }

    /**
     * AS3 reads `flash.utils.getTimer()`; `performance.now()` is this port's monotonic clock, as
     * `HabboClubCenter` already uses it.
     */
    // AS3: BadgeLeaderboardDataServer.as::getTimer()
    private static getTimer(): number
    {
        return performance.now();
    }

    // AS3: BadgeLeaderboardDataServer.as::requestPage()
    public requestPage(
        type: number,
        rarity: number,
        page: number,
        callback: ((data: BadgeLeaderboardPageData) => void) | null
    ): void
    {
        if(this._disposed) return;

        if(page < 0)
        {
            page = 0;
        }

        const context = this.getContext(type, rarity);

        this._activeContextKey = context.key;
        this._activePage = page;
        this._activeCallback = callback;
        this._requestCounter = this._requestCounter + 1;
        this._activeDeliveredChunkSyncTime = -1;
        this._activeDeliveredRequest = -1;

        const resolved = this.resolvePage(context, page);

        if(resolved !== null)
        {
            this.deliverPage(resolved);

            if(resolved.isStale)
            {
                this.synchronizeChunk(context, resolved.chunkIndex);
            }
        }
        else
        {
            const chunkIndex = BadgeLeaderboardDataServer.getChunkIndex(page);

            if(BadgeLeaderboardDataServer.canChunkExist(context, chunkIndex))
            {
                this.synchronizeChunk(context, chunkIndex);
            }
            else
            {
                // Past the end of the board: hand back an empty page rather than leave the view
                // waiting on a request that will never be made.
                this.deliverPage(new BadgeLeaderboardResolvedPage(
                    new BadgeLeaderboardPageData(
                        type, rarity, page, context.totalEntries, [], context.ownEntry
                    ),
                    chunkIndex,
                    -1,
                    false
                ));
            }
        }

        this.prefetchAroundPage(context, page);
    }

    /**
     * Chunks of a size this client did not ask for are ignored outright — AS3 tests `size != 50`.
     */
    // AS3: BadgeLeaderboardDataServer.as::onBadgeLeaderboardResult()
    public onBadgeLeaderboardResult(parser: BadgeLeaderboardMessageParser | null): void
    {
        if(this._disposed || parser == null || parser.size !== BadgeLeaderboardDataServer.CHUNK_SIZE)
        {
            return;
        }

        const context = this.getContext(parser.type, parser.rarity);
        const now = BadgeLeaderboardDataServer.getTimer();
        const chunk = new BadgeLeaderboardDataServerChunk(
            parser.page,
            parser.totalEntries,
            parser.entries == null ? [] : parser.entries.concat(),
            parser.ownEntry,
            now
        );

        context.chunks.set(chunk.chunkIndex, chunk);
        context.inFlightChunkIndices.set(chunk.chunkIndex, false);
        context.totalEntries = parser.totalEntries;
        context.ownEntry = parser.ownEntry;

        if(this._activeContextKey === context.key)
        {
            this.deliverActivePageIfAvailable(context);
            this.prefetchAroundPage(context, this._activePage);
        }
    }

    // AS3: BadgeLeaderboardDataServer.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: BadgeLeaderboardDataServer.as::deliverActivePageIfAvailable()
    private deliverActivePageIfAvailable(context: BadgeLeaderboardDataServerContext): void
    {
        const resolved = this.resolvePage(context, this._activePage);

        if(resolved !== null)
        {
            this.deliverPage(resolved);
        }
    }

    // AS3: BadgeLeaderboardDataServer.as::deliverPage()
    private deliverPage(resolved: BadgeLeaderboardResolvedPage | null): void
    {
        if(this._activeCallback === null || resolved == null || this._disposed) return;

        if(resolved.data.page !== this._activePage
            || BadgeLeaderboardDataServer.getContextKey(resolved.data.type, resolved.data.rarity)
                !== this._activeContextKey)
        {
            return;
        }

        if(this._activeDeliveredRequest === this._requestCounter
            && this._activeDeliveredChunkSyncTime === resolved.chunkSyncTime)
        {
            return;
        }

        this._activeDeliveredRequest = this._requestCounter;
        this._activeDeliveredChunkSyncTime = resolved.chunkSyncTime;

        this._activeCallback(resolved.data);
    }

    /**
     * Cuts the 10 rows for `page` out of its 50-row chunk. `ownEntry` falls back to the context's
     * copy when the chunk did not carry one.
     */
    // AS3: BadgeLeaderboardDataServer.as::resolvePage()
    private resolvePage(
        context: BadgeLeaderboardDataServerContext,
        page: number
    ): BadgeLeaderboardResolvedPage | null
    {
        const chunkIndex = BadgeLeaderboardDataServer.getChunkIndex(page);
        const chunk = context.chunks.get(chunkIndex) ?? null;

        if(chunk === null)
        {
            return null;
        }

        const pageWithinChunk = page % BadgeLeaderboardDataServer.PAGES_PER_FETCH;
        const offset = pageWithinChunk * BadgeLeaderboardDataServer.PAGE_SIZE;
        const entries = [];
        const count = Math.max(
            0, Math.min(BadgeLeaderboardDataServer.PAGE_SIZE, chunk.entries.length - offset)
        );

        for(let index = 0; index < count; index++)
        {
            entries.push(chunk.entries[offset + index]);
        }

        const ownEntry = chunk.ownEntry ?? context.ownEntry;
        const isStale = BadgeLeaderboardDataServer.getTimer() - chunk.lastSynchronizedAt
            > BadgeLeaderboardDataServer.STALE_AFTER_MS;

        return new BadgeLeaderboardResolvedPage(
            new BadgeLeaderboardPageData(
                context.type, context.rarity, page, chunk.totalEntries, entries, ownEntry
            ),
            chunkIndex,
            chunk.lastSynchronizedAt,
            isStale
        );
    }

    // AS3: BadgeLeaderboardDataServer.as::prefetchAroundPage()
    private prefetchAroundPage(context: BadgeLeaderboardDataServerContext, page: number): void
    {
        const chunkIndex = BadgeLeaderboardDataServer.getChunkIndex(page);
        const pagesToChunkEnd = (chunkIndex + 1) * BadgeLeaderboardDataServer.PAGES_PER_FETCH - 1 - page;

        if(pagesToChunkEnd > BadgeLeaderboardDataServer.PREFETCH_BOUNDARY_DISTANCE)
        {
            return;
        }

        const nextChunkIndex = chunkIndex + 1;

        if(!BadgeLeaderboardDataServer.canChunkExist(context, nextChunkIndex))
        {
            return;
        }

        const next = context.chunks.get(nextChunkIndex) ?? null;

        if(next === null
            || BadgeLeaderboardDataServer.getTimer() - next.lastSynchronizedAt
                > BadgeLeaderboardDataServer.STALE_AFTER_MS)
        {
            this.synchronizeChunk(context, nextChunkIndex);
        }
    }

    // AS3: BadgeLeaderboardDataServer.as::synchronizeChunk()
    private synchronizeChunk(context: BadgeLeaderboardDataServerContext | null, chunkIndex: number): void
    {
        if(this._disposed || context == null || this._send === null
            || !BadgeLeaderboardDataServer.canChunkExist(context, chunkIndex)
            || context.inFlightChunkIndices.get(chunkIndex) === true)
        {
            return;
        }

        context.inFlightChunkIndices.set(chunkIndex, true);

        this._send(new GetBadgeLeaderboardMessageComposer(
            context.type, context.rarity, chunkIndex, BadgeLeaderboardDataServer.CHUNK_SIZE
        ));
    }

    /** An unknown length (-1) allows any chunk — that is how the first request gets made. */
    // AS3: BadgeLeaderboardDataServer.as::canChunkExist()
    private static canChunkExist(context: BadgeLeaderboardDataServerContext, chunkIndex: number): boolean
    {
        if(chunkIndex < 0)
        {
            return false;
        }

        if(context.totalEntries < 0)
        {
            return true;
        }

        return chunkIndex * BadgeLeaderboardDataServer.CHUNK_SIZE < context.totalEntries;
    }

    // AS3: BadgeLeaderboardDataServer.as::getContext()
    private getContext(type: number, rarity: number): BadgeLeaderboardDataServerContext
    {
        const key = BadgeLeaderboardDataServer.getContextKey(type, rarity);
        let context = this._contexts.get(key) ?? null;

        if(context === null)
        {
            context = new BadgeLeaderboardDataServerContext(type, rarity, key);
            this._contexts.set(key, context);
        }

        return context;
    }

    // AS3: BadgeLeaderboardDataServer.as::getChunkIndex()
    private static getChunkIndex(page: number): number
    {
        return Math.trunc(page / BadgeLeaderboardDataServer.PAGES_PER_FETCH);
    }

    // AS3: BadgeLeaderboardDataServer.as::getContextKey()
    private static getContextKey(type: number, rarity: number): string
    {
        return `${type}:${rarity}`;
    }

    // AS3: BadgeLeaderboardDataServer.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._send = null;
        this._contexts = new Map();
        this._activeContextKey = null;
        this._activeCallback = null;
        this._disposed = true;
    }
}
