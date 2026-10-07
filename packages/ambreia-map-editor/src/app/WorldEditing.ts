import {addElement} from '@ambreia/map-editor-core/commands/addElement';
import {duplicateElements} from '@ambreia/map-editor-core/commands/duplicateElements';
import {removeElements} from '@ambreia/map-editor-core/commands/removeElements';
import {updateElement} from '@ambreia/map-editor-core/commands/updateElement';
import {EditorSelection} from '@ambreia/map-editor-core/selection/EditorSelection';
import {elementAt} from '@ambreia/map-editor-core/zone/elementAt';
import type {LayerItem} from '@ambreia/map-editor-core/zone/LayerItem';
import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';
import {newElement} from '@ambreia/map-editor-core/zone/newElement';
import {translateElement} from '@ambreia/map-editor-core/zone/translateElement';
import {withShape} from '@ambreia/map-editor-core/zone/withShape';
import type {ZoneCell} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {IPick} from '../view/IPick';
import {CATEGORY_LAYER} from './CATEGORY_LAYER';
import type {EditorApp} from './EditorApp';
import type {IElementRef} from './IElementRef';
import type {WorldTool} from './WorldTool';

type Cell = {readonly x: number; readonly y: number};

/**
 * Editing the world layers (entries, passages, areas, NPCs, spawns, triggers…): which element is
 * selected, the tools that act on the view in those categories, and the list actions. Every
 * change goes through the generic layer commands, so each is one undo step.
 */
export class WorldEditing
{
    element: IElementRef | null = null;
    tool: WorldTool = 'select';
    /** Points of the polygon being drawn. */
    polygon: Cell[] = [];
    /** Cells of the rectangle being drawn. */
    preview: Cell[] = [];

    private _dragFrom: Cell | null = null;
    private _dragTo: Cell | null = null;
    private _rectFrom: Cell | null = null;

    constructor(private readonly _app: EditorApp)
    {
    }

    /** The layer the current category edits, or null for floor, mobis, walls, ambience, settings. */
    get layer(): LayerKey | null
    {
        return CATEGORY_LAYER[this._app.category] ?? null;
    }

    /** The selected element, when it still exists. */
    current<K extends LayerKey>(layer: K): (LayerItem<K> & {id: string}) | null
    {
        if(this.element?.layer !== layer) return null;

        return ((this._app.doc[layer] ?? []) as (LayerItem<K> & {id: string})[]).find(e => e.id === this.element!.id) ?? null;
    }

    get dragOffset(): {dx: number; dy: number} | null
    {
        if(!this._dragFrom || !this._dragTo) return null;

        const dx = this._dragTo.x - this._dragFrom.x;
        const dy = this._dragTo.y - this._dragFrom.y;

        return dx || dy ? {dx, dy} : null;
    }

    select(layer: LayerKey, id: string | null): void
    {
        this.element = id ? {layer, id} : null;
        this._app.selection = EditorSelection.EMPTY;
        this._app.refresh();
    }

    setTool(tool: WorldTool): void
    {
        this.tool = tool;
        this.polygon = [];
        this.preview = [];
        this._app.refresh();
    }

    /** "Ajouter": a new element on the cell under the pointer, or at the centre of the floor. */
    add(layer: LayerKey, cell: ZoneCell | null = null): void
    {
        const app = this._app;
        const at = cell ?? app.hover ?? {x: Math.floor(app.doc.floor.width / 2), y: Math.floor(app.doc.floor.length / 2)};
        const element = newElement(layer, app.doc, at);

        app.execute(addElement(layer, element));
        this.select(layer, (element as {id: string}).id);
    }

    duplicate(): void
    {
        const ref = this.element;

        if(!ref) return;

        const before = new Set(((this._app.doc[ref.layer] ?? []) as {id: string}[]).map(e => e.id));

        this._app.execute(duplicateElements(ref.layer, [ref.id]));

        const added = ((this._app.doc[ref.layer] ?? []) as {id: string}[]).find(e => !before.has(e.id));

        if(added) this.select(ref.layer, added.id);
    }

    remove(): void
    {
        const ref = this.element;

        if(!ref) return;

        this._app.execute(removeElements(ref.layer, [ref.id]));
        this.select(ref.layer, null);
    }

