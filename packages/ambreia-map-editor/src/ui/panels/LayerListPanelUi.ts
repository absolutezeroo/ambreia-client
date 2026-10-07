import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';
import type {EditorApp} from '../../app/EditorApp';
import {child, children, onClick, SearchField, setEnabled} from '../bind';
import type {IPanelUi} from '../IPanelUi';
import {EntityListUi} from './EntityListUi';

/**
 * A layer's list column on the owner's list layouts (left_npcs, left_triggers, and left_npcs again
 * for the layers that have no layout of their own): search, the element lines, and
 * Ajouter / Dupliquer / Supprimer (list_button_0..2).
 */
export class LayerListPanelUi implements IPanelUi
{
    private readonly _list: EntityListUi;
    private readonly _search: SearchField;

    constructor(
        private readonly _window: IWindow,
        private readonly _app: EditorApp,
        private readonly _layer: LayerKey,
        title: string,
        build: (layout: string) => IWindow | null
    )
    {
        // The list layouts name their title after their own layer.
        const titleText = children(_window, 'npc_panel_title')[0] ?? children(_window, 'trigger_panel_title')[0];

        if(titleText) (titleText as ITextWindow).text = title;

        this._list = new EntityListUi(child<IItemListWindow>(_window, 'entity_list'), _app, _layer, build);
        this._search = new SearchField(_window, 'search_input', () => this.render());

        onClick(_window, 'list_button_0', () => _app.world.add(_layer));
        onClick(_window, 'list_button_1', () => _app.world.duplicate());
        onClick(_window, 'list_button_2', () => _app.world.remove());
        // "Tester" of the triggers' list: the server runs triggers (plan phase 5); test from the zone.
        setEnabled(children(_window, 'list_button_3')[0] ?? null, false);
    }

    render(): void
    {
        const selected = this._app.world.element?.layer === this._layer;

        this._list.render(this._search.query);
        setEnabled(child(this._window, 'list_button_1'), selected);
        setEnabled(child(this._window, 'list_button_2'), selected);
    }
}
