/**
 * NameChangeDialog
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/onBoardingHc/NameChangeDialog.as
 *
 * The "pick a name" half of the onboarding: an input box that asks the server whether the typed
 * name is free 500ms after the last keystroke, and claims it when the editor submits.
 *
 * Two behaviours that look like bugs and are what the 701 source does — both are ported as-is:
 * - `set nameIsCorrect()` overwrites its own argument with `true` on the first line, so the OK/alert
 *   icons and the submit button never reflect a rejected name. The `_hintBox.visible = !nameIsCorrect`
 *   in `checkNameResponse()` therefore always hides the hint.
 * - `claimName()` calls `nameChangeCompleted()` twice — once early if the name was already claimed,
 *   then again unconditionally after sending.
 *
 * `_style` is 1 here (Illumina) and 2 in `HitchNameChangeDialog`, which is the subclass the flow
 * actually builds; this class's own `init()` is the unused Illumina layout.
 */
import {Bitmap} from '../onBoardingHcUi/display/Bitmap';
import type {DisplayEvent} from '../onBoardingHcUi/display/DisplayObject';
import {Sprite} from '../onBoardingHcUi/display/DisplayObjectContainer';
import {GlowFilter} from '../onBoardingHcUi/display/Filters';
import {Rectangle} from '../onBoardingHcUi/display/Geom';
import type {TextField} from '../onBoardingHcUi/display/TextField';
import {Timer} from '../onBoardingHcUi/display/Timer';
import type {Button} from '../onBoardingHcUi/Button';
import {LoaderUI} from '../onBoardingHcUi/LoaderUI';
import type {LocalizedTextField} from '../onBoardingHcUi/LocalizedTextField';
import {LoginAssets} from '../onBoardingHcUi/LoginAssets';
import {NineSplitSprite} from '../onBoardingHcUi/NineSplitSprite';
import {WaitIndicator} from '../onBoardingHcUi/WaitIndicator';
import {ChangeUserNameResultMessageEvent} from '@habbo/communication/messages/incoming/help/ChangeUserNameResultMessageEvent';
import {CheckUserNameResultMessageEvent} from '@habbo/communication/messages/incoming/help/CheckUserNameResultMessageEvent';
import type {ChangeUserNameResultMessageParser} from '@habbo/communication/messages/parser/help/ChangeUserNameResultMessageParser';
import type {CheckUserNameResultMessageParser} from '@habbo/communication/messages/parser/help/CheckUserNameResultMessageParser';
import {ClaimNewUserNameMessageComposer} from '@habbo/communication/messages/outgoing/help/ClaimNewUserNameMessageComposer';
import {CheckUserNameMessageComposer} from '@habbo/communication/messages/outgoing/help/CheckUserNameMessageComposer';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IOnBoardingHcContext} from './IOnBoardingHcContext';

export class NameChangeDialog
{
    // AS3: IDLE_TIME_MS
    private static readonly IDLE_TIME_MS = 500;

    // AS3: _style
    protected _style: number = 1;

    // AS3: _disposed
    private _disposed: boolean = false;

    // AS3: _context
    protected _context: IOnBoardingHcContext | null;

    // AS3: _nameClaimed
    private _nameClaimed: boolean = false;

    // AS3: _dialog
    protected _dialog: Sprite | null = null;

    // AS3: _inputField
    protected _inputField: LocalizedTextField | null = null;

    // AS3: _submitButton
    protected _submitButton: Button | null = null;

    // AS3: _skipButton
    protected _skipButton: Button | null = null;

    // AS3: _errorBalloon
    private _errorBalloon: Sprite | null = null;

    // AS3: _okIcon
    protected _okIcon: Bitmap | null = null;

    // AS3: _alertIcon
    protected _alertIcon: Bitmap | null = null;

    // AS3: _inputClickedAlready
    private _inputClickedAlready: boolean = false;

    // AS3: _inputBackground
    protected _inputBackground: Bitmap | null = null;

    // AS3: _idleTimer
    private _idleTimer: Timer | null = null;

