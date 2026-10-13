/** The target as the server described it (RpgTarget). */
export interface ITargetInfo
{
    readonly objectId: number;
    /** `player`, `monster`. */
    readonly kind: string;
    readonly name: string;
    readonly level: number;
    readonly classId: string;
    /** `normal`, `elite`, `boss`. */
    readonly rank: string;
}
