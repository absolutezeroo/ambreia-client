import type {ZoneCell} from '../zone/Zone.generated';

/** What the inspector and the tools act on: decor ids, or floor cells. Immutable. */
export class EditorSelection
{
    static readonly EMPTY = new EditorSelection(new Set(), []);

    private constructor(readonly ids: ReadonlySet<string>, readonly cells: readonly ZoneCell[])
    {
    }

    get isEmpty(): boolean
    {
        return this.ids.size === 0 && this.cells.length === 0;
    }

    /** Click: only this object. */
    static of(id: string): EditorSelection
    {
        return new EditorSelection(new Set([id]), []);
    }

    /** Shift+click: add or remove the object. */
    toggle(id: string): EditorSelection
    {
        const ids = new Set(this.ids);

        if(!ids.delete(id)) ids.add(id);

        return new EditorSelection(ids, []);
    }

    /** Drag on the floor: every cell of the rectangle between two corners. */
    static rectangle(a: ZoneCell, b: ZoneCell): EditorSelection
    {
        const [x0, x1] = [Math.min(a.x ?? 0, b.x ?? 0), Math.max(a.x ?? 0, b.x ?? 0)];
        const [y0, y1] = [Math.min(a.y ?? 0, b.y ?? 0), Math.max(a.y ?? 0, b.y ?? 0)];
        const cells: ZoneCell[] = [];

        for(let y = y0; y <= y1; y++)
        {
            for(let x = x0; x <= x1; x++) cells.push({x, y});
        }

        return new EditorSelection(new Set(), cells);
    }

    /** Drops ids that no longer exist (after an undo or a delete). */
    keepOnly(existing: ReadonlySet<string>): EditorSelection
    {
        const ids = [...this.ids].filter(id => existing.has(id));

        return ids.length === this.ids.size ? this : new EditorSelection(new Set(ids), this.cells);
    }
}
