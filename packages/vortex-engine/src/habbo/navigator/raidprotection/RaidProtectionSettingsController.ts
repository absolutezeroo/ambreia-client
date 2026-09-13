import {EventEmitter} from 'eventemitter3';
import {Logger} from '@core/utils/Logger';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IConfirmDialog} from '@habbo/window/utils/ConfirmDialog';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import {HabboConfigurationEvent} from '@habbo/configuration/enum/HabboConfigurationEvent';
import {RoomSessionEvent} from '@habbo/session/events/RoomSessionEvent';
import {RoomSessionState} from '@habbo/session/IRoomSession';
import {GetRaidProtectionSettingsMessageComposer} from '@habbo/communication/messages/outgoing/navigator/GetRaidProtectionSettingsMessageComposer';
import {SaveRaidProtectionSettingsMessageComposer} from '@habbo/communication/messages/outgoing/navigator/SaveRaidProtectionSettingsMessageComposer';
import {RaidProtectionCapabilityMessageEvent} from '@habbo/communication/messages/incoming/navigator/RaidProtectionCapabilityMessageEvent';
import {RaidProtectionSettingsMessageEvent} from '@habbo/communication/messages/incoming/navigator/RaidProtectionSettingsMessageEvent';
import {RaidProtectionSaveResultMessageEvent} from '@habbo/communication/messages/incoming/navigator/RaidProtectionSaveResultMessageEvent';
import type {RaidProtectionCapabilityMessageParser} from '@habbo/communication/messages/parser/navigator/RaidProtectionCapabilityMessageParser';
import type {RaidProtectionSettingsMessageParser} from '@habbo/communication/messages/parser/navigator/RaidProtectionSettingsMessageParser';
import {RaidProtectionSaveResultMessageParser} from '@habbo/communication/messages/parser/navigator/RaidProtectionSaveResultMessageParser';
import {RaidProtectionSettingsData} from './RaidProtectionSettingsData';
import {RaidProtectionSettingsView} from './RaidProtectionSettingsView';
import type {HabboNavigator} from '../HabboNavigator';

const log = Logger.getLogger('habbo.navigator.raidprotection.RaidProtectionSettingsController');

/**
 * Owns the raid-protection settings dialog: which room it may be opened for, the copy of that
 * room's settings, the confirmation the server demands before protection is switched on, and the
 * one save that may be in flight at a time.
 *
 * Everything is scoped to *the room you are currently standing in*. `canManage()` is false the
 * moment you are not, and every incoming message re-checks it, because the server answers about a
 * room id and the user may have left between request and answer.
 *
 * Feature-gated on the `raid.protection.enabled` external variable, re-read whenever the
 * configuration reloads.
 *
 * Only `AIR-1.0.31` has this class; no WIN63 or PRODUCTION build does. Its own name and every
 * method name below are readable there — the private *field* names are not, and the ones used
 * here (`_featureEnabled`, `_settings`, `_pendingOpenRoomId`, `_pendingSaveRoomId`,
 * `_confirmDraft`, `_confirmBaseline`, `_confirmDialog`, `_view`, `_messageEvents`) are derived
 * from what each field holds.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/navigator/raidprotection/RaidProtectionSettingsController.as
 */
export class RaidProtectionSettingsController extends EventEmitter implements IDisposable
{
    // AS3: .../raidprotection/RaidProtectionSettingsController.as::STATE_CHANGED
    static readonly STATE_CHANGED: string = 'RPSE_STATE_CHANGED';

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::SENSITIVITY_VALUES
    private static readonly SENSITIVITY_VALUES: readonly number[] = [0, 1, 2];

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::ACTION_VALUES
    private static readonly ACTION_VALUES: readonly number[] = [0, 1];

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::BAN_DURATION_VALUES
    private static readonly BAN_DURATION_VALUES: readonly number[] =
        [300, 900, 1800, 3600, 10800, 21600, 43200, 86400, 259200, 604800];

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::GUARD_DURATION_VALUES
    private static readonly GUARD_DURATION_VALUES: readonly number[] = [300, 900, 1800, 3600, 10800];

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_navigator
    private _navigator: HabboNavigator | null;

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_configuration
    private _configuration: IHabboConfigurationManager | null;

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_messageEvents (name derived)
    private _messageEvents: IMessageEvent[] = [];

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_capabilities
    private _capabilities: Map<number, boolean> = new Map();

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_settings (name derived)
    private _settings: Map<number, RaidProtectionSettingsData> = new Map();

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_pendingOpenRoomId (name derived)
    private _pendingOpenRoomId: number = 0;

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_pendingSaveRoomId (name derived)
    private _pendingSaveRoomId: number = 0;

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_confirmDraft (name derived)
    private _confirmDraft: RaidProtectionSettingsData | null = null;

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_confirmBaseline (name derived)
    private _confirmBaseline: RaidProtectionSettingsData | null = null;

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_confirmDialog (name derived)
    private _confirmDialog: IConfirmDialog | null = null;

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_view (name derived)
    private _view: RaidProtectionSettingsView | null = null;

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::_featureEnabled (name derived)
    private _featureEnabled: boolean = false;

