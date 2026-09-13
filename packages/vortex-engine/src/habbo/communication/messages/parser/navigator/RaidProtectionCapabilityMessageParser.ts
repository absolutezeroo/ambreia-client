import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * Tells the client whether the current user may manage raid protection in a given room.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafePkg_4207._SafeCls_4332`) and exists in
 * no other tree, so there is nothing to recover it from. Its two members are readable and are
 * used verbatim below.
 *
 * @see sources/AIR-1.0.31/src/_SafePkg_4207/_SafeCls_4332.as
 */
export class RaidProtectionCapabilityMessageParser implements IMessageParser
{
    private _roomId: number = 0;
    private _canManage: boolean = false;

    // AS3: sources/AIR-1.0.31/src/_SafePkg_4207/_SafeCls_4332.as::get roomId()
    get roomId(): number
    {
        return this._roomId;
    }

    // AS3: sources/AIR-1.0.31/src/_SafePkg_4207/_SafeCls_4332.as::get canManage()
    get canManage(): boolean
    {
        return this._canManage;
    }

    // AS3: sources/AIR-1.0.31/src/_SafePkg_4207/_SafeCls_4332.as::flush()
    flush(): boolean
    {
        this._roomId = 0;
        this._canManage = false;
        return true;
    }

    // AS3: sources/AIR-1.0.31/src/_SafePkg_4207/_SafeCls_4332.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._roomId = wrapper.readInt();
        this._canManage = wrapper.readBoolean();
        return true;
    }
}
