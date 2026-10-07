import {Logger} from './Logger';

const log = Logger.getLogger('core.utils.SelfProfiler');

/** One function's share of the profile. */
export interface IProfileEntry
{
    /** `name @file:line`, or just the name for a frame with no source. */
    label: string;
    /** Milliseconds sampled with this function on top of the stack. */
    selfMs: number;
    /** Milliseconds sampled with this function anywhere on the stack. */
    totalMs: number;
    /** Share of the profile, 0..100. */
    selfPercent: number;
}

/** A native builtin's cost, charged to the application function that called it. */
export interface INativeBlame
{
    /** `drawImage <- createUnionImage @AvatarImageCache.ts:843`. */
    label: string;
    selfMs: number;
    selfPercent: number;
}

/** A finished profile, already reduced to something readable. */
export interface IProfileResult
{
    durationMs: number;
    sampleCount: number;
    /** Functions by self time, heaviest first. */
    entries: IProfileEntry[];
    /**
     * Native builtins by the code that asked for them, heaviest first.
     *
     * The entries above name `drawImage` or `save` with no idea who called them, and reading a
     * native total by eye is exactly how a fix predicted at a third of the frame delivered 14%.
     * This walks each native leaf up to the first frame that has a source file.
     */
    natives: INativeBlame[];
}

/**
 * Wraps the browser's JS Self-Profiling API so a benchmark can profile itself.
 *
 * TS-only: no AS3 counterpart.
 *
 * The point is to stop guessing who pays for native work. A hand-placed `performance.now()` timer
 * measures the thread it runs on, wall clock included, so a renderer blocked on a synchronous
 * canvas readback reads as expensive JavaScript — a mistake that cost a long chase here. And a
 * DevTools trace, while correct, reports native totals: `save` came out at 36.7% of a run and was
 * attributed by eye to the wrong function, producing a fix predicted at a third of the frame that
 * delivered 14%.
 *
 * This sampler only ever sees JavaScript stacks, which turns out to be exactly what was wanted:
 * time spent inside `ctx.drawImage` or `getImageData` is charged to the JS function that called it.
 * The attribution is structural rather than inferred.
 *
 * Requires the document to be served with `Document-Policy: js-profiling` — the dev server sets it.
 * Everything here degrades to "unavailable" without it, so a production build simply has no
 * profiler rather than a broken one.
 */
export class SelfProfiler
{
    /**
     * Requested sampling period in ms.
     *
     * A hint: the browser clamps it, and a 15s run at the clamped rate still yields on the order of
     * a thousand samples, which is ample for ranking functions.
     */
    // TS-only: see the class note.
    private static readonly SAMPLE_INTERVAL_MS: number = 10;

    // TS-only: see the class note.
    private static readonly MAX_BUFFER_SIZE: number = 200000;

    private static _active: {stop: () => Promise<unknown>} | null = null;
    private static _startedAt: number = 0;

    /** Whether this browser and document can profile at all. */
    // TS-only: see the class note.
    public static get available(): boolean
    {
        return typeof (globalThis as {Profiler?: unknown}).Profiler === 'function';
    }

    /** Whether a profile is being recorded. */
    // TS-only: see the class note.
    public static get running(): boolean
    {
        return SelfProfiler._active !== null;
    }

    /**
     * Begins recording. Returns false when unavailable or already running, so a caller can say so
     * rather than silently producing nothing.
     */
    // TS-only: see the class note.
    public static start(): boolean
    {
        if(!SelfProfiler.available || SelfProfiler._active !== null) return false;

        try
        {
            const Ctor = (globalThis as unknown as {
                Profiler: new (options: {sampleInterval: number; maxBufferSize: number}) => {stop: () => Promise<unknown>};
            }).Profiler;

            SelfProfiler._active = new Ctor({
                sampleInterval: SelfProfiler.SAMPLE_INTERVAL_MS,
                maxBufferSize: SelfProfiler.MAX_BUFFER_SIZE
            });
            SelfProfiler._startedAt = performance.now();

            return true;
        }
        catch (error)
        {
            log.warn(`Could not start the profiler: ${(error as Error).message}`);
            SelfProfiler._active = null;

            return false;
        }
    }

    /** Stops recording and reduces the trace. Null if nothing was running or it failed. */
    // TS-only: see the class note.
    public static async stop(): Promise<IProfileResult | null>
    {
        const active = SelfProfiler._active;

        if(active === null) return null;

        SelfProfiler._active = null;

        try
        {
            const trace = await active.stop() as {
                frames: {name?: string; resourceId?: number; line?: number}[];
                resources: string[];
                stacks: {frameId: number; parentId?: number}[];
                samples: {stackId?: number; timestamp: number}[];
            };

            return SelfProfiler.reduce(trace, performance.now() - SelfProfiler._startedAt);
        }
        catch (error)
        {
            log.warn(`Could not stop the profiler: ${(error as Error).message}`);

            return null;
        }
    }

