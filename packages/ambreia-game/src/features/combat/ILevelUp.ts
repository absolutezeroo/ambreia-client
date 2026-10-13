import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';

/** One XP gain that raised the level (RpgLevelUp): the stats before and after, the skills learned. */
export interface ILevelUp
{
    readonly fromLevel: number;
    readonly toLevel: number;
    readonly statsBefore: IRpgStatBlock;
    readonly statsAfter: IRpgStatBlock;
    readonly skillsLearned: readonly string[];
}
