import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';
import {RpgItemUnequipMessage} from '@ambreia/protocol/outgoing/rpg/items/RpgItemUnequipMessage';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {WindowBits} from '../character/WindowBits';
import {CharacterSheet, fillStatRow} from './CharacterSheet';
import {buildFrame, LAYER} from './InventoryView';
import {itemKind, STATS, type IStatLine} from './items';
import {HudTooltips} from '../hud/HudTooltips';
import type {IRpgInventorySession} from './IRpgInventorySession';

/**
 * The stats tab's sections (vortex_character_tab_stats_xml): what the server's ten stats fill
 * (F3a §6.2). The mock-up's other lines (magic damage, block…) have no stat behind them yet.
 */
const SECTIONS: ReadonlyArray<{list: string; row: string; lines: readonly IStatLine[]; help: string}> = [
    {list: 'attributes_list', row: 'vortex_character_attribute_row_xml', lines: [STATS.strength, STATS.agility, STATS.intelligence], help: 'attributes'},
    {list: 'offense_list', row: 'vortex_character_stat_row_xml', lines: [STATS.power, STATS.critical], help: 'offense'},
    {list: 'defense_list', row: 'vortex_character_stat_row_xml', lines: [STATS.armor, STATS.dodge], help: 'defense'},
    {list: 'secondary_list', row: 'vortex_character_stat_row_xml', lines: [STATS.speed, STATS.health, STATS.mana], help: 'secondary'}
];

/**
 * The character window (C, vortex_character_xml, mockup/glaze/character_stats.png): its stats tab,
 * the character sheet beside the stat sections, each section's « ? » opening its help
 * (vortex_character_help_xml), a tooltip on an equipped slot. Overview, titles and reputation have
 * nothing on the wire yet and stay disabled. Unequipping from the sheet works as in the inventory.
 */
export class CharacterWindow
{
    private _window: IWindowContainer | null = null;
    private _sheet: CharacterSheet | null = null;
    private _help: IWindowContainer | null = null;
    private readonly _tips: HudTooltips;
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
        this._tips = new HudTooltips(_windows, LAYER);
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
        if(this._help) this._help.visible = false;
        this._tips.out();
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

    /** A section's « ? »: its help beside the window, one help window reused. */
    private showHelp(section: string): void
    {
        this._help ??= buildFrame(this._windows, 'vortex_character_help_xml', (event, window) =>
        {
            if(event.type === 'WME_CLICK' && window.name === 'header_button_close' && this._help) this._help.visible = false;
        });

        const help = this._help;
        const owner = this._window;

        if(!help || !owner) return;

        help.caption = this._bits.text(`vortex.character.stats.${section}`);
        this._bits.setText(help, 'help_txt', this._bits.text(`vortex.character.stats.${section}.help`));
        help.x = Math.max(0, Math.min((owner.parent?.width ?? owner.x + owner.width + help.width) - help.width, owner.x + owner.width + 8));
        help.y = owner.y;
        help.visible = true;
        help.activate();
    }

    /** An equipped slot's tooltip: the item's name, kind and description. */
    private slotTip(window: IWindow): {layout: string; fill: (tip: IWindowContainer) => void} | null
    {
        const item = this._sheet?.equippedAt(window)?.item ?? null;

        if(!item) return null;

        return {layout: 'vortex_character_equipment_tip_xml', fill: tip =>
        {
            this._bits.setText(tip, 'item_name', this._bits.contentName(`${item.definitionId}.name`, item.definitionId));
            this._bits.setText(tip, 'item_slot', itemKind(item.definitionId));
            this._bits.setText(tip, 'item_desc', this._bits.textOr(`${item.definitionId}.description`, ''));
            // No rarity or bonus on the wire (Objets §17).
            this._bits.setText(tip, 'item_rarity', '');
        }};
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(this._tips.handle(event, () => this.slotTip(window))) return;
        if(event.type !== 'WME_CLICK') return;

        if(window.name === 'header_button_close')
        {
            this.hide();

            return;
        }

        const help = SECTIONS.find(section => WindowBits.ancestor(window, `${section.help}_help`) !== null);

        if(help)
        {
            this.showHelp(help.help);

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
        this._tips.dispose();
        this._help?.destroy();
        this._help = null;
        this._window?.destroy();
        this._window = null;
        this._sheet = null;
        this._rows.length = 0;
    }
}
