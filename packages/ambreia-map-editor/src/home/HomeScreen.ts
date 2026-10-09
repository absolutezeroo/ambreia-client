import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import {child} from '../ui/bind';

/** The size vortex_map_editor_home_xml is drawn at. */
const DESIGN = {width: 1440, height: 900};

/**
 * The owner's home screen (vortex_map_editor_home_xml): the backdrop covering the page, the logo,
 * and `window_slot`, which holds one window at a time — the login, then the zone browser. Taken
 * off the desktop while a zone is open, put back when the editor closes it.
 */
export class HomeScreen
{
    readonly window: IWindowContainer;

    private readonly _slot: IWindowContainer | null;
    private _content: IWindow | null = null;

    constructor(private readonly _manager: WindowManager)
    {
        const window = _manager.buildWidgetLayout('vortex_map_editor_home_xml') as IWindowContainer | null;

        if(!window) throw new Error('vortex_map_editor_home_xml is not registered');

        this.window = window;
        this._slot = child<IWindowContainer>(window, 'window_slot');
        window.addEventListener('WE_PARENT_RESIZED', () => this.place());
        this.show();
    }

    /** Puts window in the slot, centred, in place of the one there. */
    mount(window: IWindow): void
    {
        if(this._content && this._content !== window) this._slot?.removeChild(this._content);

        this._content = window;
        this._slot?.addChild(window);
        this.place();
    }

    show(): void
    {
        this.desktop.addChild(this.window);
        this.place();
    }

    hide(): void
    {
        this.desktop.removeChild(this.window);
    }

    private get desktop(): IWindowContainer
    {
        return this._manager.getDesktop(1) as IWindowContainer;
    }

    private place(): void
    {
        const {width, height} = this.desktop;
        const screen = this.window;
        const backdrop = child<IStaticBitmapWrapperWindow & {stretchedX: boolean; stretchedY: boolean}>(screen, 'backdrop');
        const logo = child(screen, 'logo');
        const slot = this._slot;
        // The mock-up's content keeps its place relative to the page's centre.
        const dy = Math.round((height - DESIGN.height) / 2);

        Object.assign(screen, {x: 0, y: 0, width, height});
        Object.assign(child(screen, 'backdrop_color') ?? {}, {x: 0, y: 0, width, height});

        if(backdrop)
        {
            const scale = Math.max(width / DESIGN.width, height / DESIGN.height);
            const cover = {width: Math.ceil(DESIGN.width * scale), height: Math.ceil(DESIGN.height * scale)};

            backdrop.stretchedX = backdrop.stretchedY = true;
            Object.assign(backdrop, {...cover, x: Math.round((width - cover.width) / 2), y: Math.round((height - cover.height) / 2)});
        }

        if(logo) Object.assign(logo, {x: Math.round((width - logo.width) / 2), y: Math.max(0, 4 + dy)});
        if(slot) Object.assign(slot, {x: Math.round((width - slot.width) / 2), y: Math.max(0, 118 + dy)});

        const content = this._content;

        if(slot && content) Object.assign(content, {x: Math.round((slot.width - content.width) / 2), y: Math.round((slot.height - content.height) / 2)});
    }
}
