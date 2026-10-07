import type {IWindow} from '../IWindow';

/**
 * Mouse listener service interface.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/IMouseListenerService.as
 */
export interface IMouseListenerService
{
    // AS3: .../src/com/sulake/core/window/services/IMouseListenerService.as::get eventTypes()
    readonly eventTypes: string[];
    // AS3: .../src/com/sulake/core/window/services/IMouseListenerService.as::get areaLimit()
    areaLimit: number;

    // AS3: .../src/com/sulake/core/window/services/IMouseListenerService.as::dispose()
    dispose(): void;

    /**
	 * All three mouse services share `WindowMouseOperator`'s contract: `begin()` takes the operator
	 * flags (0 at every call site but the scaler's) and returns whichever window was being tracked
	 * before, which is how the operator hands one drag off to the next. The implementations here
	 * have always returned it; only these interfaces said `void`.
	 */
    // AS3: .../src/com/sulake/core/window/services/IMouseListenerService.as::begin()
    begin(window: IWindow, flags?: number): IWindow | null;

    // AS3: .../src/com/sulake/core/window/services/IMouseListenerService.as::end()
    end(window: IWindow): IWindow | null;
}
