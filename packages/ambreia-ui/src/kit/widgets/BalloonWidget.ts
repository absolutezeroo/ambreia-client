import type {IWidget} from './IWidget';
import type {IWidgetWindow} from '../../components/IWidgetWindow';
import type {IWindowManager} from '../IWindowManager';
import type {IWindow} from '../../IWindow';
import type {IWindowContainer} from '../../IWindowContainer';
import {PropertyStruct} from '../../utils/PropertyStruct';
import {WindowEvent} from '../../events/WindowEvent';
import type {WindowEventListener} from '../../events/WindowEventDispatcher';
import type {IIterator} from '../../utils/IIterator';
import {BalloonArrowPivot} from '../enum/BalloonArrowPivot';

/**
 * Balloon / speech bubble widget.
 *
 * Renders a balloon shape with an arrow pointer positioned relative to
 * the balloon body. Supports arrow pivot placement (up/down/left/right,
 * minimum/middle/maximum) and displacement offset.
 *
 * In the AS3 version, uses IStaticBitmapWrapperWindow for arrow rendering
 * and IWindowContainer for the border. In the TypeScript port, balloon
 * layout metadata is stored for the UI layer.
 *
 * @see sources/win63_version/habbo/window/widgets/BalloonWidget.as
 */
export class BalloonWidget implements IWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::TYPE
    public static readonly TYPE: string = 'balloon';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::ARROW_PIVOT_KEY
    private static readonly ARROW_PIVOT_KEY: string = 'balloon:arrow_pivot';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::ARROW_DISPLACEMENT_KEY
    private static readonly ARROW_DISPLACEMENT_KEY: string = 'balloon:arrow_displacement';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::ARROW_FREE_PADDING
    private static readonly ARROW_FREE_PADDING: number = 6;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::ARROW_LENGTH
    private static readonly ARROW_LENGTH: number = 6;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::ARROW_WIDTH
    private static readonly ARROW_WIDTH: number = 9;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::ARROW_ASSET_PREFIX
    private static readonly ARROW_ASSET_PREFIX: string = 'illumina_light_balloon_arrow_';

    private static readonly PARAM_FLAG_131072: number = 131072;
    private static readonly PARAM_FLAG_147456: number = 147456;

    private _batchUpdate: boolean = false;

    // Name DERIVED (`_SafeStr_5338`): obfuscated in every tree. Set while refresh() assigns sizes,
    // so the resize events those assignments raise do not re-enter it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::_SafeStr_5338
    private _resizing: boolean = false;

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::_windowManager
    private _windowManager: IWindowManager | null = null;

    private _root: IWindowContainer | null = null;
    private _arrowBitmap: IWindow | null = null;
    private _border: IWindowContainer | null = null;

    private _onChangeBound: WindowEventListener;

    constructor(window: IWidgetWindow, windowManager: IWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        this._onChangeBound = this.onChange.bind(this);

        const root = this._windowManager.buildWidgetLayout('balloon_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;
            this._arrowBitmap = root.findChildByName('bitmap');
            this._border = root.findChildByName('border') as IWindowContainer | null;

            this.syncFlags();

            this._widgetWindow.addEventListener(WindowEvent.WE_RESIZE, this._onChangeBound);
            this._widgetWindow.addEventListener(WindowEvent.WE_RESIZED, this._onChangeBound);

            if(this._border)
            {
                this._border.addEventListener(WindowEvent.WE_RESIZE, this._onChangeBound);
                this._border.addEventListener(WindowEvent.WE_RESIZED, this._onChangeBound);
            }

            this._widgetWindow.rootWindow = root as unknown as IWindow;
            root.width = this._widgetWindow.width;
            root.height = this._widgetWindow.height;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    private _arrowPivot: string = 'up, center';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::get arrowPivot()
    public get arrowPivot(): string
    {
        return this._arrowPivot;
    }

    /**
	 * AS3 refreshes twice, with the border's size flags cleared in between: the first pass lets
	 * the balloon shrink to what the new arrow direction needs, the second re-applies the flags
	 * and settles the final size. Refreshing once leaves the balloon at whatever the previous
	 * direction had grown it to.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::set arrowPivot()
    public set arrowPivot(value: string)
    {
        this._arrowPivot = value;

        this.clearFlags();
        this.refresh();
        this.syncFlags();
        this.refresh();
    }

    private _arrowDisplacement: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::get arrowDisplacement()
    public get arrowDisplacement(): number
    {
        return this._arrowDisplacement;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::set arrowDisplacement()
    public set arrowDisplacement(value: number)
    {
        this._arrowDisplacement = value;

        this.refresh();
    }

    /**
	 * Returns the border's iterator if available.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::get iterator()
    public iterator(): IIterator | null
    {
        if(this._border)
        {
            return this._border.iterator();
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(BalloonWidget.ARROW_PIVOT_KEY, this._arrowPivot),
            new PropertyStruct(BalloonWidget.ARROW_DISPLACEMENT_KEY, this._arrowDisplacement),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        this._batchUpdate = true;

        for(const prop of values)
        {
            switch(prop.key)
            {
                case BalloonWidget.ARROW_PIVOT_KEY:
                    this.arrowPivot = String(prop.value);
                    break;
                case BalloonWidget.ARROW_DISPLACEMENT_KEY:
                    this.arrowDisplacement = Number(prop.value);
                    break;
            }
        }

        this._batchUpdate = false;

        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._widgetWindow)
        {
            this._widgetWindow.removeEventListener(WindowEvent.WE_RESIZE, this._onChangeBound);
            this._widgetWindow.removeEventListener(WindowEvent.WE_RESIZED, this._onChangeBound);
        }

        if(this._border)
        {
            this._border.removeEventListener(WindowEvent.WE_RESIZE, this._onChangeBound);
            this._border.removeEventListener(WindowEvent.WE_RESIZED, this._onChangeBound);
            this._border = null;
        }

        this._arrowBitmap = null;

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

    /**
	 * Sync param flags from widgetWindow to border.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::syncFlags()
    private syncFlags(): void
    {
        if(!this._widgetWindow || !this._border) return;

        const widgetWindow = this._widgetWindow as IWindow;
        const border = this._border as IWindow;

        // AS3 assigns the widget's value straight across, so a flag that is off gets cleared on
        // the border too. Only ever setting it true meant clearFlags() could never be undone and
        // the balloon stayed stuck at its first-computed size.
        border.setParamFlag(BalloonWidget.PARAM_FLAG_131072, widgetWindow.getParamFlag(BalloonWidget.PARAM_FLAG_131072));
        border.setParamFlag(BalloonWidget.PARAM_FLAG_147456, widgetWindow.getParamFlag(BalloonWidget.PARAM_FLAG_147456));
    }

    /**
	 * Clear param flags from border.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::clearFlags()
    private clearFlags(): void
    {
        if(!this._border) return;

        const border = this._border as IWindow;

        border.setParamFlag(BalloonWidget.PARAM_FLAG_131072, false);
        border.setParamFlag(BalloonWidget.PARAM_FLAG_147456, false);
    }

    /**
	 * Handle resize events. Calls refresh to reposition the arrow.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::onChange()
    private onChange(): void
    {
        this.refresh();
    }

    /**
	 * Sizes the balloon around its border and puts the arrow on the right edge
	 *
	 * Three sizing modes, taken from the widget window's own flags: 147456 sizes the balloon to
	 * exactly what the border needs, 131072 lets it grow to that but never shrink below what the
	 * caller asked for, and with neither the caller's size wins outright. The arrow's thickness is
	 * added to whichever axis it grows along, which is why the two branches differ only in which
	 * of width/height gets the extra.
	 *
	 * `_batchUpdate` guards re-entry: assigning width/height below fires the resize listeners that
	 * call straight back into here.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BalloonWidget.as::refresh()
    private refresh(): void
    {
        if(this._batchUpdate || this._resizing || this._disposed) return;
        if(this._border === null || this._root === null || this._widgetWindow === null) return;

        const border = this._border as unknown as IWindow;
        const root = this._root as unknown as IWindow;
        const widgetWindow = this._widgetWindow as unknown as IWindow;

        const direction = BalloonArrowPivot.directionFromPivot(this._arrowPivot);
        const vertical = direction === BalloonArrowPivot.UP || direction === BalloonArrowPivot.DOWN;

        // The -1 is AS3's own: the arrow overlaps the border by a pixel so the two joins seamlessly.
        const neededWidth = vertical ? border.width : border.width + BalloonWidget.ARROW_LENGTH - 1;
        const neededHeight = vertical ? border.height + BalloonWidget.ARROW_LENGTH - 1 : border.height;

        this._resizing = true;

        if(widgetWindow.testParamFlag(BalloonWidget.PARAM_FLAG_147456))
        {
            root.width = neededWidth;
            root.height = neededHeight;
        }
        else if(widgetWindow.testParamFlag(BalloonWidget.PARAM_FLAG_131072))
        {
            root.width = Math.max(widgetWindow.width, neededWidth);
            root.height = Math.max(widgetWindow.height, neededHeight);
        }
        else
        {
            root.width = widgetWindow.width;
            root.height = widgetWindow.height;
        }

        widgetWindow.width = root.width;
        widgetWindow.height = root.height;

        this._resizing = false;

        if(this._arrowBitmap === null) return;

        (this._arrowBitmap as IWindow & {assetUri: string}).assetUri = BalloonWidget.ARROW_ASSET_PREFIX + direction;

        const position = BalloonArrowPivot.positionFromPivot(this._arrowPivot);
        const along = vertical ? root.width : root.height;

        let offset: number;

        if(position === BalloonArrowPivot.MINIMUM) offset = BalloonWidget.ARROW_FREE_PADDING;
        else if(position === BalloonArrowPivot.MAXIMUM) offset = along - BalloonWidget.ARROW_FREE_PADDING - BalloonWidget.ARROW_WIDTH;
        else offset = (along - BalloonWidget.ARROW_WIDTH) / 2;

        // AS3 clamps through MathUtils.clamp() (habbo/utils/_SafeCls_2916.as), inlined here so the
        // kit does not reach for the engine's MathUtils.
        const slide = Math.max(
            BalloonWidget.ARROW_FREE_PADDING,
            Math.min(along - BalloonWidget.ARROW_FREE_PADDING, offset + this._arrowDisplacement)
        );

        this._resizing = true;

        if(vertical)
        {
            border.rectangle = {
                x: 0,
                y: direction === BalloonArrowPivot.UP ? BalloonWidget.ARROW_LENGTH - 1 : 0,
                width: root.width,
                height: root.height + 1 - BalloonWidget.ARROW_LENGTH
            };
        }
        else
        {
            border.rectangle = {
                x: direction === BalloonArrowPivot.LEFT ? BalloonWidget.ARROW_LENGTH - 1 : 0,
                y: 0,
                width: root.width + 1 - BalloonWidget.ARROW_LENGTH,
                height: root.height
            };
        }

        this._resizing = false;

        if(vertical)
        {
            this._arrowBitmap.rectangle = {
                x: slide,
                y: direction === BalloonArrowPivot.UP ? 0 : border.bottom - 1,
                width: BalloonWidget.ARROW_WIDTH,
                height: BalloonWidget.ARROW_LENGTH
            };
        }
        else
        {
            this._arrowBitmap.rectangle = {
                x: direction === BalloonArrowPivot.LEFT ? 0 : border.right - 1,
                y: slide,
                width: BalloonWidget.ARROW_LENGTH,
                height: BalloonWidget.ARROW_WIDTH
            };
        }
    }
}
