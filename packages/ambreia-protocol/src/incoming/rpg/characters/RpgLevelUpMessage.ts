import type {IRpgStatBlock} from './IRpgStatBlock';

/** The player gained one or more levels on one XP gain (M1d §2.1, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md, decision 1 of the plan). */
export class RpgLevelUpMessage
{
    constructor(
        readonly fromLevel: number,
        readonly toLevel: number,
        readonly statsBefore: IRpgStatBlock,
        readonly statsAfter: IRpgStatBlock,
        readonly skillsLearned: readonly string[]
    ) {}
}
