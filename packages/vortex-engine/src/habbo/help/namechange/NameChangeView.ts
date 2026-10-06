import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IFrameWindow} from '@core/window/components/IFrameWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {
    ChangeUserNameResultMessageEvent
} from '@habbo/communication/messages/incoming/help/ChangeUserNameResultMessageEvent';
import type {INameChangeUI} from '../INameChangeUI';
import {NameSuggestionListRenderer} from './NameSuggestionListRenderer';

/**
 * NameChangeView — the three-step "change my name" dialog.
 *
 * One frame (`welcome_name_change`) whose content holds three sibling pages, built on demand and
 * swapped by visibility rather than rebuilt: the main page that offers to keep or change the name,
 * the selection page with the input and the suggestion chips, and the confirmation page. `showView()`
 * resizes the frame's content to whichever page is showing, which is what makes one window look
 * like three.
 *
 * Reached from the own-avatar menu — `RWUAM_START_NAME_CHANGE` → `HabboHelp.startNameChange()`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/namechange/NameChangeView.as
 */
export class NameChangeView
{
    /**
     * The page-side hook Flash called through `ExternalInterface` once a name was settled on.
     *
     * Kept as the same dotted string because the contract is the page's, not ours: a page written
     * for the Flash client keeps working, and one that defines nothing simply never gets called.
     * Same treatment as `PageBridge`.
     */
    // AS3: .../NameChangeView.as::NAME_UPDATE_FUNCTION
    private static readonly NAME_UPDATE_FUNCTION: string = 'FlashExternalInterface.updateName';

    // AS3: .../NameChangeView.as::NAME_SUGGESTION_BG_COLOR
    private static readonly NAME_SUGGESTION_BG_COLOR: number = 13232628;

    // AS3: .../NameChangeView.as::NAME_SUGGESTION_BG_COLOR_OVER
    private static readonly NAME_SUGGESTION_BG_COLOR_OVER: number = 11129827;

    /** Derived name — `_SafeStr_4593`: the controller behind the interface. */
    // AS3: .../NameChangeView.as::_SafeStr_4593
    private _ui: INameChangeUI;

    // AS3: .../NameChangeView.as::_window
    private _window: IFrameWindow | null = null;

    // AS3: .../NameChangeView.as::_checkedName
    private _checkedName: string | null = null;

    // AS3: .../NameChangeView.as::_pendingName
    private _pendingName: string | null = null;

    /** Derived name — `_SafeStr_4684`: the first page, which ships inside the frame's layout. */
    // AS3: .../NameChangeView.as::_SafeStr_4684
    private _mainPage: IWindowContainer | null = null;

    /** Derived name — `_SafeStr_6015`: the input + suggestions page. */
    // AS3: .../NameChangeView.as::_SafeStr_6015
    private _selectionPage: IWindowContainer | null = null;

    /** Derived name — `_SafeStr_5575`: the "this will be your name" page. */
    // AS3: .../NameChangeView.as::_SafeStr_5575
    private _confirmationPage: IWindowContainer | null = null;

    /** Derived name — `_SafeStr_4612`: whichever of the three is currently visible. */
    // AS3: .../NameChangeView.as::_SafeStr_4612
    private _visiblePage: IWindowContainer | null = null;

    /** Derived name — `_SafeStr_6625`: true while a check is in flight, which suppresses input. */
    // AS3: .../NameChangeView.as::_SafeStr_6625
    private _waitingForCheck: boolean = false;

    /** Derived name — `_SafeStr_6704`: the suggestion layout helper. */
    // AS3: .../NameChangeView.as::_SafeStr_6704
    private _suggestionRenderer: NameSuggestionListRenderer | null = null;

    // AS3: .../NameChangeView.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../NameChangeView.as::NameChangeView()
    constructor(ui: INameChangeUI)
    {
        this._ui = ui;
    }

    // AS3: .../NameChangeView.as::get id()
    get id(): string
    {
        return 'TUI_NAME_VIEW';
    }

    // AS3: .../NameChangeView.as::get view()
    get view(): IFrameWindow | null
    {
        return this._window;
    }

    /**
     * AS3: .../NameChangeView.as::set checkedName()
     *
     * The server said this name is free. If it is the one the user pressed *select* on, that is a
     * confirmed choice and the dialog moves on; if it merely came back from the *check* button, the
     * selection page stays put and only its wording changes.
     */
    // AS3: .../NameChangeView.as::set checkedName()
    set checkedName(value: string)
    {
        this._checkedName = value;

        if(this._pendingName === this._checkedName)
        {
            this.showConfirmationView();

            return;
        }

        this.setNameAvailableView();
    }