    private _disposed: boolean = false;

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::RaidProtectionSettingsController()
    constructor(navigator: HabboNavigator, configuration: IHabboConfigurationManager | null)
    {
        super();

        this._navigator = navigator;
        this._configuration = configuration;
        this._featureEnabled = configuration?.getBoolean('raid.protection.enabled') ?? false;

        this._messageEvents = [
            new RaidProtectionCapabilityMessageEvent(this.onCapability),
            new RaidProtectionSettingsMessageEvent(this.onSettings),
            new RaidProtectionSaveResultMessageEvent(this.onResult)
        ];

        for(const event of this._messageEvents)
        {
            navigator.communication.addHabboConnectionMessageEvent(event);
        }

        const sessions = navigator.roomSessionManager;

        sessions?.sessionEvents.on(RoomSessionEvent.RSE_CREATED, this.onSession);
        sessions?.sessionEvents.on(RoomSessionEvent.RSE_STARTED, this.onSession);
        sessions?.sessionEvents.on(RoomSessionEvent.RSE_ENDED, this.onSession);

        configuration?.events.on(HabboConfigurationEvent.CONFIGURATION_LOADED, this.onConfigurationLoaded);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::get isFeatureEnabled()
    get isFeatureEnabled(): boolean
    {
        return this._featureEnabled;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::canManage()
    canManage(roomId: number): boolean
    {
        return this._featureEnabled && this.isLiveCurrentRoom(roomId) && this._capabilities.get(roomId) === true;
    }

    /**
     * Entry point for the `navigator/raidprotection/<flatId>` link the room-info view fires.
     * Nothing is shown yet — the settings are requested, and `onSettings()` opens the window when
     * they come back for the room we asked about.
     */
    // AS3: .../raidprotection/RaidProtectionSettingsController.as::openFromLink()
    openFromLink(value: string | null): void
    {
        if(value === null || !/^\d+$/.test(value)) return;

        const parsed = Number(value);

        if(parsed <= 0 || parsed > 2147483647) return;

        const roomId = parsed | 0;

        if(!this._featureEnabled
            || !this.isCurrentEnteredRoom(roomId)
            || !this.canManage(roomId)
            || this._pendingOpenRoomId === roomId)
        {
            return;
        }

        this._pendingOpenRoomId = roomId;
        this._view?.hide();
        this.send(new GetRaidProtectionSettingsMessageComposer(roomId));
    }

    /**
     * Switching protection *on* costs a round trip more than any other change: the server wants a
     * confirmed save, so the first attempt asks the user and only the answer sends anything.
     */
    // AS3: .../raidprotection/RaidProtectionSettingsController.as::requestSave()
    requestSave(draft: RaidProtectionSettingsData | null): void
    {
        const stored = draft === null ? null : (this._settings.get(draft.roomId) ?? null);

        if(stored === null || draft === null || !this.valid(draft)) return;

        if(!this._featureEnabled || !this.isCurrentEnteredRoom(draft.roomId) || !this.canManage(draft.roomId))
        {
            this.clearRoom(draft.roomId);
            return;
        }

        if(this._pendingSaveRoomId !== 0) return;

        if(!stored.enabled && draft.enabled)
        {
            this._confirmDraft = draft;
            this._confirmBaseline = stored;
            this._view?.setSaveOutstanding(true);

            const message = this._navigator?.localization?.getLocalizationWithParams(
                stored.incidentActive
                    ? 'raid.protection.settings.confirm.active'
                    : 'raid.protection.settings.confirm.inactive'
            ) ?? '';

            this._confirmDialog = this._navigator?.windowManager?.confirm(
                '${raid.protection.settings.confirm.title}',
                message,
                0,
                this.onConfirmation
            ) ?? null;

            return;
        }

        this.sendSave(draft, false);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::close()
    close(): void
    {
        this._pendingOpenRoomId = 0;
        this.cancelConfirmation();
        this._view?.hide();
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::onConfirmation()
    private onConfirmation = (dialog: IDisposable, event: WindowEvent): void =>
    {
        dialog.dispose();
        this._confirmDialog = null;

        const draft = this._confirmDraft;
        const baseline = this._confirmBaseline;

        this._confirmDraft = null;
        this._confirmBaseline = null;

        if(event.type === 'WE_OK'
            && draft !== null
            && baseline !== null
            && this._settings.get(draft.roomId) === baseline
            && !baseline.enabled
            && this._featureEnabled
            && this.isCurrentEnteredRoom(draft.roomId)
            && this.canManage(draft.roomId)
            && this._pendingSaveRoomId === 0)
        {
            this.sendSave(draft, true);
        }
        else if(this._view && this._pendingSaveRoomId === 0)
        {
            this._view.setSaveOutstanding(false);
        }
    };

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::sendSave()
    private sendSave(draft: RaidProtectionSettingsData, confirmed: boolean): void
    {
        this._pendingSaveRoomId = draft.roomId;
        this._view?.setSaveOutstanding(true);

        this.send(new SaveRaidProtectionSettingsMessageComposer(
            draft.roomId,
            draft.enabled,
            draft.detectionSensitivity,
            draft.actionType,
            draft.banDurationSeconds,
            draft.guardEnabled,
            draft.guardDurationSeconds,
            draft.guardSensitivity,
            confirmed
        ));
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::onCapability()
    private onCapability = (event: IMessageEvent): void =>
    {
        const parser = event.parser as RaidProtectionCapabilityMessageParser | null;

        if(!parser) return;

        const roomId = parser.roomId;

        if(!this._featureEnabled || !this.isLiveCurrentRoom(roomId)) return;

        this.clearOtherRooms(roomId);

        if(parser.canManage)
        {
            this._capabilities.set(roomId, true);
        }
        else
        {
            this.clearRoom(roomId);
        }

        this.emit(RaidProtectionSettingsController.STATE_CHANGED);
    };

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::onSettings()
    private onSettings = (event: IMessageEvent): void =>
    {
        const parser = event.parser as RaidProtectionSettingsMessageParser | null;
        const snapshot = parser?.settings ?? null;

        if(!snapshot) return;

        const settings = RaidProtectionSettingsData.fromSnapshot(snapshot);

        if(!this._featureEnabled
            || !this.isCurrentEnteredRoom(settings.roomId)
            || !this.canManage(settings.roomId))
        {
            return;
        }

        this.cancelConfirmation();
        this._settings.set(settings.roomId, settings);

        if(this._pendingOpenRoomId === settings.roomId)
        {
            this._pendingOpenRoomId = 0;

            if(this._view === null)
            {
                this._view = new RaidProtectionSettingsView(this, this._navigator!);
            }

            this._view.update(settings);
            this._view.show();
        }
        else if(this._view && this._view.isShowingRoom(settings.roomId))
        {
            this._view.update(settings);
        }
    };

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::onResult()
    private onResult = (event: IMessageEvent): void =>
    {
        const parser = event.parser as RaidProtectionSaveResultMessageParser | null;
        const snapshot = parser?.settings ?? null;

        if(!parser || !snapshot) return;

        const resultCode = parser.resultCode;
        const settings = RaidProtectionSettingsData.fromSnapshot(snapshot);

        if(settings.roomId !== this._pendingSaveRoomId
            || !this._featureEnabled
            || !this.isCurrentEnteredRoom(settings.roomId)
            || !this.canManage(settings.roomId))
        {
            return;
        }

        this.completePendingSave();
        this._settings.set(settings.roomId, settings);

        if(this._view && this._view.isShowingRoom(settings.roomId))
        {
            this._view.update(settings);

            if(resultCode === RaidProtectionSaveResultMessageParser.RESULT_OK)
            {
                this.close();
            }
            else
            {
                log.debug(`Raid protection save refused for room ${settings.roomId}, result ${resultCode}`);
            }
        }
    };

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::onSession()
    private onSession = (event: RoomSessionEvent): void =>
    {
        if(event.type === RoomSessionEvent.RSE_ENDED)
        {
            this.clearRoom(event.session.roomId);
        }
        else
        {
            this.clearOtherRooms(event.session.roomId);
            this.cancelConfirmation();
            this._view?.hide();
        }

        this.emit(RaidProtectionSettingsController.STATE_CHANGED);
    };

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::onConfigurationLoaded()
    private onConfigurationLoaded = (): void =>
    {
        const enabled = this._configuration?.getBoolean('raid.protection.enabled') ?? false;

        if(enabled === this._featureEnabled) return;

        this._featureEnabled = enabled;
        this.clearAll();
        this.emit(RaidProtectionSettingsController.STATE_CHANGED);
    };

    /**
     * The same whitelist the view builds its dropdowns from. A draft whose values are not in it
     * did not come from those dropdowns, so it is dropped rather than sent.
     */
    // AS3: .../raidprotection/RaidProtectionSettingsController.as::valid()
    private valid(draft: RaidProtectionSettingsData | null): boolean
    {
        return draft !== null
            && RaidProtectionSettingsController.SENSITIVITY_VALUES.includes(draft.detectionSensitivity)
            && RaidProtectionSettingsController.ACTION_VALUES.includes(draft.actionType)
            && RaidProtectionSettingsController.BAN_DURATION_VALUES.includes(draft.banDurationSeconds)
            && RaidProtectionSettingsController.GUARD_DURATION_VALUES.includes(draft.guardDurationSeconds)
            && RaidProtectionSettingsController.SENSITIVITY_VALUES.includes(draft.guardSensitivity);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::isLiveCurrentRoom()
    private isLiveCurrentRoom(roomId: number): boolean
    {
        const session = this._navigator?.roomSessionManager?.getSession(roomId) ?? null;

        return roomId > 0
            && this._navigator?.data.currentRoomId === roomId
            && session !== null
            && session.state === RoomSessionState.STARTED;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::isCurrentEnteredRoom()
    private isCurrentEnteredRoom(roomId: number): boolean
    {
        const entered = this._navigator?.data.enteredGuestRoom ?? null;

        return this.isLiveCurrentRoom(roomId) && entered !== null && entered.flatId === roomId;
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::clearOtherRooms()
    private clearOtherRooms(roomId: number): void
    {
        // Keys are snapshotted because clearRoom() deletes from both maps as it goes.
        for(const other of [...this._capabilities.keys()])
        {
            if(other !== roomId) this.clearRoom(other);
        }

        for(const other of [...this._settings.keys()])
        {
            if(other !== roomId) this.clearRoom(other);
        }

        if(this._pendingOpenRoomId !== 0 && this._pendingOpenRoomId !== roomId)
        {
            this._pendingOpenRoomId = 0;
        }

        if(this._pendingSaveRoomId !== 0 && this._pendingSaveRoomId !== roomId)
        {
            this.completePendingSave();
        }

        if(this._confirmDraft && this._confirmDraft.roomId !== roomId)
        {
            this.cancelConfirmation();
        }
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::clearRoom()
    private clearRoom(roomId: number): void
    {
        this._capabilities.delete(roomId);
        this._settings.delete(roomId);

        if(this._pendingOpenRoomId === roomId) this._pendingOpenRoomId = 0;

        if(this._pendingSaveRoomId === roomId) this.completePendingSave();

        if(this._confirmDraft && this._confirmDraft.roomId === roomId) this.cancelConfirmation();

        if(this._view && this._view.isShowingRoom(roomId)) this._view.hide();
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::clearAll()
    private clearAll(): void
    {
        this._capabilities = new Map();
        this._settings = new Map();
        this._pendingOpenRoomId = 0;
        this.completePendingSave();
        this.cancelConfirmation();
        this._view?.hide();
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::completePendingSave()
    private completePendingSave(): void
    {
        this._pendingSaveRoomId = 0;
        this._view?.setSaveOutstanding(false);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::cancelConfirmation()
    private cancelConfirmation(): void
    {
        if(this._confirmDialog)
        {
            this._confirmDialog.dispose();
            this._confirmDialog = null;
        }

        this._confirmDraft = null;
        this._confirmBaseline = null;

        if(this._view && this._pendingSaveRoomId === 0) this._view.setSaveOutstanding(false);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::send()
    private send(composer: GetRaidProtectionSettingsMessageComposer | SaveRaidProtectionSettingsMessageComposer): void
    {
        this._navigator?.send(composer);
    }

    // AS3: .../raidprotection/RaidProtectionSettingsController.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        for(const event of this._messageEvents)
        {
            this._navigator?.communication.removeHabboConnectionMessageEvent(event);
        }

        const sessions = this._navigator?.roomSessionManager ?? null;

        sessions?.sessionEvents.off(RoomSessionEvent.RSE_CREATED, this.onSession);
        sessions?.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this.onSession);
        sessions?.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this.onSession);

        this._configuration?.events.off(HabboConfigurationEvent.CONFIGURATION_LOADED, this.onConfigurationLoaded);

        this.cancelConfirmation();

        if(this._view)
        {
            this._view.dispose();
            this._view = null;
        }

        this._messageEvents = [];
        this._capabilities.clear();
        this._settings.clear();
        this._configuration = null;
        this._navigator = null;

        this.removeAllListeners();
    }
}
