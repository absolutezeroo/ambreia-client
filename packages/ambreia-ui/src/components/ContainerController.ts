import type {IWindow} from '../IWindow';
import type {IWindowContainer} from '../IWindowContainer';
import type {IWindowContext} from '../IWindowContext';
import type {IIterator} from '../utils/IIterator';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import {ContainerIterator} from '../iterators/ContainerIterator';

/**
 * Base controller for container windows.
 *
 * Extends WindowController with IWindowContainer compliance.
 * Sets up visual content flag based on background/param settings.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ContainerController.as
 */
export class ContainerController extends WindowController implements IWindowContainer
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ContainerController.as::ContainerController()
    protected override finalize(): void
    {
        super.finalize();

        this._hasVisualContent = this._background || this.testParamFlag(1) || !this.testParamFlag(16);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ContainerController.as::iterator()
    public iterator(): IIterator | null
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
