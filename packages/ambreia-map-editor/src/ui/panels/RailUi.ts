import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {EditorApp} from '../../app/EditorApp';
import {RAIL} from '../../app/RAIL';
import {child, onWindowClick} from '../bind';
import type {IPanelUi} from '../IPanelUi';

const ACTIVE = 0xff9cc9f5;

/** The rail of vortex_map_editor_xml: its rows (rail_row), in order, are the categories of RAIL; other items (the « Contenu » separator) are skipped. */
export class RailUi implements IPanelUi
{
    private readonly _rows: IWindow[] = [];
    private readonly _colors: number[] = [];

    constructor(window: IWindow, private readonly _app: EditorApp)
    {
        const list = child<IItemListWindow>(window, 'rail_list');

        for(let i = 0; list && i < list.numListItems && this._rows.length < RAIL.length; i++)
        {
            const row = list.getListItemAt(i);

            if(!row || row.name !== 'rail_row') continue;

            const category = RAIL[this._rows.length];

            this._rows.push(row);
            this._colors.push(row.color);
            onWindowClick(row, () => _app.setCategory(category));
        }
    }

    render(): void
    {
        this._rows.forEach((row, i) =>
        {
            const color = RAIL[i] === this._app.category ? ACTIVE : this._colors[i];

            if(row.color !== color) row.color = color;
        });
    }
}
