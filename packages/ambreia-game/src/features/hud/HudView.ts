import {Logger} from '@ambreia/common/utils/Logger';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IAvatarImageWidget} from '@ambreia/ui/kit/widgets/IAvatarImageWidget';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {barFill, cooldownLabel} from './PlayerHudState';
import type {IActionSlot, IPlayerHud, PlayerHudState} from './PlayerHudState';
import {hudTop, LAYER, MARGIN} from './HudPanelsView';

const log = Logger.getLogger('habbo.features.hud.HudView');
/** How often a running cooldown's seconds are redrawn; nothing ticks when none runs. */
const COOLDOWN_TICK_MS = 250;

/** vortex_hud_player_xml's frame colour, and its colour in combat (M1a §6.3). */
const FRAME_COLOR = 0x686661;
const IN_COMBAT_COLOR = 0x8a3a30;

/**
 * The player frame (vortex_hud_player_xml: portrait, name, level, HP, mana, XP) and the action bar
 * (vortex_hud_action_bar_xml, four skill and four item slots of vortex_hud_action_slot_xml), drawn
 * from a PlayerHudState. The frame sits top left, the bar bottom centre, both kept there when the
 * desktop is resized.
 */
export class HudView
{
    private _player: IWindowContainer | null = null;
    private _bar: IWindowContainer | null = null;
    private readonly _slots: {skills: IWindowContainer[]; items: IWindowContainer[]} = {skills: [], items: []};
    private _ticker: ReturnType<typeof setInterval> | null = null;
    private _disposed = false;

    private readonly _onChange = (value: Readonly<IPlayerHud>): void => this.render(value);
    private readonly _onResize = (): void => this.place();

    constructor(private readonly _windows: IHabboWindowManager, private readonly _state: PlayerHudState) {}

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

        if(this._player) this._player.visible = false;
        if(this._bar) this._bar.visible = false;
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

                list.addListItem(slot);
                this._slots[bar].push(slot);
            }
        }

        // buildFromXML() hands the windows back unattached, as AS3's did: the caller places them.
        desktop.addChild(this._player);
        desktop.addChild(this._bar);
        this._player.addEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);

        return true;
    }

    /**
     * Frame top left (under the top bar while it shows); bar at the bottom, centred in the room the
     * chat (bottom left) and the target (bottom right) leave it, and over the target only when the
     * desktop is too narrow for the three. Both panels are found by name on the desktop
     * (HudPanelsView builds them and calls relayout() when they move).
     */
    private place(): void
    {
        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        if(!desktop || !this._player || !this._bar) return;

        const chat = desktop.findChildByName('hud_chat');
        const target = desktop.findChildByName('hud_target');
        const left = chat?.visible ? chat.x + chat.width + MARGIN : 0;
        const right = target?.visible ? target.x - MARGIN : desktop.width;

        this._player.x = MARGIN;
        this._player.y = hudTop(desktop);
        this._bar.x = Math.max(left, Math.round(Math.min((desktop.width - this._bar.width) / 2, (left + right - this._bar.width) / 2)));
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
            value[bar].forEach((slot, i) => this.renderSlot(this._slots[bar][i] ?? null, slot));
        }

        this.syncTicker(value);
    }

    private renderSlot(window: IWindowContainer | null, slot: IActionSlot): void
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

        this.renderCooldown(window, slot, Date.now());
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
        this._player?.removeEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);
        this._player?.destroy();
        this._bar?.destroy();
        this._player = this._bar = null;
        this._slots.skills = [];
        this._slots.items = [];
    }
}
