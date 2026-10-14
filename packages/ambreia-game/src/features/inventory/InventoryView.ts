import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {WindowBits} from '../../ui/kit/WindowBits';
import {buildFrame} from '../../ui/kit/buildFrame';
import {CharacterSheet} from './CharacterSheet';
import {bagView, type InventoryTab} from './items';
import type {IRpgInventorySession} from './IRpgInventorySession';
import {BagGrid} from './window/BagGrid';
import {ItemActions} from './window/ItemActions';
import {ItemDetailView} from './window/ItemDetailView';
import {itemName, thousands} from './window/itemLines';
import {SearchField} from './window/SearchField';

const TABS = new Set<string>(['tab_equipment', 'tab_items', 'tab_resources', 'tab_quests'] satisfies InventoryTab[]);

/**
 * The inventory window (I, vortex_inventory_xml, mockup/glaze/preview_inventory_*.png): the bag's
 * cases of the current tab on the right; on the left the character sheet (equipment tab, nothing
 * selected) or the selected item's details with Equip and Drop. Every action is a request: the
 * window changes when the server's RpgInventory comes back (Objets §17.3). This one builds the
 * window, keeps the tab, the selection and the query, and routes the events; the grid, the details,
 * the search field and the actions are their own units (window/).
 */
export class InventoryView
{
    private _window: IWindowContainer | null = null;
    private _sheet: CharacterSheet | null = null;
    private _detail: IWindowContainer | null = null;
    private _tab: InventoryTab = 'tab_equipment';
    private _selected = 0;
    private _search = '';
    private readonly _grid: BagGrid;
    private readonly _details: ItemDetailView;
    private readonly _actions: ItemActions;
    private readonly _searchField: SearchField;
    private _disposed = false;

    private readonly _onInventory = (): void => this.render();

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _session: IRpgInventorySession,
        private readonly _stats: () => IRpgStatBlock | null,
        private readonly _figure: () => string,
        private readonly _currency: () => {gold: number | null; gems: number | null} = () => ({gold: null, gems: null})
    )
    {
        this._grid = new BagGrid(_windows, _bits, this._onEvent);
        this._details = new ItemDetailView(_bits);
        this._actions = new ItemActions(_session, (title, text, onAnswer) => _windows.confirm(title, text, 0, onAnswer), _bits);
        this._searchField = new SearchField(() => _bits.text('vortex.mapeditor.spawns.search'), query =>
        {
            this._search = query;
            this.render();
        });
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

        // Not on the wire yet (Objets §17): rarity, item effects and value, the filter.
        this._bits.setVisible(window, false, 'filter_menu');
        if(this._detail) this._bits.setVisible(this._detail, false, 'item_rarity', 'effects_title', 'effects_list', 'value_icon', 'value_label', 'item_value');

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
        const selected = this.selected();

        if(!selected) this._selected = 0;

        const currency = this._currency();
        const grid = window.findChildByName('item_grid') as IItemGridWindow | null;

        this._bits.setText(window, 'gold_amount', thousands(currency.gold));
        this._bits.setText(window, 'gems_amount', thousands(currency.gems));
        if(grid) this._grid.render(grid, bagView(items, bagSize, this._tab, entry => this.matches(entry)), this._selected);
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
            this._details.render(this._detail, selected);
        }
    }

    private matches(item: IRpgItemEntry): boolean
    {
        return this._search === '' || itemName(this._bits, item).toLowerCase().includes(this._search);
    }

    private selected(): IRpgItemEntry | null
    {
        return this._session.inventory?.items.find(item => item.itemId === this._selected && item.container === 0) ?? null;
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

        if(this._searchField.handle(event, window)) return;

        const cell = this._grid.caseOf(window);

        if(event.type === 'WME_DOUBLE_CLICK' && cell?.item)
        {
            this._actions.equip(cell.item);

            return;
        }

        if(event.type !== 'WME_CLICK') return;

        if(cell)
        {
            this._selected = cell.item && cell.item.itemId !== this._selected ? cell.item.itemId : 0;
            this.render();

            return;
        }

        const equipped = this._sheet?.equippedAt(window);

        if(equipped?.item)
        {
            this._actions.unequip(equipped.slot);

            return;
        }

        const selected = this.selected();

        if(window.name === 'header_button_close') this.hide();
        else if(window.name === 'primary_action' && selected) this._actions.equip(selected);
        else if((window.name === 'secondary_action' || WindowBits.ancestor(window, 'bin_button')) && selected) this._actions.drop(selected);
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
        this._grid.clear();
    }
}