    // AS3: _waitIndicator
    protected _waitIndicator: WaitIndicator | null = null;

    // AS3: _container
    protected _container: Sprite;

    // AS3: _preSelectedGender
    private _preSelectedGender: string = '';

    // AS3: _inputDefaultString
    protected _inputDefaultString: string = '';

    // AS3: _hintBox
    protected _hintBox: Sprite | null = null;

    // AS3: _dialogWidth
    protected _dialogWidth: number;

    // AS3: _changeNameEvent
    private _changeNameEvent: IMessageEvent | null = null;

    // AS3: _checkNameEvent
    private _checkNameEvent: IMessageEvent | null = null;

    // AS3: NameChangeDialog(_arg_1:IOnBoardingHcContext, _arg_2:Sprite, _arg_3:int)
    constructor(context: IOnBoardingHcContext, container: Sprite, dialogWidth: number)
    {
        this._context = context;
        this._container = container;
        this._dialogWidth = dialogWidth;
        this.init();

        const communication = context.communicationManager;

        if(communication)
        {
            this._changeNameEvent = communication.addHabboConnectionMessageEvent(
                new ChangeUserNameResultMessageEvent(this._onChangeUserNameResult)
            );
            this._checkNameEvent = communication.addHabboConnectionMessageEvent(
                new CheckUserNameResultMessageEvent(this._onCheckUserNameResult)
            );
        }

        this._idleTimer = new Timer(NameChangeDialog.IDLE_TIME_MS, 1);
        this._idleTimer.addEventListener('timer', this._onIdleTimer);
    }

    // AS3: get disposed():Boolean
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: set preSelectedGender(_arg_1:String)
    public set preSelectedGender(value: string)
    {
        this._preSelectedGender = value;
    }

    // AS3: setNameClaimed(_arg_1:Boolean)
    public setNameClaimed(claimed: boolean): void
    {
        this._nameClaimed = claimed;
    }

    // AS3: submitName()
    public submitName(): void
    {
        this.claimName(this._inputField ? this._inputField.text : '');
    }

    /**
     * AS3: claimNameResponse(_arg_1:int, _arg_2:Object, _arg_3:Array)
     *
     * Only the OK arm advances the flow; every other code shows a message and leaves the user on
     * the dialog.
     */
    // AS3: .../src/com/sulake/habbo/friendbar/onBoardingHc/NameChangeDialog.as::claimNameResponse()
    public claimNameResponse(resultCode: number, _name: unknown, _suggestions: string[]): void
    {
        this.nameIsCorrect = false;

        switch(resultCode)
        {
            case ChangeUserNameResultMessageEvent.NAME_OK:
                this.nameIsCorrect = true;
                this._context?.nameChangeCompleted();
                this._context?.editorFinished();
                break;

            case ChangeUserNameResultMessageEvent.ERROR_NAME_TOO_LONG:
                this.showErrorMessage(
                    this._context?.getLocalization('rename.error.too_long', "OOPS! YOUR NAME'S TOO LONG TO REMEMBER") ?? ''
                );
                break;

            case ChangeUserNameResultMessageEvent.ERROR_NAME_TOO_SHORT:
                this.showErrorMessage(
                    this._context?.getLocalization('rename.error.too_short', "OOPS! YOUR NAME'S TOO SHORT TO PRONOUNCE.") ?? ''
                );
                break;

            case ChangeUserNameResultMessageEvent.ERROR_NAME_NOT_VALID:
                this.showErrorMessage(
                    this._context?.getLocalization('rename.error.words', "OOPS! THINK HARDER - THAT'S NOT A VERY NICE NAME.") ?? ''
                );
                break;

            case ChangeUserNameResultMessageEvent.ERROR_NAME_IN_USE:
            case ChangeUserNameResultMessageEvent.ERROR_NAME_CHANGE_NOT_ALLOWED:
                this.showErrorMessage(
                    this._context?.getLocalization('rename.error.taken', "OOPS! SOMEONE'S ALREADY USING THAT NAME.") ?? ''
                );
                break;
        }
    }

