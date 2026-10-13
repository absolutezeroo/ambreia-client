import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {nameRules} from '../CharacterLook';
import {RULE_BAD, RULE_OK, RULE_UNKNOWN} from './wizardLook';

/** The name step: the field, each rule lit as it is met or broken, « déjà pris » once the server said so. */
export class NameStepView
{
    constructor(private readonly _bits: WindowBits) {}

    render(page: IWindowContainer, name: string, taken: boolean): void
    {
        const input = page.findChildByName('name_input') as ITextFieldWindow | null;

        if(input && input.text !== name) input.text = name;

        this.renderRules(page, name, taken);
    }

    renderRules(page: IWindowContainer, name: string, taken: boolean): void
    {
        const rules = nameRules(name);
        const list = page.findChildByName('rule_list') as IItemListWindow | null;
        const typed = name.length > 0;
        const states = [rules.length, rules.chars, rules.spaces, taken ? false : null];

        states.forEach((ok, i) =>
        {
            const line = list?.getListItemAt(i) as IWindowContainer | null;

            if(line) this._bits.setColor(line, 'rule_icon', !typed || ok === null ? RULE_UNKNOWN : ok ? RULE_OK : RULE_BAD);
        });

        const status = page.findChildByName('name_status') as IWindowContainer | null;

        if(status)
        {
            status.visible = taken;
            this._bits.setColor(status, 'status_icon', RULE_BAD);
            this._bits.setText(status, 'status_txt', this._bits.text('vortex.auth.field.taken'));
        }
    }
}
