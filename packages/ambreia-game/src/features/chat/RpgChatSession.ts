import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import type {RpgChatMessage} from '@ambreia/protocol/incoming/rpg/chat/RpgChatMessage';
import type {RpgChatResultMessage} from '@ambreia/protocol/incoming/rpg/chat/RpgChatResultMessage';
import {RpgChatMessageParser} from '@ambreia/protocol/parser/rpg/chat/RpgChatMessageParser';
import {RpgChatResultMessageParser} from '@ambreia/protocol/parser/rpg/chat/RpgChatResultMessageParser';
import {RpgChatSendMessage} from '@ambreia/protocol/outgoing/rpg/chat/RpgChatSendMessage';
import {RpgChatSendMessageSerializer} from '@ambreia/protocol/serializer/rpg/chat/RpgChatSendMessageSerializer';
import type {RpgEmoteMessage} from '@ambreia/protocol/incoming/rpg/emote/RpgEmoteMessage';
import {RpgEmoteMessageParser} from '@ambreia/protocol/parser/rpg/emote/RpgEmoteMessageParser';
import {RpgEmoteSendMessage} from '@ambreia/protocol/outgoing/rpg/emote/RpgEmoteSendMessage';
import {RpgEmoteSendMessageSerializer} from '@ambreia/protocol/serializer/rpg/emote/RpgEmoteSendMessageSerializer';
import type {IChatSend} from '../../ui/kit/chatModel';

export interface IRpgChatSessionEvents
{
    message: [RpgChatMessage];
    result: [RpgChatResultMessage];
    emote: [RpgEmoteMessage];
}

/** The chat's messages and the RP actions: the client's counterpart of RpgChatMap.cs and RpgEmoteMap.cs (F3c §10, §16). */
export function rpgChatMap(announce: <E extends keyof IRpgChatSessionEvents>(event: E, ...args: IRpgChatSessionEvents[E]) => void): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgChatMessageComposer, new RpgChatMessageParser(), {handle: message => announce('message', message)})
        .incoming(Incoming.RpgChatResultMessageComposer, new RpgChatResultMessageParser(), {handle: message => announce('result', message)})
        .incoming(Incoming.RpgEmoteMessageComposer, new RpgEmoteMessageParser(), {handle: message => announce('emote', message)})
        .outgoing(RpgChatSendMessage, Outgoing.RpgChatSendMessageEvent, new RpgChatSendMessageSerializer())
        .outgoing(RpgEmoteSendMessage, Outgoing.RpgEmoteMessageEvent, new RpgEmoteSendMessageSerializer());
}

/** The RPG chat (F3c): announces the lines and refusals the server sends, sends what the player says. */
export class RpgChatSession
{
    readonly events = new EventEmitter<IRpgChatSessionEvents>();
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private readonly _map: MessageMap = rpgChatMap((event, ...args) =>
        // Typed at the map's side; eventemitter3 cannot tie a generic event to its payload here.
        (this.events as unknown as EventEmitter).emit(event, ...args));

    /** Serves the chat's headers on this connection (once: the client has one game socket). */
    install(connection: IConnection): void
    {
        if(this._connection === connection) return;

        this._uninstall?.();
        this._uninstall = this._map.install(connection);
        this._connection = connection;
    }

    send(line: IChatSend): boolean
    {
        return this._connection !== null && this._map.send(this._connection, new RpgChatSendMessage(line.channel, line.target, line.text));
    }

    /** Asks for an RP action on the player's avatar (`wave`…); the room plays it back to everyone. */
    emote(key: string): boolean
    {
        return this._connection !== null && this._map.send(this._connection, new RpgEmoteSendMessage(key));
    }

    dispose(): void
    {
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this.events.removeAllListeners();
    }
}
