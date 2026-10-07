import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {EditorApp} from '../../app/EditorApp';
import type {WorldTool} from '../../app/WorldTool';
import {child, children, highlight, onClick, onWindowClick, SearchField, setEnabled} from '../bind';
import type {IPanelUi} from '../IPanelUi';
import {EntityListUi} from './EntityListUi';

/**
 * "Spawns et zones" (vortex_map_editor_left_spawns_xml), shown for both rail categories: the
 * monster spawns and the areas, each with its "+", the shape tools (Rectangle, Polygone) and
 * Ajouter / Dupliquer / Supprimer for the current category's layer.
 */
export class SpawnZonePanelUi implements IPanelUi
{
    private readonly _spawns: EntityListUi;
    private readonly _areas: EntityListUi;
    private readonly _search: SearchField;
    private readonly _labels: IWindow[];
    private readonly _shapes: IWindow[];
    private readonly _shapeColors: number[];

    constructor(private readonly _window: IWindow, private readonly _app: EditorApp, build: (layout: string) => IWindow | null)
    {
        const app = _app;

        this._spawns = new EntityListUi(child<IItemListWindow>(_window, 'spawn_list'), app, 'spawns', build);
        this._areas = new EntityListUi(child<IItemListWindow>(_window, 'zone_list'), app, 'zones', build);
        this._search = new SearchField(_window, 'search_input', () => this.render());
        this._labels = children(_window, 'group_label');

        // The two "+" of the group headers, in layout order: spawns, then areas.
        const adds = children(_window, 'add_button');

        if(adds[0]) onWindowClick(adds[0], () => this.addTo('spawns'));
        if(adds[1]) onWindowClick(adds[1], () => this.addTo('zones'));

        this._shapes = [child(_window, 'shape_rectangle'), child(_window, 'shape_polygon')].filter((w): w is IWindow => !!w);
        this._shapeColors = this._shapes.map(s => s.color);
        onClick(_window, 'shape_rectangle', () => this.tool('rect'));
        onClick(_window, 'shape_polygon', () => this.tool('polygon'));
        onClick(_window, 'list_button_0', () => app.world.layer && app.world.add(app.world.layer));
        onClick(_window, 'list_button_1', () => app.world.duplicate());
        onClick(_window, 'list_button_2', () => app.world.remove());
    }

    render(): void
    {
        const app = this._app;
        const query = this._search.query;
        const doc = app.doc;

        this._spawns.render(query);
        this._areas.render(query);
        if(this._labels[0]) (this._labels[0] as ITextWindow).text = `Spawns de monstres (${(doc.spawns ?? []).length})`;
        if(this._labels[1]) (this._labels[1] as ITextWindow).text = `Aires (${(doc.zones ?? []).length})`;
        highlight(this._shapes, this._shapeColors, ['rect', 'polygon'].indexOf(app.world.tool));
        setEnabled(child(this._window, 'list_button_1'), !!app.world.element);
        setEnabled(child(this._window, 'list_button_2'), !!app.world.element);
    }

    private addTo(layer: 'spawns' | 'zones'): void
    {
        this._app.setCategory(layer);
        this._app.world.add(layer);
    }

    /** A shape tool: it redraws the selected element, or draws a new one when none is selected. */
    private tool(tool: WorldTool): void
    {
        const world = this._app.world;

        world.setTool(world.tool === tool ? 'select' : tool);
    }
}
