import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for navigator settings message
 *
 * @see source_as_win63/habbo/communication/messages/parser/navigator/NavigatorSettingsEventParser.as
 */
export class NavigatorSettingsMessageParser implements IMessageParser
{
    private _homeRoomId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/NavigatorSettingsEventParser.as::get homeRoomId()
    get homeRoomId(): number
    {
        return this._homeRoomId;
    }

    private _roomIdToEnter: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/NavigatorSettingsEventParser.as::get roomIdToEnter()
    get roomIdToEnter(): number
    {
        return this._roomIdToEnter;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/NavigatorSettingsEventParser.as::flush()
    flush(): boolean
    {
        this._homeRoomId = 0;
        this._roomIdToEnter = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/NavigatorSettingsEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._homeRoomId = wrapper.readInt();
        this._roomIdToEnter = wrapper.readInt();
        return true;
    }
}
