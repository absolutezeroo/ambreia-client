import {EventEmitter} from 'eventemitter3';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import type {IGlazeRuntime} from '../boot/GlazeBoot';
import {VariablesModel} from './VariablesModel';
import {EditorHistory} from './EditorHistory';
import {alignSelection, distributeSelection} from '../ops/SelectionOps';
import type {AlignEdge} from './EditorStateContracts';
export type {AlignEdge} from './EditorStateContracts';

/**
 * Editor interaction mode.
 *
 * - `edit`    — the canvas centre belongs to the editor (select/move/resize).
 * - `preview` — the editor stands down and the edited layout receives the mouse,
 *               so its buttons, tabs and lists can be exercised for real.
 */
export type EditorMode = 'edit' | 'preview';

/** Zoom steps offered in the toolbar (1 = 100 %). */
export const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

/**
 * Editor state events.
 *
 * - `layoutChanged`     — the open layout's root window was replaced.
 * - `selectionChanged`  — the selection changed (rebuild the inspector).
 * - `treeChanged`       — the tree structure or a node's geometry/label changed
 *                          (refresh the hierarchy view), without changing selection.
 * - `viewChanged`       — zoom or edit/preview mode changed (repaint, refresh the
 *                          toolbar's view controls).
 */
export const EditorEvents =
    {
        LAYOUT_CHANGED: 'layoutChanged',
        SELECTION_CHANGED: 'selectionChanged',
        TREE_CHANGED: 'treeChanged',
        GEOMETRY_CHANGED: 'geometryChanged',
        DEBUG_CHANGED: 'debugChanged',
        VIEW_CHANGED: 'viewChanged'
    } as const;

/**
 * EditorState — the single source of truth for what is open and selected.
 *
 * Holds the runtime, the currently open layout's root window, and the selected
 * node. Panels subscribe to {@link events} and never talk to each other directly.
 */
export class EditorState
{
    public readonly events = new EventEmitter();

    /** Debug view toggles (bottom bar) + live mouse position over the canvas. */
    public showTags = false;
    public debugRects = false;
    public showScaler = true;
    public readonly mouse = {x: 0, y: 0};

    /** Canvas background behind the edited layout (Background / Canvas Back Color / Load Image). */
    public readonly canvasBg = {mode: 'solid' as 'checker' | 'solid', color: 0xffe7e7f4, image: null as HTMLImageElement | null};

    /**
     * The chrome's insets, wired by `main`. `center()` centres in the whole
     * desktop, which now puts the layout half-under the two docked panels.
     */
    public contentInsets: (() => { top: number; left: number; right: number; bottom: number }) | null = null;

    /** True while a modal popup (e.g. Image Gallery) is open, so the centre picker stands down. */
    public modalOpen = false;

    /** Aimant sur les frères: snap the dragged node to its siblings' edges/centres. */
    public smartGuides = true;

    private readonly _runtime: IGlazeRuntime;
    private readonly _history: EditorHistory;
    private _rootWindow: IWindow | null = null;
    private _selection: IWindow[] = [];
    private _currentLayoutName: string | null = null;
    private _variables: VariablesModel | null = null;
    private _snap: number = 8;
    private _zoom: number = 1;
    private _mode: EditorMode = 'edit';
    private _rootOrigin: { x: number; y: number } = {x: 0, y: 0};

    public constructor(runtime: IGlazeRuntime)
    {
        this._runtime = runtime;
        this._history = new EditorHistory(this);
    }

    public get runtime(): IGlazeRuntime
    {
        return this._runtime;
    }

    public get rootWindow(): IWindow | null
    {
        return this._rootWindow;
    }

    /**
     * Starts an empty layout: no root window at all, the canvas blank, the name
     * set so Save knows the file. The first widget created becomes the root
     * (see `addWidget`) — a blank page has nothing on it, so seeding one with a
     * container or a frame just makes the author delete something first.
     */
    public newBlankLayout(name: string): void
    {
        this.destroyRoot();

        this._currentLayoutName = name;
        this._rootOrigin = {x: 0, y: 0};
        this._variables = new VariablesModel('');
        this._history.onLayoutOpened();

        this.events.emit(EditorEvents.LAYOUT_CHANGED, null);
        this.events.emit(EditorEvents.SELECTION_CHANGED, null);
    }

