import {Component, ComponentDependency, type IContext} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets';
import type {IMessageComposer} from '@core/communication/messages/IMessageComposer';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IWindow} from '@core/window/IWindow';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import {Logger} from '@core/utils/Logger';

import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IFriend} from '@habbo/friendlist/IFriend';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IHabboHelp} from '@habbo/help/IHabboHelp';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';

import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboFriendList} from '@iid/IIDHabboFriendList';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_HabboTracking} from '@iid/IIDHabboTracking';
import {IID_HabboHelp} from '@iid/IIDHabboHelp';
import {IID_HabboSoundManager} from '@iid/IIDHabboSoundManager';

import {MessengerInitEvent} from '@habbo/communication/messages/incoming/friendlist/MessengerInitEvent';
import {NewConsoleMessageEvent} from '@habbo/communication/messages/incoming/friendlist/NewConsoleMessageEvent';
import {
    ConsoleMessageHistoryEvent
} from '@habbo/communication/messages/incoming/friendlist/ConsoleMessageHistoryEvent';
import {InstantMessageErrorEvent} from '@habbo/communication/messages/incoming/friendlist/InstantMessageErrorEvent';
import {RoomInviteEvent} from '@habbo/communication/messages/incoming/friendlist/RoomInviteEvent';
import {
    MiniMailNewMessageEvent
} from '@habbo/communication/messages/incoming/friendlist/MiniMailNewMessageEvent';
import {
    MiniMailUnreadCountEvent
} from '@habbo/communication/messages/incoming/friendlist/MiniMailUnreadCountEvent';
import {AccountPreferencesEvent} from '@habbo/communication/messages/incoming/preferences/AccountPreferencesEvent';
import {HabboGroupDetailsMessageEvent} from '@habbo/communication/messages/incoming/users/HabboGroupDetailsMessageEvent';
import {
    OpenFlatConnectionMessageComposer
} from '@habbo/communication/messages/outgoing/room/session/OpenFlatConnectionMessageComposer';

import type {
    NewConsoleMessageEventParser
} from '@habbo/communication/messages/parser/friendlist/NewConsoleMessageEventParser';
import type {
    ConsoleMessageHistoryEventParser
} from '@habbo/communication/messages/parser/friendlist/ConsoleMessageHistoryEventParser';
import type {
    InstantMessageErrorEventParser
} from '@habbo/communication/messages/parser/friendlist/InstantMessageErrorEventParser';
import type {RoomInviteEventParser} from '@habbo/communication/messages/parser/friendlist/RoomInviteEventParser';
import type {
    MiniMailUnreadCountParser
} from '@habbo/communication/messages/parser/friendlist/MiniMailUnreadCountParser';
import type {AccountPreferencesParser} from '@habbo/communication/messages/parser/preferences/AccountPreferencesParser';

import type {IHabboMessenger} from './IHabboMessenger';
import type {ChatEntry} from './ChatEntry';
import {DummyFriend} from './DummyFriend';
import {MainView} from './MainView';
import {ActiveConversationEvent} from './events/ActiveConversationEvent';
import {MiniMailMessageEvent} from './events/MiniMailMessageEvent';

const log = Logger.getLogger('habbo.messenger.HabboMessenger');

/**
 * HabboMessenger
 *
 * The messenger component: owns the console window (`MainView`), routes every chat
 * message to it, and is what the friend list and friend bar reach for when they need to
 * open a conversation or report a presence change.
 *
 * Almost every method here is a guarded delegation to the view, and the guard is AS3's
 * own: the view is not built in the constructor but on `MessengerInit`, so everything
 * before that has to survive a null view — the server sends that message once, after the
 * friend list is initialised, and nothing in the console works until it lands.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/messenger/HabboMessenger.as
 */
export class HabboMessenger extends Component implements IHabboMessenger, ILinkEventTracker
{
    // AS3: .../messenger/HabboMessenger.as::HabboMessenger()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    // AS3: .../messenger/HabboMessenger.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: .../messenger/HabboMessenger.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: .../messenger/HabboMessenger.as::_communication
    private _communication: IHabboCommunicationManager | null = null;

    // AS3: .../messenger/HabboMessenger.as::_localization
    private _localization: IHabboLocalizationManager | null = null;

    // AS3: .../messenger/HabboMessenger.as::get localization()
    get localization(): IHabboLocalizationManager | null
    {
        return this._localization;
    }

    // AS3: .../messenger/HabboMessenger.as::_friendList
    private _friendList: IHabboFriendList | null = null;

    // AS3: .../messenger/HabboMessenger.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;

    // AS3: .../messenger/HabboMessenger.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: .../messenger/HabboMessenger.as::_tracking
    private _tracking: IHabboTracking | null = null;

