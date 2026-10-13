import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {ISkillDefinition} from '../ISkillDefinition';
import type {ISkillBook} from './ISkillBook';
import type {ISkillEntry} from './ISkillEntry';
import {LOCKED_TEXT, PROGRESS, PROGRESS_MAX, TILE, TILE_LOCKED, TILE_SELECTED} from './skillColors';
import type {SkillDraw} from './SkillDraw';
import type {SkillPicks} from './SkillPicks';
import {skillStatLines} from './skillStatLines';
import {filterKey, TAG_COLORS, tagOf} from './skillTags';

/** skills_active.png shows five stat lines: the list's height holds no more. */
const STAT_LINES = 5;
/** A stat row's value ends this far from the detail's right edge, as in skills_active.png. */
const STAT_VALUE_RIGHT = 56;

/**
 * « Actives » (vortex_skill_tab_active_xml): the class's skills as tiles (learned ones with their
 * level, the others locked), the selected one's rank, tag, description, stats and next level.
 */
export class ActiveTabView
{
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _book: Pick<ISkillBook, 'known' | 'definition' | 'statusDefinition'>,
        private readonly _draw: SkillDraw,
        private readonly _picks: SkillPicks,
        private readonly _onEvent: (event: WindowEvent, window: IWindow) => void
    ) {}

    /** The tab's own state, set once: one rank per skill in M1b, the upgrade off. */
    build(tab: IWindowContainer): void
    {
        const grid = tab.findChildByName('skill_grid') as IItemGridWindow | null;

        // The layout's `spacing` does not reach a scrollable grid's inner grid (InventoryView).
        if(grid) grid.spacing = 6;

        // One rank per skill in M1b: the next level's title says so without a number.
        this._bits.setText(tab, 'next_level_title', this._bits.text('vortex.skill.next_level.title'));
        tab.findChildByName('upgrade_button')?.disable();
    }

    render(tab: IWindowContainer, header: IWindowContainer | null, entries: readonly ISkillEntry[], selected: string | null): void
    {
        const grid = tab.findChildByName('skill_grid') as IItemGridWindow | null;

        if(!grid) return;

        grid.destroyGridItems();

        for(const entry of entries)
        {
            const tile = this._windows.buildWidgetLayout('vortex_skill_slot_xml') as IWindowContainer | null;

            if(!tile) break;

            this._draw.icon(tile, 'skill_icon', entry.learned ? entry.skillId : null);
            this._bits.setVisible(tile, !entry.learned, 'lock_icon');
            this._bits.setText(tile, 'skill_level', this._bits.text('vortex.ui.level.short', 'level', String(entry.level)));
            this._bits.setTextColor(tile, 'skill_level', entry.learned ? 0x0 : LOCKED_TEXT);
            tile.color = !entry.learned ? TILE_LOCKED : entry.skillId === selected ? TILE_SELECTED : TILE;
            // A scrollable grid answers its items' events itself: the tile carries the window's.
            tile.procedure = this._onEvent;
            this._picks.set(tile, entry.skillId);
            grid.addGridItem(tile);
        }

        const definition = selected === null ? null : this._book.definition(selected);
        const learned = selected !== null && this._book.known.includes(selected);

        if(header)
        {
            header.visible = selected !== null;
            if(selected !== null) this.renderHeader(header, selected, definition, learned);
        }

        this.renderStats(tab, definition);
        this.renderNextLevel(tab, definition, learned);
    }

    /** Icon, name, rank and its bar, tag, description (skills_active.png's top right). */
    private renderHeader(header: IWindowContainer, skillId: string, definition: ISkillDefinition | null, learned: boolean): void
    {
        const tag = definition === null ? null : tagOf(definition);
        const rank = learned ? 1 : 0;

        this._draw.icon(header, 'skill_icon', skillId);
        this._bits.setText(header, 'skill_name', this._draw.name(skillId));
        this._bits.setText(header, 'skill_level', this._bits.text('vortex.skill.rank', 'level', String(rank), 'max', '1'));
        this._bits.setText(header, 'skill_desc', this._bits.textOr(`${skillId}.description`, ''));
        this.setProgress(header, rank, 1);
        this._bits.setVisible(header, tag !== null, 'skill_tag');

        if(tag !== null)
        {
            this._bits.setColor(header, 'skill_tag', TAG_COLORS[tag]);
            this._bits.setText(header, 'skill_tag_txt', this._bits.text(filterKey(tag)));
        }
    }

    /** The header's bar: `rank / max`, « Niveau max » in yellow once full. */
    private setProgress(header: IWindowContainer, rank: number, max: number): void
    {
        const progress = header.findChildByName('skill_progress') as IWindowContainer | null;
        const background = progress?.findChildByName('bg') ?? null;
        const fill = progress?.findChildByName('fill') ?? null;

        if(!progress || !background || !fill) return;

        const full = rank >= max;

        fill.visible = rank > 0;
        fill.width = Math.round(background.width * Math.min(1, rank / max));
        fill.color = full ? PROGRESS_MAX : PROGRESS;
        this._bits.setText(progress, 'points', full ? this._bits.text('vortex.skill.max_rank') : `${rank} / ${max}`);
    }

    /** The mock-up's lines from the server's definition: cost, cooldown, range, effect, base amount. */
    private renderStats(tab: IWindowContainer, definition: ISkillDefinition | null): void
    {
        const list = tab.findChildByName('stat_list') as IItemListWindow | null;

        if(!list) return;

        list.destroyListItems();

        if(!definition) return;

        for(const line of skillStatLines(definition, this._bits, statusId => this._book.statusDefinition(statusId)).slice(0, STAT_LINES))
        {
            const row = this._windows.buildWidgetLayout('vortex_character_stat_row_xml') as IWindowContainer | null;
            const value = row?.findChildByName('value') ?? null;
            const icon = row?.findChildByName('icon') as IStaticBitmapWrapperWindow | null;

            if(!row || !value) break;

            // The character sheet's row, spread over the detail's width: the value on the right.
            row.width = list.width;
            value.x = list.width - STAT_VALUE_RIGHT - value.width;
            if(icon) icon.assetUri = line.look.icon;
            this._bits.setColor(row, 'icon', line.look.color);
            this._bits.setText(row, 'label', line.label);
            this._bits.setText(row, 'value', line.value);
            this._bits.setText(row, 'bonus', '');
            list.addListItem(row);
        }
    }

    /** « Niveau suivant » and « Améliorer »: none in M1b, so the maximum's state, or what unlocks it. */
    private renderNextLevel(tab: IWindowContainer, definition: ISkillDefinition | null, learned: boolean): void
    {
        const list = tab.findChildByName('upgrade_list') as IItemListWindow | null;
        const button = tab.findChildByName('upgrade_button');
        const level = String(definition?.level ?? '');

        list?.destroyListItems();

        const row = this._windows.buildWidgetLayout('vortex_skill_upgrade_row_xml') as IWindowContainer | null;

        if(row && list)
        {
            this._bits.setText(row, 'upgrade_txt', learned ? this._bits.text('vortex.skill.no_next') : this._bits.text('vortex.skill.unlock_at', 'level', level));
            list.addListItem(row);
        }

        if(button) button.caption = learned ? this._bits.text('vortex.skill.max_rank.button') : this._bits.text('vortex.skill.required_level', 'level', level);
    }
}
