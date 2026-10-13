/** A healer offers to raise the KO player (M1d §2.1, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md); the newest offer replaces the pending one. */
export class RpgResurrectOfferMessage
{
    constructor(
        readonly casterObjectId: number,
        readonly healthPercent: number,
        readonly expiresMs: number
    ) {}
}
