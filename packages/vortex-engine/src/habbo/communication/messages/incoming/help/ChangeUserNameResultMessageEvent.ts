import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ChangeUserNameResultMessageParser} from '../../parser/help/ChangeUserNameResultMessageParser';

/**
 * Event for change user name result.
 * Contains the result code indicating success or specific error.
 *
 * @see source_as_win63/habbo/communication/messages/incoming/avatar/ChangeUserNameResultMessageEvent.as
 */
export class ChangeUserNameResultMessageEvent extends MessageEvent implements IMessageEvent
{
    public static readonly NAME_OK: number = 0;
    public static readonly ERROR_NAME_REQUIRED: number = 1;
    public static readonly ERROR_NAME_TOO_SHORT: number = 2;
    public static readonly ERROR_NAME_TOO_LONG: number = 3;
    public static readonly ERROR_NAME_NOT_VALID: number = 4;
    public static readonly ERROR_NAME_IN_USE: number = 5;
    public static readonly ERROR_NAME_CHANGE_NOT_ALLOWED: number = 6;
    public static readonly ERROR_MERGE_HOTEL_DOWN: number = 7;

    constructor(callback: MessageEventCallback)
    {
        super(callback, ChangeUserNameResultMessageParser);
    }
}
