/** A monster yells (a boss's phase, M1c §9): a bubble over it and a line in the log. */
export class RpgMonsterYellMessage
{
    constructor(
        /** The monster's room object id. */
        readonly objectId: number,
        /** A key of the content's texts: `monster.grove.guardian.phase2`… */
        readonly textKey: string
    ) {}
}
