import {Component, ComponentDependency, type IContext} from '@core/runtime';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import type {IConnection} from '@core/communication/connection/IConnection';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import {RoomSessionEvent} from '@habbo/session/events/RoomSessionEvent';
import type {IDisposable} from '@core/runtime/IDisposable';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {
    NewUserExperienceNotCompleteEvent
} from '@habbo/communication/messages/incoming/nux/NewUserExperienceNotCompleteEvent';
import {
    NewUserExperienceGiftOfferEvent
} from '@habbo/communication/messages/incoming/nux/NewUserExperienceGiftOfferEvent';
import {
    NewUserExperienceGetGiftsMessageComposer
} from '@habbo/communication/messages/outgoing/nux/NewUserExperienceGetGiftsMessageComposer';
import type {
    NewUserExperienceGiftSelection
} from '@habbo/communication/messages/outgoing/nux/NewUserExperienceGiftSelection';
import type {
    NewUserExperienceGiftOptions
} from '@habbo/communication/messages/parser/nux/NewUserExperienceGiftOptions';
import {
    SetPhoneNumberVerificationStatusMessageComposer
} from '@habbo/communication/messages/outgoing/preferences/SetPhoneNumberVerificationStatusMessageComposer';
import {EventLogMessageComposer} from '@habbo/communication/messages/outgoing/tracking/EventLogMessageComposer';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboNavigator} from '@iid/IIDHabboNavigator';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboCatalog} from '@iid/IIDHabboCatalog';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {Logger} from '@core/utils/Logger';
import {NuxOfferOldUserView} from './NuxOfferOldUserView';
import {NuxGiftSelectionView} from './NuxGiftSelectionView';
import {NuxNoobRoomOfferView} from './NuxNoobRoomOfferView';

const log = Logger.getLogger('habbo.nux.HabboNuxDialogs');

/**
 * The new-user-experience dialogs: the phone-verification offer, the gift picker, and the
 * "come to the noob lobby" nag.
 *
 * The three views are mutually independent and each is owned by exactly one field here; the
 * component is what they call back into, which is why it exposes `windowManager`,
 * `localizationManager`, `sessionDataManager`, `configuration` and `catalog` as plain getters.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/nux/HabboNuxDialogs.as
 */
export class HabboNuxDialogs extends Component implements ILinkEventTracker
{
    // AS3: .../nux/HabboNuxDialogs.as::_communicationManager
    protected _communicationManager: IHabboCommunicationManager | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_navigator
    protected _navigator: IHabboNavigator | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_windowManager
    protected _windowManager: IHabboWindowManager | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_localizationManager
    protected _localizationManager: IHabboLocalizationManager | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_catalog
    protected _catalog: IHabboCatalog | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_sessionDataManager
    protected _sessionDataManager: ISessionDataManager | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_roomSessionManager
    protected _roomSessionManager: IRoomSessionManager | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_SafeStr_4568
    private _connection: IConnection | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_SafeStr_7137
    private _nuxOfferView: NuxOfferOldUserView | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_SafeStr_7164
    private _giftSelectionView: NuxGiftSelectionView | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::_SafeStr_7240
    private _noobRoomOfferView: NuxNoobRoomOfferView | null = null;

    /**
     * AS3: .../nux/HabboNuxDialogs.as::_SafeStr_6162
     *
     * AS3 uses a `Timer(delay, 1)` — a single shot — so the port holds a `setTimeout` handle.
     */
    private _noobRoomOfferTimer: ReturnType<typeof setTimeout> | null = null;

    // AS3: .../nux/HabboNuxDialogs.as::HabboNuxDialogs()
    constructor(context: IContext)
    {
        super(context);

        this._onRoomSessionEvent = this._onRoomSessionEvent.bind(this);
    }

    // AS3: .../nux/HabboNuxDialogs.as::get linkPattern()
    get linkPattern(): string
    {
        return 'nux/';
    }

    // AS3: .../nux/HabboNuxDialogs.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: .../nux/HabboNuxDialogs.as::get localizationManager()
    get localizationManager(): IHabboLocalizationManager | null
    {
        return this._localizationManager;
    }

    // AS3: .../nux/HabboNuxDialogs.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    /**
     * AS3: .../nux/HabboNuxDialogs.as::get configuration()
     *
     * AS3 returns `this` — the component *is* the configuration reader (`getBoolean`,
     * `getInteger`, `getProperty` are its own inherited members).
     */
    // AS3: .../src/com/sulake/habbo/nux/HabboNuxDialogs.as::get configuration()
    get configuration(): HabboNuxDialogs
    {
        return this;
    }

