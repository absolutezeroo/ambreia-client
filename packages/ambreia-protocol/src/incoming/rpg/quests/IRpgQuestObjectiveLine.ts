/** An objective of a quest in the log: its kind (for its icon) and its counter. */
export interface IRpgQuestObjectiveLine
{
    readonly kind: string;
    readonly current: number;
    readonly required: number;
}
