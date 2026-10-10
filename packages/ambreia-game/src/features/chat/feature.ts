import {Logger} from '@ambreia/common/utils/Logger';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../character/WindowBits';
import {chatClock, chatSend, type ChatChannel} from '../hud/chatModel';
import {RpgChatSession} from './RpgChatSession';

const log = Logger.getLogger('habbo.features.chat');

const CHANNELS = new Set<string>(['world', 'general', 'group', 'guild', 'trade', 'recruitment', 'whisper', 'system'] satisfies ChatChannel[]);

/**
 * The RPG chat (F3c §10.3): what the player types in the HUD's chat goes out as RpgChatSend, and
 * every RpgChatMessage comes back as a line of the HUD's chat window (the server sends the
 * sender's own copy too). A refusal is a system line, translated, in the open tab. No bubbles.
 */
export const ChatFeature: IGameFeature = {
    id: 'chat',
    requires: ['hud'],
    create: ({host, scope}) =>
    {
        const session = new RpgChatSession();
        const hud = host.made.hud;
        const on = scope.bind(session.events);
        const hudOn = scope.bind(hud?.events);

        scope.own(session);

        host.made.chat = session;

        hudOn('say', typed =>
        {
            // `hud` is the emitter of this very event: present when it fires.
            const line = chatSend(typed, hud!.openTab, hud!.value.sayChannel);

            if(line && !session.send(line)) log.warn('no game connection — the chat line was not sent');
        });

        on('message', message =>
        {
            // A channel this client does not know yet still shows, as a system line.
            const channel = (CHANNELS.has(message.channel) ? message.channel : 'system') as ChatChannel;
            // A system line may be a text key: translated when it is one (relay note §3).
            const text = message.channel === 'system' ? new WindowBits(host.made.localization).textOr(message.text, message.text) : message.text;

            hud?.addChatLine({time: chatClock(message.sentAt), channel, author: message.senderName, message: text, target: message.target});
        });

        hudOn('emote', key => session.emote(key));
        // The room sends every RP action, the player's own too (F3c §16): played on the avatar.
        on('emote', emote => host.made.roomEngine?.playRpgEmote(emote.objectId, emote.key));

        on('result', result =>
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
