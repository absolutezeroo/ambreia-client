import {EventEmitter} from 'eventemitter3';

/** A quest the tracker follows: its icon, name, current objective and progress (`2 / 5`). */
export interface IQuestLine
{
    icon: string | null;
    title: string;
    objective: string;
    count: string;
}

/** A party member's frame: portrait, level, HP and the effects on them. */
export interface IPartyMember
{
    name: string;
    figure: string;
    level: number | null;
    hp: number | null;
    hpMax: number | null;
    /** Icons of the effects on them. */
    buffs: string[];
    dead: boolean;
}

/** What is being cast: icon, name, and how far along (seconds). */
export interface IHudCast
{
    icon: string | null;
    name: string;
    elapsed: number;
    duration: number;
}

/** A monster or player shown as the target or as the boss. */
export interface IHudUnit
{
    name: string;
    /** Asset name of the portrait. */
    portrait: string | null;
    /** A player's figure: the frame shows its head instead of the portrait. */
    figure?: string | null;
    level: number | null;
    /** The line under the name (`Niv. 35 · Boss`). */
    info: string;
    hp: number | null;
    hpMax: number | null;
    /** Icons of the effects on it. */
    debuffs: string[];
}

export type ChatChannel = 'general' | 'world' | 'whisper' | 'group' | 'guild' | 'system';

/** The chat window's tabs: General shows every line, the others their channel (F3c §10.3). */
export type ChatTab = 'general' | 'group' | 'guild' | 'whisper';

export interface IChatLine
{
    /** `14:22` */
    time: string;
    channel: ChatChannel;
    /** Empty for a system line. */
    author: string;
    message: string;
    /** For a whisper, the other player of the conversation (F3c §10.2). */
    target?: string;
}

/**
 * The HUD around the player frame and the action bar (RPG spec §16.3, mockup/glaze/hud_*.png):
 * top bar, place, quest tracker, party, effects, target and its cast, boss, warning, chat. Null
 * and empty are "nothing to show": each panel stays hidden until it has something. The server
 * sends none of it yet; `__ambreia.hud.demo()` fills it meanwhile.
 */
export interface IHudPanels
{
    gold: number | null;
    gems: number | null;
    tokens: number | null;
    /** The "!" on the quests button: something new in the journal. */
    questAlert: boolean;
    zoneName: string;
    zonePlayers: number | null;
    quests: IQuestLine[];
    party: IPartyMember[];
    /** Icons of the effects on the player. */
    buffs: string[];
    target: (IHudUnit & {cast: IHudCast | null}) | null;
    boss: IHudUnit | null;
    /** The warning under the boss (`Frappe sismique dans 3 seconde(s) !`). */
    alert: string | null;
    chat: IChatLine[];
    chatTab: ChatTab;
    /** The player the whisper tab talks to; null while no conversation is open. */
    whisperWith: string | null;
}

/** The chat keeps this many lines; older ones scroll away for good. */
export const CHAT_HISTORY = 50;

/**
 * The lines a tab shows: all of them in General; elsewhere its channel's (the whispers with
 * `whisperWith` in the whisper tab), and the system lines everywhere — a refusal shows in the tab
 * it was typed in (F3c §10.3).
 */
export function chatLinesOf(lines: readonly IChatLine[], tab: ChatTab, whisperWith: string | null): IChatLine[]
{
    if(tab === 'general') return [...lines];

    return lines.filter(line => line.channel === 'system'
        || (tab === 'whisper' ? line.channel === 'whisper' && line.target === whisperWith : line.channel === tab));
}

export class HudPanelsState
{
    /**
     * `nav`: a top bar button was clicked (`nav_inventory`…), the feature that owns the window opens
     * it; `say`: the player typed a chat line (Enter), the chat feature sends it.
     */
    readonly events = new EventEmitter<{changed: [Readonly<IHudPanels>]; nav: [string]; say: [string]}>();
    private _value: IHudPanels = {
        gold: null, gems: null, tokens: null, questAlert: false, zoneName: '', zonePlayers: null,
        quests: [], party: [], buffs: [], target: null, boss: null, alert: null, chat: [], chatTab: 'general', whisperWith: null
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

    addChatLine(line: IChatLine): void
    {
        this.update({chat: [...this._value.chat, line].slice(-CHAT_HISTORY)});
    }
}
