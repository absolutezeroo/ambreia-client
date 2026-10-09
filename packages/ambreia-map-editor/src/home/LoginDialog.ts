import type {ISelectableWindow} from '@ambreia/ui/components/ISelectableWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowKeyboardEvent} from '@ambreia/ui/events/WindowKeyboardEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import {describe} from '../panels/html';
import {child, setText, setVisible} from '../ui/bind';
import type {EditorTexts} from '../ui/EditorTexts';
import type {HomeScreen} from './HomeScreen';

const ENTER = 13;
const EMAIL_KEY = 'ambreia.editor.email';

/**
 * The game's login form (vortex_auth_login_xml) in the home screen's slot: the web account's
 * sign-in, which sets the session cookie the editor routes read. Accounts are made on the site,
 * and the server has no reset route yet: no registration, no "forgotten password" here.
 */
export class LoginDialog
{
    private readonly _window: IWindowContainer;
    private _busy = false;

    constructor(manager: WindowManager, private readonly _home: HomeScreen, private readonly _api: EditorApiClient, private readonly _texts: EditorTexts)
    {
        const window = manager.buildWidgetLayout('vortex_auth_login_xml') as IWindowContainer | null;

        if(!window) throw new Error('vortex_auth_login_xml is not registered');

        this._window = window;
        window.caption = `${_texts.get('vortex.auth.login')} - ${_texts.get('vortex.mapeditor.title')}`;
        // Nothing to go back to: the editor needs a session.
        for(const name of ['header_button_close', 'forgot_link', 'no_account_txt', 'register_button']) setVisible(window, name, false);

        // The form ends at its login button now.
        const login = child(window, 'login_button');
        const register = child(window, 'register_button');

        if(login && register) window.height -= register.y + register.height - (login.y + login.height);

        // The layout says `password`; the text field's property is `displayAsPassword`.
        const password = this.input('password_input');

        if(password) password.displayAsPassword = true;
    }

    /** Shows the form until the server accepts a sign-in; reason is why it is asked (expired session…). */
    signIn(reason = ''): Promise<void>
    {
        const remembered = this.remembered();

        if(remembered)
        {
            this.input('identifier_input')!.text = remembered;
            child<ISelectableWindow>(this._window, 'remember_me')?.select();
        }

        this.error(reason);
        this._home.mount(this._window);

        return new Promise(resolve =>
        {
            this._window.procedure = (event: WindowEvent, window: IWindow) =>
            {
                const enter = event.type === 'WKE_KEY_DOWN' && (event as WindowKeyboardEvent).keyCode === ENTER;

                if(enter || (event.type === 'WME_CLICK' && window.name === 'login_button')) void this.submit(resolve);
            };
        });
    }

    dispose(): void
    {
        this._window.destroy();
    }

    private async submit(done: () => void): Promise<void>
    {
        const email = this.input('identifier_input')?.text.trim() ?? '';
        const password = this.input('password_input')?.text ?? '';

        if(this._busy) return;
        if(!email || !password)
        {
            this.error(this._texts.get('vortex.auth.error.credentials'));

            return;
        }

        this._busy = true;
        this._window.disable();
        try
        {
            await this._api.login(email, password);
            this.remember(child<ISelectableWindow>(this._window, 'remember_me')?.isSelected ? email : null);
            done();
        }
        catch (error)
        {
            this.error(describe(error));
        }
        finally
        {
            this._busy = false;
            this._window.enable();
        }
    }

    private error(text: string): void
    {
        setText(this._window, 'login_error', text);
        setVisible(this._window, 'login_error', text !== '');
    }

    private input(name: string): ITextFieldWindow | null
    {
        return child<ITextFieldWindow>(this._window, name);
    }

    private remembered(): string
    {
        try
        {
            return localStorage.getItem(EMAIL_KEY) ?? '';
        }
        catch
        {
            return '';
        }
    }

    private remember(email: string | null): void
    {
        try
        {
            if(email) localStorage.setItem(EMAIL_KEY, email);
            else localStorage.removeItem(EMAIL_KEY);
        }
        catch
        {
            // Not remembered: harmless.
        }
    }
}
