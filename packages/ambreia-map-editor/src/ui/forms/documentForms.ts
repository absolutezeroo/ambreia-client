import {updateWalls} from '@ambreia/map-editor-core/commands/updateWalls';
import {updateAmbience} from '@ambreia/map-editor-core/commands/updateAmbience';
import {setFloorThickness} from '@ambreia/map-editor-core/commands/setFloorThickness';
import type {EditorApp} from '../../app/EditorApp';
import type {IFieldSpec} from './IFieldSpec';

type Form = {readonly title: string; readonly hint: string; readonly fields: IFieldSpec[]};

/** Habbo's thickness scale for walls and floor; the server reads an old 2 or 3 as thick. */
const THICKNESS: readonly (readonly [string, string])[] = [['-2', 'Très fin'], ['-1', 'Fin'], ['0', 'Normal'], ['1', 'Épais']];
const thickness = (value = 0): string => String(Math.max(-2, Math.min(1, value)));

/** "Murs": shown or not, their height and thickness, and the floor's thickness (S§9). */
export function wallsForm(app: EditorApp): Form
{
    const walls = () => app.doc.walls ?? {};

    return {
        title: 'Murs',
        hint: 'Les murs du fond de la salle, comme dans Habbo. La porte reste toujours ouverte.',
        fields: [
            {kind: 'check', label: 'Murs visibles', get: () => walls().visible !== false, set: v => app.execute(updateWalls({visible: !!v}))},
            {kind: 'number', label: 'Hauteur', get: () => walls().height ?? 0, set: v => app.execute(updateWalls({height: Number(v)})), min: 0, max: 16},
            {kind: 'select', label: 'Épaisseur', get: () => thickness(walls().thickness), set: v => app.execute(updateWalls({thickness: Number(v)})), options: THICKNESS},
            {kind: 'select', label: 'Épaisseur du sol', get: () => thickness(app.doc.floor.thickness), set: v => app.execute(setFloorThickness(Number(v))), options: THICKNESS}
        ]
    };
}

/** "Ambiance": tint, brightness, day and night (S§35); the client draws them when it can. */
export function ambienceForm(app: EditorApp): Form
{
    const ambience = () => app.doc.ambience ?? {};

    return {
        title: 'Ambiance',
        hint: 'La lumière de la zone. Le client l\'appliquera quand son rendu le permettra (J4) ; le serveur l\'enregistre déjà.',
        fields: [
            {kind: 'text', label: 'Teinte (#rrggbb)', get: () => ambience().tint ?? '', set: v => app.execute(updateAmbience({tint: String(v).trim() || undefined}))},
            {kind: 'number', label: 'Luminosité (%)', get: () => ambience().brightness ?? 100, set: v => app.execute(updateAmbience({brightness: Number(v)})), min: 0, max: 100},
            {kind: 'check', label: 'Cycle jour / nuit', get: () => !!ambience().dayNight, set: v => app.execute(updateAmbience({dayNight: !!v}))},
            {kind: 'section', label: 'Musique et météo'},
            {kind: 'text', label: 'Musique', get: () => app.doc.settings.music ?? '', readOnly: true},
            {kind: 'text', label: 'Météo', get: () => app.doc.settings.weather ?? '', readOnly: true}
        ]
    };
}
