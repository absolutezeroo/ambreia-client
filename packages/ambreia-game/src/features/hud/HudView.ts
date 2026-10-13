import {Logger} from '@ambreia/common/utils/Logger';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {WindowBits} from '../../ui/kit/WindowBits';
import {HudTooltips} from '../../ui/kit/HudTooltips';
import {ActionSlotsView} from './actionbar/ActionSlotsView';
import type {IHudActions} from './IHudActions';
import {LAYER, MARGIN} from './hudLayout';
import {PlayerFrameView} from './player/PlayerFrameView';
import type {IPlayerHud, PlayerHudState} from './PlayerHudState';

const log = Logger.getLogger('habbo.features.hud.HudView');

/** The bottom bar's menu buttons, in the layout's order. */
const NAV_BUTTONS = ['nav_menu', 'nav_inventory', 'nav_shop', 'nav_quests', 'nav_map', 'nav_guild'];

/**
 * The player frame (vortex_hud_player_xml) and the bottom bar (vortex_hud_action_bar_xml, mock-up
 * of 2026-10-10: the menu, the slots, the utilities), drawn from a PlayerHudState. The frame sits
 * top left, the bar bottom centre, both kept there when the desktop is resized. This one builds
 * and places them and answers the bar's buttons; the frame and the slots draw themselves
 * (player/PlayerFrameView, actionbar/ActionSlotsView).
 */
export class HudView
{
    private _player: IWindowContainer | null = null;
    private _bar: IWindowContainer | null = null;
    private readonly _tips: HudTooltips;
    private readonly _frame: PlayerFrameView;
    private readonly _slots: ActionSlotsView;
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
        this._frame = new PlayerFrameView(_bits, this._tips);
        this._slots = new ActionSlotsView(_windows, _bits, _state, this._tips);
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

        return {player: rect(this._player), bar: rect(this._bar), desktop: rect(desktop), parentName: desktop?.name ?? null, layers, slots: this._slots.count};
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
        this._slots.stop();
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

    /** Lays the frame and the bar out again: the panels around them moved or came and went. */
    relayout(): void
    {
        this.place();
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

        this._slots.build(this._bar);
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

    private render(value: Readonly<IPlayerHud>): void
    {
        if(!this._player) return;

        this._frame.render(this._player, value);
        this._slots.render(value);
    }

    private readonly _onPlayerEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(this._player) this._frame.onEvent(this._player, event, window);
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

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.hide();
        this._tips.dispose();
        this._slots.dispose();
        this._player?.removeEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);
        this._player?.destroy();
        this._bar?.destroy();
        this._player = this._bar = null;
    }
}
