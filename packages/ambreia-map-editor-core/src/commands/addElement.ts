import type {LayerItem} from '../zone/LayerItem';
import type {LayerKey} from '../zone/LayerKey';
import type {IEditorCommand} from './IEditorCommand';

/** Adds an element to a world layer (one undo step). */
export const addElement = <K extends LayerKey>(layer: K, element: LayerItem<K>): IEditorCommand => ({
    label: `Ajouter ${(element as {id: string}).id}`,
    apply: doc => ({...doc, [layer]: [...(doc[layer] ?? []) as LayerItem<K>[], element]})
});
