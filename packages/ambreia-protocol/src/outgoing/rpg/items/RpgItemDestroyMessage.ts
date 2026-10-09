/** Destroys part or all of a bag case's stack, for good. (Objets §17.1, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-items-design.md) */
export class RpgItemDestroyMessage
{
    constructor(
        readonly bagSlot: number,
        readonly quantity: number
    ) {}
}
