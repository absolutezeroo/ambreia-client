export interface IZoneSummary
{
    readonly key: string;
    readonly name: string;
    readonly roomId: number;
    readonly publishedVersion: number | null;
    readonly latestVersion: number;
    readonly lockedByAccountId: number | null;
    /** From the newest version's settings and floor: '' and 0 for a zone never saved. */
    readonly type?: string;
    readonly region?: string;
    readonly width?: number;
    readonly length?: number;
    readonly template?: boolean;
    /** The newest version's author (their first character's name, else `#<account>`) and date. */
    readonly authorName?: string;
    readonly modifiedAt?: string | null;
}
