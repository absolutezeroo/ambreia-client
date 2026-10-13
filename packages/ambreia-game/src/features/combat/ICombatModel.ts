// The fight's state as the other features read it (spec §3,
// docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md); the network sessions hold
// the writing side (CombatModel).
import type {EventEmitter} from 'eventemitter3';
import type {ICastEntry} from './ICastEntry';
import type {ICombatModelEvents} from './ICombatModelEvents';
import type {ILogEntry} from './ILogEntry';
import type {ISelf} from './ISelf';
import type {IStatusEntry} from './IStatusEntry';
import type {ITargetInfo} from './ITargetInfo';
import type {IThreat} from './IThreat';
import type {IVitals} from './IVitals';

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
    /** The player's own health and mana (RpgSelfVitals): known without his object id, which may come later. */
    readonly ownVitals: IVitals | null;
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
