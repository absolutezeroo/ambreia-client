import type {IRpgItemEntry} from './IRpgItemEntry';

/**
 * The whole bag, equipment and parcels of the played character (Objets §17.2-§17.3, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md):
 * it replaces everything the client knew. Sent on entering a zone, after each successful
 * operation of the player, and when the server grants or removes an item.
 */
export class RpgInventoryMessage
{
    static readonly BAG = 0;
    static readonly EQUIPMENT = 1;
    static readonly PARCEL = 2;

    constructor(
        readonly bagSize: number,
        readonly maxParcels: number,
        readonly items: readonly IRpgItemEntry[]
    ) {}
}
