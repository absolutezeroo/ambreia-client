/**
 * Per-frame time budget, split by channel.
 *
 * TS-only: AS3 has no counterpart. Flash's own profiler reported a single number, and the port
 * inherited that shape in `RoomSpriteCanvas` — `_averageRenderTime`, the `render Xms` line of the
 * `:showstats` overlay. That number only covers the inside of `RoomRenderingCanvas.render()`
 * (sortable-list build, sort, sprite property writes). It excludes the PixiJS draw submission and
 * the whole Canvas2D window composite, which are separate rAF work in this port and have no Flash
 * equivalent — so the one instrument the client had could not see the two costs most likely to
 * dominate a frame here.
 *
 * Channels are opened and closed by name and summed **within a frame**, so several top-level
 * `renderer.render()` calls in one frame (the main pass plus each render-to-texture pass) add up
 * instead of being averaged apart. `beginFrame()` closes the previous frame and folds its totals
 * into a running mean over `WINDOW` frames, matching how `calculateUpdateInterval()` averages the
 * frame interval next to it.
 *
 * Read the result as a **share of an average frame**, not as the cost of one occurrence: a frame
 * in which a channel never opens folds a zero into that channel's mean. A UI composite costing 8ms
 * but running every other frame reads as 4ms. That is deliberate — it makes the channels
 * commensurable, so `room + pixi + ui` accounts for where the frame goes.
 *
 * The averages are always collected, whether or not the overlay is showing, so toggling
 * `:showstats` reports a warm number rather than one that has to spin up over ~50 frames.
 */
interface IFrameChannel
{
    /** Nesting depth, so a re-entrant `begin()` folds into the outermost span. */
    depth: number;
    /** `performance.now()` at the outermost `begin()`. */
    startedAt: number;
    /** Total ms accumulated by this channel since the last `beginFrame()`. */
    accumulated: number;
    /**
     * Total accumulated since the last `snapshot()`, independent of the frame window.
     *
     * The trailing 50-frame mean below is smoothing for the on-screen overlay, and it is actively
     * misleading in a recorded run: when a load drops the client to about one frame per second, that
     * window spans forty seconds — longer than the run — so every sample reports mostly the frames
     * from before the load. A 15s run read as a steady climb that was really the window filling up.
     * This accumulator is bounded by the sampling interval instead, so a sample describes only the
     * period it covers.
     */
    intervalTotal: number;
    /** Running mean of `accumulated`, in ms, over the last `WINDOW` frames. */
    average: number;
    /** Frames folded into `average` so far, capped at `WINDOW`. */
    sampleCount: number;
}

export class FrameTimings
{
    /** Frames averaged over. Matches the ~50-frame window the fps/render lines already use. */
    // TS-only: see the class note.
    private static readonly WINDOW: number = 50;

    // TS-only: see the class note.
    private static readonly CHANNELS: Map<string, IFrameChannel> = new Map();

    /**
     * Frame intervals longer than this are discarded rather than averaged.
     *
     * A backgrounded tab pauses rAF entirely, so the first frame back reports the whole hidden
     * duration. `RoomRenderingCanvas.calculateUpdateInterval()` rejects such a sample for its own
     * average; this mirrors it, so a dump taken after tabbing away is not silently nonsense.
     */
    // TS-only: see the class note.
    private static readonly MAX_VALID_FRAME_INTERVAL_MS: number = 1000;

    // TS-only: see the class note.
    private static _lastFrameAt: number = 0;

    // TS-only: see the class note.
    private static _frameIntervalAverage: number = 0;

    // TS-only: see the class note.
    private static _frameSampleCount: number = 0;

    /**
     * Frames opened since the last `reset()`.
     *
     * Recorded in every sample so a run can be read for whether frames actually elapsed between
     * two samples. A backgrounded tab pauses rAF — and therefore `beginFrame()` — while `setInterval`
     * keeps firing, which produces consecutive samples holding byte-identical frozen averages. That
     * looks like a steady state and is not one; it is the absence of measurement. Without this
     * counter the two are indistinguishable in the output.
     */
    // TS-only: see the class note.
    private static _frameCount: number = 0;