    // AS3: claimNameFailed(_arg_1:String) — empty in the 701 source.
    public claimNameFailed(_error: string): void
    {
        // AS3 leaves this empty.
    }

    /**
     * AS3: checkNameResponse(_arg_1:int, _arg_2:String, _arg_3:Array)
     *
     * The first guard drops answers for a name the user has already typed past.
     */
    // AS3: .../src/com/sulake/habbo/friendbar/onBoardingHc/NameChangeDialog.as::checkNameResponse()
    public checkNameResponse(resultCode: number, name: string, _suggestions: string[]): void
    {
        if(this._inputField == null || this._inputField.text !== name) return;

        if(this._waitIndicator != null)
        {
            this._waitIndicator.visible = false;
        }

        this.nameIsCorrect = false;

        switch(resultCode)
        {
            case ChangeUserNameResultMessageEvent.NAME_OK:
                this.nameIsCorrect = true;
                break;

            case ChangeUserNameResultMessageEvent.ERROR_NAME_TOO_LONG:
                this.showErrorMessage(
                    this._context?.getLocalization('rename.error.too_long', "OOPS! YOUR NAME'S TOO LONG TO REMEMBER") ?? ''
                );
                break;

            case ChangeUserNameResultMessageEvent.ERROR_NAME_TOO_SHORT:
                this.showErrorMessage(
                    this._context?.getLocalization('rename.error.too_short', "OOPS! YOUR NAME'S TOO SHORT TO PRONOUNCE.") ?? ''
                );
                break;

            case ChangeUserNameResultMessageEvent.ERROR_NAME_NOT_VALID:
                this.showErrorMessage(
                    this._context?.getLocalization('rename.error.words', "OOPS! THINK HARDER - THAT'S NOT A VERY NICE NAME.") ?? ''
                );
                break;

            case ChangeUserNameResultMessageEvent.ERROR_NAME_IN_USE:
            case ChangeUserNameResultMessageEvent.ERROR_NAME_CHANGE_NOT_ALLOWED:
                this.showErrorMessage(
                    this._context?.getLocalization('rename.error.taken', "OOPS! SOMEONE'S ALREADY USING THAT NAME.") ?? ''
                );
                break;
        }

        if(this._hintBox != null)
        {
            this._hintBox.visible = !this.nameIsCorrect;
            this._context?.showHideButtons(this.nameIsCorrect);
        }
    }

    // AS3: checkNameFailed(_arg_1:String) — empty in the 701 source.
    public checkNameFailed(_error: string): void
    {
        // AS3 leaves this empty.
    }

