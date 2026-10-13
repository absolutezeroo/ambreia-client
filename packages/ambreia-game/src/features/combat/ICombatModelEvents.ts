import type {ICastEntry} from './ICastEntry';
import type {ILevelUp} from './ILevelUp';
import type {ILogEntry} from './ILogEntry';
import type {ISelf} from './ISelf';
import type {IStatusEntry} from './IStatusEntry';
import type {ITargetInfo} from './ITargetInfo';
import type {IThreat} from './IThreat';
import type {IVitals} from './IVitals';

/** What the combat model announces to the views. */
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
