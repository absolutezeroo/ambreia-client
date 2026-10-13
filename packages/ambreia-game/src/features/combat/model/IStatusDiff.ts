/** What changed between two full lists of a combatant: the only signals 9023 gives (spec §4). */
export interface IStatusDiff
{
    readonly applied: string[];
    readonly stacked: {statusId: string; stacks: number}[];
    readonly expired: string[];
}
