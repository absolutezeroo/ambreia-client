/** A line of a skill's stats (vortex_character_stat_row_xml): its tinted icon, label and value. */
export interface IStatLine
{
    readonly look: {readonly icon: string; readonly color: number};
    readonly label: string;
    readonly value: string;
}
