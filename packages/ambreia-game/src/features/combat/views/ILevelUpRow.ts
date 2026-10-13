/** One line of the level-up panel: a stat that rose. */
export interface ILevelUpRow
{
    /** The stat's text key (`vortex.stat.health`). */
    readonly key: string;
    readonly icon: string;
    readonly color: number;
    /** `+30`, `+1.2 %`. */
    readonly delta: string;
}
