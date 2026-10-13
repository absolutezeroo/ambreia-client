import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowKeyboardEvent} from '@ambreia/ui/events/WindowKeyboardEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {WindowBits} from '../../../ui/kit/WindowBits';

const ENTER = 13;
const PLACEHOLDER = 'vortex.hud.chat.placeholder';

/** The chat's input (chat_input): Enter says the line, its placeholder comes and goes, a whisper or an emoticon writes into it. */
export class ChatInput
{
    /**
     * @param onSay - the line the player typed (Enter)
     * @param onActivity - the player used the input (it wakes an idle chat up)
     */
    constructor(
        private readonly _field: () => ITextFieldWindow | null,
        private readonly _bits: Pick<WindowBits, 'text'>,
        private readonly _onSay: (text: string) => void,
        private readonly _onActivity: () => void
    ) {}

    /** The input's own events; true when it took it. */
    onEvent(event: WindowEvent, window: IWindow): boolean
    {
        if(window.name !== 'chat_input') return false;

        const input = window as ITextFieldWindow;

        if(event.type === 'WKE_KEY_DOWN' && (event as WindowKeyboardEvent).keyCode === ENTER)
        {
            const text = input.text.trim();

            input.text = '';
            if(text !== '' && text !== this._bits.text(PLACEHOLDER)) this._onSay(text);
            this._onActivity();

            return true;
        }

        // The field opens with its placeholder as its text: taking the keyboard clears it. On focus as
        // well as on click: a field focused another way kept the placeholder, and it went out in front
        // of the message.
        if(event.type === 'WE_FOCUSED' || event.type === 'WME_CLICK')
        {
            this.clear();
            this._onActivity();

            return true;
        }

        // Left empty, the field shows its placeholder again.
        if(event.type === 'WE_UNFOCUSED')
        {
            if(input.text.trim() === '') input.text = this._bits.text(PLACEHOLDER);

            return true;
        }

        return false;
    }

    /** `/w ` in the field, focused: the player types the name and the message. */
    startWhisper(): void
    {
        const input = this._field();

        if(!input) return;

        input.text = '/w ';
        (input as unknown as {focus?: () => boolean}).focus?.();
    }

    /** An emoticon's text after what is typed. */
    append(text: string): void
    {
        const input = this.clear();

        if(input) input.text = `${input.text}${text}`;
    }

    /** Takes the placeholder out of the field. */
    private clear(): ITextFieldWindow | null
    {
        const input = this._field();

        if(input && input.text === this._bits.text(PLACEHOLDER)) input.text = '';

        return input;
    }
}
