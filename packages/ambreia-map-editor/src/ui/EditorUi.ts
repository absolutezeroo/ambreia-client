import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {Category} from '../app/Category';
import type {EditorApp} from '../app/EditorApp';
import {Favorites} from '../app/Favorites';
import {EditorShell} from './EditorShell';
import type {EditorTexts} from './EditorTexts';
import type {IPanelUi} from './IPanelUi';
import {BottomEditUi} from './panels/BottomEditUi';
import {DecorInspectorUi} from './panels/DecorInspectorUi';
import {DecorPanelUi} from './panels/DecorPanelUi';
import {FloorPanelUi} from './panels/FloorPanelUi';
import {TileInspectorUi} from './panels/TileInspectorUi';
import type {WindowCanvasHost} from './WindowCanvasHost';

const L = (name: string) => `vortex_map_editor_${name}_xml`;

/**
 * The editor's windows for one open zone: which of the owner's layouts each category shows in
 * the three slots, and which panel class binds each layout.
 */
export class EditorUi
{
    private static readonly FAVORITES = new Favorites();
    private readonly _shell: EditorShell;

    constructor(private readonly _manager: WindowManager, texts: EditorTexts, app: EditorApp, private readonly _host: WindowCanvasHost)
    {
        const build = (layout: string) => _manager.buildWidgetLayout(layout);

        this._shell = new EditorShell(_manager, texts, app, _host, EditorUi.slots, (layout, window) => EditorUi.panel(layout, window, app, texts, build));
        app.refresh();
    }

    /** Takes the editor's windows off the desktop (back to the zone list). */
    dispose(): void
    {
        (this._manager.getDesktop(1) as IWindowContainer).removeChild(this._shell.window);
        this._shell.window.destroy();
    }

    private static slots(category: Category): {left: string; inspector: string; bottom: string}
    {
        switch(category)
        {
            case 'decor': return {left: L('left_decor'), inspector: L('inspect_decor'), bottom: L('bottom_edit')};
            default: return {left: L('left_floor'), inspector: L('inspect_tile'), bottom: L('bottom_edit')};
        }
    }

    private static panel(layout: string, window: IWindow, app: EditorApp, texts: EditorTexts, build: (layout: string) => IWindow | null): IPanelUi | null
    {
        switch(layout)
        {
            case L('left_floor'): return new FloorPanelUi(window, app);
            case L('inspect_tile'): return new TileInspectorUi(window, app, texts);
            case L('left_decor'): return new DecorPanelUi(window, app, texts, EditorUi.FAVORITES, build);
            case L('inspect_decor'): return new DecorInspectorUi(window, app);
            case L('bottom_edit'): return new BottomEditUi(window, app, build);
            default: return null;
        }
    }
}
