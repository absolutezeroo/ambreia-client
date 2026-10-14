import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import {RpgNpcsMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgNpcsMessageParser';
import {RpgDialogueMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgDialogueMessageParser';
import {RpgDialogueCloseMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgDialogueCloseMessageParser';
import {RpgQuestLogMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgQuestLogMessageParser';
import {RpgQuestResultMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgQuestResultMessageParser';
import {RpgNpcTalkMessage} from '@ambreia/protocol/outgoing/rpg/quests/RpgNpcTalkMessage';
import {RpgDialogueChooseMessage} from '@ambreia/protocol/outgoing/rpg/quests/RpgDialogueChooseMessage';
import {RpgQuestAbandonMessage} from '@ambreia/protocol/outgoing/rpg/quests/RpgQuestAbandonMessage';
import {RpgNpcTalkMessageSerializer} from '@ambreia/protocol/serializer/rpg/quests/RpgNpcTalkMessageSerializer';
import {RpgDialogueChooseMessageSerializer} from '@ambreia/protocol/serializer/rpg/quests/RpgDialogueChooseMessageSerializer';
import {RpgQuestAbandonMessageSerializer} from '@ambreia/protocol/serializer/rpg/quests/RpgQuestAbandonMessageSerializer';
import type {IRpgQuestSessionEvents} from './IRpgQuestSessionEvents';

/** NPCs, dialogue and quests on the wire (M2a §3.1–3.2): each message announced, three acts sent. */
export function rpgQuestMap(events: EventEmitter<IRpgQuestSessionEvents>): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgNpcsMessageComposer, new RpgNpcsMessageParser(), {handle: message => events.emit('npcs', message)})
        .incoming(Incoming.RpgDialogueMessageComposer, new RpgDialogueMessageParser(), {handle: message => events.emit('dialogue', message)})
        .incoming(Incoming.RpgDialogueCloseMessageComposer, new RpgDialogueCloseMessageParser(), {handle: () => events.emit('dialogueClose')})
        .incoming(Incoming.RpgQuestLogMessageComposer, new RpgQuestLogMessageParser(), {handle: message => events.emit('log', message)})
        .incoming(Incoming.RpgQuestResultMessageComposer, new RpgQuestResultMessageParser(), {handle: message => events.emit('result', message)})
        .outgoing(RpgNpcTalkMessage, Outgoing.RpgNpcTalkMessageEvent, new RpgNpcTalkMessageSerializer())
        .outgoing(RpgDialogueChooseMessage, Outgoing.RpgDialogueChooseMessageEvent, new RpgDialogueChooseMessageSerializer())
        .outgoing(RpgQuestAbandonMessage, Outgoing.RpgQuestAbandonMessageEvent, new RpgQuestAbandonMessageSerializer());
}

/** The quests' wire: what the server says, announced; talking, choosing, abandoning, sent. */
export class RpgQuestSession
{
    readonly events = new EventEmitter<IRpgQuestSessionEvents>();
    private readonly _map: MessageMap = rpgQuestMap(this.events);
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private _disposed = false;

    install(connection: IConnection): void
    {
        if(this._connection === connection) return;

        this._uninstall?.();
        this._uninstall = this._map.install(connection);
        this._connection = connection;
    }

    talk(objectId: number): void
    {
        this.send(new RpgNpcTalkMessage(objectId));
    }

    /** The position of the choice in the list last shown. */
    choose(position: number): void
    {
        this.send(new RpgDialogueChooseMessage(position));
    }

    abandon(questId: string): void
    {
        this.send(new RpgQuestAbandonMessage(questId));
    }

    private send(message: object): void
    {
        if(this._connection !== null) this._map.send(this._connection, message);
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this.events.removeAllListeners();
    }
}