    /**
     * Turns the raw trace into self and total time per function.
     *
     * A sample's weight is the gap to the next one rather than a flat count: the browser is free to
     * skip samples under load, and the frames that matter are precisely the ones running when it
     * does, so counting samples equally would under-report exactly the wrong functions.
     */
    // TS-only: see the class note.
    private static reduce(
        trace: {
            frames: {name?: string; resourceId?: number; line?: number}[];
            resources: string[];
            stacks: {frameId: number; parentId?: number}[];
            samples: {stackId?: number; timestamp: number}[];
        },
        durationMs: number
    ): IProfileResult
    {
        const labelOf = (frameId: number): string =>
        {
            const frame = trace.frames[frameId];

            if(frame === undefined) return '(unknown)';

            const name = frame.name && frame.name.length > 0 ? frame.name : '(anonymous)';
            const resource = frame.resourceId !== undefined ? trace.resources[frame.resourceId] : undefined;
            const file = resource !== undefined ? resource.split('/').pop() : undefined;

            return file !== undefined ? `${name} @${file}:${frame.line ?? 0}` : name;
        };

        const self = new Map<string, number>();
        const total = new Map<string, number>();
        const natives = new Map<string, number>();
        // A frame with no source file is a builtin: the sampler walks JavaScript stacks, so
        // `drawImage` appears as a frame of its own only when it is the one executing.
        const isNative = (frameId: number): boolean => trace.frames[frameId]?.resourceId === undefined;
        let sampled = 0;

        for(let i = 0; i < trace.samples.length; i++)
        {
            const sample = trace.samples[i];
            const next = trace.samples[i + 1];
            const weight = next !== undefined
                ? Math.max(0, next.timestamp - sample.timestamp)
                : SelfProfiler.SAMPLE_INTERVAL_MS;

            if(sample.stackId === undefined) continue;

            sampled += weight;

            const leaf = trace.stacks[sample.stackId];

            if(leaf === undefined) continue;

            const leafLabel = labelOf(leaf.frameId);

            self.set(leafLabel, (self.get(leafLabel) ?? 0) + weight);

            if(isNative(leaf.frameId))
            {
                let up: {frameId: number; parentId?: number} | null =
                    leaf.parentId !== undefined ? (trace.stacks[leaf.parentId] ?? null) : null;

                while(up !== null && isNative(up.frameId))
                {
                    up = up.parentId !== undefined ? (trace.stacks[up.parentId] ?? null) : null;
                }

                if(up !== null)
                {
                    const key = `${leafLabel}  <-  ${labelOf(up.frameId)}`;

                    natives.set(key, (natives.get(key) ?? 0) + weight);
                }
            }

            // Each frame on the stack gets the sample once, so recursion cannot inflate a total.
            const seen = new Set<string>();
            // `| null` rather than `| undefined`, per the style guide; the trace's own optional
            // `parentId` is normalised on the way in.
            let cursor: {frameId: number; parentId?: number} | null = leaf;

            while(cursor !== null)
            {
                const label = labelOf(cursor.frameId);

                if(!seen.has(label))
                {
                    seen.add(label);
                    total.set(label, (total.get(label) ?? 0) + weight);
                }

                cursor = cursor.parentId !== undefined ? (trace.stacks[cursor.parentId] ?? null) : null;
            }
        }

        const entries: IProfileEntry[] = [...self.entries()]
            .map(([label, selfMs]) => ({
                label,
                selfMs: Math.round(selfMs * 100) / 100,
                totalMs: Math.round((total.get(label) ?? 0) * 100) / 100,
                selfPercent: sampled > 0 ? Math.round((selfMs / sampled) * 1000) / 10 : 0
            }))
            .sort((a, b) => b.selfMs - a.selfMs);

        const nativeEntries: INativeBlame[] = [...natives.entries()]
            .map(([label, selfMs]) => ({
                label,
                selfMs: Math.round(selfMs * 100) / 100,
                selfPercent: sampled > 0 ? Math.round((selfMs / sampled) * 1000) / 10 : 0
            }))
            .sort((a, b) => b.selfMs - a.selfMs);

        return {
            durationMs: Math.round(durationMs),
            sampleCount: trace.samples.length,
            entries,
            natives: nativeEntries
        };
    }
}
