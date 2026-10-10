import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import {elementCells} from '@ambreia/map-editor-core/zone/elementCells';
import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';
import type {EditorApp} from '../../app/EditorApp';
import {onWindowClick, setText} from '../bind';
import {describeElement} from './describeElement';
import {monsterName} from './monsterLabels';

const SELECTED = 0xffcfe6ff;
const COMPLETE = 0xff3d9a46;
const INCOMPLETE = 0xfff0a020;

/**
 * The elements of one layer as entity_row lines in an item list: a click selects the element and
 * centres the view on it. Rebuilt only when the layer or the filter changes.
 */
export class EntityListUi
{
    private _shown = '';
    private _rows: {id: string; window: IWindow; color: number}[] = [];

    constructor(
        private readonly _list: IItemListWindow | null,
        private readonly _app: EditorApp,
        private readonly _layer: LayerKey,
        private readonly _build: (layout: string) => IWindow | null
    )
    {
    }

    render(query: string): void
    {
        const list = this._list;
        const app = this._app;

        if(!list) return;

        const items = ((app.doc[this._layer] ?? []) as unknown as Record<string, unknown>[])
            .map(e => ({e, d: describeElement(this._layer, e, app.doc, id => monsterName(id, app.texts))}))
            .filter(({e, d}) => !query || `${e.id} ${d.title} ${d.sub}`.toLowerCase().includes(query.toLowerCase()));
        const key = JSON.stringify(items.map(i => [i.e.id, i.d]));

        if(key !== this._shown)
        {
            this._shown = key;
            this._rows = [];
            list.destroyListItems();

            const rows: IWindow[] = [];

            for(const {e, d} of items)
            {
                const row = this._build('vortex_map_editor_entity_row_xml');

                if(!row) break;

                const id = String(e.id);

                setText(row, 'entity_title', d.title);
                setText(row, 'entity_sub', d.sub);
                setText(row, 'more_txt', '');

                const dot = (row as unknown as {findChildByName(n: string): IWindow | null}).findChildByName('status_dot');

                if(dot) dot.color = d.complete ? COMPLETE : INCOMPLETE;
                onWindowClick(row, () => this.pick(id));
                rows.push(row);
                this._rows.push({id, window: row, color: row.color});
            }

            list.populate(rows);
        }

        const selected = app.world.element?.layer === this._layer ? app.world.element.id : null;

        for(const row of this._rows)
        {
            const color = row.id === selected ? SELECTED : row.color;

            if(row.window.color !== color) row.window.color = color;
        }
    }

    private pick(id: string): void
    {
        const app = this._app;
        const element = ((app.doc[this._layer] ?? []) as {id: string}[]).find(e => e.id === id);
        const cells = element ? elementCells(element, app.doc) : [];

        app.world.select(this._layer, id);
        if(cells.length) app.view.centerOn(cells[0].x ?? 0, cells[0].y ?? 0);
    }
}
