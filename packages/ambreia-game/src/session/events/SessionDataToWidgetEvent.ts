import {SessionDataEvent} from './SessionDataEvent';

/**
 * Session data event forwarded to widgets.
 *
 * @see sources/win63_version/habbo/session/events/SessionDataToWidgetEvent.as
 */
export class SessionDataToWidgetEvent extends SessionDataEvent
{
    static readonly PURCHASABLE_STYLES_UPDATED: string = 'SDTWE_PURCHASABLE_STYLES_UPDATED';

    constructor(type: string, bubbles: boolean = false, cancelable: boolean = false)
    {
        super(type, bubbles, cancelable);
    }
}
