import {Logger} from '@ambreia/common/utils/Logger';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowKeyboardEvent} from '@ambreia/ui/events/WindowKeyboardEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ISelectableWindow} from '@ambreia/ui/components/ISelectableWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IHabboLocalizationManager} from '../../localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {AuthApi, AuthApiError} from './AuthApi';
import {isEmail, passwordStrength, registerProblem} from './AuthForm';

const log = Logger.getLogger('habbo.features.login.LoginScreen');

const LAYER = 1;
/** The size vortex_auth_screen_xml is drawn at. */
const DESIGN = {width: 1280, height: 720};
const ENTER = 13;
const REMEMBER_KEY = 'ambreia:login.email';
/** The strength bars' colours: unused, weak, medium, strong. */
const STRENGTH_COLORS = [0xffd0d0c8, 0xffd04030, 0xffe0a020, 0xff4caa30];
const STRENGTH_KEYS = ['', 'vortex.auth.strength.weak', 'vortex.auth.strength.medium', 'vortex.auth.strength.strong'];

/** The server's codes and the form's own, to the text shown for them. */
const ERROR_KEYS: Record<string, string> = {
    'pocket.auth.login_failed': 'vortex.auth.error.credentials',
    'pocket.auth.invalid_login': 'vortex.auth.error.credentials',
    'pocket.auth.missing_credentials': 'vortex.auth.error.credentials',
    'pocket.auth.email_already_taken': 'vortex.auth.error.email_taken',
    'pocket.auth.password_too_short': 'vortex.auth.error.password_short',
    'pocket.auth.password_too_long': 'vortex.auth.error.password_long',
    email_invalid: 'vortex.auth.field.invalid',
    password_mismatch: 'vortex.auth.field.mismatch',
    terms_not_accepted: 'vortex.auth.error.terms',
    rate_limited: 'vortex.auth.error.rate_limited',
    network: 'vortex.auth.error.network'
};

type Dialog = 'login' | 'register';

/**
 * The login screen (F3a §6.4, vortex_auth_screen_xml): the backdrop, and in its dialog slot the
 * login or the registration form. Signing in goes through the web API, which answers with the
 * account ticket the socket logs in with. The screen stays up behind the characters screen and
 * is disposed once the player is in the world.
 */
export class LoginScreen
{
    private _screen: IWindowContainer | null = null;
    private _dialog: IWindowContainer | null = null;
    private _shown: Dialog | null = null;
    private _busy = false;
    private _resolve: ((ticket: string) => void) | null = null;
    private _disposed = false;

