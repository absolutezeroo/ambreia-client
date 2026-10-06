import {Component, ComponentDependency, type IContext} from '@core/runtime';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import type {IHabboInventory} from '@habbo/inventory/IHabboInventory';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import type {IHabboFreeFlowChat} from '@habbo/freeflowchat/IHabboFreeFlowChat';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import {RoomSessionEvent} from '@habbo/session/events/RoomSessionEvent';
import type {RoomSessionChatEvent} from '@habbo/session/events/RoomSessionChatEvent';
import type {RoomSessionDanceEvent} from '@habbo/session/events/RoomSessionDanceEvent';
import {RoomEngineObjectEvent} from '@habbo/room/events/RoomEngineObjectEvent';
import type {RoomEngineObjectPlacedEvent} from '@habbo/room/events/RoomEngineObjectPlacedEvent';
import {
    GetGuestRoomResultMessageEvent
} from '@habbo/communication/messages/incoming/navigator/GetGuestRoomResultMessageEvent';
import type {
    GetGuestRoomResultMessageParser
} from '@habbo/communication/messages/parser/navigator/GetGuestRoomResultMessageParser';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboNavigator} from '@iid/IIDHabboNavigator';
import {IID_HabboInventory} from '@iid/IIDHabboInventory';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_HabboFreeFlowChat} from '@iid/IIDHabboFreeFlowChat';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';

import type {HabboDiscordManager} from '../HabboDiscordManager';
import {HabboActivityState} from './HabboActivityState';
import type {IHabboActivityDetection} from './IHabboActivityDetection';

/**
 * Works out what to put in the Discord status line by watching what the player actually does.
 *
 * **Every activity has a decay window, and the window widens the more you do it.** A single chat
 * line counts as "chatting" for 30 seconds; thirty lines inside five minutes stretch that to the
 * full five. `getDynamicWindowMs()` is the interpolation, and the arrays are the timestamps it
 * counts — chat and furniture moves, each pruned to the last five minutes. (AS3 also counts wired
 * edits and an open wired UI as "creating wired"; the RPG fork removed wired.) That is
 * what keeps a status from flickering back to "chilling" between two sentences while still
 * dropping it for someone who typed once and left.
 *
 * Two states bypass the decay entirely because the session already knows them outright: dancing is
 * a flag on the avatar, and building is `isUserDecorating`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/discord/habbo_activity/HabboActivityDetection.as
 */
export class HabboActivityDetection extends Component implements IHabboActivityDetection
{
    // AS3: .../habbo_activity/HabboActivityDetection.as::ACTIVITY_VOLUME_WINDOW_MS
    private static readonly ACTIVITY_VOLUME_WINDOW_MS: number = 300000;

    // AS3: .../habbo_activity/HabboActivityDetection.as::ACTIVITY_MIN_WINDOW_MS
    private static readonly ACTIVITY_MIN_WINDOW_MS: number = 30000;

    // AS3: .../habbo_activity/HabboActivityDetection.as::ACTIVITY_MAX_WINDOW_MS
    private static readonly ACTIVITY_MAX_WINDOW_MS: number = 300000;

