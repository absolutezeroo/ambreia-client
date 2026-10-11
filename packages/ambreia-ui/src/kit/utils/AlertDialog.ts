import type {IWindow} from '../../IWindow';
import type {IWindowContainer} from '../../IWindowContainer';
import {WindowEvent} from '../../events/WindowEvent';
import {WindowMouseEvent} from '../../events/WindowMouseEvent';
import {HabboAlertDialogFlag} from '../enum/HabboAlertDialogFlag';
import type {IWindowManager} from '../IWindowManager';
import type {ICaption} from './AlertDialogCaption';
import {AlertDialogCaption} from './AlertDialogCaption';
import type {IModalDialog} from './IModalDialog';

export type {AlertDialogCallback, IAlertDialog} from './DialogContracts';
import type {AlertDialogCallback, IAlertDialog} from './DialogContracts';

/**
 * Alert dialog with configurable buttons.
 *
 * Displays a framed dialog window with a title, summary text, and
 * a configurable set of buttons (OK, Cancel, Custom). Buttons that
 * are not included in the flags are removed from the layout.
 *
 * When a button is clicked, the dialog either invokes its callback
 * with a WE_OK or WE_CANCEL event, or self-disposes if no callback
 * is set.
 *
 * In AS3 this implemented `class_3348` (IAlertDialog) and `INotify`.
 * The window is built from XML via `buildFromXML`.
 *
 * @see sources/win63_version/habbo/window/utils/AlertDialog.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as
 */
