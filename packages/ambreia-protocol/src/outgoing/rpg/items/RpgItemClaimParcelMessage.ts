/** Moves a waiting parcel into the bag. (Objets §17.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md) */
export class RpgItemClaimParcelMessage
{
    constructor(
        /** The parcel's slot. */
        readonly parcel: number
    ) {}
}
