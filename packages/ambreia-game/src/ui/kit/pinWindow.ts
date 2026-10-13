import type {IWindow} from '@ambreia/ui/IWindow';
import {WindowParam} from '@ambreia/ui/enum/WindowParam';

/**
 * The window stays where the screen put it: its title bar no longer drags it. A frame layout is a
 * dragging target (params 0x8000) wherever it is used; the login and characters screens are pages,
 * not windows to move about.
 */
export function pinWindow(window: IWindow): void
{
    window.setParamFlag(WindowParam.MOUSE_DRAGGING_TARGET, false);
}
