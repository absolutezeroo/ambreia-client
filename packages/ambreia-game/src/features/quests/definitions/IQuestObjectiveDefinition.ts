/** An objective of a quest's public definition: its kind and how many. */
export interface IQuestObjectiveDefinition
{
    readonly kind: string;
    readonly count?: number;
}
