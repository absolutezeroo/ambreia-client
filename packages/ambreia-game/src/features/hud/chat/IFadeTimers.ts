/** Timers, handed in so a test can run them. */
export interface IFadeTimers
{
    set(run: () => void, ms: number): unknown;
    clear(handle: unknown): void;
}
