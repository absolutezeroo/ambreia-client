import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IDisplayObjectWrapper} from './IDisplayObjectWrapper';
import type {IGraphicContext} from '../graphics/IGraphicContext';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import {GraphicContext} from '../graphics/GraphicContext';

/**
 * Controller for display object wrapper windows.
 *
 * Wraps an external display object (rendered by the client layer)
 * for embedding within the window system. In the TypeScript port,
 * display objects are represented as `unknown`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/DisplayObjectWrapperController.as
 */
export class DisplayObjectWrapperController extends WindowController implements IDisplayObjectWrapper
{
    private _displayObject: unknown = null;

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
        param = param & (~0x10);
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/DisplayObjectWrapperController.as::DisplayObjectWrapperController()
    protected override finalize(): void
    {
        super.finalize();

        this._hasVisualContent = false;
    }

    /**
	 * Creates a graphic context of type GC_TYPE_CONTAINER (4) on demand.
	 *
	 * In AS3, this creates a GraphicContext with type 4 (container)
	 * for holding external display objects.
	 */
    public override getGraphicContext(create: boolean): IGraphicContext | null
    {
        if(create && !this._graphicContext)
        {
            this._graphicContext = new GraphicContext(
                'GC {' + this._name + '}',
                GraphicContext.GC_TYPE_CONTAINER,
                {x: this._x, y: this._y, width: this._width, height: this._height}
            );
        }

        return this._graphicContext;
    }

    /**
	 * Returns the wrapped display object.
	 */
    // AS3: .../src/com/sulake/core/window/components/DisplayObjectWrapperController.as::getDisplayObject()
    public getDisplayObject(): unknown
    {
        return this._displayObject;
    }

    /**
	 * Sets the wrapped display object.
	 */
    // AS3: .../src/com/sulake/core/window/components/DisplayObjectWrapperController.as::setDisplayObject()
    public setDisplayObject(displayObject: unknown): void
    {
        this._displayObject = displayObject;
    }
}
