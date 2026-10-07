import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IFrameWindow} from '@ambreia/ui/components/IFrameWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {AvatarEditorView} from '../AvatarEditorView';
import type {IHabboAvatarEditorHost} from '../IHabboAvatarEditorHost';
import {AvatarEditorNameSuggestionListRenderer} from './AvatarEditorNameSuggestionListRenderer';
import {CheckUserNameResultMessageEvent} from '@habbo/communication/messages/incoming/help/CheckUserNameResultMessageEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';

/**
 * The rename dialog, opened beside the editor by its `avatar_name_change` button.
 *
 * It is a small state machine around one round trip: type a name, ask the server, and either take
 * it or pick from the suggestions it sends back. `_waitingForCheck` gates the whole thing — while a
 * check is in flight the input and both buttons are disabled, and the window procedure ignores
 * everything but a click.
 *
 * Note it **never sends the rename**: `select_name_button` has no branch in the handler, so the
 * dialog can validate a name and then do nothing with it. That is AS3's, and it is the reason the
 * button spends most of its life disabled.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/view/AvatarEditorNameChangeView.as
 */
export class AvatarEditorNameChangeView
{
    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::NAME_SUGGESTION_BG_COLOR
    // 0xC9EFF4. AS3 declares this a `private static var` rather than a const; nothing writes it,
    // so it is `readonly` here — which is also what the lint rule needs to allow the AS3 name.
    private static readonly NAME_SUGGESTION_BG_COLOR: number = 13232628;

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::NAME_SUGGESTION_BG_COLOR_OVER
    // 0xA9D7E3. Same treatment.
    private static readonly NAME_SUGGESTION_BG_COLOR_OVER: number = 11129827;

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::LAYOUT_ASSET
    // Name DERIVED: `HabboAvatarEditorCom.avatar_editor_name_change`, referenced as a field.
    private static readonly LAYOUT_ASSET: string = 'avatar_editor_name_change';

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::MIN_NAME_LENGTH
    // Name DERIVED: the 2 the typed name must exceed before `select_name_button` enables — so three
    // characters is the real minimum.
    private static readonly MIN_NAME_LENGTH: number = 2;

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::_window
    private _window: IFrameWindow | null;

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::_editorView
    // Name DERIVED (`_SafeStr_4684`): held only to reach the manager, in the constructor.
    private _editorView: AvatarEditorView | null;

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::_manager
    // Name DERIVED (`_SafeStr_4571`).
    private _manager: IHabboAvatarEditorHost | null;

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::_suggestionRenderer
    // Name DERIVED (`_SafeStr_6704`): rebuilt from scratch on every failed check, never disposed.
    private _suggestionRenderer: {dispose(): void} | null = null;

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::_checkedName
    private _checkedName: string | null = null;

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::_pendingName
    // Assigned only by `setNameNotAvailableView()`, which sets it to null — so it is null for this
    // dialog's whole life and the guard in `set checkedName()` can only fire for a null result.
    private _pendingName: string | null = null;

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::_waitingForCheck
    // Name DERIVED (`_SafeStr_6625`).
    private _waitingForCheck: boolean = false;

    /**
     * AS3: .../avatar/view/AvatarEditorNameChangeView.as::AvatarEditorNameChangeView()
     *
     * Opens at `(x, y)` — the editor's right-hand edge — and slides left if that would put it past
     * the desktop's right edge. There is no matching correction for the bottom.
     */
    constructor(editorView: AvatarEditorView | null, x: number, y: number)
    {
        this._editorView = editorView;
        this._manager = editorView?.editor?.manager ?? null;
        this._window = (this._manager?.windowManager?.buildWidgetLayout(
            AvatarEditorNameChangeView.LAYOUT_ASSET
        ) as IFrameWindow | null) ?? null;

        if(this._window === null) return;

        this._window.x = x;

        const desktopWidth = this._manager?.desktopWidth ?? 0;

        if(this._window.x + this._window.width > desktopWidth)
        {
            this._window.x = desktopWidth - this._window.width;
        }

        this._window.y = y;

        this.initControls();
    }

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::get window()
    // TS-only accessor over the AS3 field; `AvatarEditorView` needs it to place the dialog.
    public get window(): IFrameWindow | null
    {
        return this._window;
    }

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::focus()
    // What the editor calls when the button is clicked a second time.
    public focus(): void
    {
        this._window?.activate();
    }

    /**
     * AS3: .../avatar/view/AvatarEditorNameChangeView.as::set checkedName()
     *
     * The server said yes. The early return compares the *pending* name against the checked one —
     * and `_pendingName` is only ever set to null, so this can only skip the update when the server
     * returns a null name. Kept.
     */
    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::set checkedName()
    public set checkedName(value: string | null)
    {
        this._checkedName = value;

        if(this._pendingName === this._checkedName) return;

        this.setNameAvailableView();
    }

