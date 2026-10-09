/** The player's cooldowns after a resolved cast: the global one, then each skill's (M1b §6.5, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md). */
export class RpgCooldownsMessage
{
    constructor(
        readonly globalRemainingMs: number,
        readonly skills: readonly {readonly skillId: string; readonly remainingMs: number}[]
    ) {}
}
