import type {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import type {IEditorMonster} from '@ambreia/map-editor-core/api/IEditorMonster';
import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {editTiles} from '@ambreia/map-editor-core/commands/editTiles';
import type {IEditorCommand} from '@ambreia/map-editor-core/commands/IEditorCommand';
import {moveDecor} from '@ambreia/map-editor-core/commands/moveDecor';
import {moveDoor} from '@ambreia/map-editor-core/commands/moveDoor';
import {pasteDecor} from '@ambreia/map-editor-core/commands/pasteDecor';
import {placeDecor} from '@ambreia/map-editor-core/commands/placeDecor';
import {removeDecor} from '@ambreia/map-editor-core/commands/removeDecor';
import {rotateDecor} from '@ambreia/map-editor-core/commands/rotateDecor';
import {setDecorLocked} from '@ambreia/map-editor-core/commands/setDecorLocked';
import {toggleSpawn} from '@ambreia/map-editor-core/commands/toggleSpawn';
import {EditorHistory} from '@ambreia/map-editor-core/history/EditorHistory';
import {LayerState} from '@ambreia/map-editor-core/layers/LayerState';
import {EditorSelection} from '@ambreia/map-editor-core/selection/EditorSelection';
import type {IZoneFinding} from '@ambreia/map-editor-core/validation/IZoneFinding';
import {validateLocally} from '@ambreia/map-editor-core/validation/validateLocally';
import {fillCells} from '@ambreia/map-editor-core/zone/fillCells';
import type {ZoneCell, ZoneDocument, ZoneTile} from '@ambreia/map-editor-core/zone/Zone.generated';
import {inside, MAX_SIZE, nextId, tileAt, tileIndex} from '@ambreia/map-editor-core/zone/zoneGeometry';
import {describe} from '../panels/html';
import {FurnitureSprites} from '../view/FurnitureSprites';
import type {IPick} from '../view/IPick';
import type {IViewOptions} from '../view/IViewOptions';
import {IsoBackdrop} from '../view/IsoBackdrop';
import {IsoView} from '../view/IsoView';
import type {Category} from './Category';
import {TOOL_KEYS} from './TOOL_KEYS';
import {WorldEditing} from './WorldEditing';
import type {IClipboardEntry} from './IClipboardEntry';
import type {IJournalEntry} from './IJournalEntry';
import type {ToolName} from './ToolName';

const GAME_CLIENT = 'http://localhost:5173/';

type Cell = {readonly x: number; readonly y: number};

/**
 * One open zone: the document and its history, the selection, the tools, the layers, and the
 * actions on them (edit, save, publish, test). It draws nothing itself: the owner's windows
 * (ui/EditorShell) attach their panels, read this object and call its actions. run() resolves
 * when the user goes back to the zone list.
 */
export class EditorApp
{
    readonly history: EditorHistory;
    readonly layers = new LayerState();
    readonly sprites = new FurnitureSprites();
    readonly view = new IsoView();
    /** The document the room engine last received. */
    private _syncedDoc: ZoneDocument | null = null;
    private _syncedLevel: number | null = null;
    readonly options: IViewOptions = {grid: true, heights: false, walls: true, sprites: true, level: null};
    readonly journal: IJournalEntry[] = [];
    /** The world layers' selection and tools (entries, areas, NPCs, spawns, triggers…). */
    readonly world: WorldEditing = new WorldEditing(this);

    selection = EditorSelection.EMPTY;
    category: Category = 'floor';
    tool: ToolName = 'select';
    /** The height "Ajouter case", "Rectangle" and "Remplir" paint with. */
    paintHeight = 0;
    choice: IFurniturePaletteEntry | null = null;
    serverFindings: IZoneFinding[] = [];
    /** Every zone of the world: the destinations a passage or a teleport can aim at. */
    zones: IZoneSummary[] = [];
    /** The monsters a spawn can name (GET /api/editor/monsters), and the content's texts for their names. */
    monsters: readonly IEditorMonster[] = [];
    texts: ReadonlyMap<string, string> = new Map();
    savedVersion: number | null;
    publishedVersion: number | null;
    status = '';
    hover: Cell | null = null;
    busy = false;

    private readonly _furniture: Map<number, IFurniturePaletteEntry>;
    private readonly _panels: {render(): void; onPointer?(): void}[] = [];
    private readonly _viewListeners: (() => void)[] = [];
    private _clipboard: IClipboardEntry | null = null;
    /** The cells of the stroke under way, keyed y * MAX_SIZE + x: they may lie past the floor's edges. */
    private _stroke = new Map<number, Cell>();
    private _dragFrom: Cell | null = null;
    private _dragTo: Cell | null = null;
    private _rectFrom: Cell | null = null;
    private _close: () => void = () => undefined;

    constructor(
        readonly api: EditorApiClient,
        readonly zone: IZoneSummary,
        doc: ZoneDocument,
        readonly palette: readonly IFurniturePaletteEntry[]
    )
    {
        this.history = new EditorHistory(doc);
        this._furniture = new Map(palette.map(p => [p.definition, p]));
        this.savedVersion = zone.latestVersion || null;
        this.publishedVersion = zone.publishedVersion;

        this.view.onPointer = (kind, pick, e) => this.pointer(kind, pick, e);

        void IsoBackdrop.shared().then(backdrop =>
        {
            if(!backdrop) return;

            backdrop.onChange = () => this.view.draw();
            this.view.backdrop = backdrop;
            this._syncedDoc = null;
            this.drawView();
        });
        this.view.onViewChange = () => this._viewListeners.forEach(l => l());
        this.sprites.onLoad = () => this.drawView();

        window.addEventListener('keydown', this.keydown);
        window.addEventListener('beforeunload', this.unload);

        this.log(`Zone ${zone.key} ouverte (${this.savedVersion ? `v${this.savedVersion}` : 'nouvelle'}).`);
    }

    /** A panel to render after each change. */
    attach(panel: {render(): void; onPointer?(): void}): void
    {
        this._panels.push(panel);
    }

    /** Called when the camera moves or zooms (mini-map, zoom readout). */
    onViewChange(listener: () => void): void
    {
        this._viewListeners.push(listener);
    }

    /** Resolves when the user returns to the zone list. */
    run(): Promise<void>
    {
        return new Promise(resolve => this._close = resolve);
    }

    get doc(): ZoneDocument
    {
        return this.history.current;
    }

    furniture(definition: number): IFurniturePaletteEntry | null
    {
        return this._furniture.get(definition) ?? null;
    }

    /** The served monster of this id, or null (unknown or retired). */
    monster(id: string): IEditorMonster | null
    {
        return this.monsters.find(m => m.id === id) ?? null;
    }

    get localFindings(): IZoneFinding[]
    {
        return validateLocally(this.doc, d => this.furniture(d));
    }

    get canPaste(): boolean
    {
        return !!this._clipboard;
    }

    // ── Actions ──────────────────────────────────────────────────────────────────

    execute(command: IEditorCommand): void
    {
        if(this.history.execute(command)) this.afterChange();
    }

    undo(): void
    {
        if(this.history.undo()) this.afterChange();
    }

    redo(): void
    {
        if(this.history.redo()) this.afterChange();
    }

    /** Undo or redo several steps at once (a click in the History panel). */
    travel(steps: number): void
    {
        for(let i = 0; i < Math.abs(steps); i++)
        {
            if(steps < 0) this.history.undo();
            else this.history.redo();
        }
        this.afterChange();
    }

    select(selection: EditorSelection): void
    {
        this.selection = selection;
        this.refresh();
    }

    setCategory(category: Category): void
    {
        this.category = category;
        this.world.tool = 'select';
        this.world.polygon = [];
        if(category === 'decor' && !['select', 'move', 'place'].includes(this.tool)) this.tool = 'select';
        if(category !== 'decor' && ['move', 'place'].includes(this.tool)) this.tool = 'select';
        this.refresh();
    }

    setTool(tool: ToolName): void
    {
        if(tool === 'place' && !this.choice)
        {
            this.status = 'Choisissez d\'abord un mobi dans le catalogue.';
            tool = 'select';
        }
        this.tool = tool;
        this.refresh();
    }

    setPaintHeight(height: number): void
    {
        this.paintHeight = height;
        if(!['tile-add', 'rect', 'fill'].includes(this.tool)) this.tool = 'tile-add';
        this.refresh();
    }

    choose(entry: IFurniturePaletteEntry): void
    {
        this.choice = entry;
        this.tool = 'place';
        this.refresh();
    }

    toggleOption(option: Exclude<keyof IViewOptions, 'level'>): void
    {
        this.options[option] = !this.options[option];
        this.refresh();
    }

    /**
     * Moves the level shown by `step` (−1 down, +1 up): only the tiles of that height are left, so a
     * floor under a bridge, or a bridge alone, can be built. Going down from "all" starts at the
     * top; going up past the top shows all again. `null` shows all.
     */
    stepLevel(step: -1 | 1 | null): void
    {
        const top = Math.max(0, ...this.doc.floor.tiles.map(t => (t.hole ? 0 : t.height ?? 0)));
        const level = this.options.level;
        let next: number | null = null;

        if(step === -1) next = level === null ? top : Math.max(0, level - 1);
        else if(step === 1 && level !== null && level < top) next = level + 1;

        if(next === level) return;

        this.options.level = next;
        this.log(next === null ? 'Tous les niveaux.' : `Niveau ${next} : seules ses cases sont affichées.`);
        this.refresh();
    }

    copy(): void
    {
        const objects = (this.doc.decor ?? []).filter(o => this.selection.ids.has(o.id));

        if(!objects.length) return;

        this._clipboard = {objects, originX: Math.min(...objects.map(o => o.x)), originY: Math.min(...objects.map(o => o.y))};
        this.log(`${objects.length} mobi(s) copié(s).`);
        this.refresh();
    }

    /** Pastes under the pointer, or one cell off the originals when the pointer is not on the floor. */
    paste(): void
    {
        const clip = this._clipboard;

        if(!clip) return;

        const target = this.hover ?? {x: clip.originX + 1, y: clip.originY + 1};
        const before = new Set((this.doc.decor ?? []).map(o => o.id));

        this.execute(pasteDecor(clip.objects, target.x - clip.originX, target.y - clip.originY));
        this.selectNew(before);
    }

    duplicate(): void
    {
        const objects = (this.doc.decor ?? []).filter(o => this.selection.ids.has(o.id));
        const before = new Set((this.doc.decor ?? []).map(o => o.id));

        if(!objects.length) return;

        this.execute(pasteDecor(objects, 1, 1));
        this.selectNew(before);
    }

    deleteSelection(): void
    {
        this.execute(removeDecor(this.selection.ids));
    }

    rotateSelection(): void
    {
        this.execute(rotateDecor(this.selection.ids));
    }

    toggleLock(): void
    {
        const selected = (this.doc.decor ?? []).filter(o => this.selection.ids.has(o.id));

        this.execute(setDecorLocked(this.selection.ids, !selected.every(o => o.locked)));
    }

    log(text: string, level: IJournalEntry['level'] = 'info'): void
    {
        const time = new Date().toLocaleTimeString('fr-FR');

        this.journal.unshift({time, text, level});
        this.journal.length = Math.min(this.journal.length, 200);
    }

    async save(): Promise<boolean>
    {
        if(this.busy) return false;

        this.busy = true;
        this.status = 'Enregistrement…';
        this.refresh();
        try
        {
            const result = await this.api.save(this.zone.key, this.doc);

            this.serverFindings = [...result.findings];
            if(result.saved)
            {
                this.history.markSaved();
                this.savedVersion = result.version;
                this.status = `Version ${result.version} enregistrée.`;
                this.log(this.status, 'success');
            }
            else
            {
                this.status = result.findings.some(f => f.code === 'Conflict')
                    ? 'Une autre sauvegarde est passée avant : enregistrez à nouveau.'
                    : 'Refusé par le serveur : voir la validation.';
                this.log(this.status, 'error');
            }

            return result.saved;
        }
        catch (error)
        {
            this.status = describe(error);
            this.log(this.status, 'error');

            return false;
        }
        finally
        {
            this.busy = false;
            this.refresh();
        }
    }

    async publish(): Promise<boolean>
    {
        if((this.history.isDirty || this.savedVersion === null) && !await this.save()) return false;
        if(this.savedVersion === null || this.busy) return false;

        this.busy = true;
        this.status = 'Publication…';
        this.refresh();
        try
        {
            const result = await this.api.publish(this.zone.key, this.savedVersion);

            this.serverFindings = [...result.findings];
            if(result.published) this.publishedVersion = this.savedVersion;
            this.status = result.published
                ? `Version ${this.savedVersion} publiée : la room est rechargée.`
                : 'Publication refusée : voir la validation.';
            this.log(this.status, result.published ? 'success' : 'error');

            return result.published;
        }
        catch (error)
        {
            this.status = describe(error);
            this.log(this.status, 'error');

            return false;
        }
        finally
        {
            this.busy = false;
            this.refresh();
        }
    }

    /** "Vérifier la map": the server's verdict on the current document, without saving it. */
    async verify(): Promise<void>
    {
        try
        {
            this.serverFindings = await this.api.validate(this.zone.key, this.doc);

            const errors = this.serverFindings.filter(f => f.severity === 'Error').length;

            this.log(errors ? `Vérification : ${errors} erreur(s).` : 'Vérification : la map est jouable.', errors ? 'error' : 'success');
        }
        catch (error)
        {
            this.log(describe(error), 'error');
        }
        this.refresh();
    }

    async test(): Promise<void>
    {
        const current = !this.history.isDirty && this.savedVersion !== null && this.publishedVersion === this.savedVersion;

        if(!current && !await this.publish()) return;

        try
        {
            // One selected cell is where the tester appears; otherwise the zone's own arrival.
            const cell = this.selection.cells.length === 1 ? this.selection.cells[0] : null;
            const {ssoToken} = await this.api.testTicket(this.zone.key, cell);
            const url = `${GAME_CLIENT}?sso=${encodeURIComponent(ssoToken)}`;

            if('__TAURI_INTERNALS__' in window)
            {
                const {openUrl} = await import('@tauri-apps/plugin-opener');

                await openUrl(url);
            }
            else window.open(url, '_blank');
            this.status = cell
                ? `Client ouvert dans la zone, sur la case ${cell.x}, ${cell.y}.`
                : 'Client ouvert dans la zone, sur son arrivée.';
            this.log(this.status);
        }
        catch (error)
        {
            this.status = `Impossible d'ouvrir le client : ${describe(error)}`;
            this.log(this.status, 'error');
        }
        this.refresh();
    }

    async leave(): Promise<void>
    {
        if(this.history.isDirty && !window.confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?')) return;

        window.removeEventListener('keydown', this.keydown);
        window.removeEventListener('beforeunload', this.unload);
        await this.api.unlock(this.zone.key).catch(() => undefined);
        this._close();
    }

    refresh(): void
    {
        this.drawView();
        for(const panel of this._panels) panel.render();
    }

    // ── Internals ────────────────────────────────────────────────────────────────

    private afterChange(): void
    {
        this.selection = this.selection.keepOnly(new Set((this.doc.decor ?? []).map(o => o.id)));
        this.refresh();
    }

    private selectNew(before: ReadonlySet<string>): void
    {
        const added = (this.doc.decor ?? []).map(o => o.id).filter(id => !before.has(id));

        if(!added.length) return;

        this.selection = added.slice(1).reduce((s, id) => s.toggle(id), EditorSelection.of(added[0]));
        this.refresh();
    }

    private readonly keydown = (e: KeyboardEvent): void =>
    {
        if((e.target as HTMLElement).closest('input, textarea, select')) return;

        const key = e.key.toLowerCase();

        if(e.ctrlKey && key === 'z' && !e.shiftKey) this.undo();
        else if(e.ctrlKey && (key === 'y' || (key === 'z' && e.shiftKey))) this.redo();
        else if(e.ctrlKey && key === 's') void this.save();
        else if(e.ctrlKey && key === 'c') this.copy();
        else if(e.ctrlKey && key === 'v') this.paste();
        else if(e.ctrlKey && key === 'd') this.duplicate();
        else if(this.world.layer && this.world.key(key)) return;
        else if(key === 'delete' || key === 'backspace')
        {
            if(this.world.layer) this.world.remove();
            else this.deleteSelection();
        }
        else if(key === 'escape')
        {
            this.selection = EditorSelection.EMPTY;
            this.setTool('select');
        }
        else if(e.ctrlKey || e.altKey) return;
        else if(key === 'pagedown') this.stepLevel(-1);
        else if(key === 'pageup') this.stepLevel(1);
        else if(key === 'home') this.stepLevel(null);
        else if(this.world.layer && ['s', 'r', 'p'].includes(key))
        {
            // The world layers' tools: S select and drag, R rectangle, P polygon.
            this.world.setTool(key === 's' ? 'select' : key === 'r' ? 'rect' : 'polygon');
        }
        else if(this.category === 'decor' && key === 'r') this.rotateSelection();
        else if(this.category === 'decor' && key === 'm') this.setTool('move');
        else if(this.category === 'decor' && key === 's') this.setTool('select');
        else
        {
            // The floor tools' letters act in the floor category only: elsewhere a letter is not a
            // reason to leave what the user is doing.
            const tool = this.category === 'floor' ? TOOL_KEYS[key] : undefined;

            if(!tool) return;
            this.setTool(tool);
        }

        e.preventDefault();
    };

    private readonly unload = (): void =>
    {
        void this.api.unlock(this.zone.key).catch(() => undefined);
    };

    private pointer(kind: 'down' | 'move' | 'up', pick: IPick, e: MouseEvent): void
    {
        // A cell past the floor's edges is only for the tools that grow the floor (editTiles).
        if(pick.cell && !inside(this.doc.floor, pick.cell.x, pick.cell.y) && (this.world.layer || !['tile-add', 'rect'].includes(this.tool)))
        {
            pick = {...pick, cell: null};
        }

        this.hover = pick.cell;

        // The world layers have their own tools: the floor and mobi tools stay out of their way.
        if(this.world.layer)
        {
            this.world.pointer(kind, pick, e);
            this.drawView();
            for(const panel of this._panels) panel.onPointer?.();

            return;
        }

        switch(this.tool)
        {
            case 'select':
            case 'move':
                this.selectTool(kind, pick, e);
                break;
            case 'tile-add':
            case 'tile-remove':
            case 'hole':
            case 'raise':
            case 'lower':
            case 'block':
                this.brush(kind, pick, e);
                break;
            case 'rect':
                this.rectTool(kind, pick);
                break;
            case 'fill':
                if(kind === 'down' && pick.cell && this.layers.isEditable('floor'))
                {
                    const cells = fillCells(this.doc.floor, pick.cell.x, pick.cell.y);

                    this.execute(editTiles(`Remplir (${cells.length}) à ${this.paintHeight}`, cells, t => ({...t, hole: false, height: this.paintHeight})));
                }
                break;
            case 'door':
                if(kind === 'down' && pick.cell && this.layers.isEditable('floor')) this.execute(moveDoor(pick.cell.x, pick.cell.y));
                break;
            case 'spawn':
                if(kind === 'down' && pick.cell && this.layers.isEditable('floor')) this.execute(toggleSpawn(pick.cell.x, pick.cell.y));
                break;
            case 'place':
                if(kind === 'down' && pick.cell && this.choice && this.layers.isEditable('decor')) this.place(pick.cell, this.choice);
                break;
        }

        this.drawView();
        for(const panel of this._panels) panel.onPointer?.();
    }

    private selectTool(kind: 'down' | 'move' | 'up', pick: IPick, e: MouseEvent): void
    {
        if(kind === 'down')
        {
            if(pick.objectId && this.layers.isEditable('decor'))
            {
                if(e.shiftKey) this.selection = this.selection.toggle(pick.objectId);
                else if(!this.selection.ids.has(pick.objectId)) this.selection = EditorSelection.of(pick.objectId);
                this._dragFrom = pick.cell;
                this._dragTo = pick.cell;
            }
            else if(pick.cell && this.tool === 'select')
            {
                this._rectFrom = pick.cell;
                this.selection = EditorSelection.rectangle(pick.cell, pick.cell);
            }
            else if(this.tool === 'select') this.selection = EditorSelection.EMPTY;
            this.refresh();
        }
        else if(kind === 'move')
        {
            if(this._dragFrom && pick.cell) this._dragTo = pick.cell;
            if(this._rectFrom && pick.cell) this.selection = EditorSelection.rectangle(this._rectFrom, pick.cell);
        }
        else
        {
            const offset = this.dragOffset();

            if(offset)
            {
                // The objects follow the floor: dz is the height difference under the first one.
                const first = this.doc.decor?.find(o => this.selection.ids.has(o.id));
                const floor = this.doc.floor;
                const dz = first
                    ? (tileAt(floor, first.x + offset.dx, first.y + offset.dy)?.height ?? 0) - (tileAt(floor, first.x, first.y)?.height ?? 0)
                    : 0;

                this.execute(moveDecor(this.selection.ids, offset.dx, offset.dy, dz));
            }
            this._dragFrom = null;
            this._dragTo = null;
            if(this._rectFrom)
            {
                this._rectFrom = null;
                this.refresh();
            }
        }
    }

    private brush(kind: 'down' | 'move' | 'up', pick: IPick, e: MouseEvent): void
    {
        if(!this.layers.isEditable('floor')) return;

        if((kind === 'down' || (kind === 'move' && this._stroke.size)) && pick.cell)
        {
            this._stroke.set(pick.cell.y * MAX_SIZE + pick.cell.x, pick.cell);
        }

        if(kind !== 'up' || !this._stroke.size) return;

        const cells = [...this._stroke.values()];
        const height = this.paintHeight;
        const [label, change]: [string, (t: ZoneTile) => ZoneTile] =
            this.tool === 'tile-add' ? [`Ajouter case à ${height}`, t => ({...t, hole: false, height})]
                : this.tool === 'tile-remove' ? ['Supprimer case', t => ({...t, hole: true})]
                    : this.tool === 'hole' ? [e.shiftKey ? 'Boucher' : 'Creuser', t => ({...t, hole: !e.shiftKey})]
                        : this.tool === 'raise' ? ['Monter le sol', t => ({...t, height: (t.height ?? 0) + 1})]
                            : this.tool === 'lower' ? ['Descendre le sol', t => ({...t, height: (t.height ?? 0) - 1})]
                                : [e.shiftKey ? 'Rendre marchable' : 'Bloquer', t => ({...t, walkable: e.shiftKey})];

        this._stroke = new Map();
        this.execute(editTiles(`${label} (${cells.length})`, cells, change));
    }

    private rectTool(kind: 'down' | 'move' | 'up', pick: IPick): void
    {
        if(!this.layers.isEditable('floor')) return;

        if(kind === 'down' && pick.cell) this._rectFrom = pick.cell;

        if(this._rectFrom && pick.cell)
        {
            this._stroke = new Map(EditorSelection.rectangle(this._rectFrom, pick.cell).cells
                .map(c => [(c.y ?? 0) * MAX_SIZE + (c.x ?? 0), {x: c.x ?? 0, y: c.y ?? 0}]));
        }

        if(kind !== 'up' || !this._rectFrom) return;

        const cells: ZoneCell[] = [...this._stroke.values()];
        const height = this.paintHeight;

        this._rectFrom = null;
        this._stroke = new Map();
        this.execute(editTiles(`Rectangle ${cells.length} cases à ${height}`, cells, t => ({...t, hole: false, height})));
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
        this.selection = EditorSelection.of(id);
        this.refresh();
    }

    private dragOffset(): {dx: number; dy: number} | null
    {
        if(!this._dragFrom || !this._dragTo) return null;

        const dx = this._dragTo.x - this._dragFrom.x;
        const dy = this._dragTo.y - this._dragFrom.y;

        return dx || dy ? {dx, dy} : null;
    }

    private drawView(): void
    {
        // The room engine follows the document, not the pointer: only a new document is sent.
        if(this.view.backdrop && (this._syncedDoc !== this.doc || this._syncedLevel !== this.options.level))
        {
            this._syncedDoc = this.doc;
            this._syncedLevel = this.options.level;
            this.view.backdrop.setDocument(this.doc, this.options.level);
        }

        const floor = this.doc.floor;
        const cells = new Set(this.selection.cells.map(c => tileIndex(floor, c.x ?? 0, c.y ?? 0)));

        this.view.setModel({
            doc: this.doc,
            furniture: d => this.furniture(d),
            sprites: this.sprites,
            options: this.options,
            layers: this.layers,
            selectedIds: this.selection.ids,
            selectedCells: cells,
            stroke: [...this._stroke.values()],
            hover: this.hover,
            dragOffset: this.dragOffset(),
            ghost: this.tool === 'place' && !this.world.layer ? this.choice : null,
            world: {
                layer: this.world.layer,
                element: this.world.element,
                polygon: this.world.polygon,
                preview: this.world.preview,
                dragOffset: this.world.dragOffset
            }
        });
    }
}
