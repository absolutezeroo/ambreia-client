import {editTiles} from '@ambreia/map-editor-core/commands/editTiles';
import {moveDecor} from '@ambreia/map-editor-core/commands/moveDecor';
import {patchDecor} from '@ambreia/map-editor-core/commands/patchDecor';
import {rotateDecor} from '@ambreia/map-editor-core/commands/rotateDecor';
import {toggleSpawn} from '@ambreia/map-editor-core/commands/toggleSpawn';
import {furnitureCategory} from '@ambreia/map-editor-core/palette/furnitureCategory';
import type {ZoneDecorObject, ZoneDocument} from '@ambreia/map-editor-core/zone/Zone.generated';
import {tileAt} from '@ambreia/map-editor-core/zone/zoneGeometry';
import type {EditorApp} from '../app/EditorApp';
import {FurnitureSprites} from '../view/FurnitureSprites';
import {CatalogPanel} from './CatalogPanel';
import {esc} from './html';
import {SettingsForm} from './SettingsForm';

const CATEGORY_LABELS: Record<string, string> = {
    seats: 'Sièges', tables: 'Tables', decor: 'Décorations', plants: 'Plantes', lights: 'Lumières', floors: 'Sols', rares: 'Rares', misc: 'Divers'
};
const INTERACTIONS: readonly [string, string][] = [
    ['', 'Aucune'], ['sit', 'S\'asseoir'], ['lay', 'S\'allonger'], ['use', 'Utiliser'], ['door', 'Porte'], ['teleport', 'Téléporteur'], ['chest', 'Coffre']
];

/** The right column: the selected furni, the selected cells, or the room's settings. */
export class PropertiesPanel
{
    private readonly _settings: SettingsForm;
    private readonly _main = document.createElement('div');
    private _shown: {doc: ZoneDocument; selection: unknown} | null = null;

    constructor(private readonly _root: HTMLElement, private readonly _app: EditorApp)
    {
        const settings = document.createElement('div');

        this._settings = new SettingsForm(settings, _app, 'Paramètres de la salle');
        _root.replaceChildren(this._main, settings);
        this._main.addEventListener('change', e => this.change(e.target as HTMLInputElement));
        this._main.addEventListener('click', e => this.click(e.target as HTMLElement));
    }

    render(): void
    {
        const app = this._app;

        this._settings.render();

        // Rebuilt only when the document or the selection changes, so typing is never interrupted.
        if(this._shown?.doc === app.doc && this._shown.selection === app.selection) return;
        this._shown = {doc: app.doc, selection: app.selection};

        const ids = app.selection.ids;
        const decor = (app.doc.decor ?? []).filter(o => ids.has(o.id));

        if(decor.length === 1) this._main.innerHTML = this.furni(decor[0]);
        else if(decor.length > 1)
        {
            this._main.innerHTML = `
                <h2 class="panel-title">${decor.length} mobis sélectionnés</h2>
                <div class="form actions">
                    <button data-do="rotate">⟳ Tourner</button>
                    <button data-do="duplicate">⧉ Dupliquer</button>
                    <button data-do="lock">🔒 Verrouiller / déverrouiller</button>
                    <button data-do="delete" class="danger">✖ Supprimer</button>
                </div>`;
        }
        else if(app.selection.cells.length) this._main.innerHTML = this.cells();
        else this._main.innerHTML = '';
    }

