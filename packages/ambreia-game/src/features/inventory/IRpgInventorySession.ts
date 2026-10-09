import type {EventEmitter} from 'eventemitter3';
import type {RpgInventoryMessage} from '@ambreia/protocol/incoming/rpg/items/RpgInventoryMessage';
import type {RpgItemResultMessage} from '@ambreia/protocol/incoming/rpg/items/RpgItemResultMessage';

/** What the inventory session announces: one event per message the server sends (Objets §17.2). */
export interface IRpgInventorySessionEvents
{
    inventory: [RpgInventoryMessage];
    result: [RpgItemResultMessage];
}

/**
 * The played character's bag, equipment and parcels, as the server last sent them (Objets §17).
 * Other features read it through this interface (host.made.inventory), never the feature.
 */
export interface IRpgInventorySession
{
    readonly events: EventEmitter<IRpgInventorySessionEvents>;
    readonly inventory: RpgInventoryMessage | null;
    /** Sends one of the item messages (RpgItemEquipMessage…); false if not connected. */
    send(message: object): boolean;
}
