/**
 * The player's target, as the room set it (F3b §7.2,
 * vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-interaction-design.md): after an
 * RpgTargetSelect, and RpgTarget(0) when the target leaves or the choice was not an avatar.
 */
export class RpgTargetMessage
{
    constructor(
        /** The avatar's room object id (its Users room index); 0 for no target. */
        readonly objectId: number,
        /** `player`, or empty for no target. */
        readonly kind: string,
        readonly name: string,
        readonly level: number,
        /** `class.warrior`… */
        readonly classId: string,
        /** `normal`, `elite` or `boss` (M1c §9); a player is `normal`. */
        readonly rank: string
    ) {}
}
