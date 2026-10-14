import type {IQuestObjectiveDefinition} from './IQuestObjectiveDefinition';
import type {IQuestRewardDefinition} from './IQuestRewardDefinition';

/** A quest as the server serves it to anyone (/api/public/content/definitions/quest, M2a §2.1). */
export interface IQuestDefinition
{
    readonly id: string;
    readonly level: number;
    readonly objectives: readonly IQuestObjectiveDefinition[];
    readonly rewards: readonly IQuestRewardDefinition[];
}
