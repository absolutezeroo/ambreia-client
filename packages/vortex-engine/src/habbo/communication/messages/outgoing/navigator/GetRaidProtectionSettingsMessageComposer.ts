import {MessageComposer} from '@core/communication/messages/MessageComposer';

/**
 * Asks for one room's raid-protection settings. Answered by
 * `RaidProtectionSettingsMessageEvent`.
 *
 * Class name derived — the AS3 class is obfuscated (`_SafePkg_3403._SafeCls_3402`) and exists in
 * no other tree. Named from its only call site,
 * `RaidProtectionSettingsController::openFromLink()`.
 *
 * @see sources/AIR-1.0.31/scripts/_SafePkg_3403/_SafeCls_3402.as
 */
export class GetRaidProtectionSettingsMessageComposer extends MessageComposer<[number]>
{
    private _data: [number];

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_3403/_SafeCls_3402.as::_SafeCls_3402()
    constructor(roomId: number)
    {
        super();

        this._data = [roomId];
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_3403/_SafeCls_3402.as::getMessageArray()
    getMessageArray(): [number]
    {
        return this._data;
    }
}
