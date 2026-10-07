import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {EditorApp} from '../../app/EditorApp';
import {child, onWindowClick, setEnabled} from '../bind';
import type {IPanelUi} from '../IPanelUi';

const ACTIVE = 0xff9cc9f5;

/** The view toolbar's buttons in their layout order: Sélection, Déplacer, Rotation, Copier, Coller, Supprimer, Dupliquer. */
const ACTIONS: readonly [id: string, run: (app: EditorApp) => void][] = [
    ['select', a => a.setTool('select')],
    ['move', a => a.setTool('move')],
    ['rotate', a => a.rotateSelection()],
    ['copy', a => a.copy()],
    ['paste', a => a.paste()],
    ['delete', a => a.deleteSelection()],
    ['duplicate', a => a.duplicate()]
];

/** The toolbar over the view (view_tools): tools and actions on the selected mobis. */
export class ViewToolsUi implements IPanelUi
{
    private readonly _buttons: IWindow[] = [];
    private readonly _colors: number[] = [];

    constructor(window: IWindow, private readonly _app: EditorApp)
    {
        const list = child<IItemListWindow>(window, 'view_tools');

        for(let i = 0; list && i < list.numListItems && i < ACTIONS.length; i++)
        {
            const button = list.getListItemAt(i);

            if(!button) continue;

            this._buttons.push(button);
            this._colors.push(button.color);
            onWindowClick(button, () => ACTIONS[i][1](_app));
        }
    }

    render(): void
    {
        const app = this._app;
        const none = app.selection.ids.size === 0;

        this._buttons.forEach((button, i) =>
        {
            const id = ACTIONS[i][0];
            const color = id === app.tool ? ACTIVE : this._colors[i];

            if(button.color !== color) button.color = color;
            setEnabled(button, id === 'paste' ? app.canPaste : ['select', 'move'].includes(id) || !none);
        });
    }
}
