import {nextId} from '../zone/zoneGeometry';
import type {IEditorCommand} from './IEditorCommand';

/** "Spawn joueur" on a cell: an arrival entry there, or none. */
export const toggleSpawn = (x: number, y: number): IEditorCommand => ({
    label: `Spawn joueur en (${x},${y})`,
    apply: doc =>
    {
        const entries = doc.entries ?? [];
        const here = (e: (typeof entries)[number]) => e.kind === 'arrival' && e.cell.x === x && e.cell.y === y;

        return entries.some(here)
            ? {...doc, entries: entries.filter(e => !here(e))}
            : {...doc, entries: [...entries, {id: nextId(doc, 'spawn'), kind: 'arrival', cell: {x, y}}]};
    }
});
