import type {IEditorCommand} from './IEditorCommand';

/** "Verrouiller la position": a locked object ignores move, turn and delete until unlocked. */
export const setDecorLocked = (ids: Iterable<string>, locked: boolean): IEditorCommand =>
{
    const set = new Set(ids);

    return {
        label: `${locked ? 'Verrouiller' : 'Déverrouiller'} ${set.size === 1 ? [...set][0] : `${set.size} objets`}`,
        apply: doc =>
        {
            let changed = false;
            const decor = (doc.decor ?? []).map(o =>
            {
                if(!set.has(o.id) || !!o.locked === locked) return o;

                changed = true;

                return {...o, locked};
            });

            return changed ? {...doc, decor} : doc;
        }
    };
};
