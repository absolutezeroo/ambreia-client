import type {RpgSkillsMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillsMessage';
import type {RpgSkillResultMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillResultMessage';
import type {RpgCastStartMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgCastStartMessage';
import type {RpgCastEndMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgCastEndMessage';
import type {RpgStatusesMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgStatusesMessage';
import type {RpgSkillEventsMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillEventsMessage';
import type {RpgTelegraphsMessage} from '@ambreia/protocol/incoming/rpg/skills/RpgTelegraphsMessage';

/**
 * What the skills session announces, once the combat model has the state (statuses, casts,
 * cooldowns): the views and visuals react to these; they never keep the state themselves.
 */
export interface IRpgSkillSessionEvents
{
    skills: [RpgSkillsMessage];
    result: [RpgSkillResultMessage];
    castStart: [RpgCastStartMessage];
    castEnd: [RpgCastEndMessage];
    cooldowns: [];
    statuses: [RpgStatusesMessage];
    events: [RpgSkillEventsMessage];
    /** Telegraphed casts began (M1c): the cells they will hit. */
    telegraphs: [RpgTelegraphsMessage];
}
