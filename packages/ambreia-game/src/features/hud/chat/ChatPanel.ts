import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {CHAT_CHANNELS, whisperTab} from '../../../ui/kit/chatModel';
import type {HudMenu} from '../HudMenu';
import type {HudPanelsState, IHudPanels} from '../HudPanelsState';
import type {PopupSlot} from '../PopupSlot';
import {ChatChannelMenus} from './ChatChannelMenus';
import {ChatFade} from './ChatFade';
import {ChatInput} from './ChatInput';
import {ChatLogView} from './ChatLogView';
import {ChatSettingsPopup} from './ChatSettingsPopup';
import {ChatTabs} from './ChatTabs';
import {EmotePicker} from './EmotePicker';

/**
 * The HUD's chat window (vortex_hud_chat_xml, F3c §10.3, the user's mock-ups of 2026-10-09). Its
 * parts are its own classes: the tabs, the log of the open tab, the input, the channel menus, the
 * emoticons, the settings, the idle fade; this one hands them the renders and routes the window's
 * events. HudPanelsView builds the window.
 */
export class ChatPanel
{
    private _window: IWindowContainer | null = null;
    private readonly _fade: ChatFade;
    private readonly _tabs: ChatTabs;
    private readonly _log: ChatLogView;
    private readonly _input: ChatInput;
    private readonly _menus: ChatChannelMenus;
    private readonly _emotes: EmotePicker;
    private readonly _settings: ChatSettingsPopup;
    private _disposed = false;

    constructor(windows: IHabboWindowManager, private readonly _bits: WindowBits, state: HudPanelsState, private readonly _menu: HudMenu, popups: PopupSlot, layer: number, onSay: (text: string) => void)
    {
        const wake = (): void => this._fade.wake();

        this._fade = new ChatFade(() => state.value.chatSettings, () => this._window?.findChildByName('chat') ?? null);
        this._tabs = new ChatTabs(windows, _bits, state);
        this._log = new ChatLogView(windows, _bits, state, wake, name => this._tabs.open(whisperTab(name)));
        this._input = new ChatInput(() => this._window?.findChildByName('chat_input') as ITextFieldWindow | null, _bits, onSay, wake);
        this._menus = new ChatChannelMenus(_bits, state, tab => this._tabs.open(tab), () => this._input.startWhisper());
        this._emotes = new EmotePicker(windows, _bits, popups, layer, emote => state.events.emit('emote', emote), text => this._input.append(text));
        this._settings = new ChatSettingsPopup(windows, _bits, popups, layer, state, wake);
    }

    render(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        this._window = window;

        const frame = window.findChildByName('chat');

        if(frame) frame.blend = this._fade.blend(value.chatSettings.opacity);
        this._bits.setColor(window, 'chat_mode_button', CHAT_CHANNELS[value.sayChannel].color);
        this._tabs.render(window, value);
        this._log.render(window, value);
    }

    /** The chat window's events (HudPanelsView passes them on); true when the chat took it. */
    onEvent(event: WindowEvent, window: IWindow): boolean
    {
        if(!WindowBits.ancestor(window, 'hud_chat')) return false;
        if(this._input.onEvent(event, window)) return true;
        if(event.type !== 'WME_CLICK') return false;

        this._fade.wake();

        const tab = this._tabs.at(window);

        if(tab && WindowBits.ancestor(window, 'tab_close')) this._tabs.close(tab);
        else if(tab) this._tabs.select(tab);
        else if(WindowBits.ancestor(window, 'add_tab_button')) this._menu.toggle('tabs', window, this._menus.tabMenu(), false);
        else if(WindowBits.ancestor(window, 'chat_mode_button')) this._menu.toggle('say', window, this._menus.sayMenu(), true);
        else if(WindowBits.ancestor(window, 'emoji_button')) this._emotes.toggle(window);
        else if(WindowBits.ancestor(window, 'new_window_button')) this._settings.toggle(window);
        else return false;

        return true;
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._fade.dispose();
        this._tabs.dispose();
        this._log.dispose();
        this._window = null;
    }
}
