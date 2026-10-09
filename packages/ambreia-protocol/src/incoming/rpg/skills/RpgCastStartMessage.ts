/** An incantation or a channel that began in the zone (M1b §6.3). */
export interface IRpgCastStart
{
    readonly casterObjectId: number;
    readonly skillId: string;
    readonly durationMs: number;
    readonly channel: boolean;
    /** 0: none. */
    readonly targetObjectId: number;
    /** -1: none. */
    readonly x: number;
    readonly y: number;
}

/** The casts begun during one tick (M1b §10.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md). */
export class RpgCastStartMessage
{
    constructor(
        readonly casts: readonly IRpgCastStart[]
    ) {}
}
