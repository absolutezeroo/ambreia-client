import type {WindowContextResizeHost} from '../WindowContext';

/** What the host hands a WindowManager: the few things the window system cannot know itself. */
export interface IWindowManagerOptions
{
    /** Resolves `${key}` configuration references in layout texts (the engine: its configuration). */
    interpolate(text: string): string;
    /** The area the desktops follow; the browser window when absent. */
    resizeHost?: WindowContextResizeHost;
}
