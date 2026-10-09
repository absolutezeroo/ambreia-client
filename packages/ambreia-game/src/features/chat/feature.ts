import {Logger} from '@ambreia/common/utils/Logger';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../character/WindowBits';
import type {ChatChannel} from '../hud/HudPanelsState';
import {chatClock, chatSend} from './chatSend';
import {RpgChatSession} from './RpgChatSession';

const log = Logger.getLogger('habbo.features.chat');

const CHANNELS = new Set<string>(['general', 'world', 'whisper', 'group', 'guild', 'system'] satisfies ChatChannel[]);

/**
 * The RPG chat (F3c §10.3): what the player types in the HUD's chat goes out as RpgChatSend, and
 * every RpgChatMessage comes back as a line of the HUD's chat window (the server sends the
 * sender's own copy too). A refusal is a system line, translated, in the open tab. No bubbles.
 */
export const ChatFeature: IGameFeature = {
    id: 'chat',
    create: ({host}) =>
    {
        const session = new RpgChatSession();
        const hud = host.made.hud;

        host.made.chat = session;

        hud?.events.on('say', typed =>
        {
            const line = chatSend(typed, hud.value.chatTab, hud.value.whisperWith);

            if(line && !session.send(line)) log.warn('no game connection — the chat line was not sent');
        });

        session.events.on('message', message =>
        {
            // A channel this client does not know yet still shows, as a system line.
            const channel = (CHANNELS.has(message.channel) ? message.channel : 'system') as ChatChannel;
            // A system line may be a text key: translated when it is one (relay note §3).
            const text = message.channel === 'system' ? new WindowBits(host.made.localization).textOr(message.text, message.text) : message.text;

            hud?.addChatLine({time: chatClock(message.sentAt), channel, author: message.senderName, message: text, target: message.target});
        });

        session.events.on('result', result =>
        {
            const bits = new WindowBits(host.made.localization);

            hud?.addChatLine({
                time: chatClock(Date.now() / 1000), channel: 'system', author: '',
                message: bits.textOr(`vortex.chat.error.${result.code}`, bits.text('vortex.chat.error.refused'))
            });
        });

        return null;
    },
    afterAttach: async (_product, {host}) =>
    {
        // The communication manager builds its connection in initComponent(), a microtask after its attach.
        await Promise.resolve();

        const connection = host.made.communication?.connection ?? null;

        if(connection) host.made.chat?.install(connection);
        else log.warn('no game connection to serve the chat on — nothing typed will be sent');
    }
};
