/**
 * SleepMessageEventParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.action.SleepMessageEventParser
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class SleepMessageEventParser implements IMessageParser
{
    private _userId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/SleepMessageEventParser.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    private _sleeping: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/SleepMessageEventParser.as::get sleeping()
    get sleeping(): boolean
    {
        return this._sleeping;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/SleepMessageEventParser.as::flush()
    flush(): boolean
    {
        this._userId = 0;
        this._sleeping = false;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/SleepMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._userId = wrapper.readInt();
        this._sleeping = wrapper.readBoolean();

        return true;
    }
}
