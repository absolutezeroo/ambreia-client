import type {ICountdownWidget} from '@ambreia/ui/kit/widgets/ICountdownWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IUpdateReceiver} from '@core/runtime/IContext';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

/**
 * Countdown timer widget.
 *
 * Builds its display out of the `clock_base_xml` item list: the layout ships one `counter`
 * item and one `separator` item, and the widget clones them into `digits` groups. Each
 * counter holds a `value` and a `unit` caption, rewritten on every tick.
 *
 * `digits` is not a field — it is read back off the list as `(numListItems + 1) / 2`,
 * exactly as AS3 does, which is what keeps the two in step.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as
 */
export class CountdownWidget implements ICountdownWidget, IUpdateReceiver
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::TYPE
    public static readonly TYPE: string = 'countdown';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::RUNNING_KEY
    private static readonly RUNNING_KEY: string = 'countdown:running';
    // Derived name: obfuscated in every tree, like the seconds key below.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::DIGITS_KEY
    private static readonly DIGITS_KEY: string = 'countdown:digits';
    // Derived name: obfuscated in every tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::SECONDS_KEY
    private static readonly SECONDS_KEY: string = 'countdown:seconds';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::COLOR_STYLE_KEY
    private static readonly COLOR_STYLE_KEY: string = 'countdown:color_style';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::UNIT_KEY_PREFIX
    private static readonly UNIT_KEY_PREFIX: string = 'countdown_clock_unit_';

    // Derived name: obfuscated in every tree — the five unit names the captions are keyed by.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::UNIT_NAMES
    private static readonly UNIT_NAMES: string[] = ['weeks', 'days', 'hours', 'minutes', 'seconds'];
    // Derived name: obfuscated in every tree — how many seconds each unit above is worth.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::UNIT_SECONDS
    private static readonly UNIT_SECONDS: number[] = [604800, 86400, 3600, 60, 1];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::UNIT_MAX_VALUES
    private static readonly UNIT_MAX_VALUES: number[] = [100, 7, 24, 60, 60];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::COLOR_STYLES_VALUES
    private static readonly COLOR_STYLES_VALUES: number[] = [0, 16777215];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::COLOR_STYLES_ETCHING_VALUES
    private static readonly COLOR_STYLES_ETCHING_VALUES: number[] = [3003121663, 0];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_disposed
    private _disposed: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_widgetWindow
    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_root
    private _root: IItemListWindow | null = null;
    // Derived name: obfuscated in every tree — the `counter` list item cloned per unit group.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_counterTemplate
    private _counterTemplate: IWindow | null = null;
    // Derived name: obfuscated in every tree — the `separator` list item cloned between groups.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_separatorTemplate
    private _separatorTemplate: ITextWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_running
    private _running: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_startSeconds
    private _startSeconds: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_startTime
    private _startTime: number = Date.now();
    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_colorStyle
    private _colorStyle: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::_displayedTime
    private _displayedTime: number = -1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::CountdownWidget()
    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        this._root = this._windowManager.buildWidgetLayout('clock_base_xml') as IItemListWindow | null;

        if(this._root)
        {
            this._counterTemplate = this._root.getListItemByName('counter');
            this._separatorTemplate = this._root.getListItemByName('separator') as ITextWindow | null;
        }

        this.digits = 3;

        this._windowManager.registerUpdateReceiver(this, 10);
        this._widgetWindow.setParamFlag(147456);
        this._widgetWindow.rootWindow = this._root;
    }

    /**
	 * The first unit index that still has a non-zero value, given how many groups are shown.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::getMaxUnitIndex()
    private static getMaxUnitIndex(digits: number, totalSeconds: number): number
    {
        let index = 0;

        while(index < CountdownWidget.UNIT_SECONDS.length - digits)
        {
            if(totalSeconds >= CountdownWidget.UNIT_SECONDS[index]) return index;

            index++;
        }

        return index;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::update()
    public update(_intervalMs: number): void
    {
        this.updateTime();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(CountdownWidget.RUNNING_KEY, this._running, PropertyStruct.BOOLEAN),
            new PropertyStruct(CountdownWidget.DIGITS_KEY, this.digits, PropertyStruct.UINT),
            new PropertyStruct(CountdownWidget.SECONDS_KEY, this.seconds, PropertyStruct.INT),
            new PropertyStruct(CountdownWidget.COLOR_STYLE_KEY, this.colorStyle, PropertyStruct.INT),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        if(this._disposed) return;

        for(const prop of values)
        {
            switch(prop.key)
            {
                case CountdownWidget.RUNNING_KEY:
                    this.running = Boolean(prop.value);
                    break;
                case CountdownWidget.DIGITS_KEY:
                    this.digits = Number(prop.value);
                    break;
                case CountdownWidget.SECONDS_KEY:
                    this.seconds = Number(prop.value);
                    break;
                case CountdownWidget.COLOR_STYLE_KEY:
                    this.colorStyle = Number(prop.value);
                    break;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::get colorStyle()
    public get colorStyle(): number
    {
        return this._colorStyle;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::set colorStyle()
    public set colorStyle(value: number)
    {
        this._colorStyle = value;

        if(!this._root) return;

        const count = this._root.numListItems;

        for(let i = 0; i < count; i++)
        {
            const item = this._root.getListItemAt(i) as IWindowContainer | null;

            if(!item) continue;

            const unit = item.getChildByName('unit') as ITextWindow | null;

            if(!unit) continue;

            let textColor = unit.textColor;
            let etchingColor = unit.etchingColor;

            if(this._colorStyle >= 0 && this._colorStyle < CountdownWidget.COLOR_STYLES_VALUES.length)
            {
                textColor = CountdownWidget.COLOR_STYLES_VALUES[this._colorStyle];
                etchingColor = CountdownWidget.COLOR_STYLES_ETCHING_VALUES[this._colorStyle];
            }

            unit.textColor = textColor;
            unit.etchingColor = etchingColor;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::get running()
    public get running(): boolean
    {
        return this._running;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::set running()
    public set running(value: boolean)
    {
        if(this._running && !value) this._startSeconds = this.seconds;

        if(!this._running && value) this._startTime = Date.now();

        this._running = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::get digits()
    public get digits(): number
    {
        // Read back off the list rather than stored: AS3 keeps no `_digits` field, which is
        // what makes `set digits()`'s "did it actually change" test work.
        // AS3's getter is typed `uint`, so the division truncates.
        return Math.floor(((this._root?.numListItems ?? 0) + 1) / 2);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::set digits()
    public set digits(value: number)
    {
        const clamped = Math.max(2, Math.min(4, value));

        if(!this._root || clamped === this.digits) return;

        this._root.removeListItems();

        for(let i = 0; i < clamped; i++)
        {
            if(i !== 0 && this._separatorTemplate) this._root.addListItem(this._separatorTemplate.clone());

            if(this._counterTemplate) this._root.addListItem(this._counterTemplate.clone());
        }

        this.updateTime(true);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::get seconds()
    public get seconds(): number
    {
        // AS3's getter is typed `int`, so the division truncates before anyone sees it — the
        // captions and `_displayedTime` both depend on that.
        if(this._running) return Math.floor(Math.max(0, this._startSeconds - (Date.now() - this._startTime) / 1000));

        return this._startSeconds;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::set seconds()
    public set seconds(value: number)
    {
        this._startSeconds = value;
        this._startTime = Date.now();
        this.updateTime();
    }

    /**
	 * Rewrite the value and unit caption of every counter group.
	 *
	 * @param force - Rewrite even when the remaining time has not changed, which is what
	 *                `set digits()` needs after it has rebuilt the list.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::updateTime()
    private updateTime(force: boolean = false): void
    {
        if(!this._root) return;

        const totalSeconds = this.seconds;

        if(totalSeconds === this._displayedTime && !force) return;

        const digits = this.digits;
        const maxUnitIndex = CountdownWidget.getMaxUnitIndex(digits, totalSeconds);

        for(let i = 0; i < digits; i++)
        {
            const unitIndex = maxUnitIndex + i;
            const item = this._root.getListItemAt(i * 2) as IWindowContainer | null;

            if(!item) continue;

            const unitValue = Math.floor(totalSeconds / CountdownWidget.UNIT_SECONDS[unitIndex])
                % CountdownWidget.UNIT_MAX_VALUES[unitIndex];
            const value = item.getChildByName('value');
            const unit = item.getChildByName('unit');

            if(value) value.caption = (unitValue < 10 ? '0' : '') + unitValue.toString();

            if(unit) unit.caption = '${' + CountdownWidget.UNIT_KEY_PREFIX + CountdownWidget.UNIT_NAMES[unitIndex] + '}';
        }

        this._displayedTime = totalSeconds;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/CountdownWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        if(this._root)
        {
            this._root.dispose();
            this._root = null;
        }

        if(this._counterTemplate)
        {
            this._counterTemplate.dispose();
            this._counterTemplate = null;
        }

        if(this._separatorTemplate)
        {
            this._separatorTemplate.dispose();
            this._separatorTemplate = null;
        }

        if(this._widgetWindow)
        {
            this._widgetWindow.rootWindow = null;
            this._widgetWindow = null;
        }

        this._windowManager?.removeUpdateReceiver(this);
        this._windowManager = null;
        this._disposed = true;
    }
}
