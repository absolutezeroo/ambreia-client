/** One blow of a combat tick (M1a §9.2). */
export interface IRpgCombatHit
{
    /** Room object ids (an avatar's Users room index, a monster's too). */
    readonly attackerId: number;
    readonly targetId: number;
    readonly amount: number;
    /** `hit`, `crit` or `miss`. */
    readonly outcome: string;
    /** The target's health after the blow. */
    readonly health: number;
    readonly maxHealth: number;
    readonly killed: boolean;
}

/** The blows of one combat tick in the zone, grouped (M1a §9.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-combat-m1a-design.md). */
export class RpgCombatEventsMessage
{
    constructor(
        readonly hits: readonly IRpgCombatHit[]
    ) {}
}
