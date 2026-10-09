/** Moves a bag case onto another: moves, merges a stack or swaps. (Objets §17.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md) */
export class RpgItemMoveMessage
{
    constructor(
        readonly from: number,
        readonly to: number
    ) {}
}