    // AS3: .../nux/HabboNuxDialogs.as::get catalog()
    get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: .../nux/HabboNuxDialogs.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) => { this._communicationManager = manager; },
                true
            ),
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) => { this._windowManager = manager; }
            ),
            new ComponentDependency(
                IID_HabboNavigator,
                (navigator: IHabboNavigator | null) => { this._navigator = navigator; }
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) => { this._localizationManager = manager; }
            ),
            new ComponentDependency(
                IID_HabboCatalog,
                (catalog: IHabboCatalog | null) => { this._catalog = catalog; }
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) => { this._sessionDataManager = manager; }
            ),
            // AS3 passes the RSE_STARTED/RSE_ENDED listeners in the dependency's event-listener
            // list, which the port attaches to `events`; RoomSessionManager emits RSE_* on
            // `sessionEvents` instead (rule 20-architecture #4), so subscribe there in the resolve
            // callback.
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this._onRoomSessionEvent);
                    this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this._onRoomSessionEvent);

                    this._roomSessionManager = manager;

                    manager?.sessionEvents.on(RoomSessionEvent.RSE_STARTED, this._onRoomSessionEvent);
                    manager?.sessionEvents.on(RoomSessionEvent.RSE_ENDED, this._onRoomSessionEvent);
                },
                false
            )
        ];
    }

    // AS3: .../nux/HabboNuxDialogs.as::linkReceived()
    linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2) return;

        if(parts[1] !== 'lobbyoffer')
        {
            log.warn('HabboNuxDialogs unknown link-type received: ' + parts[1]);
        }
        else if(parts.length > 2 && parts[2] === 'show')
        {
            this.createNoobRoomOfferView();
        }
        else
        {
            this.destroyNoobRoomOfferView();
        }
    }

    /**
     * AS3: .../nux/HabboNuxDialogs.as::onVerify()
     *
     * Status 0 — the raw integer AS3 pushes at this call site.
     */
    // AS3: .../src/com/sulake/habbo/nux/HabboNuxDialogs.as::onVerify()
    onVerify(): void
    {
        this._connection?.send(new SetPhoneNumberVerificationStatusMessageComposer(0));
    }

    // AS3: .../nux/HabboNuxDialogs.as::onReject()
    onReject(): void
    {
        this._windowManager?.confirm(
            '${phone.number.never.again.confirm.title}',
            '${phone.number.never.again.confirm.text}',
            0,
            (dialog: IDisposable, event: WindowEvent) => { this.onNeverAgainConfirmClose(dialog, event); }
        );
    }

    // AS3: .../nux/HabboNuxDialogs.as::onSendGetGifts()
    onSendGetGifts(selections: NewUserExperienceGiftSelection[]): void
    {
        this.destroyGiftSelectionView();

        this._connection?.send(new NewUserExperienceGetGiftsMessageComposer(selections));
    }

    // AS3: .../nux/HabboNuxDialogs.as::destroyNuxOfferView()
    destroyNuxOfferView(): void
    {
        if(this._nuxOfferView)
        {
            this._nuxOfferView.dispose();
            this._nuxOfferView = null;
        }
    }

    // AS3: .../nux/HabboNuxDialogs.as::destroyNoobRoomOfferView()
    destroyNoobRoomOfferView(): void
    {
        if(this._noobRoomOfferTimer !== null)
        {
            clearTimeout(this._noobRoomOfferTimer);
            this._noobRoomOfferTimer = null;
        }

        if(this._noobRoomOfferView)
        {
            this._noobRoomOfferView.dispose();
            this._noobRoomOfferView = null;
        }
    }

    // AS3: .../nux/HabboNuxDialogs.as::initComponent()
    protected override initComponent(): void
    {
        this._connection = this._communicationManager?.connection ?? null;

        if(this._connection)
        {
            this._connection.addMessageEvent(
                new NewUserExperienceNotCompleteEvent(this.onNewUserExperienceNotCompleteMessage.bind(this))
            );
            this._connection.addMessageEvent(
                new NewUserExperienceGiftOfferEvent(this.onNewUserExperienceGiftOfferMessage.bind(this))
            );
        }

        this.context.addLinkEventTracker(this);

        log.debug('NUX dialogs initialized');
    }

    // AS3: .../nux/HabboNuxDialogs.as::onNeverAgainConfirmClose()
    private onNeverAgainConfirmClose(dialog: IDisposable, event: WindowEvent): void
    {
        dialog.dispose();

        if(event.type === WindowEvent.WE_OK && this._connection)
        {
            this.destroyNuxOfferView();
            this._connection.send(new SetPhoneNumberVerificationStatusMessageComposer(2));
        }
    }

    // AS3: .../nux/HabboNuxDialogs.as::onNewUserExperienceNotCompleteMessage()
    private onNewUserExperienceNotCompleteMessage(): void
    {
        this.createNuxOfferView();
    }

    // AS3: .../nux/HabboNuxDialogs.as::onNewUserExperienceGiftOfferMessage()
    private onNewUserExperienceGiftOfferMessage(event: IMessageEvent): void
    {
        const parser = (event as NewUserExperienceGiftOfferEvent).giftOfferParser;

        if(!parser) return;

        this.createGiftSelectionView(parser.giftOptions);
    }

    /**
     * AS3: .../nux/HabboNuxDialogs.as::onRoomSessionEvent()
     *
     * The nag is armed only when entering the player's *home* room, and only for a real noob;
     * every other session event tears it down again.
     */
    private _onRoomSessionEvent(event: RoomSessionEvent): void
    {
        if(!this.getBoolean('nux.lobbies.enabled') || !this._sessionDataManager?.isRealNoob)
        {
            return;
        }

        if(event.type === RoomSessionEvent.RSE_STARTED
            && event.session
            && event.session.roomId === this._navigator?.homeRoomId)
        {
            const delay = this.getInteger('nux.noob.lobby.popup.delay', 70) * 1000;

            if(this._noobRoomOfferTimer !== null)
            {
                clearTimeout(this._noobRoomOfferTimer);
            }

            this._noobRoomOfferTimer = setTimeout(() => { this.createNoobRoomOfferView(); }, delay);
        }
        else
        {
            this.destroyNoobRoomOfferView();
        }
    }

    // AS3: .../nux/HabboNuxDialogs.as::createNuxOfferView()
    private createNuxOfferView(): void
    {
        this.destroyNuxOfferView();

        this._nuxOfferView = new NuxOfferOldUserView(this);
    }

    // AS3: .../nux/HabboNuxDialogs.as::createGiftSelectionView()
    private createGiftSelectionView(giftOptions: NewUserExperienceGiftOptions[]): void
    {
        this.destroyGiftSelectionView();

        this._giftSelectionView = new NuxGiftSelectionView(this, giftOptions);
    }

    // AS3: .../nux/HabboNuxDialogs.as::destroyGiftSelectionView()
    private destroyGiftSelectionView(): void
    {
        if(this._giftSelectionView)
        {
            this._giftSelectionView.dispose();
            this._giftSelectionView = null;
        }
    }

    /**
     * AS3: .../nux/HabboNuxDialogs.as::startNoobRoomOfferTimer()
     *
     * Empty in AS3 — a leftover the timer setup in `onRoomSessionEvent()` replaced. Kept so the
     * class's member list matches the source.
     */
    // AS3: .../src/com/sulake/habbo/nux/HabboNuxDialogs.as::startNoobRoomOfferTimer()
    private startNoobRoomOfferTimer(): void
    {
    }

    /**
     * AS3: .../nux/HabboNuxDialogs.as::createNoobRoomOfferView()
     *
     * Re-checks both conditions because the timer may fire long after they were tested.
     */
    // AS3: .../src/com/sulake/habbo/nux/HabboNuxDialogs.as::createNoobRoomOfferView()
    private createNoobRoomOfferView(): void
    {
        if(!this.getBoolean('nux.lobbies.enabled') || !this._sessionDataManager?.isRealNoob)
        {
            return;
        }

        this.destroyNoobRoomOfferView();

        this._noobRoomOfferView = new NuxNoobRoomOfferView(this);

        this._connection?.send(new EventLogMessageComposer('NewNavigator', 'nux.offer.lobby', 'nux.offer.lobby'));
    }

    // AS3: .../nux/HabboNuxDialogs.as::dispose()
    override dispose(): void
    {
        if(this._disposed) return;

        this.context.removeLinkEventTracker(this);

        this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this._onRoomSessionEvent);
        this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this._onRoomSessionEvent);

        if(this._windowManager)
        {
            this._windowManager = null;
        }

        this.destroyGiftSelectionView();
        this.destroyNoobRoomOfferView();
        this.destroyNuxOfferView();

        super.dispose();
    }
}
