import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowKeyboardEvent} from '@ambreia/ui/events/WindowKeyboardEvent';
import type {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {ISelectableWindow} from '@ambreia/ui/components/ISelectableWindow';
import type {IDropMenuWindow} from '@ambreia/ui/components/IDropMenuWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {WindowBits} from '../character/WindowBits';
import type {HudPanelsState, IHudPanels} from './HudPanelsState';
import {
    ALL_TAB, CHAT_CHANNELS, chatLinesOf, channelTab, EMOTICONS, IDLE_MINUTES, PLAIN_COLOR, RP_ACTIONS, saveChatSettings, splitEmoticons, TEXT_SIZES, whisperTab,
    type ChatChannel, type ChatTextSize, type IChatLine, type IChatSettings, type IChatTab
} from './chatModel';

const ENTER = 13;
/** The HUD's layer (HudPanelsView.LAYER). */
const LAYER = 1;
const TAB_ACTIVE = 0x2a6aa0;
const TAB_IDLE = 0x55534e;
/** `[item:item.weapon.rusted_sword]` in a chat line (F3c §10.3). */
const ITEM_LINK = /\[item:([^\]]+)\]/g;
/** The texts of vortex_hud_chat_line_xml, resized with the text size setting. */
const LINE_TEXTS = ['time_txt', 'channel_txt', 'author_txt', 'message_txt'];
/** How faint the chat gets when it hides for being idle: still there to find it again. */
const IDLE_BLEND = 0.15;
const TEXT_SIZE_ORDER: readonly ChatTextSize[] = ['small', 'normal', 'large'];

/** An entry of the chat's menus: a disabled one is greyed (« bientôt »). */
interface IMenuItem
{
    label: string;
    icon: string | null;
    /** The tint of its icon. */
    color: number;
    checked: boolean;
    enabled: boolean;
    pick: () => void;
}

/**
 * The HUD's chat window (vortex_hud_chat_xml, F3c §10.3, the user's mock-ups of 2026-10-09): the
 * tabs (« Général » and those the + menu adds, closable unless locked), the log of the open tab, the
 * input, and around it the channel menu (bubble), the tab menu (+), the emoticons (smiley) and the
 * settings (cog). HudPanelsView builds the window and hands its renders and events here.
 */
