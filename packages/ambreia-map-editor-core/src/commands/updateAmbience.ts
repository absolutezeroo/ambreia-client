import type {ZoneAmbience} from '../zone/Zone.generated';
import type {IEditorCommand} from './IEditorCommand';

/** "Ambiance": tint, brightness, day and night (S§35). */
export const updateAmbience = (patch: Partial<NonNullable<ZoneAmbience>>): IEditorCommand => ({
    label: 'Ambiance',
    apply: doc =>
    {
        const ambience = {...doc.ambience ?? {}, ...patch};

        return JSON.stringify(ambience) === JSON.stringify(doc.ambience ?? {}) ? doc : {...doc, ambience};
    }
});
