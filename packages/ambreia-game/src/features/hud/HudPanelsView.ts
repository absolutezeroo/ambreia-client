import {Logger} from '@ambreia/common/utils/Logger';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowKeyboardEvent} from '@ambreia/ui/events/WindowKeyboardEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '../../localization/IHabboLocalizationManager';
import {WindowBits} from '../character/WindowBits';
import {barFill} from './PlayerHudState';
import type {ChatChannel, IChatLine, IHudPanels, IHudUnit, HudPanelsState} from './HudPanelsState';

const log = Logger.getLogger('habbo.features.hud.HudPanelsView');

/** Gap between the HUD and the desktop's edges, and between two panels. */
export const MARGIN = 12;
const GAP = 8;
/** The window context layer of the whole HUD (HudView's too). */
export const LAYER = 1;
const ENTER = 13;
/** vortex_hud_topbar_xml's width, and where its right-hand group starts (the menu button ends at 816). */
const TOPBAR_LAYOUT_WIDTH = 1260;
const TOPBAR_RIGHT_GROUP = 860;

const CHANNELS: Readonly<Record<ChatChannel, {key: string; color: number}>> = {
    general: {key: 'vortex.guild.channel.general', color: 0xf0a030},
    group: {key: 'vortex.group.title', color: 0x5ab4f0},
    guild: {key: 'vortex.character.guild', color: 0x7cd14f},
    system: {key: 'vortex.hud.chat.system', color: 0xc890e0}
};

type Panel = 'topbar' | 'location' | 'quests' | 'party' | 'buffs' | 'target' | 'boss' | 'alert' | 'chat';

const LAYOUTS: Readonly<Record<Panel, string>> = {
    topbar: 'vortex_hud_topbar_xml',
    location: 'vortex_hud_location_xml',
    quests: 'vortex_hud_quest_tracker_xml',
    party: 'vortex_hud_party_xml',
    buffs: 'vortex_hud_buffs_xml',
    target: 'vortex_hud_target_xml',
    boss: 'vortex_hud_boss_xml',
    alert: 'vortex_hud_alert_xml',
    chat: 'vortex_hud_chat_xml'
};

/**
 * Where the panels under the top bar start: below it while it is shown. Shared with HudView, which
 * finds the bar by its window name rather than holding this view.
 */
export function hudTop(desktop: IWindowContainer): number
{
    const topbar = desktop.findChildByName('hud_topbar');

    return topbar?.visible ? topbar.y + topbar.height + GAP : MARGIN;
}

/** `12450` → `12 450`. */
const thousands = (value: number): string => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/**
 * Everything of the HUD around the player frame and the action bar (HudView): top bar, place,
 * quest tracker, party, the player's effects, target with its cast, boss, warning and chat, from
 * the mock-ups in vortex-layouts/vortex_hud_* (laid out as mockup/glaze/hud_explore.png and
 * hud_combat.png). A panel shows while its part of HudPanelsState has something; its lists are
 * rebuilt only when their array changed.
 */
export class HudPanelsView
{
    private readonly _panels = new Map<Panel, IWindowContainer>();
    private readonly _bits: WindowBits;
    /** The arrays each list was last built from: a render that does not change them rebuilds nothing. */
    private readonly _built = new Map<string, unknown>();
    private _questsClosed = false;
    /** The top bar's right-hand group, which follows its right edge (stretchTopbar()). */
    private _topbarRight: IWindow[] | null = null;
    private _disposed = false;

    private readonly _onChange = (value: Readonly<IHudPanels>): void => this.render(value);
    private readonly _onResize = (): void => this.place();