    // AS3: .../NameChangeView.as::showMainView()
    showMainView(): void
    {
        const ui = this._ui;

        if(this._window === null)
        {
            this._window = ui.buildXmlWindow('welcome_name_change') as IFrameWindow | null;

            if(this._window === null) return;

            this._window.center();
            this._window.procedure = this.windowEventHandler;
            this._mainPage = this._window.content.getChildAt(0) as IWindowContainer | null;
        }

        ui.localization?.registerParameter('tutorial.name_change.current', 'name', ui.myName);
        this._window.caption = ui.localization?.getLocalization('tutorial.name_change.title.main') ?? '';

        if(this._mainPage !== null) this.showPage(this._mainPage);
    }

    /**
     * AS3: .../NameChangeView.as::showView()
     *
     * Renamed from AS3's `showView()` because this class already answers to `INameChangeUI.showView()`
     * on the controller side and the two mean different things; this one is the private page swap.
     */
    // AS3: .../NameChangeView.as::showView()
    private showPage(page: IWindowContainer): void
    {
        this._waitingForCheck = false;

        if(this._visiblePage !== null) this._visiblePage.visible = false;

        this._visiblePage = page;
        this._visiblePage.visible = true;

        if(this._window !== null)
        {
            this._window.content.width = this._visiblePage.width;
            this._window.content.height = this._visiblePage.height;
        }
    }

    // AS3: .../NameChangeView.as::showSelectionView()
    private showSelectionView(): void
    {
        const ui = this._ui;

        if(this._window === null) return;

        if(this._selectionPage === null)
        {
            this._selectionPage = ui.buildXmlWindow('welcome_name_selection') as IWindowContainer | null;

            if(this._selectionPage === null) return;

            this._window.content.addChild(this._selectionPage);
        }

        this._window.caption = ui.localization?.getLocalization('tutorial.name_change.title.select') ?? '';

        // Nothing has been typed yet, so there is nothing to select.
        this._window.findChildByName('select_name_button')?.disable();

        this.setNormalView();
        this.showPage(this._selectionPage);
    }

    // AS3: .../NameChangeView.as::showConfirmationView()
    private showConfirmationView(): void
    {
        const ui = this._ui;

        if(this._window === null) return;

        if(this._confirmationPage === null)
        {
            this._confirmationPage = ui.buildXmlWindow('welcome_name_confirmation') as IWindowContainer | null;

            if(this._confirmationPage === null) return;

            this._window.content.addChild(this._confirmationPage);
        }

        this._window.caption = ui.localization?.getLocalization('tutorial.name_change.title.confirm') ?? '';

        const finalName = this._confirmationPage.findChildByName('final_name') as ITextWindow | null;

        if(finalName !== null) finalName.text = this._checkedName ?? '';

        this.showPage(this._confirmationPage);

        this.notifyPage(this._checkedName ?? '');
    }

    // AS3: .../NameChangeView.as::setNormalView()
    setNormalView(): void
    {
        if(this._window === null) return;

        const infoText = this._window.findChildByName('info_text') as ITextWindow | null;

        if(infoText === null) return;

        infoText.text = this._ui.localization?.getLocalization('help.tutorial.name.info') ?? '';

        const suggestions = this._window.findChildByName('suggestions');

        if(suggestions === null) return;

        suggestions.visible = false;
    }

    // AS3: .../NameChangeView.as::setNameAvailableView()
    setNameAvailableView(): void
    {
        if(this._window === null) return;

        this.nameCheckWaitEnd(true);

        const infoText = this._window.findChildByName('info_text') as ITextWindow | null;

        if(infoText === null) return;

        const localization = this._ui.localization;

        localization?.registerParameter('help.tutorial.name.available', 'name', this._checkedName ?? '');
        infoText.text = localization?.getLocalization('help.tutorial.name.available') ?? '';

        const input = this._window.findChildByName('input') as ITextFieldWindow | null;

        if(input === null) return;

        input.text = this._checkedName ?? '';

        const suggestions = this._window.findChildByName('suggestions');

        if(suggestions === null) return;

        suggestions.visible = false;
    }

