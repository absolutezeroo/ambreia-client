import type {ITargetOfTarget} from '../../hud/ITargetOfTarget';
import type {ICombatModel} from '../ICombatModel';

/** A room object's name and level, as the room knows it; null for one not named yet. */
export type WhoIs = (objectId: number) => {name: string; level: number | null} | null;

/**
 * Whom the player's target aims at (M1d §4), from the model: null without a target, when it aims
 * at nothing, or at an object the room has not named yet (its users can follow its aims).
 */
export function targetOfTarget(model: ICombatModel, who: WhoIs): ITargetOfTarget | null
{
    const target = model.target;
    const aimed = target ? model.targetOf(target.objectId) : 0;
    const known = aimed === 0 ? null : who(aimed);

    if(!known) return null;

    const vitals = model.vitalsOf(aimed);

    return {objectId: aimed, name: known.name, level: known.level, hp: vitals?.health ?? null, hpMax: vitals?.maxHealth ?? null, onPlayer: aimed === model.ownObjectId};
}
