/** A skill of the window's lists: learned or still locked, and the level that unlocks it. */
export interface ISkillEntry
{
    readonly skillId: string;
    readonly learned: boolean;
    readonly level: number;
}
