import type {RpgSkillSession} from '../RpgSkillSession';

/** What the skills window reads and changes of the skill session. */
export type ISkillBook = Pick<RpgSkillSession, 'known' | 'bar' | 'definitions' | 'definition' | 'statusDefinition' | 'setBar'>;
