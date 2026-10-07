import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import {PerkAllowancesMessageEventParser} from '../../parser/perk/PerkAllowancesMessageEventParser';

/**
 * Event for perk allowance data.
 *
 * @see sources/win63_version/habbo/communication/messages/incoming/perk/PerkAllowancesMessageEvent.as
 */
export class PerkAllowancesMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PerkAllowancesMessageEventParser);
    }

    override getParser<T extends IMessageParser = PerkAllowancesMessageEventParser>(): T
    {
        return this._parser as T;
    }
}
