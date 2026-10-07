export interface IZoneSummary
{
    readonly key: string;
    readonly name: string;
    readonly roomId: number;
    readonly publishedVersion: number | null;
    readonly latestVersion: number;
    readonly lockedByAccountId: number | null;
}
