import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IIterator} from '../utils/IIterator';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import {ContainerIterator} from '../iterators/ContainerIterator';

/**
 * Controller for background windows.
 *
 * A simple visual element that renders a solid background color
 * or styled background fill. Sets background=true and color=white
 * by default.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BackgroundController.as
 */
export class BackgroundController extends WindowController
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
        id: number = 0,
        dynamicStyle: string = ''
    )
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id, dynamicStyle);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BackgroundController.as::BackgroundController()
    protected override finalize(): void
    {
        super.finalize();

        this.background = true;
        this.color = 0xFFFFFFFF;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BackgroundController.as::iterator()
    public iterator(): IIterator
    {
        return new ContainerIterator(this);
    }
}
