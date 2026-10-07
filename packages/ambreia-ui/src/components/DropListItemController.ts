import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IDropListItemWindow} from './IDropListItemWindow';
import type {IDropMenuWindow} from './IDropMenuWindow';
import type {WindowEvent} from '../events/WindowEvent';
import {ContainerButtonController} from './ContainerButtonController';

/**
 * Controller for drop list item windows.
 *
 * Each item wraps a child IWindow as its value and can find its
 * parent IDropMenuWindow ancestor.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/DropListItemController.as
 */
export class DropListItemController extends ContainerButtonController implements IDropListItemWindow
{
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
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    /**
	 * Finds the nearest ancestor IDropMenuWindow.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropListItemController.as::get menu()
    public get menu(): IDropMenuWindow | null
    {
        let current: IWindow | null = this.parent;

        while(current)
        {
            if('populate' in current && 'enumerateSelection' in current)
            {
                return current as unknown as IDropMenuWindow;
            }

            current = current.parent;
        }

        return null;
    }

    /**
	 * The wrapped child window (first child).
	 */
    // AS3: .../src/com/sulake/core/window/components/DropListItemController.as::get value()
    public get value(): IWindow | null
    {
        return this.getChildAt(0);
    }

    // AS3: .../src/com/sulake/core/window/components/DropListItemController.as::set value()
    public set value(item: IWindow | null)
    {
        const current = this.getChildAt(0);

        if(current !== item)
        {
            this.removeChildAt(0);

            if(item)
            {
                this.addChild(item);
            }
        }
    }
}
