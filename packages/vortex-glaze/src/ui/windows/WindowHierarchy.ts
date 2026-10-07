import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {WindowTreeInspector} from '@ambreia/ui/debugger/index';
import type {IWindowDebugNode} from '@ambreia/ui/debugger/index';
import {signal, computed, effect, onCleanup, type Scope, type SignalReader} from '@ambreia/common/reactive/index';
import {createWindowScope, bind, on, each, type IReconcilableList} from '@ambreia/ui/reactive/index';
import {type EditorState} from '../../state/EditorState';
import {signalsOf, type EditorSignals} from '../../state/EditorSignals';
import {canHaveChildren, dropNode, type DropPosition} from '../../ops/StructuralOps';
import type {CanvasSurface} from '../../canvas/CanvasSurface';
import {slotsOf} from '../LayoutSlots';

const ROW = slotsOf('glaze_hierarchy_row_xml');

interface IListLike { destroyListItems(): void; }
interface IContainerLike { addChild(child: IWindow): IWindow; }
interface IToggle { isSelected: boolean; disposed: boolean; }
interface IBitmapLike { bitmapData: ImageBitmap | null; invalidate(): void; }

/** The tree's collapse arrow, drawn once per direction and shared by every row. */
type TwistyDir = 'right' | 'down' | null;

const TWISTY_SIZE = 11;
const TWISTY_CACHE = new Map<string, ImageBitmap>();

const twistyBitmap = (dir: TwistyDir): ImageBitmap | null =>
{
    if(!dir) return null;

    const cached = TWISTY_CACHE.get(dir);

    if(cached) return cached;

    const canvas = new OffscreenCanvas(TWISTY_SIZE, TWISTY_SIZE);
    const ctx = canvas.getContext('2d');

    if(!ctx) return null;

    const s = TWISTY_SIZE;

    ctx.fillStyle = '#3c3c46';
    ctx.beginPath();

    if(dir === 'right')
    {
        ctx.moveTo(3, 1);
        ctx.lineTo(s - 2, s / 2);
        ctx.lineTo(3, s - 1);
    }
    else
    {
        ctx.moveTo(1, 3);
        ctx.lineTo(s - 1, 3);
        ctx.lineTo(s / 2, s - 2);
    }

    ctx.closePath();
    ctx.fill();

    const bitmap = canvas.transferToImageBitmap();

    TWISTY_CACHE.set(dir, bitmap);

    return bitmap;
};

const SELECTED_COLOR = 0xffef9a9a; // Glaze's pink selection tint
const CO_SELECTED_COLOR = 0xfff5cfcf; // secondary members of a multi-selection
const DROP_INSIDE_COLOR = 0xff9ad2ef;
const LABEL_COLOR = 0xffffffff;
const LABEL_HIDDEN_COLOR = 0xff9a9ab0;
const UNSELECTED_COLOR = 0x00ffffff;
const ROW_HEIGHT = 20;
const INDENT = 14;

/** Pixels the pointer must travel on a row before a click becomes a drag. */
const DRAG_SLOP = 4;

/** Hover time over a collapsed container before it springs open mid-drag. */
const AUTO_EXPAND_MS = 400;

/** One visible row of the flattened tree — the reconciler's item type. */
interface IHierarchyRow
{
    window: IWindow;
    depth: number;
    label: string;
    /** Greyed: the node or an ancestor is hidden. */
    dimmed: boolean;
    visible: boolean;
    hasChildren: boolean;
    arrow: TwistyDir;
}

/** A version signal: read it to depend on it, pulse it to invalidate readers. */
const pulse = (): [SignalReader<number>, () => void] =>
{
    const [read, write] = signal(0);
    let n = 0;

    return [read, (): void => write(++n)];
};

