import type {IStatusVfx} from '../combat/IVfx';

/** What the client reads of a status's definition (GET /api/public/content/definitions/status, M1b §5.3). */
export interface IStatusDefinition
{
    readonly id: string;
    /** `buff`, `debuff`, `dot`, `hot`, `stun`, `slow`, `shield`. */
    readonly type: string;
    readonly durationMs: number;
    /** A slow's grip on the walk and the attacks, 1–90 (M1c); absent for the others. */
    readonly slowPercent?: number;
    /** What the client draws while it lasts; null for nothing. */
    readonly vfx: IStatusVfx | null;
    /** The image the client shows for it (M1d §6.1); empty for the generic one. */
    readonly icon?: string;
}
