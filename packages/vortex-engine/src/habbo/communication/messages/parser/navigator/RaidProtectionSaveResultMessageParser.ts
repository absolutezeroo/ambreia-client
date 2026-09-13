import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import {RaidProtectionSettingsSnapshot} from '../../incoming/navigator/RaidProtectionSettingsSnapshot';

/**
 * Answers a save: a result code plus the settings the server actually stored.
 *
 * The wire order is not snapshot-then-code — the room id comes first, then the result code, then
 * the rest of the snapshot. That is why {@link RaidProtectionSettingsSnapshot.readAfterRoomId}
 * exists, and reading the snapshot whole here would desync the packet.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafePkg_4207._SafeCls_4512`) and exists in
 * no other tree. Its two members, `resultCode` and `settings`, are readable.
 *
 * @see sources/AIR-1.0.31/scripts/_SafePkg_4207/_SafeCls_4512.as
 */
export class RaidProtectionSaveResultMessageParser implements IMessageParser
{
    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/_SafeCls_4512.as::RESULT_OK
    //   Name derived. The AS3 declares seven result constants (values 0-6) and *all seven* names
    //   are obfuscated, so six of them cannot be recovered at all and are deliberately absent
    //   here rather than invented. This one is named from its only use: the controller closes
    //   the window when `resultCode == 0` and leaves it open otherwise.
    static readonly RESULT_OK: number = 0;

    private _resultCode: number = 0;
    private _settings: RaidProtectionSettingsSnapshot | null = null;

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/_SafeCls_4512.as::get resultCode()
    get resultCode(): number
    {
        return this._resultCode;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/_SafeCls_4512.as::get settings()
    get settings(): RaidProtectionSettingsSnapshot | null
    {
        return this._settings;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/_SafeCls_4512.as::flush()
    flush(): boolean
    {
        this._resultCode = 0;
        this._settings = null;
        return true;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/_SafeCls_4512.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        const roomId = wrapper.readInt();

        this._resultCode = wrapper.readInt();
        this._settings = RaidProtectionSettingsSnapshot.readAfterRoomId(roomId, wrapper);

        return true;
    }
}
