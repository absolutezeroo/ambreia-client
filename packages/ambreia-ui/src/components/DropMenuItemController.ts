import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IDropListItemWindow} from './IDropListItemWindow';
import type {IDropMenuWindow} from './IDropMenuWindow';
import {ButtonController} from './ButtonController';
import type {WindowEvent} from '../events/WindowEvent';

/**
 * Controller for drop menu item windows.
 *
 * A text-based menu item used inside a DropMenuController.
 * Unlike DropListItemController, the value is the item itself.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/DropMenuItemController.as
 */
export class DropMenuItemController extends ButtonController implements IDropListItemWindow
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
    // AS3: .../src/com/sulake/core/window/components/DropMenuItemController.as::get menu()
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
	 * The value of this menu item is the item itself.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropMenuItemController.as::get value()
    public get value(): IWindow | null
    {
        return this;
    }

    // AS3: .../src/com/sulake/core/window/components/DropMenuItemController.as::set value()
    public set value(_item: IWindow | null)
    {
        // No-op: value is always self for DropMenuItemController
    }
}
