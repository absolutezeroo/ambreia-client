import type {CombatOverlay} from '../CombatOverlay';

/** What the choreography draws over the room: the numbers, the cast bars, a dead monster's bar going. */
export type ICombatMarks = Pick<CombatOverlay, 'hit' | 'startCast' | 'endCast' | 'remove'>;
