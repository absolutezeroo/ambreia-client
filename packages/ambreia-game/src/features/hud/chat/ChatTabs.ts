import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {ALL_TAB, CHAT_CHANNELS, type IChatTab} from '../../../ui/kit/chatModel';
import {TAB_ACTIVE, TAB_IDLE} from '../hudColors';
import type {HudPanelsState, IHudPanels} from '../HudPanelsState';

/** Where the + sits after each tab. */
const TAB_STEP = 88;

/** The chat's tab bar: « Général » and the tabs the player opened, closable unless locked. */
export class ChatTabs
{
    /** What the bar was last built from. */
    private _from: unknown[] = [];
    private readonly _buttons = new Map<IWindow, IChatTab>();

    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits, private readonly _state: HudPanelsState) {}

    render(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        const from = [value.chatTabs, value.chatTab, value.chatSettings.lockTabs];
        const bar = window.findChildByName('tab_bar') as IItemListWindow | null;

        if(!bar || from.every((item, i) => item === this._from[i])) return;

        this._from = from;
        bar.destroyListItems();
        this._buttons.clear();

        for(const tab of value.chatTabs)
        {
            const button = this._windows.buildWidgetLayout('vortex_hud_chat_tab_xml') as IWindowContainer | null;

            if(!button) break;

            button.color = tab.id === value.chatTab ? TAB_ACTIVE : TAB_IDLE;
            this._bits.setText(button, 'tab_label', this.label(tab));
            this._bits.setVisible(button, tab !== ALL_TAB && tab.id !== ALL_TAB.id && !value.chatSettings.lockTabs, 'tab_close');
            this._buttons.set(button, tab);
            bar.addListItem(button);
        }

        // The + right after the last tab, as the mock-ups draw it.
        const add = window.findChildByName('add_tab_button');

        if(add) add.x = bar.x + value.chatTabs.length * TAB_STEP;
    }

    /** The tab whose button holds `window`; null when it is not on a tab. */
    at(window: IWindow): IChatTab | null
    {
        const button = WindowBits.ancestor(window, 'chat_tab');

        return button ? this._buttons.get(button) ?? null : null;
    }

    select(tab: IChatTab): void
    {
        this._state.update({chatTab: tab.id});
    }

    /** Opens `tab` (once) and selects it. */
    open(tab: IChatTab): void
    {
        const tabs = this._state.value.chatTabs;

        this._state.update({chatTabs: tabs.some(open => open.id === tab.id) ? tabs : [...tabs, tab], chatTab: tab.id});
    }

    close(tab: IChatTab): void
    {
        if(tab.id === ALL_TAB.id || this._state.value.chatSettings.lockTabs) return;

        const value = this._state.value;

        this._state.update({chatTabs: value.chatTabs.filter(open => open.id !== tab.id), chatTab: value.chatTab === tab.id ? ALL_TAB.id : value.chatTab});
    }

    private label(tab: IChatTab): string
    {
        if(tab.whisperWith !== null) return tab.whisperWith;

        return this._bits.text(tab.channel === null ? CHAT_CHANNELS.world.key : CHAT_CHANNELS[tab.channel].key);
    }

    dispose(): void
    {
        this._buttons.clear();
    }
}