    /**
     * AS3: init()
     *
     * The Illumina (style 1) layout. `HitchNameChangeDialog` overrides it wholesale.
     */
    // AS3: .../src/com/sulake/habbo/friendbar/onBoardingHc/NameChangeDialog.as::init()
    protected init(): void
    {
        if(!this._context) return;

        this._dialog = LoaderUI.createFrame(
            this._context.getLocalization('rename.title', 'Pick a name for your character'),
            '',
            new Rectangle(-this._dialogWidth / 2, 0, this._dialogWidth, 1),
            this._style
        );

        const innerWidth = this._dialogWidth - 23 * 2;

        this._dialog.x = 5;

        const subtitle = LoaderUI.createTextField(
            this._context.getLocalization('rename.subtitle', 'You are a unique and beautiful snowflake.'),
            20,
            0,
            true,
            false,
            false,
            false
        );

        subtitle.x = 23;
        LoaderUI.addEtching(subtitle);

        const description = LoaderUI.createTextField(
            this._context.getLocalization(
                'rename.description',
                'In Habbo, we all sign in using a unique name, so go ahead and enter yours. '
                + "There's no need to use your real one - stage names are perfectly ok."
            ),
            12,
            0,
            false,
            true,
            false,
            false
        );

        this._dialog.addChild(description);
        description.x = 23;
        description.width = innerWidth;
        LoaderUI.addEtching(description);

        const inputHolder = new Sprite();

        this._inputBackground = new Bitmap(NineSplitSprite.INPUT_FIELD.render(innerWidth, 50));
        inputHolder.addChild(this._inputBackground);
        this._dialog.addChild(inputHolder);
        inputHolder.x = 23;

        const accepted = LoaderUI.createTextField(
            this._context.getLocalization('rename.accepted', 'WE ACCEPT LETTERS AND NUMBERS. NOT VISA OR MASTERCARD.'),
            9,
            4342338,
            true,
            false,
            false,
            false
        );

        this._dialog.addChild(accepted);
        accepted.x = 23 + 5;
        LoaderUI.addEtching(accepted);

        const warning = LoaderUI.createTextField(
            this._context.getLocalization(
                'rename.warning',
                "Once you've selected a name for your character, you can't change it anymore, "
                + 'so please pay a bit of attention to your selection.'
            ),
            16,
            4342338,
            false,
            true,
            false,
            false
        );

        warning.width = innerWidth - 66;
        LoaderUI.addEtching(warning);

        const sunkBorder = new Bitmap(NineSplitSprite.BORDER_SUNK.render(innerWidth, warning.height + 24));

        this._hintBox = new Sprite();
        this._hintBox.addChild(sunkBorder);
        this._hintBox.addChild(warning);
        warning.x = 50;
        warning.y = 12;
        this._dialog.addChild(this._hintBox);
        this._hintBox.x = 23;

        this._inputDefaultString = this._context.getLocalization('name', 'Click here to type a name');
        this._inputField = LoaderUI.createTextField(this._inputDefaultString, 14, 8947848, true, false, true, false);
        this._dialog.addChild(this._inputField);
        this._inputField.x = inputHolder.x + 16;
        this._inputField.y = inputHolder.y + Math.trunc((inputHolder.height - this._inputField.height) / 2);
        this._inputField.width = inputHolder.width - 30;
        this._inputField.addEventListener('click', this._onInputClicked);
        this._inputField.addEventListener('change', this._onInputChange);

        this._waitIndicator = new WaitIndicator(this._style);
        this._dialog.addChild(this._waitIndicator);
        this._waitIndicator.y = inputHolder.y + Math.trunc(inputHolder.height / 2);
        this._waitIndicator.x = inputHolder.x + inputHolder.width - 15;
        this._waitIndicator.visible = false;
        inputHolder.addEventListener('click', this._onInputBackgroundClicked);
        LoaderUI.resizeFrame(this._dialog, this._dialogWidth, -50);
        this._dialog.y = 25;
        this._container.addChild(this._dialog);
    }

    /**
     * AS3: get nameIsCorrect():Boolean / set nameIsCorrect(_arg_1:Boolean)
     *
     * The setter's first statement is `_arg_1 = true` in the 701 source — see the class header.
     */
    // AS3: .../src/com/sulake/habbo/friendbar/onBoardingHc/NameChangeDialog.as::get nameIsCorrect()
    protected get nameIsCorrect(): boolean
    {
        return this._okIcon != null && this._okIcon.visible;
    }

