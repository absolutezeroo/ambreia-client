import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IDropMenuWindow} from '@ambreia/ui/components/IDropMenuWindow';
import type {ISelectableWindow} from '@ambreia/ui/components/ISelectableWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {browserStorage} from '../../../ui/kit/browserStorage';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {IDLE_MINUTES, saveChatSettings, type ChatTextSize, type IChatSettings} from '../../../ui/kit/chatModel';
import type {HudPanelsState} from '../HudPanelsState';
import {buildPopup} from '../placePopup';
import type {PopupSlot} from '../PopupSlot';

const OWNER = 'settings';
const TEXT_SIZE_ORDER: readonly ChatTextSize[] = ['small', 'normal', 'large'];

/** The chat's settings (vortex_hud_chat_settings_xml, the cog): kept in the HUD's state and the browser. */
export class ChatSettingsPopup
{
    private _panel: IWindowContainer | null = null;

    /** @param onIdleChanged - the idle fade's settings changed (its clock restarts) */
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _slot: PopupSlot,
        private readonly _layer: number,
        private readonly _state: HudPanelsState,
        private readonly _onIdleChanged: () => void
    ) {}

    toggle(anchor: IWindow): void
    {
        this._panel = null;
        if(this._slot.closeFor(OWNER)) return;

        const panel = buildPopup(this._windows, 'vortex_hud_chat_settings_xml', this._layer, anchor);

        if(!panel) return;

        const settings = this._state.value.chatSettings;
        const check = (name: string, on: boolean): void =>
        {
            const box = panel.findChildByName(name) as ISelectableWindow | null;

            if(on) box?.select();
            else box?.unselect();
        };

        check('set_time', settings.time);
        check('set_system', settings.system);
        check('set_colors', settings.colors);
        check('set_lock', settings.lockTabs);
        check('set_idle', settings.hideIdle);

        const sizes = panel.findChildByName('text_size_menu') as IDropMenuWindow | null;
        const idle = panel.findChildByName('idle_menu') as IDropMenuWindow | null;

        sizes?.populate(TEXT_SIZE_ORDER.map(size => this._bits.text(`vortex.chat.settings.size.${size}`)));
        if(sizes) sizes.selection = TEXT_SIZE_ORDER.indexOf(settings.textSize);
        idle?.populate(IDLE_MINUTES.map(minutes => this._bits.text('vortex.chat.settings.minutes', 'minutes', String(minutes))));
        if(idle) idle.selection = Math.max(0, IDLE_MINUTES.indexOf(settings.idleMinutes));
        this.renderOpacity(panel, settings.opacity);

        // After the boxes are set: setting them dispatches the events this listens to.
        panel.procedure = this._onEvent;
        this._slot.hold(OWNER, panel);
        this._panel = panel;
    }

    private renderOpacity(panel: IWindowContainer, opacity: number): void
    {
        const track = panel.findChildByName('opacity_track');
        const fill = panel.findChildByName('opacity_fill');

        this._bits.setText(panel, 'opacity_label', this._bits.text('vortex.chat.settings.opacity', 'percent', String(Math.round(opacity * 100))));
        if(track && fill) fill.width = Math.round(track.width * opacity);
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        const panel = this._panel;

        if(!panel) return;

        if(event.type === 'WME_CLICK' && WindowBits.ancestor(window, 'close_button'))
        {
            this._slot.close();
            this._panel = null;

            return;
        }

        if(event.type === 'WME_CLICK' && WindowBits.ancestor(window, 'opacity_track'))
        {
            const track = panel.findChildByName('opacity_track')!;
            // From 20 %: below, the chat would be lost on the room.
            const opacity = Math.min(1, Math.max(0.2, Math.round(((event as WindowMouseEvent).localX / track.width) * 10) / 10));

            this.save({opacity});
            this.renderOpacity(panel, opacity);

            return;
        }

        if(event.type !== 'WE_SELECTED' && event.type !== 'WE_UNSELECTED') return;

        const on = event.type === 'WE_SELECTED';

        switch(window.name)
        {
            case 'set_time': this.save({time: on}); break;
            case 'set_system': this.save({system: on}); break;
            case 'set_colors': this.save({colors: on}); break;
            case 'set_lock': this.save({lockTabs: on}); break;
            case 'set_idle': this.save({hideIdle: on}); this._onIdleChanged(); break;
            case 'text_size_menu': this.save({textSize: TEXT_SIZE_ORDER[(window as IDropMenuWindow).selection] ?? 'normal'}); break;
            case 'idle_menu': this.save({idleMinutes: IDLE_MINUTES[(window as IDropMenuWindow).selection] ?? 5}); this._onIdleChanged(); break;
        }
    };

    private save(change: Partial<IChatSettings>): void
    {
        const chatSettings = {...this._state.value.chatSettings, ...change};

        this._state.update({chatSettings});
        saveChatSettings(browserStorage(), chatSettings);
    }
}
