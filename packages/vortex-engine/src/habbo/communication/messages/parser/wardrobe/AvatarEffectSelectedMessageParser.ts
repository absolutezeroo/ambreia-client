import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * "This effect is now selected" — one integer, the effect type.
 *
 * Class name DERIVED: the AS3 parser is `_SafeCls_4142.as`. Named for its consumer,
 * `AvatarEditorMessageHandler::onAvatarEffectSelected()`.
 *
 * Wire-identical to `AvatarEffectExpiredMessageParser`, and deliberately kept separate: the two
 * arrive on different headers (3629 vs 2236) and mean opposite things.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2975/_SafeCls_4142.as
 */
export class AvatarEffectSelectedMessageParser implements IMessageParser
{
    // AS3: .../src/unknowns/_SafePkg_2975/_SafeCls_4142.as::_type
    // Name DERIVED (`_SafeStr_4778`): the field behind `get type()`.
    private _type: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2975/_SafeCls_4142.as::get type()
    get type(): number
    {
        return this._type;
    }

    // AS3: .../src/unknowns/_SafePkg_2975/_SafeCls_4142.as::flush()
    flush(): boolean
    {
        this._type = 0;

        return true;
    }

    // AS3: .../src/unknowns/_SafePkg_2975/_SafeCls_4142.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._type = wrapper.readInt();

        return true;
    }
}
