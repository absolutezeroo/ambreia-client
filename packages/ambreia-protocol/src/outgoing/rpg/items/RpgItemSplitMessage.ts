/** Splits part of a stack into an empty case. (Objets §17.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md) */
export class RpgItemSplitMessage
{
    constructor(
        readonly from: number,
        readonly quantity: number,
        /** The empty case the part goes to. */
        readonly to: number
    ) {}
}
