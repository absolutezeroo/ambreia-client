/**
 * RoomWidgetBase
 *
 * @see sources/win63_version/habbo/ui/widget/RoomWidgetBase.as
 *
 * Base implementation of IRoomWidget. Concrete widgets (InfoStandWidget, etc.)
 * extend this for the common handler/windowManager/assets/localization plumbing.
 */
import type {EventEmitter} from 'eventemitter3';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IRoomDesktop} from '@habbo/ui/IRoomDesktop';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomWidgetMessageListener} from '@habbo/ui/IRoomWidgetMessageListener';
import type {IRoomWidget} from './IRoomWidget';

export class RoomWidgetBase implements IRoomWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::_disposed
    private _disposed: boolean = false;
    private _updateEventDispatcher: EventEmitter | null = null;
    private _messageListener: IRoomWidgetMessageListener | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::_windowManager
    private _windowManager: IHabboWindowManager;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::_assets
    protected _assets: IAssetLibrary | null;
    protected _localizations: IHabboLocalizationManager | null;
    protected _handler: IRoomWidgetHandler | null;
    private _reusable: boolean = false;
    private _widgetType: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::RoomWidgetBase()
    constructor(
        handler: IRoomWidgetHandler,
        windowManager: IHabboWindowManager,
        assets: IAssetLibrary | null = null,
        localizations: IHabboLocalizationManager | null = null
    )
    {
        this._handler = handler;
        this._windowManager = windowManager;
        this._assets = assets;
        this._localizations = localizations;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get state()
    public get state(): number
    {
        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::initialize()
    public initialize(_state: number = 0): void
    {
        // AS3 no-op — overridden by subclasses that need it.
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::dispose()
    public dispose(): void
    {
        if(this.disposed) return;

        this._messageListener = null;

        if(this._updateEventDispatcher)
        {
            this.unregisterUpdateEvents(this._updateEventDispatcher);
        }

        if(this._handler)
        {
            this._handler.dispose();
            this._handler = null;
        }

        this._updateEventDispatcher = null;
        this._assets = null;
        this._localizations = null;
        this._reusable = false;
        this._disposed = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::set messageListener() / get messageListener()
    public set messageListener(value: IRoomWidgetMessageListener | null)
    {
        this._messageListener = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get messageListener()
    public get messageListener(): IRoomWidgetMessageListener | null
    {
        return this._messageListener;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get windowManager()
    public get windowManager(): IHabboWindowManager
    {
        return this._windowManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get assets()
    public get assets(): IAssetLibrary | null
    {
        return this._assets;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get localizations()
    public get localizations(): IHabboLocalizationManager | null
    {
        return this._localizations;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::registerUpdateEvents()
    public registerUpdateEvents(dispatcher: EventEmitter): void
    {
        this._updateEventDispatcher = dispatcher;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::unregisterUpdateEvents()
    public unregisterUpdateEvents(_dispatcher: EventEmitter): void
    {
        // AS3 no-op — overridden by subclasses that registered listeners.
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get mainWindow()
    public get mainWindow(): IWindow | null
    {
        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get widgetHandler()
    public get widgetHandler(): IRoomWidgetHandler | null
    {
        return this._handler;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::release()
    public release(): void
    {
        if(this._handler)
        {
            this._handler.container = null;
        }

        this._messageListener = null;

        if(this._updateEventDispatcher)
        {
            this.unregisterUpdateEvents(this._updateEventDispatcher);
            this._updateEventDispatcher = null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::reuse()
    public reuse(_desktop: IRoomDesktop): void
    {
        // AS3 no-op — overridden by subclasses that support reuse.
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::set reusable() / get reusable()
    public set reusable(value: boolean)
    {
        this._reusable = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get reusable()
    public get reusable(): boolean
    {
        return this._reusable;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::set widgetType() / get widgetType()
    public set widgetType(value: string)
    {
        this._widgetType = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/RoomWidgetBase.as::get widgetType()
    public get widgetType(): string
    {
        return this._widgetType;
    }
}
