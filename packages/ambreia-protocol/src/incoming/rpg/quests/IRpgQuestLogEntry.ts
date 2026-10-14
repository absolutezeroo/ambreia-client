import type {IRpgQuestObjectiveLine} from './IRpgQuestObjectiveLine';

/** A quest of the log: active, ready or done, and its objective lines. */
export interface IRpgQuestLogEntry
{
    readonly questId: string;
    readonly state: string;
    readonly objectives: readonly IRpgQuestObjectiveLine[];
}
