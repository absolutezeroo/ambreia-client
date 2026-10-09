/** One copy the character holds, as RpgInventory lists it (Objets §17.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md). */
export interface IRpgItemEntry
{
    readonly itemId: number;
    /** The content id (`item.weapon.rusted_sword`): its texts are `<definitionId>.name` and `.description`. */
    readonly definitionId: string;
    readonly quantity: number;
    /** -1 for an item that never wears out. */
    readonly durability: number;
    readonly bound: boolean;
    /** RpgInventoryMessage.BAG, EQUIPMENT or PARCEL. */
    readonly container: number;
    /** The bag case, the equipment slot (0–9) or the parcel's number. */
    readonly slot: number;
}
