import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import type {RpgZoneInteractivesMessage} from '@ambreia/protocol/incoming/rpg/interaction/RpgZoneInteractivesMessage';
import type {RpgTargetMessage} from '@ambreia/protocol/incoming/rpg/interaction/RpgTargetMessage';
import {RpgZoneInteractivesMessageParser} from '@ambreia/protocol/parser/rpg/interaction/RpgZoneInteractivesMessageParser';
import {RpgTargetMessageParser} from '@ambreia/protocol/parser/rpg/interaction/RpgTargetMessageParser';
import {RpgTargetSelectMessage} from '@ambreia/protocol/outgoing/rpg/interaction/RpgTargetSelectMessage';
import {RpgTargetSelectMessageSerializer} from '@ambreia/protocol/serializer/rpg/interaction/RpgTargetSelectMessageSerializer';

export interface IRpgInteractionSessionEvents
{
    interactives: [RpgZoneInteractivesMessage];
    target: [RpgTargetMessage];
}

/** The interaction's messages: the client's counterpart of the server's RpgInteractionMap.cs (F3b §7). */
export function rpgInteractionMap(announce: <E extends keyof IRpgInteractionSessionEvents>(event: E, ...args: IRpgInteractionSessionEvents[E]) => void): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgZoneInteractivesMessageComposer, new RpgZoneInteractivesMessageParser(), {handle: message => announce('interactives', message)})
        .incoming(Incoming.RpgTargetMessageComposer, new RpgTargetMessageParser(), {handle: message => announce('target', message)})
        .outgoing(RpgTargetSelectMessage, Outgoing.RpgTargetSelectMessageEvent, new RpgTargetSelectMessageSerializer());
}

/**
 * The zone's usable objects and the player's target (F3b §7): the room decides both, the client
 * asks (select()) and shows what comes back.
 */
export class RpgInteractionSession
{
    readonly events = new EventEmitter<IRpgInteractionSessionEvents>();
    /** The target as the server last set it; null for none. */
    private _target: RpgTargetMessage | null = null;
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private readonly _map: MessageMap = rpgInteractionMap((event, ...args) =>
    {
        if(event === 'target') this._target = (args[0] as RpgTargetMessage).objectId === 0 ? null : args[0] as RpgTargetMessage;

        // Typed at the map's side; eventemitter3 cannot tie a generic event to its payload here.
        (this.events as unknown as EventEmitter).emit(event, ...args);
    });

    /** The target's object id; 0 for none. */
    get targetId(): number
    {
        return this._target?.objectId ?? 0;
    }

    /** The target as the server described it (its class, rank…); null for none. */
    get target(): RpgTargetMessage | null
    {
        return this._target;
    }

    /** Serves the interaction's headers on this connection (once: the client has one game socket). */
    install(connection: IConnection): void
    {
        if(this._connection === connection) return;

        this._uninstall?.();
        this._uninstall = this._map.install(connection);
        this._connection = connection;
    }

    /** Asks to target the avatar with this room object id, or to clear the target (0) — once there is one. */
    select(objectId: number): void
    {
        if(objectId === 0 && this._target === null) return;
        if(this._connection !== null) this._map.send(this._connection, new RpgTargetSelectMessage(objectId));
    }

    /** The room was left: the server forgets the target with it (F3b §8). */
    forget(): void
    {
        this._target = null;
    }

    dispose(): void
    {
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this.events.removeAllListeners();
    }
}
