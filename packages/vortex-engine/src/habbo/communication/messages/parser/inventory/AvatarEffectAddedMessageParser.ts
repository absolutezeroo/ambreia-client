import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for the "avatar effect added" push message (a single effect the user
 * just gained). Class name derived — the WIN63 class is obfuscated to
 * `_SafeCls_3656` and has no unobfuscated (2016) equivalent; member names
 * (parse/type/subType/duration/isPermanent) are real.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3656.as::parse()
 */
export class AvatarEffectAddedMessageParser implements IMessageParser
{
    private _type: number = 0;

    private _subType: number = 0;

    private _duration: number = 0;

    private _isPermanent: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3656.as::get type()
    get type(): number
    {
        return this._type;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3656.as::get subType()
    get subType(): number
    {
        return this._subType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3656.as::get duration()
    get duration(): number
    {
        return this._duration;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3656.as::get isPermanent()
    get isPermanent(): boolean
    {
        return this._isPermanent;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3656.as::flush()
    flush(): boolean
    {
        this._type = 0;
        this._subType = 0;
        this._duration = 0;
        this._isPermanent = false;

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_3656.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._type = wrapper.readInt();
        this._subType = wrapper.readInt();
        this._duration = wrapper.readInt();
        this._isPermanent = wrapper.readBoolean();

        return true;
    }
}
