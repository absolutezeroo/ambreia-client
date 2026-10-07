import type {IRarityItemPreviewOverlayWidget} from '@ambreia/ui/kit/widgets/IRarityItemPreviewOverlayWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

/**
 * Rarity item preview overlay widget.
 *
 * Displays the rarity level as text in preview/catalog views.
 *
 * @see sources/win63_version/habbo/window/widgets/RarityItemPreviewOverlayWidget.as
 */
export class RarityItemPreviewOverlayWidget implements IRarityItemPreviewOverlayWidget 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::TYPE
    public static readonly TYPE: string = 'rarity_item_overlay_preview';

    private static readonly RARITY_LEVEL_KEY: string = 'rarity_item_overlay_preview:level';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    private _root: IWindowContainer | null = null;

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager) 
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('rarity_item_overlay_preview_xml') as IWindowContainer | null;

        if(root) 
        {
            this._root = root;

            this._widgetWindow.rootWindow = root as unknown as IWindow;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    private _rarityLevel: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::get rarityLevel()
    public get rarityLevel(): number 
    {
        return this._rarityLevel;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::set rarityLevel()
    public set rarityLevel(value: number) 
    {
        this._rarityLevel = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::get properties()
    public get properties(): PropertyStruct[] 
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(RarityItemPreviewOverlayWidget.RARITY_LEVEL_KEY, this._rarityLevel),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::set properties()
    public set properties(values: PropertyStruct[]) 
    {
        for(const prop of values) 
        {
            if(prop.key === RarityItemPreviewOverlayWidget.RARITY_LEVEL_KEY) 
            {
                this.rarityLevel = Number(prop.value);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RarityItemPreviewOverlayWidget.as::dispose()
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
