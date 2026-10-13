import type {IVfxSet, IVfxSheet} from '../IVfx';
import type {ICombatMarks} from './ICombatMarks';
import type {IVfxPlayer} from './IVfxPlayer';

/** What CombatChoreography reads and plays through. */
export interface IChoreographyDeps
{
    readonly vfx: IVfxPlayer;
    /** A sheet the client ships, by the content's name; null for art to come. */
    readonly sheet: (name: string) => IVfxSheet | null;
    /** The overlay, once the window manager is there. */
    readonly marks: () => ICombatMarks | null;
    /** A delayed effect of the current zone (ZoneTimers). */
    readonly later: (run: () => void, delayMs: number) => void;
    /** The killed one's auras end (AuraLayer.forget). */
    readonly forget: (objectId: number) => void;
    readonly isMonster: (objectId: number) => boolean;
    /** A monster's own art plays this pet gesture (`atk`, `hit`). */
    readonly gesture: (objectId: number, name: string) => void;
    /** The class of a combatant, '' when the client does not know it. */
    readonly classOf: (objectId: number) => string;
    /** What the content draws for a skill (its `vfx`). */
    readonly skillSet: (skillId: string) => IVfxSet | null;
    /** What the content draws for a class's basic attack. */
    readonly basicAttackSet: (classId: string) => IVfxSet | null;
}
