import type {IRarityItemGridOverlayWidget} from '@ambreia/ui/kit/widgets/IRarityItemGridOverlayWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

/**
 * Rarity item grid overlay widget.
 *
 * Displays a rarity level overlay on grid items, showing the
 * rarity number as a bitmap.
 *
 * @see sources/win63_version/habbo/window/widgets/RarityItemGridOverlayWidget.as
 */
export class RarityItemGridOverlayWidget implements IRarityItemGridOverlayWidget 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::TYPE
    public static readonly TYPE: string = 'rarity_item_overlay_grid';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    private _root: IWindowContainer | null = null;
    private _plaqueBitmap: IWindow | null = null;

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager) 
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('rarity_item_overlay_griditem_xml') as IWindowContainer | null;

        if(root) 
        {
            this._root = root;
            this._plaqueBitmap = root.findChildByName('rarity_item_overlay_plaque_background_bitmap');

            this._widgetWindow.rootWindow = root as unknown as IWindow;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    private _rarityLevel: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::get rarityLevel()
    public get rarityLevel(): number 
    {
        return this._rarityLevel;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::set rarityLevel()
    public set rarityLevel(value: number) 
    {
        this._rarityLevel = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::get properties()
    public get properties(): PropertyStruct[] 
    {
        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::set properties()
    public set properties(_values: PropertyStruct[]) 
    {
        // AS3: properties setter is a no-op for this widget
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemGridOverlayWidget.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;

        this._plaqueBitmap = null;

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
