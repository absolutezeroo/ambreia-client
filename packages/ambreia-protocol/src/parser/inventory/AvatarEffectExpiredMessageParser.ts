import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for the "avatar effect expired" push message (one instance of an owned
 * effect ran out). Class name derived — the WIN63 class is obfuscated to
 * `_SafeCls_3784` and has no unobfuscated (2016) equivalent; member names are
 * real.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3784.as::parse()
 */
export class AvatarEffectExpiredMessageParser implements IMessageParser
{
    private _type: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3784.as::get type()
    get type(): number
    {
        return this._type;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3784.as::flush()
    flush(): boolean
    {
        this._type = 0;

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3784.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._type = wrapper.readInt();

        return true;
    }
}
