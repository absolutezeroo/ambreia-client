import type {LayerItem} from '../zone/LayerItem';
import type {LayerKey} from '../zone/LayerKey';
import type {IEditorCommand} from './IEditorCommand';

export const removeElements = <K extends LayerKey>(layer: K, ids: Iterable<string>): IEditorCommand =>
{
    const set = new Set(ids);

    return {
        label: set.size === 1 ? `Supprimer ${[...set][0]}` : `Supprimer ${set.size} éléments`,
        apply: doc =>
        {
            const items = (doc[layer] ?? []) as LayerItem<K>[];
            const kept = items.filter(e => !set.has((e as {id: string}).id));

            return kept.length === items.length ? doc : {...doc, [layer]: kept};
        }
    };
};
