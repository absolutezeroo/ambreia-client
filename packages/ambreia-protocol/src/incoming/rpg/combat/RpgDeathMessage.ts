/** The player died: a ghost for respawnSeconds, then back at the zone's respawn (M1a §8.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-combat-m1a-design.md). */
export class RpgDeathMessage
{
    constructor(
        readonly respawnSeconds: number
    ) {}
}
