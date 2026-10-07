import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IHeaderWindow} from './IHeaderWindow';
import type {ILabelWindow} from './ILabelWindow';
import type {IItemListWindow} from './IItemListWindow';
import {ContainerController} from './ContainerController';
import type {WindowEvent} from '../events/WindowEvent';
import {WindowController} from '../WindowController';

/**
 * Controller for header windows.
 *
 * A header window contains a title label and an item list of controls
 * (close button, minimize, etc.).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/HeaderController.as
 */
export class HeaderController extends ContainerController implements IHeaderWindow
{
    // AS3: .../src/com/sulake/core/window/components/HeaderController.as::TAG_TITLE_ELEMENT
    private static readonly TAG_TITLE_ELEMENT: string = '_TITLE';
    // AS3: .../src/com/sulake/core/window/components/HeaderController.as::TAG_CONTROLS_ELEMENT
    private static readonly TAG_CONTROLS_ELEMENT: string = '_CONTROLS';

    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        parent: IWindow | null = null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        properties: unknown[] | null = null,
        id: number = 0,
        _dynamicStyle: string = ''
    )
    {
        param = param | 0x01;

        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    /**
	 * Returns the title label window.
	 */
    // AS3: .../src/com/sulake/core/window/components/HeaderController.as::get title()
    public get title(): ILabelWindow
    {
        return this.findChildByTag(HeaderController.TAG_TITLE_ELEMENT) as unknown as ILabelWindow;
    }

    /**
	 * Returns the controls item list window.
	 */
    // AS3: .../src/com/sulake/core/window/components/HeaderController.as::get controls()
    public get controls(): IItemListWindow
    {
        return this.findChildByTag(HeaderController.TAG_CONTROLS_ELEMENT) as unknown as IItemListWindow;
    }

    public override get caption(): string
    {
        return super.caption;
    }

    public override set caption(value: string)
    {
        super.caption = value;

        try
        {
            this.title.text = value;
        }
        catch (_e: unknown)
        {
            // Ignored
        }
    }

    public override get color(): number
    {
        return super.color;
    }

    public override set color(value: number)
    {
        super.color = value;

        const colorized: IWindow[] = [];

        this.groupChildrenWithTag(WindowController.TAG_COLORIZE, colorized, -1);

        for(const child of colorized)
        {
            child.color = value;
        }
    }
}
