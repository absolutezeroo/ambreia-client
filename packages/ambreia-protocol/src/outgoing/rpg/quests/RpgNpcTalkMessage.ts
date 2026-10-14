/** Talks to an NPC (M2a §3.1): the server opens its dialogue, walking the player up first. */
export class RpgNpcTalkMessage
{
    constructor(
        readonly objectId: number
    ) {}
}
