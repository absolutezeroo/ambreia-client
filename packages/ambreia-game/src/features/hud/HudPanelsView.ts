import {Logger} from '@ambreia/common/utils/Logger';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '../../localization/IHabboLocalizationManager';
import {WindowBits} from '../../ui/kit/WindowBits';
import {barFill} from './PlayerHudState';
import type {IHudCast, IHudPanels, IHudUnit, IPartyMember, HudPanelsState} from './HudPanelsState';
import {ChatPanel, type IMenuItem} from './ChatPanel';
import {HudTooltips, type ITooltip} from '../../ui/kit/HudTooltips';
import {lowHp} from '../../ui/kit/hudRules';
import type {ITargetOfTarget} from './ITargetOfTarget';

const log = Logger.getLogger('habbo.features.hud.HudPanelsView');

/** Gap between the HUD and the desktop's edges, and between two panels. */
export const MARGIN = 12;
const GAP = 8;
/** The window context layer of the whole HUD (HudView's too). */
export const LAYER = 1;

type Panel = 'location' | 'quests' | 'party' | 'buffs' | 'target' | 'targetOfTarget' | 'boss' | 'alert' | 'chat';

/** The target-of-target line when the target aims at the player (vortex_hud_target_compact_xml's mock-up). */
const AGGRO_COLOR = 0xff6a6a;

const LAYOUTS: Readonly<Record<Panel, string>> = {
    location: 'vortex_hud_location_xml',
    quests: 'vortex_hud_quest_tracker_xml',
    party: 'vortex_hud_party_xml',
    buffs: 'vortex_hud_buffs_xml',
    target: 'vortex_hud_target_xml',
    targetOfTarget: 'vortex_hud_target_compact_xml',
    boss: 'vortex_hud_boss_xml',
    alert: 'vortex_hud_alert_xml',
    chat: 'vortex_hud_chat_xml'
};

/** The target frame's border by rank (M1c): vortex_hud_target_xml's grey, gold for an elite, red for a boss. */
const RANK_FRAMES: Readonly<Record<string, number>> = {normal: 0x686661, elite: 0xd8a830, boss: 0xc03028};

const thousands = (value: number): string => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/**
 * Everything of the HUD around the player frame and the bottom bar (HudView): place, quest
 * tracker, party, the player's effects, target with its cast, boss, warning and chat, from the
 * mock-ups in vortex-layouts/vortex_hud_* (mockup/glaze/states_hud.png, states_combat.png). A
 * panel shows while its part of HudPanelsState has something; its lists are rebuilt only when
 * their array changed. A party frame is outlined when selected or low on health, an effect when it
 * is about to end; the effects and the party have tooltips; the + button opens the upgrades menu.
 */
export class HudPanelsView
{
    private readonly _panels = new Map<Panel, IWindowContainer>();
    private readonly _bits: WindowBits;
    /** The arrays each list was last built from: a render that does not change them rebuilds nothing. */
    private readonly _built = new Map<string, unknown>();
    /** The chat window's tabs, log, menus and settings. */
    private readonly _chat: ChatPanel;
    private readonly _tips: HudTooltips;
    /** Each party frame to its member, for a click (selection) and a hover (tooltip). */
    private readonly _members = new Map<IWindow, IPartyMember>();
    /** Each effect box to its tooltip line, for a hover. */
    private readonly _effects = new WeakMap<IWindow, string>();
    private _questsClosed = false;
    private _disposed = false;

    private readonly _onChange = (value: Readonly<IHudPanels>): void => this.render(value);
    private readonly _onResize = (): void => this.place();

