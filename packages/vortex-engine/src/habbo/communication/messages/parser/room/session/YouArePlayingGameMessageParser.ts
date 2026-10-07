import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * YouArePlayingGameMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.YouArePlayingGameMessageEventParser
 */
export class YouArePlayingGameMessageParser implements IMessageParser
{
    private _isPlaying: boolean = false;

    get isPlaying(): boolean
    {
        return this._isPlaying;
    }

    flush(): boolean
    {
        this._isPlaying = false;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper)
        {
            return false;
        }

        this._isPlaying = wrapper.readBoolean();
        return true;
    }
}
