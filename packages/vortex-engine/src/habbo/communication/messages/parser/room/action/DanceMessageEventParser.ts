/**
 * DanceMessageEventParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.action.DanceMessageEventParser
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class DanceMessageEventParser implements IMessageParser
{
    private _userId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/DanceMessageEventParser.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    private _danceStyle: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/DanceMessageEventParser.as::get danceStyle()
    get danceStyle(): number
    {
        return this._danceStyle;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/DanceMessageEventParser.as::flush()
    flush(): boolean
    {
        this._userId = 0;
        this._danceStyle = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/DanceMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._userId = wrapper.readInt();
        this._danceStyle = wrapper.readInt();

        return true;
    }
}
