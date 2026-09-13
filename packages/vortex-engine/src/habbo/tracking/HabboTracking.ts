import {Component, ComponentDependency, type IContext} from '@core/runtime';
import type {IUpdateReceiver} from '@core/runtime/IContext';
import type {IAssetLibrary} from '@core/assets';
import {Logger} from '@core/utils/Logger';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IMessageComposer} from '@core/communication/messages/IMessageComposer';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import {
    AuthenticationOKMessageEvent
} from '@habbo/communication/messages/incoming/handshake/AuthenticationOKMessageEvent';
import {RoomEntryInfoMessageEvent} from '@habbo/communication/messages/incoming/room/engine/RoomEntryInfoMessageEvent';
import {
    HabboAchievementNotificationMessageEvent
} from '@habbo/communication/messages/incoming/notifications/HabboAchievementNotificationMessageEvent';
import type {
    HabboAchievementNotificationMessageEventParser
} from '@habbo/communication/messages/parser/notifications/HabboAchievementNotificationMessageEventParser';
import type {
    RoomEntryInfoMessageParser
} from '@habbo/communication/messages/parser/room/engine/RoomEntryInfoMessageParser';
import {
    LatencyPingResponseMessageEvent
} from '@habbo/communication/messages/incoming/tracking/LatencyPingResponseMessageEvent';
import type {
    LatencyPingResponseMessageParser
} from '@habbo/communication/messages/parser/tracking/LatencyPingResponseMessageParser';
import {EventLogMessageComposer} from '@habbo/communication/messages/outgoing/tracking/EventLogMessageComposer';
import type {IHabboTracking} from './IHabboTracking';
import {HabboLoginTrackingStep} from './HabboLoginTrackingStep';
import {HabboErrorVariableEnum} from './HabboErrorVariableEnum';
import {ErrorReportStorage} from '@core/utils/ErrorReportStorage';
import {ComponentEvents} from '@core/runtime';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboNavigator} from '@iid/IIDHabboNavigator';
import {IID_HabboInventory} from '@iid/IIDHabboInventory';
import {IID_HabboFriendList} from '@iid/IIDHabboFriendList';
import {HabboWindowTrackingEvent} from '@habbo/window/enum/HabboWindowTrackingEvent';
import {HabboNavigatorTrackingEvent} from '@habbo/navigator/events/HabboNavigatorTrackingEvent';
import {HabboRoomSettingsTrackingEvent} from '@habbo/navigator/events/HabboRoomSettingsTrackingEvent';
import {HabboInventoryTrackingEvent} from '@habbo/inventory/events/HabboInventoryTrackingEvent';
import {HabboFriendListTrackingEvent} from '@habbo/friendlist/events/HabboFriendListTrackingEvent';
import {LatencyTracker} from './LatencyTracker';
import {FramerateTracker} from './FramerateTracker';
import {LagWarningLogger} from './LagWarningLogger';
import {ToolbarClickTracker} from './ToolbarClickTracker';
import {PerformanceTracker} from './PerformanceTracker';
import {IID_HabboCommunicationManager} from "@iid/IIDHabboCommunicationManager";

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = Logger.getLogger('habbo.tracking.HabboTracking');

/**
 * Main tracking component for the Habbo client.
 *
 * Manages all sub-trackers (latency, framerate, lag warnings, toolbar clicks)
 * and provides methods for event logging, Google Analytics tracking, and
 * error reporting. Implements the IUpdateReceiver interface for frame-based updates.
 *
 * @see source_as_win63/habbo/tracking/HabboTracking.as
 */
