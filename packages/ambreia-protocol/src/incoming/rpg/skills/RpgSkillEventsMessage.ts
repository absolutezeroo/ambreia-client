/** Where a skill landed, for its effect (M1b §10.2). */
export interface IRpgSkillImpact
{
    readonly casterObjectId: number;
    readonly skillId: string;
    readonly targetObjectId: number;
    readonly x: number;
    readonly y: number;
}

/** What a skill or a status did to one combatant. */
export interface IRpgSkillOutcome
{
    readonly sourceObjectId: number;
    /** A skill id or a status id (a dot, a hot). */
    readonly sourceId: string;
    readonly targetObjectId: number;
    readonly amount: number;
    /** Taken by a shield. */
    readonly absorbed: number;
    /** `hit`, `crit`, `dodge` or `heal`. */
    readonly outcome: string;
    readonly health: number;
    readonly maxHealth: number;
    readonly killed: boolean;
}

/** One tick of skills in the zone: the impacts, then the outcomes (M1b §10.2, vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md). */
export class RpgSkillEventsMessage
{
    constructor(
        readonly impacts: readonly IRpgSkillImpact[],
        readonly outcomes: readonly IRpgSkillOutcome[]
    ) {}
}
