import type {IEditorCommand} from './IEditorCommand';

/** The floor's thickness, on Habbo's scale: -2 very thin, -1 thin, 0 normal, 1 thick. */
export const setFloorThickness = (thickness: number): IEditorCommand => ({
    label: 'Épaisseur du sol',
    apply: doc => (doc.floor.thickness ?? 0) === thickness ? doc : {...doc, floor: {...doc.floor, thickness}}
});
