import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {isEquipment, itemIcon, itemTab} from '../items';
import {itemKindLine, itemName} from './itemLines';

/** The selected item's details (vortex_inventory_item_detail_xml), or its « nothing selected » line. */
export class ItemDetailView
{
    constructor(private readonly _bits: WindowBits) {}

    render(detail: IWindowContainer, item: IRpgItemEntry | null): void
    {
        this._bits.setVisible(detail, item !== null, 'detail');
        this._bits.setVisible(detail, item === null, 'no_selection');

        if(!item) return;

        const icon = detail.findChildByName('item_icon') as IStaticBitmapWrapperWindow | null;

        if(icon) icon.assetUri = itemIcon(item.definitionId);
        this._bits.setText(detail, 'item_name', itemName(this._bits, item));
        this._bits.setText(detail, 'item_kind', itemKindLine(this._bits, item));
        this._bits.setText(detail, 'item_desc', this._bits.textOr(`${item.definitionId}.description`, ''));
        this._bits.setVisible(detail, itemTab(item.definitionId) === 'tab_quests', 'quest_note_box');

        const primary = detail.findChildByName('primary_action');

        if(primary)
        {
            primary.caption = this._bits.text(isEquipment(item.definitionId) ? 'vortex.inventory.action.equip' : 'vortex.inventory.action.use');
            // No message uses an item yet (Objets §17.1 has none): only equipment has an action.
            if(isEquipment(item.definitionId)) primary.enable();
            else primary.disable();
        }
    }
}
