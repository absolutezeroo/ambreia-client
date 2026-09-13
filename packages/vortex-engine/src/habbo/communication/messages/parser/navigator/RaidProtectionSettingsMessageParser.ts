import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import {RaidProtectionSettingsSnapshot} from '../../incoming/navigator/RaidProtectionSettingsSnapshot';

/**
 * Carries a room's current raid-protection settings, in answer to
 * `GetRaidProtectionSettingsMessageComposer`.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafePkg_4207._SafeCls_4206`) and exists in
 * no other tree. Its one member, `settings`, is readable.
 *
 * @see sources/AIR-1.0.31/src/_SafePkg_4207/_SafeCls_4206.as
 */
export class RaidProtectionSettingsMessageParser implements IMessageParser
{
    private _settings: RaidProtectionSettingsSnapshot | null = null;

    // AS3: sources/AIR-1.0.31/src/_SafePkg_4207/_SafeCls_4206.as::get settings()
    get settings(): RaidProtectionSettingsSnapshot | null
    {
        return this._settings;
    }

    // AS3: sources/AIR-1.0.31/src/_SafePkg_4207/_SafeCls_4206.as::flush()
    flush(): boolean
    {
        this._settings = null;
        return true;
    }

    // AS3: sources/AIR-1.0.31/src/_SafePkg_4207/_SafeCls_4206.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._settings = RaidProtectionSettingsSnapshot.readFromMessage(wrapper);
        return true;
    }
}