    /**
     * @param onChat - called with what the player typed in the chat (Enter)
     * @param onPlaced - called after every layout: the bottom bar is laid out against the chat and the target
     * @param onNav - a menu entry asks for a window (`nav_inventory`), as the bar's buttons do
     */
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _state: HudPanelsState,
        localization: IHabboLocalizationManager | null,
        onChat: (text: string) => void,
        private readonly _onPlaced: () => void,
        private readonly _onNav: (name: string) => void
    )
    {
        this._bits = new WindowBits(localization);
        this._chat = new ChatPanel(_windows, this._bits, _state, onChat);
        this._tips = new HudTooltips(_windows, LAYER);
    }

    show(): void
    {
        if(this._disposed || !this.build()) return;

        this._state.events.on('changed', this._onChange);
        this.render(this._state.value);
    }

    hide(): void
    {
        this._state.events.off('changed', this._onChange);
        this._chat.closePopups();
        this._tips.out();

        for(const panel of this._panels.values()) panel.visible = false;
    }

    /** The « plus » menu of the bottom bar (HudView hands its button here): profile, settings, help, log out. */
    moreMenu(anchor: IWindow): void
    {
        const text = (key: string): string => this._bits.text(key);
        const soon = (label: string): IMenuItem => ({label: `${label} (${text('vortex.chat.soon')})`, icon: null, color: 0xffffff, checked: false, enabled: false, pick: () => undefined});

        this._chat.toggleMenu('more', anchor, [
            {label: text('vortex.hud.menu.profile'), icon: 'rpg/ui-icons/travel_person_people_three_icon', color: 0x6aa0e0, checked: false, enabled: true, pick: () => this._onNav('nav_character')},
            soon(text('vortex.hud.menu.settings')),
            soon(text('vortex.hud.menu.help')),
            // Back to the login: the page without its session ticket.
            {label: text('vortex.hud.menu.logout'), icon: 'rpg/ui-icons/map_markers_doorway_enterance_exit_open_icon', color: 0xd04040, checked: false, enabled: true, pick: () => globalThis.location?.assign(globalThis.location.pathname)}
        ], false);
    }

    /** The + button above the effects: the character's upgrades, each a window. */
    private plusMenu(anchor: IWindow): void
    {
        const text = (key: string): string => this._bits.text(key);
        const entry = (label: string, icon: string, color: number, nav: string): IMenuItem => ({label, icon, color, checked: false, enabled: true, pick: () => this._onNav(nav)});

        this._chat.toggleMenu('plus', anchor, [
            entry(text('vortex.character.stats.attributes'), 'rpg/ui-icons/rpg_stat_strength_fist_melee_attack_icon', 0xe09a60, 'nav_character'),
            entry(text('vortex.skill.title'), 'rpg/ui-icons/misc_religion_christianity_bible_book_cross_tome_libram_icon', 0xd0a040, 'nav_skills'),
            entry(text('vortex.hud.nav.inventory'), 'rpg/ui-icons/rpg_loot_bag_money_coins_purse_icon', 0xd8a060, 'nav_inventory')
        ], false);
    }

    /** Builds every panel once; false (said once) when one of the layouts is missing. */
    private build(): boolean
    {
        if(this._panels.size > 0) return true;

        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;
        const missing: string[] = [];

        for(const [panel, layout] of Object.entries(LAYOUTS) as [Panel, string][])
        {
            const window = this._windows.buildWidgetLayout(layout, LAYER) as IWindowContainer | null;

            if(window) this._panels.set(panel, window);
            else missing.push(layout);
        }

        if(!desktop || missing.length > 0)
        {
            log.warn(`HUD layouts missing (${missing.join(', ') || 'no desktop'}): no HUD panels`);

            for(const window of this._panels.values()) window.destroy();
            this._panels.clear();

            return false;
        }

        for(const window of this._panels.values())
        {
            window.visible = false;
            window.procedure = this._onEvent;
            desktop.addChild(window);
        }

        this._panels.get('location')!.addEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);

        return true;
    }

    /**
     * Laid out as the mock-ups: the place and quests top right, the boss centred at the top, the
     * chat bottom left and the target bottom right, both above the bottom bar (found by name, HudView
     * builds it).
     */
    private place(): void
    {
        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        if(!desktop || this._panels.size === 0) return;

        const at = (panel: Panel, x: number, y: number): IWindowContainer =>
        {
            const window = this._panels.get(panel)!;

            window.x = Math.round(x);
            window.y = Math.round(y);

            return window;
        };
        const below = (window: IWindow, fallback: number): number => window.visible ? window.y + window.height + GAP : fallback;
        const width = (panel: Panel): number => this._panels.get(panel)!.width;
        const height = (panel: Panel): number => this._panels.get(panel)!.height;
        const {width: w, height: h} = desktop;

        const top = MARGIN;
        const player = desktop.findChildByName('hud_player');
        const bar = desktop.findChildByName('hud_action_bar');
        const playerRight = player ? MARGIN + player.width + GAP : MARGIN;
        const playerBottom = player ? top + player.height + GAP : top;
        const bottom = h - MARGIN - (bar?.visible ? bar.height + GAP : 0);

        const buffs = at('buffs', playerRight, top);

        at('party', MARGIN, playerBottom);

        const location = at('location', w - width('location') - MARGIN, top);

        at('quests', w - width('quests') - MARGIN, below(location, top));

        // Centred, unless that would cover the player's effects.
        const boss = at('boss', Math.max((w - width('boss')) / 2, buffs.visible ? buffs.x + buffs.width + GAP : 0), top);

        at('alert', boss.x + (boss.width - width('alert')) / 2, below(boss, top));
        const target = at('target', w - width('target') - MARGIN, bottom - height('target'));

        at('targetOfTarget', target.x - width('targetOfTarget') - GAP, bottom - height('targetOfTarget'));
        at('chat', MARGIN, bottom - height('chat'));

        this._onPlaced();
    }

    private render(value: Readonly<IHudPanels>): void
    {
        const panel = (name: Panel): IWindowContainer => this._panels.get(name)!;
        const show = (name: Panel, visible: boolean): boolean => (panel(name).visible = visible);

        if(show('location', value.zoneName !== '' || value.zonePlayers !== null))
        {
            this._bits.setText(panel('location'), 'zone_name', value.zoneName);
            this._bits.setText(panel('location'), 'zone_players', value.zonePlayers === null ? '' : this._bits.text('vortex.hud.players_here', 'count', String(value.zonePlayers)));
        }

        if(show('quests', value.quests.length > 0 && !this._questsClosed)) this.renderQuests(panel('quests'), value);
        if(show('party', value.party.length > 0)) this.renderParty(panel('party'), value);
        // Always there: the + button opens the upgrades menu.
        show('buffs', true);
        this.fillIcons(panel('buffs'), 'buff_grid', value.buffs, 'buffs', value.buffTimes, value.buffExpiring, value.buffTips);
        if(show('boss', value.boss !== null)) this.renderUnit(panel('boss'), 'boss', value.boss!);
        if(show('alert', value.alert !== null)) this._bits.setText(panel('alert'), 'alert_txt', value.alert!);
        if(show('target', value.target !== null)) this.renderUnit(panel('target'), 'target', value.target!);
        if(show('targetOfTarget', value.target !== null && value.targetOfTarget !== null)) this.renderTargetOfTarget(panel('targetOfTarget'), value.targetOfTarget!);

        show('chat', true);
        this._chat.render(panel('chat'), value);

        // After the visibilities: the right column and the warning stack under what is shown.
        this.place();
    }

    private renderQuests(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        const list = this.rebuild<IItemListWindow>(window, 'quest_list', value.quests);

        if(!list) return;

        for(const quest of value.quests)
        {
            const row = this._windows.buildWidgetLayout('vortex_hud_quest_row_xml') as IWindowContainer | null;

            if(!row) return;

            this.setIcon(row, 'quest_icon', quest.icon);
            this._bits.setText(row, 'quest_title', quest.title);
            this._bits.setText(row, 'quest_objective', quest.objective);
            this._bits.setText(row, 'quest_count', quest.count);
            list.addListItem(row);
        }
    }

    private renderParty(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        const list = this.rebuild<IItemListWindow>(window, 'party_list', value.party);

        if(list)
        {
            this._members.clear();

            for(const member of value.party)
            {
                const frame = this._windows.buildWidgetLayout('vortex_hud_party_member_xml') as IWindowContainer | null;

                if(!frame) return;

                this._bits.avatar(frame, 'head_image', member.figure, 2, true);
                this._bits.setText(frame, 'member_name', member.name);
                this._bits.setText(frame, 'member_level', member.level === null ? '' : this._bits.text('vortex.ui.level.short', 'level', String(member.level)));
                this.setBar(frame, 'hp_bar', member.hp, member.hpMax);
                this._bits.setVisible(frame, member.dead, 'dead_veil', 'dead_txt');
                this._bits.setVisible(frame, !member.dead, 'buff_list');
                this._bits.setVisible(frame, lowHp(member.hp, member.hpMax), 'low_hp');
                if(!member.dead) this.fillIcons(frame, 'buff_list', member.buffs);
                list.addListItem(frame);
                this._members.set(frame, member);
            }
        }

        // The selection is a mark on the frames, not a rebuild.
        for(const [frame, member] of this._members) this._bits.setVisible(frame as IWindowContainer, member.name === value.partySelected, 'selected');
    }

    /**
     * The target's target (M1d §4): its name and level, its health; when it is the player, the line
     * says the aggro is on him, in red (the owner's mock-up of the compact frame).
     */
    private renderTargetOfTarget(window: IWindowContainer, unit: ITargetOfTarget): void
    {
        const level = unit.level === null ? '' : ` · ${this._bits.text('vortex.ui.level.short', 'level', String(unit.level))}`;
        const percent = unit.hp !== null && unit.hpMax ? `${Math.round(100 * unit.hp / unit.hpMax)} %` : '';

        this._bits.setText(window, 'target_title', this._bits.text('vortex.combat.target_of_target'));
        this._bits.setText(window, 'target_info', unit.onPlayer ? this._bits.text('vortex.combat.aggro') : `${unit.name}${level}`);
        this._bits.setTextColor(window, 'target_info', unit.onPlayer ? AGGRO_COLOR : 0xffffff);
        this._bits.setVisible(window, unit.hp !== null, 'target_hp_bar');
        this.setBar(window, 'target_hp_bar', unit.hp, unit.hpMax, percent);
    }

    /** The boss or the target: portrait, name, level line, HP with its percentage, effects, cast. */
    private renderUnit(window: IWindowContainer, prefix: 'boss' | 'target', unit: IHudUnit): void
    {
        const percent = unit.hp !== null && unit.hpMax ? ` (${Math.round(100 * unit.hp / unit.hpMax)}%)` : '';

        const figure = unit.figure ?? null;

        this.setIcon(window, `${prefix}_portrait`, figure === null ? unit.portrait : null);
        this._bits.setVisible(window, figure !== null, `${prefix}_head`);
        if(figure !== null) this._bits.avatar(window, `${prefix}_head`, figure, 2, true);
        this._bits.setText(window, `${prefix}_name`, unit.name);
        // No HP on the wire for a player target yet (F3b): no bar rather than an empty one.
        this._bits.setVisible(window, unit.hp !== null, `${prefix}_hp_bar`);
        this._bits.setText(window, prefix === 'boss' ? 'boss_level' : 'target_info', prefix === 'boss' ? (unit.level === null ? '' : this._bits.text('vortex.ui.level.short', 'level', String(unit.level))) : unit.info);
        this.setBar(window, `${prefix}_hp_bar`, unit.hp, unit.hpMax, unit.hp === null || unit.hpMax === null ? '' : `${thousands(unit.hp)} / ${thousands(unit.hpMax)}${percent}`);
        this.renderCast(window, prefix, unit.cast ?? null);
        // The boss's cast line takes the place of its effects.
        this._bits.setVisible(window, prefix === 'target' || !unit.cast, 'debuff_list');
        this.fillIcons(window, 'debuff_list', unit.debuffs, `${prefix}.debuffs`);

        const frame = window.findChildByName(`${prefix}_frame`);

        if(frame) frame.color = RANK_FRAMES[unit.rank ?? 'normal'] ?? RANK_FRAMES.normal;
    }

    /** The cast line: the target frame's titled one, the boss frame's in place of its effects. */
    private renderCast(window: IWindowContainer, prefix: 'boss' | 'target', cast: IHudCast | null): void
    {
        this._bits.setVisible(window, cast !== null, 'cast_title', 'cast_icon', 'cast_name', 'cast_bar', 'cast_frame');
        // In the target frame the icon's box has no name of its own.
        const castFrame = window.findChildByName('cast_icon')?.parent ?? null;

        if(castFrame && castFrame !== window) castFrame.visible = cast !== null;

        if(!cast) return;

        this.setIcon(window, 'cast_icon', cast.icon);
        this._bits.setText(window, 'cast_name', cast.name);
        this.setBar(window, 'cast_bar', cast.elapsed, cast.duration, `${cast.elapsed.toFixed(1)} / ${cast.duration.toFixed(1)} s`);
    }

    /**
     * The list or grid named `name`, emptied for a rebuild — or null when `items` is the array it was
     * last built from, so nothing needs doing. `key` tells two lists of one name apart.
     */
    private rebuild<T extends IItemListWindow | IItemGridWindow>(window: IWindowContainer, name: string, items: readonly unknown[], key: string = name): T | null
    {
        const holder = window.findChildByName(name) as T | null;

        if(!holder || this._built.get(key) === items) return null;

        this._built.set(key, items);

        if('destroyGridItems' in holder) holder.destroyGridItems();
        else holder.destroyListItems();

        return holder;
    }

    /**
     * One vortex_hud_buff_xml per icon, with its time, its red outline when it is about to end and
     * what its tooltip says. A party member's list is rebuilt with its frame, so it has no key.
     */
    private fillIcons(window: IWindowContainer, name: string, icons: readonly string[], key?: string, times?: readonly string[], expiring?: readonly boolean[], tips?: readonly string[]): void
    {
        const holder = key === undefined
            ? window.findChildByName(name) as IItemListWindow | IItemGridWindow | null
            : this.rebuild<IItemListWindow | IItemGridWindow>(window, name, icons, key);

        if(!holder) return;

        for(const [i, icon] of icons.entries())
        {
            const box = this._windows.buildWidgetLayout('vortex_hud_buff_xml') as IWindowContainer | null;

            if(!box) return;

            this.setIcon(box, 'buff_icon', icon);
            this._bits.setText(box, 'buff_time', times?.[i] ?? '');
            this._bits.setVisible(box, expiring?.[i] === true, 'expiring');
            if(tips?.[i]) this._effects.set(box, tips[i]);

            if('addGridItem' in holder) holder.addGridItem(box);
            else holder.addListItem(box);
        }
    }

    private setIcon(container: IWindowContainer, name: string, icon: string | null): void
    {
        const bitmap = container.findChildByName(name) as IStaticBitmapWrapperWindow | null;

        if(!bitmap) return;

        bitmap.visible = icon !== null;
        if(icon !== null && bitmap.assetUri !== icon) bitmap.assetUri = icon;
    }

    /** `<name>` holds `bg`, `fill` and `value`, as in the player frame (HudView.setBar()). */
    private setBar(container: IWindowContainer, name: string, value: number | null, max: number | null, label: string | null = null): void
    {
        const bar = container.findChildByName(name) as IWindowContainer | null;
        const background = bar?.findChildByName('bg');
        const fill = bar?.findChildByName('fill');

        if(!bar || !background || !fill) return;

        const width = barFill(value, max, background.width);

        fill.visible = width > 0;
        if(width > 0) fill.width = width;
        this._bits.setText(bar, 'value', label ?? (value === null || max === null ? '' : `${value} / ${max}`));
    }

    /** The tooltip of what is under the pointer: an effect, a party member, the + button. */
    private describe(window: IWindow): ITooltip | null
    {
        const effect = WindowBits.ancestor(window, 'buff');
        const line = effect ? this._effects.get(effect) ?? null : null;

        if(line !== null)
        {
            const [title, ...rest] = line.split('\n');

            return {layout: 'vortex_hud_tip_xml', fill: tip =>
            {
                this.setIcon(tip, 'tip_icon', ((effect as IWindowContainer).findChildByName('buff_icon') as IStaticBitmapWrapperWindow | null)?.assetUri ?? null);
                this._bits.setColor(tip, 'tip_icon', 0xffffff);
                this._bits.setText(tip, 'tip_title', title);
                this._bits.setText(tip, 'tip_txt', rest.join('\n'));
            }};
        }

        const frame = WindowBits.ancestor(window, 'party_member');
        const member = frame ? this._members.get(frame) ?? null : null;

        if(member)
        {
            return {layout: 'vortex_hud_player_tip_xml', fill: tip =>
            {
                this._bits.avatar(tip, 'head_image', member.figure, 2, true);
                this._bits.setText(tip, 'player_name', member.name);
                this._bits.setText(tip, 'player_info', member.level === null ? '' : this._bits.text('vortex.ui.level.short', 'level', String(member.level)));
                this._bits.setText(tip, 'player_guild', '');
            }};
        }

        if(WindowBits.ancestor(window, 'buff_add_button'))
        {
            return {layout: 'vortex_hud_tip_xml', fill: tip =>
            {
                this._bits.setVisible(tip, false, 'tip_icon_box');
                this._bits.setText(tip, 'tip_title', this._bits.text('vortex.hud.improvements'));
                this._bits.setText(tip, 'tip_txt', '');
            }};
        }

        return null;
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(this._tips.handle(event, () => this.describe(window))) return;
        if(this._chat.onEvent(event, window)) return;
        if(event.type !== 'WME_CLICK') return;

        if(WindowBits.ancestor(window, 'close_button') && WindowBits.ancestor(window, 'hud_target'))
        {
            this._state.update({target: null, partySelected: null});

            return;
        }

        if(WindowBits.ancestor(window, 'close_button') && WindowBits.ancestor(window, 'hud_quest_tracker'))
        {
            this._questsClosed = true;
            this.render(this._state.value);

            return;
        }

        const plus = WindowBits.ancestor(window, 'buff_add_button');

        if(plus)
        {
            this.plusMenu(plus);

            return;
        }

        // A party member's frame: selected, and shown in the target frame (no HP on the wire for players: theirs is known).
        const frame = WindowBits.ancestor(window, 'party_member');
        const member = frame ? this._members.get(frame) ?? null : null;

        if(member)
        {
            const selected = this._state.value.partySelected === member.name ? null : member.name;

            this._state.update({
                partySelected: selected,
                target: selected === null ? null : {
                    name: member.name, portrait: null, figure: member.figure, level: member.level,
                    info: member.level === null ? '' : this._bits.text('vortex.ui.level.short', 'level', String(member.level)),
                    hp: member.hp, hpMax: member.hpMax, debuffs: member.buffs, cast: null
                }
            });

            return;
        }

        log.debug(`HUD: ${window.name} has nothing to open yet`);
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.hide();
        this._chat.dispose();
        this._tips.dispose();
        this._panels.get('location')?.removeEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);

        for(const window of this._panels.values()) window.destroy();

        this._panels.clear();
        this._built.clear();
        this._members.clear();
    }
}
