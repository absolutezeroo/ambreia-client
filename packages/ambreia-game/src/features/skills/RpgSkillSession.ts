import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import type {RpgSkillsMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillsMessage';
import type {RpgSkillResultMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillResultMessage';
import type {RpgCastStartMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgCastStartMessage';
import type {RpgCastEndMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgCastEndMessage';
import type {RpgCooldownsMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgCooldownsMessage';
import type {IRpgStatus, RpgStatusesMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgStatusesMessage';
import type {RpgSkillEventsMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillEventsMessage';
import {RpgSkillsMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgSkillsMessageParser';
import {RpgSkillResultMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgSkillResultMessageParser';
import {RpgCastStartMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgCastStartMessageParser';
import {RpgCastEndMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgCastEndMessageParser';
import {RpgCooldownsMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgCooldownsMessageParser';
import {RpgStatusesMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgStatusesMessageParser';
import {RpgSkillEventsMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgSkillEventsMessageParser';
import {RpgSkillCastMessage} from '@ambreia/protocol/outgoing/rpg/skills/RpgSkillCastMessage';
import {RpgActionBarSetMessage} from '@ambreia/protocol/outgoing/rpg/skills/RpgActionBarSetMessage';
import {RpgCastCancelMessage} from '@ambreia/protocol/outgoing/rpg/skills/RpgCastCancelMessage';
import {RpgSkillCastMessageSerializer} from '@ambreia/protocol/serializer/rpg/skills/RpgSkillCastMessageSerializer';
import {RpgActionBarSetMessageSerializer} from '@ambreia/protocol/serializer/rpg/skills/RpgActionBarSetMessageSerializer';
import {RpgCastCancelMessageSerializer} from '@ambreia/protocol/serializer/rpg/skills/RpgCastCancelMessageSerializer';

export interface IRpgSkillSessionEvents
{
    skills: [RpgSkillsMessage];
    result: [RpgSkillResultMessage];
    castStart: [RpgCastStartMessage];
    castEnd: [RpgCastEndMessage];
    cooldowns: [RpgCooldownsMessage];
    statuses: [RpgStatusesMessage];
    events: [RpgSkillEventsMessage];
}

/** The skills' messages: the client's counterpart of the server's skills map (M1b §10). */
export function rpgSkillMap(announce: <E extends keyof IRpgSkillSessionEvents>(event: E, ...args: IRpgSkillSessionEvents[E]) => void): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgSkillsMessageComposer, new RpgSkillsMessageParser(), {handle: message => announce('skills', message)})
        .incoming(Incoming.RpgSkillResultMessageComposer, new RpgSkillResultMessageParser(), {handle: message => announce('result', message)})
        .incoming(Incoming.RpgCastStartMessageComposer, new RpgCastStartMessageParser(), {handle: message => announce('castStart', message)})
        .incoming(Incoming.RpgCastEndMessageComposer, new RpgCastEndMessageParser(), {handle: message => announce('castEnd', message)})
        .incoming(Incoming.RpgCooldownsMessageComposer, new RpgCooldownsMessageParser(), {handle: message => announce('cooldowns', message)})
        .incoming(Incoming.RpgStatusesMessageComposer, new RpgStatusesMessageParser(), {handle: message => announce('statuses', message)})
        .incoming(Incoming.RpgSkillEventsMessageComposer, new RpgSkillEventsMessageParser(), {handle: message => announce('events', message)})
        .outgoing(RpgSkillCastMessage, Outgoing.RpgSkillCastMessageEvent, new RpgSkillCastMessageSerializer())
        .outgoing(RpgActionBarSetMessage, Outgoing.RpgActionBarSetMessageEvent, new RpgActionBarSetMessageSerializer())
        .outgoing(RpgCastCancelMessage, Outgoing.RpgCastCancelMessageEvent, new RpgCastCancelMessageSerializer());
}

/** What the client reads of a skill's definition (GET /api/public/content/definitions/skill, M1b §5.1). */
/** One effect of a skill (M1b §5.2): `damage`, `heal`, `apply_status`, `interrupt`, `dispel`, `threat`. */
export interface ISkillEffect
{
    readonly kind: string;
    readonly base: number;
    readonly coefficient: number;
    readonly status: string | null;
}

export interface ISkillDefinition
{
    readonly id: string;
    readonly classes: readonly string[];
    /** Learned on reaching this level. */
    readonly level: number;
    readonly effects: readonly ISkillEffect[];
    /** `self`, `ally`, `enemy`, `ground`, `around_caster`, `around_target`. */
    readonly target: string;
    readonly globalCooldown: boolean;
    /** `instant`, `cast` or `channel`. */
    readonly type: string;
    readonly cost: number;
    readonly castMs: number;
    readonly channelMs: number;
    /** Tiles; 0 for a skill on oneself or around oneself. */
    readonly range: number;
    readonly cooldownMs: number;
}

/** What the client reads of a status's definition (GET /api/public/content/definitions/status, M1b §5.3). */
export interface IStatusDefinition
{
    readonly id: string;
    /** `buff`, `debuff`, `dot`, `hot`, `stun`, `slow`, `shield`. */
    readonly type: string;
    readonly durationMs: number;
}

/** A bar slot's skill id: `skill:<id>` → `<id>`, anything else (empty, a later `item:`) → null. */
export function barSkill(action: string): string | null
{
    return action.startsWith('skill:') ? action.slice('skill:'.length) : null;
}

/**
 * The player's skills as the server last said (M1b §9, §10): the known ones, the bar, the
 * cooldowns' ends (Date.now() clock) and the statuses on each combatant of the zone. The client
 * asks (cast(), setBar(), cancel()); the server decides and answers.
 */
export class RpgSkillSession
{
    readonly events = new EventEmitter<IRpgSkillSessionEvents>();
    private _known: readonly string[] = [];
    private _bar: readonly string[] = [];
    private _globalEnd = 0;
    private readonly _cooldownEnds = new Map<string, number>();
    private readonly _statuses = new Map<number, readonly IRpgStatus[]>();
    private readonly _definitions = new Map<string, ISkillDefinition>();
    private readonly _statusDefinitions = new Map<string, IStatusDefinition>();
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private readonly _map: MessageMap = rpgSkillMap((event, ...args) =>
    {
        this.remember(event, args[0]);
        // Typed at the map's side; eventemitter3 cannot tie a generic event to its payload here.
        (this.events as unknown as EventEmitter).emit(event, ...args);
    });

    get known(): readonly string[]
    {
        return this._known;
    }

    /** `skill:<id>` or `` per slot. */
    get bar(): readonly string[]
    {
        return this._bar;
    }

    /** When this skill can be cast again: its own cooldown or, unless it is free of it, the global one. */
    readyAt(skillId: string): number
    {
        const global = this._definitions.get(skillId)?.globalCooldown === false ? 0 : this._globalEnd;

        return Math.max(global, this._cooldownEnds.get(skillId) ?? 0);
    }

    definition(skillId: string): ISkillDefinition | null
    {
        return this._definitions.get(skillId) ?? null;
    }

    /** Every skill of the content, by id order. */
    get definitions(): Iterable<ISkillDefinition>
    {
        return this._definitions.values();
    }

    statusDefinition(statusId: string): IStatusDefinition | null
    {
        return this._statusDefinitions.get(statusId) ?? null;
    }

    define(skills: readonly ISkillDefinition[], statuses: readonly IStatusDefinition[] = []): void
    {
        for(const definition of skills) this._definitions.set(definition.id, definition);
        for(const definition of statuses) this._statusDefinitions.set(definition.id, definition);
    }

    statusesOf(objectId: number): readonly IRpgStatus[]
    {
        return this._statuses.get(objectId) ?? [];
    }

    install(connection: IConnection): void
    {
        if(this._connection === connection) return;

        this._uninstall?.();
        this._uninstall = this._map.install(connection);
        this._connection = connection;
    }

    /** targetObjectId 0: none; x, y -1: no tile (M1b §6.6). */
    cast(skillId: string, targetObjectId = 0, x = -1, y = -1): void
    {
        this.send(new RpgSkillCastMessage(skillId, targetObjectId, x, y));
    }

    /** `skill:<id>` in the slot, `` to empty it (M1b §9). */
    setBar(slot: number, actionId: string): void
    {
        this.send(new RpgActionBarSetMessage(slot, actionId));
    }

    cancel(): void
    {
        this.send(new RpgCastCancelMessage());
    }

    /** The zone was left: its combatants' statuses with it (the player's own come back with the next zone's burst). */
    forget(): void
    {
        this._statuses.clear();
    }

    private send(message: object): void
    {
        if(this._connection !== null) this._map.send(this._connection, message);
    }

    private remember(event: keyof IRpgSkillSessionEvents, message: unknown): void
    {
        if(event === 'skills')
        {
            const skills = message as RpgSkillsMessage;

            this._known = skills.known;
            this._bar = skills.bar;
        }
        else if(event === 'cooldowns')
        {
            const cooldowns = message as RpgCooldownsMessage;
            const now = Date.now();

            this._globalEnd = now + cooldowns.globalRemainingMs;
            // The list is every running cooldown: one missing has ended.
            this._cooldownEnds.clear();
            for(const skill of cooldowns.skills) this._cooldownEnds.set(skill.skillId, now + skill.remainingMs);
        }
        else if(event === 'statuses')
        {
            for(const combatant of (message as RpgStatusesMessage).combatants)
            {
                if(combatant.statuses.length === 0) this._statuses.delete(combatant.objectId);
                else this._statuses.set(combatant.objectId, combatant.statuses);
            }
        }
    }

    dispose(): void
    {
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this._statuses.clear();
        this.events.removeAllListeners();
    }
}
