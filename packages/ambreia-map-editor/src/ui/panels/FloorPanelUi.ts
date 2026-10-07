import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {EditorApp} from '../../app/EditorApp';
import type {ToolName} from '../../app/ToolName';
import {child, children, highlight, NumberBinding, onWindowClick, setText} from '../bind';
import type {IPanelUi} from '../IPanelUi';

/** The tool rows of vortex_map_editor_left_floor_xml, in their order: S A D R F C B H. */
const TOOLS: readonly ToolName[] = ['select', 'tile-add', 'tile-remove', 'raise', 'lower', 'rect', 'fill', 'hole'];

/** "Outils de sol": the tools, the heights 0–7 to paint with, the exact height. */
export class FloorPanelUi implements IPanelUi
{
    private readonly _tools: IWindow[] = [];
    private readonly _toolColors: number[] = [];
    private readonly _heights: IWindow[];
    private readonly _heightColors: number[];
    private readonly _exact: NumberBinding;

    constructor(window: IWindow, private readonly _app: EditorApp)
    {
        const list = child<IItemListWindow>(window, 'tool_list');

        for(let i = 0; list && i < list.numListItems && i < TOOLS.length; i++)
        {
            const row = list.getListItemAt(i);

            if(!row) continue;

            this._tools.push(row);
            this._toolColors.push(row.color);
            onWindowClick(row, () => _app.setTool(TOOLS[i]));
        }

        this._heights = children(window, 'height_tile');
        this._heightColors = this._heights.map(t => t.color);
        this._heights.forEach((tile, h) =>
        {
            setText(tile, 'height_txt', String(h));
            onWindowClick(tile, () => _app.setPaintHeight(h));
        });

        this._exact = new NumberBinding(window, 'height_input', () => _app.paintHeight, h => _app.setPaintHeight(h), 0, 32);
    }

    render(): void
    {
        highlight(this._tools, this._toolColors, TOOLS.indexOf(this._app.tool));
        highlight(this._heights, this._heightColors, this._app.paintHeight);
        this._exact.render();
    }
}
