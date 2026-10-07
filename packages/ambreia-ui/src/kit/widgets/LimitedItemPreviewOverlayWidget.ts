import type {ILimitedItemPreviewOverlayWidget} from './ILimitedItemPreviewOverlayWidget';
import type {IWidgetWindow} from '../../components/IWidgetWindow';
import type {IWindowManager} from '../IWindowManager';
import type {IWindowContainer} from '../../IWindowContainer';
import type {IWindow} from '../../IWindow';
import type {PropertyStruct} from '../../utils/PropertyStruct';
import type {IIterator} from '../../utils/IIterator';
import {EmptyIterator} from '../../iterators/EmptyIterator';

/**
 * Limited item preview overlay widget.
 *
 * Displays serial number and series size for limited edition items
 * in the catalog/marketplace preview view.
 *
 * Children are accessed on-demand in setters via findChildByName:
 * - "unique_item_serial_number_bitmap"
 * - "unique_item_edition_size_bitmap"
 *
 * @see sources/win63_version/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as
 */
export class LimitedItemPreviewOverlayWidget implements ILimitedItemPreviewOverlayWidget 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::TYPE
    public static readonly TYPE: string = 'limited_item_overlay_preview';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::_windowManager
    private _windowManager: IWindowManager | null = null;
    private _root: IWindowContainer | null = null;

    constructor(window: IWidgetWindow, windowManager: IWindowManager) 
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('unique_item_overlay_preview_xml') as IWindowContainer | null;

        if(root) 
        {
            this._root = root;

            this._widgetWindow.rootWindow = this._root as unknown as IWindow;
        }
    }

    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::_serialNumber
    private _serialNumber: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::get serialNumber()
    public get serialNumber(): number 
    {
        return this._serialNumber;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::set serialNumber()
    public set serialNumber(value: number) 
    {
        this._serialNumber = value;

        if(this._root) 
        {
            const serialBitmap = this._root.findChildByName('unique_item_serial_number_bitmap');

            if(serialBitmap) 
            {
                serialBitmap.caption = String(value);
            }
        }
    }

    private _seriesSize: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::get seriesSize()
    public get seriesSize(): number 
    {
        return this._seriesSize;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::set seriesSize()
    public set seriesSize(value: number) 
    {
        this._seriesSize = value;

        if(this._root) 
        {
            const editionBitmap = this._root.findChildByName('unique_item_edition_size_bitmap');

            if(editionBitmap) 
            {
                editionBitmap.caption = String(value);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::get properties()
    public get properties(): PropertyStruct[] 
    {
        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::set properties()
    public set properties(_values: PropertyStruct[]) 
    {
        // AS3: properties setter is a no-op for this widget
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/LimitedItemPreviewOverlayWidget.as::dispose()
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