/**
 * WindowHierarchy — the "Hierarchy View" tree as Habbo widget rows.
 *
 * Each node becomes a row (`region`) with a visibility `checkbox`, a collapse
 * twisty, and a `name [type]` label, indented by depth. Clicking a row selects
 * the node (pink highlight, à la Glaze), Ctrl-click adds or removes it from the
 * selection and Shift-click takes the range; the checkbox toggles `visible`, and
 * a node under a hidden ancestor is greyed to show it inherits that. Dragging a
 * row reparents or reorders it. All Habbo widgets — no DOM.
 *
 * Reactive pilot (docs/REACTIVE-UI.md §8): the tree is a computed flattening,
 * rows are reconciled by key (`each`) instead of destroy-all-and-rebuild, and
 * selection/greying are per-row bindings. The old microtask coalescing is gone
 * — the scheduler's frame boundary *is* the coalescer, so a checkbox can never
 * dispose itself mid-event.
 */
export class WindowHierarchy
{
    private readonly _state: EditorState;
    private readonly _list: IWindow;
    private readonly _wm: EditorState['runtime']['windowManager'];
    private readonly _surface: CanvasSurface | null;
    private readonly _scope: Scope;

    private readonly _rowByWindow: Map<IWindow, IWindow> = new Map();
    private readonly _windowByRow: Map<IWindow, IWindow> = new Map();
    private readonly _collapsed: Set<IWindow> = new Set();

    private readonly _rows: SignalReader<IHierarchyRow[]>;
    private readonly _signals: EditorSignals;
    private readonly _collapsedRev: SignalReader<number>;
    private readonly _bumpCollapsed: () => void;
    private readonly _dropTintTarget: SignalReader<IWindow | null>;
    private readonly _setDropTintTarget: (win: IWindow | null) => void;

    private _dragSource: IWindow | null = null;
    private _dragOrigin: { x: number; y: number } | null = null;
    private _dragging = false;
    private _dropTarget: IWindow | null = null;
    private _dropPosition: DropPosition = 'after';
    private _indicator: IWindow | null = null;
    private _expandTimer = 0;
    private _expandCandidate: IWindow | null = null;
    private _docMove: ((e: MouseEvent) => void) | null = null;
    private _docUp: ((e: MouseEvent) => void) | null = null;

    public constructor(state: EditorState, list: IWindow, surface: CanvasSurface | null = null)
    {
        this._state = state;
        this._wm = state.runtime.windowManager;
        this._list = list;
        this._surface = surface;
        this._scope = createWindowScope(list);

        this._signals = signalsOf(state);
        [this._collapsedRev, this._bumpCollapsed] = pulse();
        [this._dropTintTarget, this._setDropTintTarget] = signal<IWindow | null>(null);

        this._rows = this._scope.run(() => computed((): IHierarchyRow[] => this.flatten()));

        each(this._scope, this._list as unknown as IReconcilableList, this._rows, {
            key: (row) => row.window,
            create: (row, initial) => this.buildRow(row, initial),
        });
    }

    /** Expands every node (Glaze's "Expand"). */
    public expandAll(): void
    {
        this._collapsed.clear();
        this._bumpCollapsed();
    }

    /** Depth-first flattening of the current tree, honouring collapse state. */
    private flatten(): IHierarchyRow[]
    {
        this._signals.layoutRev();
        this._signals.treeRev();
        this._signals.debugRev();
        this._collapsedRev();

        const out: IHierarchyRow[] = [];
        const root = this._state.rootWindow;

        if(!root || root.disposed)
        {
            return out;
        }

        const walk = (node: IWindowDebugNode, depth: number, ancestorHidden: boolean): void =>
        {
            const hasChildren = node.children.length > 0;
            const collapsed = this._collapsed.has(node.window);
            const name = node.name ? `${node.name} ` : '';
            const tags = this._state.showTags && node.tags.length > 0 ? `  {${node.tags.join(',')}}` : '';

            out.push({
                window: node.window,
                depth,
                label: `${name}[${node.typeName}]${tags}`,
                dimmed: ancestorHidden || !node.visible,
                visible: node.visible,
                hasChildren,
                arrow: hasChildren ? (collapsed ? 'right' : 'down') : null,
            });

            if(hasChildren && !collapsed)
            {
                for(const child of node.children)
                {
                    walk(child, depth + 1, ancestorHidden || !node.visible);
                }
            }
        };

        walk(WindowTreeInspector.snapshot(root), 0, false);

        return out;
    }

