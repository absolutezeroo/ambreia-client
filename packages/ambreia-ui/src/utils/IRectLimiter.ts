/**
 * Interface for rectangle size limits.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IRectLimiter.as
 */
export interface IRectLimiter
{
    // AS3: .../src/com/sulake/core/window/utils/IRectLimiter.as::get minWidth()
    minWidth: number;
    // AS3: .../src/com/sulake/core/window/utils/IRectLimiter.as::get maxWidth()
    maxWidth: number;
    // AS3: .../src/com/sulake/core/window/utils/IRectLimiter.as::get minHeight()
    minHeight: number;
    // AS3: .../src/com/sulake/core/window/utils/IRectLimiter.as::get maxHeight()
    maxHeight: number;

    /**
	 * True while all four bounds are still at their int extremes — no limit has been set, so
	 * `limit()` has nothing to enforce.
	 */
    // AS3: .../src/com/sulake/core/window/utils/IRectLimiter.as::get isEmpty()
    readonly isEmpty: boolean;

    // AS3: .../src/com/sulake/core/window/utils/IRectLimiter.as::setEmpty()
    setEmpty(): void;

    /**
	 * Clamps the owning window's width and height into the four bounds. A no-op while `isEmpty`.
	 */
    // AS3: .../src/com/sulake/core/window/utils/IRectLimiter.as::limit()
    limit(): void;

    // TS-only: AS3 sets the four bounds one accessor at a time; kept as one call for the callers
    // that assign all four together.
    assign(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void;

    // TS-only: no AS3 counterpart on the interface — `WindowRectLimits` is copied by construction
    // there, and this port's window cloning needs it through the interface.
    clone(owner?: unknown): IRectLimiter;
}
