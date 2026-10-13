import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {itemIcon, itemKind} from '../items';

const SELECTED = 0xffb8d8f0;
const IDLE = 0xffe4e4dc;

/** The bag's cases (item_grid), one vortex_inventory_item_slot_xml each, and which item each case shows. */
export class BagGrid
{
    /** The grid's cases, to their item (null for a free case). */
    private readonly _cases = new Map<IWindow, IRpgItemEntry | null>();

    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits, private readonly _procedure: (event: WindowEvent, window: IWindow) => void) {}

    render(grid: IItemGridWindow, cells: readonly (IRpgItemEntry | null)[], selectedId: number): void
    {
        grid.destroyGridItems();
        this._cases.clear();

        for(const item of cells)
        {
            const box = this._windows.buildWidgetLayout('vortex_inventory_item_slot_xml') as IWindowContainer | null;

            if(!box) break;

            const icon = box.findChildByName('item_icon') as IStaticBitmapWrapperWindow | null;

            if(icon)
            {
                icon.visible = item !== null;
                if(item) icon.assetUri = itemIcon(item.definitionId);
            }

            box.color = item && item.itemId === selectedId ? SELECTED : IDLE;
            this._bits.setText(box, 'item_count', item && item.quantity > 1 ? String(item.quantity) : '');
            this._bits.setVisible(box, false, 'new_dot', 'equipped_icon');
            this._bits.setVisible(box, item !== null && itemKind(item.definitionId) === 'quest', 'quest_icon');
            // A scrollable grid answers its items' events itself: the case carries the window's.
            box.procedure = this._procedure;
            this._cases.set(box, item);
            grid.addGridItem(box);
        }
    }

    /** The case an event came from (or null outside the grid), and its item (null for a free case). */
    caseOf(window: IWindow): {item: IRpgItemEntry | null} | null
    {
        const box = WindowBits.ancestor(window, 'item_slot');

        return box ? {item: this._cases.get(box) ?? null} : null;
    }

    clear(): void
    {
        this._cases.clear();
    }
}
