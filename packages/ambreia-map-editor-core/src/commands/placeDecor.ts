import type {ZoneDecorObject} from '../zone/Zone.generated';
import {nextId} from '../zone/zoneGeometry';
import type {IEditorCommand} from './IEditorCommand';

/** Places a furniture; its id is the class name plus the first free number. */
export const placeDecor = (object: Omit<ZoneDecorObject, 'id'>): IEditorCommand => ({
    label: `Poser ${object.class}`,
    apply: doc => ({
        ...doc,
        decor: [...(doc.decor ?? []), {id: nextId(doc, object.class), ...object}]
    })
});
