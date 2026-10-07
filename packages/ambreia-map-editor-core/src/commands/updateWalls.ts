import type {ZoneWalls} from '../zone/Zone.generated';
import type {IEditorCommand} from './IEditorCommand';

/** "Murs": visible, height, thickness (S§9). */
export const updateWalls = (patch: Partial<NonNullable<ZoneWalls>>): IEditorCommand => ({
    label: 'Murs',
    apply: doc =>
    {
        const walls = {...doc.walls ?? {}, ...patch};

        return JSON.stringify(walls) === JSON.stringify(doc.walls ?? {}) ? doc : {...doc, walls};
    }
});
