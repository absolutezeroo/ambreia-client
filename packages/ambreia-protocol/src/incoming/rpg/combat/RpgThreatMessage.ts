/** The player's threat on the monster he targets, to him alone (M1d §2.1, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md). */
export class RpgThreatMessage
{
    constructor(
        readonly monsterObjectId: number,
        /** floor(own threat / top threat x 100), 0..100. */
        readonly percent: number,
        /** The player is the top of the table. */
        readonly hasAggro: boolean
    ) {}
}
