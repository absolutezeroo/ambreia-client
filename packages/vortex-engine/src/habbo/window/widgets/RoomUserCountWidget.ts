import type {IRoomUserCountWidget} from '@ambreia/ui/kit/widgets/IRoomUserCountWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IIterator} from '@ambreia/ui/utils/IIterator';

/**
 * Room user count display widget.
 *
 * Displays the current number of users in a room. Builds the window
 * tree from the room_user_count layout.
 *
 * @see sources/win63_version/habbo/window/widgets/RoomUserCountWidget.as
 */
export class RoomUserCountWidget implements IRoomUserCountWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomUserCountWidget.as::TYPE
    public static readonly TYPE: string = 'room_user_count';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomUserCountWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _root: IWindowContainer | null = null;

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        // `room_usercount_xml`, not `room_user_count_xml`. AS3's own
        // `RoomUserCountWidget.as:24` asks for the underscored spelling, which is declared nowhere
        // in its asset library either — `HabboWindowManagerCom.as:2171` declares
        // `room_usercount_xml`, and CLAUDE.md makes the `*Com.as` field name the asset's real
        // name. So the original Flash client asks for a layout it does not have; this port copied
        // the string faithfully and inherited a widget that could never build. Corrected to the
        // declared name.
        const root = this._windowManager.buildWidgetLayout('room_usercount_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;

            this._widgetWindow.rootWindow = this._root as unknown as IWindow;
            this._root.width = this._widgetWindow.width;
            this._root.height = this._widgetWindow.height;
        }
    }

    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomUserCountWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    private _userCount: number = 0;

    public get userCount(): number
    {
        return this._userCount;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomUserCountWidget.as::set userCount()
    public set userCount(value: number)
    {
        this._userCount = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomUserCountWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomUserCountWidget.as::set properties()
    public set properties(_values: PropertyStruct[])
    {
        // AS3: properties setter is a no-op for this widget
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomUserCountWidget.as::get iterator()
    // AS3 returns null: this widget owns no child windows to walk.
    public iterator(): IIterator | null
    {
        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomUserCountWidget.as::dispose()
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
