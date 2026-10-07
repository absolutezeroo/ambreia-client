import type {ZoneDecorObject} from '../zone/Zone.generated';
import {nextId} from '../zone/zoneGeometry';
import type {IEditorCommand} from './IEditorCommand';

/** Pastes copies shifted by (dx, dy): each one a fresh id, never locked. Copy, paste and duplicate. */
export const pasteDecor = (objects: readonly ZoneDecorObject[], dx: number, dy: number): IEditorCommand => ({
    label: objects.length === 1 ? `Coller ${objects[0].class}` : `Coller ${objects.length} objets`,
    apply: doc =>
    {
        if(!objects.length) return doc;

        let next = doc;

        for(const o of objects)
        {
            const copy = {...o, id: nextId(next, o.class), x: o.x + dx, y: o.y + dy, locked: false};

            next = {...next, decor: [...next.decor ?? [], copy]};
        }

        return next;
    }
});
