import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ISelectableWindow} from '@ambreia/ui/components/ISelectableWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import {passwordStrength} from '../AuthForm';
import type {IRegisterForm} from '../IRegisterForm';

/** The strength bars' colours: unused, weak, medium, strong. */
const STRENGTH_COLORS = [0xffd0d0c8, 0xffd04030, 0xffe0a020, 0xff4caa30];
const STRENGTH_KEYS = ['', 'vortex.auth.strength.weak', 'vortex.auth.strength.medium', 'vortex.auth.strength.strong'];

/** The registration form (vortex_auth_register_xml): e-mail, password and its strength, its confirmation, the terms. */
export class RegisterForm
{
    constructor(private readonly _text: (key: string) => string) {}

    /** The account has no name of its own (the server keeps an e-mail): characters do. Its row goes. */
    prepare(dialog: IWindowContainer, slot: IWindowContainer): void
    {
        for(const name of ['username_label', 'username_status'])
        {
            const window = dialog.findChildByName(name);

            if(window) window.visible = false;
        }

        const username = dialog.findChildByName('username_input')?.parent;

        if(username) username.visible = false;
        this.closeUsernameGap(dialog, slot);
        this.refresh(dialog);
    }

    /** The password's strength and whether the confirmation matches, as they are typed. */
    refresh(dialog: IWindowContainer): void
    {
        const password = this.field(dialog, 'password_input');
        const confirm = this.field(dialog, 'confirm_input');
        const strength = passwordStrength(password);

        for(let i = 0; i < 3; i++)
        {
            const bar = dialog.findChildByName(`strength_${i}`);

            if(bar) bar.color = STRENGTH_COLORS[i < strength ? strength : 0];
        }

        this.setText(dialog, 'strength_txt', strength === 0 ? '' : this._text(STRENGTH_KEYS[strength]));

        const status = dialog.findChildByName('confirm_status');

        if(status)
        {
            status.visible = confirm.length > 0;
            this.setText(status as IWindowContainer, 'status_txt', this._text(password === confirm ? 'vortex.auth.field.matching' : 'vortex.auth.field.mismatch'));
        }
    }

    read(dialog: IWindowContainer): IRegisterForm
    {
        return {
            email: this.field(dialog, 'email_input').trim(),
            password: this.field(dialog, 'password_input'),
            confirm: this.field(dialog, 'confirm_input'),
            acceptTerms: (dialog.findChildByName('accept_terms') as ISelectableWindow | null)?.isSelected ?? false,
            acceptPrivacy: (dialog.findChildByName('accept_privacy') as ISelectableWindow | null)?.isSelected ?? false
        };
    }

    /** Moves the form up over the hidden username row, and shrinks it to match. */
    private closeUsernameGap(dialog: IWindowContainer, slot: IWindowContainer): void
    {
        const content = dialog.findChildByName('content') as IWindowContainer | null;
        const from = dialog.findChildByName('username_label');
        const to = dialog.findChildByName('email_label');

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

    private field(dialog: IWindowContainer, name: string): string
    {
        return (dialog.findChildByName(name) as ITextFieldWindow | null)?.text ?? '';
    }

    private setText(container: IWindowContainer, name: string, text: string): void
    {
        const window = container.findChildByName(name);

        if(window && window.caption !== text) window.caption = text;
    }
}
