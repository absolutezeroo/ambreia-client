/** Leaves the starter class for a real one, once. (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md) */
export class RpgCharacterChooseClassMessage
{
    constructor(
        readonly playerId: number,
        readonly classId: string
    ) {}
}
