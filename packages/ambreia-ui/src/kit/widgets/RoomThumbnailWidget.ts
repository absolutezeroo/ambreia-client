import type {IRoomThumbnailWidget} from './IRoomThumbnailWidget';
import type {IWidgetWindow} from '../../components/IWidgetWindow';
import type {IWindowManager} from '../IWindowManager';
import type {IWindowContainer} from '../../IWindowContainer';
import type {IWindow} from '../../IWindow';
import type {PropertyStruct} from '../../utils/PropertyStruct';
import type {IIterator} from '../../utils/IIterator';

/**
 * Room thumbnail widget.
 *
 * Displays a thumbnail image for a room. Builds the window tree
 * from the room_thumbnail layout.
 *
 * @see sources/win63_version/habbo/window/widgets/RoomThumbnailWidget.as
 */
export class RoomThumbnailWidget implements IRoomThumbnailWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::TYPE
    public static readonly TYPE: string = 'room_thumbnail';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::_windowManager
    private _windowManager: IWindowManager | null = null;
    private _root: IWindowContainer | null = null;

    constructor(window: IWidgetWindow, windowManager: IWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::RoomThumbnailWidget()
        // uses assets.getAssetByName("room_thumbnail_xml") - the "_xml" suffix is part of
        // the real asset name here, not a generic convention to strip.
        const root = this._windowManager.buildWidgetLayout('room_thumbnail_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;

            this._widgetWindow.rootWindow = this._root as unknown as IWindow;
            this._root.width = this._widgetWindow.width;
            this._root.height = this._widgetWindow.height;
        }
    }

    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    private _flatId: number = 0;

    public get flatId(): number
    {
        return this._flatId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::set flatId()
    public set flatId(value: number)
    {
        this._flatId = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::set properties()
    public set properties(_values: PropertyStruct[])
    {
        // AS3: properties setter is a no-op for this widget
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::reset()
    public reset(): void
    {
        this._flatId = 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::get iterator()
    // AS3 returns null: this widget owns no child windows to walk.
    public iterator(): IIterator | null
    {
        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomThumbnailWidget.as::dispose()
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
