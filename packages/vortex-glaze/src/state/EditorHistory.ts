import type {IWindow} from '@ambreia/ui/IWindow';
import {serializeLayout, importLayoutXml} from '../ops/LayoutSerializer';
import type {EditorState} from './EditorState';

interface ISnapshot
{
    xml: string;
    path: number[] | null;
}

interface IContainerLike
{
    numChildren?: number;
    getChildAt?: (index: number) => IWindow | null;
}

/** Cap on retained undo steps (each is a serialized layout XML). */
const MAX_HISTORY = 60;

/** Rapid same-key pushes within this window collapse into one entry (typing). */
const COALESCE_MS = 600;

/**
 * EditorHistory — undo/redo for the open layout.
 *
 * Every mutating gesture calls {@link EditorState.pushHistory} *before* it runs;
 * that captures a full snapshot (the layout serialized via {@link serializeLayout},
 * plus the selected node's index path). Undo restores the previous snapshot by
 * re-registering its XML and reopening it ({@link importLayoutXml}) — the same
 * round-trip Save/Export use — then reselecting the node at the stored path.
 *
 * Snapshots are whole-layout rather than per-op inverse commands: the editor's
 * mutations are heterogeneous (drag, structural add/convert, property edits, theme
 * remaps, variable edits) and the serializer already gives a faithful, single
 * source of truth to diff against. `pushHistory(key)` coalesces same-key calls
 * (a property field typed character-by-character = one undo step).
 */
export class EditorHistory
{
    private readonly _state: EditorState;
    private _undo: ISnapshot[] = [];
    private _redo: ISnapshot[] = [];
    private _lastKey: string | null = null;
    private _lastTime = 0;
    private _restoring = false;

    public constructor(state: EditorState)
    {
        this._state = state;
    }

    public get canUndo(): boolean
    {
        return this._undo.length > 0;
    }

    public get canRedo(): boolean
    {
        return this._redo.length > 0;
    }

    /**
     * Records the current state as a restore point. Called before a mutation.
     * A non-null `coalesceKey` collapses repeated same-key pushes (e.g. typing in
     * one field) into a single step within {@link COALESCE_MS}.
     */
    public push(coalesceKey: string | null): void
    {
        if(this._restoring)
        {
            return;
        }

        const now = Date.now();

        if(coalesceKey !== null && coalesceKey === this._lastKey && (now - this._lastTime) < COALESCE_MS)
        {
            this._lastTime = now;

            return;
        }

        const snapshot = this.capture();

        if(!snapshot)
        {
            return;
        }

        this._undo.push(snapshot);

        if(this._undo.length > MAX_HISTORY)
        {
            this._undo.shift();
        }

        this._redo = [];
        this._lastKey = coalesceKey;
        this._lastTime = now;
    }

    public undo(): void
    {
        if(!this.canUndo)
        {
            return;
        }

        const current = this.capture();
        const previous = this._undo.pop()!;

        if(current)
        {
            this._redo.push(current);
        }

        this._lastKey = null;
        this.restore(previous);
    }

    public redo(): void
    {
        if(!this.canRedo)
        {
            return;
        }

        const current = this.capture();
        const next = this._redo.pop()!;

        if(current)
        {
            this._undo.push(current);
        }

        this._lastKey = null;
        this.restore(next);
    }

    /** Clears both stacks when a brand-new layout is opened (never during restore). */
    public onLayoutOpened(): void
    {
        if(this._restoring)
        {
            return;
        }

        this._undo = [];
        this._redo = [];
        this._lastKey = null;
    }

    private capture(): ISnapshot | null
    {
        const xml = serializeLayout(this._state);

        if(!xml)
        {
            return null;
        }

        return {xml, path: this.pathOf(this._state.selected)};
    }

    private restore(snapshot: ISnapshot): void
    {
        const name = this._state.currentLayoutName;

        if(!name)
        {
            return;
        }

        this._restoring = true;

        try
        {
            importLayoutXml(this._state, snapshot.xml, name);

            const node = snapshot.path
                ? this.nodeAtPath(this._state.rootWindow, snapshot.path)
                : this._state.rootWindow;

            this._state.select(node ?? this._state.rootWindow);
        }
        finally
        {
            this._restoring = false;
        }
    }

    /** Index path from the root to `node`, or null if it is not under the root. */
    private pathOf(node: IWindow | null): number[] | null
    {
        const root = this._state.rootWindow;

        if(!node || !root)
        {
            return null;
        }

        if(node === root)
        {
            return [];
        }

        const path: number[] = [];
        let cur: IWindow | null = node;

        while(cur && cur !== root)
        {
            const parent: IWindow | null = cur.parent;

            if(!parent)
            {
                return null;
            }

            const index = this.indexOf(parent, cur);

            if(index < 0)
            {
                return null;
            }

            path.unshift(index);
            cur = parent;
        }

        return cur === root ? path : null;
    }

    private nodeAtPath(root: IWindow | null, path: number[]): IWindow | null
    {
        let cur: IWindow | null = root;

        for(const index of path)
        {
            if(!cur)
            {
                return null;
            }

            cur = this.childAt(cur, index);
        }

        return cur;
    }

    private indexOf(parent: IWindow, child: IWindow): number
    {
        const container = parent as unknown as IContainerLike;

        if(typeof container.numChildren !== 'number' || !container.getChildAt)
        {
            return -1;
        }

        for(let i = 0; i < container.numChildren; i++)
        {
            if(container.getChildAt(i) === child)
            {
                return i;
            }
        }

        return -1;
    }

    private childAt(parent: IWindow, index: number): IWindow | null
    {
        const container = parent as unknown as IContainerLike;

        if(typeof container.numChildren !== 'number' || !container.getChildAt)
        {
            return null;
        }

        if(index < 0 || index >= container.numChildren)
        {
            return null;
        }

        return container.getChildAt(index);
    }
}
