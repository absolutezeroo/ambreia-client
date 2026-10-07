import type {IWindow} from '@ambreia/ui/IWindow';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {AlertDialogCallback, IAlertDialog} from './AlertDialog';
import {AlertDialog} from './AlertDialog';

/**
 * Interface for confirm dialogs.
 *
 * In AS3 this was the obfuscated `class_3441` / `IConfirmDialog` which
 * extended `class_3348` (IAlertDialog) with no additional members.
 * The behavioral difference is that ConfirmDialog never self-disposes
 * on button click -- it always delegates to the callback.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ConfirmDialog.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ConfirmDialog.as
 */
export type IConfirmDialog = IAlertDialog;

/**
 * Confirm dialog with OK and Cancel buttons.
 *
 * Extends {@link AlertDialog} with a stricter event handling policy:
 * button clicks always invoke the callback (never self-dispose).
 * This ensures the caller retains control of the dialog lifecycle.
 *
 * In AS3, ConfirmDialog overrode `dialogEventProc` to remove the
 * auto-dispose fallback that AlertDialog has when no callback is set.
 *
 * @see sources/win63_version/habbo/window/utils/ConfirmDialog.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ConfirmDialog.as
 */
export class ConfirmDialog extends AlertDialog 
{
    /**
     * Creates a new confirm dialog.
     *
     * @param windowManager - The Habbo window manager
     * @param xml - The XML layout definition
     * @param title - Dialog title
     * @param summary - Dialog summary text
     * @param flags - Bitwise HabboAlertDialogFlag values
     * @param callback - Callback for button events (required for confirm dialogs)
     * @param modal - Whether to display as a modal dialog
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ConfirmDialog.as::ConfirmDialog()
    constructor(
        windowManager: IHabboWindowManager,
        xml: string,
        title: string,
        summary: string,
        flags: number,
        callback: AlertDialogCallback | null,
        modal: boolean
    ) 
    {
        super(windowManager, xml, title, summary, flags, callback, modal);
    }

    /**
     * Handles dialog window events.
     *
     * Unlike AlertDialog, ConfirmDialog NEVER self-disposes on button
     * click. It always delegates to the callback, giving the caller
     * full control over when the dialog is closed.
     *
     * @param event - The window event
     * @param window - The window that triggered the event
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ConfirmDialog.as::dialogEventProc()
    protected override dialogEventProc(event: WindowEvent, window: IWindow): void 
    {
        if(event.type === WindowMouseEvent.CLICK) 
        {
            switch(window.name) 
            {
                case AlertDialog.BUTTON_OK:
                    if(this._callback !== null) 
                    {
                        const okEvent = WindowEvent.allocate(WindowEvent.WE_OK, null, null);
                        this._callback(this, okEvent);
                        okEvent.recycle();
                    }
                    break;

                case AlertDialog.BUTTON_CANCEL:
                case AlertDialog.HEADER_BUTTON_CLOSE:
                    if(this._callback !== null) 
                    {
                        const cancelEvent = WindowEvent.allocate(WindowEvent.WE_CANCEL, null, null);
                        this._callback(this, cancelEvent);
                        cancelEvent.recycle();
                    }
                    break;
            }
        }
    }
}
