import type {IEditorCommand} from './IEditorCommand';
import {updateDecor} from './updateDecor';

export const setDecorState = (id: string, state: number): IEditorCommand => ({
    label: `État ${state} pour ${id}`,
    apply: doc => updateDecor(doc, new Set([id]), o => (o.state ?? 0) === state ? o : {...o, state})
});
