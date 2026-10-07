import {Logger} from './Logger';

const log = Logger.getLogger('core.utils.FrameTimingsReporter');

/** One `FrameTimings.snapshot()` plus the moment it was taken, relative to the run's start. */
export interface IFrameTimingsSample
{
    /** Milliseconds since the run began. */
    atMs: number;
    /** JS heap in MB (Chromium only, 0 elsewhere). Climbing across runs means an accumulation. */
    heapMb: number;
    /**
     * Frames opened since the client started.
     *
     * Two consecutive samples sharing this number mean no frame ran between them, so their
     * averages are the same frozen figures rather than a steady state — the signature of a
     * backgrounded tab, where rAF stops but `setInterval` keeps sampling. A run's first 30s
     * produced fourteen byte-identical samples exactly this way, and nothing in the output said so.
     */
    frames: number;
    /**
     * Frames that actually ran during this sample's interval.
     *
     * The figure that makes a sample readable. Every other number here is a per-frame mean over
     * exactly these frames, so a low count is both the explanation for a noisy sample and the
     * warning not to read it as a trend. Zero means nothing ran and every figure below is zero.
     */
    intervalFrames: number;
    /** Wall time this sample covers, in ms. */
    intervalMs: number;
    /** Real frames per second over this interval — `intervalFrames / intervalMs`, not a smoothed mean. */
    fps: number;
    frameIntervalMs: number;
    channels: Record<string, number>;
    counters: Record<string, number>;
}

/** A complete stress run: what was loaded, and how it measured over time. */
export interface IFrameTimingsRun
{
    label: string;
    avatars: number;
    furniture: number;
    durationSeconds: number;
    samples: IFrameTimingsSample[];
    /** The self-profile recorded alongside, when the browser allowed one. */
    profile?: unknown;
}

/**
 * Ships a completed stress run to the dev server, which writes it to `perf/` in the repo.
 *
 * TS-only: no AS3 counterpart — a measurement tool for this port.
 *
 * The point of writing a file rather than printing to the console is that the numbers stop
 * depending on somebody reading them off an overlay and retyping them. A run is a series, not a
 * figure: the first samples of a load are dominated by cold avatar caches, and only the tail is the
 * steady state worth comparing between runs. That distinction does not survive being read off a
 * five-line overlay, and it is exactly the distinction that decides whether a cost is a warm-up
 * artefact or something to fix.
 *
 * Dev-only by construction: `POST /__perf` is served by a serve-only Vite plugin, so in a production
 * build the request 404s and this quietly gives up. It never throws into the caller — a failed
 * measurement dump must not take down the client being measured.
 */
export class FrameTimingsReporter
{
    // TS-only: see the class note.
    private static readonly ENDPOINT: string = '/__perf';

    /**
     * Posts `run` and resolves to the path the server wrote, or null if it could not be written.
     *
     * Deliberately not awaited by its caller for correctness — the run is already over by the time
     * this is called, so the only thing riding on the result is the log line naming the file.
     */
    // TS-only: see the class note.
    public static async report(run: IFrameTimingsRun): Promise<string | null>
    {
        try
        {
            const response = await fetch(FrameTimingsReporter.ENDPOINT, {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify(run)
            });

            if(!response.ok)
            {
                log.warn(
                    `Perf dump refused by the dev server (${response.status}).`
                    + ' The /__perf endpoint is serve-only — a production build has no writer'
                );

                return null;
            }

            const result = await response.json() as {path?: string};
            const path = result.path ?? null;

            if(path !== null)
            {
                log.info(`Perf run written to ${path}`);
            }

            return path;
        }
        catch (error)
        {
            log.warn(`Perf dump could not be sent: ${(error as Error).message}`);

            return null;
        }
    }
}
