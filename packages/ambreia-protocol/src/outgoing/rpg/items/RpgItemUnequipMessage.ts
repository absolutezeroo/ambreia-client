/** Puts an equipped item back in the bag. (Objets §17.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md) */
export class RpgItemUnequipMessage
{
    constructor(
        /** 0 head, 1 chest, 2 legs, 3 feet, 4 hands, 5 weapon, 6 offhand, 7 neck, 8 ring 1, 9 ring 2. */
        readonly equipmentSlot: number
    ) {}
}