    /**
     * AS3: .../avatar/view/AvatarEditorNameChangeView.as::setNameAvailableView()
     *
     * Writes the accepted name back into the input, so a name that came from a suggestion click is
     * echoed, and hides the suggestion box.
     */
    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::setNameAvailableView()
    public setNameAvailableView(): void
    {
        if(this._window === null) return;

        this.nameCheckWaitEnd(true);

        const info = this._window.findChildByName('info_text') as ITextWindow | null;

        if(info === null || info === undefined) return;

        this._manager?.registerLocalizationParameter('help.tutorial.name.available', 'name', this._checkedName ?? '');
        info.text = this._manager?.getLocalization('help.tutorial.name.available') ?? '';

        const input = this._window.findChildByName('input') as ITextFieldWindow | null;

        if(input === null || input === undefined) return;

        input.text = this._checkedName ?? '';

        const suggestions = this._window.findChildByName('suggestions') as IWindowContainer | null;

        if(suggestions === null || suggestions === undefined) return;

        suggestions.visible = false;
    }

    /**
     * AS3: .../avatar/view/AvatarEditorNameChangeView.as::setNameNotAvailableView()
     *
     * One message per result code, then the suggestion chips — except for the two codes that mean
     * "you may not rename at all", which hide the box instead.
     *
     * Code 1 has an **empty** case: it clears the wait state and leaves whatever message was there
     * before. The 2016 build does the same, so it is deliberate rather than a decompilation loss.
     *
     * A fresh `AvatarEditorNameSuggestionListRenderer` is built on every call and the previous one
     * is dropped without `dispose()`. Kept.
     */
    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::setNameNotAvailableView()
    public setNameNotAvailableView(resultCode: number, name: string, suggestions: string[]): void
    {
        this.nameCheckWaitEnd(false);

        this._pendingName = null;
        this._checkedName = null;

        if(this._window === null) return;

        const info = this._window.findChildByName('info_text') as ITextWindow | null;

        if(info === null || info === undefined) return;

        switch(resultCode)
        {
            case CheckUserNameResultMessageEvent.ERROR_NAME_IN_USE:
                this._manager?.registerLocalizationParameter('help.tutorial.name.taken', 'name', name);
                info.text = this._manager?.getLocalization('help.tutorial.name.taken') ?? '';
                break;

            case CheckUserNameResultMessageEvent.ERROR_NAME_NOT_VALID:
                this._manager?.registerLocalizationParameter('help.tutorial.name.invalid', 'name', name);
                info.text = this._manager?.getLocalization('help.tutorial.name.invalid') ?? '';
                break;

            case CheckUserNameResultMessageEvent.ERROR_NAME_TOO_LONG:
                info.text = this._manager?.getLocalization('help.tutorial.name.long') ?? '';
                break;

            case CheckUserNameResultMessageEvent.ERROR_NAME_TOO_SHORT:
                info.text = this._manager?.getLocalization('help.tutorial.name.short') ?? '';
                break;

            case CheckUserNameResultMessageEvent.ERROR_NAME_CHANGE_NOT_ALLOWED:
                info.text = this._manager?.getLocalization('help.tutorial.name.change_not_allowed') ?? '';
                break;

            case CheckUserNameResultMessageEvent.ERROR_MERGE_HOTEL_DOWN:
                info.text = this._manager?.getLocalization('help.tutorial.name.merge_hotel_down') ?? '';
                break;

            // Deliberately silent — see the method note.
            case CheckUserNameResultMessageEvent.ERROR_NAME_REQUIRED:
                break;
        }

        const box = this._window.findChildByName('suggestions') as IWindowContainer | null;

        if(box === null || box === undefined) return;

        if(resultCode === CheckUserNameResultMessageEvent.ERROR_MERGE_HOTEL_DOWN
            || resultCode === CheckUserNameResultMessageEvent.ERROR_NAME_CHANGE_NOT_ALLOWED)
        {
            box.visible = false;

            return;
        }

        box.visible = true;

        const renderer = new AvatarEditorNameSuggestionListRenderer(this._manager);

        this._suggestionRenderer = renderer;
        renderer.render(suggestions, box);

        for(let index = 0; index < box.numChildren; index++)
        {
            const chip = box.getChildAt(index);

            if(chip === null) continue;

            chip.color = AvatarEditorNameChangeView.NAME_SUGGESTION_BG_COLOR;
            chip.addEventListener(WindowMouseEvent.CLICK, this.nameSelected);
            chip.addEventListener(WindowMouseEvent.OVER, this.nameOver);
            chip.addEventListener(WindowMouseEvent.OUT, this.nameOut);
        }
    }

