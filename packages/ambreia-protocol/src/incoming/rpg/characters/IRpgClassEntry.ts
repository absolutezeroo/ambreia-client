/** One class of the content, as the characters screen offers it. */
export interface IRpgClassEntry
{
    readonly id: string;
    /** As written in the content (`tank`, `damage`…). */
    readonly role: string;
    readonly range: number;
    /** As written in the content (`strength`…). */
    readonly primaryStat: string;
    /** The starter class ("Sans classe"), not one to choose. */
    readonly starter: boolean;
    readonly specializations: readonly string[];
}