    /**
     * Points the editor at a replacement root, the old one having already been
     * swapped out in the live tree (Convert/Wrap on the root, or the first widget
     * of an empty layout). `null` when the root was deleted. Not `openLayout`:
     * the tree, the variables model and the history stacks all stay as they are.
     */
    public setRootWindow(window: IWindow | null): void
    {
        this._rootWindow = window;
        this.events.emit(EditorEvents.LAYOUT_CHANGED, window);
    }

    /**
     * The primary selection — the node the inspector edits and the one carrying
     * the resize handles. It is the last node added to the selection.
     */
    public get selected(): IWindow | null
    {
        return this._selection.length > 0 ? this._selection[this._selection.length - 1] : null;
    }

    /** Every selected node, in the order they were selected. */
    public get selection(): readonly IWindow[]
    {
        return this._selection;
    }

    public isSelected(window: IWindow | null): boolean
    {
        return window !== null && this._selection.indexOf(window) >= 0;
    }

    public get currentLayoutName(): string | null
    {
        return this._currentLayoutName;
    }

    /** Editor interaction mode (`edit` owns the centre, `preview` hands it over). */
    public get mode(): EditorMode
    {
        return this._mode;
    }

    public set mode(value: EditorMode)
    {
        if(this._mode === value)
        {
            return;
        }

        this._mode = value;
        this.events.emit(EditorEvents.VIEW_CHANGED);
    }

    /** Canvas magnification of the edited layout (the chrome never scales). */
    public get zoom(): number
    {
        return this._zoom;
    }

    public set zoom(value: number)
    {
        const next = Math.max(0.25, Math.min(8, value || 1));

        if(next === this._zoom)
        {
            return;
        }

        this._zoom = next;
        this.events.emit(EditorEvents.VIEW_CHANGED);
    }

    /** The open layout's authored root position, before the editor centred it. */
    public get rootOrigin(): { x: number; y: number }
    {
        return this._rootOrigin;
    }

    /** The source-XML `<variables>` model for the open layout (edited off the XML). */
    public get variables(): VariablesModel | null
    {
        return this._variables;
    }

    /** Grid snap size in pixels for canvas manipulation (0 = off). */
    public get snap(): number
    {
        return this._snap;
    }

    public set snap(value: number)
    {
        this._snap = Math.max(0, Math.floor(value) || 0);
    }

    /** Snaps a value to the grid, or returns it unchanged when snapping is off. */
    public snapValue(value: number): number
    {
        return this._snap > 0 ? Math.round(value / this._snap) * this._snap : Math.round(value);
    }

    /** All registered layout names, sorted. */
    public getLayoutNames(): string[]
    {
        return this._runtime.windowManager.getRegisteredWidgetLayoutNames().slice().sort();
    }

    /**
     * Builds a registered layout (destroying any previous one) and selects its root.
     */
    public openLayout(name: string): void
    {
        this.destroyRoot();

        const wm = this._runtime.windowManager;
        const built = wm.buildWidgetLayout(name);

        if(!built)
        {
            return;
        }

        // `buildFromXML` returns the root detached (parent null, faithful to AS3),
        // so the caller must place it. Attach it to the layer-1 desktop: without a
        // parent, container-rooted layouts have no graphic context and never render
        // (leaving the previous layout's stale pixels on screen), and `center()` —
        // which is a no-op when parentless — can't position it.
        const desktop = wm.getDesktop(1);

        if(desktop)
        {
            (desktop as unknown as { addChild(child: IWindow): IWindow }).addChild(built);
        }

        // `center()` overwrites the root's authored position with a canvas
        // coordinate, so remember it first: the serializer puts it back, or the
        // saved layout would tell the client to place the window wherever it
        // happened to sit in the editor.
        this._rootOrigin = {x: built.x, y: built.y};
        this.centerInContent(built);

        this._rootWindow = built;
        this._currentLayoutName = name;
        this._selection = [built];
        this._variables = new VariablesModel(this._runtime.layoutXml.get(name) ?? '');

        // Opening a fresh layout starts a clean history; a restore (undo/redo)
        // re-enters here but is guarded inside so the stacks survive.
        this._history.onLayoutOpened();

        this.events.emit(EditorEvents.LAYOUT_CHANGED, built);
        this.events.emit(EditorEvents.SELECTION_CHANGED, built);
    }

    /**
     * Records a restore point before a mutation (undo). A non-null `coalesceKey`
     * collapses repeated same-key pushes into one step (e.g. a field typed
     * character-by-character, or a held nudge key).
     */
    public pushHistory(coalesceKey: string | null = null): void
    {
        this._history.push(coalesceKey);
    }

