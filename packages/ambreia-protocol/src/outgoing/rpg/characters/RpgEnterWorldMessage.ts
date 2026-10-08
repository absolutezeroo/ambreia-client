/** Enters the game with this character: the session becomes the player's. (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md) */
export class RpgEnterWorldMessage
{
    constructor(
        readonly playerId: number
    ) {}
}
