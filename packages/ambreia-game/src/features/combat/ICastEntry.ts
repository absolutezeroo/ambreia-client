/** A cast under way (RpgCastStart until its RpgCastEnd). */
export interface ICastEntry
{
    readonly skillId: string;
    /** On the monotonic clock. */
    readonly startedAt: number;
    readonly durationMs: number;
    readonly channel: boolean;
    readonly targetObjectId: number;
}
