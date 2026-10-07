import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';

/**
 * InfoText
 *
 * A placeholder that lives in the field's own text rather than beside it: the hint is
 * written straight into the input and cleared the first time the field is focused. While
 * the hint is still showing, `getText()` answers empty — which is what keeps a search from
 * being run against its own prompt.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/InfoText.as
 */
export class InfoText
{
    // AS3: .../InfoText.as::_SafeStr_4680
    private _input: ITextFieldWindow | null;

    // AS3: .../InfoText.as::_includeInfo
    private _includeInfo: boolean = false;

    // AS3: .../InfoText.as::_SafeStr_8059
    private _infoText: string = '';

    // AS3: .../InfoText.as::InfoText()
    constructor(input: ITextFieldWindow, infoText: string | null = null)
    {
        this._input = input;

        if(infoText !== null)
        {
            this._includeInfo = true;
            this._infoText = infoText;
            this._input.text = infoText;
        }

        this._input.addEventListener(WindowEvent.WE_FOCUSED, this.onFocus);
    }

    // AS3: .../InfoText.as::goBackToInitialState()
    goBackToInitialState(): void
    {
        if(this._input === null) return;

        this._input.text = this._infoText;
        this._includeInfo = true;
    }

    // AS3: .../InfoText.as::getText()
    getText(): string
    {
        return this._includeInfo ? '' : (this._input?.text ?? '');
    }

    // AS3: .../InfoText.as::setText()
    setText(value: string): void
    {
        this._includeInfo = false;

        if(this._input !== null) this._input.text = value;
    }

    // AS3: .../InfoText.as::get input()
    get input(): ITextFieldWindow | null
    {
        return this._input;
    }

    // AS3: .../InfoText.as::onFocus()
    private onFocus = (_event: WindowEvent): void =>
    {
        if(!this._includeInfo || this._input === null) return;

        this._input.text = '';
        this._includeInfo = false;
    };

    /** AS3 disposes the field it was handed, not just its own reference to it. */
    // AS3: .../InfoText.as::dispose()
    dispose(): void
    {
        if(this._input)
        {
            this._input.dispose();
            this._input = null;
        }
    }
}
