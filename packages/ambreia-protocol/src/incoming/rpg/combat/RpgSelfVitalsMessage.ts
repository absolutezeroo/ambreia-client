/** The player's own health and mana, on entering and at every change (M1a §9.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-combat-m1a-design.md). */
export class RpgSelfVitalsMessage
{
    constructor(
        readonly health: number,
        readonly maxHealth: number,
        readonly mana: number,
        readonly maxMana: number,
        readonly inCombat: boolean
    ) {}
}