    /**
     * AS3: .../avatar/view/AvatarEditorNameChangeView.as::setNormalView()
     *
     * The idle message and no suggestions. Called after a chip is picked, not on open — the layout
     * ships its own starting text.
     */
    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::setNormalView()
    public setNormalView(): void
    {
        if(this._window === null) return;

        const info = this._window.findChildByName('info_text') as ITextWindow | null;

        if(info === null || info === undefined) return;

        info.text = this._manager?.getLocalization('help.tutorial.name.info') ?? '';

        const suggestions = this._window.findChildByName('suggestions') as IWindowContainer | null;

        if(suggestions === null || suggestions === undefined) return;

        suggestions.visible = false;
    }

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::nameCheckWaitBegin()
    // Locks the dialog and swaps the message for "checking…". Public because the editor's own
    // window procedure calls it straight after sending the check.
    public nameCheckWaitBegin(): void
    {
        if(this._window !== null && !this._window.disposed)
        {
            this._window.findChildByName('select_name_button')?.disable();
            this._window.findChildByName('check_name_button')?.disable();
            this._window.findChildByName('input')?.disable();

            const info = this._window.findChildByName('info_text');

            if(info !== null)
            {
                info.caption = this._manager?.getLocalization('help.tutorial.name.wait_while_checking') ?? '';
            }
        }

        this._waitingForCheck = true;
    }

    /**
     * AS3: .../avatar/view/AvatarEditorNameChangeView.as::nameCheckWaitEnd()
     *
     * Unlocks. `available` false **skips** enabling `select_name_button` — it does not disable it —
     * so a rejection after a successful check leaves the button lit on a name the server has just
     * refused. Probe-confirmed. The input and the check button always come back.
     */
    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::nameCheckWaitEnd()
    public nameCheckWaitEnd(available: boolean): void
    {
        if(this._window !== null && !this._window.disposed)
        {
            if(available) this._window.findChildByName('select_name_button')?.enable();

            this._window.findChildByName('check_name_button')?.enable();
            this._window.findChildByName('input')?.enable();
        }

        this._waitingForCheck = false;
    }

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::getName()
    // Public here where AS3 has it private, so `AvatarEditorView` can send the check.
    public getName(): string | null
    {
        const input = this._window?.findChildByName('input') as ITextFieldWindow | null;

        return input?.text ?? null;
    }

    // TS-only: AS3 never disposes this view — the dialog is built once per editor and leaked. This
    // gives the editor a way to tear it down; nothing calls it yet, matching AS3.
    public dispose(): void
    {
        this._suggestionRenderer?.dispose();
        this._suggestionRenderer = null;
        this._window?.dispose();
        this._window = null;
        this._editorView = null;
        this._manager = null;
    }

    /**
     * AS3: .../avatar/view/AvatarEditorNameChangeView.as::windowEventHandler()
     *
     * Two unrelated halves. The first enables `select_name_button` as soon as the typed name passes
     * three characters — and is skipped entirely while a check is in flight. The second is the
     * click switch, which is **not** gated on the wait state: the only case it has is
     * `check_name_button`, whose own handler disables that button anyway.
     *
     * `select_name_button` and `cancel_selection_button` have no cases at all. Kept.
     */
    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::windowEventHandler()
    private windowEventHandler = (event: WindowEvent, window: IWindow): void =>
    {
        if(!this._waitingForCheck && event.type === 'WE_CHANGE' && window.name === 'input')
        {
            const button = this._window?.findChildByName('select_name_button') ?? null;
            const input = window as ITextFieldWindow;

            if(button !== null && input !== null)
            {
                if(input.text.length > AvatarEditorNameChangeView.MIN_NAME_LENGTH) button.enable();
                else button.disable();
            }
        }

        if(event.type !== 'WME_CLICK') return;

        if(window.name === 'check_name_button')
        {
            this._manager?.handler?.checkName(this.getName() ?? '');
            this.nameCheckWaitBegin();
        }
    };

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::initControls()
    // The select button starts disabled; the check button does not, so an empty name can be sent.
    private initControls(): void
    {
        if(this._window === null) return;

        this._window.procedure = this.windowEventHandler;
        this._window.findChildByName('select_name_button')?.disable();
    }

    /**
     * AS3: .../avatar/view/AvatarEditorNameChangeView.as::nameSelected()
     *
     * Picking a suggestion unlocks the dialog with `available` **true** — so the select button
     * lights up for a name that has never been checked.
     */
    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::nameSelected()
    private nameSelected = (event: WindowEvent): void =>
    {
        this.nameCheckWaitEnd(true);

        const chip = event.target as ITextWindow | null;

        if(chip === null) return;

        const name = chip.text;

        this.setNormalView();

        const input = this._window?.findChildByName('input') as ITextFieldWindow | null;

        if(input === null || input === undefined) return;

        input.text = name;
    };

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::nameOver()
    private nameOver = (event: WindowEvent): void =>
    {
        const chip = event.target;

        if(chip !== null) chip.color = AvatarEditorNameChangeView.NAME_SUGGESTION_BG_COLOR_OVER;
    };

    // AS3: .../avatar/view/AvatarEditorNameChangeView.as::nameOut()
    private nameOut = (event: WindowEvent): void =>
    {
        const chip = event.target;

        if(chip !== null) chip.color = AvatarEditorNameChangeView.NAME_SUGGESTION_BG_COLOR;
    };

    // TS-only: keeps the held-but-otherwise-unread AS3 field referenced.
    private get unused(): unknown
    {
        return this._editorView;
    }
}
