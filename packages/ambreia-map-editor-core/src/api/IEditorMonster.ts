/** One monster a spawn can name (GET /api/editor/monsters): the content's, retired ones left out. */
export interface IEditorMonster
{
    /** `monster.grove.guardian`; its name is the content text `<id>.name`. */
    readonly id: string;
    /** `normal`, `elite` or `boss`. */
    readonly rank: string;
    /** `melee`, `ranged`, `caster`… (the list may grow). */
    readonly behavior: string;
    readonly aggressive: boolean;
    /** The pet figure it is drawn with (`12 0 6A8F3A`). */
    readonly figure: string;
}
