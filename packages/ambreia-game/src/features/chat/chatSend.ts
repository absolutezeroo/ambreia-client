import type {ChatTab} from '../hud/HudPanelsState';

/** What RpgChatSend carries (F3c §10.1). */
export interface IChatSend
{
    channel: string;
    target: string;
    text: string;
}

const WHISPER = /^\/(?:w|whisper|chuchoter)\s+(\S+)\s+(.+)$/i;
const WORLD = /^\/(?:world|monde)\s+(.+)$/i;

/**
 * What a line typed in the chat sends: `/w Nom texte` whispers, `/monde texte` writes in World, and
 * otherwise the tab decides — General writes in the zone, the whisper tab to its player, Group and
 * Guild in theirs. Null for a line with nothing to send.
 */
export function chatSend(typed: string, tab: ChatTab, whisperWith: string | null): IChatSend | null
{
    const text = typed.trim();

    if(text === '') return null;

    const whisper = WHISPER.exec(text);

    if(whisper) return {channel: 'whisper', target: whisper[1], text: whisper[2]};

    const world = WORLD.exec(text);

    if(world) return {channel: 'world', target: '', text: world[1]};
    if(tab === 'whisper' && whisperWith !== null) return {channel: 'whisper', target: whisperWith, text};
    if(tab === 'group' || tab === 'guild') return {channel: tab, target: '', text};

    return {channel: 'general', target: '', text};
}

/** `sentAt` (Unix seconds, UTC) as the player's local `hh:mm`. */
export function chatClock(sentAt: number): string
{
    const date = new Date(sentAt * 1000);

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
