/** One object of the zone the player can use, and how (F3b §7.2). */
export interface IRpgZoneInteractive
{
    /** The floor furni's id, as in the room's Objects. */
    readonly objectId: number;
    /** `door`, `lever`, `sign`, `teleport`, `sit`, `use`, or `interact` for a decor an Interact trigger listens to. */
    readonly interaction: string;
}

/**
 * The zone's usable objects, sent on entering a zone (F3b §7.2,
 * vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-interaction-design.md): every other
 * object of the decor is frozen. A zone without any sends an empty list.
 */
export class RpgZoneInteractivesMessage
{
    constructor(
        readonly objects: readonly IRpgZoneInteractive[]
    ) {}
}