    /** Per-frame tallies (cache misses, compositions) rather than durations. */
    // TS-only: see the class note.
    private static readonly COUNTERS: Map<string, IFrameChannel> = new Map();

    /** `performance.now()` at the last `snapshot()`, for the interval figures it reports. */
    // TS-only: see the class note.
    private static _intervalStartedAt: number = 0;

    /** `_frameCount` at the last `snapshot()`. */
    // TS-only: see the class note.
    private static _intervalStartFrame: number = 0;

    /**
     * Closes the previous frame and starts a new one.
     *
     * Call once per frame, before any channel opens. A channel still open when this runs (a span
     * that crosses the boundary, e.g. the client's separate render rAF landing after the ticker's)
     * keeps its open span and is billed to the frame it closes in; over a 50-frame mean that
     * one-frame attribution shift does not move the number.
     */
    // TS-only: see the class note.
    public static beginFrame(): void
    {
        const now = performance.now();

        if(FrameTimings._lastFrameAt > 0)
        {
            const interval = now - FrameTimings._lastFrameAt;

            // Same guard the room canvas applies to its own interval average: a tab that was
            // backgrounded reports the whole hidden duration as one frame, and folding that in
            // would poison the mean for the next fifty frames.
            if(interval < FrameTimings.MAX_VALID_FRAME_INTERVAL_MS)
            {
                if(FrameTimings._frameSampleCount < FrameTimings.WINDOW)
                {
                    FrameTimings._frameSampleCount++;
                }

                const count = FrameTimings._frameSampleCount;

                FrameTimings._frameIntervalAverage =
                    ((FrameTimings._frameIntervalAverage * (count - 1)) / count) + (interval / count);
            }
        }

        FrameTimings._lastFrameAt = now;
        FrameTimings._frameCount++;

        FrameTimings.rollWindow(FrameTimings.CHANNELS);
        FrameTimings.rollWindow(FrameTimings.COUNTERS);
    }

    /**
     * Moves whatever the current frame has accumulated so far into the interval total.
     *
     * Only the interval accumulator is touched — the trailing frame average is left alone, because
     * it is keyed to whole frames and a sample landing mid-frame should not shorten one.
     */
    // TS-only: see the class note.
    private static foldPendingFrame(entries: Map<string, IFrameChannel>): void
    {
        for(const entry of entries.values())
        {
            entry.intervalTotal += entry.accumulated;
            entry.accumulated = 0;
        }
    }

    /** Folds one frame's accumulation into each entry's running mean and clears it. */
    // TS-only: see the class note.
    private static rollWindow(entries: Map<string, IFrameChannel>): void
    {
        for(const entry of entries.values())
        {
            if(entry.sampleCount < FrameTimings.WINDOW)
            {
                entry.sampleCount++;
            }

            const count = entry.sampleCount;

            entry.average = ((entry.average * (count - 1)) / count) + (entry.accumulated / count);
            entry.intervalTotal += entry.accumulated;
            entry.accumulated = 0;
        }
    }

    /**
     * Adds to a per-frame tally — how many times something happened in this frame, not how long it
     * took. Reported as a per-frame mean over the same window as the timing channels.
     *
     * The distinction that matters when a cost grows: a tally that climbs alongside the time says
     * the work is being asked for more often, a flat tally alongside climbing time says each
     * occurrence got slower. Those have opposite fixes, and a duration alone cannot tell them apart.
     */
    // TS-only: see the class note.
    public static count(name: string, amount: number = 1): void
    {
        FrameTimings.getEntry(FrameTimings.COUNTERS, name).accumulated += amount;
    }

    /** Opens a span on `channel`. Re-entrant: only the outermost span is timed. */
    // TS-only: see the class note.
    public static begin(channel: string): void
    {
        const entry = FrameTimings.getChannel(channel);

        if(entry.depth === 0)
        {
            entry.startedAt = performance.now();
        }

        entry.depth++;
    }

