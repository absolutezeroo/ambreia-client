/**
 * The RPG chat's model (F3c §10.3, the user's mock-ups of 2026-10-09): its channels as the player
 * sees them, the tabs, which lines a tab shows, what a typed line sends, and the settings.
 */

/**
 * The channels, by their key on the wire (F3c §10, §16). The player says « Général » for `world`
 * and « Zone » for `general`.
 */
export type ChatChannel = 'world' | 'general' | 'group' | 'guild' | 'trade' | 'recruitment' | 'whisper' | 'system';

export interface IChannelDef
{
    /** The text key of its name. */
    key: string;
    color: number;
    icon: string;
    /** False while the server has no such channel: the menus grey it (« bientôt »). */
    live: boolean;
}

const ICONS = 'rpg/ui-icons/';

export const CHAT_CHANNELS: Readonly<Record<ChatChannel, IChannelDef>> = {
    world: {key: 'vortex.guild.channel.general', color: 0xf0a030, icon: `${ICONS}software_speech_bubble_three_dots_dialogue_icon`, live: true},
    general: {key: 'vortex.chat.channel.zone', color: 0x5ab4f0, icon: `${ICONS}map_markers_tree_forest_decidous_1_icon`, live: true},
    group: {key: 'vortex.group.title', color: 0x6a9cf0, icon: `${ICONS}emoji_hands_high_five_clap_prayer_icon`, live: true},
    guild: {key: 'vortex.character.guild', color: 0x5ad04a, icon: `${ICONS}boardgames_card_defense_shield_icon`, live: true},
    trade: {key: 'vortex.chat.channel.trade', color: 0xf0d040, icon: `${ICONS}boardgames_chip_token_coin_counter_icon`, live: true},
    recruitment: {key: 'vortex.chat.channel.recruitment', color: 0xf05050, icon: `${ICONS}media_car_horn_honk_icon`, live: true},
    whisper: {key: 'vortex.chat.channel.whisper', color: 0xf080d0, icon: `${ICONS}software_email_message_forward_send_icon`, live: true},
    system: {key: 'vortex.hud.chat.system', color: 0xe040a0, icon: `${ICONS}software_speech_bubble_three_dots_dialogue_icon`, live: false}
};

/** The neutral colour of the channel and the name when the settings turn colours off. */
export const PLAIN_COLOR = 0xc8c6be;

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
 * A tab: « Général » shows every line (`channel` null); a channel's tab its lines; a whisper tab
 * the conversation with one player. Every tab also shows the system lines, so a refusal shows
 * where it was typed.
 */
export interface IChatTab
{
    /** `all`, `channel:general`, `whisper:Arwen`. */
    id: string;
    channel: ChatChannel | null;
    whisperWith: string | null;
}

export const ALL_TAB: IChatTab = {id: 'all', channel: null, whisperWith: null};

export const channelTab = (channel: ChatChannel): IChatTab => ({id: `channel:${channel}`, channel, whisperWith: null});
export const whisperTab = (name: string): IChatTab => ({id: `whisper:${name.toLowerCase()}`, channel: 'whisper', whisperWith: name});

export type ChatTextSize = 'small' | 'normal' | 'large';

/** The chat settings (the cog), kept in the browser. */
export interface IChatSettings
{
    /** The `[hh:mm]` in front of each line. */
    time: boolean;
    /** System lines in « Général ». */
    system: boolean;
    /** Channel and name in their channel's colour. */
    colors: boolean;
    /** 0.2 to 1. */
    opacity: number;
    textSize: ChatTextSize;
    /** The tabs the player added cannot be closed. */
    lockTabs: boolean;
    /** Fade the chat out after `idleMinutes` without a line or a click. */
    hideIdle: boolean;
    idleMinutes: number;
}

export const DEFAULT_CHAT_SETTINGS: Readonly<IChatSettings> = {
    time: true, system: true, colors: true, opacity: 0.8, textSize: 'normal', lockTabs: false, hideIdle: false, idleMinutes: 5
};

export const TEXT_SIZES: Readonly<Record<ChatTextSize, number>> = {small: 9, normal: 10, large: 12};
export const IDLE_MINUTES: readonly number[] = [1, 5, 10];

/** The lines `tab` shows (see IChatTab). */
export function chatLinesOf(lines: readonly IChatLine[], tab: IChatTab, settings: Readonly<IChatSettings> = DEFAULT_CHAT_SETTINGS): IChatLine[]
{
    if(tab.channel === null) return lines.filter(line => line.channel !== 'system' || settings.system);
    if(tab.whisperWith !== null) return lines.filter(line => line.channel === 'system' || (line.channel === 'whisper' && line.target?.toLowerCase() === tab.whisperWith!.toLowerCase()));

    return lines.filter(line => line.channel === 'system' || line.channel === tab.channel);
}

/** What RpgChatSend carries (F3c §10.1). */
export interface IChatSend
{
    channel: string;
    target: string;
    text: string;
}

const WHISPER = /^\/(?:w|whisper|chuchoter)\s+(\S+)\s+(.+)$/i;
const SHORTCUTS: ReadonlyArray<[RegExp, ChatChannel]> = [[/^\/(?:g|general|général)\s+(.+)$/i, 'world'], [/^\/(?:z|zone)\s+(.+)$/i, 'general']];

