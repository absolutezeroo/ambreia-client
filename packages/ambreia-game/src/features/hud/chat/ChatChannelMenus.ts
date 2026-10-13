import type {WindowBits} from '../../../ui/kit/WindowBits';
import {CHAT_CHANNELS, channelTab, type ChatChannel, type IChatTab} from '../../../ui/kit/chatModel';
import type {HudPanelsState} from '../HudPanelsState';
import type {IMenuItem} from '../IMenuItem';

/** The entries of the chat's two menus: the + (a tab per channel) and the bubble (where « Général » writes). */
export class ChatChannelMenus
{
    constructor(
        private readonly _bits: Pick<WindowBits, 'text'>,
        private readonly _state: HudPanelsState,
        private readonly _openTab: (tab: IChatTab) => void,
        private readonly _startWhisper: () => void
    ) {}

    /** The + menu: a tab per channel, and a whisper (the input gets `/w `). */
    tabMenu(): IMenuItem[]
    {
        const channels: ChatChannel[] = ['general', 'group', 'guild', 'trade'];

        return [
            ...channels.map(channel => this.channelItem(channel, false, () => this._openTab(channelTab(channel)))),
            this.whisperItem('vortex.chat.private_messages'),
            this.channelItem('recruitment', false, () => this._openTab(channelTab('recruitment')))
        ];
    }

    /** The bubble menu: where « Général » writes. */
    sayMenu(): IMenuItem[]
    {
        const say = this._state.value.sayChannel;
        const channels: ChatChannel[] = ['world', 'general', 'group', 'guild', 'trade'];

        return [
            ...channels.map(channel => this.channelItem(channel, channel === say, () => this._state.update({sayChannel: channel}))),
            this.whisperItem('vortex.chat.private_message')
        ];
    }

    private channelItem(channel: ChatChannel, checked: boolean, pick: () => void): IMenuItem
    {
        const def = CHAT_CHANNELS[channel];
        const label = this._bits.text(def.key);

        return {label: def.live ? label : `${label} (${this._bits.text('vortex.chat.soon')})`, icon: def.icon, color: def.color, checked, enabled: def.live, pick};
    }

    private whisperItem(key: string): IMenuItem
    {
        return {label: this._bits.text(key), icon: CHAT_CHANNELS.whisper.icon, color: CHAT_CHANNELS.whisper.color, checked: false, enabled: true, pick: () => this._startWhisper()};
    }
}
