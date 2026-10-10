import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';
import type {IRpgItemEntry} from '@ambreia/protocol/incoming/rpg/items/IRpgItemEntry';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {WindowBits} from '../../ui/kit/WindowBits';
import {EQUIPMENT_SLOTS, itemIcon, STATS, type IStatLine} from './items';

const SLOT_BY_NAME = new Map<string, number>(EQUIPMENT_SLOTS.map((key, slot) => [`slot_${key}`, slot]));

/** The summary under the equipment (mockup/glaze/character_stats.png): the attributes, then the vitals. */
const SUMMARY: readonly IStatLine[] = [STATS.strength, STATS.agility, STATS.intelligence, STATS.armor, STATS.critical, STATS.speed, STATS.health, STATS.mana];

/** Puts a stat line's label, value and icon in a vortex_character_stat_row_xml (or attribute row). */
export function fillStatRow(bits: WindowBits, row: IWindowContainer, line: IStatLine, stats: IRpgStatBlock | null): void
{
    const icon = row.findChildByName('icon') as IStaticBitmapWrapperWindow | null;

    if(icon && icon.assetUri !== line.icon) icon.assetUri = line.icon;
    bits.setColor(row, 'icon', line.color);
    bits.setText(row, 'label', bits.text(line.key));
    bits.setText(row, 'value', stats ? line.value(stats) : '');
    bits.setText(row, 'bonus', '');
}

/**
 * The character sheet (vortex_character_sheet_xml): the avatar between its ten equipment slots,
 * then the stats summary. Shared by the inventory's equipment tab and the character window, whose
 * procedure gets the sheet's clicks (equippedAt()): a click on a filled slot asks to unequip it,
 * and the sheet changes only when the server's inventory and stats come back.
 */
export class CharacterSheet
{
    readonly window: IWindowContainer;
    private readonly _rows: IWindowContainer[] = [];
    /** The equipped item of each slot, by slot number; null when the slot is empty. */
    private readonly _equipped: Array<IRpgItemEntry | null> = EQUIPMENT_SLOTS.map(() => null);

    constructor(
        windows: IHabboWindowManager,
        private readonly _bits: WindowBits
    )
    {
        this.window = windows.buildWidgetLayout('vortex_character_sheet_xml') as IWindowContainer;

        const list = this.window.findChildByName('summary_list') as IItemListWindow | null;

        for(const line of SUMMARY)
        {
            const row = windows.buildWidgetLayout('vortex_character_stat_row_xml') as IWindowContainer | null;

            if(!row || !list) break;

            fillStatRow(_bits, row, line, null);
            list.addListItem(row);
            this._rows.push(row);
        }
    }

    render(items: readonly IRpgItemEntry[], stats: IRpgStatBlock | null, figure: string): void
    {
        this._equipped.fill(null);
        for(const item of items) if(item.container === 1 && item.slot >= 0 && item.slot < this._equipped.length) this._equipped[item.slot] = item;

        EQUIPMENT_SLOTS.forEach((key, slot) =>
        {
            const item = this._equipped[slot];
            const icon = this.window.findChildByName(`slot_${key}_icon`) as IStaticBitmapWrapperWindow | null;

            this._bits.setVisible(this.window, item === null, `slot_${key}_empty`);
            if(!icon) return;

            icon.visible = item !== null;
            if(item && icon.assetUri !== itemIcon(item.definitionId)) icon.assetUri = itemIcon(item.definitionId);
        });

        SUMMARY.forEach((line, i) => this._rows[i] && fillStatRow(this._bits, this._rows[i], line, stats));
        if(figure !== '') this._bits.avatar(this.window, 'avatar_image', figure, 2);
    }

    /** The equipment slot `window` is in or under, and what it holds; null outside the slots. */
    equippedAt(window: IWindow): {slot: number; item: IRpgItemEntry | null} | null
    {
        for(let at: IWindow | null = window; at && at !== this.window; at = at.parent)
        {
            const slot = SLOT_BY_NAME.get(at.name);

            if(slot !== undefined) return {slot, item: this._equipped[slot]};
        }

        return null;
    }
}
