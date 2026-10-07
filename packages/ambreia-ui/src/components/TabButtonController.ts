import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {ITabButtonWindow} from './ITabButtonWindow';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import {SelectableController} from './SelectableController';

/**
 * Controller for tab button windows.
 *
 * A selectable button used within a TabContextController's selector.
 * Resizes itself to accommodate children when they change size.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TabButtonController.as
 */
export class TabButtonController extends SelectableController implements ITabButtonWindow
{
    // AS3: .../src/com/sulake/core/window/components/TabButtonController.as::CONTENT_TAG
    private static readonly CONTENT_TAG: string = 'TAB_BUTTON_CONTENT';
    // AS3: .../src/com/sulake/core/window/components/TabButtonController.as::LABEL_TAG
    private static readonly LABEL_TAG: string = 'TAB_BUTTON_TITLE';
    // AS3: .../src/com/sulake/core/window/components/TabButtonController.as::ICON_TAG
    private static readonly ICON_TAG: string = 'TAB_BUTTON_ICON';

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
        id: number = 0
    )
    {
        param = param | 0x01;
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    public override get caption(): string
    {
        return super.caption;
    }

    public override set caption(value: string)
    {
        super.caption = value;

        const label = this.findChildByTag('TAB_BUTTON_TITLE');

        if(label !== null)
        {
            label.caption = value;
        }
    }

    public override update(source: WindowController, event: WindowEvent): boolean
    {
        if(event.type === 'WE_CHILD_RESIZED')
        {
            WindowController.resizeToAccommodateChildren(this);
        }

        return super.update(source, event);
    }
}
