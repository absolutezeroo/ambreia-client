/** Starts or stops the auto-attack on the current target (M1d §2.1, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md). */
export class RpgAutoAttackMessage
{
    constructor(
        readonly active: boolean
    ) {}
}
