import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IDropMenuWindow} from '@ambreia/ui/components/IDropMenuWindow';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {WindowBits} from '../character/WindowBits';
import {buildFrame} from '../inventory/InventoryView';
import {SKILL_SLOTS} from '../hud/PlayerHudState';
import {barSkill, type ISkillDefinition, type RpgSkillSession} from './RpgSkillSession';
import {skillIcon} from './skillArt';

type SkillsTab = 'tab_active' | 'tab_shortcuts';

/** What a skill does first, for its tag and the filter (M1b §6.6: its camp is its first effect's). */
type SkillTag = 'damage' | 'heal' | 'effect';

/** The filter menu's entries, « Toutes » first. */
const FILTERS: ReadonlyArray<SkillTag | null> = [null, 'damage', 'heal', 'effect'];

const UI = 'rpg/ui-icons/';

/** The stat lines' icons (tinted, vortex_character_stat_row_xml): the mock-up's star, hourglass, eye, fist. */
const STAT_LOOK = {
    mana: {icon: `${UI}rpg_stat_mp_mana_star_icon`, color: 0x3080e0},
    cooldown: {icon: `${UI}boardgames_chess_clock_timer_icon`, color: 0xa07840},
    range: {icon: `${UI}media_eyeball_vision_shown_icon`, color: 0x4a90b0},
    cast: {icon: `${UI}rpg_combat_types_sword_arrow_staff_melee_ranged_magic_icon`, color: 0xd8a030},
    damage: {icon: `${UI}rpg_stat_strength_fist_melee_attack_icon`, color: 0xd06040},
    heal: {icon: `${UI}rpg_stat_hp_health_heart_icon`, color: 0xe03030},
    effect: {icon: `${UI}alchemy_element_fire_icon`, color: 0x9a60c8}
} as const;

/** Read by name at run time: decoded at load (IGameFeature.images). */
export const SKILL_WINDOW_IMAGES: readonly string[] = [...new Set(Object.values(STAT_LOOK).map(look => look.icon))];

/** The tag's colours (vortex_skill_header_xml's own for damage). */
const TAG_COLORS: Readonly<Record<SkillTag, number>> = {damage: 0xf6c0b8, heal: 0xc8ecc0, effect: 0xdcd0f0};

/** The states of states_skills.png: a tile, a bar slot and a list row, idle, selected, locked. */
const TILE = 0xe4e4dc;
const TILE_SELECTED = 0xfdefb6;
const TILE_LOCKED = 0xd8d8d0;
const ROW = 0xf2f2ec;
const LOCKED_TEXT = 0xa0a098;

/** The stat list's height once the ranks' part is gone: seven lines (cost, cooldown, range, cast, three effects). */
const STATS_HEIGHT = 7 * 22;

/** A stat row's value ends this far from the detail's right edge, as in skills_active.png. */
const STAT_VALUE_RIGHT = 56;

interface IStatLine
{
    look: {icon: string; color: number};
    label: string;
    value: string;
}

interface ISkillEntry
{
    skillId: string;
    learned: boolean;
    level: number;
}

/** A skill's camp, from its first effect that hurts or heals; otherwise it only applies effects. */
export function tagOf(definition: ISkillDefinition): SkillTag
{
    for(const effect of definition.effects)
    {
        if(effect.kind === 'damage') return 'damage';
        if(effect.kind === 'heal') return 'heal';
    }

    return 'effect';
}

/**
 * The skills window (K, vortex_skill_xml, mockup/glaze/skills_*.png). « Actives »: the class's
 * skills as tiles (learned ones with their level, the others locked), filter and search, the
 * selected one's tag, description and stats (M1b §5, the server's definitions), and the action
 * bar. « Raccourcis »: the learned skills as a list, the main bar, the selected slot's details,
 * clear and restore. A skill chosen then a slot clicked puts it there; every change is an
 * RpgActionBarSet, and the window follows the RpgSkills that comes back.
 *
 * Not on the wire in M1b, so disabled or hidden: the passives and specialisations tabs, the skills'
 * ranks (progress, « Niveau suivant », « Améliorer »), the extra shortcuts and the shortcut settings.
 */
