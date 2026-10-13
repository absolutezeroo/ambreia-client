/** The player's auto-attack changed state (M1d §2.1, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md); the button follows this, never the click. */
export class RpgAutoAttackStateMessage
{
    constructor(
        readonly active: boolean
    ) {}
}