export class HabboTracking extends Component implements IHabboTracking, IUpdateReceiver
{
    // DEVIATION: AS3 reaches tracking through a global singleton (`_SafeStr_4847`, assigned `this`
    //   in the constructor and cleared in dispose()) that dozens of unrelated classes call
    //   directly. This port resolves it through `IID_HabboTracking` at every one of those call
    //   sites instead — `grep -rn "IID_HabboTracking" packages/vortex-engine/src` is the check, and
    //   `HabboCatalog.get tracking()` is the documented precedent. Adding `getInstance()` back
    //   would be a second, competing way to reach the same instance, and the one that bypasses the
    //   DI lifecycle: a caller holding the static reference keeps working after the component is
    //   disposed, which is the bug the pattern exists to prevent. Not a gap — a decision.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/tracking/HabboTracking.as::getInstance()

    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::ERROR_DATA_FLAG_COUNT
    private static readonly ERROR_DATA_FLAG_COUNT: number = 11;

    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::_communication
    private _communication: IHabboCommunicationManager | null = null;
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/tracking/HabboTracking.as::_errorContextFlags
    private _errorContextFlags: number[] = [];
    private _hasFatalError: boolean = false;

    // Sub-trackers
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/tracking/HabboTracking.as::_framerateTracker
    private _framerateTracker: FramerateTracker | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/tracking/HabboTracking.as::_latencyTracker
    private _latencyTracker: LatencyTracker | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/tracking/HabboTracking.as::_lagWarningLogger
    private _lagWarningLogger: LagWarningLogger | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/tracking/HabboTracking.as::_toolbarClickTracker
    private _toolbarClickTracker: ToolbarClickTracker | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/tracking/HabboTracking.as::_performanceTracker
    private _performanceTracker: PerformanceTracker | null = null;

