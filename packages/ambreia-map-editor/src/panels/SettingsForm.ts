import {updateSettings} from '@ambreia/map-editor-core/commands/updateSettings';
import type {ZoneSettings} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {EditorApp} from '../app/EditorApp';
import {esc} from './html';

const TYPES = ['World', 'Dungeon', 'Lobby', 'Housing', 'Guild', 'Arena'] as const;
const TYPE_LABELS: Record<(typeof TYPES)[number], string> = {World: 'Monde', Dungeon: 'Donjon', Lobby: 'Lobby', Housing: 'Logement', Guild: 'Guilde', Arena: 'Arène'};

/** "Paramètres de la salle": the zone's settings, written back as one undoable command per field. */
export class SettingsForm
{
    private _shown: ZoneSettings | null = null;

    constructor(readonly element: HTMLElement, private readonly _app: EditorApp, private readonly _title: string)
    {
        element.addEventListener('change', e =>
        {
            const input = e.target as HTMLInputElement;
            const field = (input.dataset.field ?? null) as keyof ZoneSettings | null;

            if(!field) return;

            const value = input.type === 'checkbox' ? input.checked
                : input.type === 'number' ? (input.value === '' ? undefined : Number(input.value))
                    : input.value.trim() || undefined;

            _app.execute(updateSettings({[field]: value}));
        });
    }

    render(): void
    {
        const s = this._app.doc.settings;

        // Rebuilt only when the settings change, so typing is never interrupted.
        if(s === this._shown) return;
        this._shown = s;

        this.element.innerHTML = `
            <h2 class="panel-title">${esc(this._title)}</h2>
            <div class="form">
                <label>MapId <input value="${esc(s.id)}" disabled></label>
                <label>Nom <input data-field="name" value="${esc(s.name)}" required></label>
                <label>Région <input data-field="region" value="${esc(s.region ?? '')}" placeholder="FR - France"></label>
                <label>Capacité <input type="number" data-field="capacity" min="1" max="500" value="${s.capacity ?? ''}" placeholder="50"></label>
                <label>Type de map
                    <select data-field="type">${TYPES.map(t => `<option value="${t}" ${(s.type ?? 'World') === t ? 'selected' : ''}>${TYPE_LABELS[t]}</option>`).join('')}</select>
                </label>
                <label>Niveau conseillé <input type="number" data-field="recommendedLevel" min="1" max="200" value="${s.recommendedLevel ?? ''}"></label>
                <label class="check"><input type="checkbox" data-field="pvpAllowed" ${s.pvpAllowed ? 'checked' : ''}> PvP autorisé</label>
                <label>Musique <input data-field="music" value="${esc(s.music ?? '')}" placeholder="hotel_lobby"></label>
                <label>Météo <input data-field="weather" value="${esc(s.weather ?? '')}" placeholder="pluie, neige…"></label>
                <label class="check"><input type="checkbox" data-field="template" ${s.template ? 'checked' : ''}> Modèle (copiable à la création d'une zone)</label>
            </div>`;
    }
}
