import type {ILimitedItemGridOverlayWidget} from './ILimitedItemGridOverlayWidget';
import type {IWidgetWindow} from '../../components/IWidgetWindow';
import type {IWindowManager} from '../IWindowManager';
import {NumberPlaqueBitmap} from '../utils/NumberPlaqueBitmap';
import type {IWindowContainer} from '../../IWindowContainer';
import type {IWindow} from '../../IWindow';
import type {PropertyStruct} from '../../utils/PropertyStruct';
import type {IIterator} from '../../utils/IIterator';
import {EmptyIterator} from '../../iterators/EmptyIterator';
import type {IWindowUpdateReceiver} from '../../IWindowUpdateReceiver';
import type {IAssetReceiver} from '../../IAssetReceiver';
import type {IBitmapWrapperWindow} from '../../components/IBitmapWrapperWindow';

/**
 * Limited item grid overlay widget.
 *
 * Displays a limited edition overlay on grid items, showing the serial number.
 *
 * The shine is a scroll, not a fade: the plaque asset is taller than the window it is
 * drawn in, and every 10s a 250ms sweep walks the visible rectangle down the asset before
 * snapping back to the top.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as
 */
export class LimitedItemGridOverlayWidget implements ILimitedItemGridOverlayWidget, IWindowUpdateReceiver
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::TYPE
    public static readonly TYPE: string = 'limited_item_overlay_grid';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::SHINE_INTERVAL_MS
    private readonly _shineIntervalMs: number = 10000;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::SHINE_LENGTH_MS
    private readonly _shineLengthMs: number = 250;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_widgetWindow
    // Derived name: obfuscated in every tree — the widget slot this overlay is attached to. Only
    // `_disposed`, `_serialNumber` and `_windowManager` survived the obfuscator on this class.
    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_windowManager
    private _windowManager: IWindowManager | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_root
    private _root: IWindowContainer | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_plaqueBitmap
    // Derived name: obfuscated in every tree — the window the plaque is drawn into.
    private _plaqueBitmap: IBitmapWrapperWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_plaqueSource
    // Derived name: obfuscated in every tree — the full-height plaque the shine scrolls
    // through. AS3 clones it out of the asset library in the constructor.
    private _plaqueSource: ImageBitmap | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_currentTime
    // Derived name: obfuscated in every tree — accumulated `update()` deltas, not a clock.
    private _currentTime: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_lastShineTime
    // Derived name: obfuscated in every tree — when the last sweep finished.
    private _lastShineTime: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::LimitedItemGridOverlayWidget()
    constructor(window: IWidgetWindow, windowManager: IWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('unique_item_overlay_griditem_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;
            this._plaqueBitmap = root.findChildByName('unique_item_overlay_plaque_background_bitmap') as IBitmapWrapperWindow | null;

            this.requestPlaqueSource();

            this._widgetWindow.rootWindow = this._root as unknown as IWindow;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_serialNumber
    private _serialNumber: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::get serialNumber()
    public get serialNumber(): number
    {
        return this._serialNumber;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::set serialNumber()
    public set serialNumber(value: number)
    {
        this._serialNumber = value;

        const plaque = this._root?.findChildByName('unique_item_overlay_plaque_number_bitmap') as
            (IWindow & {bitmap?: ImageBitmap | null}) | null;

        if(plaque == null) return;

        plaque.bitmap = NumberPlaqueBitmap.createBitmap(this._windowManager, value, plaque.width, plaque.height);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::get seriesSize()
    public get seriesSize(): number
    {
        // AS3 answers a constant 0 here; the grid overlay never shows the series size.
        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::set seriesSize()
    public set seriesSize(_value: number)
    {
        // AS3: seriesSize setter is a no-op for grid overlay
    }

    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::_animated
    private _animated: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::get animated()
    public get animated(): boolean
    {
        return this._animated;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::set animated()
    public set animated(value: boolean)
    {
        this._animated = value;

        if(this._animated) this._windowManager?.registerUpdateReceiver(this, 5);
        else this._windowManager?.removeUpdateReceiver(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::update()
    public update(intervalMs: number): void
    {
        if(this._disposed) return;

        this._currentTime += intervalMs;

        const elapsed = this._currentTime - this._lastShineTime;

        if(elapsed <= this._shineIntervalMs) return;

        const bitmap = this._plaqueBitmap;

        if(!bitmap || !this._plaqueSource) return;

        // AS3 writes the two literals 10000 and 250 here rather than its own
        // SHINE_INTERVAL_MS/SHINE_LENGTH_MS constants; same values.
        const progress = (elapsed - this._shineIntervalMs) / this._shineLengthMs;

        if(progress < 1)
        {
            const offsetY = (this._plaqueSource.height - bitmap.height) * progress;
            const sweep = LimitedItemGridOverlayWidget.copyPixels(
                this._plaqueSource,
                offsetY,
                bitmap.width,
                bitmap.height
            );

            if(sweep)
            {
                bitmap.bitmap = sweep;
                bitmap.disposesBitmap = true;
            }
        }
        else
        {
            bitmap.bitmap = this._plaqueSource;
            bitmap.disposesBitmap = false;
            this._lastShineTime = this._currentTime;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::set properties()
    public set properties(_values: PropertyStruct[])
    {
        // AS3: properties setter is a no-op for this widget
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // TS-only: AS3's `assets.getAssetByName(...).content` is synchronous, this port's window
    // images come through the ResourceManager. Same asset, one callback later.
    private requestPlaqueSource(): void
    {
        const resourceManager = this._windowManager?.resourceManager ?? null;

        if(!resourceManager) return;

        const receiver: IAssetReceiver = {
            get disposed(): boolean
            {
                return false;
            },
            dispose(): void
            {
                // Receiver is request-scoped and owns no resources.
            },
            receiveAsset: (asset: ImageBitmap): void =>
            {
                if(this._disposed) return;

                this._plaqueSource = asset;

                if(this._plaqueBitmap)
                {
                    this._plaqueBitmap.bitmap = asset;
                    this._plaqueBitmap.disposesBitmap = false;
                }
            }
        };

        // No `_png` suffix: images register under the bare file basename.
        resourceManager.retrieveAsset('unique_item_label_plaque_metal', receiver);
    }

    /**
	 * The one `BitmapData.copyPixels()` this widget makes: a `width` x `height` window cut
	 * out of the plaque at `offsetY`. `transferToImageBitmap()` keeps it synchronous, which
	 * `update()` needs.
	 */
    // TS-only: Canvas stand-in for `flash.display.BitmapData.copyPixels()`.
    private static copyPixels(source: ImageBitmap, offsetY: number, width: number, height: number): ImageBitmap | null
    {
        const targetWidth = Math.max(1, Math.floor(width));
        const targetHeight = Math.max(1, Math.floor(height));
        const canvas = new OffscreenCanvas(targetWidth, targetHeight);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        context.drawImage(
            source,
            0, Math.floor(offsetY), targetWidth, targetHeight,
            0, 0, targetWidth, targetHeight
        );

        return canvas.transferToImageBitmap();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemGridOverlayWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        if(this._animated) this._windowManager?.removeUpdateReceiver(this);

        this._disposed = true;

        this._plaqueBitmap = null;
        this._plaqueSource = null;

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
}
