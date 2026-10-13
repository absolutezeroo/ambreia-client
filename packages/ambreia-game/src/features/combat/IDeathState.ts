import type {IOffer} from './IOffer';

/**
 * Alive, or KO on the spot: counting down to the auto-release (`autoReleaseAt`), or waiting for a
 * resurrection (`waiting`), with an offer pending or not. Back to alive only when the server sends
 * the player's own vitals with health (spec §3.1).
 */
export type IDeathState =
    | {readonly kind: 'alive'}
    | {readonly kind: 'ko'; readonly autoReleaseAt: number | null; readonly waiting: boolean; readonly offer: IOffer | null};
