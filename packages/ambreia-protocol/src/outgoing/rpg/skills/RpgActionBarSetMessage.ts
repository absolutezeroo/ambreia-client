/** Puts an action in a slot of the bar, `` to empty it (M1b §9, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md). */
export class RpgActionBarSetMessage
{
    constructor(
        readonly slot: number,
        /** `skill:<id>` or ``. */
        readonly actionId: string
    ) {}
}
