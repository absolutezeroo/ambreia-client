/* eslint-disable @typescript-eslint/no-explicit-any */
import {Component, ComponentDependency, type IContext} from '@core/runtime';
import type {ErrorEvent} from '@core/runtime/events/ErrorEvent';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IModalDialog} from '@habbo/window/utils/IModalDialog';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {Logger} from '@ambreia/common/utils/Logger';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.communication.demo.ErrorPopupCtrl');

/**
 * The modal that shows a core error to the user, with the stack trace behind a "copy" button.
 *
 * `HabboCommunicationDemo` owns one for the whole session and routes `COMPONENT_EVENT_ERROR` into
 * `onError()`. Ticking "do not show again" latches for the session — the flag is only cleared by
 * disposing the controller — so a hotel throwing the same error every frame cannot lock the client
 * behind an unclosable dialog.
 *
 * The error text is base64-encoded before it reaches the field, exactly as AS3 does: the point is
 * to give the user one opaque blob to paste into a support ticket, not to show a readable trace.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as
 */
export class ErrorPopupCtrl extends Component
{
    /** The asset name is the layout's own, with no `_xml` suffix — `error_popup.xml` ships it. */
    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::createWindow()
    private static readonly LAYOUT: string = 'error_popup';

    /** AS3's literal: the dialog is its content list plus this much chrome. */
    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::onError()
    private static readonly CHROME_HEIGHT: number = 56;

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::_localizationManager
    private _localizationManager: IHabboLocalizationManager | null = null;

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::_sessionData
    private _sessionData: ISessionDataManager | null = null;

    /** Derived name — `_SafeStr_4929`: the modal wrapper the window manager hands back. */
    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::_SafeStr_4929
    private _dialog: IModalDialog | null = null;

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::_doNotShowAgain
    private _doNotShowAgain: boolean = false;

