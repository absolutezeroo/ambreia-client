import type {IDeathState} from '../IDeathState';
import type {IOffer} from '../IOffer';

/** `2 min 35 s`, `10 s`: rounded up to the second, never below zero. */
export function formatDuration(ms: number): string
{
    const seconds = Math.max(0, Math.ceil(ms / 1000));

    return seconds >= 60 ? `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s` : `${seconds} s`;
}

/** Time left to the auto-release; null when alive or waiting for a resurrection. */
export function koTimer(state: IDeathState, now: number): number | null
{
    return state.kind === 'ko' && state.autoReleaseAt !== null ? Math.max(0, state.autoReleaseAt - now) : null;
}

/** Time left on an offer, and its share of the offer's whole time for the bar. */
export function offerTimer(offer: IOffer, now: number, wholeMs: number): {leftMs: number; fraction: number}
{
    const leftMs = Math.max(0, offer.expiresAt - now);

    return {leftMs, fraction: wholeMs > 0 ? Math.min(1, leftMs / wholeMs) : 0};
}