    /**
     * Builds one row and its bindings. Runs once per node lifetime; everything
     * that varies reads `row()` and updates in place.
     */
    private buildRow(row: SignalReader<IHierarchyRow>, initial: IHierarchyRow): IWindow | null
    {
        const rowWin = this._wm.buildWidgetLayout('glaze_hierarchy_row_xml');

        if(!rowWin)
        {
            return null;
        }

        const win = initial.window;
        const rc = rowWin as unknown as WindowController;

        rc.height = ROW_HEIGHT;

        this._rowByWindow.set(win, rowWin);
        this._windowByRow.set(rowWin, win);
        // Registry entries die with the row's scope (collapse, removal, dispose).
        onCleanup(() =>
        {
            this._rowByWindow.delete(win);
            this._windowByRow.delete(rowWin);
        });

        const vis = ROW.findAs<IToggle & IWindow>(rowWin, 'glaze_row_vis');
        const twisty = ROW.findAs<WindowController>(rowWin, 'glaze_row_twisty');
        const arrow = ROW.findAs<IBitmapLike>(rowWin, 'glaze_row_arrow');
        const labelEl = ROW.findAs<WindowController & { text: string }>(rowWin, 'glaze_row_label');

        if(vis)
        {
            bind(vis, 'x', () => 4 + row().depth * INDENT);
            bind(vis, 'isSelected', () => row().visible);
            on(vis, 'WE_SELECTED', () => this.setVisible(win, true));
            on(vis, 'WE_UNSELECTED', () => this.setVisible(win, false));
        }

        if(twisty)
        {
            bind(twisty, 'x', () => 26 + row().depth * INDENT);
            twisty.procedure = (event: WindowEvent): void =>
            {
                if(event.type === WindowMouseEvent.CLICK && row().hasChildren)
                {
                    this.toggleCollapse(win);
                }
            };
        }

        if(arrow)
        {
            // Not a text glyph: `▸`/`▾` are absent from the Illumina font atlas
            // and came out as a dash. Glaze draws a filled triangle, so the port
            // draws one too and shows it through the bitmap slot.
            effect(() =>
            {
                if((arrow as unknown as IWindow).disposed) return;

                const next = twistyBitmap(row().arrow);

                if(arrow.bitmapData === next) return;

                arrow.bitmapData = next;
                arrow.invalidate();
            });
        }

        if(labelEl)
        {
            bind(labelEl, 'text', () => row().label);
            bind(labelEl, 'x', () => 42 + row().depth * INDENT);
            // A node under a hidden ancestor renders nothing even with its own
            // `visible` still true — grey it so the tree says why.
            bind(labelEl, 'color', () => (row().dimmed ? LABEL_HIDDEN_COLOR : LABEL_COLOR));
        }

        // Selection tint and mid-drag drop tint share the row background.
        bind(rc, 'background', () =>
        {
            this._signals.selectionRev();

            return this._dropTintTarget() === win || this._state.isSelected(win);
        });
        bind(rc, 'color', () =>
        {
            this._signals.selectionRev();

            if(this._dropTintTarget() === win)
            {
                return DROP_INSIDE_COLOR;
            }

            if(!this._state.isSelected(win))
            {
                return UNSELECTED_COLOR;
            }

            return win === this._state.selected ? SELECTED_COLOR : CO_SELECTED_COLOR;
        });

        rc.procedure = (event: WindowEvent): void =>
        {
            // Selection runs on DOWN, not CLICK: only the down event carries the
            // Ctrl/Shift modifiers, and it is also where a row drag begins.
            if(event.type === WindowMouseEvent.DOWN)
            {
                this.onRowDown(win, event as WindowMouseEvent);
            }
        };

        return rowWin;
    }

    // ---- Selection ---------------------------------------------------------

    private onRowDown(window: IWindow, event: WindowMouseEvent): void
    {
        if(event.ctrlKey || event.altKey)
        {
            this._state.toggleSelected(window);

            return;
        }

        if(event.shiftKey)
        {
            this.selectRangeTo(window);

            return;
        }

        if(!this._state.isSelected(window))
        {
            this._state.select(window);
        }

        this.beginRowDrag(window, event);
    }