    // State
    private _hasEnteredRoom: boolean = false;
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::_currentTime
    private _currentTime: number = -1;
    private _invalidTimeCounter: number = 0;
    private _timeLeapCounter: number = 0;
    private _onceTrackedEvents: Set<string> = new Set();

    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    /**
	 * Component dependencies
	 */
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communication = manager;
                },
                true
            ),
            // Every callback below is WRAPPED in a lambda, and must stay wrapped: `get
            // dependencies()` is read from inside Component's constructor — during `super()` —
            // and TypeScript runs a derived class's field initialisers AFTER super() returns.
            // Passing `this.onWindowTrackingEvent` directly hands `undefined` to
            // `events.on()`, which throws "The listener must be a function" and takes the whole
            // DI unlock chain with it. The lambda defers the lookup to call time.
            // Four of the six UI buses AS3 listens to, in its own order — the two it skips are
            // TODO'd below because nothing in this port emits on them yet. Every bus here already
            // emits; only the listener was missing, so `_errorContextFlags` was written by nobody
            // and read by nobody. All non-hard: tracking must never be what locks a component, and
            // an absent subsystem simply contributes no flag.
            // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::get dependencies()
            new ComponentDependency(IID_HabboWindowManager, null, false, [
                {type: HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_INPUT, callback: (...a: unknown[]) => this.onWindowTrackingEvent(...a)},
                {type: HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_RENDER, callback: (...a: unknown[]) => this.onWindowTrackingEvent(...a)},
                {type: HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_SLEEP, callback: (...a: unknown[]) => this.onWindowTrackingEvent(...a)},
            ]),
            new ComponentDependency(IID_HabboNavigator, null, false, [
                {type: HabboNavigatorTrackingEvent.CLOSED, callback: (...a: unknown[]) => this.onNavigatorTrackingEvent(...a)},
                {type: HabboNavigatorTrackingEvent.EVENTS, callback: (...a: unknown[]) => this.onNavigatorTrackingEvent(...a)},
                {type: HabboNavigatorTrackingEvent.ROOMS, callback: (...a: unknown[]) => this.onNavigatorTrackingEvent(...a)},
                {type: HabboNavigatorTrackingEvent.ME, callback: (...a: unknown[]) => this.onNavigatorTrackingEvent(...a)},
                {type: HabboNavigatorTrackingEvent.OFFICIAL, callback: (...a: unknown[]) => this.onNavigatorTrackingEvent(...a)},
                {type: HabboNavigatorTrackingEvent.SEARCH, callback: (...a: unknown[]) => this.onNavigatorTrackingEvent(...a)},
                {type: HabboRoomSettingsTrackingEvent.CLOSED, callback: (...a: unknown[]) => this.onRoomSettingsTrackingEvent(...a)},
                {type: HabboRoomSettingsTrackingEvent.DEFAULT, callback: (...a: unknown[]) => this.onRoomSettingsTrackingEvent(...a)},
                {type: HabboRoomSettingsTrackingEvent.ADVANCED, callback: (...a: unknown[]) => this.onRoomSettingsTrackingEvent(...a)},
            ]),
            // TODO(AS3): .../src/com/sulake/habbo/tracking/HabboTracking.as::get dependencies() also
            //   takes IIDHabboCatalog with HABBO_CATALOG_TRACKING_EVENT_OPEN/_CLOSE onto flag 9,
            //   plus CATALOG_PAGE_OPENED onto legacyTrackGoogle(). Not subscribed for the same
            //   reason as help below: the whole bus is silent here — `HabboCatalogTrackingEvent` is
            //   declared and nothing emits either member. Partial buses ARE subscribed (navigator,
            //   room settings and inventory each emit most of their members and will emit the rest
            //   as those tabs are wired); a bus with no speaker at all is not.
            //   `scripts/check-tracking-buses.mjs` tells the two apart.
            new ComponentDependency(IID_HabboInventory, null, false, [
                {type: HabboInventoryTrackingEvent.CLOSED, callback: (...a: unknown[]) => this.onInventoryTrackingEvent(...a)},
                {type: HabboInventoryTrackingEvent.FURNI, callback: (...a: unknown[]) => this.onInventoryTrackingEvent(...a)},
                {type: HabboInventoryTrackingEvent.POSTERS, callback: (...a: unknown[]) => this.onInventoryTrackingEvent(...a)},
                {type: HabboInventoryTrackingEvent.BADGES, callback: (...a: unknown[]) => this.onInventoryTrackingEvent(...a)},
                {type: HabboInventoryTrackingEvent.ACHIEVEMENTS, callback: (...a: unknown[]) => this.onInventoryTrackingEvent(...a)},
                {type: HabboInventoryTrackingEvent.TRADING, callback: (...a: unknown[]) => this.onInventoryTrackingEvent(...a)},
            ]),
            new ComponentDependency(IID_HabboFriendList, null, false, [
                {type: HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_CLOSED, callback: (...a: unknown[]) => this.onFriendListTrackingEvent(...a)},
                {type: HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_FRIENDS, callback: (...a: unknown[]) => this.onFriendListTrackingEvent(...a)},
                {type: HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_SEARCH, callback: (...a: unknown[]) => this.onFriendListTrackingEvent(...a)},
                {type: HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_REQUEST, callback: (...a: unknown[]) => this.onFriendListTrackingEvent(...a)},
                {type: HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_MINIMIZED, callback: (...a: unknown[]) => this.onFriendListTrackingEvent(...a)},
            ]),
            // TODO(AS3): .../src/com/sulake/habbo/tracking/HabboTracking.as::get dependencies() also
            //   takes IIDHabboHelp with HABBO_HELP_TRACKING_EVENT_CLOSED/_DEFAULT onto flag 10.
            //   Not subscribed: nothing in this port emits either — `HabboHelpTrackingEvent` is
            //   declared and re-exported and never sent, so the listener would be a listener for a
            //   bus with no speaker, which is the exact defect this whole change removes. Subscribe
            //   it when HabboHelp emits; `scripts/check-tracking-buses.mjs` is the check.
        ];
    }

    /**
	 * Send a message composer via the communication manager
	 *
	 * @param composer The message composer to send
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::send()
    send(composer: IMessageComposer<unknown[]>): void
    {
        if(this._communication?.connection?.connected)
        {
            this._communication.connection.send(composer);
        }
    }

    /**
	 * Track an event via Google Analytics (no-op in web client)
	 *
	 * @param category The event category
	 * @param action The event action
	 * @param label Optional numeric label
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::trackGoogle()
    trackGoogle(category: string, action: string, label: number = -1): void
    {
        log.debug(`[GA] ${category}/${action}${label >= 0 ? '/' + label : ''}`);
    }

    /**
	 * Legacy Google Analytics tracking (no-op in web client)
	 *
	 * @param category The event category
	 * @param action The event action
	 * @param labels Optional array of label values
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::legacyTrackGoogle()
    legacyTrackGoogle(category: string, action: string, labels?: unknown[]): void
    {
        log.debug(`[GA Legacy] ${category}/${action}`, labels ?? '');
    }

    /**
	 * Log an error message
	 *
	 * @param message The error message
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::logError()
    logError(message: string): void
    {
        log.error('logError:', message);
    }

    /**
	 * Report a detected chat lag event
	 *
	 * @param currentTime The current time, used to throttle the warning report
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/tracking/HabboTracking.as::chatLagDetected()
    chatLagDetected(currentTime: number): void
    {
        if(this._lagWarningLogger)
        {
            this._lagWarningLogger.chatLagDetected(currentTime);
        }
    }

    /**
	 * Track an event log to the server via EventLogMessageComposer
	 *
	 * @param type The event type
	 * @param value The event value
	 * @param unit The event unit
	 * @param extra Optional extra string data
	 * @param roomId Optional room ID
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::trackEventLog()
    trackEventLog(type: string, value: string, unit: string, extra: string = '', roomId: number = 0): void
    {
        if(this._communication?.connection?.connected)
        {
            this._communication.connection.send(
                new EventLogMessageComposer(type, value, unit, extra, roomId)
            );
        }
    }

    /**
	 * Track an event log only once per session
	 *
	 * @param type The event type
	 * @param value The event value
	 * @param unit The event unit
	 * @param extra Optional extra string data
	 * @param roomId Optional room ID
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::trackEventLogOncePerSession()
    trackEventLogOncePerSession(type: string, value: string, unit: string, extra: string = '', roomId: number = 0): void
    {
        const key = type + value + unit;

        if(!this._onceTrackedEvents.has(key))
        {
            this.trackEventLog(type, value, unit, extra, roomId);
            this._onceTrackedEvents.add(key);
        }
    }

    /**
	 * Track a talent track open event
	 *
	 * @param talentType The talent type
	 * @param talentId The talent identifier
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::trackTalentTrackOpen()
    trackTalentTrackOpen(talentType: string, talentId: string): void
    {
        this.trackEventLog('Talent', talentType, 'talent.open', talentId);
    }

    /**
	 * Track a login step for analytics
	 *
	 * @param step The login step identifier
	 * @param extra Optional extra data
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::trackLoginStep()
    trackLoginStep(step: string, extra?: string): void
    {
        log.debug('Track Login Step:', step, extra ?? '');

        if(!this.getBoolean('processlog.enabled'))
        {
            return;
        }

        // In the web client, login step tracking is handled differently
        // than in the Flash client (no ExternalInterface)
        log.debug(`[LoginStep] ${step}${extra ? ' ' + extra : ''}`);
    }

    /**
	 * Frame update callback
	 *
	 * @param deltaTime Time since last update in milliseconds
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::update()
    update(deltaTime: number): void
    {
        const currentTime = performance.now();

        if(this._currentTime > -1 && currentTime < this._currentTime)
        {
            this._invalidTimeCounter++;
            log.warn('Invalid time detected, count:', this._invalidTimeCounter);
        }

        if(this._currentTime > -1 && currentTime - this._currentTime > 15000)
        {
            this._timeLeapCounter++;
            log.warn('Time leap detected, count:', this._timeLeapCounter);
        }

        this._currentTime = currentTime;

        if(this._latencyTracker)
        {
            this._latencyTracker.update(deltaTime, this._currentTime);
        }

        if(this._framerateTracker)
        {
            this._framerateTracker.trackUpdate(deltaTime, this._currentTime);
        }

        if(this._performanceTracker)
        {
            this._performanceTracker.update(deltaTime, this._currentTime);
        }

        if(this._lagWarningLogger)
        {
            this._lagWarningLogger.update(this._currentTime);
        }
    }

    /** The last round trip measured, in ms; -1 while the latency tracker is not up. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/tracking/HabboTracking.as::get latencyPingMs()
    get latencyPingMs(): number
    {
        return this._latencyTracker !== null ? this._latencyTracker.latestLatency : -1;
    }

    /**
	 * Track a toolbar button click
	 *
	 * @param buttonName The name of the clicked button
	 */
    trackToolbarClick(buttonName: string): void
    {
        if(this._toolbarClickTracker)
        {
            this._toolbarClickTracker.track(buttonName);
        }
    }

    /**
	 * Dispose of the tracking component and all sub-trackers
	 */
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        this.removeUpdateReceiver(this);

        if(this._messageEvents.length > 0 && this._communication)
        {
            for(const event of this._messageEvents)
            {
                this._communication.removeMessageEvent(event);
            }
        }

        this._messageEvents.length = 0;
        this._framerateTracker = null;
        this._toolbarClickTracker = null;
        this._performanceTracker = null;

        if(this._latencyTracker)
        {
            this._latencyTracker.dispose();
            this._latencyTracker = null;
        }

        this._lagWarningLogger = null;

        super.dispose();
    }

    /**
	 * Called when all required dependencies are available
	 */
    protected override initComponent(): void
    {
        // Initialize error context flags array
        for(let i = 0; i < HabboTracking.ERROR_DATA_FLAG_COUNT; i++)
        {
            this._errorContextFlags.push(0);
        }

        // The other half of the error context: AS3 folds the flags into every error report through
        // `storeErrorDetails()`. Without this the array was written by nobody and read by nobody.
        // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onError()
        this.context.events.on(ComponentEvents.ERROR, this.onError);

        // Register for frame updates
        this.registerUpdateReceiver(this, 1);

        this._latencyTracker = new LatencyTracker(this);
        this._framerateTracker = new FramerateTracker(this);
        this._lagWarningLogger = new LagWarningLogger(this);
        this._toolbarClickTracker = new ToolbarClickTracker(this);
        this._performanceTracker = new PerformanceTracker(this);

        // Register message events
        this.addMessageEvent(new AuthenticationOKMessageEvent(this.onAuthOK.bind(this)));
        this.addMessageEvent(new RoomEntryInfoMessageEvent(this.onRoomEnter.bind(this)));
        this.addMessageEvent(
            new HabboAchievementNotificationMessageEvent(this.onAchievementNotification.bind(this))
        );
        this.addMessageEvent(new LatencyPingResponseMessageEvent(this.onPingResponse.bind(this)));

        // Initialize latency tracker once configuration is available
        if(this._latencyTracker)
        {
            this._latencyTracker.init();
        }

        log.debug('HabboTracking initialized');
    }

    /**
	 * Register a message event with the communication manager
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::addMessageEvent()
    private addMessageEvent(event: IMessageEvent): void
    {
        if(this._communication)
        {
            this._communication.addMessageEvent(event);
            this._messageEvents.push(event);
        }
    }

    /**
	 * Set an error context flag at the given index
	 */
    /**
	 * The six bus handlers, each a thin switch onto `setErrorContextFlag()` exactly as AS3 writes
	 * them. The value is not a boolean: it encodes WHICH view of that subsystem is open (navigator
	 * 0=closed, 1=events, 2=rooms, 3=me, 4=official, 5=search), which is why the AS3 flag array is
	 * numbers and not a bitmask.
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onWindowTrackingEvent()
    private onWindowTrackingEvent = (...args: unknown[]): void =>
    {
        switch(this.eventType(args))
        {
            case HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_SLEEP: this.setErrorContextFlag(0, 3); break;
            case HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_RENDER: this.setErrorContextFlag(1, 3); break;
            case HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_INPUT: this.setErrorContextFlag(2, 3); break;
        }
    };

    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onNavigatorTrackingEvent()
    private onNavigatorTrackingEvent = (...args: unknown[]): void =>
    {
        switch(this.eventType(args))
        {
            case HabboNavigatorTrackingEvent.CLOSED: this.setErrorContextFlag(0, 4); break;
            case HabboNavigatorTrackingEvent.EVENTS: this.setErrorContextFlag(1, 4); break;
            case HabboNavigatorTrackingEvent.ROOMS: this.setErrorContextFlag(2, 4); break;
            case HabboNavigatorTrackingEvent.ME: this.setErrorContextFlag(3, 4); break;
            case HabboNavigatorTrackingEvent.OFFICIAL: this.setErrorContextFlag(4, 4); break;
            case HabboNavigatorTrackingEvent.SEARCH: this.setErrorContextFlag(5, 4); break;
        }
    };

    // TODO(AS3): .../src/com/sulake/habbo/tracking/HabboTracking.as::onNavigatorTrackingEvent() also
    //   maps the eleven SEARCHTYPE_* events onto `legacyTrackGoogle("navigator", <name>)`. Not wired
    //   here because nothing in this port emits a SEARCHTYPE_* event yet — the constants exist in
    //   HabboNavigatorTrackingEvent and have no `emit` site, so subscribing would be a listener for
    //   a bus with no speaker. Wire them with the emitters, not before.

    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onRoomSettingsTrackingEvent()
    private onRoomSettingsTrackingEvent = (...args: unknown[]): void =>
    {
        switch(this.eventType(args))
        {
            case HabboRoomSettingsTrackingEvent.CLOSED: this.setErrorContextFlag(0, 7); break;
            case HabboRoomSettingsTrackingEvent.DEFAULT: this.setErrorContextFlag(1, 7); break;
            case HabboRoomSettingsTrackingEvent.ADVANCED: this.setErrorContextFlag(2, 7); break;
        }
    };

    // TODO(AS3): .../src/com/sulake/habbo/tracking/HabboTracking.as::onCatalogTrackingEvent() maps
    //   OPEN/CLOSE onto flag 9. Not written: see the catalog TODO in `get dependencies()` — the bus
    //   has no emitter, and a handler for a subscription that does not exist is worse than no
    //   handler, because it reads as covered.

    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onInventoryTrackingEvent()
    private onInventoryTrackingEvent = (...args: unknown[]): void =>
    {
        switch(this.eventType(args))
        {
            case HabboInventoryTrackingEvent.CLOSED: this.setErrorContextFlag(0, 5); break;
            case HabboInventoryTrackingEvent.FURNI: this.setErrorContextFlag(1, 5); break;
            case HabboInventoryTrackingEvent.POSTERS: this.setErrorContextFlag(2, 5); break;
            case HabboInventoryTrackingEvent.BADGES: this.setErrorContextFlag(3, 5); break;
            case HabboInventoryTrackingEvent.ACHIEVEMENTS: this.setErrorContextFlag(4, 5); break;
            case HabboInventoryTrackingEvent.TRADING: this.setErrorContextFlag(5, 5); break;
        }
    };

    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onFriendlistTrackingEvent()
    private onFriendListTrackingEvent = (...args: unknown[]): void =>
    {
        switch(this.eventType(args))
        {
            case HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_CLOSED: this.setErrorContextFlag(0, 6); break;
            case HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_FRIENDS: this.setErrorContextFlag(1, 6); break;
            case HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_SEARCH: this.setErrorContextFlag(2, 6); break;
            case HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_REQUEST: this.setErrorContextFlag(3, 6); break;
            case HabboFriendListTrackingEvent.HABBO_FRIENDLIST_TRACKING_EVENT_MINIMIZED: this.setErrorContextFlag(4, 6); break;
        }
    };

    // TODO(AS3): .../src/com/sulake/habbo/tracking/HabboTracking.as::onHelpTrackingEvent() maps
    //   CLOSED/DEFAULT onto flag 10. Not written, for the same reason as the catalog one above.

    /**
	 * AS3 reads `event.type` off the Flash Event it is handed. This port's dependency subscriptions
	 * forward whatever the emitter passed, and the emitters are not uniform — some emit the type
	 * string alone, some an object carrying it — so both shapes are accepted rather than assuming
	 * one and silently matching no case.
	 */
    // TS-only: Flash's Event carries `type`; an EventEmitter payload does not have to.
    private eventType(args: unknown[]): string
    {
        const first = args[0];

        if(typeof first === 'string') return first;
        if(first && typeof first === 'object' && typeof (first as {type?: unknown}).type === 'string')
        {
            return (first as {type: string}).type;
        }

        return '';
    }

    /**
	 * AS3 also sets `_SafeStr_9384` on a critical error and calls
	 * `logError(context.root.getLastErrorMessage())`. Neither has a counterpart here: the flag is
	 * read nowhere in the AS3 either, and this port has no `getLastErrorMessage()` — its error text
	 * arrives on the event itself, which is what is logged instead.
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onError()
    private onError = (event: {message?: string; fatal?: boolean}): void =>
    {
        this.storeErrorDetails(event);
        this.logError(event?.message ?? '');
    };

    /**
	 * `error_ctx` is the flag array concatenated in index order — "00010000200" and so on — which is
	 * how a crash report says which screens were open when it happened. That is the entire reason
	 * the six bus subscriptions above exist.
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::storeErrorDetails()
    private storeErrorDetails(event: {fatal?: boolean}): void
    {
        ErrorReportStorage.setParameter(
            HabboErrorVariableEnum.ERROR_VARIABLE_IS_FATAL, String(event?.fatal === true));
        ErrorReportStorage.setParameter(
            HabboErrorVariableEnum.ERROR_VARIABLE_CLIENT_CRASH_TIME, String(Date.now()));
        ErrorReportStorage.setParameter(
            HabboErrorVariableEnum.ERROR_VARIABLE_CONTEXT, this._errorContextFlags.join(''));

        // AS3 follows this with `flash_version` and `avg_update` off its FramerateTracker
        // equivalent. `flash_version` has no counterpart; `avg_update` is left to the tracker that
        // owns it rather than reached into from here.
    }

    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::setErrorContextFlag()
    private setErrorContextFlag(value: number, index: number): void
    {
        if(index >= 0 && index < this._errorContextFlags.length)
        {
            this._errorContextFlags[index] = value;
        }
    }

    /**
	 * Handler for AuthenticationOK message
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onAuthOK()
    private onAuthOK(_event: IMessageEvent): void
    {
        this.legacyTrackGoogle('authentication', 'authok');
        this.trackLoginStep(HabboLoginTrackingStep.AUTHENTICATED);
    }

    /**
	 * Handler for latency ping response
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onPingResponse()
    private onPingResponse(event: IMessageEvent): void
    {
        if(this._latencyTracker)
        {
            const parser = (event as LatencyPingResponseMessageEvent).parser as LatencyPingResponseMessageParser;
            this._latencyTracker.onPingResponse(parser);
        }
    }

    /**
	 * Handler for room entry
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onRoomEnter()
    private onRoomEnter(event: IMessageEvent): void
    {
        if(!this._hasEnteredRoom)
        {
            this.trackLoginStep(HabboLoginTrackingStep.ROOM_ENTER);
            this._hasEnteredRoom = true;
        }

        const parser = (event as RoomEntryInfoMessageEvent).parser as RoomEntryInfoMessageParser;
        this.legacyTrackGoogle('navigator', 'private', [parser.guestRoomId]);
    }

    /**
	 * The badge the server just awarded, reported to analytics.
	 *
	 * Four other modules subscribe to this message and none of them is this one — the notification
	 * bubble, the inventory's badge tab and the quest handler all read it for what to show, which
	 * is why the gap was invisible: nothing looked broken, the hotel simply logged no achievement.
	 */
    // AS3: .../src/com/sulake/habbo/tracking/HabboTracking.as::onAchievementNotification()
    private onAchievementNotification(event: IMessageEvent): void
    {
        const parser = event.parser as HabboAchievementNotificationMessageEventParser;

        this.legacyTrackGoogle('achievement', 'achievement', [parser.data?.badgeCode]);
    }
}