    /**
     * AS3: .../NameChangeView.as::setNameNotAvailableView()
     *
     * Both refusals land here — the cheap *check* and the real *change* — which is why it starts by
     * forcing the selection page back into view: a rejection arriving while the confirmation page is
     * up has to take the user back to the input.
     *
     * `ERROR_NAME_REQUIRED` (1) is a deliberate no-op: AS3's switch has that case with an empty
     * body, so the previous message stays on screen.
     */
    // AS3: .../NameChangeView.as::setNameNotAvailableView()
    setNameNotAvailableView(resultCode: number, name: string, nameSuggestions: string[]): void
    {
        this.nameCheckWaitEnd(false);

        if(this._visiblePage !== this._selectionPage) this.showSelectionView();

        this._pendingName = null;
        this._checkedName = null;

        if(this._window === null) return;

        const infoText = this._window.findChildByName('info_text') as ITextWindow | null;

        if(infoText === null) return;

        const localization = this._ui.localization;

        switch(resultCode)
        {
            case ChangeUserNameResultMessageEvent.ERROR_NAME_IN_USE:
                localization?.registerParameter('help.tutorial.name.taken', 'name', name);
                infoText.text = localization?.getLocalization('help.tutorial.name.taken') ?? '';
                break;
            case ChangeUserNameResultMessageEvent.ERROR_NAME_NOT_VALID:
                localization?.registerParameter('help.tutorial.name.invalid', 'name', name);
                infoText.text = localization?.getLocalization('help.tutorial.name.invalid') ?? '';
                break;
            case ChangeUserNameResultMessageEvent.ERROR_NAME_TOO_LONG:
                infoText.text = localization?.getLocalization('help.tutorial.name.long') ?? '';
                break;
            case ChangeUserNameResultMessageEvent.ERROR_NAME_TOO_SHORT:
                infoText.text = localization?.getLocalization('help.tutorial.name.short') ?? '';
                break;
            case ChangeUserNameResultMessageEvent.ERROR_NAME_CHANGE_NOT_ALLOWED:
                infoText.text = localization?.getLocalization('help.tutorial.name.change_not_allowed') ?? '';
                break;
            case ChangeUserNameResultMessageEvent.ERROR_MERGE_HOTEL_DOWN:
                infoText.text = localization?.getLocalization('help.tutorial.name.merge_hotel_down') ?? '';
                break;
            case ChangeUserNameResultMessageEvent.ERROR_NAME_REQUIRED:
                break;
        }

        const suggestions = this._window.findChildByName('suggestions') as IWindowContainer | null;

        if(suggestions === null) return;

        // Neither of these two is about the name itself, so there is nothing to suggest.
        if(resultCode === ChangeUserNameResultMessageEvent.ERROR_MERGE_HOTEL_DOWN
            || resultCode === ChangeUserNameResultMessageEvent.ERROR_NAME_CHANGE_NOT_ALLOWED)
        {
            suggestions.visible = false;

            return;
        }

        suggestions.visible = true;

        this._suggestionRenderer = new NameSuggestionListRenderer(this._ui);
        this._suggestionRenderer.render(nameSuggestions, suggestions);

        // AS3 walks the container after rendering rather than wiring each chip inside the renderer,
        // so a chip that did not fit is never given a listener.
        for(let i = 0; i < suggestions.numChildren; i++)
        {
            const chip = suggestions.getChildAt(i);

            if(chip === null) continue;

            chip.color = NameChangeView.NAME_SUGGESTION_BG_COLOR;
            chip.addEventListener(WindowMouseEvent.CLICK, this.nameSelected);
            chip.addEventListener(WindowMouseEvent.OVER, this.nameOver);
            chip.addEventListener(WindowMouseEvent.OUT, this.nameOut);
        }
    }

    /**
     * AS3: .../NameChangeView.as::nameSelected()
     *
     * Clicking a suggestion only fills the input — it does not submit. The user still presses
     * *select*, which is what sends the check.
     */
    // AS3: .../NameChangeView.as::nameSelected()
    private nameSelected = (event: WindowMouseEvent): void =>
    {
        this.nameCheckWaitEnd(true);

        const chip = event.target as unknown as ITextWindow | null;

        if(chip === null) return;

        const name = chip.text;

        this.setNormalView();

        const input = this._window?.findChildByName('input') as ITextFieldWindow | null;

        if(input === null) return;

        input.text = name;
    };

    // AS3: .../NameChangeView.as::nameOver()
    private nameOver = (event: WindowMouseEvent): void =>
    {
        const chip = event.target as unknown as ITextWindow | null;

        if(chip !== null) chip.color = NameChangeView.NAME_SUGGESTION_BG_COLOR_OVER;
    };

    // AS3: .../NameChangeView.as::nameOut()
    private nameOut = (event: WindowMouseEvent): void =>
    {
        const chip = event.target as unknown as ITextWindow | null;

        if(chip !== null) chip.color = NameChangeView.NAME_SUGGESTION_BG_COLOR;
    };