    /** Shift-click: everything between the primary selection and the clicked row. */
    private selectRangeTo(window: IWindow): void
    {
        const order = this._rows().map((row) => row.window);
        const anchor = this._state.selected;
        const from = anchor ? order.indexOf(anchor) : -1;
        const to = order.indexOf(window);

        if(from < 0 || to < 0)
        {
            this._state.select(window);

            return;
        }

        const start = Math.min(from, to);
        const end = Math.max(from, to);

        this._state.selectMany(order.slice(start, end + 1));
    }

    // ---- Drag & drop -------------------------------------------------------

    private beginRowDrag(window: IWindow, event: WindowMouseEvent): void
    {
        if(window === this._state.rootWindow || !this._surface)
        {
            return;
        }

        this._dragSource = window;
        this._dragOrigin = {x: event.stageX, y: event.stageY};
        this._dragging = false;

        this._docMove = (e: MouseEvent): void => this.onDragMove(e);
        this._docUp = (): void => this.onDragUp();

        document.addEventListener('mousemove', this._docMove);
        document.addEventListener('mouseup', this._docUp);
    }

    private onDragMove(e: MouseEvent): void
    {
        if(!this._dragSource || !this._dragOrigin || !this._surface)
        {
            return;
        }

        if(!this._dragging)
        {
            const travelled = Math.abs(e.clientX - this._dragOrigin.x) + Math.abs(e.clientY - this._dragOrigin.y);

            if(travelled < DRAG_SLOP)
            {
                return;
            }

            this._dragging = true;
        }

        const point = this._surface.toCanvasCoords(e);
        const hit = this._wm.findWindowAtPoint(point.x, point.y);
        const row = this.rowOf(hit);

        if(!row)
        {
            this.clearDropFeedback();
            this._dropTarget = this.overList(point.x, point.y) ? this._state.rootWindow : null;
            this._dropPosition = 'inside';

            return;
        }

        const target = this._windowByRow.get(row) ?? null;

        if(!target || target === this._dragSource)
        {
            this.clearDropFeedback();
            this._dropTarget = null;

            return;
        }

        const rect = {x: 0, y: 0, width: 0, height: 0};

        row.getGlobalRectangle(rect);

        const ratio = rect.height > 0 ? (point.y - rect.y) / rect.height : 0.5;
        const insideAllowed = canHaveChildren(target);

        this._dropTarget = target;
        // The root row only ever takes `inside`: before/after would make the node
        // a sibling of the root under the desktop, which is not part of the
        // layout. Rejecting the row outright was the reason a nested node could
        // never be lifted back out to the top level.
        this._dropPosition = target === this._state.rootWindow ? 'inside'
            : ratio < 0.3 ? 'before'
                : ratio > 0.7 ? 'after'
                    : (insideAllowed ? 'inside' : (ratio < 0.5 ? 'before' : 'after'));

        // A collapsed container springs open when hovered, so a node can be
        // dropped into a branch without leaving the drag.
        if(this._dropPosition === 'inside' && this._collapsed.has(target))
        {
            this.armAutoExpand(target);
        }
        else
        {
            this.cancelAutoExpand();
        }

        this.showDropFeedback(row, rect);
    }

    private onDragUp(): void
    {
        const source = this._dragSource;
        const target = this._dropTarget;
        const position = this._dropPosition;
        const dragged = this._dragging;

        this.endRowDrag();

        if(!dragged || !source || !target || source.disposed || target.disposed)
        {
            return;
        }

        dropNode(this._state, source, target, position);
    }

    private endRowDrag(): void
    {
        if(this._docMove) document.removeEventListener('mousemove', this._docMove);
        if(this._docUp) document.removeEventListener('mouseup', this._docUp);

        this._docMove = null;
        this._docUp = null;
        this._dragSource = null;
        this._dragOrigin = null;
        this._dragging = false;
        this._dropTarget = null;
        this.cancelAutoExpand();
        this.clearDropFeedback();
    }

