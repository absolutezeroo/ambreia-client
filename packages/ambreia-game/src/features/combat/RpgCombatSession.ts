import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming} from '@ambreia/protocol/Headers.generated';
import type {RpgCombatEventsMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatEventsMessage';
import type {RpgVitalsMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgVitalsMessage';
import type {RpgSelfVitalsMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgSelfVitalsMessage';
import type {RpgDeathMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgDeathMessage';
import type {RpgCombatResultMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatResultMessage';
import {RpgCombatEventsMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgCombatEventsMessageParser';
import {RpgVitalsMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgVitalsMessageParser';
import {RpgSelfVitalsMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgSelfVitalsMessageParser';
import {RpgDeathMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgDeathMessageParser';
import {RpgCombatResultMessageParser} from '@ambreia/protocol/parser/rpg/combat/RpgCombatResultMessageParser';

export interface IRpgCombatSessionEvents
{
    hits: [RpgCombatEventsMessage];
    vitals: [RpgVitalsMessage];
    self: [RpgSelfVitalsMessage];
    death: [RpgDeathMessage];
    result: [RpgCombatResultMessage];
    /** A combatant's health as last known changed (a blow or a vitals line). */
    health: [objectId: number, health: number, maxHealth: number];
}

/** The combat's messages: the client's counterpart of the server's combat map (M1a §9.2). */
export function rpgCombatMap(announce: <E extends keyof IRpgCombatSessionEvents>(event: E, ...args: IRpgCombatSessionEvents[E]) => void): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgCombatEventsMessageComposer, new RpgCombatEventsMessageParser(), {handle: message => announce('hits', message)})
        .incoming(Incoming.RpgVitalsMessageComposer, new RpgVitalsMessageParser(), {handle: message => announce('vitals', message)})
        .incoming(Incoming.RpgSelfVitalsMessageComposer, new RpgSelfVitalsMessageParser(), {handle: message => announce('self', message)})
        .incoming(Incoming.RpgDeathMessageComposer, new RpgDeathMessageParser(), {handle: message => announce('death', message)})
        .incoming(Incoming.RpgCombatResultMessageComposer, new RpgCombatResultMessageParser(), {handle: message => announce('result', message)});
}

/**
 * The zone's fight as the client sees it (M1a): announces each message, and keeps every
 * combatant's last known health (by room object id) for the target frame and the bars.
 */
export class RpgCombatSession
{
    readonly events = new EventEmitter<IRpgCombatSessionEvents>();
    private readonly _health = new Map<number, {health: number; maxHealth: number}>();
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private readonly _map: MessageMap = rpgCombatMap((event, ...args) =>
    {
        // Typed at the map's side; eventemitter3 cannot tie a generic event to its payload here.
        (this.events as unknown as EventEmitter).emit(event, ...args);

        if(event === 'hits') for(const hit of (args[0] as RpgCombatEventsMessage).hits) this.setHealth(hit.targetId, hit.health, hit.maxHealth);
        else if(event === 'vitals') for(const line of (args[0] as RpgVitalsMessage).combatants) this.setHealth(line.objectId, line.health, line.maxHealth);
    });

    /** The last health known for this room object, or null. */
    healthOf(objectId: number): {health: number; maxHealth: number} | null
    {
        return this._health.get(objectId) ?? null;
    }

    /** The room was left: its combatants with it. */
    forget(): void
    {
        this._health.clear();
    }

    install(connection: IConnection): void
    {
        if(this._connection === connection) return;

        this._uninstall?.();
        this._uninstall = this._map.install(connection);
        this._connection = connection;
    }

    private setHealth(objectId: number, health: number, maxHealth: number): void
    {
        this._health.set(objectId, {health, maxHealth});
        this.events.emit('health', objectId, health, maxHealth);
    }

    dispose(): void
    {
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this._health.clear();
        this.events.removeAllListeners();
    }
}
