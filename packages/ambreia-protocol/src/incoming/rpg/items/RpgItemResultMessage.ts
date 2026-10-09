/**
 * The answer to each item operation of the player (Objets §17.2-§17.3, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md): `ok` (an
 * RpgInventory follows) or an error code the client translates.
 */
export class RpgItemResultMessage
{
    static readonly ACTION_MOVE = 1;
    static readonly ACTION_SPLIT = 2;
    static readonly ACTION_EQUIP = 3;
    static readonly ACTION_UNEQUIP = 4;
    static readonly ACTION_DESTROY = 5;
    static readonly ACTION_CLAIM_PARCEL = 6;

    constructor(
        readonly action: number,
        /** `ok`, `not_found`, `bag_full`, `slot_occupied`, `wrong_class`, `level_too_low`, `not_equipment`, `invalid_quantity`, `failed`. */
        readonly code: string
    ) {}
}