/**
 * What a typed line sends: `/w Nom texte` whispers, `/g texte` writes in « Général » (world),
 * `/z texte` in « Zone »; otherwise the tab decides — « Général » writes where the bubble says
 * (`say`), a channel's tab in its channel, a whisper tab to its player. Null for nothing to send.
 */
export function chatSend(typed: string, tab: IChatTab, say: ChatChannel): IChatSend | null
{
    const text = typed.trim();

    if(text === '') return null;

    const whisper = WHISPER.exec(text);

    if(whisper) return {channel: 'whisper', target: whisper[1], text: whisper[2]};

    for(const [pattern, channel] of SHORTCUTS)
    {
        const match = pattern.exec(text);

        if(match) return {channel, target: '', text: match[1]};
    }

    if(tab.whisperWith !== null) return {channel: 'whisper', target: tab.whisperWith, text};

    return {channel: tab.channel ?? say, target: '', text};
}

/** The settings kept in the browser, over the defaults; the defaults when there are none or storage is off. */
export function loadChatSettings(storage: Pick<Storage, 'getItem'> | null): IChatSettings
{
    try
    {
        const saved = JSON.parse(storage?.getItem(SETTINGS_KEY) ?? 'null') as Partial<IChatSettings> | null;

        return {...DEFAULT_CHAT_SETTINGS, ...(saved && typeof saved === 'object' ? saved : {})};
    }
    catch
    {
        return {...DEFAULT_CHAT_SETTINGS};
    }
}

export function saveChatSettings(storage: Pick<Storage, 'setItem'> | null, settings: Readonly<IChatSettings>): void
{
    try
    {
        storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
    catch
    {
        // Storage off (private window, quota): the settings last until the page closes.
    }
}

const SETTINGS_KEY = 'ambreia.chat.settings';

/** The palette's emoticons: our pixel icon, and the Unicode emoji it puts in the line. */
export const EMOTICONS: ReadonlyArray<{icon: string; text: string}> = [
    ['smiling_smiley', '🙂'], ['happy', '😊'], ['grinning', '😀'], ['laughing_joy', '😂'], ['tongue_out', '😛'], ['angel_halo', '😇'],
    ['neutral', '😐'], ['surprised_shocked', '😮'], ['sad', '😟'], ['sad_frown', '🙁'], ['angry_anger', '😠'], ['unhappy_grossed_out', '🤢'],
    ['sleeping_tired', '😴'], ['evil_laugh_gloating', '😏'], ['demon_devil_horns', '😈']
].map(([name, text]) => ({icon: `${ICONS}emoji_face_${name}_icon`, text})).concat([
    {icon: `${ICONS}emoji_hand_thumbs_up_icon`, text: '👍'},
    {icon: `${ICONS}emoji_hand_thumbs_down_icon`, text: '👎'},
    {icon: `${ICONS}emoji_hand_wave_cursor_pan_open_icon`, text: '👋'}
]);

const EMOTICON_ICONS = new Map(EMOTICONS.map(emoticon => [emoticon.text, emoticon.icon]));
const EMOTICON_SPLIT = new RegExp(`(${EMOTICONS.map(emoticon => emoticon.text).join('|')})`, 'u');

/**
 * A line's text cut at the palette's emoticons: `{text}` pieces and `{icon}` ones. The HUD's text
 * engine draws with the game's pixel font, which has no emoji, so the line shows our icons for them.
 */
export function splitEmoticons(text: string): Array<{text: string} | {icon: string}>
{
    return text.split(EMOTICON_SPLIT).filter(piece => piece !== '')
        .map(piece => EMOTICON_ICONS.has(piece) ? {icon: EMOTICON_ICONS.get(piece)!} : {text: piece});
}

/** The RP actions of the palette: `emote` is the server's key (RpgEmote, F3c §16). */
export const RP_ACTIONS: ReadonlyArray<{emote: string; key: string; icon: string}> = [
    {emote: 'wave', key: 'vortex.chat.action.wave', icon: `${ICONS}emoji_hand_wave_cursor_pan_open_icon`},
    {emote: 'laugh', key: 'vortex.chat.action.laugh', icon: `${ICONS}emoji_face_laughing_joy_icon`},
    {emote: 'clap', key: 'vortex.chat.action.applaud', icon: `${ICONS}emoji_hands_high_five_clap_prayer_icon`},
    {emote: 'dance', key: 'vortex.chat.action.dance', icon: `${ICONS}hats_balloon_party_icon`},
    {emote: 'sad', key: 'vortex.chat.action.sad', icon: `${ICONS}emoji_face_sad_icon`},
    {emote: 'surprised', key: 'vortex.chat.action.surprised', icon: `${ICONS}emoji_face_surprised_shocked_icon`}
];

/** Every icon the chat sets at run time (IGameFeature.images). */
export const CHAT_ICONS: readonly string[] = [...new Set([
    ...Object.values(CHAT_CHANNELS).map(channel => channel.icon),
    ...EMOTICONS.map(emoticon => emoticon.icon),
    ...RP_ACTIONS.map(action => action.icon),
    `${ICONS}software_signs_checkmark_checkbox_ticked_todo_icon`
])];

/** `sentAt` (Unix seconds, UTC) as the player's local `hh:mm`. */
export function chatClock(sentAt: number): string
{
    const date = new Date(sentAt * 1000);

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
