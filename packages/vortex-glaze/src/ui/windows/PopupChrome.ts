import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';

/** The close button every themed frame header builds, by name. */
const HEADER_BUTTON_CLOSE = 'header_button_close';

/** Breathing room kept between a clamped popup and the canvas edges. */
const POPUP_MARGIN = 40;

/**
 * Shared behaviour for the editor's layer-3 popups (Image Gallery, Widgets,
 * Colour).
 */

/**
 * Wires a frame's title-bar close button.
 *
 * A frame does **not** emit `WE_CLOSE`/`WE_CLOSED` — only the drop-menu
 * controller does. Its header builds an ordinary `closebutton` named
 * `header_button_close`, and the click bubbles to the frame's procedure with that
 * button as the originating window, which is exactly how the ported client's own
 * windows detect it (`InventoryMainView.onWindowEvent`).
 */
export function closesOnHeaderButton(frame: IWindow | null, onClose: () => void): void
{
    if(!frame || frame.disposed)
    {
        return;
    }

    (frame as unknown as WindowController).procedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === WindowMouseEvent.CLICK && window?.name === HEADER_BUTTON_CLOSE)
        {
            onClose();
        }
    };
}

/**
 * Shrinks a popup that would not fit the canvas, keeping its content window (the
 * scrollable list) in step, then re-centres it. Popups are authored at a fixed
 * size; on a short window an unclamped one would run off the bottom, taking its
 * close button with it.
 */
export function fitPopupToDesktop(frame: IWindow | null, desktop: IWindow | null, content: IWindow | null): void
{
    if(!frame || frame.disposed || !desktop)
    {
        return;
    }

    const controller = frame as unknown as WindowController;
    const width = Math.max(200, Math.min(controller.width, desktop.width - POPUP_MARGIN));
    const height = Math.max(160, Math.min(controller.height, desktop.height - POPUP_MARGIN));
    const deltaWidth = width - controller.width;
    const deltaHeight = height - controller.height;

    if(deltaWidth === 0 && deltaHeight === 0)
    {
        controller.center();

        return;
    }

    controller.rectangle = {x: controller.x, y: controller.y, width, height};

    if(content && !content.disposed)
    {
        const inner = content as unknown as WindowController;

        inner.rectangle = {
            x: inner.x,
            y: inner.y,
            width: Math.max(80, inner.width + deltaWidth),
            height: Math.max(80, inner.height + deltaHeight)
        };
    }

    controller.center();
}
