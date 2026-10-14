/** A quest action's answer (M2a §3.2): accepted, completed, abandoned or talk, with ok or a refusal code. */
export class RpgQuestResultMessage
{
    constructor(
        readonly action: string,
        /** `ok`, `quest.log_full`, `npc.too_far`… */
        readonly code: string,
        readonly questId: string
    ) {}
}
