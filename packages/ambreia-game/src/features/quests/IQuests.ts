/** What another feature reads of the quests (host.made.quests): the feature wall's one door. */
export interface IQuests
{
    /** Whether this room object is an NPC of the zone: a click talks to it instead of targeting it. */
    isNpc(objectId: number): boolean;
}
