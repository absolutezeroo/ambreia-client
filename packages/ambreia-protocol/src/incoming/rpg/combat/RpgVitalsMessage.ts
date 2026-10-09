/** A combatant whose health changed without a blow (M1a §9.2). */
export interface IRpgCombatantVitals
{
    readonly objectId: number;
    readonly health: number;
    readonly maxHealth: number;
}

/** Regeneration, birth, respawn, return; complete in the zone's entry burst (M1a §9.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-combat-m1a-design.md). */
export class RpgVitalsMessage
{
    constructor(
        readonly combatants: readonly IRpgCombatantVitals[]
    ) {}
}
