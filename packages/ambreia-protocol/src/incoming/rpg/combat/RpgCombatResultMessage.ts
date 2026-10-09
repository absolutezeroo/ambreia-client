/** An attack click refused: `safe_zone`, `unreachable` or `dead` (M1a §9.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-combat-m1a-design.md). */
export class RpgCombatResultMessage
{
    constructor(
        readonly code: string
    ) {}
}