    /** Derived name — `_SafeStr_5769`: this class keeps its own flag rather than the base's. */
    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::_SafeStr_5769
    private _isDisposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::ErrorPopupCtrl()
    constructor(context: IContext)
    {
        super(context);
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) => { this._windowManager = manager; }
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) => { this._localizationManager = manager; }
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) => { this._sessionData = manager; }
            )
        ];
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::initComponent()
    protected override initComponent(): void
    {
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get disposed()
    override get disposed(): boolean
    {
        return this._isDisposed;
    }

    /**
     * Show the dialog for one error.
     *
     * `showStackTrace` is the caller's `error_handling.show_stacktrace`; with it off — or with an
     * event carrying no `Error` — the info panel and the close cross are both hidden, which leaves
     * the user with the message and an OK button and nothing to copy.
     */
    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::onError()
    onError(event: ErrorEvent, showStackTrace: boolean): void
    {
        if(this._doNotShowAgain) return;

        this.createWindow();

        if(this._window === null) return;

        const withDetails = showStackTrace && event.error !== null;

        const border = this.errorInfoBorder;
        const close = this.closeButton;
        const message = this.messageText;

        if(border !== null) border.visible = withDetails;
        if(close !== null) close.visible = withDetails;

        // AS3 assigns `param1.error?.message` — a null error leaves the field empty rather than
        // printing "null", which is why the optional chain is kept rather than falling back to
        // `event.message`.
        if(message !== null) message.text = event.error?.message ?? '';

        this._window.caption = `Error #${event.category}`;

        if(withDetails)
        {
            const contents = this.errorInfoContents;

            if(contents !== null) contents.text = ErrorPopupCtrl.base64encode(this.createErrorText(event));
        }

        this._window.height = (this.contentList?.height ?? 0) + ErrorPopupCtrl.CHROME_HEIGHT;
    }

    /**
     * DEVIATION: AS3 appends `error.getStackTrace()`, a Flash-only API. A DOM `Error` carries
     *   `stack`, which is the same information in a different format, and an empty string when the
     *   engine did not capture one.
     */
    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::createErrorText()
    createErrorText(event: ErrorEvent): string
    {
        // DEVIATION: AS3 reads `error.errorID`, Flash's numeric error code. There is no counterpart
        //   on a DOM Error, so the category — which AS3 also puts in the caption — stands in.
        return 'Error ID: ' + event.category + '\n'
            + 'Critical: ' + event.critical + '\n'
            + 'Message: ' + event.message + '\n'
            + 'User name: ' + (this._sessionData?.userName ?? '') + '\n'
            + 'User id:' + (this._sessionData?.userId ?? 0) + '\n'
            + 'Hotel: ' + this.getProperty('environment.id') + '\n'
            + '---------------------' + '\n\n'
            + (event.error?.stack ?? '');
    }

    /**
     * DEVIATION: AS3 uses `mx.utils.Base64Encoder` over a `ByteArray` of UTF-8 bytes. `btoa()` only
     *   accepts latin-1, so the string is UTF-8 encoded first and the bytes handed over one char at
     *   a time — the same two steps, and it matters here because a stack trace can carry any
     *   character the hotel's own strings do.
     */
    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::base64encode()
    private static base64encode(text: string): string
    {
        const bytes = new TextEncoder().encode(text);
        let binary = '';

        for(const byte of bytes) binary += String.fromCharCode(byte);

        return btoa(binary);
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::createWindow()
    private createWindow(): void
    {
        if(this._dialog === null)
        {
            // DEVIATION: AS3 reads the layout off its own asset library — `assets.getAssetByName()`
            //   — because every component there is handed one at construction. This port's
            //   `HabboCommunicationDemo` is constructed without an asset library, so its child has
            //   none either; the window manager's own layout map is where the XML actually lives.
            // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::createWindow()
            this._dialog = this._windowManager?.buildModalWidgetLayout(ErrorPopupCtrl.LAYOUT) ?? null;

            if(this._dialog === null)
            {
                log.warn(`Missing layout "${ErrorPopupCtrl.LAYOUT}" — the error popup is not built`);

                return;
            }

            this._window = (this._dialog.rootWindow as IWindowContainer | null) ?? null;

            if(this._window === null) return;

            this.closeButton?.addEventListener(WindowMouseEvent.CLICK, this.onWindowCloseClicked);
            this.okButton?.addEventListener(WindowMouseEvent.CLICK, this.onWindowCloseClicked);
            this.copyButton?.addEventListener(WindowMouseEvent.CLICK, this.onCopyClicked);
        }

        this._window?.activate();
        this._window?.center();
    }

    /**
     * DEVIATION: AS3 writes to AIR's `Clipboard.generalClipboard` under the `air:text` format. The
     *   browser equivalent is the async clipboard API, which can be refused (no permission, or a
     *   call outside a user gesture) — a click is a gesture, so the refusal path is logged rather
     *   than surfaced.
     */
    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::onCopyClicked()
    private onCopyClicked = (): void =>
    {
        const text = this.errorInfoContents?.text ?? '';

        void navigator.clipboard?.writeText(text).catch((error: unknown) =>
        {
            log.warn(`Clipboard write refused: ${String(error)}`);
        });
    };

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::onWindowCloseClicked()
    private onWindowCloseClicked = (): void =>
    {
        this._doNotShowAgain = this.doNotShowCheckbox?.isSelected ?? false;

        this.destroyWindow();
    };

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::destroyWindow()
    private destroyWindow(): void
    {
        if(this._dialog !== null)
        {
            this._dialog.dispose();
            this._dialog = null;
            this._window = null;
        }
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get contentList()
    get contentList(): IItemListWindow | null
    {
        return (this._window?.findChildByName('content_list') ?? null) as unknown as IItemListWindow | null;
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get messageText()
    get messageText(): ITextWindow | null
    {
        return (this._window?.findChildByName('error_msg_text') ?? null) as unknown as ITextWindow | null;
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get errorInfoBorder()
    get errorInfoBorder(): IWindow | null
    {
        return this._window?.findChildByName('error_info_border') ?? null;
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get errorInfoContents()
    get errorInfoContents(): ITextFieldWindow | null
    {
        return (this._window?.findChildByName('error_info_contents') ?? null) as unknown as ITextFieldWindow | null;
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get doNotShowCheckbox()
    get doNotShowCheckbox(): ISelectableWindow | null
    {
        return (this._window?.findChildByName('do_not_show_cbx') ?? null) as unknown as ISelectableWindow | null;
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get okButton()
    get okButton(): IWindow | null
    {
        return this._window?.findChildByName('ok_button') ?? null;
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get copyButton()
    get copyButton(): IWindow | null
    {
        return this._window?.findChildByName('copy_button') ?? null;
    }

    /**
     * The frame's own close cross, added by the frame template rather than declared in
     * `error_popup.xml` — which is why this is the one getter that routinely answers null.
     */
    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::get closeButton()
    get closeButton(): IWindow | null
    {
        return this._window?.findChildByName('header_button_close') ?? null;
    }

    // AS3: .../src/com/sulake/habbo/communication/demo/ErrorPopupCtrl.as::dispose()
    override dispose(): void
    {
        if(this._isDisposed) return;

        this._isDisposed = true;

        if(this._window !== null) this.destroyWindow();

        this._windowManager = null;
        this._localizationManager = null;
        this._sessionData = null;
        this._doNotShowAgain = false;

        super.dispose();
    }
}
