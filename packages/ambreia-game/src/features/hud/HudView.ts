import {Logger} from '@ambreia/common/utils/Logger';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IAvatarImageWidget} from '@ambreia/ui/kit/widgets/IAvatarImageWidget';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {WindowBits} from '../../ui/kit/WindowBits';
import {barFill, cooldownLabel} from './PlayerHudState';
import type {IActionSlot, IPlayerHud, PlayerHudState} from './PlayerHudState';
import {unavailable} from '../../ui/kit/hudRules';
import {HudTooltips, type ITooltip} from '../../ui/kit/HudTooltips';
import {LAYER, MARGIN} from './hudLayout';

const log = Logger.getLogger('habbo.features.hud.HudView');
/** How often a running cooldown's seconds are redrawn; nothing ticks when none runs. */
const COOLDOWN_TICK_MS = 250;

/** vortex_hud_player_xml's frame colour, and its colour in combat (M1a §6.3). */
const FRAME_COLOR = 0x686661;
const IN_COMBAT_COLOR = 0x8a3a30;
/**
 * The bottom bar's shortcut slots (mock-up of 2026-10-10): the first is the attack (M1d §2.3, key T),
 * the others show their keys until the server assigns them.
 */
const SHORTCUT_KEYS = ['T', 'E', 'R'];
/** The attack slot's icon. */
export const ATTACK_ICON = 'rpg/ui-icons/rpg_item_weapon_sword_attack_melee_slashing_damage_icon';
/** The bottom bar's menu buttons, in the layout's order. */
const NAV_BUTTONS = ['nav_menu', 'nav_inventory', 'nav_shop', 'nav_quests', 'nav_map', 'nav_guild'];
/** The player frame's bars and what their tooltips say (vortex_hud_tip_xml). */
const BAR_TIPS: Readonly<Record<string, {key: string; icon: string; color: number}>> = {
    hp_bar: {key: 'vortex.hud.tip.hp', icon: 'rpg/ui-icons/rpg_stat_hp_health_heart_icon', color: 0xe03a3a},
    mana_bar: {key: 'vortex.hud.tip.mana', icon: 'rpg/ui-icons/rpg_stat_mp_mana_star_icon', color: 0x3a7fe0},
    xp_bar: {key: 'vortex.hud.tip.xp', icon: 'rpg/ui-icons/boardgames_card_star_icon', color: 0x6cbb2d}
};

/** What the bottom bar's buttons do; the features owning the windows answer `nav`. */
export interface IHudActions
{
    nav(name: string): void;
    /** The « plus » button: its menu, above the button. */
    more(anchor: IWindow): void;
    screenshot(): void;
}

/**
 * The player frame (vortex_hud_player_xml: portrait, name, level, HP, mana, XP) and the bottom bar
 * (vortex_hud_action_bar_xml, mock-up of 2026-10-10: the menu, six skill and four item slots of
 * vortex_hud_action_slot_xml, the Q E R shortcuts, the utilities), drawn from a PlayerHudState.
 * The frame sits top left, the bar bottom centre, both kept there when the desktop is resized. A
 * slot shows its cooldown, greys when the player cannot afford it, and is outlined for a moment
 * after its key; the bars and the slots have tooltips.
 */
export class HudView
{
    private _player: IWindowContainer | null = null;
    private _bar: IWindowContainer | null = null;
    private readonly _slots: {skills: IWindowContainer[]; items: IWindowContainer[]} = {skills: [], items: []};
    /** The first shortcut slot: the auto-attack. */
    private _attackSlot: IWindowContainer | null = null;
    private readonly _tips: HudTooltips;
    private _ticker: ReturnType<typeof setInterval> | null = null;
    private _disposed = false;

