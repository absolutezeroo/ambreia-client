/** The player's threat on the monster he targets (RpgThreat). */
export interface IThreat
{
    /** 0..100, own threat over the top of the table. */
    readonly percent: number;
    readonly hasAggro: boolean;
}
