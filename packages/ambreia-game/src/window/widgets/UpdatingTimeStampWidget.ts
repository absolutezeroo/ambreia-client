import type {IWidget} from '@ambreia/ui/kit/widgets/IWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';
import {FriendlyTime} from '../../utils/FriendlyTime';

/**
 * Updating timestamp display widget.
 *
 * Displays a human-readable "time ago" string that updates every minute.
 * Uses FriendlyTime to format the elapsed duration (e.g. "5 minutes ago").
 *
 * In the AS3 version, uses a shared static Timer with 60-second interval
 * and ILabelWindow for display. In the TypeScript port, timestamp state
 * is stored for the UI layer.
 *
 * @see sources/win63_version/habbo/window/widgets/UpdatingTimeStampWidget.as
 */
export class UpdatingTimeStampWidget implements IWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::TYPE
    public static readonly TYPE: string = 'updating_timestamp';

    private static readonly UPDATE_INTERVAL_MS: number = 60000;

    /**
	 * Shared static interval timer for all UpdatingTimeStampWidget instances.
	 * In AS3, this was a static Timer(60000) that was started in the class initializer.
	 */
    private static _updateTimerId: ReturnType<typeof setInterval> | null = null;
    private static _instances: Set<UpdatingTimeStampWidget> = new Set();
    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _label: IWindow | null = null;

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        // AS3: label = _windowManager.create("", 12, 100, 16, new Rectangle()) as ILabelWindow
        // TypeId 12 = Label window type
        this._label = this._windowManager.create(
            '', 12, 100, 16,
            {x: 0, y: 0, width: 0, height: 0}
        );

        if(this._label)
        {
            // AS3: label.textColor = 5592405 (0x555555)
            this._label.color = 5592405;
            this._widgetWindow.rootWindow = this._label;
        }

        // Register with the shared static timer
        UpdatingTimeStampWidget._instances.add(this);
        UpdatingTimeStampWidget.startUpdateTimer();

        this.reset();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    private _timeStamp: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::get timeStamp()
    public get timeStamp(): number
    {
        return this._timeStamp;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::set timeStamp()
    public set timeStamp(value: number)
    {
        this._timeStamp = value;
        this.onTimerTick();
    }

    private _align: string = '';

    /**
	 * The text alignment for the display label.
	 */
    public get align(): string
    {
        return this._align;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::set align()
    public set align(value: string)
    {
        this._align = value;
    }

    /**
	 * Get the elapsed seconds since the timestamp.
	 */
    public get elapsedSeconds(): number
    {
        return (Date.now() - Math.abs(this._timeStamp)) / 1000;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::set properties()
    public set properties(_values: PropertyStruct[])
    {
        // AS3: properties setter is a no-op for this widget
    }

    /**
	 * Start the shared update timer if not already running.
	 */
    private static startUpdateTimer(): void
    {
        if(UpdatingTimeStampWidget._updateTimerId === null)
        {
            UpdatingTimeStampWidget._updateTimerId = setInterval(() =>
            {
                for(const instance of UpdatingTimeStampWidget._instances)
                {
                    instance.onTimerTick();
                }
            }, UpdatingTimeStampWidget.UPDATE_INTERVAL_MS);
        }
    }

    /**
	 * Stop the shared update timer if no instances remain.
	 */
    private static stopUpdateTimer(): void
    {
        if(UpdatingTimeStampWidget._instances.size === 0 && UpdatingTimeStampWidget._updateTimerId !== null)
        {
            clearInterval(UpdatingTimeStampWidget._updateTimerId);
            UpdatingTimeStampWidget._updateTimerId = null;
        }
    }

    /**
	 * Reset the timestamp to the current time.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::reset()
    public reset(): void
    {
        this._timeStamp = Date.now();
        this.onTimerTick();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        // Unregister from the shared static timer
        UpdatingTimeStampWidget._instances.delete(this);
        UpdatingTimeStampWidget.stopUpdateTimer();

        if(this._label)
        {
            this._label.dispose();
            this._label = null;
        }

        if(this._widgetWindow)
        {
            this._widgetWindow.rootWindow = null;
            this._widgetWindow = null;
        }

        this._windowManager = null;
        this._disposed = true;
    }

    /**
	 * Timer tick handler called every 60 seconds by the shared static timer
	 *
	 * `.ago` is a key suffix, not text: FriendlyTime looks up `friendlytime.minutes.ago`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/UpdatingTimeStampWidget.as::onTimerTick()
    private onTimerTick(): void
    {
        if(this._disposed || this._label === null || this._windowManager === null) return;

        const localization = this._windowManager.localization;

        if(localization === null) return;

        this._label.caption = FriendlyTime.getFriendlyTime(localization, this.elapsedSeconds, '.ago', 1);
    }
}