export class SkillsWindow
{
    private _window: IWindowContainer | null = null;
    private readonly _tabs = new Map<SkillsTab, IWindowContainer>();
    private _tab: SkillsTab = 'tab_active';
    private _header: IWindowContainer | null = null;
    /** Tiles and list rows, to the skill they show. */
    private readonly _skills = new Map<IWindow, string>();
    private readonly _slots = new Map<SkillsTab, IWindowContainer[]>();
    private _selected: string | null = null;
    /** The shortcuts tab's selected slot. */
    private _slot = 0;
    private _filter: SkillTag | null = null;
    private _search = '';
    private _disposed = false;

    private readonly _onSkills = (): void => this.render();

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _session: RpgSkillSession,
        /** The played character's class: which skills it has and will have. */
        private readonly _classId: () => string
    )
    {
        _session.events.on('skills', this._onSkills);
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

    /** The definitions arrived: the stats and the locked skills follow. */
    refresh(): void
    {
        this.render();
    }

    private build(): boolean
    {
        if(this._window) return true;

        const window = buildFrame(this._windows, 'vortex_skill_xml', this._onEvent);
        const content = window?.findChildByName('tab_content') as IWindowContainer | null;
        const active = this._windows.buildWidgetLayout('vortex_skill_tab_active_xml') as IWindowContainer | null;
        const shortcuts = this._windows.buildWidgetLayout('vortex_skill_tab_shortcuts_xml') as IWindowContainer | null;
        const header = this._windows.buildWidgetLayout('vortex_skill_header_xml') as IWindowContainer | null;
        const headerSlot = active?.findChildByName('skill_header_slot') as IWindowContainer | null;

        if(!window || !content || !active || !shortcuts || !header || !headerSlot)
        {
            for(const built of [header, shortcuts, active, window]) built?.destroy();

            return false;
        }

        this._window = window;
        this._header = header;
        this._tabs.set('tab_active', active);
        this._tabs.set('tab_shortcuts', shortcuts);
        content.addChild(active);
        content.addChild(shortcuts);
        headerSlot.addChild(header);

        // The skills have no ranks in M1b: no progress, next level nor upgrade. The stats take
        // their room (an effect line or two more than the mock-up's five), the rule under them follows.
        this._bits.setVisible(header, false, 'skill_progress', 'points');
        this._bits.setVisible(active, false, 'next_level_title', 'upgrade_list', 'upgrade_button', 'upgrade_hint');

        const stats = active.findChildByName('stat_list');
        const detail = active.findChildByName('skill_detail') as IWindowContainer | null;

        if(stats && detail)
        {
            for(let i = 0; i < detail.numChildren; i++)
            {
                const rule = detail.getChildAt(i);

                // The unnamed 1 px rule under the stats.
                if(rule && rule.height === 1 && rule.y > stats.y) rule.y = stats.y + STATS_HEIGHT + 4;
            }

            stats.height = STATS_HEIGHT;
        }
        this._bits.setText(active, 'bar_hint', this._bits.text('vortex.skill.action_bar.assign'));
        // No extra shortcuts nor shortcut settings on the server yet.
        this._bits.setText(shortcuts, 'extra_hint', this._bits.text('vortex.skill.soon'));
        for(const name of ['show_shortcuts', 'swap_bars', 'out_of_combat', 'reset_shortcuts_button']) shortcuts.findChildByName(name)?.disable();

        const grid = active.findChildByName('skill_grid') as IItemGridWindow | null;

        // The layout's `spacing` does not reach a scrollable grid's inner grid (InventoryView).
        if(grid) grid.spacing = 6;

        const menus = [...this._tabs.values()].map(tab => tab.findChildByName('type_filter') as IDropMenuWindow | null);

        // All filled before any is set: setting one tells the other (onSelected()).
        for(const menu of menus) menu?.populate(FILTERS.map(filter => this.filterName(filter)));
        for(const menu of menus) if(menu) menu.selection = 0;

        this.buildSlots('tab_active', 'action_bar_slots');
        this.buildSlots('tab_shortcuts', 'main_bar_slots');

        const tabs = window.findChildByName('tab_context') as ITabContextWindow | null;

        for(const name of ['tab_passive', 'tab_specs']) tabs?.getTabItemByName(name)?.disable();

        const first = tabs?.getTabItemByName(this._tab);

        if(tabs?.selector && first) tabs.selector.setSelected(first);
        this.showTab();

        return true;
    }

    private buildSlots(tab: SkillsTab, listName: string): void
    {
        const list = this._tabs.get(tab)?.findChildByName(listName) as IItemListWindow | null;
        const slots: IWindowContainer[] = [];

        for(let i = 0; i < SKILL_SLOTS; i++)
        {
            const slot = this._windows.buildWidgetLayout('vortex_skill_action_slot_xml') as IWindowContainer | null;

            if(!slot || !list) break;

            this._bits.setText(slot, 'slot_key', String(i + 1));
            slot.procedure = this._onEvent;
            list.addListItem(slot);
            slots.push(slot);
        }

        this._slots.set(tab, slots);
    }

    private showTab(): void
    {
        for(const [name, tab] of this._tabs) tab.visible = name === this._tab;
    }

    /** The class's skills, learned first then by level, kept by the filter and the search. */
    private entries(): ISkillEntry[]
    {
        const known = new Set(this._session.known);
        const classId = this._classId();
        const all = new Map<string, number>();

        for(const definition of this._session.definitions) if(definition.classes.includes(classId)) all.set(definition.id, definition.level);
        // A learned skill the definitions do not have (yet) still shows.
        for(const skillId of known) if(!all.has(skillId)) all.set(skillId, this._session.definition(skillId)?.level ?? 0);

        return [...all]
            .map(([skillId, level]) => ({skillId, learned: known.has(skillId), level}))
            .filter(entry => this.matches(entry.skillId))
            .sort((a, b) => Number(b.learned) - Number(a.learned) || a.level - b.level || a.skillId.localeCompare(b.skillId));
    }

    private matches(skillId: string): boolean
    {
        const definition = this._session.definition(skillId);

        if(this._filter !== null && (definition === null || tagOf(definition) !== this._filter)) return false;

        return this._search === '' || this.name(skillId).toLowerCase().includes(this._search);
    }

    private render(): void
    {
        if(!this._window?.visible) return;

        const entries = this.entries();

        if(this._selected === null || !entries.some(entry => entry.skillId === this._selected)) this._selected = entries[0]?.skillId ?? null;

        this._skills.clear();
        this.renderActive(entries);
        this.renderShortcuts(entries.filter(entry => entry.learned));

        for(const [tab, slots] of this._slots)
        {
            slots.forEach((slot, i) => this.renderSlot(slot, barSkill(this._session.bar[i] ?? ''), tab === 'tab_shortcuts' && i === this._slot));
        }
    }

    private renderActive(entries: readonly ISkillEntry[]): void
    {
        const tab = this._tabs.get('tab_active');
        const grid = tab?.findChildByName('skill_grid') as IItemGridWindow | null;

        if(!tab || !grid) return;

        grid.destroyGridItems();

        for(const entry of entries)
        {
            const tile = this._windows.buildWidgetLayout('vortex_skill_slot_xml') as IWindowContainer | null;

            if(!tile) break;

            this.setIcon(tile, 'skill_icon', entry.learned ? entry.skillId : null);
            this._bits.setVisible(tile, !entry.learned, 'lock_icon');
            this._bits.setText(tile, 'skill_level', this._bits.text('vortex.ui.level.short', 'level', String(entry.level)));
            this._bits.setTextColor(tile, 'skill_level', entry.learned ? 0x0 : LOCKED_TEXT);
            tile.color = !entry.learned ? TILE_LOCKED : entry.skillId === this._selected ? TILE_SELECTED : TILE;
            // A scrollable grid answers its items' events itself: the tile carries the window's.
            tile.procedure = this._onEvent;
            this._skills.set(tile, entry.skillId);
            grid.addGridItem(tile);
        }

        const header = this._header;
        const selected = this._selected;
        const definition = selected === null ? null : this._session.definition(selected);

        if(header)
        {
            header.visible = selected !== null;

            if(selected !== null)
            {
                const tag = definition === null ? null : tagOf(definition);

                this.setIcon(header, 'skill_icon', selected);
                this._bits.setText(header, 'skill_name', this.name(selected));
                this._bits.setText(header, 'skill_level', definition === null ? '' : this._bits.text('vortex.skill.learned_at', 'level', String(definition.level)));
                this._bits.setText(header, 'skill_desc', this._bits.textOr(`${selected}.description`, ''));
                this._bits.setVisible(header, tag !== null, 'skill_tag');

                if(tag !== null)
                {
                    this._bits.setColor(header, 'skill_tag', TAG_COLORS[tag]);
                    this._bits.setText(header, 'skill_tag_txt', this.filterName(tag));
                }
            }
        }

        this.renderStats(tab, definition);
    }

    private renderShortcuts(learned: readonly ISkillEntry[]): void
    {
        const tab = this._tabs.get('tab_shortcuts');
        const list = tab?.findChildByName('available_list') as IItemListWindow | null;

        if(!tab || !list) return;

        list.destroyListItems();

        for(const entry of learned)
        {
            const row = this._windows.buildWidgetLayout('vortex_skill_list_row_xml') as IWindowContainer | null;

            if(!row) break;

            this.setIcon(row, 'skill_icon', entry.skillId);
            this._bits.setText(row, 'skill_name', this.name(entry.skillId));
            this._bits.setText(row, 'skill_level', this._bits.text('vortex.ui.level.short', 'level', String(entry.level)));
            row.color = entry.skillId === this._selected ? TILE_SELECTED : ROW;
            row.procedure = this._onEvent;
            this._skills.set(row, entry.skillId);
            list.addListItem(row);
        }

        // The selected slot's details.
        const skillId = barSkill(this._session.bar[this._slot] ?? '');
        const detail = tab.findChildByName('shortcut_detail') as IWindowContainer | null;

        if(!detail) return;

        this.setIcon(detail, 'shortcut_icon', skillId);
        this._bits.setText(detail, 'shortcut_name', skillId === null ? this._bits.text('vortex.skill.shortcuts.empty') : this.name(skillId));
        this._bits.setText(detail, 'shortcut_level', skillId === null ? '' : this._bits.text('vortex.ui.level.short', 'level', String(this._session.definition(skillId)?.level ?? '')));
        this._bits.setText(detail, 'shortcut_desc', skillId === null ? '' : this._bits.textOr(`${skillId}.description`, ''));
        this._bits.setText(detail, 'assigned_key', String(this._slot + 1));

        const unassign = detail.findChildByName('unassign_button');

        if(skillId === null) unassign?.disable();
        else unassign?.enable();
    }

    /** A bar slot: its skill's icon, else the « + » of an empty slot (states_skills.png). */
    private renderSlot(slot: IWindowContainer, skillId: string | null, selected: boolean): void
    {
        const box = slot.findChildByName('slot_box') as IWindowContainer | null;

        this.setIcon(slot, 'slot_icon', skillId);
        if(!box) return;

        box.color = selected ? TILE_SELECTED : TILE;

        // The « + » has no name of its own.
        for(let i = 0; i < box.numChildren; i++)
        {
            const child = box.getChildAt(i);

            if(child?.caption === '+') child.visible = skillId === null;
        }
    }

    /** Cost, cooldown, range, cast time, then what it does, from the server's definition. */
    private renderStats(tab: IWindowContainer, definition: ISkillDefinition | null): void
    {
        const list = tab.findChildByName('stat_list') as IItemListWindow | null;

        if(!list) return;

        list.destroyListItems();

        if(!definition) return;

        for(const line of this.statLines(definition))
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

    private statLines(definition: ISkillDefinition): IStatLine[]
    {
        const text = this._bits;
        const seconds = (ms: number): string => text.text('vortex.skill.seconds', 'seconds', String(Math.round(ms / 100) / 10).replace('.', ','));
        const amount = (base: number, coefficient: number): string => coefficient === 0
            ? String(base)
            : text.text(base === 0 ? 'vortex.skill.scaling' : 'vortex.skill.base_scaling', 'base', String(base), 'coefficient', String(coefficient).replace('.', ','));
        const lines: IStatLine[] = [
            {look: STAT_LOOK.mana, label: text.text('vortex.skill.mana_cost'), value: String(definition.cost)},
            {look: STAT_LOOK.cooldown, label: text.text('vortex.skill.cooldown'), value: definition.cooldownMs > 0 ? seconds(definition.cooldownMs) : text.text('vortex.skill.none')},
            {look: STAT_LOOK.range, label: text.text('vortex.skill.range'), value: definition.range > 0 ? text.text('vortex.skill.tiles', 'count', String(definition.range)) : text.text('vortex.skill.range.self')},
            {
                look: STAT_LOOK.cast,
                label: text.text(definition.type === 'channel' ? 'vortex.skill.channel_time' : 'vortex.skill.cast_time'),
                value: definition.type === 'cast' ? seconds(definition.castMs) : definition.type === 'channel' ? seconds(definition.channelMs) : text.text('vortex.skill.instant')
            }
        ];

        for(const effect of definition.effects)
        {
            if(effect.kind === 'damage') lines.push({look: STAT_LOOK.damage, label: text.text('vortex.skill.base_damage'), value: amount(effect.base, effect.coefficient)});
            else if(effect.kind === 'heal') lines.push({look: STAT_LOOK.heal, label: text.text('vortex.skill.base_heal'), value: amount(effect.base, effect.coefficient)});
            else if(effect.kind === 'apply_status' && effect.status !== null)
            {
                const status = this._session.statusDefinition(effect.status);
                const name = text.contentName(`${effect.status}.name`, effect.status);

                lines.push({look: STAT_LOOK.effect, label: text.text('vortex.skill.effect'), value: status ? `${name} (${seconds(status.durationMs)})` : name});
            }
            else if(effect.kind === 'interrupt')
            {
                lines.push({look: STAT_LOOK.effect, label: text.text('vortex.skill.effect'), value: text.text('vortex.skill.effect.interrupt')});
            }
        }

        return lines;
    }

    private filterName(filter: SkillTag | null): string
    {
        return this._bits.text(filter === null ? 'vortex.ui.all' : `vortex.skill.tag.${filter}`);
    }

    private name(skillId: string): string
    {
        return this._bits.contentName(`${skillId}.name`, skillId);
    }

    private setIcon(container: IWindowContainer, name: string, skillId: string | null): void
    {
        const icon = container.findChildByName(name) as IStaticBitmapWrapperWindow | null;

        if(!icon) return;

        icon.visible = skillId !== null;
        if(skillId !== null) icon.assetUri = skillIcon(skillId);
    }

    /** The bar slot `window` is in, in the shown tab: its index, or -1. */
    private slotOf(window: IWindow): number
    {
        const slot = WindowBits.ancestor(window, 'action_slot');

        return slot ? (this._slots.get(this._tab) ?? []).indexOf(slot as IWindowContainer) : -1;
    }

    /** The tile or row `window` is in: its skill, or null. */
    private skillOf(window: IWindow): string | null
    {
        for(let at: IWindow | null = window; at; at = at.parent)
        {
            const skillId = this._skills.get(at);

            if(skillId !== undefined) return skillId;
        }

        return null;
    }

    /** The learned skills in level order, then empty slots: what choosing the class does (M1b §9). */
    private restoreDefaults(): void
    {
        const level = (skillId: string): number => this._session.definition(skillId)?.level ?? 0;
        const ordered = [...this._session.known].sort((a, b) => level(a) - level(b));

        for(let i = 0; i < SKILL_SLOTS; i++) this._session.setBar(i, ordered[i] === undefined ? '' : `skill:${ordered[i]}`);
    }

    private onSelected(window: IWindow): void
    {
        // From the tab button or from its context, depending on who dispatches it.
        const name = window.name === 'tab_context' ? (window as ITabContextWindow).selector?.getSelected()?.name ?? '' : window.name;

        if((name === 'tab_active' || name === 'tab_shortcuts') && name !== this._tab)
        {
            this._tab = name;
            this.showTab();
            this.render();

            return;
        }

        if(window.name !== 'type_filter') return;

        const selection = (window as IDropMenuWindow).selection;

        this._filter = FILTERS[selection] ?? null;

        // Both tabs' menus say the same.
        for(const tab of this._tabs.values())
        {
            const menu = tab.findChildByName('type_filter') as IDropMenuWindow | null;

            // Only on a change: the other menu's own event comes back here.
            if(menu && menu !== window && menu.selection !== selection && selection < menu.numMenuItems) menu.selection = selection;
        }

        this.render();
    }

    private onSearch(event: WindowEvent, input: ITextFieldWindow): void
    {
        const placeholder = this._bits.text('vortex.skill.search');

        // The field opens with its placeholder as its text: a click clears it, left empty it comes back.
        if(event.type === 'WME_CLICK' && input.text === placeholder) input.text = '';
        else if(event.type === 'WE_UNFOCUSED' && input.text.trim() === '') input.text = placeholder;
        else if(event.type === 'WKE_KEY_UP')
        {
            this._search = input.text.trim().toLowerCase();
            this.render();
        }
    }

    private onSlot(slot: number): void
    {
        const current = barSkill(this._session.bar[slot] ?? '');
        const learned = this._selected !== null && this._session.known.includes(this._selected);

        this._slot = slot;

        // Raccourcis: with no other skill chosen, a click selects the slot, for its details.
        if(this._tab === 'tab_shortcuts' && (!learned || current === this._selected))
        {
            this.render();

            return;
        }

        // The chosen skill goes in the slot (the server moves it from elsewhere); the same one again empties it.
        if(learned) this._session.setBar(slot, current === this._selected ? '' : `skill:${this._selected}`);
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WE_SELECTED')
        {
            this.onSelected(window);

            return;
        }

        if(window.name === 'search_input')
        {
            this.onSearch(event, window as ITextFieldWindow);

            return;
        }

        if(event.type !== 'WME_CLICK') return;

        switch(window.name)
        {
            case 'header_button_close': this.hide(); return;
            case 'reset_bar_button':
            case 'restore_defaults_button': this.restoreDefaults(); return;
            case 'clear_all_button': for(let i = 0; i < SKILL_SLOTS; i++) this._session.setBar(i, ''); return;
            case 'unassign_button': this._session.setBar(this._slot, ''); return;
        }

        const skillId = this.skillOf(window);

        if(skillId !== null)
        {
            this._selected = skillId;
            this.render();

            return;
        }

        const slot = this.slotOf(window);

        if(slot >= 0) this.onSlot(slot);
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._session.events.off('skills', this._onSkills);
        this._window?.destroy();
        this._window = this._header = null;
        this._tabs.clear();
        this._skills.clear();
        this._slots.clear();
    }
}
