/** A telegraphed skill's area (M1c): the server sends the cells, this only describes them. */
export interface ISkillTelegraph
{
    /** `circle`, `line` or `cone`. */
    readonly shape: string;
    readonly size: number;
    readonly width: number;
    readonly angle: number;
}
