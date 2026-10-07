import type {ZoneSettings} from '../zone/Zone.generated';
import type {IEditorCommand} from './IEditorCommand';

/** "Paramètres de la salle": name, region, type, capacity, PvP, music… The id stays the zone key. */
export const updateSettings = (patch: Partial<Omit<ZoneSettings, 'id'>>): IEditorCommand => ({
    label: 'Paramètres de la salle',
    apply: doc =>
    {
        const settings = {...doc.settings, ...patch, id: doc.settings.id};

        return JSON.stringify(settings) === JSON.stringify(doc.settings) ? doc : {...doc, settings};
    }
});
