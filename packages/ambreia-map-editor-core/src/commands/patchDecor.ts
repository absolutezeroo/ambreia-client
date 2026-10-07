import type {ZoneDecorObject} from '../zone/Zone.generated';
import type {IEditorCommand} from './IEditorCommand';
import {updateDecor} from './updateDecor';

type DecorPatch = Partial<Pick<ZoneDecorObject, 'interaction' | 'tag' | 'collision' | 'state'>>;

/** The inspector's furni fields: interaction, tag, collision overrides, state. */
export const patchDecor = (id: string, patch: DecorPatch): IEditorCommand => ({
    label: `Propriétés de ${id}`,
    apply: doc => updateDecor(doc, new Set([id]), o =>
    {
        const next = {...o, ...patch};

        return JSON.stringify(next) === JSON.stringify(o) ? o : next;
    })
});
