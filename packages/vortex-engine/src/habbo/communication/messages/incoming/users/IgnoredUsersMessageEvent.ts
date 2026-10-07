import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {IgnoredUsersMessageParser} from '../../parser/users/IgnoredUsersMessageParser';

/**
 * Event for ignored users list.
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.users.IgnoredUsersMessageEvent
 */
export class IgnoredUsersMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, IgnoredUsersMessageParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/IgnoredUsersMessageEvent.as::get ignoredUserIds()
    get ignoredUserIds(): number[]
    {
        return (this._parser as IgnoredUsersMessageParser).ignoredUsers;
    }
}