    /** One field (or several) of the selected element, as one undo step. */
    update<K extends LayerKey>(layer: K, patch: Partial<LayerItem<K>>, label?: string): void
    {
        const ref = this.element;

        if(ref?.layer !== layer) return;

        this._app.execute(updateElement(layer, ref.id, patch, label));
    }

    /** Enter closes the polygon being drawn; Escape drops it. */
    key(key: string): boolean
    {
        if(this.tool !== 'polygon' || !this.polygon.length) return false;

        if(key === 'enter') this.closePolygon();
        else if(key === 'escape') this.polygon = [];
        else return false;

        this._app.refresh();

        return true;
    }

    pointer(kind: 'down' | 'move' | 'up', pick: IPick, e: MouseEvent): void
    {
        const layer = this.layer;

        if(!layer) return;

        switch(this.tool)
        {
            case 'select':
                this.selectTool(layer, kind, pick);
                break;
            case 'place':
                if(kind === 'down' && pick.cell) this.add(layer, pick.cell);
                break;
            case 'rect':
                this.rectTool(layer, kind, pick);
                break;
            case 'polygon':
                if(kind !== 'down' || !pick.cell) break;
                // Double click, or a click back on the first point, closes the polygon.
                if(e.detail > 1 || (this.polygon.length > 2 && this.polygon[0].x === pick.cell.x && this.polygon[0].y === pick.cell.y))
                {
                    this.closePolygon();
                }
                else this.polygon = [...this.polygon, pick.cell];
                this._app.refresh();
                break;
        }
    }

    private selectTool(layer: LayerKey, kind: 'down' | 'move' | 'up', pick: IPick): void
    {
        const app = this._app;

        if(kind === 'down')
        {
            const hit = pick.cell ? elementAt(app.doc, layer, pick.cell.x, pick.cell.y) : null;

            this.select(layer, hit?.id ?? null);
            this._dragFrom = hit ? pick.cell : null;
            this._dragTo = this._dragFrom;
        }
        else if(kind === 'move' && this._dragFrom && pick.cell) this._dragTo = pick.cell;
        else if(kind === 'up')
        {
            const offset = this.dragOffset;
            const current = this.current(layer);

            this._dragFrom = null;
            this._dragTo = null;
            if(offset && current)
            {
                const moved = translateElement(current, offset.dx, offset.dy, app.doc.floor);

                if(moved !== current) app.execute(updateElement(layer, current.id, moved as Partial<LayerItem<typeof layer>>, `Déplacer ${current.id}`));
            }
            app.refresh();
        }
    }

    private rectTool(layer: LayerKey, kind: 'down' | 'move' | 'up', pick: IPick): void
    {
        if(kind === 'down' && pick.cell) this._rectFrom = pick.cell;

        const from = this._rectFrom;

        if(!from || !pick.cell) return;

        const corners: Cell[] = [
            {x: from.x, y: from.y}, {x: pick.cell.x, y: from.y}, {x: pick.cell.x, y: pick.cell.y}, {x: from.x, y: pick.cell.y}
        ];

        this.preview = EditorSelection.rectangle(from, pick.cell).cells.map(c => ({x: c.x ?? 0, y: c.y ?? 0}));

        if(kind !== 'up') return;

        this._rectFrom = null;
        this.preview = [];
        // Four corners even for a single row: the polygon's edges cover their cells.
        this.applyShape(layer, corners);
    }

    private closePolygon(): void
    {
        const layer = this.layer;
        const points = this.polygon;

        this.polygon = [];
        if(layer && points.length >= 3) this.applyShape(layer, points);
    }

    /** The drawn shape becomes the selected element's, or a new element's when none is selected. */
    private applyShape(layer: LayerKey, points: readonly Cell[]): void
    {
        const app = this._app;
        const floor = app.doc.floor;
        const current = this.current(layer);

        if(current)
        {
            app.execute(updateElement(layer, current.id, withShape(layer, current, points, floor) as Partial<LayerItem<typeof layer>>, `Forme de ${current.id}`));
        }
        else
        {
            const element = withShape(layer, newElement(layer, app.doc, points[0]), points, floor);

            app.execute(addElement(layer, element));
            this.select(layer, (element as {id: string}).id);
        }

        app.refresh();
    }
}
