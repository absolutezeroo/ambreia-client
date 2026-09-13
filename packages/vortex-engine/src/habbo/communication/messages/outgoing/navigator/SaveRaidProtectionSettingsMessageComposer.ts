import {MessageComposer} from '@core/communication/messages/MessageComposer';

/**
 * Saves one room's raid-protection settings. Answered by
 * `RaidProtectionSaveResultMessageEvent`.
 *
 * The trailing `confirmed` flag is not a setting: the controller sets it only on the second
 * attempt, after the user has accepted the "you are about to switch protection on" dialog. The
 * first attempt sends `false` and the server is expected to refuse.
 *
 * Class name derived — the AS3 class is obfuscated (`_SafePkg_3403._SafeCls_3936`) and exists in
 * no other tree. Named from its only call site, `RaidProtectionSettingsController::sendSave()`.
 *
 * @see sources/AIR-1.0.31/scripts/_SafePkg_3403/_SafeCls_3936.as
 */
export class SaveRaidProtectionSettingsMessageComposer extends MessageComposer<
    [number, boolean, number, number, number, boolean, number, number, boolean]
>
{
    private _data: [number, boolean, number, number, number, boolean, number, number, boolean];

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_3403/_SafeCls_3936.as::_SafeCls_3936()
    constructor(
        roomId: number,
        enabled: boolean,
        detectionSensitivity: number,
        actionType: number,
        banDurationSeconds: number,
        guardEnabled: boolean,
        guardDurationSeconds: number,
        guardSensitivity: number,
        confirmed: boolean
    )
    {
        super();

        this._data = [
            roomId,
            enabled,
            detectionSensitivity,
            actionType,
            banDurationSeconds,
            guardEnabled,
            guardDurationSeconds,
            guardSensitivity,
            confirmed
        ];
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_3403/_SafeCls_3936.as::getMessageArray()
    getMessageArray(): [number, boolean, number, number, number, boolean, number, number, boolean]
    {
        return this._data;
    }
}
