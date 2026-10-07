import type {IEditorCommand} from './IEditorCommand';

/** Removes the objects; a locked one stays. */
export const removeDecor = (ids: Iterable<string>): IEditorCommand =>
{
    const set = new Set(ids);

    return {
        label: set.size === 1 ? `Supprimer ${[...set][0]}` : `Supprimer ${set.size} objets`,
        apply: doc =>
        {
            const decor = (doc.decor ?? []).filter(o => !set.has(o.id) || o.locked);

            return decor.length === (doc.decor ?? []).length ? doc : {...doc, decor};
        }
    };
};
