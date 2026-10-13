// The fight's state as the other features read it (spec §3, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md):
// the one file of this feature another feature imports (the feature wall).
import type {EventEmitter} from 'eventemitter3';
import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';

export interface IVitals
{
    readonly health: number;
    readonly maxHealth: number;
    /** Only the player's own mana is on the wire (RpgSelfVitals); null for the others. */
    readonly mana: number | null;
    readonly maxMana: number | null;
}

/** The target as the server described it (RpgTarget). */
export interface ITargetInfo
{
    readonly objectId: number;
    /** `player`, `monster`. */
    readonly kind: string;
    readonly name: string;
    readonly level: number;
    readonly classId: string;
    /** `normal`, `elite`, `boss`. */
    readonly rank: string;
}

/** The player's threat on the monster he targets (RpgThreat). */
export interface IThreat
{
    /** 0..100, own threat over the top of the table. */
    readonly percent: number;
    readonly hasAggro: boolean;
}

export interface IStatusEntry
{
    readonly statusId: string;
    /** A deadline on the monotonic clock; null for a status without end. */
    readonly endsAt: number | null;
    readonly stacks: number;
}

export interface ICastEntry
{
    readonly skillId: string;
    readonly startedAt: number;
    readonly durationMs: number;
    readonly channel: boolean;
    readonly targetObjectId: number;
}

/** A healer's offer to raise the KO player (RpgResurrectOffer), until `expiresAt`. */
export interface IOffer
{
    readonly casterObjectId: number;
    readonly healthPercent: number;
    readonly expiresAt: number;
}

/**
 * Alive, or KO on the spot: counting down to the auto-release (`autoReleaseAt`), or waiting for a
 * resurrection (`waiting`), with an offer pending or not. Back to alive only when the server sends
 * the player's own vitals with health (spec §3.1).
 */
export type DeathState =
    | {readonly kind: 'alive'}
    | {readonly kind: 'ko'; readonly autoReleaseAt: number | null; readonly waiting: boolean; readonly offer: IOffer | null};

export interface ISelf
{
    readonly inCombat: boolean;
    /** The server's word (RpgAutoAttackState), never the click. */
    readonly autoAttacking: boolean;
    readonly death: DeathState;
}

export type LogKind = 'dealt' | 'taken' | 'miss' | 'heal' | 'status' | 'cast' | 'death' | 'resurrect' | 'levelup' | 'refused';

/** A line of the combat log: a text key and its parameters, resolved by whoever shows it. */
export interface ILogEntry
{
    readonly at: number;
    readonly kind: LogKind;
    readonly key: string;
    readonly params: Readonly<Record<string, string>>;
}

export interface ILevelUp
{
    readonly fromLevel: number;
    readonly toLevel: number;
    readonly statsBefore: IRpgStatBlock;
    readonly statsAfter: IRpgStatBlock;
    readonly skillsLearned: readonly string[];
}

export interface ICombatModelEvents
{
    vitals: [objectId: number, vitals: IVitals];
    self: [ISelf];
    target: [ITargetInfo | null];
    /** Who aims at whom changed (the target of target among others). */
    targets: [];
    threat: [IThreat | null];
    statuses: [objectId: number, statuses: readonly IStatusEntry[]];
    cast: [objectId: number, cast: ICastEntry | null];
    cooldowns: [globalReadyAt: number, bySkill: ReadonlyMap<string, number>];
    log: [ILogEntry];
    levelUp: [ILevelUp];
    /** The entry burst is over: the model is whole again. */
    resynced: [];
}

/** The model as the views read it; the network sessions hold the writing side (CombatModel). */
export interface ICombatModel
{
    readonly events: EventEmitter<ICombatModelEvents>;
    /** Between `reset()` and the burst's last message: snapshots restore, nothing is news. */
    readonly resyncing: boolean;
    readonly self: ISelf;
    readonly target: ITargetInfo | null;
    readonly threat: IThreat | null;
    /** The player's own room object id; 0 before a room. */
    readonly ownObjectId: number;
    /** The last cooldowns' global deadline. */
    readonly globalReadyAt: number;
    readonly log: readonly ILogEntry[];
    vitalsOf(objectId: number): IVitals | null;
    /** The object this one aims at; 0 for none. */
    targetOf(objectId: number): number;
    statusesOf(objectId: number): readonly IStatusEntry[];
    castOf(objectId: number): ICastEntry | null;
    /** The deadline of this skill's cooldown; 0 when ready. */
    readyAt(skillId: string): number;
}
