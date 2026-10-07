import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IIterator} from '../utils/IIterator';
import type {WindowEvent} from '../events/WindowEvent';
import {ContainerIterator} from '../iterators/ContainerIterator';
import {InteractiveController} from './InteractiveController';

/**
 * Controller for container button windows.
 *
 * Combines interactive (button) behavior with container iteration,
 * acting as a clickable container that holds child windows.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ContainerButtonController.as
 */
export class ContainerButtonController extends InteractiveController
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
	 * Returns an iterator over children.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ContainerButtonController.as::iterator()
    public iterator(): IIterator
    {
        return new ContainerIterator(this);
    }
}
