import type {ZoneFloor} from '../zone/Zone.generated';
import type {IEditorCommand} from './IEditorCommand';

/** A room template: the whole floor at once, door included. The decor stays where it was. */
export const replaceFloor = (label: string, floor: ZoneFloor): IEditorCommand => ({
    label: `Modèle : ${label}`,
    apply: doc => ({...doc, floor})
});
