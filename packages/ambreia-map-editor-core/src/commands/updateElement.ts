import type {LayerItem} from '../zone/LayerItem';
import type {LayerKey} from '../zone/LayerKey';
import type {IEditorCommand} from './IEditorCommand';

/** Merges patch into the element of that id; the same document when it changes nothing. */
export const updateElement = <K extends LayerKey>(layer: K, id: string, patch: Partial<LayerItem<K>>, label = `Modifier ${id}`): IEditorCommand => ({
    label,
    apply: doc =>
    {
        const items = (doc[layer] ?? []) as LayerItem<K>[];
        const index = items.findIndex(e => (e as {id: string}).id === id);

        if(index < 0) return doc;

        const next = {...items[index], ...patch};

        if(JSON.stringify(next) === JSON.stringify(items[index])) return doc;

        const copy = [...items];

        copy[index] = next;

        return {...doc, [layer]: copy};
    }
});