    // AS3: .../messenger/HabboMessenger.as::_help
    private _help: IHabboHelp | null = null;

    // AS3: .../messenger/HabboMessenger.as::_soundManager
    private _soundManager: IHabboSoundManager | null = null;

    /**
     * The console window. Built on `MessengerInit`, not in the constructor — every
     * delegation below guards on it because AS3 does.
     */
    // AS3: .../messenger/HabboMessenger.as::_SafeStr_4684
    private _mainView: MainView | null = null;

    // AS3: .../messenger/HabboMessenger.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];

    // AS3: .../messenger/HabboMessenger.as::_SafeStr_6201
    private _unseenMiniMailMessageCount: number = 0;

    // AS3: .../messenger/HabboMessenger.as::_SafeStr_8249
    private _roomInvitesIgnored: boolean = false;

    // AS3: .../messenger/HabboMessenger.as::_followingToGroupRoom
    private _followingToGroupRoom: boolean = false;

    /**
     * Sound and help are optional here where AS3 has them required. `IID_HabboSoundManager`
     * is attached since 2026-08-02 and `IID_HabboHelp` is not, but both stay optional: a
     * required dependency that never resolves leaves the component locked forever with no
     * log — the hole that kept the friend bar from ever building — and nothing here needs
     * either of them to exist before the console does.
     */
    // DEVIATION: AS3 also takes the optional habbicon controller; the RPG fork removed Habbicons.
    // AS3: .../messenger/HabboMessenger.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<unknown>>
    {
        return [
            new ComponentDependency(IID_HabboWindowManager, (windowManager: IHabboWindowManager | null) =>
            {
                this._windowManager = windowManager;
            }, true),
            new ComponentDependency(IID_HabboCommunicationManager, (communication: IHabboCommunicationManager | null) =>
            {
                this._communication = communication;
            }, true),
            new ComponentDependency(IID_HabboLocalizationManager, (localization: IHabboLocalizationManager | null) =>
            {
                this._localization = localization;
            }, true),
            new ComponentDependency(IID_HabboFriendList, (friendList: IHabboFriendList | null) =>
            {
                this._friendList = friendList;
            }, true),
            new ComponentDependency(IID_SessionDataManager, (sessionDataManager: ISessionDataManager | null) =>
            {
                this._sessionDataManager = sessionDataManager;
            }, true),
            new ComponentDependency(IID_HabboTracking, (tracking: IHabboTracking | null) =>
            {
                this._tracking = tracking;
            }, true),
            new ComponentDependency(IID_HabboHelp, (help: IHabboHelp | null) =>
            {
                this._help = help;
            }, false),
            new ComponentDependency(IID_HabboSoundManager, (soundManager: IHabboSoundManager | null) =>
            {
                this._soundManager = soundManager;
            }, false)
        ] as Array<ComponentDependency<unknown>>;
    }

    // AS3: .../messenger/HabboMessenger.as::initComponent()
    protected override initComponent(): void
    {
        this.addMessageEvent(new MessengerInitEvent(this.onMessengerInit.bind(this)));
        this.addMessageEvent(new AccountPreferencesEvent(this.onAccountPreferences.bind(this)));
        this.addMessageEvent(new HabboGroupDetailsMessageEvent(this.onHabboGroupDetails.bind(this)));

        if(this.getBoolean('client.minimail.embed.enabled'))
        {
            this.addMessageEvent(new MiniMailNewMessageEvent(this.onMiniMailMessage.bind(this)));
            this.addMessageEvent(new MiniMailUnreadCountEvent(this.onMiniMailUnreadCount.bind(this)));
        }

        this.context.addLinkEventTracker(this);
    }

    /**
     * The notification carries no payload — the arrival *is* the increment. The count is
     * only ever reconciled by `onMiniMailUnreadCount()`.
     */
    // AS3: .../messenger/HabboMessenger.as::onMiniMailMessage()
    private onMiniMailMessage(_event: IMessageEvent): void
    {
        this._unseenMiniMailMessageCount++;

        this.playMessageReceivedSound();

        this.events.emit(
            MiniMailMessageEvent.NEW_MESSAGE_NOTIFICATION,
            new MiniMailMessageEvent(MiniMailMessageEvent.NEW_MESSAGE_NOTIFICATION, this._unseenMiniMailMessageCount)
        );
    }

    // AS3: .../messenger/HabboMessenger.as::onMiniMailUnreadCount()
    private onMiniMailUnreadCount(event: IMessageEvent): void
    {
        this._unseenMiniMailMessageCount = (event.parser as MiniMailUnreadCountParser).unreadMessageCount;

        this.events.emit(
            MiniMailMessageEvent.UNREAD_MESSAGE_COUNT,
            new MiniMailMessageEvent(MiniMailMessageEvent.UNREAD_MESSAGE_COUNT, this._unseenMiniMailMessageCount)
        );
    }

