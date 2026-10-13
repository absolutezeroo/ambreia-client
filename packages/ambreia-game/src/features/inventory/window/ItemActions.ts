import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import {RpgItemDestroyMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemDestroyMessage';
import {RpgItemEquipMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemEquipMessage';
import {RpgItemUnequipMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemUnequipMessage';
import type {IRpgInventorySession} from '../IRpgInventorySession';
import {isEquipment} from '../items';
import type {IConfirm} from './IConfirm';
import type {IItemTexts} from './IItemTexts';
import {itemName} from './itemLines';

/** What the window asks of the server: equip, take off, drop (after a confirmation). The window changes when RpgInventory comes back. */
export class ItemActions
{
    constructor(private readonly _session: Pick<IRpgInventorySession, 'send'>, private readonly _confirm: IConfirm, private readonly _texts: IItemTexts) {}

    /** Only equipment: no message uses an item yet (Objets §17.1). */
    equip(item: IRpgItemEntry): void
    {
        if(isEquipment(item.definitionId)) this._session.send(new RpgItemEquipMessage(item.slot));
    }

    unequip(slot: number): void
    {
        this._session.send(new RpgItemUnequipMessage(slot));
    }

    drop(item: IRpgItemEntry): void
    {
        const quantity = item.quantity > 1 ? ` x${item.quantity}` : '';
        const text = this._texts.text('vortex.inventory.drop.confirm', 'item', itemName(this._texts, item) + quantity);

        this._confirm(this._texts.text('vortex.inventory.action.drop'), text, (dialog, event) =>
        {
            dialog.dispose();
            if(event.type === 'WE_OK') this._session.send(new RpgItemDestroyMessage(item.slot, item.quantity));
        });
    }
}
