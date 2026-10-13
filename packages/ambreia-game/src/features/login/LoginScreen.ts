import {Logger} from '@ambreia/common/utils/Logger';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowKeyboardEvent} from '@ambreia/ui/events/WindowKeyboardEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IHabboLocalizationManager} from '../../localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {AuthApi} from './AuthApi';
import {isEmail, registerProblem} from './AuthForm';
import {authErrorKey} from './screen/authErrors';
import {layOutAuthScreen} from './screen/layOutAuthScreen';
import {LoginForm} from './screen/LoginForm';
import {RegisterForm} from './screen/RegisterForm';
import {RememberedEmail} from './screen/RememberedEmail';
import {SignInFlow} from './screen/SignInFlow';

const log = Logger.getLogger('habbo.features.login.LoginScreen');

const LAYER = 1;
const ENTER = 13;

type Dialog = 'login' | 'register';

/**
 * The login screen (F3a §6.4, vortex_auth_screen_xml): the backdrop, and in its dialog slot the
 * login or the registration form. Signing in goes through the web API, which answers with the
 * account ticket the socket logs in with. The screen stays up behind the characters screen and
 * is disposed once the player is in the world. This one builds the screen and the forms and routes
 * their events; each form, the layout and the sign-in flow are their own units (screen/).
 */
export class LoginScreen
{
    private _screen: IWindowContainer | null = null;
    private _dialog: IWindowContainer | null = null;
    private _shown: Dialog | null = null;
    private _resolve: ((ticket: string) => void) | null = null;
    private readonly _login = new LoginForm();
    private readonly _register: RegisterForm;
    private readonly _remembered = new RememberedEmail();
    private readonly _flow: SignInFlow;
    private _disposed = false;

    private readonly _onResize = (): void => this.place();

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _localization: IHabboLocalizationManager | null,
        private readonly _api = new AuthApi(),
        private readonly _version = ''
    )
    {
        this._register = new RegisterForm(key => this.text(key));
        this._flow = new SignInFlow(() => this._api.accountTicket(), ticket => this.signedIn(ticket), code => this.refused(code), busy =>
        {
            if(busy) this._dialog?.disable();
            else this._dialog?.enable();
        });
    }

    /** Shows the screen until the player signs in or registers; resolves with the account ticket. */
    signIn(): Promise<string>
    {
        return new Promise(resolve =>
        {
            this._resolve = resolve;

            if(!this.build()) return;

            this.showDialog('login');
        });
    }

    private build(): boolean
    {
        if(this._screen) return true;

        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        this._screen = this._windows.buildWidgetLayout('vortex_auth_screen_xml', LAYER) as IWindowContainer | null;

        if(!this._screen || !desktop)
        {
            log.error('the login screen (vortex_auth_screen_xml) did not build — nobody can sign in');
            this._screen?.destroy();
            this._screen = null;

            return false;
        }

        // No language switch, options or quit yet: hidden rather than dead.
        for(const name of ['language_menu', 'options_link', 'quit_link'])
        {
            const window = this._screen.findChildByName(name);

            if(window) window.visible = false;
        }

        const version = this._screen.findChildByName('version_txt');

        if(version) version.caption = this.text('vortex.auth.version', 'version', this._version);
        desktop.addChild(this._screen);
        this._screen.addEventListener('WE_PARENT_RESIZED', this._onResize);
        this.place();

        return true;
    }

    private place(): void
    {
        const desktop = this._windows.getDesktop(LAYER);

        if(desktop && this._screen) layOutAuthScreen(this._screen, desktop.width, desktop.height);
    }

    private showDialog(dialog: Dialog): void
    {
        const slot = this._screen?.findChildByName('dialog_slot') as IWindowContainer | null;

        if(!slot) return;

        this._dialog?.destroy();
        this._dialog = this._windows.buildWidgetLayout(dialog === 'login' ? 'vortex_auth_login_xml' : 'vortex_auth_register_xml') as IWindowContainer | null;
        this._shown = dialog;

        if(!this._dialog)
        {
            log.error(`the ${dialog} form did not build`);

            return;
        }

        // The slot is the login form's size; the registration form is larger, centred on it.
        slot.addChild(this._dialog);
        this._dialog.x = Math.round((slot.width - this._dialog.width) / 2);
        this._dialog.y = Math.round((slot.height - this._dialog.height) / 2);
        this._dialog.procedure = this._onEvent;

        // A frame hides on its header X (FrameController.close()); on a screen that is the only way
        // forward the X is taken out instead of left dead.
        const headerClose = this._dialog.findChildByName('header_button_close');

        if(headerClose) headerClose.visible = false;

        // The layouts say `password`; the text field's property is `display_as_password`.
        for(const name of ['password_input', 'confirm_input'])
        {
            const field = this._dialog.findChildByName(name) as ITextFieldWindow | null;

            if(field) field.displayAsPassword = true;
        }

        if(dialog === 'login') this._login.prepare(this._dialog, this._remembered.get());
        else this._register.prepare(this._dialog, slot);
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WKE_KEY_DOWN' && (event as WindowKeyboardEvent).keyCode === ENTER)
        {
            void (this._shown === 'login' ? this.submitLogin() : this.submitRegister());

            return;
        }

        if(event.type === 'WE_CHANGE' && this._shown === 'register')
        {
            if(this._dialog) this._register.refresh(this._dialog);

            return;
        }

        if(event.type !== 'WME_CLICK') return;

        switch(window.name)
        {
            case 'login_button': void this.submitLogin(); break;
            case 'register_button': this.showDialog('register'); break;
            case 'create_button': void this.submitRegister(); break;
            case 'back_button': this.showDialog('login'); break;
        }
    };

    private async submitLogin(): Promise<void>
    {
        if(!this._dialog) return;

        const form = this._login.read(this._dialog);

        if(!isEmail(form.email) || form.password.length === 0)
        {
            this.refused('pocket.auth.missing_credentials');

            return;
        }

        await this._flow.run(async () =>
        {
            await this._api.login(form.email, form.password);
            this._remembered.set(form.remember ? form.email : null);
        });
    }

    private async submitRegister(): Promise<void>
    {
        if(!this._dialog) return;

        const form = this._register.read(this._dialog);
        const problem = registerProblem(form);

        if(problem)
        {
            this.refused(problem);

            return;
        }

        await this._flow.run(() => this._api.register(form.email, form.password, form.confirm));
    }

    /** The account ticket ends the screen's part. */
    private signedIn(ticket: string): void
    {
        if(this._disposed) return;

        this._dialog?.destroy();
        this._dialog = null;
        this._shown = null;
        this._resolve?.(ticket);
        this._resolve = null;
    }

    /** The login form says why on its error line; the registration form in an alert. */
    private refused(code: string): void
    {
        const text = this.text(authErrorKey(code));

        if(this._shown === 'login' && this._dialog) this._login.showError(this._dialog, text);
        else this._windows.alert(this.text('vortex.auth.register'), text, 0, null);
    }

    private text(key: string, ...params: string[]): string
    {
        return this._localization?.getLocalizationWithParams(key, key, ...params) ?? key;
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._dialog?.destroy();
        this._screen?.destroy();
        this._dialog = this._screen = null;
        this._resolve = null;
    }
}
