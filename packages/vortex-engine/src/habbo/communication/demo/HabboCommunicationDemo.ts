import {Component, ComponentDependency, ComponentEvents} from '@core/runtime';
import type {IContext} from '@core/runtime';
import {ErrorEvent} from '@core/runtime/events/ErrorEvent';
import {ErrorPopupCtrl} from './ErrorPopupCtrl';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {isRoomViewerMode} from '@habbo/configuration/enum/HabboComponentFlags';
import {IncomingMessages} from './IncomingMessages';
import type {HabboCommunicationEventType} from '../enum/HabboCommunicationEvent';
import {HabboCommunicationEvent} from '../enum/HabboCommunicationEvent';
import {HabboCommunicationManagerEvent} from '../enum/HabboCommunicationManagerEvent';
import type {IHabboCommunicationManager} from '../IHabboCommunicationManager';
import {
    SSOTicketMessageComposer,
    UniqueIDMessageComposer,
    VersionCheckMessageComposer,
} from '../messages/outgoing/handshake';
import {CommunicationUtils} from '@habbo/utils/CommunicationUtils';
import {IID_HabboCommunicationManager} from "@iid/IIDHabboCommunicationManager";
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import {DisconnectReasonMessageEvent} from '../messages/incoming/handshake/DisconnectReasonMessageEvent';
import type {IHabboCommunicationDemo} from "@habbo/communication/demo/IHabboCommunicationDemo";

const log = Logger.getLogger('habbo.communication.demo.HabboCommunicationDemo');

/**
 * Habbo Communication Demo
 *
 * Orchestrates the login/connection flow. Creates and manages IncomingMessages
 * for handling handshake, authentication, ping/pong, and error routing.
 *
 * In AS3 this also manages the login screen UI (HabboLoginDemoScreen). The port's login screen is
 * its own thing under `vortex-client/src/login/` — this class stays the connection half.
 *
 * @see source_as_win63/habbo/communication/demo/HabboCommunicationDemo.as
 */
