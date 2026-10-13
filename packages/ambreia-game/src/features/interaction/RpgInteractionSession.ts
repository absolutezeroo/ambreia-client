import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import {RpgZoneInteractivesMessageParser} from '@ambreia/protocol/parser/rpg/interaction/RpgZoneInteractivesMessageParser';
import {RpgTargetMessageParser} from '@ambreia/protocol/parser/rpg/interaction/RpgTargetMessageParser';
import {RpgTargetSelectMessage} from '@ambreia/protocol/outgoing/rpg/interaction/RpgTargetSelectMessage';
import {RpgTargetSelectMessageSerializer} from '@ambreia/protocol/serializer/rpg/interaction/RpgTargetSelectMessageSerializer';
import {RpgTargetsMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgTargetsMessageParser';
import {RpgThreatMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgThreatMessageParser';
import type {ICombatModelWriter} from '../combat/ICombatModelWriter';
import type {IRpgInteractionSessionEvents} from './IRpgInteractionSessionEvents';

/**
 * The interaction's messages: the client's counterpart of the server's RpgInteractionMap.cs (F3b §7),
 * and the aims of the fight (M1d §2.1): the target, who aims at whom and the threat go to the model.
 */
export function rpgInteractionMap(model: ICombatModelWriter, announce: <E extends keyof IRpgInteractionSessionEvents>(event: E, ...args: IRpgInteractionSessionEvents[E]) => void): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgZoneInteractivesMessageComposer, new RpgZoneInteractivesMessageParser(), {handle: message => announce('interactives', message)})
        .incoming(Incoming.RpgTargetMessageComposer, new RpgTargetMessageParser(), {handle: message =>
        {
            model.setTarget(message.objectId === 0 ? null : {objectId: message.objectId, kind: message.kind, name: message.name, level: message.level, classId: message.classId, rank: message.rank});
            announce('target', message);
        }})
        .incoming(Incoming.RpgTargetsMessageComposer, new RpgTargetsMessageParser(), {handle: message => model.setTargets(message.entries)})
        .incoming(Incoming.RpgThreatMessageComposer, new RpgThreatMessageParser(), {handle: threat => model.setThreat(threat.monsterObjectId, threat.percent, threat.hasAggro)})
        .outgoing(RpgTargetSelectMessage, Outgoing.RpgTargetSelectMessageEvent, new RpgTargetSelectMessageSerializer());
}

/**
 * The zone's usable objects and the player's target (F3b §7): the room decides both, the client
 * asks (select()) and shows what comes back.
 */
export class RpgInteractionSession
{
    readonly events = new EventEmitter<IRpgInteractionSessionEvents>();
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private readonly _map: MessageMap;

    constructor(private readonly _model: ICombatModelWriter)
    {
        // Typed at the map's side; eventemitter3 cannot tie a generic event to its payload here.
        this._map = rpgInteractionMap(_model, (event, ...args) => (this.events as unknown as EventEmitter).emit(event, ...args));
    }

    /** The target's object id; 0 for none. */
    get targetId(): number
    {
        return this._model.target?.objectId ?? 0;
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
        if(objectId === 0 && this._model.target === null) return;
        if(this._connection !== null) this._map.send(this._connection, new RpgTargetSelectMessage(objectId));
    }

    dispose(): void
    {
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this.events.removeAllListeners();
    }
}
