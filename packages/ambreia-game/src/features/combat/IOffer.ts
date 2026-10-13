/** A healer's offer to raise the KO player (RpgResurrectOffer), until `expiresAt`. */
export interface IOffer
{
    readonly casterObjectId: number;
    readonly healthPercent: number;
    /** On the monotonic clock. */
    readonly expiresAt: number;
}