export class HabboCommunicationDemo extends Component implements IHabboCommunicationDemo
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::ERROR_TYPE_IO_ERROR
    static readonly ERROR_TYPE_IO_ERROR: string = 'ioError';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::ERROR_CODE_MAINTENANCE
    static readonly ERROR_CODE_MAINTENANCE: string = 'maintenance';

    private _incomingMessages: IncomingMessages | null = null;
    private _isDisconnected: boolean = false;
    private _isLoggedIn: boolean = false;
    private _authenticationStarted: boolean = false;

    /** Derived name — `_SafeStr_6742`: the modal that shows a core error to the user. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::_SafeStr_6742
    private _errorPopup: ErrorPopupCtrl | null = null;

    constructor(context: IContext)
    {
        super(context);

        // AS3 builds it in the constructor and subscribes to the core's error bus in
        // `initComponent()`. Both are kept: the popup outlives every reconnect, so a second
        // `initComponent()` must not build a second one.
        this._errorPopup = new ErrorPopupCtrl(context);

        context.events.on(ComponentEvents.ERROR, this.onCoreError);
    }

    /**
     * Maintenance-shaped categories disconnect with the maintenance reason; everything else goes to
     * the popup. The list is AS3's, verbatim and unsorted.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::onCoreError()
    private onCoreError = (event: {message: string; fatal: boolean; code: number; error?: Error}): void =>
    {
        const errorEvent = new ErrorEvent(
            ComponentEvents.ERROR, event.message, event.fatal, event.code, event.error ?? null
        );

        switch(errorEvent.category)
        {
            case 30:
            case 29:
            case 1:
            case 3:
            case 20:
            case 8:
            case 12:
            case 7:
                if(errorEvent.critical && !this.isExcludeFromCrashing(errorEvent.category))
                {
                    this.disconnected(
                        -2,
                        this._localization?.getLocalization('disconnected.reason.maintenance', '') ?? ''
                    );
                }
                break;
            default:
                this.handleNonMaintenanceCoreError(errorEvent);
        }
    };

    /**
     * AS3's first `if` here is an empty body — a comparison of `error.errorID` against `category`
     * whose branch was stripped by the compiler — so it is not transcribed.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::handleNonMaintenanceCoreError()
    private handleNonMaintenanceCoreError(event: ErrorEvent): void
    {
        const suppressed = this.isExcludeFromWarnings(event.category)
            || (!event.critical && !this.getBoolean('error_handling.show_error.include_non_critical'));

        if(!suppressed && this.getBoolean('error_handling.show_error'))
        {
            this._errorPopup?.onError(event, this.getBoolean('error_handling.show_stacktrace'));
        }

        if(event.critical
            && !this.isExcludeFromCrashing(event.category)
            && this.getBoolean('error_handling.crash_on_critical_error'))
        {
            this.disconnected(-1, DisconnectReasonMessageEvent.resolveDisconnectedReasonLocalizationKey(-1));
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::isExcludeFromWarnings()
    private isExcludeFromWarnings(category: number): boolean
    {
        return this.isExcludedFromListProperty(category, 'error_handling.exclude_warnings');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::isExcludeFromCrashing()
    private isExcludeFromCrashing(category: number): boolean
    {
        return this.isExcludedFromListProperty(category, 'error_handling.exclude_crashing');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::isExcludedFromListProperty()
    private isExcludedFromListProperty(category: number, property: string): boolean
    {
        const list = this.getProperty(property);

        if(!list) return false;

        return list.split(',').indexOf(category.toString()) !== -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::_communication
    private _communication: IHabboCommunicationManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::_localization
    private _localization: IHabboLocalizationManager | null = null;

    /**
	 * @see source_as_win63/habbo/communication/demo/HabboCommunicationDemo.as communication
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::get communication()
    get communication(): IHabboCommunicationManager | null
    {
        return this._communication;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/demo/HabboCommunicationDemo.as::_ssoTicket
    private _ssoTicket: string | null = null;

    /**
	 * @see source_as_win63/habbo/communication/demo/HabboCommunicationDemo.as ssoTicket
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::set ssoTicket()
    set ssoTicket(value: string)
    {
        this._ssoTicket = value;
    }

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
            // Both optional on purpose: the demo is the first thing the boot sequence builds, and
            // a hard dependency on an IID nothing has provided yet locks the component with no log
            // at all — which would take the login flow down with it. They are only read from
            // `disconnected()`, long after everything is up.
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this._windowManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) =>
                {
                    this._localization = manager;
                },
                false
            ),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::initGameSocket()
    initGameSocket(): void
    {
        if(!this._communication)
        {
            log.error('Communication manager not available');
            return;
        }

        if(!this._ssoTicket && this._communication.ssoTicket)
        {
            this._ssoTicket = this._communication.ssoTicket;
        }

        this._authenticationStarted = true;
        this._isDisconnected = false;
        this._isLoggedIn = false;

        this.dispatchLoginStepEvent(HabboCommunicationEvent.INIT);

        // AS3: _communication.mode = 0
        this._communication.initConnection('habbo');

        // Create IncomingMessages after connection exists
        // In AS3 this is created in initComponent() because the connection already exists at that point.
        // In our architecture the connection is created lazily in initConnection().
        if(this._incomingMessages)
        {
            this._incomingMessages.dispose();
        }

        this._incomingMessages = new IncomingMessages(this, this._communication);
    }

    /**
	 * Overrides the client URL reported in the version check
	 *
	 * AS3 keeps it in a field the host page sets before connecting; the property it otherwise
	 * falls back to (`flash.client.url`) is the same value, so a hotel that does not set one gets
	 * identical behaviour either way.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::set flashClientUrl()
    set flashClientUrl(url: string)
    {
        this._flashClientUrl = url;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::_SafeStr_8194 (name derived: written by set flashClientUrl(), read by sendConnectionParameters())
    private _flashClientUrl: string | null = null;

    /**
	 * Whether the client is running as a bare room viewer rather than a full hotel session
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::get isRoomViewerMode()
    get isRoomViewerMode(): boolean
    {
        return isRoomViewerMode(this.flags);
    }

    // DEVIATION: not ported, and it is unreachable twice over in the original client. AS3 sends a
    //   username/password login straight down the socket, but (1) the composer is neutered —
    //   `_SafeCls_1711.getMessageArray()` returns an empty array, so no credentials travel — and
    //   (2) `_SafeCls_1711` has no entry in the message registry at all: `_SafeCls_2046.as` maps
    //   581 composers to headers and this is not one of them, so the packet has no header to be
    //   serialised under. Porting it would add a dev-only credential path that cannot reach the
    //   wire. SSO (`setSSOTicket()` below) is the live route.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::sendTryLoginDevelopmentOnly()

    // DEVIATION: not ported. AS3 auto-selects a developer account from the returned avatar list
    //   by matching it against a "useruniqueid" read out of a Flash local shared object, then
    //   fires `sendTryLoginDevelopmentOnly()` on a 500ms Timer. Both halves are development-only:
    //   the SOL has no counterpart here, and the login it would fire is the neutered one above.
    //   The non-auto branch hands the list to a character-list view this port does not have.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::onUserList()

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::setSSOTicket()
    setSSOTicket(ticket: string): void
    {
        if(ticket && !this._ssoTicket)
        {
            this._ssoTicket = ticket;
            this.initGameSocket();
        }
    }

    startConnectionWithSSO(ticket: string): void
    {
        if(!ticket || ticket.length === 0)
        {
            throw new Error('[HabboCommunicationDemo] SSO ticket is required');
        }

        if(this._isLoggedIn || this._authenticationStarted)
        {
            return;
        }

        if(!this._ssoTicket)
        {
            this.setSSOTicket(ticket);
            return;
        }

        this.initWithSSO(ticket);
    }

    waitForAuthentication(timeoutMs: number = 15000): Promise<void>
    {
        if(this._isLoggedIn)
        {
            return Promise.resolve();
        }

        if(this._isDisconnected)
        {
            return Promise.reject(new Error('[HabboCommunicationDemo] Disconnected before authentication'));
        }

        if(!this._communication?.events)
        {
            return Promise.reject(new Error('[HabboCommunicationDemo] Communication manager not available'));
        }

        const events = this._communication.events;

        return new Promise((resolve, reject) =>
        {
            let settled = false;
            let timeoutId: ReturnType<typeof setTimeout> | null = null;

            const cleanup = (): void =>
            {
                if(timeoutId !== null)
                {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                events.off(HabboCommunicationManagerEvent.LOGIN_STEP, onLoginStep);
                events.off(HabboCommunicationManagerEvent.DISCONNECTED, onDisconnected);
                events.off(HabboCommunicationManagerEvent.CONNECTION_ERROR, onConnectionError);
            };

            const resolveAuthenticated = (): void =>
            {
                if(settled) return;

                settled = true;
                cleanup();
                resolve();
            };

            const rejectAuthentication = (error: Error): void =>
            {
                if(settled) return;

                settled = true;
                cleanup();
                reject(error);
            };

            const onLoginStep = (step: HabboCommunicationEventType): void =>
            {
                if(step === HabboCommunicationEvent.AUTHENTICATED)
                {
                    resolveAuthenticated();
                }
                else if(step === HabboCommunicationEvent.HANDSHAKE_FAIL)
                {
                    rejectAuthentication(new Error('[HabboCommunicationDemo] Handshake failed before authentication'));
                }
            };

            const onDisconnected = (reason: number, reasonText: string): void =>
            {
                const suffix = reasonText && reasonText.length > 0 ? ` (${reasonText})` : '';

                rejectAuthentication(new Error(`[HabboCommunicationDemo] Disconnected before authentication: ${reason}${suffix}`));
            };

            const onConnectionError = (error: Error): void =>
            {
                rejectAuthentication(error);
            };

            events.on(HabboCommunicationManagerEvent.LOGIN_STEP, onLoginStep);
            events.on(HabboCommunicationManagerEvent.DISCONNECTED, onDisconnected);
            events.on(HabboCommunicationManagerEvent.CONNECTION_ERROR, onConnectionError);

            timeoutId = setTimeout(() =>
            {
                rejectAuthentication(new Error('[HabboCommunicationDemo] Authentication timed out'));
            }, timeoutMs);
        });
    }

    /**
	 * Send connection parameters after handshake completes (encryption enabled)
	 *
	 * AS3 sends: VersionCheckMessageComposer, UniqueIDMessageComposer, SSOTicketMessageComposer
	 *
	 * @see source_as_win63/habbo/communication/demo/HabboCommunicationDemo.as sendConnectionParameters()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::sendConnectionParameters()
    sendConnectionParameters(connection: IConnection): void
    {
        connection.send(new VersionCheckMessageComposer(
            401,
            this._flashClientUrl ?? this.getProperty('flash.client.url'),
            this.getProperty('external.variables.txt')
        ));

        // AS3: machineId = CommunicationUtils.readSOLString("machineid")
        // AS3: fingerprint = CommunicationUtils.generateFingerprint()
        // AS3: flashVersion = Capabilities.version.split(" ").join("/")
        const machineId = CommunicationUtils.readProperty(CommunicationUtils.SOL_PROPERTY_MACHINE_ID, '') ?? '';
        const fingerprint = CommunicationUtils.generateFingerprint();
        const flashVersion = 'HTML5/1.0';

        connection.send(new UniqueIDMessageComposer(machineId, fingerprint, flashVersion));

        if(this._ssoTicket && this._ssoTicket.length > 0)
        {
            connection.send(new SSOTicketMessageComposer(this._ssoTicket));
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::loginOk()
    loginOk(): void
    {
        this._authenticationStarted = false;
        this._isDisconnected = false;
        this._isLoggedIn = true;

        log.info('Login successful');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::disconnected()
    disconnected(reason: number, reasonText: string): void
    {
        this._authenticationStarted = false;
        this._isDisconnected = true;
        this._isLoggedIn = false;

        log.warn(`Disconnected: reason=${reason}, text=${reasonText}`);

        // Emit on the communication manager events (AS3 equivalent: context.events)
        if(this._communication?.events)
        {
            this._communication.events.emit(HabboCommunicationManagerEvent.DISCONNECTED, reason, reasonText);
        }

        // AS3 branches on the login flow being alive: with one it hands over to
        // `loginFlow.showDisconnected()`, without one it alerts. This port is always in the second
        // branch — its LoginFlow is disposed once boot is done — so only the alert is ported, and
        // `onBufferedDisconnected()` with it.
        //
        // Without this the whole disconnect was a log line: the event above has no listener, and
        // the client sat there fully rendered with a dead socket, dropping every action until the
        // player thought to reload.
        const reasonKey = DisconnectReasonMessageEvent.resolveDisconnectedReasonLocalizationKey(reason);

        if(reasonText == null || reasonText.length < 6)
        {
            // DEVIATION: AS3 passes the key with its `${}` wrapper straight to getLocalization(),
            //   which looks up the raw map and misses every time — reasonName renders empty in
            //   Flash too. Stripping it is what makes the message readable, and it is the only
            //   thing this line does differently.
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::disconnected()
            reasonText = this._localization?.getLocalization(reasonKey.replace(/^\$\{|\}$/g, '')) ?? '';
        }

        this._localization?.registerParameter('connection.login.logged_out', 'reason', reason.toString());
        this._localization?.registerParameter('connection.login.logged_out', 'reasonName', reasonText);

        this.alert(reasonKey, '${connection.login.logged_out}');
    }

    /**
	 * Shows a dialog and disposes it when the player closes it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::alert()
    alert(titleKey: string, messageKey: string): void
    {
        if(!this._windowManager)
        {
            log.warn(`No window manager to show "${titleKey}" — the dialog is dropped`);

            return;
        }

        // The callback disposes the dialog and nothing else, exactly as AS3 does. It used to
        // `window.location.reload()` on a disconnect, under a DEVIATION claiming the reload "lands
        // on the same login screen the client boots from". It does not: the SSO ticket rides on
        // `?sso=` in the URL (index.html reads it into VortexConfig) and a reload keeps the URL, so
        // it re-bootstraps the whole engine against the ticket that was just disconnected —
        // App.ts::init() only redirects to the site when the ticket is *absent*. So the invented
        // reload never reached a login screen, and it is the only thing this client does on this
        // path that Habbo does not.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::alert()
        this._windowManager.alert(titleKey, messageKey, 0, (dialog) =>
        {
            dialog.dispose();

            // AS3's other branch, ported to where login actually lives. With a LoginFlow alive AS3
            // never shows this dialog at all: `disconnected()` goes to `onBufferedDisconnected()`
            // → `showDisconnected()`, and the player is back on the login screen. Here the site is
            // the login screen, so the engine only says the session is over — the client turns that
            // into whatever "back to login" means for its embedder.
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::onBufferedDisconnected()
            if(this._isDisconnected)
            {
                this._communication?.events.emit(HabboCommunicationManagerEvent.DISCONNECT_ACKNOWLEDGED);
            }
        });
    }

    /**
	 * Handle error messages from the server.
	 *
	 * - 1001-1019: fatal, close the connection silently
	 * - 4013: the room is under maintenance
	 * - anything else, code 0 included: a server error alert carrying the code
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::handleErrorMessage()
    handleErrorMessage(errorCode: number, messageId: number): void
    {
        switch(true)
        {
            case errorCode >= 1001 && errorCode <= 1019:
                log.error(`Fatal server error ${errorCode}, closing connection`);

                this._communication?.connection?.close();
                break;

            case errorCode === 4013:
                log.warn('Room maintenance in progress');
                this.alert('${connection.room.maintenance.title}', '${connection.room.maintenance.desc}');
                break;

            // AS3 lists code 0 and the default arm separately and gives them the same body.
            default:
                log.error(`Server error: ${errorCode} (message: ${messageId})`);
                this._localization?.registerParameter('connection.server.error.desc', 'errorCode', String(errorCode));
                this.alert('${connection.server.error.title}', '${connection.server.error.desc}');
                break;
        }
    }

    /**
	 * The hotel is closed; the server says when it reopens and hangs up.
	 */
    // DEVIATION: AS3 calls `loginFlow.showDisconnectedWithText(12)`, 12 being the reason code for
    //   `${disconnected.hotel_closed}`. The port has no `showDisconnectedWithText` on any login
    //   flow — grep finds the name nowhere — so it goes through `disconnected()`, the substitute
    //   this file already uses for the two core-error paths above, with the same reason code.
    //   Without it the message was a log line: nothing on screen, and a socket about to close.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::handleLoginFailedHotelClosedMessage()
    handleLoginFailedHotelClosedMessage(openHour: number, openMinute: number): void
    {
        // AS3 drops the opening time too — the disconnect text takes no parameter for it.
        log.warn(`Hotel is closed. Opens at ${openHour}:${String(openMinute).padStart(2, '0')}`);

        this.disconnected(12, '');
    }

    /**
	 * Dispatch a login step event
	 *
	 * AS3: Component(context).events.dispatchEvent(new Event(param1))
	 * We emit on the communication manager events (our equivalent of the shared context events)
	 * so that other components (HabboLocalizationManager, connection module) can listen.
	 *
	 * @see source_as_win63/habbo/communication/demo/HabboCommunicationDemo.as dispatchLoginStepEvent()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::dispatchLoginStepEvent()
    dispatchLoginStepEvent(step: HabboCommunicationEventType): void
    {
        if(!this._communication?.events) return;

        this._communication.events.emit(HabboCommunicationManagerEvent.LOGIN_STEP, step);
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/HabboCommunicationDemo.as dispose()
	 */
    override dispose(): void
    {
        if(this._incomingMessages)
        {
            this._incomingMessages.dispose();
            this._incomingMessages = null;
        }

        this.context.events.off(ComponentEvents.ERROR, this.onCoreError);

        if(this._errorPopup)
        {
            this._errorPopup.dispose();
            this._errorPopup = null;
        }

        this._communication = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::initWithSSO()
    initWithSSO(ticket: string): void
    {
        this._ssoTicket = ticket;
        this.initGameSocket();
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/HabboCommunicationDemo.as initComponent()
	 */
    protected override initComponent(): void
    {
        this._isDisconnected = false;

        // Dispose previous IncomingMessages and renew socket
        if(this._incomingMessages)
        {
            this._incomingMessages.dispose();

            if(this._communication)
            {
                // AS3: _communication.renewSocket()
            }
        }

        if(!this._communication)
        {
            log.error('Communication manager not available');
            return;
        }

        // AS3: if (var_1998) initWithSSO(var_1998)
        if(this._ssoTicket)
        {
            this.initWithSSO(this._ssoTicket);
        }
    }
}
