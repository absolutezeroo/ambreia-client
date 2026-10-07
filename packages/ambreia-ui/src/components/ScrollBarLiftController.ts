import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IDragBarWindow} from './IDragBarWindow';
import type {IScrollbarWindow} from './IScrollbarWindow';
import {InteractiveController} from './InteractiveController';
import type {ScrollBarController} from './ScrollBarController';
import type {WindowController} from '../WindowController';
import {WindowEvent} from '../events/WindowEvent';

/**
 * Controller for scrollbar lift (thumb) windows.
 *
 * The draggable thumb element within a scrollbar. Calculates its
 * scrollbar offset based on its position relative to the track.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarLiftController.as
 */
export class ScrollBarLiftController extends InteractiveController implements IDragBarWindow
{
    // AS3: .../src/com/sulake/core/window/components/ScrollBarLiftController.as::_scrollBar
    protected _scrollBar: ScrollBarController | null = null;

    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        parent: IWindow | null = null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        properties: unknown[] | null = null,
        id: number = 0,
        _dynamicStyle: string = ''
    )
    {
        param = param | 0x20;
        param = param | 0x8000;
        param = param | 0x0101;

        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);

        // Walk up the parent chain to find the scrollbar
        let current: IWindow | null = parent;

        while(current !== null)
        {
            if((current as unknown as IScrollbarWindow).horizontal !== undefined)
            {
                this._scrollBar = current as unknown as ScrollBarController;
                current = null;
            }
            else
            {
                current = current.parent;
            }
        }

        if(this._scrollBar)
        {
            if(this._scrollBar.horizontal)
            {
                this.limits.minWidth = this.width;
            }
            else
            {
                this.limits.minHeight = this.height;
            }
        }
    }

    protected _scrollbarOffsetX: number = 0;

    /**
	 * Gets the horizontal scrollbar offset (0..1).
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarLiftController.as::get scrollbarOffsetX()
    public get scrollbarOffsetX(): number
    {
        return this._scrollbarOffsetX;
    }

    /**
	 * Sets the horizontal scrollbar offset.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarLiftController.as::set scrollbarOffsetX()
    public set scrollbarOffsetX(_value: number)
    {
        // No-op per AS3
    }

    protected _scrollbarOffsetY: number = 0;

    /**
	 * Gets the vertical scrollbar offset (0..1).
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarLiftController.as::get scrollbarOffsetY()
    public get scrollbarOffsetY(): number
    {
        return this._scrollbarOffsetY;
    }

    /**
	 * Sets the vertical scrollbar offset.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarLiftController.as::set scrollbarOffsetY()
    public set scrollbarOffsetY(_value: number)
    {
        // No-op per AS3
    }

    /**
	 * Overrides offset to recalculate scrollbar positions and
	 * notify the scrollbar of the position change.
	 *
	 * In AS3, the offset() override is the primary mechanism for
	 * updating scrollbar offsets during drag operations.
	 */
    public override offset(dx: number, dy: number): void
    {
        super.offset(dx, dy);

        this._scrollbarOffsetX = (this.x !== 0 && this._parent)
            ? (this.x / (this._parent.width - this.width))
            : 0;

        this._scrollbarOffsetY = (this.y !== 0 && this._parent)
            ? (this.y / (this._parent.height - this.height))
            : 0;

        if(this._scrollBar && this._parent !== (this._scrollBar as unknown as IWindow))
        {
            const relocated = WindowEvent.allocate('WE_CHILD_RELOCATED', this, null);

            this._scrollBar.update(this as unknown as WindowController, relocated);
            relocated.recycle();
        }
    }
}
