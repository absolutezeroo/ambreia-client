/** Casts a skill (M1b §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md). */
export class RpgSkillCastMessage
{
    constructor(
        readonly skillId: string,
        /** 0: none (self, around the caster, ground). */
        readonly targetObjectId: number = 0,
        /** -1: none (ground only). */
        readonly x: number = -1,
        readonly y: number = -1
    ) {}
}