    // AS3: .../messenger/HabboMessenger.as::onAccountPreferences()
    private onAccountPreferences(event: IMessageEvent): void
    {
        this._roomInvitesIgnored = (event.parser as AccountPreferencesParser).roomInvitesIgnored;
    }

    /**
     * The second half of "follow a friend into their group's room": the friend bar asks
     * for the group's details and sets `followingToGroupRoom`, and the room id only
     * arrives with the answer — which is why the hop is completed here and not at the
     * click.
     */
    // AS3: .../messenger/HabboMessenger.as::onHabboGroupDetails()
    private onHabboGroupDetails(event: IMessageEvent): void
    {
        if(!this._followingToGroupRoom)
        {
            return;
        }

        this._followingToGroupRoom = false;

        // AS3 dereferences `data` unguarded; the parser can hand back null here, so the
        // flag is cleared first either way and only the hop is skipped.
        const data = (event as HabboGroupDetailsMessageEvent).data;

        if(data === null)
        {
            return;
        }

        this.send(new OpenFlatConnectionMessageComposer(data.roomId));
    }

    // AS3: .../messenger/HabboMessenger.as::onMessengerInit()
    private onMessengerInit(_event: IMessageEvent): void
    {
        this._mainView = new MainView(this);

        this.addMessageEvent(new NewConsoleMessageEvent(this.onNewConsoleMessage.bind(this)));
        this.addMessageEvent(new ConsoleMessageHistoryEvent(this.onConsoleHistory.bind(this)));
        this.addMessageEvent(new InstantMessageErrorEvent(this.onInstantMessageError.bind(this)));
        this.addMessageEvent(new RoomInviteEvent(this.onRoomInvite.bind(this)));

        log.debug('Messenger initialised');
    }

    // AS3: .../messenger/HabboMessenger.as::send()
    send(composer: IMessageComposer<unknown[]>): void
    {
        this._communication?.connection?.send(composer);
    }

    // AS3: .../messenger/HabboMessenger.as::isOpen()
    isOpen(): boolean
    {
        return this._mainView !== null && this._mainView.isOpen;
    }

    // AS3: .../messenger/HabboMessenger.as::toggleMessenger()
    toggleMessenger(): void
    {
        this._mainView?.toggle();
    }

    // AS3: .../messenger/HabboMessenger.as::hideTransientSelectors()
    hideTransientSelectors(): void
    {
        this._mainView?.hideTransientSelectors();
    }

    // AS3: .../messenger/HabboMessenger.as::startConversation()
    startConversation(userId: number): void
    {
        if(this._mainView !== null)
        {
            this._mainView.startConversation(userId);

            // `true` forces the window open even when the avatar strip is empty - this is
            // the player asking for it, not a message arriving.
            this._mainView.show(true);
        }
    }

    /**
     * Unlike its siblings this one is *not* guarded in AS3 — it dereferences the view
     * straight away, so it throws if anything closes a conversation before
     * `MessengerInit`. Guarded here, because `FriendCategories` calls it on every friend
     * removal, which can happen before the console exists.
     */
    // AS3: .../messenger/HabboMessenger.as::closeConversation()
    closeConversation(userId: number): void
    {
        this._mainView?.hideConversation(userId);
    }

    // AS3: .../messenger/HabboMessenger.as::setFollowingAllowed()
    setFollowingAllowed(userId: number, allowed: boolean): void
    {
        this._mainView?.setFollowingAllowed(userId, allowed);
    }

    // AS3: .../messenger/HabboMessenger.as::setOnlineStatus()
    setOnlineStatus(userId: number, online: boolean): void
    {
        this._mainView?.setOnlineStatus(userId, online);
    }

    // AS3: .../messenger/HabboMessenger.as::getUnseenMiniMailMessageCount()
    getUnseenMiniMailMessageCount(): number
    {
        return this._unseenMiniMailMessageCount;
    }

    // AS3: .../messenger/HabboMessenger.as::getRoomInvitesIgnored()
    getRoomInvitesIgnored(): boolean
    {
        return this._roomInvitesIgnored;
    }

    // AS3: .../messenger/HabboMessenger.as::setRoomInvitesIgnored()
    setRoomInvitesIgnored(ignored: boolean): void
    {
        this._roomInvitesIgnored = ignored;
    }

    // AS3: .../messenger/HabboMessenger.as::set followingToGroupRoom()
    set followingToGroupRoom(value: boolean)
    {
        this._followingToGroupRoom = value;
    }

    // AS3: .../messenger/HabboMessenger.as::getText()
    getText(key: string): string
    {
        return this._localization?.getLocalization(key, key) ?? key;
    }