    // AS3: .../habbo_activity/HabboActivityDetection.as::ACTIVITY_MAX_COUNT
    private static readonly ACTIVITY_MAX_COUNT: number = 30;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_SafeStr_4571 (name derived: the owning manager)
    private _manager: HabboDiscordManager | null;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_navigator
    private _navigator: IHabboNavigator | null = null;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_inventory
    private _inventory: IHabboInventory | null = null;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_SafeStr_5616 (name derived: the room session)
    private _roomSession: IRoomSession | null = null;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_communicationManager
    private _communicationManager: IHabboCommunicationManager | null = null;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_freeFlowChat
    private _freeFlowChat: IHabboFreeFlowChat | null = null;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];

    // AS3: .../habbo_activity/HabboActivityDetection.as::_SafeStr_6898 (name derived: last chat, ms)
    private _lastChatTime: number = 0;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_SafeStr_7727 (name derived: currently dancing)
    private _dancing: boolean = false;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_SafeStr_5812 (name derived: last furni move, ms)
    private _lastFurniTime: number = 0;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_roomNameFast
    private _roomNameFast: string | null = null;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_inHiddenRoomFast
    private _inHiddenRoomFast: boolean = false;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_categoryFast
    private _categoryFast: number = 0;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_SafeStr_6722 (name derived: `get roomId()` backs it)
    private _roomId: number = -1;

    // AS3: .../habbo_activity/HabboActivityDetection.as::_SafeStr_7194 (name derived: chat timestamps)
    private _chatTimestamps: number[] = [];

    // AS3: .../habbo_activity/HabboActivityDetection.as::_SafeStr_6818 (name derived: furni timestamps)
    private _furniTimestamps: number[] = [];

    /**
	 * AS3 calls `addMessageEvent(new …)` for each of the three, *then* loops `_messageEvents` and
	 * calls `addMessageEvent` again on every element — but nothing ever pushes into that vector, so
	 * the loop is a no-op and `dispose()`'s matching loop unsubscribes nothing. The pushes were
	 * clearly meant to be there (`DiscordSettingsController` has exactly the same constructor with
	 * them). This port pushes and subscribes once each, so dispose actually detaches; subscribing
	 * twice would double every callback.
	 */
    // AS3: .../habbo_activity/HabboActivityDetection.as::HabboActivityDetection()
    constructor(manager: HabboDiscordManager, context: IContext, flags: number = 0, assets: IAssetLibrary | null = null)
    {
        super(context, flags, assets);

        this._manager = manager;

        this._messageEvents.push(new GetGuestRoomResultMessageEvent(this.onGetGuestRoomResult));
    }

    /**
     * DEVIATION: AS3 subscribes in the constructor, where its DI has already resolved
     *   `_communicationManager`. This port resolves dependencies *after* construction, so the same
     *   loop ran against a null manager and `addMessageEvent()`'s optional chain swallowed all
     *   three — the events were built and never registered. `DiscordSettingsController` needed the
     *   same deviation for the same reason: its `DiscordPreferences` (2767) was arriving to no
     *   handler and being dropped.
     * AS3: .../habbo_activity/HabboActivityDetection.as::HabboActivityDetection()
     */
    // AS3: .../habbo_activity/HabboActivityDetection.as::HabboActivityDetection()
    protected override initComponent(): void
    {
        for(const event of this._messageEvents)
        {
            this.addMessageEvent(event);
        }
    }

    /**
	 * AS3: flash.utils.getTimer() — TS-only helper, no `HabboActivityDetection.as` member of this
	 * name. Same shape as `HabboPhoneNumber.getTimer()`.
	 */
    // TS-only: `flash.utils.getTimer()` has no port-side member of its own.
    private static getTimer(): number
    {
        return typeof performance !== 'undefined' ? Math.floor(performance.now()) : Date.now();
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboNavigator,
                (navigator: IHabboNavigator | null) => { this._navigator = navigator; }
            ),
            new ComponentDependency(
                IID_HabboInventory,
                (inventory: IHabboInventory | null) => { this._inventory = inventory; },
                false
            ),
            new ComponentDependency(
                IID_RoomEngine,
                (engine: IRoomEngine | null) => { this._roomEngine = engine; },
                false,
                [
                    {
                        type: RoomEngineObjectEvent.REOE_PLACED,
                        callback: (event: unknown) => this.onRoomEngineObjectPlaced(event as RoomEngineObjectPlacedEvent)
                    },
                    {
                        type: RoomEngineObjectEvent.REOE_REQUEST_MOVE,
                        callback: (event: unknown) => this.onRoomEngineObjectActivity(event as RoomEngineObjectEvent)
                    },
                    {
                        type: RoomEngineObjectEvent.REOE_REQUEST_ROTATE,
                        callback: (event: unknown) => this.onRoomEngineObjectActivity(event as RoomEngineObjectEvent)
                    },
                ]
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                null,
                false,
                [
                    {
                        type: RoomSessionEvent.RSE_STARTED,
                        callback: (event: unknown) => this.onRoomSessionEvent(event as RoomSessionEvent)
                    },
                    {
                        type: RoomSessionEvent.RSE_ENDED,
                        callback: (event: unknown) => this.onRoomSessionEvent(event as RoomSessionEvent)
                    },
                    {
                        type: 'RSCE_CHAT_EVENT',
                        callback: (event: unknown) => this.onRoomSessionChat(event as RoomSessionChatEvent)
                    },
                    {
                        type: 'RSDE_DANCE',
                        callback: (event: unknown) => this.onRoomSessionDance(event as RoomSessionDanceEvent)
                    },
                ]
            ),
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) => { this._communicationManager = manager; }
            ),
            new ComponentDependency(
                IID_HabboFreeFlowChat,
                (chat: IHabboFreeFlowChat | null) => { this._freeFlowChat = chat; }
            ),
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) => { this._toolbar = toolbar; }
            ),
        ];
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::isInRoom()
    isInRoom(): boolean
    {
        return this._roomNameFast !== null && this._toolbar?.getToolbarState() === 'HTE_STATE_ROOM_VIEW';
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::isInHiddenRoom()
    isInHiddenRoom(): boolean
    {
        return this._inHiddenRoomFast;
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::getCurrentRoomActivity()
    getCurrentRoomActivity(): HabboActivityState | null
    {
        if(!this.isInRoom()) return null;

        let best = HabboActivityState.CHILLING;

        for(const state of this.getAllCurrentRoomActivities())
        {
            if(state.rank > best.rank) best = state;
        }

        return best;
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::getCurrentRoomName()
    getCurrentRoomName(): string | null
    {
        if(!this.isInRoom()) return null;

        return this._roomNameFast;
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::onGetGuestRoomResult()
    private onGetGuestRoomResult = (event: IMessageEvent): void =>
    {
        const parser = (event as GetGuestRoomResultMessageEvent).parser as GetGuestRoomResultMessageParser | null;

        if(parser === null) return;

        if(parser.openingConnection || parser.enterRoom)
        {
            const data = parser.data;

            this._roomNameFast = data?.roomName ?? null;
            this._inHiddenRoomFast = data?.doorMode === 3;
            this._roomId = data?.flatId ?? -1;
            this._categoryFast = data?.categoryId ?? 0;

            this._manager?.tryUpdatePresence(parser.enterRoom);
        }
    };

    // AS3: .../habbo_activity/HabboActivityDetection.as::getAllCurrentRoomActivities()
    private getAllCurrentRoomActivities(): HabboActivityState[]
    {
        const states: HabboActivityState[] = [];

        if(this._roomSession === null || !this.isInRoom()) return states;

        if(this._roomSession.isGameSession)
        {
            states.push(HabboActivityState.GAMING);
        }
        else
        {
            const byCategory = this.activityStateByRoomCategory(this._categoryFast);

            if(byCategory !== null) states.push(byCategory);
        }

        if(this._inventory !== null && this._inventory.tradingActive) states.push(HabboActivityState.TRADING);

        if(this._roomSession.isUserDecorating)
        {
            states.push(HabboActivityState.BUILDING);
        }
        else
        {
            const now = HabboActivityDetection.getTimer();
            const window = this.getDynamicWindowMs(this._furniTimestamps, now);

            if(this._lastFurniTime > 0 && now - this._lastFurniTime <= window)
            {
                states.push(HabboActivityState.BUILDING);
            }
        }

        const now = HabboActivityDetection.getTimer();

        if(this._dancing) states.push(HabboActivityState.DANCING);

        const chatWindow = this.getDynamicWindowMs(this._chatTimestamps, now);

        if(this._lastChatTime > 0 && now - this._lastChatTime <= chatWindow)
        {
            states.push(HabboActivityState.CHATTING);
        }

        return states;
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::onRoomSessionEvent()
    private onRoomSessionEvent(event: RoomSessionEvent): void
    {
        switch(event.type)
        {
            case RoomSessionEvent.RSE_STARTED:
                this._roomSession = event.session;
                this.resetRecents();
                this._manager?.tryUpdatePresence(false, true);
                break;
            case RoomSessionEvent.RSE_ENDED:
                this.resetRecents();
                this._manager?.tryUpdatePresence(false, true);
                break;
        }
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::onRoomSessionChat()
    private onRoomSessionChat(event: RoomSessionChatEvent): void
    {
        if(this._roomSession === null || event === null) return;

        if(
            event.userId === this._roomSession.ownUserRoomId
            && !(this._freeFlowChat?.isNotificationStyle(event.styleId) ?? false)
        )
        {
            this._lastChatTime = HabboActivityDetection.getTimer();
            this.recordActivity(this._chatTimestamps, this._lastChatTime);
            this._manager?.tryUpdatePresence();
        }
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::onRoomSessionDance()
    private onRoomSessionDance(event: RoomSessionDanceEvent): void
    {
        if(this._roomSession === null || event === null) return;

        if(event.userId === this._roomSession.ownUserRoomId)
        {
            this._dancing = event.danceStyle > 0;
            this._manager?.tryUpdatePresence();
        }
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::onRoomEngineObjectPlaced()
    private onRoomEngineObjectPlaced(event: RoomEngineObjectPlacedEvent): void
    {
        if(event === null) return;

        if(
            event.type === RoomEngineObjectEvent.REOE_PLACED
            && event.placementSource === 'inventory'
            && event.placedInRoom
        )
        {
            this._lastFurniTime = HabboActivityDetection.getTimer();
            this.recordActivity(this._furniTimestamps, this._lastFurniTime);
            this._manager?.tryUpdatePresence();
        }
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::onRoomEngineObjectActivity()
    private onRoomEngineObjectActivity(event: RoomEngineObjectEvent): void
    {
        if(event === null) return;

        if(
            event.type === RoomEngineObjectEvent.REOE_REQUEST_MOVE
            || event.type === RoomEngineObjectEvent.REOE_REQUEST_ROTATE
        )
        {
            this._lastFurniTime = HabboActivityDetection.getTimer();
            this.recordActivity(this._furniTimestamps, this._lastFurniTime);
            this._manager?.tryUpdatePresence();
        }
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::recordActivity()
    private recordActivity(timestamps: number[], now: number): void
    {
        timestamps.push(now);
        this.pruneOld(timestamps, now);
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::pruneOld()
    private pruneOld(timestamps: number[], now: number): void
    {
        while(timestamps.length > 0 && now - timestamps[0]! > HabboActivityDetection.ACTIVITY_VOLUME_WINDOW_MS)
        {
            timestamps.shift();
        }
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::getDynamicWindowMs()
    private getDynamicWindowMs(timestamps: number[], now: number): number
    {
        this.pruneOld(timestamps, now);

        let count = timestamps.length;

        if(count <= 0) return 0;

        if(count > HabboActivityDetection.ACTIVITY_MAX_COUNT) count = HabboActivityDetection.ACTIVITY_MAX_COUNT;

        let ratio = (count - 1) / (HabboActivityDetection.ACTIVITY_MAX_COUNT - 1);

        if(ratio < 0) ratio = 0;
        if(ratio > 1) ratio = 1;

        return Math.trunc(
            HabboActivityDetection.ACTIVITY_MIN_WINDOW_MS
            + ratio * (HabboActivityDetection.ACTIVITY_MAX_WINDOW_MS - HabboActivityDetection.ACTIVITY_MIN_WINDOW_MS)
        );
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::activityStateByRoomCategory()
    private activityStateByRoomCategory(categoryId: number): HabboActivityState | null
    {
        if(this.isCategoryMatch(categoryId, 'rpg')) return HabboActivityState.RPG;
        if(this.isCategoryMatch(categoryId, 'agency')) return HabboActivityState.WORKING;
        if(this.isCategoryMatch(categoryId, 'games')) return HabboActivityState.GAMING;

        return null;
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::isCategoryMatch()
    private isCategoryMatch(categoryId: number, key: string): boolean
    {
        const value = this.getProperty(`discord.room_category.${key}`);

        if(value === null || value.length === 0) return false;

        return value.split(',').indexOf(String(categoryId)) !== -1;
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::resetRecents()
    private resetRecents(): void
    {
        this._lastChatTime = 0;
        this._dancing = false;
        this._lastFurniTime = 0;
        this._chatTimestamps = [];
        this._furniTimestamps = [];
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::addMessageEvent()
    addMessageEvent(event: IMessageEvent): void
    {
        this._communicationManager?.addHabboConnectionMessageEvent(event);
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::removeMessageEvent()
    removeMessageEvent(event: IMessageEvent): void
    {
        this._communicationManager?.removeHabboConnectionMessageEvent(event);
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::get roomId()
    get roomId(): number
    {
        return this._roomId;
    }

    // AS3: .../habbo_activity/HabboActivityDetection.as::dispose()
    override dispose(): void
    {
        super.dispose();

        this._navigator = null;
        this._inventory = null;
        this._roomSession = null;
        this._manager = null;

        for(const event of this._messageEvents)
        {
            this.removeMessageEvent(event);
        }

        this._messageEvents = [];
    }
}
