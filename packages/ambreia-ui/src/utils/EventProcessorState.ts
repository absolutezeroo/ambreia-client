import type {IWindow} from '../IWindow';
import type {IWindowRenderer} from '../graphics/IWindowRenderer';
import type {IInputEventTracker} from '../IInputEventTracker';

/**
 * Holds state for event processing across the mouse event pipeline.
 *
 * Passed to the MouseEventProcessor to provide context about the desktop,
 * current hover target, last click target, renderer, and event trackers.
 * Updated in place as events are processed.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/EventProcessorState.as
 */
export class EventProcessorState
{
    /**
	 * The window renderer.
	 */
    // AS3: .../src/com/sulake/core/window/utils/EventProcessorState.as::renderer
    public renderer: IWindowRenderer | null;

    /**
	 * The desktop window.
	 */
    // AS3: .../src/com/sulake/core/window/utils/EventProcessorState.as::desktop
    public desktop: IWindow | null;

    /**
	 * The currently hovered window.
	 */
    public hovered: IWindow | null;

    /**
	 * The last window that received a mouseDown.
	 */
    // AS3: .../src/com/sulake/core/window/utils/EventProcessorState.as::lastClickTarget
    public lastClickTarget: IWindow | null;

    /**
	 * The window that received the most recent mouseDown event.
	 */
    // AS3: .../src/com/sulake/core/window/utils/EventProcessorState.as::lastMouseDownTarget
    public lastMouseDownTarget: IWindow | null;

    /**
	 * The current click-away target.
	 */
    public lastClickAwayTarget: IWindow | null;

    /**
	 * Active input event trackers.
	 */
    // AS3: .../src/com/sulake/core/window/utils/EventProcessorState.as::eventTrackers
    public eventTrackers: IInputEventTracker[];

    constructor(
        renderer: IWindowRenderer | null,
        desktop: IWindow | null,
        hovered: IWindow | null,
        lastClickTarget: IWindow | null,
        lastMouseDownTarget: IWindow | null,
        lastClickAwayTarget: IWindow | null,
        eventTrackers: IInputEventTracker[]
    )
    {
        this.renderer = renderer;
        this.desktop = desktop;
        this.hovered = hovered;
        this.lastClickTarget = lastClickTarget;
        this.lastMouseDownTarget = lastMouseDownTarget;
        this.lastClickAwayTarget = lastClickAwayTarget;
        this.eventTrackers = eventTrackers;
    }
}
