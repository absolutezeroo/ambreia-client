/**
 * CarryObjectMessageEventParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.action.CarryObjectMessageEventParser
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class CarryObjectMessageEventParser implements IMessageParser
{
    private _userId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/CarryObjectMessageEventParser.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    private _itemType: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/CarryObjectMessageEventParser.as::get itemType()
    get itemType(): number
    {
        return this._itemType;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/CarryObjectMessageEventParser.as::flush()
    flush(): boolean
    {
        this._userId = 0;
        this._itemType = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/CarryObjectMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._userId = wrapper.readInt();
        this._itemType = wrapper.readInt();

        return true;
    }
}
