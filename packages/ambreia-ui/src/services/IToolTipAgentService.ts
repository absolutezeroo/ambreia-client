import type {IWindow} from '../IWindow';

/**
 * The tooltip agent: one per window context, driven entirely by
 * `InteractiveController.processInteractiveWindowEvents()`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/IToolTipAgentService.as
 */
export interface IToolTipAgentService
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/IToolTipAgentService.as::dispose()
    dispose(): void;

    /**
	 * Starts the hover timer for `window`, returning whichever window the agent was tracking
	 * before. AS3's second argument is the mouse-operator flags, defaulted to 0 at every call site.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/IToolTipAgentService.as::begin()
    begin(window: IWindow, flags?: number): IWindow | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/IToolTipAgentService.as::end()
    end(window: IWindow): IWindow | null;

    /**
	 * Re-reads the caption of a window whose tooltip text changes as the pointer moves over it
	 * (`toolTipIsDynamic`), and rewrites the open tooltip if it differs.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/IToolTipAgentService.as::updateCaption()
    updateCaption(window: IWindow): void;

    /**
     * Moves an open tooltip to follow the pointer.
     *
     * AS3's interface has four members and this is not one of them, because AS3 never needs to
     * reach it: `WindowMouseOperator.begin()` subscribes the operator to the stage's `enterFrame`,
     * and `handler()`'s enterFrame branch polls the pointer and calls `operate()` on its own. The
     * port has no Flash frame event, so the per-frame poll has to come from `WindowContext.update()`
     * — and it needs this on the interface to get there.
     *
     * Inherited from `WindowMouseOperator`; `WindowToolTipAgent` adds no implementation of its own.
     */
    // TS-only: AS3 reaches the same code through an `enterFrame` subscription, not the interface.
    handleMouseMove(x: number, y: number): void;
}
