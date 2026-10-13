import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ISelectableWindow} from '@ambreia/ui/components/ISelectableWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';

/** The login form (vortex_auth_login_xml): e-mail, password, « Se souvenir de moi », its error line. */
export class LoginForm
{
    /** No reset route on the server yet; the e-mail remembered, if any, filled in. */
    prepare(dialog: IWindowContainer, remembered: string | null): void
    {
        for(const name of ['forgot_link', 'login_error'])
        {
            const window = dialog.findChildByName(name);

            if(window) window.visible = false;
        }

        if(!remembered) return;

        const input = dialog.findChildByName('identifier_input') as ITextFieldWindow | null;

        if(input) input.text = remembered;
        (dialog.findChildByName('remember_me') as ISelectableWindow | null)?.select();
    }

    read(dialog: IWindowContainer): {email: string; password: string; remember: boolean}
    {
        return {
            email: (dialog.findChildByName('identifier_input') as ITextFieldWindow | null)?.text.trim() ?? '',
            password: (dialog.findChildByName('password_input') as ITextFieldWindow | null)?.text ?? '',
            remember: (dialog.findChildByName('remember_me') as ISelectableWindow | null)?.isSelected ?? false
        };
    }

    showError(dialog: IWindowContainer, text: string): void
    {
        const error = dialog.findChildByName('login_error');

        if(!error) return;

        error.caption = text;
        error.visible = true;
    }
}
