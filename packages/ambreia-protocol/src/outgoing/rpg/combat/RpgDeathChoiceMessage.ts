export type DeathChoice = 'wait' | 'release' | 'accept' | 'decline';

/** What the KO player chose (M1d §2.1, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md). */
export class RpgDeathChoiceMessage
{
    constructor(
        readonly choice: DeathChoice
    ) {}
}