    private readonly _onChange = (value: Readonly<IPlayerHud>): void => this.render(value);
    private readonly _onResize = (): void => this.place();

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _state: PlayerHudState,
        private readonly _bits: WindowBits,
        private readonly _actions: IHudActions
    )
    {
        this._tips = new HudTooltips(_windows, LAYER);
    }

    get visible(): boolean
    {
        return this._player?.visible ?? false;
    }

    /** Where the HUD windows are, for the dev hook: built, visible, rectangles, desktop size. */
    describe(): Record<string, unknown>
    {
        const rect = (window: IWindow | null): unknown => window && {x: window.x, y: window.y, width: window.width, height: window.height, visible: window.visible};
        const desktop = (this._player?.parent ?? null) as IWindow | null;

        const layers = [0, 1, 2, 3].map(layer => ({layer, rect: rect(this._windows.getDesktop(layer)), isParent: this._windows.getDesktop(layer) === desktop}));

        return {player: rect(this._player), bar: rect(this._bar), desktop: rect(desktop), parentName: desktop?.name ?? null, layers, slots: this._slots.skills.length + this._slots.items.length};
    }

    show(): void
    {
        if(this._disposed || !this.build()) return;

        this._player!.visible = true;
        this._bar!.visible = true;
        this._state.events.on('changed', this._onChange);
        this.place();
        this.render(this._state.value);
    }

    hide(): void
    {
        this._state.events.off('changed', this._onChange);
        this.stopTicker();
        this._tips.out();

        if(this._player) this._player.visible = false;
        if(this._bar) this._bar.visible = false;
    }

    /** The menu button whose window is open gets the mark under it; the quests one its « ! ». */
    setNav(open: string | null, questAlert: boolean): void
    {
        for(const name of NAV_BUTTONS)
        {
            const button = this._bar?.findChildByName(name) as IWindowContainer | null;

            if(button) this._bits.setVisible(button, name === open, 'active_bar');
        }

        if(this._bar) this._bits.setVisible(this._bar, questAlert, 'quest_badge');
    }

    /** Builds both windows once; false (said once) when a layout is missing. */
    private build(): boolean
    {
        if(this._player && this._bar) return true;

        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        this._player = this._windows.buildWidgetLayout('vortex_hud_player_xml', LAYER) as IWindowContainer | null;
        this._bar = this._windows.buildWidgetLayout('vortex_hud_action_bar_xml', LAYER) as IWindowContainer | null;

        if(!this._player || !this._bar || !desktop)
        {
            log.warn('the HUD layouts (vortex_hud_player_xml, vortex_hud_action_bar_xml) did not build — no HUD');
            this._player?.destroy();
            this._bar?.destroy();
            this._player = this._bar = null;

            return false;
        }

        for(const bar of ['skills', 'items'] as const)
        {
            const list = this._bar.findChildByName(bar === 'skills' ? 'skill_slots' : 'item_slots') as IItemListWindow | null;

            for(let i = 0; i < this._state.value[bar].length; i++)
            {
                const slot = this._windows.buildWidgetLayout('vortex_hud_action_slot_xml') as IWindowContainer | null;

                if(!slot || !list) continue;

                // A click on the slot uses it, as its key does (features/skills); a hover describes it.
                slot.procedure = (event: WindowEvent) =>
                {
                    if(this._tips.handle(event, () => this.slotTip(this._state.value[bar][i] ?? null))) return;
                    if(event.type === 'WME_CLICK') this._state.events.emit('use', bar, i);
                };
                list.addListItem(slot);
                this._slots[bar].push(slot);
            }
        }

        // The shortcut side: three slots with their keys, nothing to assign to them yet.
        const shortcuts = this._bar.findChildByName('shortcut_slots') as IItemListWindow | null;

        for(const key of SHORTCUT_KEYS)
        {
            const slot = this._windows.buildWidgetLayout('vortex_hud_action_slot_xml') as IWindowContainer | null;

            if(!slot || !shortcuts) break;

            this.renderSlot(slot, {icon: null, key});
            shortcuts.addListItem(slot);

            if(this._attackSlot === null)
            {
                this._attackSlot = slot;
                slot.procedure = (event: WindowEvent) =>
                {
                    if(event.type === 'WME_CLICK') this._state.events.emit('attack');
                };
            }
        }

        this._bar.procedure = this._onBarEvent;
        this._player.procedure = this._onPlayerEvent;

        // buildFromXML() hands the windows back unattached, as AS3's did: the caller places them.
        desktop.addChild(this._player);
        desktop.addChild(this._bar);
        this._player.addEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);

        return true;
    }

    /** Frame top left; the bar centred at the bottom (the chat and the target sit above it, HudPanelsView). */
    private place(): void
    {
        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        if(!desktop || !this._player || !this._bar) return;

        this._player.x = MARGIN;
        this._player.y = MARGIN;
        this._bar.x = Math.max(0, Math.round((desktop.width - this._bar.width) / 2));
        this._bar.y = desktop.height - this._bar.height - MARGIN;
    }

    /** Lays the frame and the bar out again: the panels around them moved or came and went. */
    relayout(): void
    {
        this.place();
    }

    private render(value: Readonly<IPlayerHud>): void
    {
        const player = this._player;

        if(!player) return;

        const frame = player.findChildByName('player_frame');
        const frameColor = value.inCombat ? IN_COMBAT_COLOR : FRAME_COLOR;

        if(frame && frame.color !== frameColor) frame.color = frameColor;
        this.setText(player, 'player_name', value.name);
        this.setText(player, 'level_txt', value.level === null ? '' : String(value.level));
        this.setBar(player, 'hp_bar', value.hp, value.hpMax);
        this.setBar(player, 'mana_bar', value.mana, value.manaMax);
        this.setBar(player, 'xp_bar', value.xp, value.xpMax, value.xpLabel ?? null);

        const head = ((player.findChildByName('head_image') as IWidgetWindow | null)?.widget ?? null) as IAvatarImageWidget | null;

        if(head && value.figure && head.figure !== value.figure) head.figure = value.figure;

        for(const bar of ['skills', 'items'] as const)
        {
            value[bar].forEach((slot, i) => this.renderSlot(this._slots[bar][i] ?? null, slot, value.mana));
        }

        this.renderAttack(value.attack ?? 'disabled');
        this.syncTicker(value);
    }

    private renderSlot(window: IWindowContainer | null, slot: IActionSlot, mana: number | null = null): void
    {
        if(!window) return;

        const icon = window.findChildByName('slot_icon') as IStaticBitmapWrapperWindow | null;

        if(icon)
        {
            icon.visible = slot.icon !== null;
            if(slot.icon !== null && icon.assetUri !== slot.icon) icon.assetUri = slot.icon;
        }

        this.setText(window, 'slot_key', slot.key);

        const count = window.findChildByName('slot_count');

        if(count)
        {
            count.visible = (slot.count ?? 0) > 1;
            count.caption = String(slot.count ?? '');
        }

        this._bits.setVisible(window, slot.icon !== null && unavailable(slot.cost ?? null, mana), 'unavailable_veil');
        this._bits.setVisible(window, slot.selected === true, 'selected');
        this.renderCooldown(window, slot, Date.now());
    }

    /** The attack slot: its sword and key always, outlined while attacking, veiled without a monster target. */
    private renderAttack(state: 'idle' | 'active' | 'disabled'): void
    {
        const slot = this._attackSlot;

        if(!slot) return;

        this.renderSlot(slot, {icon: ATTACK_ICON, key: SHORTCUT_KEYS[0], selected: state === 'active'});
        this._bits.setVisible(slot, state === 'disabled', 'unavailable_veil');
    }

    private renderCooldown(window: IWindowContainer, slot: IActionSlot, now: number): void
    {
        const label = cooldownLabel(slot, now);
        const veil = window.findChildByName('cooldown_veil');
        const text = window.findChildByName('cooldown_txt');

        if(veil) veil.visible = label !== null;
        if(text)
        {
            text.visible = label !== null;
            text.caption = label ?? '';
        }
    }

    /** A cooldown counts down every COOLDOWN_TICK_MS while one runs, and stops ticking after. */
    private syncTicker(value: Readonly<IPlayerHud>): void
    {
        const now = Date.now();
        const running = [...value.skills, ...value.items].some(slot => (slot.cooldownEnd ?? 0) > now);

        if(running && this._ticker === null)
        {
            this._ticker = setInterval(() =>
            {
                const current = this._state.value;
                const at = Date.now();

                for(const bar of ['skills', 'items'] as const) current[bar].forEach((slot, i) => this._slots[bar][i] && this.renderCooldown(this._slots[bar][i], slot, at));

                if(![...current.skills, ...current.items].some(slot => (slot.cooldownEnd ?? 0) > at)) this.stopTicker();
            }, COOLDOWN_TICK_MS);
        }
        else if(!running)
        {
            this.stopTicker();
        }
    }

    private stopTicker(): void
    {
        if(this._ticker !== null) clearInterval(this._ticker);
        this._ticker = null;
    }

    /** A slot's tooltip (vortex_hud_slot_tip_xml), from what the feature filling the bar said of it. */
    private slotTip(slot: IActionSlot | null): ITooltip | null
    {
        const tip = slot?.tip;

        if(!tip || slot.icon === null) return null;

        return {layout: 'vortex_hud_slot_tip_xml', fill: window =>
        {
            const icon = window.findChildByName('tip_icon') as IStaticBitmapWrapperWindow | null;

            if(icon && slot.icon) icon.assetUri = slot.icon;
            this._bits.setText(window, 'tip_title', tip.title);
            this._bits.setText(window, 'tip_tag_txt', tip.tag);
            this._bits.setVisible(window, tip.tag !== '', 'tip_tag');
            this._bits.setText(window, 'tip_meta', tip.meta);
            this._bits.setText(window, 'tip_txt', tip.text);
            this._bits.setText(window, 'tip_effect', tip.effect);
            this._bits.setText(window, 'tip_shortcut', tip.shortcut);
        }};
    }

    /** A bar's tooltip (vortex_hud_tip_xml): what HP, mana or XP are. */
    private barTip(name: string): ITooltip | null
    {
        const tip = BAR_TIPS[name];

        if(!tip) return null;

        return {layout: 'vortex_hud_tip_xml', fill: window =>
        {
            const icon = window.findChildByName('tip_icon') as IStaticBitmapWrapperWindow | null;

            if(icon) icon.assetUri = tip.icon;
            this._bits.setColor(window, 'tip_icon', tip.color);
            this._bits.setText(window, 'tip_title', this._bits.text(tip.key));
            this._bits.setText(window, 'tip_txt', this._bits.text(`${tip.key}.desc`));
        }};
    }

    private readonly _onPlayerEvent = (event: WindowEvent, window: IWindow): void =>
    {
        const bar = Object.keys(BAR_TIPS).find(name => HudTooltips.under(window, this._player!, name) !== null) ?? null;

        this._tips.handle(event, () => (bar === null ? null : this.barTip(bar)));
    };

    /** The bar's menu and utility buttons (the slots have their own procedures). */
    private readonly _onBarEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK' || !this._bar) return;

        const nav = NAV_BUTTONS.find(name => HudTooltips.under(window, this._bar!, name) !== null);

        if(nav)
        {
            this._actions.nav(nav);

            return;
        }

        const more = HudTooltips.under(window, this._bar, 'more_button');

        if(more) this._actions.more(more);
        else if(HudTooltips.under(window, this._bar, 'screenshot_button')) this._actions.screenshot();
        else if(HudTooltips.under(window, this._bar, 'social_button')) this._actions.nav('nav_social');
    };

    private setText(container: IWindowContainer, name: string, text: string): void
    {
        const window = container.findChildByName(name);

        if(window && window.caption !== text) window.caption = text;
    }

    /** `<name>` holds `bg`, `fill` and `value`: the fill's width follows value / max. */
    private setBar(container: IWindowContainer, name: string, value: number | null, max: number | null, label: string | null = null): void
    {
        const bar = container.findChildByName(name) as IWindowContainer | null;
        const background = bar?.findChildByName('bg');
        const fill = bar?.findChildByName('fill');

        if(!bar || !background || !fill) return;

        const width = barFill(value, max, background.width);

        fill.visible = width > 0;
        if(width > 0) fill.width = width;
        this.setText(bar, 'value', label ?? (value === null || max === null ? '' : `${value} / ${max}`));
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.hide();
        this._tips.dispose();
        this._player?.removeEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);
        this._player?.destroy();
        this._bar?.destroy();
        this._player = this._bar = null;
        this._slots.skills = [];
        this._slots.items = [];
    }
}
