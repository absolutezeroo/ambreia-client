export interface IRpgStatus
{
    readonly statusId: string;
    /** -1: no end (a boss phase's status, M1c): the client shows no timer for any status yet. */
    readonly remainingMs: number;
    readonly stacks: number;
}

/** A combatant's whole status list: empty means none left (M1b §7). */
export interface IRpgCombatantStatuses
{
    readonly objectId: number;
    readonly statuses: readonly IRpgStatus[];
}

/** The combatants whose statuses changed (M1b §10.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md). */
export class RpgStatusesMessage
{
    constructor(
        readonly combatants: readonly IRpgCombatantStatuses[]
    ) {}
}
