/** A blow or a skill outcome, as 9012 and 9024 describe it, source first. */
export interface IBlow
{
    readonly source: number;
    readonly target: number;
    readonly amount: number;
    readonly absorbed: number;
    readonly outcome: string;
    readonly killed: boolean;
    /** The skill or status behind it; null for an auto-attack. */
    readonly sourceId: string | null;
}
