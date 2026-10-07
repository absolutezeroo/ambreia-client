import type {IEditorCommand} from './IEditorCommand';
import {updateDecor} from './updateDecor';

/** Moves the objects by (dx, dy) cells and dz height units; a locked object stays put. */
export const moveDecor = (ids: Iterable<string>, dx: number, dy: number, dz = 0): IEditorCommand =>
{
    const set = new Set(ids);

    return {
        label: set.size === 1 ? `Déplacer ${[...set][0]}` : `Déplacer ${set.size} objets`,
        apply: doc => dx === 0 && dy === 0 && dz === 0 ? doc : updateDecor(doc, set, o => ({
            ...o,
            x: o.x + dx,
            y: o.y + dy,
            z: Math.max(0, (o.z ?? 0) + dz)
        }))
    };
};
