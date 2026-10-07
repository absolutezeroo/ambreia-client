/**
 * Converts a DOM `WheelEvent` into the delta value the ported window system
 * expects on `WindowMouseEvent.delta`.
 *
 * This has no AS3 counterpart, because AS3 never needed one: Flash handed
 * `MouseEvent.delta` over already expressed in *lines* — 3 per wheel notch on
 * Windows, the OS setting — and every consumer here is built on that unit.
 * `SmoothScroller` multiplies a line by `DEFAULT_SCROLL_STEP` (25px) for lists,
 * and `ScrollBarController` maps one to 0.06 of its 0..1 offset.
 *
 * The DOM reports something else entirely: `deltaY` in pixels (~100 per notch,
 * `deltaMode` 0), lines (`deltaMode` 1) or pages (`deltaMode` 2). Feeding the
 * pixel value in unconverted made one notch worth 100 *lines* = 2500px of
 * scroll intent, which on any normal list overshoots `maxScrollV` several times
 * over and clamps the position to 0 or 1 — the "it only jumps fully to the top
 * or fully to the bottom, never anywhere in between" behaviour.
 *
 * A pixel delta is therefore rescaled so that a standard 100px notch is worth
 * a whole number of Flash lines. Trackpads, which emit a stream of small pixel
 * deltas instead of discrete notches, come out proportionally small and scroll
 * smoothly.
 *
 * `LINES_PER_NOTCH` is the one number here that is a *choice* rather than a
 * conversion, and it is deliberately 1 rather than the 3 Windows reported to
 * Flash. Every consumer of this unit scales it by a fixed pixel step and then
 * divides by the scrollable overflow, so the fraction of the range a notch
 * covers grows as the content gets shorter: at 3 lines, one notch moves 25% of
 * a short grid (a chat-bubble chooser, a badge colour palette) and 47% of a
 * very short one, which is unusable for picking a specific row even though the
 * animation between the two positions is perfectly smooth. At 1 line the same
 * grids move ~8% per notch and long ones stay comfortable. Nothing downstream
 * was changed to get this - the rest of the wheel path is faithful to AS3.
 *
 * Flash's sign convention is the opposite of the DOM's — `delta > 0` means
 * scrolling *up* — so the result is negated.
 */
export class NativeWheelDelta
{
    // No `AS3:` traces below, and no port-gap marker either: nothing here was ported and
    // nothing is left to port, so either marker would be a lie. The traceability hook
    // flags every member of this class - that is expected, not an oversight.

    /** Flash line units one wheel notch is worth. See the class note - Flash's own value was 3. */
    public static readonly LINES_PER_NOTCH: number = 1;

    /** Pixels per wheel notch, as browsers report them in `deltaMode` 0. */
    public static readonly PIXELS_PER_NOTCH: number = 100;

    /** Lines per page, for the rarely-used `deltaMode` 2 (page) reporting. */
    public static readonly LINES_PER_PAGE: number = 16;

    private static readonly DOM_DELTA_LINE: number = 1;
    private static readonly DOM_DELTA_PAGE: number = 2;

    /**
     * Converts the vertical delta of a native wheel event to Flash line units.
     */
    public static fromWheelEvent(event: WheelEvent): number
    {
        return NativeWheelDelta.convert(event.deltaY, event.deltaMode);
    }

    /**
     * Converts the horizontal delta of a native wheel event to Flash line units.
     *
     * Flash raised a separate `mouseWheelHorizontal` stage event carrying its own
     * `delta`; the DOM folds both axes into one `wheel` event, so the axis has to be
     * picked here. `ItemListController.getScrollWheelDelta()` negates the delta again
     * for `WME_WHEEL_HORIZONTAL`, so the shared sign flip in `convert()` is undone
     * there - matching AS3, where both axes arrived with Flash's own convention.
     */
    public static horizontalFromWheelEvent(event: WheelEvent): number
    {
        return NativeWheelDelta.convert(event.deltaX, event.deltaMode);
    }

    /**
     * Whether a native wheel event should be treated as a horizontal one.
     *
     * A trackpad emits both axes at once; the dominant one wins, matching how Flash
     * only ever raised one of the two events for a given physical gesture.
     */
    public static isHorizontal(event: WheelEvent): boolean
    {
        return Math.abs(event.deltaX) > Math.abs(event.deltaY);
    }

    /**
     * Converts a raw `deltaY`/`deltaMode` pair to Flash line units.
     */
    public static convert(deltaY: number, deltaMode: number): number
    {
        if(!Number.isFinite(deltaY) || deltaY === 0)
        {
            return 0;
        }

        let lines: number;

        switch(deltaMode)
        {
            case NativeWheelDelta.DOM_DELTA_LINE:
                lines = deltaY;
                break;
            case NativeWheelDelta.DOM_DELTA_PAGE:
                lines = deltaY * NativeWheelDelta.LINES_PER_PAGE;
                break;
            default:
                lines = (deltaY / NativeWheelDelta.PIXELS_PER_NOTCH) * NativeWheelDelta.LINES_PER_NOTCH;
                break;
        }

        return -lines;
    }
}