    /**
     * @param onChat - called with what the player typed in the chat (Enter)
     * @param onPlaced - called after every layout: the action bar sits between the chat and the target
     */
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _state: HudPanelsState,
        localization: IHabboLocalizationManager | null,
        private readonly _onChat: (text: string) => void,
        private readonly _onPlaced: () => void
    )
    {
        this._bits = new WindowBits(localization);
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

        for(const panel of this._panels.values()) panel.visible = false;
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

        this._panels.get('topbar')!.addEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);

        return true;
    }

    /** Laid out as the mock-ups: top bar across, the place and quests on the right, chat bottom left. */
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

        this.stretchTopbar(w - 2 * MARGIN);
        at('topbar', MARGIN, MARGIN);

        const top = hudTop(desktop);
        const player = desktop.findChildByName('hud_player');
        const playerRight = player ? MARGIN + player.width + GAP : MARGIN;
        const playerBottom = player ? top + player.height + GAP : top;

        const buffs = at('buffs', playerRight, top);

        at('party', MARGIN, playerBottom);

        const location = at('location', w - width('location') - MARGIN, top);

        at('quests', w - width('quests') - MARGIN, below(location, top));

        // Centred, unless that would cover the player's effects.
        const boss = at('boss', Math.max((w - width('boss')) / 2, buffs.visible ? buffs.x + buffs.width + GAP : 0), top);

        at('alert', boss.x + (boss.width - width('alert')) / 2, below(boss, top));

        // The chat bottom left, the target bottom right; the action bar goes between them (HudView).
        at('target', w - width('target') - MARGIN, h - height('target') - MARGIN);
        at('chat', MARGIN, h - height('chat') - MARGIN);

        this._onPlaced();
    }

    /**
     * The top bar spans the desktop. Its layout is 1260 wide with nothing anchored, so the bar is
     * widened here and its right-hand group (the currencies and the chat button) moved along with
     * its right edge; never narrower than the layout.
     */
    private stretchTopbar(width: number): void
    {
        const root = this._panels.get('topbar')!;
        const bar = root.findChildByName('topbar') as IWindowContainer | null;

        if(!bar) return;

        this._topbarRight ??= Array.from({length: bar.numChildren}, (_, i) => bar.getChildAt(i))
            .filter((child): child is IWindow => child !== null && child.x >= TOPBAR_RIGHT_GROUP);

        const delta = Math.max(width, TOPBAR_LAYOUT_WIDTH) - root.width;

        if(delta === 0) return;

        for(const child of this._topbarRight) child.x += delta;

        root.width += delta;
        bar.width += delta;
    }

    private render(value: Readonly<IHudPanels>): void
    {
        const panel = (name: Panel): IWindowContainer => this._panels.get(name)!;
        const show = (name: Panel, visible: boolean): boolean => (panel(name).visible = visible);

        show('topbar', true);
        this.renderTopbar(panel('topbar'), value);

        if(show('location', value.zoneName !== '' || value.zonePlayers !== null))
        {
            this._bits.setText(panel('location'), 'zone_name', value.zoneName);
            this._bits.setText(panel('location'), 'zone_players', value.zonePlayers === null ? '' : this._bits.text('vortex.hud.players_here', 'count', String(value.zonePlayers)));
        }

        if(show('quests', value.quests.length > 0 && !this._questsClosed)) this.renderQuests(panel('quests'), value);
        if(show('party', value.party.length > 0)) this.renderParty(panel('party'), value);
        if(show('buffs', value.buffs.length > 0)) this.fillIcons(panel('buffs'), 'buff_grid', value.buffs, 'buffs');
        if(show('boss', value.boss !== null)) this.renderUnit(panel('boss'), 'boss', value.boss!);
        if(show('alert', value.alert !== null)) this._bits.setText(panel('alert'), 'alert_txt', value.alert!);

        if(show('target', value.target !== null))
        {
            const target = value.target!;
            const window = panel('target');

            this.renderUnit(window, 'target', target);
            this._bits.setVisible(window, target.cast !== null, 'cast_title', 'cast_icon', 'cast_name', 'cast_bar');

            if(target.cast)
            {
                const {cast} = target;

                this.setIcon(window, 'cast_icon', cast.icon);
                this._bits.setText(window, 'cast_name', cast.name);
                this.setBar(window, 'cast_bar', cast.elapsed, cast.duration, `${cast.elapsed.toFixed(1)} / ${cast.duration.toFixed(1)} s`);
            }
        }

        show('chat', true);
        this.renderChat(panel('chat'), value.chat);

        // After the visibilities: the right column and the warning stack under what is shown.
        this.place();
    }

    private renderTopbar(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        this._bits.setVisible(window, value.questAlert, 'quest_badge');
        this._bits.setText(window, 'gold_amount', thousands(value.gold ?? 0));
        this._bits.setText(window, 'gem_amount', thousands(value.gems ?? 0));
        this._bits.setText(window, 'token_amount', thousands(value.tokens ?? 0));
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

        if(!list) return;

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
            if(!member.dead) this.fillIcons(frame, 'buff_list', member.buffs);
            list.addListItem(frame);
        }
    }

    /** The boss or the target: portrait, name, level line, HP with its percentage, effects. */
    private renderUnit(window: IWindowContainer, prefix: 'boss' | 'target', unit: IHudUnit): void
    {
        const percent = unit.hp !== null && unit.hpMax ? ` (${Math.round(100 * unit.hp / unit.hpMax)}%)` : '';

        this.setIcon(window, `${prefix}_portrait`, unit.portrait);
        this._bits.setText(window, `${prefix}_name`, unit.name);
        this._bits.setText(window, prefix === 'boss' ? 'boss_level' : 'target_info', prefix === 'boss' ? (unit.level === null ? '' : this._bits.text('vortex.ui.level.short', 'level', String(unit.level))) : unit.info);
        this.setBar(window, `${prefix}_hp_bar`, unit.hp, unit.hpMax, unit.hp === null || unit.hpMax === null ? '' : `${thousands(unit.hp)} / ${thousands(unit.hpMax)}${percent}`);
        this.fillIcons(window, 'debuff_list', unit.debuffs, `${prefix}.debuffs`);
    }

    private renderChat(window: IWindowContainer, lines: readonly IChatLine[]): void
    {
        const log = this.rebuild<IItemListWindow>(window, 'chat_log', lines);

        if(!log) return;

        for(const line of lines)
        {
            const row = this._windows.buildWidgetLayout('vortex_hud_chat_line_xml') as IWindowContainer | null;

            if(!row) return;

            const channel = CHANNELS[line.channel];

            this._bits.setText(row, 'time_txt', `[${line.time}] `);
            this._bits.setText(row, 'channel_txt', `[${this._bits.text(channel.key)}] `);
            this._bits.setTextColor(row, 'channel_txt', channel.color);
            this._bits.setText(row, 'author_txt', line.author === '' ? '' : `${line.author} : `);
            this._bits.setTextColor(row, 'author_txt', channel.color);
            this._bits.setText(row, 'message_txt', line.message);
            log.addListItem(row);
        }

        // The newest line at the bottom, in view.
        log.scrollV = 1;
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

    /** One vortex_hud_buff_xml per icon. A party member's list is rebuilt with its frame, so it has no key. */
    private fillIcons(window: IWindowContainer, name: string, icons: readonly string[], key?: string): void
    {
        const holder = key === undefined
            ? window.findChildByName(name) as IItemListWindow | IItemGridWindow | null
            : this.rebuild<IItemListWindow | IItemGridWindow>(window, name, icons, key);

        if(!holder) return;

        for(const icon of icons)
        {
            const box = this._windows.buildWidgetLayout('vortex_hud_buff_xml') as IWindowContainer | null;

            if(!box) return;

            this.setIcon(box, 'buff_icon', icon);

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

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WKE_KEY_DOWN' && window.name === 'chat_input' && (event as WindowKeyboardEvent).keyCode === ENTER)
        {
            const input = window as ITextFieldWindow;
            const text = input.text.trim();

            input.text = '';
            if(text !== '' && text !== this._bits.text('vortex.hud.chat.placeholder')) this._onChat(text);

            return;
        }

        if(event.type !== 'WME_CLICK') return;

        // The field opens with its placeholder as its text: the first click clears it.
        if(window.name === 'chat_input')
        {
            const input = window as ITextFieldWindow;

            if(input.text === this._bits.text('vortex.hud.chat.placeholder')) input.text = '';

            return;
        }

        if(WindowBits.ancestor(window, 'close_button') && WindowBits.ancestor(window, 'hud_target'))
        {
            this._state.update({target: null});

            return;
        }

        if(WindowBits.ancestor(window, 'close_button') && WindowBits.ancestor(window, 'hud_quest_tracker'))
        {
            this._questsClosed = true;
            this.render(this._state.value);

            return;
        }

        // The top bar's buttons and the panels' other buttons open windows that do not exist yet.
        log.debug(`HUD: ${window.name} has nothing to open yet`);
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.hide();
        this._panels.get('topbar')?.removeEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);

        for(const window of this._panels.values()) window.destroy();

        this._panels.clear();
        this._built.clear();
    }
}
