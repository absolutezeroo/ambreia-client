import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {CheckUserNameResultMessageParser} from '../../parser/help/CheckUserNameResultMessageParser';

/**
 * Event for check user name result.
 * Contains the validation result and name suggestions.
 *
 * @see source_as_win63/habbo/communication/messages/incoming/avatar/CheckUserNameResultMessageEvent.as
 */
export class CheckUserNameResultMessageEvent extends MessageEvent implements IMessageEvent
{
    /**
     * The eight result codes, all declared on this event class in AS3 too.
     *
     * Every identifier is obfuscated in **every** tree — the 2016 build carries the same eight
     * under its own scheme — so the names here are DERIVED. Six of them from the localisation key
     * `AvatarEditorNameChangeView.setNameNotAvailableView()` picks per code; the seventh, `NAME_OK`,
     * from `AvatarEditorMessageHandler`'s only comparison. They match the names
     * `ChangeUserNameResultMessageEvent` already carries for the identical set.
     *
     * Code **1** is the odd one: it is the only failure with **no branch at all** in the view's
     * switch, in this build and in 2016 — it fails silently and shows the previous message. Nothing
     * in the client names it, so `ERROR_NAME_REQUIRED` is a guess inherited from the sibling class
     * and kept only for consistency.
     */
    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_2167.as
    public static readonly NAME_OK: number = 0;
    public static readonly ERROR_NAME_REQUIRED: number = 1;
    public static readonly ERROR_NAME_TOO_SHORT: number = 2;
    public static readonly ERROR_NAME_TOO_LONG: number = 3;
    public static readonly ERROR_NAME_NOT_VALID: number = 4;
    public static readonly ERROR_NAME_IN_USE: number = 5;
    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_2167.as
    public static readonly ERROR_NAME_CHANGE_NOT_ALLOWED: number = 6;
    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_2167.as
    public static readonly ERROR_MERGE_HOTEL_DOWN: number = 7;

    constructor(callback: MessageEventCallback)
    {
        super(callback, CheckUserNameResultMessageParser);
    }
}
