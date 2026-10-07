import type {ILimitedItemSupplyLeftOverlayWidget} from '@ambreia/ui/kit/widgets/ILimitedItemSupplyLeftOverlayWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

/**
 * Limited supply left overlay widget.
 *
 * Displays the remaining supply count and total series size for
 * limited edition items in the catalog purchase view.
 *
 * Children are accessed on-demand in setters via findChildByName:
 * - "items_left_count"
 * - "items_total_count"
 * - "unique_item_sold_out_bitmap"
 *
 * @see sources/win63_version/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as
 */
export class LimitedItemSupplyLeftOverlayWidget implements ILimitedItemSupplyLeftOverlayWidget 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::TYPE
    public static readonly TYPE: string = 'limited_item_overlay_supply';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _root: IWindowContainer | null = null;

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager) 
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('unique_item_overlay_supply_xml') as IWindowContainer | null;

        if(root) 
        {
            this._root = root;

            this._widgetWindow.rootWindow = this._root as unknown as IWindow;
        }
    }

    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    private _supplyLeft: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::get supplyLeft()
    public get supplyLeft(): number 
    {
        return this._supplyLeft;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::set supplyLeft()
    public set supplyLeft(value: number) 
    {
        this._supplyLeft = value;

        if(this._root) 
        {
            const leftCount = this._root.findChildByName('items_left_count');

            if(leftCount) 
            {
                leftCount.caption = String(value);
            }

            const soldOutBitmap = this._root.findChildByName('unique_item_sold_out_bitmap');

            if(soldOutBitmap) 
            {
                soldOutBitmap.visible = (value <= 0);
            }
        }
    }

    private _seriesSize: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::get seriesSize()
    public get seriesSize(): number 
    {
        return this._seriesSize;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::set seriesSize()
    public set seriesSize(value: number) 
    {
        this._seriesSize = value;

        if(this._root) 
        {
            const totalCount = this._root.findChildByName('items_total_count');

            if(totalCount) 
            {
                totalCount.caption = String(value);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::get serialNumber()
    public get serialNumber(): number 
    {
        // AS3: serialNumber always returns 0 for supply widget
        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::set serialNumber()
    public set serialNumber(_value: number) 
    {
        // AS3: serialNumber setter is a no-op for supply widget
    }

    /**
     * Whether the item is sold out (supply <= 0).
     */
    public get isSoldOut(): boolean 
    {
        return this._supplyLeft <= 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::get properties()
    public get properties(): PropertyStruct[] 
    {
        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::set properties()
    public set properties(_values: PropertyStruct[]) 
    {
        // AS3: properties setter is a no-op for this widget
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemSupplyLeftOverlayWidget.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;

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
