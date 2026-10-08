/** Level and XP, on each XP gain. `xpToNext` is 0 at the maximum level. (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md) */
export class RpgCharacterProgressMessage
{
    constructor(
        readonly level: number,
        readonly xp: number,
        readonly xpToNext: number
    ) {}
}
