/** Creates a character; it is born in the starter class ("Sans classe"). (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md) */
export class RpgCharacterCreateMessage
{
    constructor(
        readonly name: string,
        readonly figure: string,
        /** `M` or `F`. */
        readonly gender: string
    ) {}
}