export class AlertDialog implements IAlertDialog 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::LIST_BUTTONS
    protected static readonly LIST_BUTTONS: string = '_alert_button_list';
    // AS3: sources/win63_version/habbo/window/utils/AlertDialog.as::BUTTON_OK
    protected static readonly BUTTON_OK: string = '_alert_button_ok';
    // Derived name: `BUTTON_CANCEL` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/utils/AlertDialog.as::BUTTON_CANCEL
    protected static readonly BUTTON_CANCEL: string = '_alert_button_cancel';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::BUTTON_CUSTOM
    protected static readonly BUTTON_CUSTOM: string = '_alert_button_custom';
    // AS3: sources/win63_version/habbo/window/utils/AlertDialog.as::HEADER_BUTTON_CLOSE
    protected static readonly HEADER_BUTTON_CLOSE: string = 'header_button_close';
    // Derived name: `TEXT_SUMMARY` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/utils/AlertDialog.as::TEXT_SUMMARY
    protected static readonly TEXT_SUMMARY: string = '_alert_text_summary';

    // TS-only: instance counter for unique window names
    private static _instanceCounter: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::_window
    protected _window: IWindowContainer | null = null;
    // Derived name: `_modalDialog` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/utils/AlertDialog.as::_modalDialog
    protected _modalDialog: IModalDialog | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::AlertDialog()
    constructor(
        windowManager: IWindowManager,
        xml: string,
        title: string,
        summary: string,
        flags: number,
        callback: AlertDialogCallback | null,
        modal: boolean
    ) 
    {
        AlertDialog._instanceCounter++;

        if(modal) 
        {
            // Build as modal: creates dimmed background + centered window
            this._modalDialog = windowManager.buildModalDialogFromXML(xml);
            this._window = this._modalDialog?.rootWindow as IWindowContainer ?? null;
        }
        else 
        {
            // Build as non-modal in the dialog layer (2)
            this._window = windowManager.buildFromXML(xml, 2) as IWindowContainer;
        }

        // Default flags: BUTTON_OK | TEXT_TITLE | TEXT_SUMMARY
        if(flags === HabboAlertDialogFlag.NULL) 
        {
            flags = HabboAlertDialogFlag.BUTTON_OK | HabboAlertDialogFlag.TEXT_TITLE | HabboAlertDialogFlag.TEXT_SUMMARY;
        }

        // Remove buttons that are not in the flags
        if(this._window)
        {
            const buttonList = this._window.findChildByName(AlertDialog.LIST_BUTTONS);

            if(buttonList)
            {
                // AS3 reaches the buttons through `IItemListWindow.getListItemByName()`, not
                // `getChildByName()`: the buttons live in the list's internal `_container`, not
                // directly under the list window. Disposing is all AS3 does - a disposed window
                // detaches from its parent, the container raises WE_CHILD_REMOVED, and
                // ItemListController re-arranges from its own handler. Calling `removeListItem()`
                // first, as this port briefly did, is not in the AS3 and duplicates that path.
                const list = buttonList as IWindowContainer & {
                    getListItemByName?: (name: string) => IWindow | null;
                };

                const removeButton = (name: string): void =>
                {
                    const button = list.getListItemByName?.(name)
                        ?? (buttonList as IWindowContainer).getChildByName?.(name)
                        ?? null;

                    // AS3 dereferences the result unguarded; the null check only keeps a layout
                    // that omits one of the three buttons from throwing here.
                    button?.dispose();
                };

                if(!(flags & HabboAlertDialogFlag.BUTTON_OK))
                {
                    removeButton(AlertDialog.BUTTON_OK);
                }

                if(!(flags & HabboAlertDialogFlag.BUTTON_CANCEL))
                {
                    removeButton(AlertDialog.BUTTON_CANCEL);
                }

                if(!(flags & HabboAlertDialogFlag.BUTTON_CUSTOM))
                {
                    removeButton(AlertDialog.BUTTON_CUSTOM);
                }
            }

            this._window.procedure = (event: WindowEvent, window: IWindow) => this.dialogEventProc(event, window);
            this._window.center();
        }

        this.title = title;
        this.summary = summary;
        this.callback = callback;
    }

    // AS3: sources/win63_version/habbo/window/utils/AlertDialog.as::var_839
    protected _title: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::get title()
    public get title(): string 
    {
        return this._title;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::set title()
    public set title(value: string) 
    {
        this._title = value;

        if(this._window) 
        {
            this._window.caption = this._title;
        }
    }

    // AS3: sources/win63_version/habbo/window/utils/AlertDialog.as::var_2854
    protected _summary: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::get summary()
    public get summary(): string 
    {
        return this._summary;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::set summary()
    public set summary(value: string) 
    {
        this._summary = value;

        if(this._window) 
        {
            const descriptionWindow = this._window.findChildByTag('DESCRIPTION');

            if(descriptionWindow) 
            {
                // AS3: ITextWindow(_window.findChildByTag("DESCRIPTION")).text = var_2854
                (descriptionWindow as IWindow & { text: string }).text = this._summary;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::_disposed
    protected _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::_callback
    protected _callback: AlertDialogCallback | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::get callback()
    public get callback(): AlertDialogCallback | null 
    {
        return this._callback;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::set callback()
    public set callback(value: AlertDialogCallback | null) 
    {
        this._callback = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::get titleBarColor()
    public get titleBarColor(): number 
    {
        if(!this._window) return 0;

        return this._window.color;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::set titleBarColor()
    public set titleBarColor(value: number) 
    {
        if(!this._window) return;

        this._window.color = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::getButtonCaption()
    public getButtonCaption(buttonFlag: number): ICaption | null 
    {
        if(this._disposed || !this._window) return null;

        let buttonName: string | null = null;

        switch(buttonFlag) 
        {
            case HabboAlertDialogFlag.BUTTON_OK:
                buttonName = AlertDialog.BUTTON_OK;
                break;
            case HabboAlertDialogFlag.BUTTON_CANCEL:
                buttonName = AlertDialog.BUTTON_CANCEL;
                break;
            case HabboAlertDialogFlag.BUTTON_CUSTOM:
                buttonName = AlertDialog.BUTTON_CUSTOM;
                break;
        }

        if(!buttonName) return null;

        const button = this._window.findChildByName(buttonName);

        if(!button) return null;

        // AS3: new AlertDialogCaption(_loc2_.caption, _loc2_.toolTipCaption, _loc2_.visible)
        return new AlertDialogCaption(
            button.caption ?? '',
            (button as IWindow & { toolTipCaption?: string }).toolTipCaption ?? '',
            button.visible
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::setButtonCaption()
    public setButtonCaption(buttonFlag: number, caption: ICaption): void 
    {
        if(this._disposed || !this._window) return;

        let buttonName: string | null = null;

        switch(buttonFlag) 
        {
            case HabboAlertDialogFlag.BUTTON_OK:
                buttonName = AlertDialog.BUTTON_OK;
                break;
            case HabboAlertDialogFlag.BUTTON_CANCEL:
                buttonName = AlertDialog.BUTTON_CANCEL;
                break;
            case HabboAlertDialogFlag.BUTTON_CUSTOM:
                buttonName = AlertDialog.BUTTON_CUSTOM;
                break;
        }

        if(!buttonName) return;

        const button = this._window.findChildByName(buttonName);

        if(button) 
        {
            button.caption = caption.text;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        if(this._modalDialog && !this._modalDialog.disposed) 
        {
            this._modalDialog.dispose();
            this._modalDialog = null;
            this._window = null;
        }

        if(this._window && !this._window.disposed) 
        {
            this._window.dispose();
            this._window = null;
        }

        this._callback = null;
        this._disposed = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialog.as::dialogEventProc()
    protected dialogEventProc(event: WindowEvent, window: IWindow): void 
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
                    else 
                    {
                        this.dispose();
                    }
                    break;

                case AlertDialog.HEADER_BUTTON_CLOSE:
                case AlertDialog.BUTTON_CANCEL:
                    if(this._callback !== null) 
                    {
                        const cancelEvent = WindowEvent.allocate(WindowEvent.WE_CANCEL, null, null);
                        this._callback(this, cancelEvent);
                        cancelEvent.recycle();
                    }
                    else 
                    {
                        this.dispose();
                    }
                    break;
            }
        }
    }
}
