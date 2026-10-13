/** A status on a combatant, with its end on the monotonic clock. */
export interface IStatusEntry
{
    readonly statusId: string;
    /** Null for a status without end. */
    readonly endsAt: number | null;
    readonly stacks: number;
}