    private readonly _onResize = (): void => this.place();

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _localization: IHabboLocalizationManager | null,
        private readonly _api = new AuthApi(),
        private readonly _version = ''
    ) {}

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
        this.hide(this._screen, 'language_menu', 'options_link', 'quit_link');

        this.setText(this._screen, 'version_txt', this.text('vortex.auth.version', 'version', this._version));
        desktop.addChild(this._screen);
        this._screen.addEventListener('WE_PARENT_RESIZED', this._onResize);
        this.place();

        return true;
    }

    private place(): void
    {
        const desktop = this._windows.getDesktop(LAYER);

        if(!desktop || !this._screen) return;

        const screen = this._screen;
        const width = desktop.width;
        const height = desktop.height;
        const at = (name: string): IWindow | null => screen.findChildByName(name);
        const set = (name: string, values: Partial<Pick<IWindow, 'x' | 'y' | 'width' | 'height'>>): void =>
        {
            const window = at(name);

            if(window) Object.assign(window, values);
        };

        // The whole desktop: the backdrop covers it at its own proportions, the rest keeps its
        // place relative to the centre or to the bottom edge of the 1280 × 720 mock-up.
        Object.assign(screen, {x: 0, y: 0, width, height});
        set('backdrop_color', {x: 0, y: 0, width, height});

        const backdrop = at('backdrop') as (IWindow & {stretchedX: boolean; stretchedY: boolean}) | null;

        if(backdrop)
        {
            const scale = Math.max(width / DESIGN.width, height / DESIGN.height);
            const cover = {width: Math.ceil(DESIGN.width * scale), height: Math.ceil(DESIGN.height * scale)};

            backdrop.stretchedX = backdrop.stretchedY = true;
            Object.assign(backdrop, {...cover, x: Math.round((width - cover.width) / 2), y: Math.round((height - cover.height) / 2)});
        }

        const centreX = (name: string, designY: number): void =>
        {
            const window = at(name);

            if(window) Object.assign(window, {x: Math.round((width - window.width) / 2), y: Math.round(height / 2 + designY - DESIGN.height / 2)});
        };

        centreX('logo', 6);
        centreX('dialog_slot', 235);
        set('footer_bg', {x: 0, y: height - 30, width});
        set('version_txt', {y: height - 23});
    }

    private showDialog(dialog: Dialog): void
    {
        const slot = this._screen && this.find(this._screen, 'dialog_slot') as IWindowContainer | null;

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
            const field = this.input(name);

            if(field) field.displayAsPassword = true;
        }

        if(dialog === 'login')
        {
            // No reset route on the server yet.
            this.hide(this._dialog, 'forgot_link', 'login_error');

            const remembered = this.remembered();

            if(remembered)
            {
                this.input('identifier_input')!.text = remembered;
                (this.find(this._dialog, 'remember_me') as ISelectableWindow | null)?.select();
            }
        }
        else
        {
            // The account has no name of its own (the server keeps an e-mail): characters do.
            this.hide(this._dialog, 'username_label', 'username_status');

            const username = this.find(this._dialog, 'username_input')?.parent;

            if(username) username.visible = false;
            this.closeUsernameGap(slot);
            this.refreshRegisterFields();
        }
    }

    /** Moves the registration form up over the hidden username row, and shrinks it to match. */
    private closeUsernameGap(slot: IWindowContainer): void
    {
        const dialog = this._dialog!;
        const content = this.find(dialog, 'content') as IWindowContainer | null;
        const from = this.find(dialog, 'username_label');
        const to = this.find(dialog, 'email_label');

        if(!content || !from || !to) return;

        const gap = to.y - from.y;

        for(let i = 0; i < content.numChildren; i++)
        {
            const child = content.getChildAt(i);

            if(child && child.y >= to.y) child.y -= gap;
        }

        content.height -= gap;
        dialog.height -= gap;
        dialog.y = Math.round((slot.height - dialog.height) / 2);
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
            this.refreshRegisterFields();

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
        const email = this.input('identifier_input')?.text.trim() ?? '';
        const password = this.input('password_input')?.text ?? '';

        if(!isEmail(email) || password.length === 0)
        {
            this.showLoginError('pocket.auth.missing_credentials');

            return;
        }

        const remember = (this.find(this._dialog!, 'remember_me') as ISelectableWindow | null)?.isSelected ?? false;

        await this.run(async () =>
        {
            await this._api.login(email, password);
            this.remember(remember ? email : null);
        });
    }

    private async submitRegister(): Promise<void>
    {
        const form = {
            email: this.input('email_input')?.text.trim() ?? '',
            password: this.input('password_input')?.text ?? '',
            confirm: this.input('confirm_input')?.text ?? '',
            acceptTerms: (this.find(this._dialog!, 'accept_terms') as ISelectableWindow | null)?.isSelected ?? false,
            acceptPrivacy: (this.find(this._dialog!, 'accept_privacy') as ISelectableWindow | null)?.isSelected ?? false
        };
        const problem = registerProblem(form);

        if(problem)
        {
            this.alert(problem);

            return;
        }

        await this.run(() => this._api.register(form.email, form.password, form.confirm));
    }

    /** One request at a time; on success the account ticket ends the screen's part. */
    private async run(signIn: () => Promise<void>): Promise<void>
    {
        if(this._busy) return;

        this._busy = true;
        this._dialog?.disable();

        try
        {
            await signIn();

            const ticket = await this._api.accountTicket();

            if(this._disposed) return;

            this._dialog?.destroy();
            this._dialog = null;
            this._shown = null;
            this._resolve?.(ticket);
            this._resolve = null;
        }
        catch (error)
        {
            const code = error instanceof AuthApiError ? error.code : 'unknown';

            log.info(`sign in refused: ${code}`);
            if(this._shown === 'login') this.showLoginError(code);
            else this.alert(code);
        }
        finally
        {
            this._busy = false;
            this._dialog?.enable();
        }
    }

    private refreshRegisterFields(): void
    {
        const dialog = this._dialog;

        if(!dialog) return;

        const password = this.input('password_input')?.text ?? '';
        const confirm = this.input('confirm_input')?.text ?? '';
        const strength = passwordStrength(password);

        for(let i = 0; i < 3; i++)
        {
            const bar = this.find(dialog, `strength_${i}`);

            if(bar) bar.color = STRENGTH_COLORS[i < strength ? strength : 0];
        }

        this.setText(dialog, 'strength_txt', strength === 0 ? '' : this.text(STRENGTH_KEYS[strength]));

        const status = this.find(dialog, 'confirm_status');

        if(status)
        {
            status.visible = confirm.length > 0;
            this.setText(status as IWindowContainer, 'status_txt', this.text(password === confirm ? 'vortex.auth.field.matching' : 'vortex.auth.field.mismatch'));
        }
    }

    private showLoginError(code: string): void
    {
        const error = this._dialog && this.find(this._dialog, 'login_error');

        if(!error) return;

        error.caption = this.errorText(code);
        error.visible = true;
    }

    private alert(code: string): void
    {
        this._windows.alert(this.text('vortex.auth.register'), this.errorText(code), 0, null);
    }

    private errorText(code: string): string
    {
        return this.text(ERROR_KEYS[code] ?? 'vortex.auth.error.unknown');
    }

    private remembered(): string | null
    {
        try
        {
            return localStorage.getItem(REMEMBER_KEY);
        }
        catch
        {
            return null;
        }
    }

    private remember(email: string | null): void
    {
        try
        {
            if(email) localStorage.setItem(REMEMBER_KEY, email);
            else localStorage.removeItem(REMEMBER_KEY);
        }
        catch
        {
            // Private window: nothing remembered, nothing lost.
        }
    }

    private hide(container: IWindowContainer, ...names: string[]): void
    {
        for(const name of names)
        {
            const window = container.findChildByName(name);

            if(window) window.visible = false;
        }
    }

    private input(name: string): ITextFieldWindow | null
    {
        return this._dialog ? this.find(this._dialog, name) as ITextFieldWindow | null : null;
    }

    private find(container: IWindowContainer, name: string): IWindow | null
    {
        return container.findChildByName(name);
    }

    private setText(container: IWindowContainer, name: string, text: string): void
    {
        const window = container.findChildByName(name);

        if(window && window.caption !== text) window.caption = text;
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
