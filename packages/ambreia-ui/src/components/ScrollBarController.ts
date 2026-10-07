import type {IWindow} from '../IWindow';
import type {IWindowContainer} from '../IWindowContainer';
import type {IWindowContext} from '../IWindowContext';
import type {IScrollbarWindow} from './IScrollbarWindow';
import type {IScrollableWindow} from './IScrollableWindow';
import type {IDesktopWindow} from './IDesktopWindow';
import {InteractiveController} from './InteractiveController';
import {SubstituteParentController} from './SubstituteParentController';
import type {ScrollBarLiftController} from './ScrollBarLiftController';
import type {WindowController} from '../WindowController';
import {WindowEvent} from '../events/WindowEvent';
import type {WindowMouseEvent} from '../events/WindowMouseEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import {SmoothScroller} from '../utils/SmoothScroller';

/**
 * Controller for scrollbar windows.
 *
 * Manages scroll state, lift (thumb) positioning, increment/decrement
 * buttons, and binding to a scrollable target window.
 *
 * The wheel path follows the primary tree, where it runs through a
 * `SmoothScroller` instead of the fixed +/- `_scrollStep` jump the older
 * `win63_version` build (and this port, until now) used.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::ScrollBarController()
export class ScrollBarController extends InteractiveController implements IScrollbarWindow
{
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::SCROLL_BUTTON_INCREMENT
    private static readonly SCROLL_BUTTON_INCREMENT: string = 'increment';
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::SCROLL_BUTTON_DECREMENT
    private static readonly SCROLL_BUTTON_DECREMENT: string = 'decrement';
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::SCROLL_SLIDER_TRACK
    private static readonly SCROLL_SLIDER_TRACK: string = 'slider_track';
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::SCROLL_SLIDER_BAR
    private static readonly SCROLL_SLIDER_BAR: string = 'slider_bar';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::SCROLL_STEP_SIZE
    private static readonly SCROLL_STEP_SIZE: number = 15;

    /**
	 * The bare `25` AS3 divides by `_scrollStep` in getSmoothScrollAxisSize().
	 * Named here because it is a literal there, not a declared constant.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::getSmoothScrollAxisSize()
    private static readonly SMOOTH_SCROLL_AXIS_UNIT: number = 25;

    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::_offset
    protected _offset: number = 0;
    /**
     * Pixels an arrow-button click scrolls, and the overlap a track click leaves behind.
     *
     * AS3 spells this as a bare `15` at all six call sites; it has no named constant in any tree,
     * so the name is DERIVED. It used to read `_scrollable.scrollStepH/V` here, which is a member
     * of the superseded `win63_version` build - the 2026 build has neither the member nor the
     * `scroll_step_h`/`scroll_step_v` layout property that fed it, and no shipped layout declares
     * one. That default was 25, so every arrow click moved two thirds further than the real client.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::ScrollBarController()
    // The 15 is the last argument of the `new SmoothScroller(...)` call there;
    // AS3 gives it no name of its own, hence the derived constant.
    public static readonly SCROLL_BUTTON_STEP: number = 15;

    protected _scrollStep: number = 0.1;
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::_targetName
    private _targetName: string | null = null;
    private _isUpdatingLift: boolean = false;
    private _initialized: boolean = false;
    // Derived name: the field is obfuscated as `_SafeStr_5488` in the primary
    // tree and recovered in none; its type, SmoothScroller, is readable.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::_SafeStr_5488
    private _smoothScroller: SmoothScroller | null = null;
    private _boundScrollButtonEventProc: ((event: WindowEvent, window: IWindow) => void);
    private _boundOnScrollableResized: ((event: WindowEvent) => void);
    private _boundOnScrollableScrolled: ((event: WindowEvent) => void);

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::ScrollBarController()
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
        super(name, type, style, param, context, rect, parent, procedure, tags, null, id);

        this._hasVisualContent = false;
        this._horizontal = (type === 130);

        this._boundScrollButtonEventProc = this.scrollButtonEventProc.bind(this);
        this._boundOnScrollableResized = this.onScrollableResized.bind(this);
        this._boundOnScrollableScrolled = this.onScrollableScrolled.bind(this);

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::ScrollBarController()
        this._smoothScroller = new SmoothScroller(
            this.getScrollOffset.bind(this),
            this.setSmoothScrollOffset.bind(this),
            this.getSmoothScrollAxisSize.bind(this),
            200, 60, true, null, ScrollBarController.SCROLL_STEP_SIZE
        );

        this._initialized = true;

        if(properties !== null)
        {
            this.properties = properties;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::ScrollBarController()
    // groupChildrenWithTag()/updateLiftSizeAndPosition() read the increment/decrement/
    // track/lift children built by buildLayoutChildren(), which only runs later via
    // completeConstruction() (see WindowController.ts's phase-split) - at constructor
    // time no children exist yet, so this can't run there anymore.
    protected override finalize(): void
    {
        super.finalize();

        const internals: IWindow[] = [];

        this.groupChildrenWithTag('_INTERNAL', internals, -1);

        for(const child of internals)
        {
            child.procedure = this._boundScrollButtonEventProc;
        }

        this.updateLiftSizeAndPosition();
    }

    protected _scrollable: IScrollableWindow | null = null;

    /**
	 * Gets the scrollable target window.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::get scrollable()
    public get scrollable(): IScrollableWindow | null
    {
        return this._scrollable;
    }

    /**
	 * Sets the scrollable target window. Binds resize/scroll event listeners.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::set scrollable()
    public set scrollable(value: IScrollableWindow | null)
    {
        if(this._scrollable !== null && !this._scrollable.disposed)
        {
            (this._scrollable as unknown as IWindow).removeEventListener(WindowEvent.WE_RESIZED, this._boundOnScrollableResized);
            (this._scrollable as unknown as IWindow).removeEventListener(WindowEvent.WE_SCROLL, this._boundOnScrollableScrolled);
        }

        this._scrollable = value;

        if(this._scrollable !== null && !this._scrollable.disposed)
        {
            (this._scrollable as unknown as IWindow).addEventListener(WindowEvent.WE_RESIZED, this._boundOnScrollableResized);
            (this._scrollable as unknown as IWindow).addEventListener(WindowEvent.WE_SCROLL, this._boundOnScrollableScrolled);

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::set scrollable()
            // Adopt the target's current position, otherwise _offset stays at 0 while the
            // list is scrolled - and _offset is where the smooth scroller starts from.
            this.setScrollPosition(this.horizontal ? this._scrollable.scrollH : this._scrollable.scrollV, false);

            this.updateLiftSizeAndPosition();
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/ScrollBarController.as::_horizontal
    private _horizontal: boolean | null = null;

    /**
	 * Gets whether this scrollbar is horizontal.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::get horizontal()
    public get horizontal(): boolean
    {
        return this._horizontal ?? (this.type === 130);
    }

    /**
	 * Gets whether this scrollbar is vertical.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::get vertical()
    public get vertical(): boolean
    {
        return !this.horizontal;
    }

    /**
	 * Gets the horizontal scroll position (0..1).
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::get scrollH()
    public get scrollH(): number
    {
        return this.horizontal ? this._offset : 0;
    }

    /**
	 * Sets the horizontal scroll position.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::set scrollH()
    public set scrollH(value: number)
    {
        if(this.horizontal)
        {
            if(this.setScrollPosition(value, true))
            {
                this.updateLiftSizeAndPosition();
            }
        }
    }

    /**
	 * Gets the vertical scroll position (0..1).
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::get scrollV()
    public get scrollV(): number
    {
        return this.horizontal ? 0 : this._offset;
    }

    /**
	 * Sets the vertical scroll position.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::set scrollV()
    public set scrollV(value: number)
    {
        if(this.vertical)
        {
            if(this.setScrollPosition(value, true))
            {
                this.updateLiftSizeAndPosition();
            }
        }
    }

    public override get properties(): unknown[]
    {
        const props = super.properties;
        let targetStr: string | null = null;

        if(this._scrollable !== null)
        {
            targetStr = (this._scrollable as unknown as IWindow).name;
        }
        else if(this._targetName !== null)
        {
            targetStr = this._targetName;
        }

        if(targetStr === null)
        {
            props.push(this.getDefaultProperty('scrollable'));
        }
        else
        {
            props.push(this.createProperty('scrollable', targetStr));
        }

        return props;
    }

    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'scrollable':
                    this._targetName = prop.value as string;
                    this._scrollable = null;
                    break;
            }
        }

        super.properties = value;
    }

    /**
	 * Gets the track child window.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::get track()
    protected get track(): WindowController | null
    {
        return this.findChildByName(ScrollBarController.SCROLL_SLIDER_TRACK) as WindowController | null;
    }

    /**
	 * Gets the lift (thumb) child window inside the track.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::get lift()
    protected get lift(): WindowController | null
    {
        const trackWindow = this.track;

        if(!trackWindow) return null;

        return trackWindow.findChildByName(ScrollBarController.SCROLL_SLIDER_BAR) as WindowController | null;
    }

    /**
	 * Enables the scrollbar and all _INTERNAL children.
	 */
    public override enable(): boolean
    {
        if(super.enable())
        {
            const internals: IWindow[] = [];

            this.groupChildrenWithTag('_INTERNAL', internals, -1);

            for(let i = 0; i < internals.length; i++)
            {
                internals[i].enable();
            }

            return true;
        }

        return false;
    }

    /**
	 * Disables the scrollbar and all _INTERNAL children.
	 */
    public override disable(): boolean
    {
        if(super.disable())
        {
            const internals: IWindow[] = [];

            this.groupChildrenWithTag('_INTERNAL', internals, -1);

            for(let i = 0; i < internals.length; i++)
            {
                internals[i].disable();
            }

            return true;
        }

        return false;
    }

    /**
	 * Handles slider bar relocation, resize, wheel events, and parent add.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::update()
    public override update(source: WindowController, event: WindowEvent): boolean
    {
        if(!this._initialized)
        {
            return super.update(source, event);
        }

        if(source.name === ScrollBarController.SCROLL_SLIDER_BAR)
        {
            if(event.type === 'WE_CHILD_RELOCATED')
            {
                if(!this._isUpdatingLift)
                {
                    const liftCtrl = source as unknown as ScrollBarLiftController;

                    if(this.horizontal)
                    {
                        this.setScrollPosition(liftCtrl.scrollbarOffsetX, true);
                    }
                    else
                    {
                        this.setScrollPosition(liftCtrl.scrollbarOffsetY, true);
                    }
                }
            }
        }

        const result = super.update(source, event);

        if(event.type === 'WE_PARENT_ADDED')
        {
            if(this._scrollable === null)
            {
                this.resolveScrollTarget();
            }
        }

        if(source === (this as unknown as WindowController))
        {
            if(event.type === 'WE_RESIZED')
            {
                this.updateLiftSizeAndPosition();
            }
            else if(event.type === 'WME_WHEEL')
            {
                this.scrollWithWheel((event as WindowMouseEvent).delta);

                return true;
            }
        }

        return result;
    }

    public override dispose(): void
    {
        if(this._disposed) return;

        this.scrollable = null;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::dispose()
        if(this._smoothScroller)
        {
            this._smoothScroller.dispose();
            this._smoothScroller = null;
        }

        super.dispose();
    }

    /**
	 * Sets the scroll position and optionally syncs to the scrollable target.
	 *
	 * `fromSmoothScroller` marks the calls the smooth scroller makes itself, so
	 * its own animation steps don't get fed back into `adjustStartPosition()`.
	 *
	 * @returns Whether the position actually changed
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::setScrollPosition()
    protected setScrollPosition(value: number, syncTarget: boolean, fromSmoothScroller: boolean = false): boolean
    {
        if(this._scrollable === null || this._scrollable.disposed)
        {
            if(!this.resolveScrollTarget()) return false;
        }

        if(value < 0) value = 0;
        if(value > 1) value = 1;

        const diff = value - this._offset;

        this._offset = value;

        let changed = false;

        if(syncTarget)
        {
            if(this.horizontal)
            {
                changed = this._scrollable!.scrollH !== this._offset;

                if(changed)
                {
                    this._scrollable!.scrollH = this._offset;
                }
            }
            else
            {
                changed = this._scrollable!.scrollV !== this._offset;

                if(changed)
                {
                    this._scrollable!.scrollV = this._offset;
                }
            }
        }

        // Optional chaining, not a null check: the scrollable setter can run from the
        // base constructor, before this class's field initializers have run at all.
        if(!fromSmoothScroller && this._smoothScroller?.isScrolling)
        {
            this._smoothScroller.adjustStartPosition(diff);
        }

        return changed;
    }

    /**
	 * Scrolls by a wheel delta through the smooth scroller.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::scrollWithWheel()
    private scrollWithWheel(delta: number): boolean
    {
        return this._smoothScroller?.scrollWithWheel(delta) ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::getScrollOffset()
    private getScrollOffset(): number
    {
        return this._offset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::setSmoothScrollOffset()
    private setSmoothScrollOffset(value: number): void
    {
        if(this.setScrollPosition(value, true, true))
        {
            this.updateLiftSizeAndPosition();
        }
    }

    /**
	 * The virtual axis length the smooth scroller normalizes its 0..1 offset
	 * against.
	 *
	 * AS3 spells this `25 / _scrollStep` with a bare 25, even though the
	 * scroller here is constructed with a step of `SCROLL_STEP_SIZE` (15) - so
	 * one wheel line moves 15 / (25 / 0.1) = 0.06 of the offset, not
	 * `_scrollStep`. The literal is kept as-is rather than "corrected".
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::getSmoothScrollAxisSize()
    private getSmoothScrollAxisSize(): number
    {
        return ScrollBarController.SMOOTH_SCROLL_AXIS_UNIT / this._scrollStep;
    }

    /**
	 * Updates the lift (thumb) size and position based on the scrollable region.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::updateLiftSizeAndPosition()
    private updateLiftSizeAndPosition(): void
    {
        let scrollable = this._scrollable ?? null;

        if(scrollable === null || scrollable.disposed)
        {
            if(this._disposed || !this.resolveScrollTarget()) return;

            scrollable = this._scrollable ?? null;

            if(scrollable === null) return;
        }

        const trackWindow = this.track;
        const liftWindow = this.lift;

        if(!trackWindow || !liftWindow) return;

        this._isUpdatingLift = true;

        let ratio: number;

        if(this.horizontal)
        {
            ratio = scrollable.visibleRegion.width / Math.max(1, scrollable.scrollableRegion.width);

            if(ratio > 1) ratio = 1;

            const liftWidth = ratio * trackWindow.width;

            liftWindow.width = liftWidth;
            liftWindow.x = Math.round(scrollable.scrollH * (trackWindow.width - liftWidth));
        }
        else
        {
            ratio = scrollable.visibleRegion.height / Math.max(1, scrollable.scrollableRegion.height);

            if(ratio > 1) ratio = 1;

            const liftHeight = ratio * trackWindow.height;

            liftWindow.height = liftHeight;
            liftWindow.y = Math.round(scrollable.scrollV * (trackWindow.height - liftWindow.height));
        }

        this._isUpdatingLift = false;

        if(ratio === 1)
        {
            this.disable();
        }
        else
        {
            this.enable();
        }
    }

    /**
	 * Handles scroll button events for increment, decrement, and track click.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::scrollButtonEventProc()
    private scrollButtonEventProc(event: WindowEvent, window: IWindow): void
    {
        let updateLift = false;

        if(event.type === 'WME_DOWN')
        {
            if(window.name === ScrollBarController.SCROLL_BUTTON_INCREMENT)
            {
                if(this._scrollable)
                {
                    this._isUpdatingLift = true;

                    if(this.horizontal)
                    {
                        this.scrollH += ScrollBarController.SCROLL_BUTTON_STEP / Math.max(1, this._scrollable.maxScrollH);
                    }
                    else
                    {
                        this.scrollV += ScrollBarController.SCROLL_BUTTON_STEP / Math.max(1, this._scrollable.maxScrollV);
                    }

                    this._isUpdatingLift = false;
                }
            }
            else if(window.name === ScrollBarController.SCROLL_BUTTON_DECREMENT)
            {
                if(this._scrollable)
                {
                    this._isUpdatingLift = true;

                    if(this.horizontal)
                    {
                        this.scrollH -= ScrollBarController.SCROLL_BUTTON_STEP / Math.max(1, this._scrollable.maxScrollH);
                    }
                    else
                    {
                        this.scrollV -= ScrollBarController.SCROLL_BUTTON_STEP / Math.max(1, this._scrollable.maxScrollV);
                    }

                    this._isUpdatingLift = false;
                }
            }
            else if(window.name === ScrollBarController.SCROLL_SLIDER_TRACK)
            {
                const mouseEvent = event as WindowMouseEvent;
                const localX = mouseEvent.localX | 0;
                const localY = mouseEvent.localY | 0;
                const bar = (window as WindowController).getChildByName(ScrollBarController.SCROLL_SLIDER_BAR);

                if(bar && this._scrollable)
                {
                    if(this.horizontal)
                    {
                        if(localX < bar.x)
                        {
                            this.scrollH -= (this._scrollable.visibleRegion.width - ScrollBarController.SCROLL_BUTTON_STEP) / Math.max(1, this._scrollable.maxScrollH);
                        }
                        else if(localX > bar.right)
                        {
                            this.scrollH += (this._scrollable.visibleRegion.width - ScrollBarController.SCROLL_BUTTON_STEP) / Math.max(1, this._scrollable.maxScrollH);
                        }
                    }
                    else
                    {
                        if(localY < bar.y)
                        {
                            this.scrollV -= (this._scrollable.visibleRegion.height - ScrollBarController.SCROLL_BUTTON_STEP) / Math.max(1, this._scrollable.maxScrollV);
                        }
                        else if(localY > bar.bottom)
                        {
                            this.scrollV += (this._scrollable.visibleRegion.height - ScrollBarController.SCROLL_BUTTON_STEP) / Math.max(1, this._scrollable.maxScrollV);
                        }
                    }

                    updateLift = true;
                }
            }
        }

        if(event.type === 'WME_WHEEL')
        {
            this.scrollWithWheel((event as WindowMouseEvent).delta);

            updateLift = true;
        }

        if(updateLift)
        {
            this.updateLiftSizeAndPosition();
        }
    }

    /**
	 * Whether the parent is a container this may sweep for a scroll target.
	 *
	 * AS3 writes this inline, twice, as `_parent is IWindowContainer && !(_parent is
	 * IDesktopWindow)`. TypeScript erases interfaces, so the port duck-typed the first half as
	 * "has findChildByName" / "has numChildren" - which every `WindowController` satisfies,
	 * `SubstituteParentController` included, and that one is a bare `WindowController` in AS3
	 * too, so the AS3 guard rejects it where this port accepted it.
	 *
	 * That is the whole bug: a scrollbar carries USE_PARENT_GRAPHIC_CONTEXT, so
	 * `WindowContext.createWindow()` parks it on the context's substitute parent before its real
	 * one exists. The park fires WE_PARENT_ADDED, this resolves *there*, sweeps whatever other
	 * in-flight windows happen to be parked alongside it, and binds to a stranger's list -
	 * permanently, because `resolveScrollTarget()` returns early once `_scrollable` is set. In
	 * the floor plan editor all four bars ended up on an unnamed `ItemListController` under
	 * `_CONTEXT_SUBSTITUTE_PARENT`, which does not overflow: full-length lift, then `disable()`.
	 * It reproduces only with other windows already parked, which is why an empty harness
	 * resolved correctly.
	 *
	 * The desktop half is duck-typed on `getActiveWindow`, the one member `IDesktopWindow` adds
	 * that nothing else has - importing `DesktopController` here would close the cycle
	 * ScrollBarController -> DesktopController -> WindowContext -> Classes -> ScrollBarController.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollBarController.as::resolveScrollTarget()
    private isSweepableParent(parent: IWindow | null): boolean
    {
        if(parent === null) return false;
        if(parent instanceof SubstituteParentController) return false;

        return typeof (parent as unknown as IDesktopWindow).getActiveWindow !== 'function';
    }

    /**
	 * Attempts to resolve the scroll target from the parent hierarchy.
	 *
	 * Searches by name first, then checks if parent is scrollable,
	 * then checks parent's siblings.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::resolveScrollTarget()
    private resolveScrollTarget(): boolean
    {
        if(this._scrollable !== null)
        {
            if(!this._scrollable.disposed)
            {
                return true;
            }
        }

        if(this._targetName !== null)
        {
            const found = this.findParentByName(this._targetName) as unknown as IScrollableWindow | null;

            if(found === null && this.isSweepableParent(this._parent))
            {
                const container = this._parent as unknown as IWindowContainer;

                const sibling = container.findChildByName(this._targetName) as unknown as IScrollableWindow | null;

                if(sibling)
                {
                    this.scrollable = sibling;
                    return true;
                }
            }
        }

        if(this._parent !== null && 'scrollH' in this._parent && 'scrollV' in this._parent)
        {
            this.scrollable = this._parent as unknown as IScrollableWindow;
            return true;
        }

        if(this.isSweepableParent(this._parent))
        {
            const container = this._parent as unknown as IWindowContainer;

            for(let i = 0; i < container.numChildren; i++)
            {
                const child = container.getChildAt(i);

                if(child && 'scrollH' in child && 'scrollV' in child && 'visibleRegion' in child)
                {
                    this.scrollable = child as unknown as IScrollableWindow;
                    return true;
                }
            }
        }

        return false;
    }

    /**
	 * Called when the scrollable target resizes.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::onScrollableResized()
    private onScrollableResized(_event: WindowEvent): void
    {
        this.updateLiftSizeAndPosition();
        this.setScrollPosition(this._offset, false);
    }

    /**
	 * Called when the scrollable target scrolls.
	 */
    // AS3: .../src/com/sulake/core/window/components/ScrollBarController.as::onScrollableScrolled()
    private onScrollableScrolled(_event: WindowEvent): void
    {
        // Adopt the target's position first, exactly as AS3 does. Without it `_offset` keeps
        // whatever the scrollbar last wrote while the target scrolls itself - a list that
        // re-normalises its own 0..1 position when its content resizes does that on every
        // WE_SCROLL - and every later increment/decrement/track click then computes from a stale
        // base, so the first one jumps the content instead of nudging it.
        this.setScrollPosition(this.horizontal ? this._scrollable!.scrollH : this._scrollable!.scrollV, false);

        this.updateLiftSizeAndPosition();
    }
}
