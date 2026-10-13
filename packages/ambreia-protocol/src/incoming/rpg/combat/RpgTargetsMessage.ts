/** A combatant and what it aims at (M1d §2.1, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md). */
export interface IRpgTargetEntry
{
    readonly objectId: number;
    /** 0: none. */
    readonly targetObjectId: number;
}

/** Who aims at whom: full in the zone's entry burst, then the tick's changes (M1d §2.1, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md). */
export class RpgTargetsMessage
{
    constructor(
        readonly entries: readonly IRpgTargetEntry[]
    ) {}
}
