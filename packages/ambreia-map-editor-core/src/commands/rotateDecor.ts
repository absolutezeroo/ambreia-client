import type {IEditorCommand} from './IEditorCommand';
import {updateDecor} from './updateDecor';

/** Turns the objects a quarter clockwise: 0 → 2 → 4 → 6 → 0. */
export const rotateDecor = (ids: Iterable<string>): IEditorCommand =>
{
    const set = new Set(ids);

    return {
        label: set.size === 1 ? `Tourner ${[...set][0]}` : `Tourner ${set.size} objets`,
        apply: doc => updateDecor(doc, set, o => ({...o, rotation: ((o.rotation ?? 0) + 2) % 8}))
    };
};
