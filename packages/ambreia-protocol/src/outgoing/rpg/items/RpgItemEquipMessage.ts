/** Equips the item of a bag case; the server picks the slot. (Objets §17.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md) */
export class RpgItemEquipMessage
{
    constructor(
        readonly bagSlot: number
    ) {}
}