export class ChatPanel
{
    private _window: IWindowContainer | null = null;
    /** What the tab bar and the log were last built from. */
    private _tabsFrom: unknown[] = [];
    private _logFrom: unknown[] = [];
    private readonly _tabs = new Map<IWindow, IChatTab>();
    private readonly _rows = new Map<IWindow, IChatLine>();
    private _menu: IWindowContainer | null = null;
    private _menuOwner = '';
    private _menuItems: IMenuItem[] = [];
    private _emotes: IWindowContainer | null = null;
    private _settings: IWindowContainer | null = null;
    private _idle = false;
    private _idleTimer: ReturnType<typeof setTimeout> | null = null;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _state: HudPanelsState,
        private readonly _onSay: (text: string) => void
    ) {}

    render(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        this._window = window;

        const settings = value.chatSettings;
        const frame = window.findChildByName('chat');

        if(frame) frame.blend = this._idle ? IDLE_BLEND : settings.opacity;
        this._bits.setColor(window, 'chat_mode_button', CHAT_CHANNELS[value.sayChannel].color);
        this.renderTabs(window, value);
        this.renderLog(window, value);
    }

    private renderTabs(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        const from = [value.chatTabs, value.chatTab, value.chatSettings.lockTabs];
        const bar = window.findChildByName('tab_bar') as IItemListWindow | null;

        if(!bar || from.every((item, i) => item === this._tabsFrom[i])) return;

        this._tabsFrom = from;
        bar.destroyListItems();
        this._tabs.clear();

        for(const tab of value.chatTabs)
        {
            const button = this._windows.buildWidgetLayout('vortex_hud_chat_tab_xml') as IWindowContainer | null;

            if(!button) break;

            button.color = tab.id === value.chatTab ? TAB_ACTIVE : TAB_IDLE;
            this._bits.setText(button, 'tab_label', this.tabLabel(tab));
            this._bits.setVisible(button, tab !== ALL_TAB && tab.id !== ALL_TAB.id && !value.chatSettings.lockTabs, 'tab_close');
            this._tabs.set(button, tab);
            bar.addListItem(button);
        }

        // The + right after the last tab, as the mock-ups draw it.
        const add = window.findChildByName('add_tab_button');

        if(add) add.x = bar.x + value.chatTabs.length * 88;
    }

    private renderLog(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        const settings = value.chatSettings;
        const tab = this._state.openTab;
        const from = [value.chat, tab, settings];
        const log = window.findChildByName('chat_log') as IItemListWindow | null;

        if(!log || from.every((item, i) => item === this._logFrom[i])) return;

        // A new line wakes an idle chat up.
        if(value.chat !== this._logFrom[0] && this._logFrom.length > 0) this.wake();

        this._logFrom = from;
        log.destroyListItems();
        this._rows.clear();

        for(const line of chatLinesOf(value.chat, tab, settings))
        {
            const row = this._windows.buildWidgetLayout('vortex_hud_chat_line_xml') as IWindowContainer | null;

            if(!row) return;

            const channel = CHAT_CHANNELS[line.channel];
            const color = settings.colors ? channel.color : PLAIN_COLOR;
            const message = line.message.replace(ITEM_LINK, (_link, id: string) => `[${this._bits.contentName(`${id}.name`, id)}]`);

            this._bits.setText(row, 'time_txt', settings.time ? `[${line.time}] ` : '');
            this._bits.setText(row, 'channel_txt', `[${this._bits.text(channel.key)}] `);
            this._bits.setTextColor(row, 'channel_txt', color);
            this._bits.setText(row, 'author_txt', line.author === '' ? '' : `${line.author} : `);
            this._bits.setTextColor(row, 'author_txt', color);
            const texts = LINE_TEXTS.map(name => row.findChildByName(name) as ITextWindow | null);

            this.fillMessage(row, message, texts);

            for(const text of texts) if(text && text.fontSize !== TEXT_SIZES[settings.textSize]) text.fontSize = TEXT_SIZES[settings.textSize];

            // A scrollable list answers its items' events itself: the row carries the panel's.
            row.procedure = this._onRowEvent;
            this._rows.set(row, line);
            log.addListItem(row);
        }

        // The newest line at the bottom, in view.
        log.scrollV = 1;
    }

    /**
     * The message into message_txt, then, at each emoticon of the palette, its icon and a new text
     * piece after it in the row (an itemlist): the pixel font has no emoji. Adds the pieces to `texts`.
     */
    private fillMessage(row: IWindowContainer, message: string, texts: Array<ITextWindow | null>): void
    {
        let first = true;

        for(const piece of splitEmoticons(message))
        {
            if('text' in piece && first)
            {
                this._bits.setText(row, 'message_txt', piece.text);
            }
            else if('text' in piece)
            {
                const text = this._windows.buildWidgetLayout('vortex_hud_chat_piece_xml') as ITextWindow | null;

                if(!text) break;

                text.caption = piece.text;
                texts.push(text);
                (row as unknown as IItemListWindow).addListItem(text);
            }
            else
            {
                const icon = this._windows.buildWidgetLayout('vortex_hud_chat_inline_emoji_xml') as IStaticBitmapWrapperWindow | null;

                if(!icon) break;

                icon.assetUri = piece.icon;
                (row as unknown as IItemListWindow).addListItem(icon);
            }

            first = false;
        }
    }

    private tabLabel(tab: IChatTab): string
    {
        if(tab.whisperWith !== null) return tab.whisperWith;

        return this._bits.text(tab.channel === null ? CHAT_CHANNELS.world.key : CHAT_CHANNELS[tab.channel].key);
    }

    /** The chat window's events (HudPanelsView passes them on); true when the chat took it. */
    onEvent(event: WindowEvent, window: IWindow): boolean
    {
        if(!WindowBits.ancestor(window, 'hud_chat')) return false;

        if(event.type === 'WKE_KEY_DOWN' && window.name === 'chat_input' && (event as WindowKeyboardEvent).keyCode === ENTER)
        {
            const input = window as ITextFieldWindow;
            const text = input.text.trim();

            input.text = '';
            if(text !== '' && text !== this._bits.text('vortex.hud.chat.placeholder')) this._onSay(text);
            this.wake();

            return true;
        }

        // The field opens with its placeholder as its text: taking the keyboard clears it. On focus as
        // well as on click: a field focused another way kept the placeholder, and it went out in front
        // of the message.
        if((event.type === 'WE_FOCUSED' || event.type === 'WME_CLICK') && window.name === 'chat_input')
        {
            this.clearPlaceholder();
            this.wake();

            return true;
        }

        if(event.type !== 'WME_CLICK') return false;

        this.wake();

        const tabButton = WindowBits.ancestor(window, 'chat_tab');
        const tab = tabButton ? this._tabs.get(tabButton) ?? null : null;

        if(tab && WindowBits.ancestor(window, 'tab_close')) this.closeTab(tab);
        else if(tab) this._state.update({chatTab: tab.id});
        else if(WindowBits.ancestor(window, 'add_tab_button')) this.toggleMenu('tabs', window, this.tabMenu(), false);
        else if(WindowBits.ancestor(window, 'chat_mode_button')) this.toggleMenu('say', window, this.sayMenu(), true);
        else if(WindowBits.ancestor(window, 'emoji_button')) this.toggleEmotes(window);
        else if(WindowBits.ancestor(window, 'new_window_button')) this.toggleSettings(window);
        else return false;

        return true;
    }

    /** A name in the log (author_txt takes the mouse: params 17) opens a whisper tab with that player. */
    private readonly _onRowEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK' || window.name !== 'author_txt') return;

        const row = WindowBits.ancestor(window, 'chat_line');
        const line = row ? this._rows.get(row) ?? null : null;

        // For a whisper, the other one of the conversation, whoever wrote the line.
        if(line && line.author !== '') this.openTab(whisperTab(line.channel === 'whisper' && line.target ? line.target : line.author));
    };

    private openTab(tab: IChatTab): void
    {
        const tabs = this._state.value.chatTabs;

        this._state.update({chatTabs: tabs.some(open => open.id === tab.id) ? tabs : [...tabs, tab], chatTab: tab.id});
    }

    private closeTab(tab: IChatTab): void
    {
        if(tab.id === ALL_TAB.id || this._state.value.chatSettings.lockTabs) return;

        const value = this._state.value;

        this._state.update({chatTabs: value.chatTabs.filter(open => open.id !== tab.id), chatTab: value.chatTab === tab.id ? ALL_TAB.id : value.chatTab});
    }

    private channelItem(channel: ChatChannel, checked: boolean, pick: () => void): IMenuItem
    {
        const def = CHAT_CHANNELS[channel];
        const label = this._bits.text(def.key);

        return {label: def.live ? label : `${label} (${this._bits.text('vortex.chat.soon')})`, icon: def.icon, color: def.color, checked, enabled: def.live, pick};
    }

    /** The + menu: a tab per channel, and a whisper (the input gets `/w `). */
    private tabMenu(): IMenuItem[]
    {
        const channels: ChatChannel[] = ['general', 'group', 'guild', 'trade'];

        return [
            ...channels.map(channel => this.channelItem(channel, false, () => this.openTab(channelTab(channel)))),
            {label: this._bits.text('vortex.chat.private_messages'), icon: CHAT_CHANNELS.whisper.icon, color: CHAT_CHANNELS.whisper.color, checked: false, enabled: true, pick: () => this.startWhisper()},
            this.channelItem('recruitment', false, () => this.openTab(channelTab('recruitment')))
        ];
    }

    /** The bubble menu: where « Général » writes. */
    private sayMenu(): IMenuItem[]
    {
        const say = this._state.value.sayChannel;
        const channels: ChatChannel[] = ['world', 'general', 'group', 'guild', 'trade'];

        return [
            ...channels.map(channel => this.channelItem(channel, channel === say, () => this._state.update({sayChannel: channel}))),
            {label: this._bits.text('vortex.chat.private_message'), icon: CHAT_CHANNELS.whisper.icon, color: CHAT_CHANNELS.whisper.color, checked: false, enabled: true, pick: () => this.startWhisper()}
        ];
    }

    private startWhisper(): void
    {
        const input = this._window?.findChildByName('chat_input') as ITextFieldWindow | null;

        if(!input) return;

        input.text = '/w ';
        (input as unknown as {focus?: () => boolean}).focus?.();
    }

    private clearPlaceholder(): ITextFieldWindow | null
    {
        const input = this._window?.findChildByName('chat_input') as ITextFieldWindow | null;

        if(input && input.text === this._bits.text('vortex.hud.chat.placeholder')) input.text = '';

        return input;
    }

    private toggleMenu(owner: string, anchor: IWindow, items: IMenuItem[], light: boolean): void
    {
        const reopen = this._menuOwner !== owner;

        this.closePopups();
        if(!reopen) return;

        const menu = this._windows.buildWidgetLayout('vortex_hud_chat_menu_xml', LAYER) as IWindowContainer | null;
        const list = menu?.findChildByName('menu_list') as IItemListWindow | null;
        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        if(!menu || !list || !desktop) return;

        for(const item of items)
        {
            const row = this._windows.buildWidgetLayout('vortex_hud_chat_menu_row_xml') as IWindowContainer | null;

            if(!row) break;

            const icon = row.findChildByName('row_icon') as IStaticBitmapWrapperWindow | null;

            if(icon && item.icon) icon.assetUri = item.icon;
            // The icons are silhouettes the HUD tints: each in its channel's colour.
            this._bits.setColor(row, 'row_icon', item.color);
            this._bits.setVisible(row, item.icon !== null, 'row_icon');
            this._bits.setVisible(row, item.checked, 'row_check');
            this._bits.setText(row, 'row_label', item.label);
            this._bits.setTextColor(row, 'row_label', light ? 0x2a2824 : 0xffffff);
            row.color = item.checked ? (light ? 0xffb8d8f0 : TAB_ACTIVE) : (light ? 0xfff4efe0 : TAB_IDLE);
            if(!item.enabled) row.blend = 0.5;
            list.addListItem(row);
        }

        const height = items.length * 26 + 10;

        menu.height = height;
        this.setHeight(menu, 'menu_frame', height);
        list.height = height - 12;
        this._bits.setColor(menu, 'menu_frame', light ? 0xffe9e2cf : 0xff686661);
        this.placeAbove(menu, anchor, desktop);
        desktop.addChild(menu);
        menu.procedure = this._onMenuEvent;
        this._menu = menu;
        this._menuOwner = owner;
        this._menuItems = items;
    }

    private readonly _onMenuEvent = (event: WindowEvent, window: IWindow): void =>
    {
        const row = event.type === 'WME_CLICK' ? WindowBits.ancestor(window, 'menu_row') : null;
        const list = this._menu?.findChildByName('menu_list') as IItemListWindow | null;
        const index = row && list ? list.getListItemIndex(row) : -1;
        const item = this._menuItems[index];

        if(!item?.enabled) return;

        this.closePopups();
        item.pick();
    };

    private toggleEmotes(anchor: IWindow): void
    {
        const open = this._emotes !== null;

        this.closePopups();
        if(open) return;

        const panel = this.buildPanel('vortex_hud_chat_emotes_xml', anchor);

        if(!panel) return;

        const grid = panel.findChildByName('emote_grid') as IItemGridWindow | null;
        const actions = panel.findChildByName('action_grid') as IItemGridWindow | null;

        for(const emoticon of EMOTICONS)
        {
            const cell = this._windows.buildWidgetLayout('vortex_hud_chat_emote_xml') as IWindowContainer | null;
            const icon = cell?.findChildByName('emote_icon') as IStaticBitmapWrapperWindow | null;

            if(!cell || !grid) break;

            if(icon) icon.assetUri = emoticon.icon;
            cell.id = EMOTICONS.indexOf(emoticon);
            // A grid answers its items' events itself: the cell carries the panel's.
            cell.procedure = this._onEmotesEvent;
            grid.addGridItem(cell);
        }

        for(const action of RP_ACTIONS)
        {
            const cell = this._windows.buildWidgetLayout('vortex_hud_chat_action_xml') as IWindowContainer | null;
            const icon = cell?.findChildByName('action_icon') as IStaticBitmapWrapperWindow | null;

            if(!cell || !actions) break;

            if(icon) icon.assetUri = action.icon;
            this._bits.setText(cell, 'action_label', this._bits.text(action.key));
            cell.id = RP_ACTIONS.indexOf(action);
            cell.procedure = this._onEmotesEvent;
            actions.addGridItem(cell);
        }

        panel.procedure = this._onEmotesEvent;
        this._emotes = panel;
    }

    private readonly _onEmotesEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        if(WindowBits.ancestor(window, 'close_button'))
        {
            this.closePopups();

            return;
        }

        const action = WindowBits.ancestor(window, 'action_cell');

        if(action && RP_ACTIONS[action.id])
        {
            this._state.events.emit('emote', RP_ACTIONS[action.id].emote);

            return;
        }

        const cell = WindowBits.ancestor(window, 'emote_cell');
        const emoticon = cell ? EMOTICONS[cell.id] : undefined;
        const input = emoticon ? this.clearPlaceholder() : null;

        // The palette stays open: several at a time.
        if(emoticon && input) input.text = `${input.text}${emoticon.text}`;
    };

    private toggleSettings(anchor: IWindow): void
    {
        const open = this._settings !== null;

        this.closePopups();
        if(open) return;

        const panel = this.buildPanel('vortex_hud_chat_settings_xml', anchor);

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
        panel.procedure = this._onSettingsEvent;
        this._settings = panel;
    }

    private renderOpacity(panel: IWindowContainer, opacity: number): void
    {
        const track = panel.findChildByName('opacity_track');
        const fill = panel.findChildByName('opacity_fill');

        this._bits.setText(panel, 'opacity_label', this._bits.text('vortex.chat.settings.opacity', 'percent', String(Math.round(opacity * 100))));
        if(track && fill) fill.width = Math.round(track.width * opacity);
    }

    private readonly _onSettingsEvent = (event: WindowEvent, window: IWindow): void =>
    {
        const panel = this._settings;

        if(!panel) return;

        if(event.type === 'WME_CLICK' && WindowBits.ancestor(window, 'close_button'))
        {
            this.closePopups();

            return;
        }

        if(event.type === 'WME_CLICK' && WindowBits.ancestor(window, 'opacity_track'))
        {
            const track = panel.findChildByName('opacity_track')!;
            // From 20 %: below, the chat would be lost on the room.
            const opacity = Math.min(1, Math.max(0.2, Math.round(((event as WindowMouseEvent).localX / track.width) * 10) / 10));

            this.saveSettings({opacity});
            this.renderOpacity(panel, opacity);

            return;
        }

        if(event.type !== 'WE_SELECTED' && event.type !== 'WE_UNSELECTED') return;

        const on = event.type === 'WE_SELECTED';

        switch(window.name)
        {
            case 'set_time': this.saveSettings({time: on}); break;
            case 'set_system': this.saveSettings({system: on}); break;
            case 'set_colors': this.saveSettings({colors: on}); break;
            case 'set_lock': this.saveSettings({lockTabs: on}); break;
            case 'set_idle': this.saveSettings({hideIdle: on}); this.wake(); break;
            case 'text_size_menu': this.saveSettings({textSize: TEXT_SIZE_ORDER[(window as IDropMenuWindow).selection] ?? 'normal'}); break;
            case 'idle_menu': this.saveSettings({idleMinutes: IDLE_MINUTES[(window as IDropMenuWindow).selection] ?? 5}); this.wake(); break;
        }
    };

    private saveSettings(change: Partial<IChatSettings>): void
    {
        const chatSettings = {...this._state.value.chatSettings, ...change};

        this._state.update({chatSettings});
        saveChatSettings(ChatPanel.storage(), chatSettings);
    }

    /** A titled panel (emoticons, settings) above its button, right-aligned on it. */
    private buildPanel(layout: string, anchor: IWindow): IWindowContainer | null
    {
        const panel = this._windows.buildWidgetLayout(layout, LAYER) as IWindowContainer | null;
        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        if(!panel || !desktop)
        {
            panel?.destroy();

            return null;
        }

        this.placeAbove(panel, anchor, desktop, true);
        desktop.addChild(panel);

        return panel;
    }

    private placeAbove(popup: IWindow, anchor: IWindow, desktop: IWindow, alignRight = false): void
    {
        const rect = {x: 0, y: 0, width: 0, height: 0};

        anchor.getGlobalRectangle(rect);
        popup.x = Math.max(0, Math.min(desktop.width - popup.width, alignRight ? rect.x + rect.width - popup.width : rect.x));
        popup.y = Math.max(0, rect.y - popup.height - 4);
    }

    private setHeight(window: IWindowContainer, name: string, height: number): void
    {
        const child = window.findChildByName(name);

        if(child) child.height = height;
    }

    closePopups(): void
    {
        this._menu?.destroy();
        this._menu = null;
        this._menuOwner = '';
        this._menuItems = [];
        this._emotes?.destroy();
        this._emotes = null;
        this._settings?.destroy();
        this._settings = null;
    }

    /** Something happened in the chat: it comes back if it had faded, and its idle clock restarts. */
    private wake(): void
    {
        const settings = this._state.value.chatSettings;

        if(this._idleTimer !== null) clearTimeout(this._idleTimer);
        this._idleTimer = null;

        if(this._idle)
        {
            this._idle = false;
            this.refreshBlend();
        }

        if(!settings.hideIdle || this._disposed) return;

        this._idleTimer = setTimeout(() =>
        {
            this._idle = true;
            this.refreshBlend();
        }, settings.idleMinutes * 60_000);
    }

    private refreshBlend(): void
    {
        const frame = this._window?.findChildByName('chat');

        if(frame) frame.blend = this._idle ? IDLE_BLEND : this._state.value.chatSettings.opacity;
    }

    /** The browser's storage, or null where there is none or it refuses access. */
    static storage(): Storage | null
    {
        try
        {
            return globalThis.localStorage ?? null;
        }
        catch
        {
            return null;
        }
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        if(this._idleTimer !== null) clearTimeout(this._idleTimer);
        this.closePopups();
        this._tabs.clear();
        this._rows.clear();
        this._window = null;
    }
}
