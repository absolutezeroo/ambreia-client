import {EventEmitter} from 'eventemitter3';
import type {IHudPanels} from './IHud';
import type {IToast} from './IToast';
import {ALL_TAB, DEFAULT_CHAT_SETTINGS, type IChatLine, type IChatTab} from '../../ui/kit/chatModel';

export type {ChatChannel, IChatLine} from '../../ui/kit/chatModel';
export type {IQuestLine, IPartyMember, IHudCast, IHudUnit, IHudPanels} from './IHud';

/**
 * The HUD around the player frame and the action bar (RPG spec §16.3, mockup/glaze/hud_*.png):
 * top bar, place, quest tracker, party, effects, target and its cast, boss, warning, chat. Null
 * and empty are "nothing to show": each panel stays hidden until it has something. The server
 * sends none of it yet; `__ambreia.hud.demo()` fills it meanwhile.
 */
export const CHAT_HISTORY = 50;

export class HudPanelsState
{
    /**
     * `nav`: a top bar button was clicked (`nav_inventory`…), the feature that owns the window opens
     * it; `say`: the player typed a chat line (Enter), the chat feature sends it; `emote`: an RP
     * action of the palette (`wave`…), the chat feature asks for it; `toast`: a notice to show (ToastStack).
     */
    readonly events = new EventEmitter<{changed: [Readonly<IHudPanels>]; nav: [string]; say: [string]; emote: [string]; toast: [IToast]}>();
    private _value: IHudPanels = {
        gold: null, gems: null, tokens: null, questAlert: false, zoneName: '', zonePlayers: null,
        quests: [], party: [], buffs: [], partySelected: null, navOpen: null, target: null, targetOfTarget: null, boss: null, alert: null, chat: [], chatTabs: [ALL_TAB], chatTab: ALL_TAB.id, sayChannel: 'world', chatSettings: DEFAULT_CHAT_SETTINGS
    };

    get value(): Readonly<IHudPanels>
    {
        return this._value;
    }

    /** Arrays are replaced, never edited in place: the view rebuilds a list only when it changed. */
    update(values: Partial<IHudPanels>): void
    {
        this._value = {...this._value, ...values};
        this.events.emit('changed', this._value);
    }

    /** The open tab (« Général » when its id is gone). */
    get openTab(): IChatTab
    {
        return this._value.chatTabs.find(tab => tab.id === this._value.chatTab) ?? ALL_TAB;
    }

    /** A notice at the top of the screen, from any feature. */
    toast(toast: IToast): void
    {
        this.events.emit('toast', toast);
    }

    addChatLine(line: IChatLine): void
    {
        this.update({chat: [...this._value.chat, line].slice(-CHAT_HISTORY)});
    }
}
