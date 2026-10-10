import {Logger} from '@ambreia/common/utils/Logger';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';

const log = Logger.getLogger('habbo.ui.kit.buildFrame');

/** The HUD's layer (HudPanelsView.LAYER): the feature windows open over it. */
export const LAYER = 1;

/** Builds a frame layout on the desktop, centred, its events to `procedure`; null if it does not build. */
export function buildFrame(windows: IHabboWindowManager, layout: string, procedure: (event: WindowEvent, window: IWindow) => void): IWindowContainer | null
{
    const desktop = windows.getDesktop(LAYER) as IWindowContainer | null;
    const window = windows.buildWidgetLayout(layout, LAYER) as IWindowContainer | null;

    if(!window || !desktop)
    {
        log.error(`${layout} did not build — the window will not open`);
        window?.destroy();

        return null;
    }

    desktop.addChild(window);
    window.procedure = procedure;
    window.x = Math.round((desktop.width - window.width) / 2);
    window.y = Math.max(0, Math.round((desktop.height - window.height) / 2));

    return window;
}
