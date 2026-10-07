import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * A bot action the server refused (header 520) — the code is looked up as a localized alert.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2401/_SafeCls_4173.as
 * (obfuscated; `_SafeStr_4546[520] = _SafeCls_2510` in the registry
 * sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as:1687,
 * subscribed as `onBotError` by RoomUsersHandler).
 */
export class BotErrorParser implements IMessageParser
{
    // AS3: .../_SafeCls_4173.as::_errorCode
    private _errorCode: number = -1;

    // AS3: .../_SafeCls_4173.as::get errorCode()
    get errorCode(): number
    {
        return this._errorCode;
    }

    // AS3: .../_SafeCls_4173.as::flush()
    flush(): boolean
    {
        this._errorCode = -1;

        return true;
    }

    // AS3: .../_SafeCls_4173.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._errorCode = wrapper.readInt();

        return true;
    }
}
