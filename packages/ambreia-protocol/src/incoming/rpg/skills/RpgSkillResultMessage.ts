/** A cast or a bar change refused: `cooldown`, `no_mana`, `safe_zone`… (M1b §6.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md). */
export class RpgSkillResultMessage
{
    constructor(
        readonly skillId: string,
        readonly code: string
    ) {}
}
