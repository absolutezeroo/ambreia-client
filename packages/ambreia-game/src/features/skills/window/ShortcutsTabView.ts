import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {ISkillEntry} from './ISkillEntry';
import {BAR_KEYS} from './SkillBarSlots';
import {ROW, TILE_SELECTED} from './skillColors';
import type {SkillDraw} from './SkillDraw';
import type {SkillPicks} from './SkillPicks';

/** « Raccourcis » (vortex_skill_tab_shortcuts_xml): the learned skills, and the selected slot's details. */
export class ShortcutsTabView
{
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _draw: SkillDraw,
        private readonly _picks: SkillPicks,
        private readonly _onEvent: (event: WindowEvent, window: IWindow) => void
    ) {}

    /** The settings wait for their data: off. */
    build(tab: IWindowContainer): void
    {
        for(const name of ['show_shortcuts', 'swap_bars', 'out_of_combat']) tab.findChildByName(name)?.disable();
    }

    /** @param slotSkill - the skill in the selected slot `slot`; null for an empty one */
    render(tab: IWindowContainer, learned: readonly ISkillEntry[], selected: string | null, slot: number, slotSkill: string | null): void
    {
        const list = tab.findChildByName('available_list') as IItemListWindow | null;

        if(!list) return;

        list.destroyListItems();

        for(const entry of learned)
        {
            const row = this._windows.buildWidgetLayout('vortex_skill_list_row_xml') as IWindowContainer | null;

            if(!row) break;

            this._draw.icon(row, 'skill_icon', entry.skillId);
            this._bits.setText(row, 'skill_name', this._draw.name(entry.skillId));
            this._bits.setText(row, 'skill_level', this._bits.text('vortex.skill.rank.short', 'level', '1'));
            row.color = entry.skillId === selected ? TILE_SELECTED : ROW;
            row.procedure = this._onEvent;
            this._picks.set(row, entry.skillId);
            list.addListItem(row);
        }

        const detail = tab.findChildByName('shortcut_detail') as IWindowContainer | null;

        if(!detail) return;

        this._draw.icon(detail, 'shortcut_icon', slotSkill);
        this._bits.setText(detail, 'shortcut_name', slotSkill === null ? this._bits.text('vortex.skill.shortcuts.empty') : this._draw.name(slotSkill));
        this._bits.setText(detail, 'shortcut_level', slotSkill === null ? '' : this._bits.text('vortex.skill.rank', 'level', '1', 'max', '1'));
        this._bits.setText(detail, 'shortcut_desc', slotSkill === null ? '' : this._bits.textOr(`${slotSkill}.description`, ''));
        this._bits.setText(detail, 'assigned_key', BAR_KEYS[slot]);

        const unassign = detail.findChildByName('unassign_button');

        if(slotSkill === null) unassign?.disable();
        else unassign?.enable();
    }
}
