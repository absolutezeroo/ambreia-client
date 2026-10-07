import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * The server asking the client to pop a bot's context menu open (header 2336) — what a NUX bot
 * uses to put its own menu in front of a new player.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2401/_SafeCls_2400.as
 * (obfuscated; `_SafeStr_4546[2336] = _SafeCls_2761` in the registry
 * sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as:1386).
 */
export class BotForceOpenContextMenuParser implements IMessageParser
{
    // AS3: .../_SafeCls_2400.as::_SafeStr_6226
    private _botId: number = -1;

    // AS3: .../_SafeCls_2400.as::get botId()
    get botId(): number
    {
        return this._botId;
    }

    // AS3: .../_SafeCls_2400.as::flush()
    flush(): boolean
    {
        this._botId = -1;

        return true;
    }

    // AS3: .../_SafeCls_2400.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._botId = wrapper.readInt();

        return true;
    }
}
