import type {IWindow} from '../../IWindow';
import type {WindowEvent} from '../../events/WindowEvent';
import {WindowMouseEvent} from '../../events/WindowMouseEvent';
import type {IWindowManager} from '../IWindowManager';
import type {AlertDialogCallback} from './AlertDialog';
import {AlertDialog} from './AlertDialog';

/**
 * Interface for alert dialogs that include a clickable link.
 *
 * In AS3 this was the obfuscated `class_3401` which extended `class_3348`
 * (IAlertDialog) with linkTitle and linkUrl properties.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogWithLink.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogWithLink.as
 */
export interface IAlertDialogWithLink {
    // AS3: .../src/com/sulake/habbo/window/utils/AlertDialogWithLink.as::get linkTitle()
    linkTitle: string;
    // AS3: .../src/com/sulake/habbo/window/utils/AlertDialogWithLink.as::get linkUrl()
    linkUrl: string;
}

/**
 * Alert dialog with a clickable link button.
 *
 * Extends {@link AlertDialog} with a link button that opens an external
 * URL when clicked. The link button is identified by the name
 * `_alert_button_link` in the layout.
 *
 * In AS3, clicking the link called `HabboWebTools.navigateToURL()`.
 * In the TS port, we use `window.open()` for external URLs.
 *
 * @see sources/win63_version/habbo/window/utils/AlertDialogWithLink.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogWithLink.as
 */
export class AlertDialogWithLink extends AlertDialog implements IAlertDialogWithLink 
{
    private static readonly BUTTON_LINK: string = '_alert_button_link';

    /**
     * Creates a new alert dialog with a link.
     *
     * @param windowManager - The Habbo window manager
     * @param xml - The XML layout definition
     * @param title - Dialog title
     * @param summary - Dialog summary text
     * @param linkTitle - Display text for the link button
     * @param linkUrl - URL to navigate to when the link is clicked
     * @param flags - Bitwise HabboAlertDialogFlag values
     * @param callback - Optional callback for button events
     */
    constructor(
        windowManager: IWindowManager,
        xml: string,
        title: string,
        summary: string,
        linkTitle: string,
        linkUrl: string,
        flags: number,
        callback: AlertDialogCallback | null
    ) 
    {
        super(windowManager, xml, title, summary, flags, callback, false);
        this.linkTitle = linkTitle;
        this.linkUrl = linkUrl;
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AlertDialogWithLink.as::_linkTitle
    protected _linkTitle: string = '';

    /**
     * Gets the link button display text.
     */
    // AS3: .../src/com/sulake/habbo/window/utils/AlertDialogWithLink.as::get linkTitle()
    public get linkTitle(): string 
    {
        return this._linkTitle;
    }

    /**
     * Sets the link button display text.
     */
    // AS3: .../src/com/sulake/habbo/window/utils/AlertDialogWithLink.as::set linkTitle()
    public set linkTitle(value: string) 
    {
        this._linkTitle = value;

        if(this._window) 
        {
            const linkWindow = this._window.findChildByTag('LINK');

            if(linkWindow) 
            {
                linkWindow.caption = this._linkTitle;
            }
        }
    }

    protected _linkUrl: string = '';

    /**
     * Gets the link URL.
     */
    // AS3: .../src/com/sulake/habbo/window/utils/AlertDialogWithLink.as::get linkUrl()
    public get linkUrl(): string 
    {
        return this._linkUrl;
    }

    /**
     * Sets the link URL.
     */
    // AS3: .../src/com/sulake/habbo/window/utils/AlertDialogWithLink.as::set linkUrl()
    public set linkUrl(value: string) 
    {
        this._linkUrl = value;
    }

    /**
     * Handles dialog window events.
     *
     * Intercepts the link button click to open the URL, then
     * delegates to the parent class for OK/Cancel handling.
     *
     * @param event - The window event
     * @param window - The window that triggered the event
     */
    protected override dialogEventProc(event: WindowEvent, window: IWindow): void 
    {
        if(event.type === WindowMouseEvent.CLICK) 
        {
            if(window.name === AlertDialogWithLink.BUTTON_LINK) 
            {
                if(this._linkUrl && this._linkUrl.length > 0) 
                {
                    // In AS3: HabboWebTools.navigateToURL(linkUrl, "_empty")
                    globalThis.window?.open(this._linkUrl, '_blank');
                }

                return;
            }
        }

        super.dialogEventProc(event, window);
    }
}
