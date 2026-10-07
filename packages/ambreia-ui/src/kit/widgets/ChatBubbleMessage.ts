/**
 * One message inside a chat bubble: either a line of text, or a habbicon.
 *
 * The discriminator matters at render time — a habbicon is drawn from the widget's
 * `habbicon_template` list item rather than written into the bubble's caption — and it
 * matters to `ChatEntry.messageText`, which returns the empty string for anything that is
 * not text.
 *
 * The primary tree obfuscates this class to `_SafeCls_2676` and no tree recovers it: it
 * postdates the 2016 PRODUCTION build, and `win63_version` obfuscates it under a different
 * scheme. **The name `ChatBubbleMessage` is derived**, from its package
 * (`habbo.window.widgets`), its sole consumer (`IIlluminaChatBubbleWidget`) and its two
 * factories. The member names below are real — obfuscation leaves those alone.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2676.as
 */
export class ChatBubbleMessage
{
    /** **Name derived** from its value and its use in `createBubbleMessage()`. */
    // AS3: .../window/widgets/_SafeCls_2676.as::TYPE_TEXT
    static readonly TYPE_TEXT: number = 0;

    /** **Name derived** from its value and its use in `createBubbleMessage()`. */
    // AS3: .../window/widgets/_SafeCls_2676.as::TYPE_HABBICON
    static readonly TYPE_HABBICON: number = 1;

    // AS3: .../window/widgets/_SafeCls_2676.as::_SafeCls_2676()
    constructor(type: number, text: string = '', habbiconId: number = 0)
    {
        this._type = type;
        this._text = text;
        this._habbiconId = habbiconId;
    }

    // AS3: .../window/widgets/_SafeCls_2676.as::text()
    static text(value: string): ChatBubbleMessage
    {
        return new ChatBubbleMessage(ChatBubbleMessage.TYPE_TEXT, value);
    }

    // AS3: .../window/widgets/_SafeCls_2676.as::habbicon()
    static habbicon(id: number): ChatBubbleMessage
    {
        return new ChatBubbleMessage(ChatBubbleMessage.TYPE_HABBICON, '', id);
    }

    private _type: number;

    // AS3: .../window/widgets/_SafeCls_2676.as::get type()
    get type(): number
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/_SafeCls_2676.as::_text
    private _text: string;

    // AS3: .../window/widgets/_SafeCls_2676.as::get textValue()
    get textValue(): string
    {
        return this._text;
    }

    private _habbiconId: number;

    // AS3: .../window/widgets/_SafeCls_2676.as::get habbiconId()
    get habbiconId(): number
    {
        return this._habbiconId;
    }
}
