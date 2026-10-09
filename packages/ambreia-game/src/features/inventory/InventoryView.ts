import {Logger} from '@ambreia/common/utils/Logger';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';
import {RpgItemEquipMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemEquipMessage';
import {RpgItemUnequipMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemUnequipMessage';
import {RpgItemDestroyMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemDestroyMessage';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {WindowBits} from '../character/WindowBits';
import {CharacterSheet} from './CharacterSheet';
import {bagView, isEquipment, itemIcon, itemKind, itemTab, type InventoryTab} from './items';
import type {IRpgInventorySession} from './IRpgInventorySession';

const log = Logger.getLogger('habbo.features.inventory.InventoryView');

/** The HUD's layer (HudPanelsView.LAYER): the windows open over it. */
export const LAYER = 1;
const SELECTED = 0xffb8d8f0;
const IDLE = 0xffe4e4dc;
/** vortex_inventory_xml's item_grid `spacing`. */
const GRID_SPACING = 4;
const TABS = new Set<string>(['tab_equipment', 'tab_items', 'tab_resources', 'tab_quests'] satisfies InventoryTab[]);

/** Builds a frame layout on the desktop, centred, its events to `procedure`; null if it does not build. */
export function buildFrame(windows: IHabboWindowManager, layout: string, procedure: (event: WindowEvent, window: IWindow) => void): IWindowContainer | null
{
    const desktop = windows.getDesktop(LAYER) as IWindowContainer | null;
    const window = windows.buildWidgetLayout(layout, LAYER) as IWindowContainer | null;

    if(!window || !desktop)
    {
        log.error(`${layout} did not build — the window will not open`);
        window?.destroy();

        return null;
    }

    desktop.addChild(window);
    window.procedure = procedure;
    window.x = Math.round((desktop.width - window.width) / 2);
    window.y = Math.max(0, Math.round((desktop.height - window.height) / 2));

    return window;
}

/**
 * The inventory window (I, vortex_inventory_xml, mockup/glaze/preview_inventory_*.png): the bag's
 * cases of the current tab on the right; on the left the character sheet (equipment tab, nothing
 * selected) or the selected item's details with Equip and Drop. Every action is a request: the
 * window changes when the server's RpgInventory comes back (Objets §17.3).
 */
export class InventoryView
{
    private _window: IWindowContainer | null = null;
    private _sheet: CharacterSheet | null = null;
    private _detail: IWindowContainer | null = null;
    private _tab: InventoryTab = 'tab_equipment';
    private _selected = 0;
    private _search = '';
    /** The grid's cases, to their item (null for a free case). */
    private readonly _cases = new Map<IWindow, IRpgItemEntry | null>();
    private _disposed = false;

    private readonly _onInventory = (): void => this.render();

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _session: IRpgInventorySession,
        private readonly _stats: () => IRpgStatBlock | null,
        private readonly _figure: () => string
    )
    {
        _session.events.on('inventory', this._onInventory);
    }

    get visible(): boolean
    {
        return this._window?.visible ?? false;
    }

    toggle(): void
    {
        if(this.visible) this.hide();
        else this.show();
    }

    show(): void
    {
        if(this._disposed || !this.build()) return;

        this._window!.visible = true;
        this._window!.activate();
        this.render();
    }

    hide(): void
    {
        if(this._window) this._window.visible = false;
    }

    /** The stats changed (equipping sends them before its result): the sheet shows them. */
    renderStats(): void
    {
        if(this.visible) this.render();
    }

    private build(): boolean
    {
        if(this._window) return true;

        const window = buildFrame(this._windows, 'vortex_inventory_xml', this._onEvent);
        const slot = window?.findChildByName('left_slot') as IWindowContainer | null;

        if(!window || !slot) return false;

        this._window = window;
        this._sheet = new CharacterSheet(this._windows, this._bits);
        this._detail = this._windows.buildWidgetLayout('vortex_inventory_item_detail_xml') as IWindowContainer | null;
        slot.addChild(this._sheet.window);
        if(this._detail) slot.addChild(this._detail);

        // Not on the wire yet (Objets §17): currency, rarity, item effects and value, the filter.
        this._bits.setVisible(window, false, 'gold_icon', 'gold_amount', 'gems_icon', 'gems_amount', 'filter_menu');
        if(this._detail) this._bits.setVisible(this._detail, false, 'item_rarity', 'effects_title', 'effects_list', 'value_icon', 'value_label', 'item_value');

        // The layout's `spacing` var does not reach a scrollable grid's inner grid (ScrollableItemGridWindow
        // has no properties setter): set it, or the cases touch.
        const grid = window.findChildByName('item_grid') as IItemGridWindow | null;

        if(grid) grid.spacing = GRID_SPACING;

        const tabs = window.findChildByName('tab_context') as ITabContextWindow | null;
        const first = tabs?.getTabItemByName(this._tab);

        if(tabs?.selector && first) tabs.selector.setSelected(first);

        return true;
    }

    private render(): void
    {
        const window = this._window;
        const inventory = this._session.inventory;

        if(!window?.visible) return;

        const items = inventory?.items ?? [];
        const bagSize = inventory?.bagSize ?? 0;
        const selected = items.find(item => item.itemId === this._selected && item.container === 0) ?? null;

        if(!selected) this._selected = 0;

        this.renderGrid(window, items, bagSize);
        this._bits.setText(window, 'bag_count', this._bits.text('vortex.inventory.bag_count',
            'count', String(items.filter(item => item.container === 0).length), 'max', String(bagSize)));

        const showSheet = selected === null && this._tab === 'tab_equipment';

        if(this._sheet)
        {
            this._sheet.window.visible = showSheet;
            if(showSheet) this._sheet.render(items, this._stats(), this._figure());
        }

        if(this._detail)
        {
            this._detail.visible = !showSheet;
            this.renderDetail(this._detail, selected);
        }
    }

    private renderGrid(window: IWindowContainer, items: readonly IRpgItemEntry[], bagSize: number): void
    {
        const grid = window.findChildByName('item_grid') as IItemGridWindow | null;

        if(!grid) return;

        grid.destroyGridItems();
        this._cases.clear();

        for(const item of bagView(items, bagSize, this._tab, entry => this.matches(entry)))
        {
            const box = this._windows.buildWidgetLayout('vortex_inventory_item_slot_xml') as IWindowContainer | null;

            if(!box) break;

            const icon = box.findChildByName('item_icon') as IStaticBitmapWrapperWindow | null;

            if(icon)
            {
                icon.visible = item !== null;
                if(item) icon.assetUri = itemIcon(item.definitionId);
            }

            box.color = item && item.itemId === this._selected ? SELECTED : IDLE;
            this._bits.setText(box, 'item_count', item && item.quantity > 1 ? String(item.quantity) : '');
            this._bits.setVisible(box, false, 'new_dot', 'equipped_icon');
            this._bits.setVisible(box, item !== null && itemKind(item.definitionId) === 'quest', 'quest_icon');
            // A scrollable grid answers its items' events itself: the case carries the window's.
            box.procedure = this._onEvent;
            this._cases.set(box, item);
            grid.addGridItem(box);
        }
    }

    private renderDetail(detail: IWindowContainer, item: IRpgItemEntry | null): void
    {
        this._bits.setVisible(detail, item !== null, 'detail');
        this._bits.setVisible(detail, item === null, 'no_selection');

        if(!item) return;

        const icon = detail.findChildByName('item_icon') as IStaticBitmapWrapperWindow | null;

        if(icon) icon.assetUri = itemIcon(item.definitionId);
        this._bits.setText(detail, 'item_name', this.name(item));
        this._bits.setText(detail, 'item_kind', this.kindLine(item));
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

    /** `Arme · Lié · Durabilité 50`. */
    private kindLine(item: IRpgItemEntry): string
    {
        const kind = itemKind(item.definitionId);
        const parts = [this._bits.contentName(`vortex.inventory.kind.${kind}`, kind)];

        if(item.bound) parts.push(this._bits.text('vortex.inventory.bound'));
        if(item.durability >= 0) parts.push(this._bits.text('vortex.inventory.durability', 'value', String(item.durability)));

        return parts.join(' · ');
    }

    private name(item: IRpgItemEntry): string
    {
        return this._bits.contentName(`${item.definitionId}.name`, item.definitionId);
    }

    private matches(item: IRpgItemEntry): boolean
    {
        return this._search === '' || this.name(item).toLowerCase().includes(this._search);
    }

    private selected(): IRpgItemEntry | null
    {
        return this._session.inventory?.items.find(item => item.itemId === this._selected && item.container === 0) ?? null;
    }

    private equip(item: IRpgItemEntry): void
    {
        if(isEquipment(item.definitionId)) this._session.send(new RpgItemEquipMessage(item.slot));
    }

    private drop(item: IRpgItemEntry): void
    {
        const quantity = item.quantity > 1 ? ` x${item.quantity}` : '';

        this._windows.confirm(this._bits.text('vortex.inventory.action.drop'), this._bits.text('vortex.inventory.drop.confirm', 'item', this.name(item) + quantity), 0, (dialog, event) =>
        {
            dialog.dispose();
            if(event.type === 'WE_OK') this._session.send(new RpgItemDestroyMessage(item.slot, item.quantity));
        });
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WE_SELECTED')
        {
            // From the tab button or from its context, depending on who dispatches it.
            const name = window.name === 'tab_context' ? (window as ITabContextWindow).selector?.getSelected()?.name ?? '' : window.name;

            if(!TABS.has(name) || name === this._tab) return;

            this._tab = name as InventoryTab;
            this._selected = 0;
            this.render();

            return;
        }

        if(event.type === 'WKE_KEY_UP' && window.name === 'search_input')
        {
            this._search = (window as ITextFieldWindow).text.trim().toLowerCase();
            this.render();

            return;
        }

        const box = WindowBits.ancestor(window, 'item_slot');
        const item = box ? this._cases.get(box) ?? null : null;

        if(event.type === 'WME_DOUBLE_CLICK' && item)
        {
            this.equip(item);

            return;
        }

        if(event.type !== 'WME_CLICK') return;

        // The field opens with its placeholder as its text: the first click clears it.
        if(window.name === 'search_input')
        {
            const input = window as ITextFieldWindow;

            if(input.text === this._bits.text('vortex.mapeditor.spawns.search')) input.text = '';

            return;
        }

        if(box)
        {
            this._selected = item && item.itemId !== this._selected ? item.itemId : 0;
            this.render();

            return;
        }

        const equipped = this._sheet?.equippedAt(window);

        if(equipped?.item)
        {
            this._session.send(new RpgItemUnequipMessage(equipped.slot));

            return;
        }

        const selected = this.selected();

        if(window.name === 'header_button_close') this.hide();
        else if(window.name === 'primary_action' && selected) this.equip(selected);
        else if((window.name === 'secondary_action' || WindowBits.ancestor(window, 'bin_button')) && selected) this.drop(selected);
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._session.events.off('inventory', this._onInventory);
        this._window?.destroy();
        this._window = null;
        this._sheet = null;
        this._detail = null;
        this._cases.clear();
    }
}