    /** The registered row a hit window belongs to (rows own nested widgets). */
    private rowOf(hit: IWindow | null): IWindow | null
    {
        let node: IWindow | null = hit;

        while(node)
        {
            if(this._windowByRow.has(node))
            {
                return node;
            }

            node = node.parent;
        }

        return null;
    }

    /** True when the point is over the tree list but past its last row. */
    private overList(x: number, y: number): boolean
    {
        const list = this._list;

        if(!list || list.disposed)
        {
            return false;
        }

        const rect = {x: 0, y: 0, width: 0, height: 0};

        list.getGlobalRectangle(rect);

        return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
    }

    private armAutoExpand(target: IWindow): void
    {
        if(this._expandCandidate === target)
        {
            return;
        }

        this.cancelAutoExpand();
        this._expandCandidate = target;
        this._expandTimer = window.setTimeout(() =>
        {
            this._expandTimer = 0;
            this._expandCandidate = null;
            this._collapsed.delete(target);
            this._bumpCollapsed();
        }, AUTO_EXPAND_MS);
    }

    private cancelAutoExpand(): void
    {
        if(this._expandTimer)
        {
            window.clearTimeout(this._expandTimer);
        }

        this._expandTimer = 0;
        this._expandCandidate = null;
    }

    /**
     * Paints the drop hint: a line above/below the row for before/after, and a
     * blue tint on the row itself for a drop inside it. The tint is a signal
     * the row's own colour bindings read; the 2px line stays imperative (it is
     * positional feedback, not state).
     */
    private showDropFeedback(row: IWindow, rect: { x: number; y: number; width: number; height: number }): void
    {
        this.clearDropFeedback();

        if(this._dropPosition === 'inside')
        {
            this._setDropTintTarget(this._windowByRow.get(row) ?? null);

            return;
        }

        const indicator = this.indicator();

        if(!indicator)
        {
            return;
        }

        const parent = indicator.parent;

        if(!parent)
        {
            return;
        }

        const parentRect = {x: 0, y: 0, width: 0, height: 0};

        parent.getGlobalRectangle(parentRect);

        const y = this._dropPosition === 'before' ? rect.y : rect.y + rect.height;

        (indicator as unknown as WindowController).rectangle = {
            x: rect.x - parentRect.x,
            y: Math.round(y - parentRect.y) - 1,
            width: rect.width,
            height: 2
        };
        indicator.visible = true;
    }

    private clearDropFeedback(): void
    {
        this._setDropTintTarget(null);

        if(this._indicator && !this._indicator.disposed)
        {
            this._indicator.visible = false;
        }
    }

    /** The 2px drop line, built once next to the list so it floats over the rows. */
    private indicator(): IWindow | null
    {
        if(this._indicator && !this._indicator.disposed)
        {
            return this._indicator;
        }

        const list = this._list;
        const parent = list?.parent;

        if(!parent || parent.disposed)
        {
            return null;
        }

        const bar = this._wm.buildWidgetLayout('glaze_swatch_xml');

        if(!bar)
        {
            return null;
        }

        (parent as unknown as IContainerLike).addChild(bar);
        (bar as unknown as WindowController).color = 0xff12b5c9;
        bar.visible = false;
        this._indicator = bar;

        return bar;
    }

    private setVisible(win: IWindow, visible: boolean): void
    {
        if(win.disposed || win.visible === visible)
        {
            return;
        }

        win.visible = visible;
        // Descendants inherit the change, so the greying has to catch up — a
        // data update through the reconciler, not a rebuild: no row is
        // destroyed, so the checkbox that triggered this can never dispose
        // itself mid-event. Notified through the state, so any panel showing
        // visibility stays honest too.
        this._state.notifyTreeChanged();
    }

    private toggleCollapse(win: IWindow): void
    {
        if(this._collapsed.has(win)) this._collapsed.delete(win);
        else this._collapsed.add(win);

        this._bumpCollapsed();
    }

    public dispose(): void
    {
        this.endRowDrag();
        this._scope.dispose();
        this._indicator?.destroy();
        this._indicator = null;
        (this._list as unknown as IListLike).destroyListItems();
        this._rowByWindow.clear();
        this._windowByRow.clear();
    }
}