    // AS3: .../messenger/HabboMessenger.as::getXmlWindow()
    getXmlWindow(name: string): IWindow | null
    {
        return this._windowManager?.buildWidgetLayout(`${name}_xml`) ?? null;
    }

    // AS3: .../messenger/HabboMessenger.as::trackGoogle()
    trackGoogle(pageId: string, action: string, value: number = -1): void
    {
        this._tracking?.trackGoogle(pageId, action, value);
    }

    /**
     * The friend behind a conversation. Falls back to a `DummyFriend` built from the
     * chat entry when the sender is not on the friend list — staff, or a chat opened
     * from a profile.
     */
    // AS3: .../messenger/HabboMessenger.as::getFriend()
    getFriend(userId: number, chatEntry: ChatEntry | null = null): IFriend | null
    {
        const friend = this._friendList?.getFriendById(userId) ?? null;

        if(friend === null && chatEntry !== null)
        {
            return new DummyFriend(chatEntry.senderId, chatEntry.senderName, chatEntry.senderFigure);
        }

        return friend;
    }

    // AS3: .../messenger/HabboMessenger.as::reportUser()
    reportUser(userId: number): void
    {
        this._help?.reportUserFromIM(userId);
    }

    // AS3: .../messenger/HabboMessenger.as::conversationCountUpdated()
    conversationCountUpdated(count: number, hasUnread: boolean): void
    {
        this.events.emit(
            ActiveConversationEvent.ACTIVE_CONVERSATION_COUNT_CHANGED,
            new ActiveConversationEvent(ActiveConversationEvent.ACTIVE_CONVERSATION_COUNT_CHANGED, count, hasUnread)
        );
    }

    // AS3: .../messenger/HabboMessenger.as::playSendSound()
    playSendSound(): void
    {
        this._soundManager?.playSound('HBST_message_sent');
    }

    // AS3: .../messenger/HabboMessenger.as::playMessageReceivedSound()
    private playMessageReceivedSound(): void
    {
        this._soundManager?.playSound('HBST_message_received');
    }

    // AS3: .../messenger/HabboMessenger.as::onNewConsoleMessage()
    private onNewConsoleMessage(event: IMessageEvent): void
    {
        const parser = event.parser as NewConsoleMessageEventParser;

        log.trace(`Received console msg: ${parser.messageText}, ${parser.chatId}`);

        if(this._mainView === null)
        {
            return;
        }

        this._mainView.addConsoleMessage(
            parser.chatId,
            parser.messageType,
            parser.messageText,
            parser.habbiconId,
            parser.secondsSinceSent,
            parser.messageId,
            parser.confirmationId,
            parser.senderId,
            parser.senderName,
            parser.senderFigure
        );

        if(!this._mainView.isOpen)
        {
            this.playMessageReceivedSound();
        }
    }

    // AS3: .../messenger/HabboMessenger.as::onConsoleHistory()
    private onConsoleHistory(event: IMessageEvent): void
    {
        const parser = event.parser as ConsoleMessageHistoryEventParser;

        if(this._mainView === null)
        {
            return;
        }

        this._mainView.loadMessageHistory(parser.chatId, parser.historyFragment);
    }

    // AS3: .../messenger/HabboMessenger.as::onRoomInvite()
    private onRoomInvite(event: IMessageEvent): void
    {
        const parser = event.parser as RoomInviteEventParser;

        if(this._mainView === null)
        {
            return;
        }

        this._mainView.addRoomInvite(parser.senderId, parser.messageText);

        if(!this._mainView.isOpen)
        {
            this.playMessageReceivedSound();
        }
    }

    // AS3: .../messenger/HabboMessenger.as::onInstantMessageError()
    private onInstantMessageError(event: IMessageEvent): void
    {
        const parser = event.parser as InstantMessageErrorEventParser;

        if(this._mainView === null)
        {
            return;
        }

        this._mainView.onInstantMessageError(parser.userId, parser.errorCode, parser.message);
    }

    // AS3: .../messenger/HabboMessenger.as::get linkPattern()
    get linkPattern(): string
    {
        return 'messenger/';
    }

    // AS3: .../messenger/HabboMessenger.as::linkReceived()
    linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2)
        {
            return;
        }

        this.startConversation(parseInt(parts[1]!, 10));
    }

    // AS3: .../messenger/HabboMessenger.as::addMessageEvent()
    private addMessageEvent(event: IMessageEvent): void
    {
        if(this._communication === null)
        {
            return;
        }

        this._communication.addMessageEvent(event);
        this._messageEvents.push(event);
    }

    // AS3: .../messenger/HabboMessenger.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        if(this._communication !== null)
        {
            for(const event of this._messageEvents)
            {
                this._communication.removeMessageEvent(event);
            }
        }

        this._messageEvents = [];
        this.context.removeLinkEventTracker(this);

        super.dispose();
    }
}