    /** Closes a span on `channel`, adding its duration to the current frame's total. */
    // TS-only: see the class note.
    public static end(channel: string): void
    {
        const entry = FrameTimings.CHANNELS.get(channel);

        if(entry === undefined || entry.depth === 0) return;

        entry.depth--;

        if(entry.depth === 0)
        {
            entry.accumulated += performance.now() - entry.startedAt;
        }
    }

    /** The running mean for `channel` in ms, or 0 if it has never been sampled. */
    // TS-only: see the class note.
    public static average(channel: string): number
    {
        return FrameTimings.CHANNELS.get(channel)?.average ?? 0;
    }

    /** Frames per second, from the same 50-frame window the channels use. 0 before the first frame. */
    // TS-only: see the class note.
    public static get fps(): number
    {
        return FrameTimings._frameIntervalAverage > 0 ? 1000 / FrameTimings._frameIntervalAverage : 0;
    }

    /**
     * Every channel's current mean, plus the frame rate, as a plain object.
     *
     * Rounded to two decimals: these are 50-frame means of `performance.now()` deltas, and printing
     * a dozen digits of a number whose real precision is well under a tenth of a millisecond invites
     * reading noise as signal.
     */
    // TS-only: see the class note.
    public static snapshot(): {
        heapMb: number;
        frames: number;
        intervalFrames: number;
        intervalMs: number;
        fps: number;
        frameIntervalMs: number;
        channels: Record<string, number>;
        counters: Record<string, number>;
    }
    {
        const now = performance.now();
        const intervalMs = FrameTimings._intervalStartedAt > 0 ? now - FrameTimings._intervalStartedAt : 0;
        const intervalFrames = FrameTimings._frameCount - FrameTimings._intervalStartFrame;

        // Close the in-flight frame into this interval before dividing. `beginFrame()` folds the
        // *previous* frame, so at this point the current one's work is still sitting in
        // `accumulated` — counted in `intervalFrames` but absent from `intervalTotal`. Leaving it
        // there divides N frames of work by N+1 frames and leaks the remainder into the next
        // sample; a test of four 8ms frames after two hundred cheap ones read 6.06ms instead of 8.
        FrameTimings.foldPendingFrame(FrameTimings.CHANNELS);
        FrameTimings.foldPendingFrame(FrameTimings.COUNTERS);

        // Per-frame means over *this interval only*. Dividing by the interval's own frame count is
        // what makes a sample describe the period it covers rather than a trailing window that can
        // outlast the entire run. With no frames in the interval every figure is zero rather than a
        // stale repeat, and `intervalFrames` says so plainly.
        const divisor = intervalFrames > 0 ? intervalFrames : 0;
        const channels: Record<string, number> = {};
        const counters: Record<string, number> = {};

        for(const [name, channel] of FrameTimings.CHANNELS)
        {
            channels[name] = divisor > 0 ? Math.round((channel.intervalTotal / divisor) * 100) / 100 : 0;
            channel.intervalTotal = 0;
        }

        for(const [name, counter] of FrameTimings.COUNTERS)
        {
            counters[name] = divisor > 0 ? Math.round((counter.intervalTotal / divisor) * 100) / 100 : 0;
            counter.intervalTotal = 0;
        }

        FrameTimings._intervalStartedAt = now;
        FrameTimings._intervalStartFrame = FrameTimings._frameCount;

        // Chromium-only, and absent elsewhere — reported as 0 rather than omitted so a run's
        // shape stays the same everywhere. Here to separate two explanations for a cost that
        // carries over between runs: a heap that climbs and never comes back is an accumulation,
        // a flat heap means the slowdown is somewhere the JS allocator cannot see.
        const memory = (performance as unknown as {memory?: {usedJSHeapSize: number}}).memory;

        return {
            heapMb: memory ? Math.round(memory.usedJSHeapSize / 1048576) : 0,
            frames: FrameTimings._frameCount,
            intervalFrames,
            intervalMs: Math.round(intervalMs),
            // Measured from this interval's own frames and wall time, not from the smoothed
            // interval average — the two disagreed by two orders of magnitude on a collapsed
            // frame rate, and this is the one that is true.
            fps: intervalMs > 0 ? Math.round((intervalFrames / (intervalMs / 1000)) * 100) / 100 : 0,
            frameIntervalMs: intervalFrames > 0 ? Math.round((intervalMs / intervalFrames) * 100) / 100 : 0,
            channels,
            counters
        };
    }

