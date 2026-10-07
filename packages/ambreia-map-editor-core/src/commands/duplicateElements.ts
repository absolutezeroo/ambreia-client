import {LAYER_ID_PREFIX} from '../zone/LAYER_ID_PREFIX';
import type {LayerItem} from '../zone/LayerItem';
import type {LayerKey} from '../zone/LayerKey';
import {nextId} from '../zone/zoneGeometry';
import type {IEditorCommand} from './IEditorCommand';

/** Copies the elements under fresh ids (S§60: instantiated copies get unique ids). */
export const duplicateElements = <K extends LayerKey>(layer: K, ids: Iterable<string>): IEditorCommand =>
{
    const set = new Set(ids);

    return {
        label: set.size === 1 ? `Dupliquer ${[...set][0]}` : `Dupliquer ${set.size} éléments`,
        apply: doc =>
        {
            const sources = ((doc[layer] ?? []) as LayerItem<K>[]).filter(e => set.has((e as {id: string}).id));
            let next = doc;

            for(const source of sources)
            {
                const copy = {...source, id: nextId(next, LAYER_ID_PREFIX[layer])};

                next = {...next, [layer]: [...(next[layer] ?? []) as LayerItem<K>[], copy]};
            }

            return next;
        }
    };
};
