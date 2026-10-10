/** One telegraphed cast: the cells it will hit, as the server computed them (M1c §9). */
export interface IRpgTelegraph
{
    /** The caster's room object id: its RpgCastEnd clears the telegraph. */
    readonly casterObjectId: number;
    readonly skillId: string;
    /** `circle`, `line` or `cone`: informative, the cells are the area. */
    readonly shape: string;
    /** Until the impact; in a room's entry burst, what is left of it. */
    readonly delayMs: number;
    readonly cells: readonly {readonly x: number; readonly y: number}[];
}

/**
 * Telegraphed casts that began, grouped by tick, sent to the whole room and in its entry state (M1c
 * §9, vortex-rpg-emulator/docs/superpowers/specs/2026-10-10-rpg-monsters-m1c-design.md).
 */
export class RpgTelegraphsMessage
{
    constructor(
        readonly telegraphs: readonly IRpgTelegraph[]
    ) {}
}