    /**
	 * The argument really is discarded, and that is AS3's own doing rather than a porting slip:
	 * line 366 of `NameChangeDialog.as` opens with `param1 = true;`, overwriting the parameter
	 * before the two visibility lines read it. The tick is therefore always shown and the alert
	 * always hidden, whatever the caller passed. Ported as found, and said here because
	 * `const value = true` otherwise reads exactly like the bug it is faithfully reproducing.
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/onBoardingHc/NameChangeDialog.as::set nameIsCorrect()
    protected set nameIsCorrect(_value: boolean)
    {
        const value = true;

        if(this._okIcon != null)
        {
            this._okIcon.visible = value;
        }

        if(this._alertIcon != null)
        {
            this._alertIcon.visible = !value;
        }

        if(this._submitButton != null)
        {
            this._submitButton.active = true;

            if(this._style === 2)
            {
                this._submitButton.visible = true;
                this._submitButton.active = this.nameChanged ? value : true;
            }
            else
            {
                this._submitButton.visible = value && this.nameChanged;
            }
        }

        if(this._skipButton != null && this._style === 2)
        {
            this._skipButton.visible = this.nameChanged;
        }
    }

    // AS3: get nameChanged():Boolean
    private get nameChanged(): boolean
    {
        if(this._inputField == null) return false;

        return this._inputField.text !== (this._context?.getLocalization('name', this._inputDefaultString) ?? '');
    }

    // AS3: onInputChange(_arg_1:Event)
    protected _onInputChange = (_event: DisplayEvent | null): void =>
    {
        if(this._idleTimer != null)
        {
            this._idleTimer.reset();
            this._idleTimer.start();
        }

        this.removeIndicators();
    };

    // AS3: onInputBackgroundClicked(_arg_1:MouseEvent)
    protected _onInputBackgroundClicked = (): void =>
    {
        const stage = this._context?.stage;

        if(stage && this._inputField)
        {
            stage.focus = this._inputField as TextField;
        }

        this._onInputClicked(null);
    };

    /**
     * AS3: onInputClicked(_arg_1:Event)
     *
     * The first click empties the prompt text rather than hiding a separate field.
     */
    protected _onInputClicked = (event: DisplayEvent | null): void =>
    {
        if(event != null)
        {
            const stage = this._context?.stage;

            if(stage && this._inputField)
            {
                stage.focus = this._inputField as TextField;
            }
        }

        if(this._inputClickedAlready) return;

        if(this._inputField == null) return;

        this._inputClickedAlready = true;
        this._inputField.text = '';
        this._inputField.textColor = this._style === 2 ? 6710886 : 0;
        this._inputField.removeEventListener('click', this._onInputClicked);
        this._onInputChange(null);
    };

    // AS3: onIdleTimer(_arg_1:TimerEvent)
    private _onIdleTimer = (): void =>
    {
        this.checkName(this._inputField ? this._inputField.text : '');
    };

    // AS3: onChangeUserNameResult(_arg_1:ChangeUserNameResultMessageEvent)
    private _onChangeUserNameResult = (rawEvent: IMessageEvent): void =>
    {
        const event = rawEvent as ChangeUserNameResultMessageEvent;

        if(event == null) return;

        const parser = event.getParser<ChangeUserNameResultMessageParser>();

        if(parser == null) return;

        this.claimNameResponse(parser.resultCode, parser.name, parser.nameSuggestions);
    };

    // AS3: onCheckUserNameResult(_arg_1:CheckUserNameResultMessageEvent)
    private _onCheckUserNameResult = (rawEvent: IMessageEvent): void =>
    {
        const event = rawEvent as CheckUserNameResultMessageEvent;

        if(event == null) return;

        const parser = event.getParser<CheckUserNameResultMessageParser>();

        if(parser == null) return;

        this.checkNameResponse(parser.resultCode, parser.name, parser.nameSuggestions);
    };

    /**
     * AS3: claimName(_arg_1:String)
     *
     * `nameChangeCompleted()` is called twice when the name was already claimed — as written.
     */
    // AS3: .../src/com/sulake/habbo/friendbar/onBoardingHc/NameChangeDialog.as::claimName()
    private claimName(name: string): void
    {
        if(this._nameClaimed)
        {
            this._context?.nameChangeCompleted();
        }

        // AS3 sends `_SafeCls_3401` (879) here, NOT the help-side `_SafeCls_3913` (1703) this used
        // to send. The two are different messages with different servers behind them; the claim
        // was arriving as a rename request.
        this._context?.communicationManager?.connection?.send(new ClaimNewUserNameMessageComposer(name));
        this._context?.nameChangeCompleted();
    }

    // AS3: checkName(_arg_1:String)
    private checkName(name: string): void
    {
        if(!name || name.length === 0) return;

        this._context?.communicationManager?.connection?.send(new CheckUserNameMessageComposer(name));

        if(this._waitIndicator != null)
        {
            this._waitIndicator.visible = true;
        }
    }