    /**
     * AS3: .../NameChangeView.as::nameCheckWaitBegin()
     *
     * Note it writes `caption` on the info text where every other path writes `text` — kept as AS3
     * has it rather than "corrected", since the two are different properties on a text window.
     */
    // AS3: .../NameChangeView.as::nameCheckWaitBegin()
    nameCheckWaitBegin(): void
    {
        if(this._window !== null && !this._window.disposed)
        {
            this._window.findChildByName('select_name_button')?.disable();
            this._window.findChildByName('check_name_button')?.disable();
            this._window.findChildByName('input')?.disable();

            const infoText = this._window.findChildByName('info_text');

            if(infoText !== null)
            {
                infoText.caption =
                    this._ui.localization?.getLocalization('help.tutorial.name.wait_while_checking') ?? '';
            }
        }

        this._waitingForCheck = true;
    }

    /**
     * AS3: .../NameChangeView.as::nameCheckWaitEnd()
     *
     * `nameIsAvailable` only gates the *select* button: after a refusal the user may type and check
     * again, but must not be able to submit the name that was just rejected.
     */
    // AS3: .../NameChangeView.as::nameCheckWaitEnd()
    nameCheckWaitEnd(nameIsAvailable: boolean): void
    {
        if(this._window !== null && !this._window.disposed)
        {
            if(nameIsAvailable) this._window.findChildByName('select_name_button')?.enable();

            this._window.findChildByName('check_name_button')?.enable();
            this._window.findChildByName('input')?.enable();
        }

        this._waitingForCheck = false;
    }

    // AS3: .../NameChangeView.as::windowEventHandler()
    private windowEventHandler = (event: WindowEvent, window: IWindow): void =>
    {
        // Typing gates the select button on three characters. Skipped entirely while a check is in
        // flight, which is what `_waitingForCheck` is for.
        if(!this._waitingForCheck && event.type === 'WE_CHANGE' && window.name === 'input')
        {
            const selectButton = this._window?.findChildByName('select_name_button') ?? null;
            const input = window as unknown as ITextFieldWindow;

            if(selectButton !== null)
            {
                if(input.text.length > 2) selectButton.enable();
                else selectButton.disable();
            }
        }

        if(event.type !== 'WME_CLICK') return;

        switch(window.name)
        {
            case 'change_name_button':
                this.showSelectionView();
                break;
            case 'keep_name_button':
                this._checkedName = this._ui.myName ?? '';
                this.showConfirmationView();
                break;
            case 'check_name_button':
                this._ui.checkName(this.getName() ?? '');
                this.nameCheckWaitBegin();
                break;
            case 'select_name_button':
            {
                const name = this.getName() ?? '';

                if(name.length < 1) return;

                // Already checked and free: skip the round trip and confirm.
                if(this._checkedName !== name)
                {
                    this._pendingName = name;
                    this._ui.checkName(name);
                    this.nameCheckWaitBegin();
                    break;
                }

                this.showConfirmationView();
                break;
            }
            case 'cancel_selection_button':
                this._ui.hideView();
                break;
            case 'confirm_name_button':
                this._ui.changeName(this._checkedName ?? '');
                break;
            case 'cancel_confirmation_button':
                this._ui.hideView();
                break;
            case 'header_button_close':
                this._ui.hideView();
                break;
        }
    };

    // AS3: .../NameChangeView.as::getName()
    private getName(): string | null
    {
        if(this._window === null) return null;

        const input = this._window.findChildByName('input') as ITextFieldWindow | null;

        return input?.text ?? null;
    }

    /**
     * The browser stand-in for `ExternalInterface.call(NAME_UPDATE_FUNCTION, name)`.
     *
     * Walks the dotted path on `window` and calls it if it resolves to a function — inert when the
     * host page defines nothing, which is the normal case for a standalone client. Same mechanism
     * as `PageBridge.call()`.
     */
    // AS3: .../NameChangeView.as::showConfirmationView() (its ExternalInterface tail)
    private notifyPage(name: string): void
    {
        let scope: Record<string, unknown> = window as unknown as Record<string, unknown>;
        let target: unknown = scope;

        for(const segment of NameChangeView.NAME_UPDATE_FUNCTION.split('.'))
        {
            if(target == null || typeof target !== 'object') return;

            scope = target as Record<string, unknown>;
            target = scope[segment];
        }

        if(typeof target !== 'function') return;

        (target as (this: unknown, value: string) => void).call(scope, name);
    }

    // AS3: .../NameChangeView.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../NameChangeView.as::disposeWindow()
    private disposeWindow(): void
    {
        this._mainPage = null;
        this._selectionPage = null;
        this._confirmationPage = null;
        this._visiblePage = null;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }
    }

    // AS3: .../NameChangeView.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this.disposeWindow();

        if(this._suggestionRenderer !== null)
        {
            this._suggestionRenderer.dispose();
            this._suggestionRenderer = null;
        }

        // AS3 keeps its `INameChangeUI` reference here; the controller drops the whole view.
        this._disposed = true;
    }
}
