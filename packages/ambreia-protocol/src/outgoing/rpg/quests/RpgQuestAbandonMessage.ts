/** Drops a quest under way (M2a §3.1). */
export class RpgQuestAbandonMessage
{
    constructor(
        readonly questId: string
    ) {}
}
