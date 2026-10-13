import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';

/**
 * The bag's search field (search_input): it opens with its placeholder as its text, cleared by the
 * first click and put back when left empty; each key typed gives the query, trimmed and lower case.
 */
export class SearchField
{
    constructor(private readonly _placeholder: () => string, private readonly _changed: (query: string) => void) {}

    /** True when the event was the field's own. */
    handle(event: WindowEvent, window: IWindow): boolean
    {
        if(window.name !== 'search_input') return false;

        const input = window as ITextFieldWindow;

        switch(event.type)
        {
            case 'WE_UNFOCUSED':
                if(input.text.trim() === '') input.text = this._placeholder();

                return true;
            case 'WKE_KEY_UP':
                this._changed(input.text.trim().toLowerCase());

                return true;
            case 'WME_CLICK':
                if(input.text === this._placeholder()) input.text = '';

                return true;
        }

        return false;
    }
}
