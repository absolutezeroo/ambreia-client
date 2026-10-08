/**
 * The answer to a creation, a class choice or an entry into the world: `ok` or an error code the
 * client translates (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md, §6.3).
 */
export class RpgCharacterResultMessage
{
    static readonly ACTION_CREATE = 1;
    static readonly ACTION_CHOOSE_CLASS = 2;
    static readonly ACTION_ENTER_WORLD = 3;

    constructor(
        readonly action: number,
        /** `ok`, `character.name_taken`, `rate_limited`… */
        readonly code: string,
        /** 0 when there is none. */
        readonly playerId: number
    ) {}
}
