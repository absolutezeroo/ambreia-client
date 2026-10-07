import type {IWindow} from '../IWindow';
import type {IWindowContainer} from '../IWindowContainer';
import type {IWindowContext} from '../IWindowContext';
import type {IIterator} from '../utils/IIterator';
import type {ITabButtonWindow} from './ITabButtonWindow';
import type {WindowEvent} from '../events/WindowEvent';
import {ContainerIterator} from '../iterators/ContainerIterator';
import {SelectableController} from './SelectableController';

/**
 * Controller for tab container button windows.
 *
 * Combines selectable behavior with container iteration, acting as
 * a tab button that also supports IWindowContainer and IIterable.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TabContainerButtonController.as
 */
export class TabContainerButtonController extends SelectableController implements ITabButtonWindow, IWindowContainer
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
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TabContainerButtonController.as::iterator()
    public iterator(): IIterator
    {
        return new ContainerIterator(this);
    }

    public getChildUnderPoint(point: { x: number; y: number }): IWindow | null
    {
        for(let i = this.numChildren - 1; i >= 0; i--)
        {
            const child = this.getChildAt(i);

            if(child && child.visible && child.hitTestLocalPoint(point))
            {
                return child;
            }
        }

        return null;
    }

    public groupChildrenUnderPoint(point: { x: number; y: number }, result: IWindow[]): void
    {
        for(let i = 0; i < this.numChildren; i++)
        {
            const child = this.getChildAt(i);

            if(child && child.visible && child.hitTestLocalPoint(point))
            {
                result.push(child);
            }
        }
    }
}