    /** Drops every channel. Used when a session tears down so a new one starts from clean numbers. */
    // TS-only: see the class note.
    public static reset(): void
    {
        FrameTimings.CHANNELS.clear();
        FrameTimings.COUNTERS.clear();
        FrameTimings._lastFrameAt = 0;
        FrameTimings._frameIntervalAverage = 0;
        FrameTimings._frameSampleCount = 0;
        FrameTimings._frameCount = 0;
        FrameTimings._intervalStartedAt = 0;
        FrameTimings._intervalStartFrame = 0;
    }

    // TS-only: see the class note.
    private static getChannel(channel: string): IFrameChannel
    {
        return FrameTimings.getEntry(FrameTimings.CHANNELS, channel);
    }

    // TS-only: see the class note.
    private static getEntry(entries: Map<string, IFrameChannel>, name: string): IFrameChannel
    {
        let entry = entries.get(name);

        if(entry === undefined)
        {
            entry = {depth: 0, startedAt: 0, accumulated: 0, intervalTotal: 0, average: 0, sampleCount: 0};
            entries.set(name, entry);
        }

        return entry;
    }
}

/** PixiJS draw submission — everything between the renderer's `prerender` and `postrender`. */
// TS-only: see the FrameTimings class note.
export const FRAME_CHANNEL_PIXI: string = 'pixi';

/** The Canvas2D window composite: skin re-render, tree walk, full-screen blit. */
// TS-only: see the FrameTimings class note.
export const FRAME_CHANNEL_UI: string = 'ui';

/** Incoming packets: decipher, framing, and every parser and handler they reach. */
// TS-only: see the FrameTimings class note.
export const FRAME_CHANNEL_NET: string = 'net';

/**
 * Phase 1 of the room loop: each object's visualization update, and the sprites it produces.
 * An avatar recomposing its canvas and uploading a texture is billed here.
 */
// TS-only: see the FrameTimings class note.
export const FRAME_CHANNEL_ROOM_OBJECTS: string = 'room.obj';

/** Phase 2 of the room loop: the depth sort over the sortable sprite list. */
// TS-only: see the FrameTimings class note.
export const FRAME_CHANNEL_ROOM_SORT: string = 'room.sort';

/** Phase 3 of the room loop: writing PixiJS display properties, and pooling unused sprites. */
// TS-only: see the FrameTimings class note.
export const FRAME_CHANNEL_ROOM_SPRITES: string = 'room.spr';

/** Time spent inside `AvatarImageCache.renderBodyPart()` — one body part composed onto a canvas. */
// TS-only: see the FrameTimings class note.
export const FRAME_CHANNEL_AVATAR_COMPOSE: string = 'avatar.compose.ms';

/** Body-part cache lookups per frame, hits included. */
// TS-only: see the FrameTimings class note.
export const AVATAR_COUNTER_LOOKUP: string = 'avatar.lookup';

/** Body-part compositions per frame — the lookups that missed. */
// TS-only: see the FrameTimings class note.
export const AVATAR_COUNTER_COMPOSE: string = 'avatar.compose';

/** Compositions per frame that came back uncacheable, and so will be redone next frame. */
// TS-only: see the FrameTimings class note.
export const AVATAR_COUNTER_UNCACHEABLE: string = 'avatar.uncacheable';

/**
 * Compositions per frame that were stored in the cache.
 *
 * The discriminator for a cache that never hits: if this tracks `avatar.compose`, the work is being
 * cached and something is throwing it away or reading it back under a different key. If it stays
 * near zero, nothing is ever stored and the lookups are missing for the plain reason that the cache
 * is empty. Those are opposite bugs and the timings alone cannot tell them apart.
 */
// TS-only: see the FrameTimings class note.
export const AVATAR_COUNTER_CACHED: string = 'avatar.cached';

/** Compositions per frame that produced no container at all — the parts failed to resolve. */
// TS-only: see the FrameTimings class note.
export const AVATAR_COUNTER_NULL: string = 'avatar.null';
