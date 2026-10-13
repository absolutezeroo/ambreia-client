/** One status as RpgStatuses lists it. */
export interface IStatusLine
{
    readonly statusId: string;
    /** -1 for a status without end. */
    readonly remainingMs: number;
    readonly stacks: number;
}
