import type {RaidProtectionSettingsSnapshot} from '@habbo/communication/messages/incoming/navigator/RaidProtectionSettingsSnapshot';

/**
 * The raid-protection settings of one room, as the navigator holds them.
 *
 * Same ten fields as {@link RaidProtectionSettingsSnapshot}, which is the wire form: the AS3 keeps
 * the two apart so the view can build a draft (`collectDraft()`) without a message to read it
 * from, and the controller compares that draft against the stored copy before sending.
 *
 * This class exists only in `AIR-1.0.31`; no WIN63 or PRODUCTION build has the feature. Its own
 * name and all its members are readable there — only its two lowest sensitivity constants are not.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/navigator/raidprotection/RaidProtectionSettingsData.as
 */
export class RaidProtectionSettingsData
{
    // AS3: .../raidprotection/RaidProtectionSettingsData.as::SENSITIVITY_LOW
    //   Name derived — see RaidProtectionSettingsSnapshot.SENSITIVITY_LOW for how the value was
    //   recovered from the view's dropdown order.
    static readonly SENSITIVITY_LOW: number = 0;

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::SENSITIVITY_MEDIUM
    //   Name derived — see RaidProtectionSettingsSnapshot.SENSITIVITY_LOW.
    static readonly SENSITIVITY_MEDIUM: number = 1;

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::SENSITIVITY_HIGH
    static readonly SENSITIVITY_HIGH: number = 2;

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::ACTION_KICK
    static readonly ACTION_KICK: number = 0;

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::ACTION_TEMPORARY_BAN
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

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::RaidProtectionSettingsData()
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

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::fromSnapshot()
    static fromSnapshot(snapshot: RaidProtectionSettingsSnapshot): RaidProtectionSettingsData
    {
        return new RaidProtectionSettingsData(
            snapshot.roomId,
            snapshot.enabled,
            snapshot.detectionSensitivity,
            snapshot.actionType,
            snapshot.banDurationSeconds,
            snapshot.guardEnabled,
            snapshot.guardDurationSeconds,
            snapshot.guardSensitivity,
            snapshot.incidentActive,
            snapshot.lastRaidAtEpochSeconds
        );
    }

    /**
     * True when `other` carries the same *editable* settings as this one — room id, incident flag
     * and last-raid timestamp are deliberately excluded, since the server owns those.
     *
     * Nothing in the AS3 calls this; it is ported because it is a public member, not because the
     * controller needs it (the controller compares the two fields it cares about inline).
     */
    // AS3: .../raidprotection/RaidProtectionSettingsData.as::matchesEditable()
    matchesEditable(other: RaidProtectionSettingsData | null): boolean
    {
        return other !== null
            && this._enabled === other.enabled
            && this._detectionSensitivity === other.detectionSensitivity
            && this._actionType === other.actionType
            && this._banDurationSeconds === other.banDurationSeconds
            && this._guardEnabled === other.guardEnabled
            && this._guardDurationSeconds === other.guardDurationSeconds
            && this._guardSensitivity === other.guardSensitivity;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get roomId()
    get roomId(): number
    {
        return this._roomId;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get enabled()
    get enabled(): boolean
    {
        return this._enabled;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get detectionSensitivity()
    get detectionSensitivity(): number
    {
        return this._detectionSensitivity;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get actionType()
    get actionType(): number
    {
        return this._actionType;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get banDurationSeconds()
    get banDurationSeconds(): number
    {
        return this._banDurationSeconds;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get guardEnabled()
    get guardEnabled(): boolean
    {
        return this._guardEnabled;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get guardDurationSeconds()
    get guardDurationSeconds(): number
    {
        return this._guardDurationSeconds;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get guardSensitivity()
    get guardSensitivity(): number
    {
        return this._guardSensitivity;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get incidentActive()
    get incidentActive(): boolean
    {
        return this._incidentActive;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsData.as::get lastRaidAtEpochSeconds()
    get lastRaidAtEpochSeconds(): number
    {
        return this._lastRaidAtEpochSeconds;
    }
}