    /**
     * AS3: showErrorMessage(_arg_1:String)
     *
     * Style 1 gets a balloon under the field; style 2 gets a flat alert strip sized to the text.
     */
    // AS3: .../src/com/sulake/habbo/friendbar/onBoardingHc/NameChangeDialog.as::showErrorMessage()
    private showErrorMessage(message: string): void
    {
        if(!this._inputBackground || !this._dialog) return;

        let width = this._inputBackground.width;
        const height = this._inputBackground.height;

        this._inputBackground.bitmapData = this._style === 2
            ? NineSplitSprite.INPUT_ERROR_HITCH.render(width, height)
            : NineSplitSprite.INPUT_ERROR.render(width, height);
        this.removeIndicators();

        if(this._alertIcon != null)
        {
            this._alertIcon.visible = true;
        }

        this._errorBalloon = new Sprite();

        if(this._style === 1)
        {
            const messageField = LoaderUI.createTextField(message, 9, 16777215, true);
            const balloon = LoaderUI.createBalloon(messageField.width + 30, messageField.height + 17, -1, true, 11411485);

            this._errorBalloon.addChild(balloon);
            this._errorBalloon.addChild(messageField);
            messageField.x = 15;
            messageField.y = 14;
        }
        else
        {
            const messageField = LoaderUI.createTextField(message, 10, 16777215);
            // AS3 embeds input_error_alert_hitch_png as an instance field; the port reads it from
            // the shared bitmap registry.
            const strip = LoaderUI.createScale9GridShapeFromImage(
                LoginAssets.get('input_error_alert_hitch'),
                new Rectangle(3, 3, 5, 5)
            );

            width = this._inputBackground.width;

            if(messageField.width > width)
            {
                width = messageField.width + 20;
            }

            strip.width = width;
            strip.height = this._inputBackground.height - 11;
            this._errorBalloon.addChild(strip);
            this._errorBalloon.addChild(messageField);
            messageField.x = 16;
            messageField.y = Math.trunc((strip.height - messageField.height) / 2);
        }

        this._dialog.addChild(this._errorBalloon);

        const holder = this._inputBackground.parent;

        if(this._style === 1)
        {
            this._errorBalloon.x = Math.trunc((this._dialog.width - this._errorBalloon.width) / 2);
            this._errorBalloon.y = (holder?.y ?? 0) + this._inputBackground.height;
            this._errorBalloon.filters = [new GlowFilter(0, 0.24, 6, 6)];
        }
        else
        {
            this._errorBalloon.x = holder?.x ?? 0;
            this._errorBalloon.y = (holder?.y ?? 0) + this._inputBackground.height + 4;
        }
    }

    // AS3: removeIndicators()
    private removeIndicators(): void
    {
        if(!this._inputBackground || !this._dialog) return;

        if(this._errorBalloon != null && this._dialog.contains(this._errorBalloon))
        {
            const width = this._inputBackground.width;
            const height = this._inputBackground.height;

            this._inputBackground.bitmapData = this._style === 2
                ? NineSplitSprite.INPUT_CORRECTED_HITCH.render(width, height)
                : NineSplitSprite.INPUT_CORRECTED.render(width, height);
            this._dialog.removeChild(this._errorBalloon);
        }

        if(this._okIcon)
        {
            this._okIcon.visible = false;
        }

        if(this._alertIcon != null)
        {
            this._alertIcon.visible = false;
        }
    }

    // AS3: dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        const communication = this._context?.communicationManager;

        if(communication)
        {
            if(this._changeNameEvent) communication.removeHabboConnectionMessageEvent(this._changeNameEvent);

            if(this._checkNameEvent) communication.removeHabboConnectionMessageEvent(this._checkNameEvent);
        }

        if(this._dialog)
        {
            this._container.removeChild(this._dialog);
        }

        if(this._waitIndicator != null)
        {
            this._waitIndicator.dispose();
            this._waitIndicator = null;
        }

        this._idleTimer?.dispose();
        this._idleTimer = null;
        this._inputField = null;
        this._submitButton = null;
        this._skipButton = null;
        this._errorBalloon = null;
        this._okIcon = null;
        this._inputBackground = null;
        this._dialog = null;
        this._context = null;
        this._disposed = true;
    }
}
