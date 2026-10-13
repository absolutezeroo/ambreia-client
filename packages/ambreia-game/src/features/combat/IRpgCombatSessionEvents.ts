import type {RpgCombatEventsMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatEventsMessage';
import type {RpgMonsterYellMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgMonsterYellMessage';
import type {IRpgSkillImpact, IRpgSkillOutcome} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillEventsMessage';

/**
 * What the combat session announces for the visuals only (the blows' and skills' effects, a yell,
 * a mark): the state of the fight is the model's (ICombatModel), never these.
 */
export interface IRpgCombatSessionEvents
{
    hits: [RpgCombatEventsMessage];
    /** A monster yells (M1c: a boss's phase). */
    yell: [RpgMonsterYellMessage];
    /** Where skills landed (M1b RpgSkillEvents, reported by features/skills): announced before their outcomes. */
    impacts: [readonly IRpgSkillImpact[]];
    /** What skills and statuses did (M1b RpgSkillEvents, reported by features/skills). */
    outcomes: [readonly IRpgSkillOutcome[]];
    /** What holds this combatant back (a slow, a stun: its status icon), reported by features/skills; null: nothing. */
    mark: [objectId: number, icon: string | null];
}
