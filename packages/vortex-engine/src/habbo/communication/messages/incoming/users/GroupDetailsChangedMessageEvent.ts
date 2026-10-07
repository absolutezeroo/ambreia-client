import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {GroupDetailsChangedMessageParser} from '../../parser/users/GroupDetailsChangedMessageParser';

/**
 * GroupDetailsChangedMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.users.GroupDetailsChangedMessageEvent
 */
export class GroupDetailsChangedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, GroupDetailsChangedMessageParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/GroupDetailsChangedMessageEvent.as::get groupId()
    get groupId(): number
    {
        return (this._parser as GroupDetailsChangedMessageParser).groupId;
    }
}
