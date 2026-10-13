import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {WindowBits} from '../../ui/kit/WindowBits';
import {TAB_ACTIVE, TAB_IDLE} from './hudColors';
import type {IMenuItem} from './IMenuItem';
import {placeAbove} from './placePopup';
import type {PopupSlot} from './PopupSlot';

/** The HUD's drop-up menu (vortex_hud_chat_menu_xml): the chat's channels and tabs, the + and « plus » menus. */
export class HudMenu
{
    private _menu: IWindowContainer | null = null;
    private _items: IMenuItem[] = [];

    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits, private readonly _slot: PopupSlot, private readonly _layer: number) {}

    /** Opens the menu of `owner` above `anchor`, or closes it when it is the one open; `light`: the chat's pale skin. */
    toggle(owner: string, anchor: IWindow, items: IMenuItem[], light: boolean): void
    {
        if(this._slot.closeFor(owner)) return;

        const windows = this._windows;
        const menu = windows.buildWidgetLayout('vortex_hud_chat_menu_xml', this._layer) as IWindowContainer | null;
        const list = menu?.findChildByName('menu_list') as IItemListWindow | null;
        const desktop = windows.getDesktop(this._layer) as IWindowContainer | null;

        if(!menu || !list || !desktop) return;

        for(const item of items)
        {
            const row = windows.buildWidgetLayout('vortex_hud_chat_menu_row_xml') as IWindowContainer | null;

            if(!row) break;

            const icon = row.findChildByName('row_icon') as IStaticBitmapWrapperWindow | null;

            if(icon && item.icon) icon.assetUri = item.icon;
            // The icons are silhouettes the HUD tints: each in its channel's colour.
            this._bits.setColor(row, 'row_icon', item.color);
            this._bits.setVisible(row, item.icon !== null, 'row_icon');
            this._bits.setVisible(row, item.checked, 'row_check');
            this._bits.setText(row, 'row_label', item.label);
            this._bits.setTextColor(row, 'row_label', light ? 0x2a2824 : 0xffffff);
            row.color = item.checked ? (light ? 0xffb8d8f0 : TAB_ACTIVE) : (light ? 0xfff4efe0 : TAB_IDLE);
            if(!item.enabled) row.blend = 0.5;
            list.addListItem(row);
        }

        const height = items.length * 26 + 10;
        const frame = menu.findChildByName('menu_frame');

        menu.height = height;
        if(frame) frame.height = height;
        list.height = height - 12;
        this._bits.setColor(menu, 'menu_frame', light ? 0xffe9e2cf : 0xff686661);
        placeAbove(menu, anchor, desktop);
        desktop.addChild(menu);
        menu.procedure = this._onEvent;
        this._slot.hold(owner, menu);
        this._menu = menu;
        this._items = items;
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        const row = event.type === 'WME_CLICK' ? WindowBits.ancestor(window, 'menu_row') : null;
        const list = this._menu?.findChildByName('menu_list') as IItemListWindow | null;
        const index = row && list ? list.getListItemIndex(row) : -1;
        const item = this._items[index];

        if(!item?.enabled) return;

        this._slot.close();
        this._menu = null;
        item.pick();
    };
}