    public undo(): void
    {
        this._history.undo();
    }

    public redo(): void
    {
        this._history.redo();
    }

    public get canUndo(): boolean
    {
        return this._history.canUndo;
    }

    public get canRedo(): boolean
    {
        return this._history.canRedo;
    }

    /**
     * Aligns the selection. With two or more nodes selected they align against
     * the selection's own bounding box (Clove/Figma semantics); with one, against
     * its parent's edges/centre — Glaze's original behaviour.
     */
    public alignSelected(edge: AlignEdge): void
    {
        alignSelection(this, edge);
    }

    /**
     * Distributes the selection evenly along one axis. Needs three or more nodes
     * selected; with fewer, the caller's fallback (the selected container's own
     * children) applies.
     */
    public distributeSelected(axis: 'h' | 'v'): boolean
    {
        return distributeSelection(this, axis);
    }

    /** Re-centers the open root window within the canvas. */
    public centerRoot(): void
    {
        if(this._rootWindow && !this._rootWindow.disposed)
        {
            this.pushHistory();
            this.centerInContent(this._rootWindow);
            this.notifyGeometryChanged();
        }
    }

    /** `center()`, then shifted by the chrome so it lands in the visible canvas. */
    private centerInContent(win: IWindow): void
    {
        win.center();

        const insets = this.contentInsets?.();

        if(!insets) return;

        const controller = win as unknown as WindowController;

        controller.x += Math.round((insets.left - insets.right) / 2);
        controller.y += Math.round((insets.top - insets.bottom) / 2);
    }

    /** Replaces the selection with `window` (or clears it when null). */
    public select(window: IWindow | null): void
    {
        if(this._selection.length === (window ? 1 : 0) && (!window || this._selection[0] === window))
        {
            return;
        }

        this._selection = window ? [window] : [];
        this.events.emit(EditorEvents.SELECTION_CHANGED, this.selected);
    }

    /**
     * Adds `window` to the selection, or removes it when it is already in —
     * Ctrl/Cmd-click. Removing the primary promotes the previous node.
     */
    public toggleSelected(window: IWindow | null): void
    {
        if(!window || window.disposed)
        {
            return;
        }

        const index = this._selection.indexOf(window);

        if(index >= 0)
        {
            this._selection.splice(index, 1);
        }
        else
        {
            this._selection.push(window);
        }

        this.events.emit(EditorEvents.SELECTION_CHANGED, this.selected);
    }

    /** Replaces the selection with `windows` (marquee, Shift-range, Select All). */
    public selectMany(windows: IWindow[]): void
    {
        const next = windows.filter((win) => win && !win.disposed);

        if(next.length === this._selection.length && next.every((win, i) => this._selection[i] === win))
        {
            return;
        }

        this._selection = next;
        this.events.emit(EditorEvents.SELECTION_CHANGED, this.selected);
    }

    /** Drops nodes that were destroyed under the selection (after a delete). */
    public pruneSelection(): void
    {
        const kept = this._selection.filter((win) => !win.disposed);

        if(kept.length !== this._selection.length)
        {
            this._selection = kept;
            this.events.emit(EditorEvents.SELECTION_CHANGED, this.selected);
        }
    }

    /** Signals that a node's geometry, label or structure changed. */
    public notifyTreeChanged(): void
    {
        this.events.emit(EditorEvents.TREE_CHANGED);
    }

    /**
     * Signals the selected node's geometry changed via the canvas (drag/resize/
     * nudge/align) — lets the inspector refresh its x/y/w/h fields in place
     * without a full rebuild (which would steal focus while typing). Also
     * refreshes the hierarchy size labels.
     */
    public notifyGeometryChanged(): void
    {
        this.events.emit(EditorEvents.GEOMETRY_CHANGED);
        this.events.emit(EditorEvents.TREE_CHANGED);
    }

    /** Signals a change to the debug view toggles (Show Tags / Debug Rects / …). */
    public notifyDebugChanged(): void
    {
        this.events.emit(EditorEvents.DEBUG_CHANGED);
    }

    private destroyRoot(): void
    {
        if(this._rootWindow && !this._rootWindow.disposed)
        {
            this._rootWindow.destroy();
        }

        this._rootWindow = null;
        this._selection = [];
    }

    public dispose(): void
    {
        this.destroyRoot();
        this.events.removeAllListeners();
    }
}
