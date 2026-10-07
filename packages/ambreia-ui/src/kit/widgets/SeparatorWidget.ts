import type {ISeparatorWidget} from './ISeparatorWidget';
import type {IWidgetWindow} from '../../components/IWidgetWindow';
import type {IWindowManager} from '../IWindowManager';
import type {IWindowContainer} from '../../IWindowContainer';
import type {IWindow} from '../../IWindow';
import {PropertyStruct} from '../../utils/PropertyStruct';
import {WindowEvent} from '../../events/WindowEvent';
import type {WindowEventListener} from '../../events/WindowEventDispatcher';
import type {IIterator} from '../../utils/IIterator';

/**
 * Visual separator widget.
 *
 * Renders a separator line (horizontal or vertical) using tiled
 * border images. Child windows punch holes through the separator line.
 *
 * In the AS3 version, uses BitmapData with tiled copyPixels and
 * fillRect for the punch-through effect. In the TypeScript port,
 * separator state is stored for CSS-based rendering by the UI layer.
 *
 * @see sources/win63_version/habbo/window/widgets/SeparatorWidget.as
 */
export class SeparatorWidget implements ISeparatorWidget 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::TYPE
    public static readonly TYPE: string = 'separator';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::VERTICAL_KEY
    private static readonly VERTICAL_KEY: string = 'separator:vertical';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::BORDER_IMAGE_HORIZONTAL
    private static readonly BORDER_IMAGE_HORIZONTAL: string = 'illumina_light_separator_horizontal';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::BORDER_IMAGE_VERTICAL
    private static readonly BORDER_IMAGE_VERTICAL: string = 'illumina_light_separator_vertical';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::_windowManager
    private _windowManager: IWindowManager | null = null;
    private _root: IWindowContainer | null = null;
    private _canvas: IWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::_children
    private _children: IWindowContainer | null = null;

    private _onChangeBound: WindowEventListener;

    constructor(window: IWidgetWindow, windowManager: IWindowManager) 
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        this._onChangeBound = this.onChange.bind(this);

        const root = this._windowManager.buildWidgetLayout('separator_xml') as IWindowContainer | null;

        if(root) 
        {
            this._root = root;

            const canvas = root.getChildByName('canvas');
            const children = root.getChildByName('children') as IWindowContainer | null;

            if(canvas) 
            {
                this._canvas = canvas;

                this._canvas.addEventListener(WindowEvent.WE_RESIZE, this._onChangeBound);
                this._canvas.addEventListener(WindowEvent.WE_RESIZED, this._onChangeBound);
            }

            if(children) 
            {
                this._children = children;

                this._children.addEventListener(WindowEvent.WE_CHILD_ADDED, this._onChangeBound);
                this._children.addEventListener(WindowEvent.WE_CHILD_REMOVED, this._onChangeBound);
                this._children.addEventListener(WindowEvent.WE_CHILD_RELOCATED, this._onChangeBound);
                this._children.addEventListener(WindowEvent.WE_CHILD_RESIZED, this._onChangeBound);
            }

            this._widgetWindow.rootWindow = this._root as unknown as IWindow;
            this._root.width = this._widgetWindow.width;
            this._root.height = this._widgetWindow.height;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    private _vertical: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::get vertical()
    public get vertical(): boolean 
    {
        return this._vertical;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::set vertical()
    public set vertical(value: boolean) 
    {
        this._vertical = value;
    }

    /**
     * Get the border image asset name for the current orientation.
     */
    public get borderImageName(): string 
    {
        return this._vertical
            ? SeparatorWidget.BORDER_IMAGE_VERTICAL
            : SeparatorWidget.BORDER_IMAGE_HORIZONTAL;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::get properties()
    public get properties(): PropertyStruct[] 
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(SeparatorWidget.VERTICAL_KEY, this._vertical),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::set properties()
    public set properties(values: PropertyStruct[]) 
    {
        for(const prop of values) 
        {
            if(prop.key === SeparatorWidget.VERTICAL_KEY) 
            {
                this.vertical = Boolean(prop.value);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::get iterator()
    public iterator(): IIterator | null
    {
        return this._children ? this._children.iterator() : null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._canvas) 
        {
            this._canvas.removeEventListener(WindowEvent.WE_RESIZE, this._onChangeBound);
            this._canvas.removeEventListener(WindowEvent.WE_RESIZED, this._onChangeBound);
            this._canvas = null;
        }

        if(this._children) 
        {
            this._children.removeEventListener(WindowEvent.WE_CHILD_ADDED, this._onChangeBound);
            this._children.removeEventListener(WindowEvent.WE_CHILD_REMOVED, this._onChangeBound);
            this._children.removeEventListener(WindowEvent.WE_CHILD_RELOCATED, this._onChangeBound);
            this._children.removeEventListener(WindowEvent.WE_CHILD_RESIZED, this._onChangeBound);
            this._children = null;
        }

        if(this._root) 
        {
            this._root.dispose();
            this._root = null;
        }

        if(this._widgetWindow) 
        {
            this._widgetWindow.rootWindow = null;
        }

        this._widgetWindow = null;
        this._windowManager = null;
    }

    /**
     * Called when the canvas resizes or children change.
     * Triggers a refresh of the separator rendering.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::onChange()
    private onChange(): void 
    {
        this.refresh();
    }

    /**
     * Draws the line: the separator art tiled down the middle of the canvas, with a transparent
     * hole punched wherever a visible child sits on it.
     *
     * This body used to be empty under a comment saying "the UI layer handles rendering based on
     * stored state". There is no such rendering — `separator` appears nowhere in `core/window` —
     * and the widget stores no drawing state to render from, so the line simply did not exist in
     * any of the 47 shipped layouts that use one.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/SeparatorWidget.as::refresh()
    private refresh(): void
    {
        if(this._disposed || this._canvas === null) return;

        const width = Math.max(1, this._canvas.width);
        const height = Math.max(1, this._canvas.height);
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');

        if(ctx === null) return;

        const asset = this._windowManager?.resourceManager?.getAsset(
            this._vertical ? SeparatorWidget.BORDER_IMAGE_VERTICAL : SeparatorWidget.BORDER_IMAGE_HORIZONTAL
        ) ?? null;

        if(asset !== null)
        {
            // Centred on the cross axis and repeated along the long one. The -1 is AS3's: the art
            // is two pixels wide and it wants the seam on the boundary, not beside it.
            if(this._vertical)
            {
                const x = (width / 2) - 1;

                for(let y = 0; y < height; y += asset.height) ctx.drawImage(asset, x, y);
            }
            else
            {
                const y = (height / 2) - 1;

                for(let x = 0; x < width; x += asset.width) ctx.drawImage(asset, x, y);
            }
        }

        // A child sitting on the line hides the part of it that it covers, rather than drawing
        // over it — which is what lets a labelled separator read as a break in the rule.
        const iterator: IIterator | null = this._children?.iterator() ?? null;

        if(iterator !== null)
        {
            // `next()` returning null is the end, and `reset()` first because the iterator is the
            // container's own and may be mid-walk.
            iterator.reset();

            for(let child = iterator.next(); child !== null; child = iterator.next())
            {
                if(!child.visible) continue;

                ctx.clearRect(child.x, child.y, child.width, child.height);
            }
        }

        (this._canvas as unknown as {bitmap: ImageBitmap | null}).bitmap = canvas.transferToImageBitmap();
        this._canvas.invalidate();
    }
}
