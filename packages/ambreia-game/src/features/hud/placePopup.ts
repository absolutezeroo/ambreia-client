import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';

/** Above the anchor, or below it when there is no room above (the + button sits at the top). */
export function placeAbove(popup: IWindow, anchor: IWindow, desktop: IWindow, alignRight = false): void
{
    const rect = {x: 0, y: 0, width: 0, height: 0};

    anchor.getGlobalRectangle(rect);
    popup.x = Math.max(0, Math.min(desktop.width - popup.width, alignRight ? rect.x + rect.width - popup.width : rect.x));

    const above = rect.y - popup.height - 4;

    popup.y = above >= 0 ? above : Math.min(desktop.height - popup.height, rect.y + rect.height + 4);
}

/** A titled panel (emoticons, settings) on `layer`, above its button and right-aligned on it. */
export function buildPopup(windows: IHabboWindowManager, layout: string, layer: number, anchor: IWindow): IWindowContainer | null
{
    const panel = windows.buildWidgetLayout(layout, layer) as IWindowContainer | null;
    const desktop = windows.getDesktop(layer) as IWindowContainer | null;

    if(!panel || !desktop)
    {
        panel?.destroy();

        return null;
    }

    placeAbove(panel, anchor, desktop, true);
    desktop.addChild(panel);

    return panel;
}