    private furni(o: ZoneDecorObject): string
    {
        const f = this._app.furniture(o.definition);
        const favorite = CatalogPanel.FAVORITES.isFavorite(o.definition);
        const states = Math.max(1, f?.states ?? 1);
        const walkable = o.collision?.walkable ?? f?.canWalk ?? false;
        const seat = o.collision?.seat ?? f?.canSit ?? false;

        return `
            <h2 class="panel-title">Propriétés du mobi</h2>
            <div class="furni-card">
                <img alt="" src="${FurnitureSprites.picture(o.class, o.rotation ?? 0, o.state ?? 0)}" onerror="this.style.visibility='hidden'">
                <div>
                    <b>${esc(o.class)}</b>
                    <div class="muted"><code>${esc(o.id)}</code></div>
                    <div class="muted">${f ? `${f.width}×${f.length} · ${CATEGORY_LABELS[furnitureCategory(o.class)]}` : '<b>définition inconnue</b>'}</div>
                </div>
                <button class="star ${favorite ? 'on' : ''}" data-do="favorite" title="Favori">★</button>
            </div>
            <div class="form">
                <label>Furni ID <input value="${o.definition}" disabled></label>
                <h3>Position</h3>
                <div class="grid3">
                    <label>X <input type="number" data-field="x" value="${o.x}" ${o.locked ? 'disabled' : ''}></label>
                    <label>Y <input type="number" data-field="y" value="${o.y}" ${o.locked ? 'disabled' : ''}></label>
                    <label>Z <input type="number" data-field="z" step="0.5" min="0" value="${o.z ?? 0}" ${o.locked ? 'disabled' : ''}></label>
                </div>
                <div class="radios">Rotation ${[0, 2, 4, 6].map(r => `
                    <label><input type="radio" name="rotation" data-field="rotation" value="${r}" ${(o.rotation ?? 0) === r ? 'checked' : ''} ${o.locked ? 'disabled' : ''}> ${r}</label>`).join('')}
                </div>
                <label>État
                    <select data-field="state">${Array.from({length: states}, (_, s) => `<option value="${s}" ${(o.state ?? 0) === s ? 'selected' : ''}>${s === 0 ? 'Normal (0)' : `État ${s}`}</option>`).join('')}</select>
                </label>
                <label class="check"><input type="checkbox" data-field="walkable" ${walkable ? 'checked' : ''}> Walkable</label>
                <label class="check"><input type="checkbox" data-field="seat" ${seat ? 'checked' : ''}> Assise</label>
                <label>Interaction
                    <select data-field="interaction">${INTERACTIONS.map(([v, l]) => `<option value="${v}" ${(o.interaction ?? '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
                </label>
                <label>Tag <input data-field="tag" value="${esc(o.tag ?? '')}" placeholder="sofa_club"></label>
            </div>
            <div class="form actions">
                <button data-do="duplicate">⧉ Dupliquer</button>
                <button data-do="copy">📄 Copier</button>
                <button data-do="delete" class="danger" ${o.locked ? 'disabled' : ''}>✖ Supprimer</button>
                <button data-do="lock">${o.locked ? '🔓 Déverrouiller la position' : '🔒 Verrouiller la position'}</button>
            </div>`;
    }

    private cells(): string
    {
        const app = this._app;
        const cells = app.selection.cells;
        const first = cells[0];
        const tile = tileAt(app.doc.floor, first.x ?? 0, first.y ?? 0) ?? {};
        const spawn = (app.doc.entries ?? []).some(e => e.kind === 'arrival' && e.cell.x === first.x && e.cell.y === first.y);
        const zones = (app.doc.zones ?? []).map(z => z.id);

        return `
            <h2 class="panel-title">Propriétés de la case</h2>
            <div class="form">
                ${cells.length === 1
                    ? `<div class="grid3"><label>X <input value="${first.x}" disabled></label><label>Y <input value="${first.y}" disabled></label></div>`
                    : `<p class="muted">${cells.length} cases : les valeurs s'appliquent à toutes.</p>`}
                <label>Hauteur <input type="number" data-field="height" min="0" max="32" value="${tile.height ?? 0}"></label>
                <label class="check"><input type="checkbox" data-field="walkable" ${tile.walkable === false ? '' : 'checked'}> Walkable</label>
                <label class="check"><input type="checkbox" data-field="hole" ${tile.hole ? 'checked' : ''}> Trou (hole)</label>
                ${cells.length === 1 ? `<label class="check"><input type="checkbox" data-field="spawn" ${spawn ? 'checked' : ''}> Spawn joueur</label>` : ''}
                <label>Zone
                    <select data-field="zone"><option value="">Aucune</option>${zones.map(z => `<option ${tile.zone === z ? 'selected' : ''}>${esc(z)}</option>`).join('')}</select>
                </label>
                <label>Notes <textarea data-field="note" rows="3">${esc(tile.note ?? '')}</textarea></label>
            </div>`;
    }

    private change(input: HTMLInputElement): void
    {
        const app = this._app;
        const field = input.dataset.field;
        const ids = app.selection.ids;
        const o = app.doc.decor?.find(d => ids.has(d.id));
        const cells = app.selection.cells;
        const value = Number(input.value);

        if(o)
        {
            switch(field)
            {
                case 'x':
                case 'y':
                case 'z':
                    if(Number.isFinite(value))
                    {
                        app.execute(moveDecor(ids, field === 'x' ? value - o.x : 0, field === 'y' ? value - o.y : 0, field === 'z' ? value - (o.z ?? 0) : 0));
                    }
                    break;
                case 'rotation':
                    for(let r = o.rotation ?? 0; r !== value; r = (r + 2) % 8) app.execute(rotateDecor([o.id]));
                    break;
                case 'state':
                    app.execute(patchDecor(o.id, {state: value}));
                    break;
                case 'walkable':
                case 'seat':
                    app.execute(patchDecor(o.id, {collision: {...o.collision ?? {}, [field]: input.checked}}));
                    break;
                case 'interaction':
                case 'tag':
                    app.execute(patchDecor(o.id, {[field]: input.value.trim() || null}));
                    break;
            }

            return;
        }

        if(!cells.length) return;

        switch(field)
        {
            case 'height':
                if(Number.isFinite(value)) app.execute(editTiles(`Hauteur ${value}`, cells, t => ({...t, height: value})));
                break;
            case 'walkable':
                app.execute(editTiles(input.checked ? 'Rendre marchable' : 'Bloquer', cells, t => ({...t, walkable: input.checked})));
                break;
            case 'hole':
                app.execute(editTiles(input.checked ? 'Creuser' : 'Boucher', cells, t => ({...t, hole: input.checked})));
                break;
            case 'spawn':
                app.execute(toggleSpawn(cells[0].x ?? 0, cells[0].y ?? 0));
                break;
            case 'zone':
                app.execute(editTiles('Zone de la case', cells, t => ({...t, zone: input.value || null})));
                break;
            case 'note':
                app.execute(editTiles('Note de la case', cells, t => ({...t, note: input.value.trim() || null})));
                break;
        }
    }

    private click(target: HTMLElement): void
    {
        const app = this._app;
        const action = target.closest<HTMLElement>('[data-do]')?.dataset.do;
        const o = app.doc.decor?.find(d => app.selection.ids.has(d.id));

        if(action === 'rotate') app.rotateSelection();
        if(action === 'duplicate') app.duplicate();
        if(action === 'copy') app.copy();
        if(action === 'delete') app.deleteSelection();
        if(action === 'lock') app.toggleLock();
        if(action === 'favorite' && o)
        {
            CatalogPanel.FAVORITES.toggle(o.definition);
            this._shown = null;
            this.render();
        }
    }
}
