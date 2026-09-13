import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * The raid-protection settings of one room, as they arrive on the wire.
 *
 * Two incoming messages carry it — the settings push and the save result — and the save result
 * interleaves its own `resultCode` between the room id and the rest, which is why the read is
 * split into {@link readFromMessage} and {@link readAfterRoomId} exactly as the AS3 does.
 *
 * This class exists only in `AIR-1.0.31`; it is in no WIN63 build and in no PRODUCTION build.
 * Unusually for that tree, its own name and every member name here are readable — only its
 * package (`_SafePkg_4207`) is obfuscated — so nothing below is derived.
 *
 * @see sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as
 */
export class RaidProtectionSettingsSnapshot
{
    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::SENSITIVITY_LOW
    //   Name derived: the constant is obfuscated (`_SafeStr_10692:int = 0`) where its sibling
    //   SENSITIVITY_HIGH survived. RaidProtectionSettingsView populates the dropdown with
    //   `sensitivity.low`, `.medium`, `.high` against SENSITIVITY_VALUES = [0,1,2], so the value
    //   each name belongs to is recovered from that order rather than guessed.
    static readonly SENSITIVITY_LOW: number = 0;

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::SENSITIVITY_MEDIUM
    //   Name derived — see SENSITIVITY_LOW.
    static readonly SENSITIVITY_MEDIUM: number = 1;

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::SENSITIVITY_HIGH
    static readonly SENSITIVITY_HIGH: number = 2;

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::ACTION_KICK
    static readonly ACTION_KICK: number = 0;

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::ACTION_TEMPORARY_BAN
    static readonly ACTION_TEMPORARY_BAN: number = 1;

    private _roomId: number;
    private _enabled: boolean;
    private _detectionSensitivity: number;
    private _actionType: number;
    private _banDurationSeconds: number;
    private _guardEnabled: boolean;
    private _guardDurationSeconds: number;
    private _guardSensitivity: number;
    private _incidentActive: boolean;
    private _lastRaidAtEpochSeconds: number;

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::RaidProtectionSettingsSnapshot()
    constructor(
        roomId: number,
        enabled: boolean,
        detectionSensitivity: number,
        actionType: number,
        banDurationSeconds: number,
        guardEnabled: boolean,
        guardDurationSeconds: number,
        guardSensitivity: number,
        incidentActive: boolean,
        lastRaidAtEpochSeconds: number
    )
    {
        this._roomId = roomId;
        this._enabled = enabled;
        this._detectionSensitivity = detectionSensitivity;
        this._actionType = actionType;
        this._banDurationSeconds = banDurationSeconds;
        this._guardEnabled = guardEnabled;
        this._guardDurationSeconds = guardDurationSeconds;
        this._guardSensitivity = guardSensitivity;
        this._incidentActive = incidentActive;
        this._lastRaidAtEpochSeconds = lastRaidAtEpochSeconds;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::readFromMessage()
    static readFromMessage(wrapper: IMessageDataWrapper): RaidProtectionSettingsSnapshot
    {
        return RaidProtectionSettingsSnapshot.readAfterRoomId(wrapper.readInt(), wrapper);
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::readAfterRoomId()
    static readAfterRoomId(roomId: number, wrapper: IMessageDataWrapper): RaidProtectionSettingsSnapshot
    {
        return new RaidProtectionSettingsSnapshot(
            roomId,
            wrapper.readBoolean(),
            wrapper.readInt(),
            wrapper.readInt(),
            wrapper.readInt(),
            wrapper.readBoolean(),
            wrapper.readInt(),
            wrapper.readInt(),
            wrapper.readBoolean(),
            wrapper.readInt()
        );
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get roomId()
    get roomId(): number
    {
        return this._roomId;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get enabled()
    get enabled(): boolean
    {
        return this._enabled;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get detectionSensitivity()
    get detectionSensitivity(): number
    {
        return this._detectionSensitivity;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get actionType()
    get actionType(): number
    {
        return this._actionType;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get banDurationSeconds()
    get banDurationSeconds(): number
    {
        return this._banDurationSeconds;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get guardEnabled()
    get guardEnabled(): boolean
    {
        return this._guardEnabled;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get guardDurationSeconds()
    get guardDurationSeconds(): number
    {
        return this._guardDurationSeconds;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get guardSensitivity()
    get guardSensitivity(): number
    {
        return this._guardSensitivity;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get incidentActive()
    get incidentActive(): boolean
    {
        return this._incidentActive;
    }

    // AS3: sources/AIR-1.0.31/scripts/_SafePkg_4207/RaidProtectionSettingsSnapshot.as::get lastRaidAtEpochSeconds()
    get lastRaidAtEpochSeconds(): number
    {
        return this._lastRaidAtEpochSeconds;
    }
}
