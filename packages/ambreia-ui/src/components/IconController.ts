import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IIconWindow} from './IIconWindow';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';

/**
 * Controller for icon windows.
 *
 * Displays a small image/icon. The `fitToSize()` method resizes the
 * window to match the skin layout dimensions for the current state.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IconController.as
 */
export class IconController extends WindowController implements IIconWindow
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IconController.as::IconController()
    protected override finalize(): void
    {
        super.finalize();

        this._hasVisualContent = true;
    }

    private _imageUrl: string = '';

    public get imageUrl(): string
    {
        return this._imageUrl;
    }

    public set imageUrl(value: string)
    {
        this._imageUrl = value ?? '';
    }

    public override get style(): number
    {
        return super.style;
    }

    public override set style(value: number)
    {
        super.style = value;
    }

    /**
	 * Resizes the icon window to match the skin layout dimensions
	 * for the current state.
	 *
	 * In AS3, uses `BitmapSkinRenderer.getLayoutByState(state)` to
	 * get the skin dimensions and sets the rectangle accordingly.
	 */
    // AS3: .../src/com/sulake/core/window/components/IconController.as::fitToSize()
    public fitToSize(): void
    {
        const factory = (this._context as unknown as {
            getWindowFactory(): {
                getRendererByTypeAndStyle(type: number, style: number): {
                    getLayoutByState?(state: number): { width: number; height: number } | null
                } | null
            }
        }).getWindowFactory();

        if(!factory) return;

        const renderer = factory.getRendererByTypeAndStyle(1, this.style);

        if(!renderer || !renderer.getLayoutByState) return;

        const layout = renderer.getLayoutByState(this.state);

        if(!layout) return;

        const layoutWidth = layout.width | 0;
        const layoutHeight = layout.height | 0;

        if(layoutWidth !== this._width || layoutHeight !== this._height)
        {
            this.setRectangle(this._x, this._y, layoutWidth, layoutHeight);
        }
    }
}
