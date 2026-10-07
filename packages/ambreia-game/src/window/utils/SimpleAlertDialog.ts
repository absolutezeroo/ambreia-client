import {Logger} from '@ambreia/common/utils/Logger';
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IModalDialog} from '@ambreia/ui/kit/utils/IModalDialog';

const log = Logger.getLogger('habbo.window.utils.SimpleAlertDialog');

/**
 * Simplified alert dialog with optional subtitle, link, and illustration.
 *
 * Unlike {@link AlertDialog}, this dialog uses a fixed layout asset
 * (`simple_alert_xml`) and provides a streamlined constructor that
 * accepts all content parameters at once. It always displays as a
 * modal dialog with no close button in the header.
 *
 * Features:
 * - Title + optional subtitle
 * - Message text
 * - Optional clickable link (opens URL or fires a link event)
 * - Optional illustration image
 * - Close button at the bottom
 *
 * In AS3, the layout was loaded from the `simple_alert_xml` asset.
 * The illustration resize handling (which adjusted layout based on
 * bitmap dimensions) is preserved for the XML layout system.
 *
 * @see sources/win63_version/habbo/window/utils/SimpleAlertDialog.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as
 */
export class SimpleAlertDialog implements IDisposable 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::WINDOW_MARGIN
    private static readonly WINDOW_MARGIN: number = 10;
    // AS3: sources/win63_version/habbo/window/utils/SimpleAlertDialog.as::_modalDialog
    private _modalDialog: IModalDialog | null = null;
    // Derived name: `_linkUrl` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/utils/SimpleAlertDialog.as::_linkUrl
    private _linkUrl: string = '';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::_window
    private _window: IWindowContainer | null = null;
    // Derived name: obfuscated in every tree that carries this class (`_SafeStr_*`
    // in the primary, `var_*` in the secondary), so no tree recovers it.
    // AS3: sources/win63_version/habbo/window/utils/SimpleAlertDialog.as::_listMain
    private _listMain: IWindow | null = null;
    // Derived name: obfuscated in every tree that carries this class (`_SafeStr_*`
    // in the primary, `var_*` in the secondary), so no tree recovers it.
    // AS3: sources/win63_version/habbo/window/utils/SimpleAlertDialog.as::_listTop
    private _listTop: IWindow | null = null;
    // Derived name: obfuscated in every tree that carries this class (`_SafeStr_*`
    // in the primary, `var_*` in the secondary), so no tree recovers it.
    // AS3: sources/win63_version/habbo/window/utils/SimpleAlertDialog.as::_listBottom
    private _listBottom: IWindow | null = null;
    // Derived name: obfuscated in every tree that carries this class (`_SafeStr_*`
    // in the primary, `var_*` in the secondary), so no tree recovers it.
    // AS3: sources/win63_version/habbo/window/utils/SimpleAlertDialog.as::_messageWindow
    private _messageWindow: IWindow | null = null;
    // AS3: sources/win63_version/habbo/window/utils/SimpleAlertDialog.as::_subtitleWindow
    private _subtitleWindow: IWindow | null = null;
    // AS3: sources/win63_version/habbo/window/utils/SimpleAlertDialog.as::_linkWindow
    private _linkWindow: IWindow | null = null;
    // Derived name: `_illustrationWindow` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/utils/SimpleAlertDialog.as::_illustrationWindow
    private _illustrationWindow: IWindow | null = null;
    // TS-only: callback refs stored explicitly (AS3 stored them per-instance differently)
    private _linkClickCallback: (() => void) | null = null;
    private _closeCallback: (() => void) | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    /**
     * Creates a new simple alert dialog.
     *
     * @param windowManager - The Habbo window manager
     * @param title - Dialog title
     * @param subtitle - Optional subtitle text (null or empty to omit)
     * @param message - The main message text
     * @param linkCaption - Optional link button text (null or empty to omit)
     * @param linkUrl - Optional URL for the link button
     * @param parameters - Optional map of localization parameters to register
     * @param illustrationUrl - Optional illustration image URL (null or empty to omit)
     * @param linkClickCallback - Optional callback invoked when the link is clicked
     * @param closeCallback - Optional callback invoked when the dialog is closed
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::SimpleAlertDialog()
    constructor(
        windowManager: IHabboWindowManager,
        title: string,
        subtitle: string | null,
        message: string,
        linkCaption: string | null,
        linkUrl: string | null,
        parameters: Map<string, string> | null,
        illustrationUrl: string | null,
        linkClickCallback: (() => void) | null,
        closeCallback: (() => void) | null
    ) 
    {
        this._linkClickCallback = linkClickCallback;
        this._closeCallback = closeCallback;
        this._windowManager = windowManager;

        // AS3: param6 = param1.interpolate(param6) — interpolate URL variables before use
        if(linkUrl) 
        {
            linkUrl = (windowManager as unknown as {
                interpolate?: (v: string) => string
            }).interpolate?.(linkUrl) ?? linkUrl;
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as
        // loads "simple_alert_xml" via assets.getAssetByName() and builds a modal dialog from it.
        //
        // In AS3 that name only has to be unique inside HabboWindowManagerCom. Here every
        // component's layouts share one registry, and `simple_alert_xml` is declared by
        // two of them (HabboWindowManagerCom and HabboFriendListCom), so both shipped
        // component-qualified and the bare key does not exist — `simpleAlert()` threw for
        // every caller in the client, not just the friend list's. Take this component's
        // own copy, and keep the bare name as the fallback for bundles built before the
        // collision was qualified.
        const layoutName = windowManager.hasWidgetLayout('HabboWindowManager_simple_alert_xml')
            ? 'HabboWindowManager_simple_alert_xml'
            : 'simple_alert_xml';

        const layoutXml = windowManager.requireWidgetLayout(layoutName, 'simple alert dialog');

        this._modalDialog = windowManager.buildModalDialogFromXML(layoutXml);
        this._window = this._modalDialog?.rootWindow as IWindowContainer ?? null;

        if(!this._window) 
        {
            log.warn('Failed to create SimpleAlertDialog window');
            return;
        }

        // Resolve child windows
        this._listMain = this._window.findChildByName('list');
        this._listTop = this._window.findChildByName('list_top');
        this._listBottom = this._window.findChildByName('list_bottom');
        this._messageWindow = this._window.findChildByName('message');
        this._subtitleWindow = this._window.findChildByName('subtitle');
        this._linkWindow = this._window.findChildByName('link');
        this._illustrationWindow = this._window.findChildByName('illustration');

        // Remove close button from header (simple alert has its own close)
        const headerClose = this._window.findChildByName('header_button_close');

        if(headerClose) 
        {
            headerClose.dispose();
        }

        // Set window procedure
        this._window.procedure = (event: WindowEvent, window: IWindow) => this.windowProcedure(event, window);

        // Set title and message
        this._window.caption = title;

        if(this._messageWindow) 
        {
            this._messageWindow.caption = message;
        }

        // Register localization parameters if provided
        if(parameters) 
        {
            const textsToProcess = [title, subtitle, message, linkCaption];

            for(const text of textsToProcess) 
            {
                if(text && text.substring(0, 2) === '${' && text.indexOf('}') > 0) 
                {
                    const key = text.substring(2, text.indexOf('}'));

                    for(const [paramKey, paramValue] of parameters) 
                    {
                        windowManager.registerLocalizationParameter(key, paramKey, paramValue);
                    }
                }
            }
        }

        // Set subtitle or remove if empty
        if(subtitle && subtitle.length > 0) 
        {
            if(this._subtitleWindow) 
            {
                this._subtitleWindow.caption = subtitle;
            }
        }
        else 
        {
            if(this._subtitleWindow) 
            {
                this._subtitleWindow.dispose();
                this._subtitleWindow = null;
            }
        }

        // Set link or remove if empty
        if(linkCaption && linkCaption.length > 0 && ((linkUrl && linkUrl.length > 0) || linkClickCallback)) 
        {
            if(this._linkWindow) 
            {
                this._linkWindow.caption = linkCaption;
                this._linkWindow.addEventListener(WindowMouseEvent.CLICK, () => this.onSimpleAlertClick());
                this._linkWindow.immediateClickMode = true;
                this._linkUrl = linkUrl ?? '';
            }
        }
        else 
        {
            if(this._linkWindow) 
            {
                this._linkWindow.dispose();
                this._linkWindow = null;
            }
        }

        // Set illustration or remove if empty
        if(illustrationUrl && illustrationUrl.length > 0) 
        {
            if(this._illustrationWindow) 
            {
                this._illustrationWindow.addEventListener(WindowEvent.WE_RESIZED, () => this.onIllustrationResized());
                // In AS3: assetUri = illustrationUrl triggers async load
                // The illustration load is handled by the UI layer
            }
        }
        else 
        {
            if(this._illustrationWindow) 
            {
                this._illustrationWindow.dispose();
                this._illustrationWindow = null;
            }
        }

        this.resizeWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this.close();
        this._windowManager = null;
        this._disposed = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::close()
    private close(): void 
    {
        if(this._closeCallback) 
        {
            this._closeCallback();
        }

        if(this._modalDialog) 
        {
            if(this._linkWindow) 
            {
                this._linkWindow = null;
            }

            if(this._illustrationWindow) 
            {
                this._illustrationWindow = null;
            }

            this._window = null;
            this._listMain = null;
            this._listTop = null;
            this._listBottom = null;
            this._messageWindow = null;
            this._subtitleWindow = null;
            this._linkClickCallback = null;
            this._closeCallback = null;

            this._modalDialog.dispose();
            this._modalDialog = null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::windowProcedure()
    private windowProcedure(event: WindowEvent, window: IWindow): void 
    {
        if(event.type === WindowMouseEvent.CLICK && window.name === 'close_button') 
        {
            this.dispose();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::onSimpleAlertClick()
    private onSimpleAlertClick(): void 
    {
        if(this._linkUrl && this._linkUrl.length > 0) 
        {
            if(this._linkUrl.substring(0, 6) === 'event:') 
            {
                // AS3: `context.createLinkEvent(url.substr(6))`. `IHabboWindowManager` declares no
                // `context` in either tree, so the same cast FurnitureRoomLinkHandler.navigateTo()
                // documents is used to reach the Component base's own.
                const ctx = (this._windowManager as unknown as {
                    context?: { createLinkEvent?: (s: string) => void }
                }).context;
                ctx?.createLinkEvent?.(this._linkUrl.substring(6));
                this.dispose();
            }
            else 
            {
                // AS3: HabboWebTools.openWebPage(url, "habboMain")
                globalThis.window?.open(this._linkUrl, '_blank');
            }
        }
        else if(this._linkClickCallback) 
        {
            this._linkClickCallback();
            this.dispose();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::onIllustrationResized()
    private onIllustrationResized(): void 
    {
        if(!this._illustrationWindow || !this._listTop || !this._listBottom || !this._window) return;

        this._listTop.x = this._illustrationWindow.width + SimpleAlertDialog.WINDOW_MARGIN;

        // AS3: _listTop.limits.minHeight = _illustrationWindow.height + 10
        if((this._listTop as unknown as { limits?: { minHeight?: number } }).limits)
        {
            (this._listTop as unknown as {
                limits: { minHeight: number }
            }).limits.minHeight = this._illustrationWindow.height + SimpleAlertDialog.WINDOW_MARGIN;
        }

        const rightEdge = this._listTop.x + this._listTop.width;
        this._listBottom.width = rightEdge;
        this._window.width = rightEdge + 2 * SimpleAlertDialog.WINDOW_MARGIN;

        this.resizeWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/SimpleAlertDialog.as::resizeWindow()
    private resizeWindow(): void 
    {
        if(!this._window || !this._listMain) return;

        // AS3: _listMain.arrangeListItems(); _listTop.arrangeListItems(); _listBottom.arrangeListItems()
        (this._listMain as unknown as IItemListWindow).arrangeListItems?.();
        (this._listTop as unknown as IItemListWindow)?.arrangeListItems?.();
        (this._listBottom as unknown as IItemListWindow)?.arrangeListItems?.();

        this._window.height = this._listMain.height + 40;
        this._window.center();
    }
}
