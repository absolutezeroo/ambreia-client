import type {IWidget} from './IWidget';
import type {IWidgetWindow} from '../../components/IWidgetWindow';
import type {IWindowManager} from '../IWindowManager';
import type {IWindow} from '../../IWindow';
import type {IStaticBitmapWrapperWindow} from '../../components/IStaticBitmapWrapperWindow';
import {PropertyStruct} from '../../utils/PropertyStruct';
import {WindowMouseEvent} from '../../events/WindowMouseEvent';
import type {WindowEventListener} from '../../events/WindowEventDispatcher';
import type {IIterator} from '../../utils/IIterator';
import {EmptyIterator} from '../../iterators/EmptyIterator';

/**
 * Hover bitmap effect widget.
 *
 * Displays a bitmap that switches between a normal and hover asset
 * based on mouse interaction state.
 *
 * In the AS3 version, uses IStaticBitmapWrapperWindow and mouse events.
 * The bitmap IS the rootWindow (no IWindowContainer wrapper).
 *
 * @see sources/win63_version/habbo/window/widgets/HoverBitmapWidget.as
 */
export class HoverBitmapWidget implements IWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::TYPE
    public static readonly TYPE: string = 'hover_bitmap';

    private static readonly HOVER_ASSET_KEY: string = 'hover_bitmap:hover_asset';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::NORMAL_ASSET_KEY
    private static readonly NORMAL_ASSET_KEY: string = 'hover_bitmap:normal_asset';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::_windowManager
    private _windowManager: IWindowManager | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::_bitmap
    private _bitmap: IStaticBitmapWrapperWindow | null = null;

    private _onMouseOverBound: WindowEventListener;
    private _onMouseOutBound: WindowEventListener;

    constructor(window: IWidgetWindow, windowManager: IWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        this._onMouseOverBound = this.onMouseOver.bind(this);
        this._onMouseOutBound = this.onMouseOut.bind(this);

        const bitmap = this._windowManager.buildWidgetLayout('hover_bitmap_xml') as IStaticBitmapWrapperWindow | null;

        if(bitmap)
        {
            this._bitmap = bitmap;

            this._bitmap.addEventListener(WindowMouseEvent.OVER, this._onMouseOverBound);
            this._bitmap.addEventListener(WindowMouseEvent.OUT, this._onMouseOutBound);

            this._widgetWindow.rootWindow = this._bitmap as unknown as IWindow;
            this._bitmap.width = this._widgetWindow.width;
            this._bitmap.height = this._widgetWindow.height;
            this._bitmap.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/win63_version/habbo/window/widgets/HoverBitmapWidget.as::_normalAsset
    private _normalAsset: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::get normalAsset()
    public get normalAsset(): string
    {
        return this._normalAsset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::set normalAsset()
    public set normalAsset(value: string)
    {
        this._normalAsset = value;

        if(!this._isHovering && this._bitmap)
        {
            this._bitmap.assetUri = value;
        }
    }

    // AS3: sources/win63_version/habbo/window/widgets/HoverBitmapWidget.as::_hoverAsset
    private _hoverAsset: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::get hoverAsset()
    public get hoverAsset(): string
    {
        return this._hoverAsset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::set hoverAsset()
    public set hoverAsset(value: string)
    {
        this._hoverAsset = value;

        if(this._isHovering && this._bitmap)
        {
            this._bitmap.assetUri = value;
        }
    }

    private _isHovering: boolean = false;

    /**
	 * Whether the widget is currently in hover state.
	 */
    public get isHovering(): boolean
    {
        return this._isHovering;
    }

    public set isHovering(value: boolean)
    {
        this._isHovering = value;
    }

    /**
	 * The current asset URI based on hover state.
	 */
    public get currentAsset(): string
    {
        return this._isHovering ? this._hoverAsset : this._normalAsset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        const result: PropertyStruct[] = [
            new PropertyStruct(HoverBitmapWidget.NORMAL_ASSET_KEY, this._normalAsset),
            new PropertyStruct(HoverBitmapWidget.HOVER_ASSET_KEY, this._hoverAsset),
        ];

        if(this._bitmap)
        {
            const bitmapProps = (this._bitmap as IWindow).properties as PropertyStruct[];

            if(bitmapProps)
            {
                for(const prop of bitmapProps)
                {
                    if(prop.key !== 'asset_uri')
                    {
                        result.push(prop);
                    }
                }
            }
        }

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        for(const prop of values)
        {
            switch(prop.key)
            {
                case HoverBitmapWidget.NORMAL_ASSET_KEY:
                    this.normalAsset = String(prop.value);
                    break;
                case HoverBitmapWidget.HOVER_ASSET_KEY:
                    this.hoverAsset = String(prop.value);
                    break;
            }
        }

        if(this._bitmap)
        {
            (this._bitmap as IWindow).properties = values;
            this._bitmap.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._bitmap)
        {
            this._bitmap.removeEventListener(WindowMouseEvent.OVER, this._onMouseOverBound);
            this._bitmap.removeEventListener(WindowMouseEvent.OUT, this._onMouseOutBound);
            this._bitmap.dispose();
            this._bitmap = null;
        }

        if(this._widgetWindow)
        {
            this._widgetWindow.rootWindow = null;
        }

        this._widgetWindow = null;
        this._windowManager = null;
    }

    /**
	 * Handle mouse over event. Switches to hover asset.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::onMouseOver()
    private onMouseOver(): void
    {
        this._isHovering = true;

        if(this._bitmap)
        {
            this._bitmap.assetUri = this._hoverAsset;
        }
    }

    /**
	 * Handle mouse out event. Switches to normal asset.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::onMouseOut()
    private onMouseOut(): void
    {
        this._isHovering = false;

        if(this._bitmap)
        {
            this._bitmap.assetUri = this._normalAsset;
        }
    }

    /**
	 * The bitmap window this widget hovers, so a caller can address it directly.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/HoverBitmapWidget.as::get bitmapWrapper()
    public get bitmapWrapper(): IStaticBitmapWrapperWindow | null
    {
        return this._bitmap;
    }
}
