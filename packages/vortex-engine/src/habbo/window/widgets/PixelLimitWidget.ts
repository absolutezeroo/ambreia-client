import type {IPixelLimitWidget} from '@ambreia/ui/kit/widgets/IPixelLimitWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';

/**
 * Pixel limit display widget.
 *
 * Displays a challenge meter image based on a percentage limit value. The limit (0-100)
 * is rounded down to a 20% step, floored at 20, and used to pick the meter asset.
 *
 * Reuses the `badge_image` layout, and forwards the whole `IBitmapDataContainer` surface
 * to the bitmap inside it — `wrapX`/`wrapY`/`rotation` excepted, which AS3 answers with a
 * constant and drops on write.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as
 */
export class PixelLimitWidget implements IPixelLimitWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::TYPE
    public static readonly TYPE: string = 'pixel_limit';

    // Derived name: the constant is obfuscated in every tree (`_Str_15462` in the
    // otherwise unobfuscated 2016 one), so `LIMIT_KEY` is this port's name for it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::LIMIT_KEY
    private static readonly LIMIT_KEY: string = 'pixel_limit:limit';

    // Derived name: same as `LIMIT_KEY` above — obfuscated in every tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::LIMIT_DEFAULT
    private static readonly LIMIT_DEFAULT: PropertyStruct =
        new PropertyStruct(PixelLimitWidget.LIMIT_KEY, 0, PropertyStruct.STRING, false, null);

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::_disposed
    private _disposed: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::_widgetWindow
    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::_refreshing
    private _refreshing: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::_root
    private _root: IWindowContainer | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::_bitmap
    private _bitmap: IStaticBitmapWrapperWindow | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::_region
    // The 2026 build declares the field and disposes it, but its constructor never looks
    // the region up — only BadgeImageWidget's does. Kept null here for the same reason.
    private _region: IWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::_limit
    private _limit: number = Number(PixelLimitWidget.LIMIT_DEFAULT.value);

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::PixelLimitWidget()
    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('badge_image_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;
            this._bitmap = root.findChildByName('bitmap') as IStaticBitmapWrapperWindow | null;

            this._widgetWindow.rootWindow = this._root as unknown as IWindow;
            this._root.width = this._widgetWindow.width;
            this._root.height = this._widgetWindow.height;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get limit()
    public get limit(): number
    {
        return this._limit;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set limit()
    public set limit(value: number)
    {
        this._limit = Math.max(0, Math.min(100, value));
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        const props: PropertyStruct[] = [];

        if(this._disposed) return props;

        props.push(PixelLimitWidget.LIMIT_DEFAULT.withValue(this._limit));

        for(const prop of (this._bitmap?.properties ?? []) as PropertyStruct[])
        {
            if(prop.key !== 'asset_uri') props.push(prop.withNameSpace('pixel_limit'));
        }

        return props;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        this._refreshing = true;

        const forwarded: PropertyStruct[] = [];

        for(const prop of values)
        {
            if(prop.key === PixelLimitWidget.LIMIT_KEY) this.limit = Number(prop.value);

            // The widget owns the asset URI — the bitmap must never be handed one from a
            // layout, or the meter would draw whatever the layout named instead.
            if(prop.key !== 'pixel_limit:asset_uri') forwarded.push(prop.withoutNameSpace());
        }

        if(this._bitmap) this._bitmap.properties = forwarded;

        this._refreshing = false;
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::refresh()
    private refresh(): void
    {
        if(this._refreshing) return;

        const bitmap = this._bitmap;

        if(!bitmap) return;

        bitmap.assetUri = this.assetUri;
        bitmap.invalidate();
    }

    /**
	 * Compute the asset URI for the current limit value.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get assetUri()
    private get assetUri(): string
    {
        const step = Math.max(Math.floor(this._limit / 20) * 20, 20);

        return '${image.library.url}reception/challenge_meter_%amount%.png'.replace('%amount%', step.toString());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::onClick()
    // Empty in AS3, and the 2026 build never registers it — the region it would listen on
    // is never looked up. Kept so `dispose()` can unregister it exactly as AS3 does.
    private onClick(_event: WindowMouseEvent): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get bitmapData()
    public get bitmapData(): ImageBitmap | null
    {
        return this._bitmap?.bitmapData ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get pivotPoint()
    public get pivotPoint(): number
    {
        return this._bitmap?.pivotPoint ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set pivotPoint()
    public set pivotPoint(value: number)
    {
        if(!this._bitmap) return;

        this._bitmap.pivotPoint = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get stretchedX()
    public get stretchedX(): boolean
    {
        return this._bitmap?.stretchedX ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set stretchedX()
    public set stretchedX(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.stretchedX = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get stretchedY()
    public get stretchedY(): boolean
    {
        return this._bitmap?.stretchedY ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set stretchedY()
    public set stretchedY(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.stretchedY = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get zoomX()
    public get zoomX(): number
    {
        return this._bitmap?.zoomX ?? 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set zoomX()
    public set zoomX(value: number)
    {
        if(!this._bitmap) return;

        this._bitmap.zoomX = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get zoomY()
    public get zoomY(): number
    {
        return this._bitmap?.zoomY ?? 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set zoomY()
    public set zoomY(value: number)
    {
        if(!this._bitmap) return;

        this._bitmap.zoomY = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get greyscale()
    public get greyscale(): boolean
    {
        return this._bitmap?.greyscale ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set greyscale()
    public set greyscale(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.greyscale = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get etchingColor()
    public get etchingColor(): number
    {
        return this._bitmap?.etchingColor ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set etchingColor()
    public set etchingColor(value: number)
    {
        if(!this._bitmap) return;

        this._bitmap.etchingColor = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get fitSizeToContents()
    public get fitSizeToContents(): boolean
    {
        return this._bitmap?.fitSizeToContents ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set fitSizeToContents()
    public set fitSizeToContents(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.fitSizeToContents = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get etchingPoint()
    public get etchingPoint(): { x: number; y: number }
    {
        return {x: 0, y: 1};
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get wrapX()
    public get wrapX(): boolean
    {
        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set wrapX()
    // Empty in AS3: the meter never tiles.
    public set wrapX(_value: boolean)
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get wrapY()
    public get wrapY(): boolean
    {
        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set wrapY()
    // Empty in AS3: the meter never tiles.
    public set wrapY(_value: boolean)
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get flipX()
    public get flipX(): boolean
    {
        return this._bitmap?.flipX ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set flipX()
    public set flipX(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.flipX = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get flipY()
    public get flipY(): boolean
    {
        return this._bitmap?.flipY ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set flipY()
    public set flipY(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.flipY = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::get rotation()
    public get rotation(): number
    {
        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::set rotation()
    // Empty in AS3: the meter never rotates.
    public set rotation(_value: number)
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PixelLimitWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        if(this._region)
        {
            this._region.removeEventListener(WindowMouseEvent.CLICK, this.onClick);
            this._region.dispose();
            this._region = null;
        }

        this._bitmap = null;

        if(this._root)
        {
            this._root.dispose();
            this._root = null;
        }

        if(this._widgetWindow)
        {
            this._widgetWindow.rootWindow = null;
            this._widgetWindow = null;
        }

        this._windowManager = null;
        this._disposed = true;
    }
}
