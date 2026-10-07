import type {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {editTiles} from '@ambreia/map-editor-core/commands/editTiles';
import type {IEditorCommand} from '@ambreia/map-editor-core/commands/IEditorCommand';
import {moveDecor} from '@ambreia/map-editor-core/commands/moveDecor';
import {moveDoor} from '@ambreia/map-editor-core/commands/moveDoor';
import {placeDecor} from '@ambreia/map-editor-core/commands/placeDecor';
import {removeDecor} from '@ambreia/map-editor-core/commands/removeDecor';
import {resizeFloor} from '@ambreia/map-editor-core/commands/resizeFloor';
import {rotateDecor} from '@ambreia/map-editor-core/commands/rotateDecor';
import {setDecorState} from '@ambreia/map-editor-core/commands/setDecorState';
import {EditorHistory} from '@ambreia/map-editor-core/history/EditorHistory';
import type {LayerName} from '@ambreia/map-editor-core/layers/LayerName';
import {LayerState} from '@ambreia/map-editor-core/layers/LayerState';
import {EditorSelection} from '@ambreia/map-editor-core/selection/EditorSelection';
import type {IZoneFinding} from '@ambreia/map-editor-core/validation/IZoneFinding';
import {validateLocally} from '@ambreia/map-editor-core/validation/validateLocally';
import type {ZoneDocument, ZoneTile} from '@ambreia/map-editor-core/zone/Zone.generated';
import {nextId, tileAt, tileIndex} from '@ambreia/map-editor-core/zone/zoneGeometry';
import {$, describe, esc} from '../panels/html';
import {PalettePanel} from '../panels/PalettePanel';
import type {IPick} from '../view/IPick';
import {IsoView} from '../view/IsoView';
import type {ToolName} from './ToolName';
import {TOOLS} from './TOOLS';

const LAYER_LABELS: Record<LayerName, string> = {floor: 'Sol', door: 'Porte', decor: 'Mobis', wallDecor: 'Mobis muraux'};
const GAME_CLIENT = 'http://localhost:5173/';

type Cell = {readonly x: number; readonly y: number};

/**
 * One open zone: the panels around the view, the tools, save and publish. Resolves run() when
 * the user goes back to the zone list.
 */
export class EditorApp
{
    private readonly _history: EditorHistory;
    private readonly _layers = new LayerState();
    private readonly _furniture: Map<number, IFurniturePaletteEntry>;
    private readonly _view: IsoView;
    private _selection = EditorSelection.EMPTY;
    private _tool: ToolName = 'select';
    private _choice: IFurniturePaletteEntry | null = null;
    private _serverFindings: IZoneFinding[] = [];
    private _savedVersion: number | null;
    private _publishedVersion: number | null;
    private _hover: Cell | null = null;
    private _stroke = new Map<number, Cell>();
    private _dragFrom: Cell | null = null;
    private _dragTo: Cell | null = null;
    private _rectFrom: Cell | null = null;
    private _status = '';
    private _busy = false;
    private _close: () => void = () => undefined;

    constructor(
        private readonly _root: HTMLElement,
        private readonly _api: EditorApiClient,
        private readonly _zone: IZoneSummary,
        doc: ZoneDocument,
        palette: readonly IFurniturePaletteEntry[]
    )
    {
        this._history = new EditorHistory(doc);
        this._furniture = new Map(palette.map(p => [p.definition, p]));
        this._savedVersion = _zone.latestVersion || null;
        this._publishedVersion = _zone.publishedVersion;

        _root.innerHTML = `
            <div class="editor">
                <header class="topbar">
                    <button data-action="zones" title="Revenir à la liste des zones">☰ Zones</button>
                    <span class="title">${esc(_zone.name)} <code>${esc(_zone.key)}</code></span>
                    <button data-action="undo" title="Annuler (Ctrl+Z)">↶</button>
                    <button data-action="redo" title="Refaire (Ctrl+Y)">↷</button>
                    <button data-action="save" class="primary" title="Enregistrer une version (Ctrl+S)">Enregistrer</button>
                    <button data-action="publish" title="Publier la dernière version : la room se recharge">Publier</button>
                    <button data-action="test" title="Publier si besoin, puis ouvrir le client du jeu">▶ Tester</button>
                    <span class="status"></span>
                </header>
                <nav class="tools">${TOOLS.map(t => `<button data-tool="${t.name}" title="${esc(t.label)} (${t.key})">${t.icon}</button>`).join('')}</nav>
                <aside class="palette"></aside>
                <main class="stage"><canvas></canvas><div class="hud muted"></div></main>
                <aside class="inspector"></aside>
                <footer class="bottom">
                    <section><h3>Calques</h3><div class="layers"></div></section>
                    <section><h3>Historique</h3><ol class="history"></ol></section>
                    <section><h3>Constats</h3><ul class="findings"></ul></section>
                </footer>
            </div>`;

        this._view = new IsoView($<HTMLCanvasElement>(_root, 'canvas'));
        this._view.onPointer = (kind, pick, e) => this.pointer(kind, pick, e);

        const palettePanel = new PalettePanel($(_root, '.palette'), palette);

        palettePanel.onChoose = entry =>
        {
            this._choice = entry;
            this.setTool('place');
        };

        this.wire();
        this.refresh();
    }

    /** Resolves when the user returns to the zone list. */
    run(): Promise<void>
    {
        return new Promise(resolve => this._close = resolve);
    }

    private get doc(): ZoneDocument
    {
        return this._history.current;
    }

    private wire(): void
    {
        $(this._root, '.topbar').addEventListener('click', e =>
        {
            const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;

            if(action === 'zones') void this.leave();
            if(action === 'undo') this.undo();
            if(action === 'redo') this.redo();
            if(action === 'save') void this.save();
            if(action === 'publish') void this.publish();
            if(action === 'test') void this.test();
        });

        $(this._root, '.tools').addEventListener('click', e =>
        {
            const tool = ((e.target as HTMLElement).closest<HTMLElement>('[data-tool]')?.dataset.tool ?? null) as ToolName | null;

            if(tool) this.setTool(tool);
        });

        $(this._root, '.layers').addEventListener('change', e =>
        {
            const input = e.target as HTMLInputElement;
            const layer = input.dataset.layer as LayerName;

            if(input.dataset.kind === 'visible') this._layers.setVisible(layer, input.checked);
            else this._layers.setLocked(layer, input.checked);
            this.refresh();
        });

        $(this._root, '.history').addEventListener('click', e =>
        {
            const li = (e.target as HTMLElement).closest<HTMLElement>('[data-steps]');

            if(!li) return;

            const steps = Number(li.dataset.steps);

            for(let i = 0; i < Math.abs(steps); i++)
            {
                if(steps < 0) this._history.undo();
                else this._history.redo();
            }
            this.afterChange();
        });

        $(this._root, '.findings').addEventListener('click', e =>
        {
            const id = (e.target as HTMLElement).closest<HTMLElement>('[data-element]')?.dataset.element;
            const o = this.doc.decor?.find(d => d.id === id);

            if(!o) return;

            this._selection = EditorSelection.of(o.id);
            this._view.centerOn(o.x, o.y);
            this.refresh();
        });

        $(this._root, '.inspector').addEventListener('change', e => this.inspectorChange(e.target as HTMLInputElement));
        $(this._root, '.inspector').addEventListener('click', e =>
        {
            const action = (e.target as HTMLElement).closest<HTMLElement>('[data-do]')?.dataset.do;

            if(action === 'rotate') this.execute(rotateDecor(this._selection.ids));
            if(action === 'delete') this.execute(removeDecor(this._selection.ids));
            if(action === 'resize')
            {
                this.execute(resizeFloor(
                    Number($<HTMLInputElement>(this._root, '[data-field=width]').value),
                    Number($<HTMLInputElement>(this._root, '[data-field=length]').value)
                ));
                this._view.fit();
                this.refresh();
            }
        });

        window.addEventListener('keydown', this.keydown);
        window.addEventListener('beforeunload', this.unload);
    }

    private readonly keydown = (e: KeyboardEvent): void =>
    {
        if((e.target as HTMLElement).closest('input, textarea, select')) return;

        const key = e.key.toLowerCase();

        if(e.ctrlKey && key === 'z' && !e.shiftKey) this.undo();
        else if(e.ctrlKey && (key === 'y' || (key === 'z' && e.shiftKey))) this.redo();
        else if(e.ctrlKey && key === 's') void this.save();
        else if(key === 'delete' || key === 'backspace') this.execute(removeDecor(this._selection.ids));
        else if(key === 'r') this.execute(rotateDecor(this._selection.ids));
        else if(key === 'escape')
        {
            this._selection = EditorSelection.EMPTY;
            this.setTool('select');
        }
        else
        {
            const tool = TOOLS.find(t => t.key === key);

            if(!tool || e.ctrlKey) return;
            this.setTool(tool.name);
        }

        e.preventDefault();
    };

    private readonly unload = (): void =>
    {
        void this._api.unlock(this._zone.key).catch(() => undefined);
    };

    private setTool(tool: ToolName): void
    {
        this._tool = tool === 'place' && !this._choice ? 'select' : tool;
        if(tool === 'place' && !this._choice) this._status = 'Choisissez d\'abord un meuble dans la palette.';
        this.refresh();
    }

    private execute(command: IEditorCommand): void
    {
        if(this._history.execute(command)) this.afterChange();
    }

    private undo(): void
    {
        if(this._history.undo()) this.afterChange();
    }

    private redo(): void
    {
        if(this._history.redo()) this.afterChange();
    }

    private afterChange(): void
    {
        this._selection = this._selection.keepOnly(new Set((this.doc.decor ?? []).map(o => o.id)));
        this.refresh();
    }

    // ── Pointer tools ────────────────────────────────────────────────────────────

    private pointer(kind: 'down' | 'move' | 'up', pick: IPick, e: PointerEvent): void
    {
        this._hover = pick.cell;

        switch(this._tool)
        {
            case 'select':
                this.selectTool(kind, pick, e);
                break;
            case 'raise':
            case 'lower':
            case 'hole':
            case 'block':
                this.brush(kind, pick, e);
                break;
            case 'door':
                if(kind === 'down' && pick.cell && this._layers.isEditable('door')) this.execute(moveDoor(pick.cell.x, pick.cell.y));
                break;
            case 'place':
                if(kind === 'down' && pick.cell && this._choice && this._layers.isEditable('decor')) this.place(pick.cell, this._choice);
                break;
        }

        this.updateHud();
        this.drawView();
    }

    private selectTool(kind: 'down' | 'move' | 'up', pick: IPick, e: PointerEvent): void
    {
        if(kind === 'down')
        {
            if(pick.objectId && this._layers.isEditable('decor'))
            {
                if(e.shiftKey) this._selection = this._selection.toggle(pick.objectId);
                else if(!this._selection.ids.has(pick.objectId)) this._selection = EditorSelection.of(pick.objectId);
                this._dragFrom = pick.cell;
                this._dragTo = pick.cell;
            }
            else if(pick.cell)
            {
                this._rectFrom = pick.cell;
                this._selection = EditorSelection.rectangle(pick.cell, pick.cell);
            }
            else this._selection = EditorSelection.EMPTY;
            this.refresh();
        }
        else if(kind === 'move')
        {
            if(this._dragFrom && pick.cell) this._dragTo = pick.cell;
            if(this._rectFrom && pick.cell)
            {
                this._selection = EditorSelection.rectangle(this._rectFrom, pick.cell);
                this.renderInspector();
            }
        }
        else
        {
            const offset = this.dragOffset();

            if(offset)
            {
                // The objects follow the floor: dz is the height difference under the first one.
                const first = this.doc.decor?.find(o => this._selection.ids.has(o.id));
                const floor = this.doc.floor;
                const dz = first
                    ? (tileAt(floor, first.x + offset.dx, first.y + offset.dy)?.height ?? 0) - (tileAt(floor, first.x, first.y)?.height ?? 0)
                    : 0;

                this.execute(moveDecor(this._selection.ids, offset.dx, offset.dy, dz));
            }
            this._dragFrom = null;
            this._dragTo = null;
            this._rectFrom = null;
        }
    }

    private brush(kind: 'down' | 'move' | 'up', pick: IPick, e: PointerEvent): void
    {
        if(!this._layers.isEditable('floor')) return;

        if((kind === 'down' || (kind === 'move' && this._stroke.size)) && pick.cell)
        {
            this._stroke.set(tileIndex(this.doc.floor, pick.cell.x, pick.cell.y), pick.cell);
        }

        if(kind !== 'up' || !this._stroke.size) return;

        const cells = [...this._stroke.values()];
        const reverse = e.shiftKey;
        const [label, change]: [string, (t: ZoneTile) => ZoneTile] =
            this._tool === 'raise' ? ['Monter le sol', t => ({...t, height: (t.height ?? 0) + 1})]
                : this._tool === 'lower' ? ['Descendre le sol', t => ({...t, height: (t.height ?? 0) - 1})]
                    : this._tool === 'hole' ? [reverse ? 'Boucher' : 'Creuser', t => ({...t, hole: !reverse})]
                        : [reverse ? 'Rendre marchable' : 'Bloquer', t => ({...t, walkable: reverse})];

        this._stroke = new Map();
        this.execute(editTiles(`${label} (${cells.length})`, cells, change));
    }

    private place(cell: Cell, entry: IFurniturePaletteEntry): void
    {
        const id = nextId(this.doc, entry.class);

        this.execute(placeDecor({
            definition: entry.definition,
            class: entry.class,
            x: cell.x,
            y: cell.y,
            z: tileAt(this.doc.floor, cell.x, cell.y)?.height ?? 0,
            rotation: 0
        }));
        this._selection = EditorSelection.of(id);
        this.refresh();
    }

    private dragOffset(): {dx: number; dy: number} | null
    {
        if(!this._dragFrom || !this._dragTo) return null;

        const dx = this._dragTo.x - this._dragFrom.x;
        const dy = this._dragTo.y - this._dragFrom.y;

        return dx || dy ? {dx, dy} : null;
    }

    // ── Server ───────────────────────────────────────────────────────────────────

    private async save(): Promise<boolean>
    {
        if(this._busy) return false;

        this._busy = true;
        this._status = 'Enregistrement…';
        this.renderTopbar();
        try
        {
            const result = await this._api.save(this._zone.key, this.doc);

            this._serverFindings = [...result.findings];
            if(result.saved)
            {
                this._history.markSaved();
                this._savedVersion = result.version;
                this._status = `Version ${result.version} enregistrée.`;
            }
            else
            {
                this._status = result.findings.some(f => f.code === 'Conflict')
                    ? 'Une autre sauvegarde est passée avant : enregistrez à nouveau.'
                    : 'Refusé par le serveur : voir les constats.';
            }

            return result.saved;
        }
        catch (error)
        {
            this._status = describe(error);

            return false;
        }
        finally
        {
            this._busy = false;
            this.refresh();
        }
    }

    private async publish(): Promise<boolean>
    {
        if((this._history.isDirty || this._savedVersion === null) && !await this.save()) return false;
        if(this._savedVersion === null || this._busy) return false;

        this._busy = true;
        this._status = 'Publication…';
        this.renderTopbar();
        try
        {
            const result = await this._api.publish(this._zone.key, this._savedVersion);

            this._serverFindings = [...result.findings];
            if(result.published) this._publishedVersion = this._savedVersion;
            this._status = result.published
                ? `Version ${this._savedVersion} publiée : la room est rechargée.`
                : 'Publication refusée : voir les constats.';

            return result.published;
        }
        catch (error)
        {
            this._status = describe(error);

            return false;
        }
        finally
        {
            this._busy = false;
            this.refresh();
        }
    }

    private async test(): Promise<void>
    {
        const current = !this._history.isDirty && this._savedVersion !== null && this._publishedVersion === this._savedVersion;

        if(!current && !await this.publish()) return;

        try
        {
            if('__TAURI_INTERNALS__' in window)
            {
                const {openUrl} = await import('@tauri-apps/plugin-opener');

                await openUrl(GAME_CLIENT);
            }
            else window.open(GAME_CLIENT, '_blank');
            this._status = `Client ouvert : la zone est la room ${this._zone.roomId}.`;
        }
        catch (error)
        {
            this._status = `Impossible d'ouvrir le client : ${describe(error)}`;
        }
        this.renderTopbar();
    }

    private async leave(): Promise<void>
    {
        if(this._history.isDirty && !window.confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?')) return;

        window.removeEventListener('keydown', this.keydown);
        window.removeEventListener('beforeunload', this.unload);
        await this._api.unlock(this._zone.key).catch(() => undefined);
        this._close();
    }

    // ── Rendering ────────────────────────────────────────────────────────────────

    private refresh(): void
    {
        this.drawView();
        this.renderTopbar();
        this.renderInspector();
        this.renderBottom();
        this.updateHud();
        this._root.querySelectorAll<HTMLElement>('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === this._tool));
    }

    private drawView(): void
    {
        const floor = this.doc.floor;
        const cells = new Set(this._selection.cells.map(c => tileIndex(floor, c.x ?? 0, c.y ?? 0)));

        this._view.setModel({
            doc: this.doc,
            furniture: d => this._furniture.get(d) ?? null,
            layers: this._layers,
            selectedIds: this._selection.ids,
            selectedCells: cells,
            strokeCells: new Set(this._stroke.keys()),
            hover: this._hover,
            dragOffset: this.dragOffset(),
            ghost: this._tool === 'place' ? this._choice : null
        });
    }

    private renderTopbar(): void
    {
        const dirty = this._history.isDirty;
        const version = this._savedVersion === null ? 'jamais enregistrée'
            : `v${this._savedVersion}${this._publishedVersion === this._savedVersion ? ' publiée' : ' brouillon'}`;

        $<HTMLButtonElement>(this._root, '[data-action=undo]').disabled = !this._history.canUndo;
        $<HTMLButtonElement>(this._root, '[data-action=redo]').disabled = !this._history.canRedo;
        $<HTMLButtonElement>(this._root, '[data-action=save]').disabled = this._busy || !dirty;
        $<HTMLButtonElement>(this._root, '[data-action=publish]').disabled = this._busy;
        $(this._root, '.status').textContent = `${dirty ? '● modifié · ' : ''}${version}${this._status ? ` — ${this._status}` : ''}`;
    }

    private updateHud(): void
    {
        const h = this._hover;
        const tile = h ? tileAt(this.doc.floor, h.x, h.y) : null;

        $(this._root, '.hud').textContent = [
            h ? `(${h.x}, ${h.y}) h ${tile?.height ?? 0}${tile?.hole ? ' trou' : ''}${tile?.walkable === false ? ' bloqué' : ''}` : '',
            'clic droit : déplacer la vue · molette : zoom'
        ].filter(Boolean).join(' · ');
    }

    private renderInspector(): void
    {
        const el = $(this._root, '.inspector');
        const doc = this.doc;
        const ids = this._selection.ids;
        const cells = this._selection.cells;

        if(ids.size === 1)
        {
            const o = doc.decor?.find(d => ids.has(d.id));

            if(o)
            {
                const f = this._furniture.get(o.definition);

                el.innerHTML = `
                    <h2>${esc(o.class)}</h2>
                    <p class="muted"><code>${esc(o.id)}</code> · définition #${o.definition}${f ? ` · ${f.width}×${f.length}` : ' · <b>inconnue</b>'}</p>
                    <div class="grid3">
                        <label>X <input type="number" data-field="x" value="${o.x}"></label>
                        <label>Y <input type="number" data-field="y" value="${o.y}"></label>
                        <label>Z <input type="number" data-field="z" step="0.5" min="0" value="${o.z ?? 0}"></label>
                    </div>
                    <label>Rotation <b>${o.rotation ?? 0}</b> <button data-do="rotate" title="R">Tourner ↻</button></label>
                    ${f && f.states > 1 ? `<label>État <input type="number" data-field="state" min="0" max="${f.states - 1}" value="${o.state ?? 0}"></label>` : ''}
                    ${o.locked ? '<p class="muted">🔒 Verrouillé</p>' : ''}
                    <button data-do="delete" class="danger" title="Suppr">Supprimer</button>`;

                return;
            }
        }

        if(ids.size > 1)
        {
            el.innerHTML = `
                <h2>${ids.size} objets</h2>
                <button data-do="rotate">Tourner ↻</button>
                <button data-do="delete" class="danger">Supprimer</button>`;

            return;
        }

        if(cells.length)
        {
            const first = tileAt(doc.floor, cells[0].x ?? 0, cells[0].y ?? 0) ?? {};
            const title = cells.length === 1 ? `Case (${cells[0].x}, ${cells[0].y})` : `${cells.length} cases`;

            el.innerHTML = `
                <h2>${title}</h2>
                <label>Hauteur <input type="number" data-field="height" min="0" max="32" value="${first.height ?? 0}"></label>
                <label class="check"><input type="checkbox" data-field="walkable" ${first.walkable === false ? '' : 'checked'}> Marchable</label>
                <label class="check"><input type="checkbox" data-field="hole" ${first.hole ? 'checked' : ''}> Trou</label>
                <p class="muted">Les valeurs s'appliquent à toute la sélection.</p>`;

            return;
        }

        const floor = doc.floor;

        el.innerHTML = `
            <h2>${esc(doc.settings.name)}</h2>
            <p class="muted"><code>${esc(doc.settings.id)}</code> · room ${this._zone.roomId}</p>
            <h3>Sol</h3>
            <div class="grid3">
                <label>Largeur <input type="number" data-field="width" min="1" max="64" value="${floor.width}"></label>
                <label>Longueur <input type="number" data-field="length" min="1" max="64" value="${floor.length}"></label>
                <button data-do="resize">Appliquer</button>
            </div>
            <h3>Porte</h3>
            <p>(${floor.door.x ?? 0}, ${floor.door.y ?? 0}) — outil 🚪 pour la déplacer.</p>
            <label>Direction <input type="number" data-field="doorDirection" min="0" max="7" value="${floor.doorDirection ?? 2}"></label>
            <h3>Aide</h3>
            <p class="muted">Choisissez un meuble dans la palette puis cliquez sur le sol. Sélection : clic sur un meuble, glisser pour le déplacer ; glisser sur le sol pour choisir des cases.</p>`;
    }

    private inspectorChange(input: HTMLInputElement): void
    {
        const field = input.dataset.field;
        const value = Number(input.value);
        const ids = this._selection.ids;
        const o = this.doc.decor?.find(d => ids.has(d.id));

        switch(field)
        {
            case 'x':
            case 'y':
            case 'z':
                if(o && Number.isFinite(value))
                {
                    this.execute(moveDecor(ids,
                        field === 'x' ? value - o.x : 0,
                        field === 'y' ? value - o.y : 0,
                        field === 'z' ? value - (o.z ?? 0) : 0));
                }
                break;
            case 'state':
                if(o && Number.isInteger(value)) this.execute(setDecorState(o.id, value));
                break;
            case 'height':
                if(Number.isFinite(value)) this.execute(editTiles(`Hauteur ${value}`, this._selection.cells, t => ({...t, height: value})));
                break;
            case 'walkable':
                this.execute(editTiles(input.checked ? 'Rendre marchable' : 'Bloquer', this._selection.cells, t => ({...t, walkable: input.checked})));
                break;
            case 'hole':
                this.execute(editTiles(input.checked ? 'Creuser' : 'Boucher', this._selection.cells, t => ({...t, hole: input.checked})));
                break;
            case 'doorDirection':
                if(Number.isInteger(value)) this.execute(moveDoor(this.doc.floor.door.x ?? 0, this.doc.floor.door.y ?? 0, value));
                break;
        }
    }

    private renderBottom(): void
    {
        $(this._root, '.layers').innerHTML = LayerState.NAMES.map(l => `
            <div class="layer">
                <label title="Visible"><input type="checkbox" data-layer="${l}" data-kind="visible" ${this._layers.isVisible(l) ? 'checked' : ''}> 👁</label>
                <label title="Verrouillé"><input type="checkbox" data-layer="${l}" data-kind="locked" ${this._layers.isLocked(l) ? 'checked' : ''}> 🔒</label>
                <span>${LAYER_LABELS[l]}</span>
            </div>`).join('');

        const done = this._history.done;
        const undone = this._history.undone;

        $(this._root, '.history').innerHTML = [
            '<li data-steps="' + -done.length + '" class="muted">Ouverture</li>',
            ...done.map((label, i) => `<li data-steps="${i + 1 - done.length}" class="${i === done.length - 1 ? 'current' : ''}">${esc(label)}</li>`),
            ...undone.map((label, i) => `<li data-steps="${i + 1}" class="undone">${esc(label)}</li>`)
        ].join('');

        const local = validateLocally(this.doc, d => this._furniture.get(d) ?? null);
        const findings = [
            ...local.map(f => ({...f, origin: 'local'})),
            ...this._serverFindings.filter(s => !local.some(l => l.code === s.code && l.elementId === s.elementId)).map(f => ({...f, origin: 'serveur'}))
        ];

        $(this._root, '.findings').innerHTML = findings.map(f => `
            <li class="${f.severity === 'Error' ? 'error' : 'warning'}" ${f.elementId ? `data-element="${esc(f.elementId)}"` : ''}>
                <b>${esc(f.code)}</b> ${esc(f.message)} <span class="muted">(${f.origin})</span>
            </li>`).join('') || '<li class="muted">Aucun constat.</li>';
    }
}
