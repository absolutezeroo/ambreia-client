import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';
import {RpgItemUnequipMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemUnequipMessage';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {WindowBits} from '../character/WindowBits';
import {CharacterSheet, fillStatRow} from './CharacterSheet';
import {buildFrame} from './InventoryView';
import {STATS, type IStatLine} from './items';
import type {IRpgInventorySession} from './IRpgInventorySession';

/**
 * The stats tab's sections (vortex_character_tab_stats_xml): what the server's ten stats fill
 * (F3a §6.2). The mock-up's other lines (magic damage, block…) have no stat behind them yet.
 */
const SECTIONS: ReadonlyArray<{list: string; row: string; lines: readonly IStatLine[]}> = [
    {list: 'attributes_list', row: 'vortex_character_attribute_row_xml', lines: [STATS.strength, STATS.agility, STATS.intelligence]},
    {list: 'offense_list', row: 'vortex_character_stat_row_xml', lines: [STATS.power, STATS.critical]},
    {list: 'defense_list', row: 'vortex_character_stat_row_xml', lines: [STATS.armor, STATS.dodge]},
    {list: 'secondary_list', row: 'vortex_character_stat_row_xml', lines: [STATS.speed, STATS.health, STATS.mana]}
];

/**
 * The character window (C, vortex_character_xml, mockup/glaze/character_stats.png): its stats tab,
 * the character sheet beside the stat sections. Overview, titles and reputation have nothing on
 * the wire yet and stay disabled. Unequipping from the sheet works as in the inventory.
 */
export class CharacterWindow
{
    private _window: IWindowContainer | null = null;
    private _sheet: CharacterSheet | null = null;
    private readonly _rows: Array<{row: IWindowContainer; line: IStatLine}> = [];
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

    renderStats(): void
    {
        this.render();
    }

    private build(): boolean
    {
        if(this._window) return true;

        const window = buildFrame(this._windows, 'vortex_character_xml', this._onEvent);
        const content = window?.findChildByName('tab_content') as IWindowContainer | null;
        const tab = this._windows.buildWidgetLayout('vortex_character_tab_stats_xml') as IWindowContainer | null;
        const slot = tab?.findChildByName('character_sheet_slot') as IWindowContainer | null;

        if(!window || !content || !tab || !slot)
        {
            tab?.destroy();
            window?.destroy();

            return false;
        }

        this._window = window;
        content.addChild(tab);
        this._sheet = new CharacterSheet(this._windows, this._bits);
        slot.addChild(this._sheet.window);

        for(const section of SECTIONS)
        {
            const list = tab.findChildByName(section.list) as IItemListWindow | null;

            for(const line of section.lines)
            {
                const row = this._windows.buildWidgetLayout(section.row) as IWindowContainer | null;

                if(!row || !list) break;

                this._bits.setText(row, 'desc', this._bits.textOr(`${line.key}.desc`, ''));
                list.addListItem(row);
                this._rows.push({row, line});
            }
        }

        // The stat sections have no help text yet.
        this._bits.setVisible(tab, false, 'attributes_help', 'offense_help', 'defense_help', 'secondary_help');

        const tabs = window.findChildByName('tab_context') as ITabContextWindow | null;

        for(const name of ['tab_overview', 'tab_titles', 'tab_reputation']) tabs?.getTabItemByName(name)?.disable();

        const stats = tabs?.getTabItemByName('tab_stats');

        if(tabs?.selector && stats) tabs.selector.setSelected(stats);

        return true;
    }

    private render(): void
    {
        if(!this._window?.visible) return;

        const stats = this._stats();

        this._sheet?.render(this._session.inventory?.items ?? [], stats, this._figure());
        for(const {row, line} of this._rows) fillStatRow(this._bits, row, line, stats);
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        if(window.name === 'header_button_close')
        {
            this.hide();

            return;
        }

        const equipped = this._sheet?.equippedAt(window);

        if(equipped?.item) this._session.send(new RpgItemUnequipMessage(equipped.slot));
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._session.events.off('inventory', this._onInventory);
        this._window?.destroy();
        this._window = null;
        this._sheet = null;
        this._rows.length = 0;
    }
}
