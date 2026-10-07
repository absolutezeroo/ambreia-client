/**
 * AvatarEffectMessageEventParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.action.AvatarEffectMessageEventParser
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class AvatarEffectMessageEventParser implements IMessageParser
{
    private _userId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/AvatarEffectMessageEventParser.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    private _effectId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/AvatarEffectMessageEventParser.as::get effectId()
    get effectId(): number
    {
        return this._effectId;
    }

    private _delayMilliSeconds: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/AvatarEffectMessageEventParser.as::get delayMilliSeconds()
    get delayMilliSeconds(): number
    {
        return this._delayMilliSeconds;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/AvatarEffectMessageEventParser.as::flush()
    flush(): boolean
    {
        this._userId = 0;
        this._effectId = 0;
        this._delayMilliSeconds = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/AvatarEffectMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._userId = wrapper.readInt();
        this._effectId = wrapper.readInt();
        this._delayMilliSeconds = wrapper.readInt();

        return true;
    }
}
