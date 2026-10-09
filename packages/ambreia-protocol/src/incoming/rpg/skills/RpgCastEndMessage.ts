/** A cast that ended: `done`, `cancelled`, `interrupted` or `failed` (M1b §6.4). */
export interface IRpgCastEnd
{
    readonly casterObjectId: number;
    readonly skillId: string;
    readonly reason: string;
}

/** The casts ended during one tick (M1b §10.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md). */
export class RpgCastEndMessage
{
    constructor(
        readonly ends: readonly IRpgCastEnd[]
    ) {}
}
