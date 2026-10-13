/** Repeating timers, handed in so a test can run them. */
export interface IIntervalTimers
{
    every(run: () => void, ms: number): unknown;
    stop(handle: unknown): void;
}
