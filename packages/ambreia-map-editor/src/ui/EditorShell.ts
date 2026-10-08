import type {IDisplayObjectWrapper} from '@ambreia/ui/components/IDisplayObjectWrapper';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {Category} from '../app/Category';
import type {EditorApp} from '../app/EditorApp';
import {child} from './bind';
import type {EditorTexts} from './EditorTexts';
import type {IPanelUi} from './IPanelUi';
import {MenuBarUi} from './panels/MenuBarUi';
import {RailUi} from './panels/RailUi';
import {ViewInfoUi} from './panels/ViewInfoUi';
import {ViewToolsUi} from './panels/ViewToolsUi';
import {SlotSwitcher} from './SlotSwitcher';
import type {WindowCanvasHost} from './WindowCanvasHost';

/**
 * The owner's main window (vortex_map_editor_xml) bound to the editor: menus, rail, view tools,
 * view info, the isometric view inside `viewport_slot`, and the three slots (left, inspector,
 * bottom) whose content follows the chosen category.
 */
export class EditorShell
{
    readonly window: IWindow;

    constructor(
        readonly manager: WindowManager,
        readonly texts: EditorTexts,
        readonly app: EditorApp,
        host: WindowCanvasHost,
        slots: (category: Category) => {left: string; inspector: string; bottom: string},
        panels: (layout: string, window: IWindow) => IPanelUi | null
    )
    {
        const window = manager.buildWidgetLayout('vortex_map_editor_xml');

        if(!window) throw new Error('vortex_map_editor_xml is not registered');

        this.window = window;
        (manager.getDesktop(1) as IWindowContainer).addChild(window);
        // The page's size once; then the layout's scale params follow the desktop as it resizes.
        window.rectangle = {x: 0, y: 0, width: host.canvas.width, height: host.canvas.height};

        this.mountView(host);

        const switcher = new SlotSwitcher(manager, window, app, slots, panels);
        const parts: IPanelUi[] = [
            new MenuBarUi(window, this),
            new RailUi(window, app),
            new ViewToolsUi(window, app),
            new ViewInfoUi(window, app, texts),
            switcher
        ];

        for(const part of parts) app.attach(part);
        app.onViewChange(() =>
        {
            for(const part of parts) part.onViewChange?.();
            switcher.onViewChange();
        });
    }

    /** The isometric view as the first child of the owner's viewport: their toolbars draw over it. */
    private mountView(host: WindowCanvasHost): void
    {
        const slot = child<IWindowContainer>(this.window, 'viewport_slot');
        const holder = this.manager.buildWidgetLayout('vortex_map_editor_iso_view_xml');

        if(!slot || !holder) throw new Error('viewport_slot or the iso view layout is missing');

        const wrapper = ((holder as IWindowContainer).findChildByName('iso_view') ?? holder) as IDisplayObjectWrapper;

        wrapper.width = slot.width;
        wrapper.height = slot.height;
        slot.addChildAt(wrapper, 0);
        wrapper.setDisplayObject(this.app.view.canvas);

        this.app.view.setSize(slot.width, slot.height);
        // The wrapper stretches with the viewport (its scale params); the view draws at its size.
        wrapper.addEventListener('WE_RESIZED', () => this.app.view.setSize(wrapper.width, wrapper.height));
        host.setView(wrapper);
        host.onViewPointer = (kind, x, y, e) => this.app.view.pointer(kind, x, y, e);
        host.onViewWheel = (deltaY, x, y) => this.app.view.wheel(deltaY, x, y);
    }
}
