/** The skills the character knows, then its action bar, empty slots as `` (M1b §9, §10.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md). */
export class RpgSkillsMessage
{
    constructor(
        readonly known: readonly string[],
        /** `skill:<id>` or ``, one per slot. */
        readonly bar: readonly string[]
    ) {}
}
