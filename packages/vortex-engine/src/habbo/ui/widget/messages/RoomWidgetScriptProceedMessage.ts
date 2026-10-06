import {RoomWidgetMessage} from './RoomWidgetMessage';

/**
 * "The user dismissed the last help bubble" — the message that lets a server-side script continue.
 *
 * Its `ANSWER` type is the **same string** as AS3's poll answer message, and in AS3 both handlers
 * register for it. That is not a mistake to fix: the room desktop calls every handler registered
 * against a message type, and each one is disambiguated only by its `instanceof` check failing.
 * The RPG fork removed polls, so `UiHelpBubbleWidgetHandler` is now the only handler for it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetScriptProceedMessage.as
 */
export class RoomWidgetScriptProceedMessage extends RoomWidgetMessage
{
    // AS3: .../widget/messages/RoomWidgetScriptProceedMessage.as::ANSWER
    public static readonly ANSWER: string = 'RWPM_ANSWER';

    // AS3: .../widget/messages/RoomWidgetScriptProceedMessage.as::RoomWidgetScriptProceedMessage()
    constructor(type: string)
    {
        super(type);
    }
}
