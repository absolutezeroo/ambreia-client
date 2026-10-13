import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import type {RpgSkillsMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillsMessage';
import {RpgSkillsMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgSkillsMessageParser';
import {RpgSkillResultMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgSkillResultMessageParser';
import {RpgCastStartMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgCastStartMessageParser';
import {RpgCastEndMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgCastEndMessageParser';
import {RpgCooldownsMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgCooldownsMessageParser';
import {RpgStatusesMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgStatusesMessageParser';
import {RpgSkillEventsMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgSkillEventsMessageParser';
import {RpgTelegraphsMessageParser} from '@ambreia/protocol/parser/rpg/skills/RpgTelegraphsMessageParser';
import {RpgSkillCastMessage} from '@ambreia/protocol/outgoing/rpg/skills/RpgSkillCastMessage';
import {RpgActionBarSetMessage} from '@ambreia/protocol/outgoing/rpg/skills/RpgActionBarSetMessage';
import {RpgCastCancelMessage} from '@ambreia/protocol/outgoing/rpg/skills/RpgCastCancelMessage';
import {RpgSkillCastMessageSerializer} from '@ambreia/protocol/serializer/rpg/skills/RpgSkillCastMessageSerializer';
import {RpgActionBarSetMessageSerializer} from '@ambreia/protocol/serializer/rpg/skills/RpgActionBarSetMessageSerializer';
import {RpgCastCancelMessageSerializer} from '@ambreia/protocol/serializer/rpg/skills/RpgCastCancelMessageSerializer';
import type {ICombatModelWriter} from '../combat/ICombatModelWriter';
import type {IStatusEntry} from '../combat/IStatusEntry';
import type {IClassDefinition} from './IClassDefinition';
import type {IRpgSkillSessionEvents} from './IRpgSkillSessionEvents';
import type {ISkillDefinition} from './ISkillDefinition';
import type {IStatusDefinition} from './IStatusDefinition';

/**
 * The skills' messages: the client's counterpart of the server's skills map (M1b §10). The state
 * they carry goes to the combat model first (statuses, casts, cooldowns, outcomes, refusals), then
 * each is announced for the views and visuals.
 */
export function rpgSkillMap(model: ICombatModelWriter, announce: <E extends keyof IRpgSkillSessionEvents>(event: E, ...args: IRpgSkillSessionEvents[E]) => void): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgSkillsMessageComposer, new RpgSkillsMessageParser(), {handle: message => announce('skills', message)})
        .incoming(Incoming.RpgSkillResultMessageComposer, new RpgSkillResultMessageParser(), {handle: message =>
        {
            model.refused(message.code, message.skillId);
            announce('result', message);
        }})
        .incoming(Incoming.RpgCastStartMessageComposer, new RpgCastStartMessageParser(), {handle: message =>
        {
            for(const cast of message.casts) model.setCast(cast.casterObjectId, {skillId: cast.skillId, durationMs: cast.durationMs, channel: cast.channel, targetObjectId: cast.targetObjectId});
            announce('castStart', message);
        }})
        .incoming(Incoming.RpgCastEndMessageComposer, new RpgCastEndMessageParser(), {handle: message =>
        {
            for(const end of message.ends) model.endCast(end.casterObjectId, end.reason, end.skillId);
            announce('castEnd', message);
        }})
        .incoming(Incoming.RpgCooldownsMessageComposer, new RpgCooldownsMessageParser(), {handle: message =>
        {
            model.setCooldowns(message.globalRemainingMs, message.skills);
            announce('cooldowns');
        }})
        .incoming(Incoming.RpgStatusesMessageComposer, new RpgStatusesMessageParser(), {handle: message =>
        {
            for(const combatant of message.combatants) model.setStatuses(combatant.objectId, combatant.statuses);
            announce('statuses', message);
        }})
        .incoming(Incoming.RpgSkillEventsMessageComposer, new RpgSkillEventsMessageParser(), {handle: message =>
        {
            model.reportOutcomes(message.outcomes);
            announce('events', message);
        }})
        .incoming(Incoming.RpgTelegraphsMessageComposer, new RpgTelegraphsMessageParser(), {handle: message => announce('telegraphs', message)})
        .outgoing(RpgSkillCastMessage, Outgoing.RpgSkillCastMessageEvent, new RpgSkillCastMessageSerializer())
        .outgoing(RpgActionBarSetMessage, Outgoing.RpgActionBarSetMessageEvent, new RpgActionBarSetMessageSerializer())
        .outgoing(RpgCastCancelMessage, Outgoing.RpgCastCancelMessageEvent, new RpgCastCancelMessageSerializer());
}

/** Habbo's step, and so the server's walk tick when nothing slows it (AvatarTickMs). */
export const STEP_MS = 500;

/**
 * What holds a combatant back (M1c): the status to mark it with (a stun before a slow), and how
 * long a step takes — the strongest slow, slows do not add up (500 × 100 / (100 − %)); null when
 * nothing slows it. A status whose definition is not loaded counts for nothing.
 */
export function holdBack(statuses: readonly {statusId: string}[], definition: (statusId: string) => IStatusDefinition | null): {statusId: string | null; stepMs: number | null}
{
    let slow = 0;
    let slowId: string | null = null;
    let stunId: string | null = null;

    for(const status of statuses)
    {
        const def = definition(status.statusId);

        if(def?.type === 'stun') stunId ??= status.statusId;
        else if(def?.type === 'slow' && (def.slowPercent ?? 0) > slow)
        {
            slow = Math.min(90, def.slowPercent ?? 0);
            slowId = status.statusId;
        }
    }

    return {statusId: stunId ?? slowId, stepMs: slow > 0 ? Math.round(STEP_MS * 100 / (100 - slow)) : null};
}

/** A status's time left under its icon: `4 s`, `2 min`; nothing for one without end (-1). */
export function statusTime(remainingMs: number): string
{
    if(remainingMs < 0) return '';

    const seconds = Math.ceil(remainingMs / 1000);

    return seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`;
}

/** A bar slot's skill id: `skill:<id>` → `<id>`, anything else (empty, a later `item:`) → null. */
export function barSkill(action: string): string | null
{
    return action.startsWith('skill:') ? action.slice('skill:'.length) : null;
}

/**
 * The player's skills as the server last said (M1b §9, §10): the known ones, the bar and the
 * content's definitions. The cooldowns and the statuses are the combat model's; this reads them
 * there. The client asks (cast(), setBar(), cancel()); the server decides and answers.
 */
export class RpgSkillSession
{
    readonly events = new EventEmitter<IRpgSkillSessionEvents>();
    private _known: readonly string[] = [];
    private _bar: readonly string[] = [];
    private readonly _definitions = new Map<string, ISkillDefinition>();
    private readonly _statusDefinitions = new Map<string, IStatusDefinition>();
    private readonly _classDefinitions = new Map<string, IClassDefinition>();
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private readonly _map: MessageMap;

    constructor(private readonly _model: ICombatModelWriter)
    {
        this._map = rpgSkillMap(_model, (event, ...args) =>
        {
            if(event === 'skills')
            {
                this._known = (args[0] as RpgSkillsMessage).known;
                this._bar = (args[0] as RpgSkillsMessage).bar;
            }

            // Typed at the map's side; eventemitter3 cannot tie a generic event to its payload here.
            (this.events as unknown as EventEmitter).emit(event, ...args);
        });
    }

    get known(): readonly string[]
    {
        return this._known;
    }

    /** `skill:<id>` or `` per slot. */
    get bar(): readonly string[]
    {
        return this._bar;
    }

    /** When this skill can be cast again (monotonic clock): its own cooldown or, unless it is free of it, the global one. */
    readyAt(skillId: string): number
    {
        const global = this._definitions.get(skillId)?.globalCooldown === false ? 0 : this._model.globalReadyAt;

        return Math.max(global, this._model.readyAt(skillId));
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

    classDefinition(classId: string): IClassDefinition | null
    {
        return this._classDefinitions.get(classId) ?? null;
    }

    define(skills: readonly ISkillDefinition[], statuses: readonly IStatusDefinition[] = [], classes: readonly IClassDefinition[] = []): void
    {
        for(const definition of skills) this._definitions.set(definition.id, definition);
        for(const definition of statuses) this._statusDefinitions.set(definition.id, definition);
        for(const definition of classes) this._classDefinitions.set(definition.id, definition);
    }

    statusesOf(objectId: number): readonly IStatusEntry[]
    {
        return this._model.statusesOf(objectId);
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

    private send(message: object): void
    {
        if(this._connection !== null) this._map.send(this._connection, message);
    }

    dispose(): void
    {
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this.events.removeAllListeners();
    }
}
