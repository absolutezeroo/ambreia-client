/** Targets an avatar of the room by its object id, or clears the target with 0. (F3b §7.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-interaction-design.md) */
export class RpgTargetSelectMessage
{
    constructor(
        readonly objectId: number
    ) {}
}
