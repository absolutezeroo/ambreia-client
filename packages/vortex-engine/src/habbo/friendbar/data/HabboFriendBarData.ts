import {Component, ComponentDependency, type IContext} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {Logger} from '@core/utils/Logger';
import {OrderedMap} from '@core/utils/OrderedMap';

import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IHabboMessenger} from '@habbo/messenger/IHabboMessenger';
import {ActiveConversationEvent} from '@habbo/messenger/events/ActiveConversationEvent';
import {ActiveConversationsCountEvent} from '@habbo/friendbar/events/ActiveConversationsCountEvent';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import {FriendRequestEvent} from '@habbo/friendlist/events/FriendRequestEvent';
import {FriendListTabEnum} from '@habbo/friendlist/FriendListTabEnum';
import {WindowToggle} from '@habbo/utils/WindowToggle';

import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboConfigurationManager} from '@iid/IIDHabboConfigurationManager';
import {IID_HabboFriendList} from '@iid/IIDHabboFriendList';
import {IID_HabboMessenger} from '@iid/IIDHabboMessenger';
import {IID_HabboTracking} from '@iid/IIDHabboTracking';

// Incoming
import {
    FriendListUpdateMessageEvent
} from '@habbo/communication/messages/incoming/friendlist/FriendListUpdateMessageEvent';
import {MessengerInitEvent} from '@habbo/communication/messages/incoming/friendlist/MessengerInitEvent';
import {
    FriendListFragmentMessageEvent
} from '@habbo/communication/messages/incoming/friendlist/FriendListFragmentMessageEvent';
import {NewConsoleMessageEvent} from '@habbo/communication/messages/incoming/friendlist/NewConsoleMessageEvent';
import {FriendRequestsMessageEvent} from '@habbo/communication/messages/incoming/friendlist/FriendRequestsMessageEvent';
import {RoomInviteEvent} from '@habbo/communication/messages/incoming/friendlist/RoomInviteEvent';
import {
    NewFriendRequestMessageEvent
} from '@habbo/communication/messages/incoming/friendlist/NewFriendRequestMessageEvent';
import {
    FindFriendsProcessResultMessageEvent
} from '@habbo/communication/messages/incoming/friendlist/FindFriendsProcessResultMessageEvent';
import {
    FriendNotificationMessageEvent
} from '@habbo/communication/messages/incoming/friendlist/FriendNotificationMessageEvent';

// Parsers
import type {
    FriendListUpdateMessageParser
} from '@habbo/communication/messages/parser/friendlist/FriendListUpdateMessageParser';
import type {
    FriendListFragmentMessageParser
} from '@habbo/communication/messages/parser/friendlist/FriendListFragmentMessageParser';
import type {
    NewConsoleMessageEventParser
} from '@habbo/communication/messages/parser/friendlist/NewConsoleMessageEventParser';
import type {
    FriendRequestsMessageParser
} from '@habbo/communication/messages/parser/friendlist/FriendRequestsMessageParser';
import type {RoomInviteEventParser} from '@habbo/communication/messages/parser/friendlist/RoomInviteEventParser';
import type {
    NewFriendRequestMessageParser
} from '@habbo/communication/messages/parser/friendlist/NewFriendRequestMessageParser';
import type {
    FindFriendsProcessResultMessageParser
} from '@habbo/communication/messages/parser/friendlist/FindFriendsProcessResultMessageParser';
import type {
    FriendNotificationMessageParser
} from '@habbo/communication/messages/parser/friendlist/FriendNotificationMessageParser';
import type {FriendData} from '@habbo/communication/messages/parser/friendlist/FriendData';

// Outgoing
import {
    FollowFriendMessageComposer
} from '@habbo/communication/messages/outgoing/friendlist/FollowFriendMessageComposer';
import {
    FindNewFriendsMessageComposer
} from '@habbo/communication/messages/outgoing/friendlist/FindNewFriendsMessageComposer';
import {
    GetExtendedProfileMessageComposer
} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer';
import {
    GetExtendedProfileByNameMessageComposer
} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileByNameMessageComposer';
import {
    GetHabboGroupDetailsMessageComposer
} from '@habbo/communication/messages/outgoing/users/GetHabboGroupDetailsMessageComposer';
import {EventLogMessageComposer} from '@habbo/communication/messages/outgoing/tracking/EventLogMessageComposer';

// Own package
import {FriendEntity} from './FriendEntity';
import {FriendNotification} from './FriendNotification';
import {FriendRequest} from './FriendRequest';
import type {IFriendEntity} from './IFriendEntity';
import type {IFriendRequest} from './IFriendRequest';
import type {IHabboFriendBarData} from './IHabboFriendBarData';
import {FriendBarUpdateEvent} from '../events/FriendBarUpdateEvent';
import {FriendRequestUpdateEvent} from '../events/FriendRequestUpdateEvent';
import {NewMessageEvent} from '../events/NewMessageEvent';
import {NotificationEvent} from '../events/NotificationEvent';
import {FindFriendsNotificationEvent} from '../events/FindFriendsNotificationEvent';

const log = Logger.getLogger('habbo.friendbar.HabboFriendBarData');

/**
 * HabboFriendBarData
 *
 * The friend bar's model. Holds only the friends the bar shows — **online ones** — in
 * an array for display order plus an id map for lookup, and the pending requests.
 *
 * Offline friends are dropped, not hidden: `SHOW_OFFLINE_FRIENDS` is a compile-time
 * `false` in AS3 and every path filters on `online` before building an entity. A friend
 * going offline is removed from both collections by `onFriendListUpdate()`.
 *
 * Actions do not go out from here twice: accept/decline update the local list and then
 * delegate to the friend list component, which owns the composer.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/data/HabboFriendBarData.as
 */
export class HabboFriendBarData extends Component implements IHabboFriendBarData
{
    // AS3: .../data/HabboFriendBarData.as::TRACKING_EVENT_CATEGORY
    private static readonly TRACKING_EVENT_CATEGORY: string = 'Navigation';

    // AS3: .../data/HabboFriendBarData.as::TRACKING_EVENT_TYPE
    private static readonly TRACKING_EVENT_TYPE: string = 'Friend Bar';

    // AS3: .../data/HabboFriendBarData.as::TRACKING_EVENT_ACTION_VISIT
    private static readonly TRACKING_EVENT_ACTION_VISIT: string = 'go.friendbar';

    // AS3: .../data/HabboFriendBarData.as::TRACKING_EVENT_ACTION_CHAT
    private static readonly TRACKING_EVENT_ACTION_CHAT: string = 'chat_btn_click';

    // AS3: .../data/HabboFriendBarData.as::TRACKING_EVENT_ACTION_FIND_FRIENDS
    private static readonly TRACKING_EVENT_ACTION_FIND_FRIENDS: string = 'find_friends_btn_click';

    /** **Name derived** from its value; obfuscated in every tree. */
    // AS3: .../data/HabboFriendBarData.as::TRACKING_EVENT_CATEGORY_TOOLBAR
    private static readonly TRACKING_EVENT_CATEGORY_TOOLBAR: string = 'Toolbar';

    /** **Name derived** from its value; obfuscated in every tree. */
    // AS3: .../data/HabboFriendBarData.as::TRACKING_EVENT_ACTION_OPEN
    private static readonly TRACKING_EVENT_ACTION_OPEN: string = 'open';

    /** **Name derived** from its value; obfuscated in every tree. */
    // AS3: .../data/HabboFriendBarData.as::TRACKING_EVENT_ACTION_CLOSE
    private static readonly TRACKING_EVENT_ACTION_CLOSE: string = 'close';

    // AS3: .../data/HabboFriendBarData.as::LEGACY_TRACKING_EVENT_TYPE_FRIENDLIST
    private static readonly LEGACY_TRACKING_EVENT_TYPE_FRIENDLIST: string = 'FRIENDLIST';

    // AS3: .../data/HabboFriendBarData.as::LEGACY_TRACKING_EVENT_TYPE_MESSENGER
    private static readonly LEGACY_TRACKING_EVENT_TYPE_MESSENGER: string = 'MESSENGER';

    // AS3: .../data/HabboFriendBarData.as::HabboFriendBarData()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    // AS3: .../data/HabboFriendBarData.as::_habboCommunicationManager
    private _habboCommunicationManager: IHabboCommunicationManager | null = null;

    // AS3: .../data/HabboFriendBarData.as::_habboFriendListComponent
    private _habboFriendListComponent: IHabboFriendList | null = null;

    // AS3: .../data/HabboFriendBarData.as::_habboMessengerComponent
    private _habboMessengerComponent: IHabboMessenger | null = null;

    // AS3: .../data/HabboFriendBarData.as::_tracking
    private _tracking: IHabboTracking | null = null;

    // AS3: .../data/HabboFriendBarData.as::_SafeStr_4708
    private _friends: FriendEntity[] = [];

    // AS3: .../data/HabboFriendBarData.as::_SafeStr_5203
    private _friendsById: OrderedMap<number, FriendEntity> | null = new OrderedMap<number, FriendEntity>();

    // AS3: .../data/HabboFriendBarData.as::_SafeStr_4724
    private _friendRequests: FriendRequest[] = [];

    // AS3: .../data/HabboFriendBarData.as::_SafeStr_6221
    private _lastSenderId: number = 0;

    private _messageEvents: IMessageEvent[] = [];

    // AS3: .../data/HabboFriendBarData.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<unknown>>
    {
        return [
            // Depended on for load order only; AS3 passes a null setter here too.
            new ComponentDependency(IID_HabboConfigurationManager, () => undefined, true),
            new ComponentDependency(IID_HabboCommunicationManager, (manager: IHabboCommunicationManager | null) =>
            {
                this._habboCommunicationManager = manager;
            }, true),
            new ComponentDependency(IID_HabboFriendList, (friendList: IHabboFriendList | null) =>
            {
                this._habboFriendListComponent = friendList;
            }, true),
            // Required, as in AS3. It was briefly optional while nothing in this port was
            // attached against IID_HabboMessenger: a required dependency that never
            // resolves leaves the component locked forever, which is what kept
            // initComponent() from running and the friend bar from ever being built.
            // HabboMessenger is attached now (VortexMain::initFriendList), so the AS3
            // shape holds again.
            new ComponentDependency(IID_HabboMessenger, (messenger: IHabboMessenger | null) =>
            {
                this._habboMessengerComponent = messenger;
            }, true),
            new ComponentDependency(IID_HabboTracking, (tracking: IHabboTracking | null) =>
            {
                this._tracking = tracking;
            }, true)
        ] as Array<ComponentDependency<unknown>>;
    }

    // AS3: .../data/HabboFriendBarData.as::initComponent()
    protected override initComponent(): void
    {
        this.addMessageEvent(new FriendListUpdateMessageEvent(this.onFriendListUpdate.bind(this)));
        this.addMessageEvent(new MessengerInitEvent(this.onMessengerInitialized.bind(this)));
        this.addMessageEvent(new FriendListFragmentMessageEvent(this.onFriendsListFragment.bind(this)));
        this.addMessageEvent(new NewConsoleMessageEvent(this.onNewConsoleMessage.bind(this)));
        this.addMessageEvent(new FriendRequestsMessageEvent(this.onFriendRequestList.bind(this)));
        this.addMessageEvent(new RoomInviteEvent(this.onRoomInvite.bind(this)));
        this.addMessageEvent(new NewFriendRequestMessageEvent(this.onNewFriendRequest.bind(this)));
        this.addMessageEvent(new FindFriendsProcessResultMessageEvent(this.onFindFriendProcessResult.bind(this)));
        this.addMessageEvent(new FriendNotificationMessageEvent(this.onFriendNotification.bind(this)));

        // The friend list answers requests; the bar only has to drop its own copy.
        this._habboFriendListComponent?.events.on(FriendRequestEvent.ACCEPTED, this.onFriendRequestEvent);
        this._habboFriendListComponent?.events.on(FriendRequestEvent.DECLINED, this.onFriendRequestEvent);
    }

    // AS3: .../data/HabboFriendBarData.as::get numFriends()
    get numFriends(): number
    {
        return this._friends.length;
    }

    // AS3: .../data/HabboFriendBarData.as::getFriendAt()
    getFriendAt(index: number): IFriendEntity | null
    {
        return this._friends[index] ?? null;
    }

    // AS3: .../data/HabboFriendBarData.as::getFriendByID()
    getFriendByID(id: number): IFriendEntity | null
    {
        return this._friendsById?.getValue(id) ?? null;
    }

    // AS3: .../data/HabboFriendBarData.as::getFriendByName()
    getFriendByName(name: string): IFriendEntity | null
    {
        for(const friend of this._friends)
        {
            if(friend.name === name)
            {
                return friend;
            }
        }

        return null;
    }

    /**
     * Moves a friend to `index`. Used to float whoever just messaged you to the front
     * of the bar; a no-op when the friend is already there.
     */
    // AS3: .../data/HabboFriendBarData.as::setFriendAt()
    setFriendAt(friend: IFriendEntity, index: number): void
    {
        const currentIndex = this._friends.indexOf(friend as FriendEntity);

        if(currentIndex > -1 && currentIndex !== index)
        {
            this._friends.splice(currentIndex, 1);
            this._friends.splice(index, 0, friend as FriendEntity);
            this.events.emit(FriendBarUpdateEvent.FRIEND_LIST_UPDATED, new FriendBarUpdateEvent());
        }
    }

    // AS3: .../data/HabboFriendBarData.as::get numFriendRequests()
    get numFriendRequests(): number
    {
        return this._friendRequests.length;
    }

    // AS3: .../data/HabboFriendBarData.as::getFriendRequestAt()
    getFriendRequestAt(index: number): IFriendRequest | null
    {
        return this._friendRequests[index] ?? null;
    }

    // AS3: .../data/HabboFriendBarData.as::getFriendRequestByID()
    getFriendRequestByID(id: number): IFriendRequest | null
    {
        for(const request of this._friendRequests)
        {
            if(request.id === id)
            {
                return request;
            }
        }

        return null;
    }

    // AS3: .../data/HabboFriendBarData.as::getFriendRequestByName()
    getFriendRequestByName(name: string): IFriendRequest | null
    {
        for(const request of this._friendRequests)
        {
            if(request.name === name)
            {
                return request;
            }
        }

        return null;
    }

    // AS3: .../data/HabboFriendBarData.as::getFriendRequestList()
    getFriendRequestList(): IFriendRequest[]
    {
        return this._friendRequests;
    }

    // AS3: .../data/HabboFriendBarData.as::acceptFriendRequest()
    acceptFriendRequest(id: number): void
    {
        this.removeFriendRequest(id);

        if(this._habboFriendListComponent !== null)
        {
            this._habboFriendListComponent.acceptFriendRequest(id);
        }
    }

    // AS3: .../data/HabboFriendBarData.as::acceptAllFriendRequests()
    acceptAllFriendRequests(): void
    {
        this._friendRequests = [];
        this._habboFriendListComponent?.acceptAllFriendRequests();
        this.events.emit(FriendRequestUpdateEvent.FRIEND_REQUEST_UPDATE, new FriendRequestUpdateEvent());
    }

    // AS3: .../data/HabboFriendBarData.as::declineFriendRequest()
    declineFriendRequest(id: number): void
    {
        this.removeFriendRequest(id);

        if(this._habboFriendListComponent !== null)
        {
            this._habboFriendListComponent.declineFriendRequest(id);
        }
    }

    // AS3: .../data/HabboFriendBarData.as::declineAllFriendRequests()
    declineAllFriendRequests(): void
    {
        this._friendRequests = [];
        this._habboFriendListComponent?.declineAllFriendRequests();
        this.events.emit(FriendRequestUpdateEvent.FRIEND_REQUEST_UPDATE, new FriendRequestUpdateEvent());
    }

    /**
     * A negative id is a group, not a user — the bar packs both into one list, and the
     * group branch sends the group-details request with the sign stripped.
     */
    // AS3: .../data/HabboFriendBarData.as::showProfile()
    showProfile(id: number): void
    {
        if(this._habboCommunicationManager === null)
        {
            return;
        }

        if(id > 0)
        {
            this._habboCommunicationManager.connection?.send(new GetExtendedProfileMessageComposer(id));
        }
        else
        {
            this._habboCommunicationManager.connection?.send(new GetHabboGroupDetailsMessageComposer(Math.abs(id), true));
        }
    }

    // AS3: .../data/HabboFriendBarData.as::showProfileByName()
    showProfileByName(name: string): void
    {
        this._habboCommunicationManager?.connection?.send(new GetExtendedProfileByNameMessageComposer(name));
    }

    // AS3: .../data/HabboFriendBarData.as::followToRoom()
    followToRoom(id: number): void
    {
        if(this._habboCommunicationManager === null)
        {
            return;
        }

        this._habboCommunicationManager.connection?.send(new FollowFriendMessageComposer(id));
        this._habboCommunicationManager.connection?.send(new EventLogMessageComposer(
            HabboFriendBarData.TRACKING_EVENT_CATEGORY,
            HabboFriendBarData.TRACKING_EVENT_TYPE,
            HabboFriendBarData.TRACKING_EVENT_ACTION_VISIT
        ));
    }

    // AS3: .../data/HabboFriendBarData.as::startConversation()
    startConversation(id: number): void
    {
        if(this._habboMessengerComponent === null)
        {
            return;
        }

        this._habboMessengerComponent.startConversation(id);
        this.events.emit(NewMessageEvent.NEW_INSTANT_MESSAGE, new NewMessageEvent(false, id));

        this._habboCommunicationManager?.connection?.send(new EventLogMessageComposer(
            HabboFriendBarData.TRACKING_EVENT_CATEGORY,
            HabboFriendBarData.TRACKING_EVENT_TYPE,
            HabboFriendBarData.TRACKING_EVENT_ACTION_CHAT
        ));
    }

    // AS3: .../data/HabboFriendBarData.as::findNewFriends()
    findNewFriends(): void
    {
        if(this._habboCommunicationManager === null)
        {
            return;
        }

        this._habboCommunicationManager.connection?.send(new FindNewFriendsMessageComposer());
        this._habboCommunicationManager.connection?.send(new EventLogMessageComposer(
            HabboFriendBarData.TRACKING_EVENT_CATEGORY,
            HabboFriendBarData.TRACKING_EVENT_TYPE,
            HabboFriendBarData.TRACKING_EVENT_ACTION_FIND_FRIENDS
        ));
    }

    /** The search button toggles: already on the search tab means close. */
    // AS3: .../data/HabboFriendBarData.as::openUserTextSearch()
    openUserTextSearch(): void
    {
        if(this._habboFriendListComponent === null)
        {
            return;
        }

        if(this._habboFriendListComponent.currentTabId() !== FriendListTabEnum.TABID_SEARCH)
        {
            this._habboFriendListComponent.openFriendSearch();
        }
        else
        {
            this._habboFriendListComponent.close();
        }
    }

    /**
     * Opening the list prefers the requests tab when any are pending.
     *
     * When it is already open but buried, the click raises it instead of closing it —
     * otherwise a hidden window would appear to ignore the button.
     */
    // AS3: .../data/HabboFriendBarData.as::toggleFriendList()
    toggleFriendList(): void
    {
        const friendList = this._habboFriendListComponent;

        if(friendList === null)
        {
            return;
        }

        if(!friendList.isOpen())
        {
            if(this._friendRequests.length > 0)
            {
                friendList.openFriendRequests();
            }
            else
            {
                friendList.openFriendList();
            }
        }
        else
        {
            const mainWindow = (friendList as unknown as {mainWindow?: {activate(): void} | null}).mainWindow ?? null;

            if(mainWindow !== null && WindowToggle.isHiddenByOtherWindows(mainWindow as never))
            {
                mainWindow.activate();

                return;
            }

            friendList.close();
        }

        this._habboCommunicationManager?.connection?.send(new EventLogMessageComposer(
            HabboFriendBarData.TRACKING_EVENT_CATEGORY_TOOLBAR,
            HabboFriendBarData.LEGACY_TRACKING_EVENT_TYPE_FRIENDLIST,
            friendList.isOpen() ? HabboFriendBarData.TRACKING_EVENT_ACTION_OPEN : HabboFriendBarData.TRACKING_EVENT_ACTION_CLOSE
        ));
    }

    // AS3: .../data/HabboFriendBarData.as::toggleMessenger()
    toggleMessenger(): void
    {
        const messenger = this._habboMessengerComponent;

        if(messenger === null)
        {
            return;
        }

        messenger.toggleMessenger();

        this._habboCommunicationManager?.connection?.send(new EventLogMessageComposer(
            HabboFriendBarData.TRACKING_EVENT_CATEGORY_TOOLBAR,
            HabboFriendBarData.LEGACY_TRACKING_EVENT_TYPE_MESSENGER,
            messenger.isOpen() ? HabboFriendBarData.TRACKING_EVENT_ACTION_OPEN : HabboFriendBarData.TRACKING_EVENT_ACTION_CLOSE
        ));
    }

    // AS3: .../data/HabboFriendBarData.as::get showFriendNotifications()
    get showFriendNotifications(): boolean
    {
        return this.getBoolean('friendbar.notifications.enabled');
    }

    // AS3: .../data/HabboFriendBarData.as::get showFriendRequests()
    get showFriendRequests(): boolean
    {
        return this.getBoolean('friendbar.requests.enabled');
    }

    // === Message handlers ===

    /**
     * The messenger is up: start relaying its conversation count to the bar.
     *
     * The subscription lives here rather than in the view because the count crosses two event
     * buses — the messenger raises `ACCE_changed` on its own, and `HabboFriendBarView` listens
     * for `AMC_EVENT` on *this* component's bus. `onUpdateActiveConversationCount()` is the
     * hop between them.
     */
    // AS3: .../data/HabboFriendBarData.as::onMessengerInitialized()
    private onMessengerInitialized(_event: IMessageEvent): void
    {
        this._habboMessengerComponent?.events.on(
            ActiveConversationEvent.ACTIVE_CONVERSATION_COUNT_CHANGED,
            this.onUpdateActiveConversationCount
        );
    }

    // AS3: .../data/HabboFriendBarData.as::onUpdateActiveConversationCount()
    private onUpdateActiveConversationCount = (event: ActiveConversationEvent): void =>
    {
        this.events.emit(
            ActiveConversationsCountEvent.ACTIVE_MESSENGER_CONVERSATION_EVENT,
            new ActiveConversationsCountEvent(event.activeConversationsCount, event.hasUnread)
        );
    };

    // AS3: .../data/HabboFriendBarData.as::onFriendsListFragment()
    private onFriendsListFragment(event: IMessageEvent): void
    {
        const parser = event?.parser as FriendListFragmentMessageParser | null;

        if(!parser)
        {
            return;
        }

        this.buildFriendList(parser.friendFragment);
    }

    /**
     * Removals close their conversation as well; an update that turns a friend offline
     * removes them from the bar entirely, and one that turns them online inserts them
     * at the front.
     */
    // AS3: .../data/HabboFriendBarData.as::onFriendListUpdate()
    private onFriendListUpdate(event: IMessageEvent): void
    {
        const parser = event?.parser as FriendListUpdateMessageParser | null;

        if(!parser || this._friendsById === null)
        {
            return;
        }

        for(const removedId of parser.removedFriendIds)
        {
            const friend = this._friendsById.getValue(removedId);

            if(friend !== null)
            {
                this._friendsById.remove(removedId);
                this._friends.splice(this._friends.indexOf(friend), 1);
                this._habboMessengerComponent?.closeConversation(removedId);
            }
        }

        for(const updated of parser.updatedFriends)
        {
            const friend = this._friendsById.getValue(updated.id);

            if(friend !== null)
            {
                if(updated.online)
                {
                    friend.name = updated.name;
                    friend.realName = updated.realName;
                    friend.motto = updated.motto;
                    friend.gender = updated.gender;
                    friend.online = updated.online;
                    friend.allowFollow = updated.followingAllowed;
                    friend.figure = updated.figure;
                    friend.categoryId = updated.categoryId;
                    friend.lastAccess = this.lastAccessOf(updated);
                }
                else
                {
                    this._friendsById.remove(updated.id);
                    this._friends.splice(this._friends.indexOf(friend), 1);
                }
            }
            else if(updated.online)
            {
                const entity = this.createEntity(updated);

                this._friends.splice(0, 0, entity);
                this._friendsById.add(entity.id, entity);
            }
        }

        for(const added of parser.addedFriends)
        {
            if(added.online && this._friendsById.getValue(added.id) === null)
            {
                const entity = this.createEntity(added);

                this._friends.push(entity);
                this._friendsById.add(entity.id, entity);
            }

            // A friend that just landed cannot still be a pending request.
            this.removeFriendRequest(added.id);
        }

        if(parser.addedFriends.length > 0 || parser.updatedFriends.length > 0)
        {
            this._friends = this.sortByName(this._friends);
        }

        this.events.emit(FriendBarUpdateEvent.FRIEND_LIST_UPDATED, new FriendBarUpdateEvent());
    }

    // AS3: .../data/HabboFriendBarData.as::onFindFriendProcessResult()
    private onFindFriendProcessResult(event: IMessageEvent): void
    {
        const parser = event?.parser as FindFriendsProcessResultMessageParser | null;

        if(!parser)
        {
            return;
        }

        this.events.emit(FindFriendsNotificationEvent.TYPE, new FindFriendsNotificationEvent(parser.success));
    }

    // AS3: .../data/HabboFriendBarData.as::onNewFriendRequest()
    private onNewFriendRequest(event: IMessageEvent): void
    {
        const parser = event?.parser as NewFriendRequestMessageParser | null;

        if(!parser || parser.req === null || !this.showFriendRequests)
        {
            return;
        }

        this._friendRequests.push(new FriendRequest(parser.req.requestId, parser.req.requesterName, parser.req.figureString));
        this.events.emit(FriendRequestUpdateEvent.FRIEND_REQUEST_UPDATE, new FriendRequestUpdateEvent());
    }

    // AS3: .../data/HabboFriendBarData.as::onFriendRequestList()
    private onFriendRequestList(event: IMessageEvent): void
    {
        const parser = event?.parser as FriendRequestsMessageParser | null;

        if(!parser || !this.showFriendRequests)
        {
            return;
        }

        for(const request of parser.reqs)
        {
            this._friendRequests.push(new FriendRequest(request.requestId, request.requesterName, request.figureString));
        }

        this.events.emit(FriendRequestUpdateEvent.FRIEND_REQUEST_UPDATE, new FriendRequestUpdateEvent());
    }

    // AS3: .../data/HabboFriendBarData.as::onFriendRequestEvent()
    private onFriendRequestEvent = (event: FriendRequestEvent): void =>
    {
        this.removeFriendRequest(event.requestId);
    };

    /**
     * An incoming message notifies only while the messenger is closed; the bar's own
     * `NewMessageEvent` still fires either way, so the sender's slot can react.
     */
    // AS3: .../data/HabboFriendBarData.as::onNewConsoleMessage()
    private onNewConsoleMessage(event: IMessageEvent): void
    {
        const parser = event?.parser as NewConsoleMessageEventParser | null;

        if(!parser)
        {
            return;
        }

        this._lastSenderId = parser.chatId;

        const notify = !(this._habboMessengerComponent?.isOpen() ?? false);

        if(this._habboFriendListComponent?.hasFriendsListInitialized)
        {
            this.events.emit(NewMessageEvent.NEW_INSTANT_MESSAGE, new NewMessageEvent(notify, this._lastSenderId));
        }

        if(notify)
        {
            this.makeNotification(String(this._lastSenderId), FriendNotification.TYPE_MESSENGER, null, false, false);
        }
    }

    // AS3: .../data/HabboFriendBarData.as::onRoomInvite()
    private onRoomInvite(event: IMessageEvent): void
    {
        const parser = event?.parser as RoomInviteEventParser | null;

        if(!parser)
        {
            return;
        }

        this._lastSenderId = parser.senderId;

        if(this._habboMessengerComponent !== null && !this._habboMessengerComponent.isOpen())
        {
            this.events.emit(NewMessageEvent.NEW_INSTANT_MESSAGE, new NewMessageEvent(true, this._lastSenderId));
            this.makeNotification(String(this._lastSenderId), FriendNotification.TYPE_MESSENGER, null, true, false);
        }
    }

    /**
     * "Playing a game" is the one type that neither expires on view nor floats the
     * friend to the front — it is a standing state, not an event.
     */
    // AS3: .../data/HabboFriendBarData.as::onFriendNotification()
    private onFriendNotification(event: IMessageEvent): void
    {
        const parser = event?.parser as FriendNotificationMessageParser | null;

        if(!parser)
        {
            return;
        }

        const viewOnce = parser.typeCode !== FriendNotification.TYPE_PLAYING_GAME;
        const moveToFront = parser.typeCode !== FriendNotification.TYPE_FINISHED_GAME;
        const notifyOnUpdate = parser.typeCode !== FriendNotification.TYPE_PLAYING_GAME;

        this.makeNotification(parser.avatarId, parser.typeCode, parser.message, viewOnce, moveToFront, notifyOnUpdate);
    }

    /**
     * One badge per type per friend: an existing badge of the same type is updated in
     * place, and `notifyOnUpdate` decides whether that update is even announced.
     */
    // AS3: .../data/HabboFriendBarData.as::makeNotification()
    private makeNotification(
        avatarId: string,
        typeCode: number,
        message: string | null,
        viewOnce: boolean,
        moveToFront: boolean,
        notifyOnUpdate: boolean = true
    ): void
    {
        if(!this.showFriendNotifications)
        {
            return;
        }

        const friend = this.getFriendByID(parseInt(avatarId, 10));

        if(friend === null)
        {
            return;
        }

        const notifications = friend.notifications;
        let notification: FriendNotification | null = null;

        for(const existing of notifications)
        {
            if(existing.typeCode === typeCode)
            {
                existing.message = message ?? '';
                existing.viewOnce = viewOnce;
                notification = existing as FriendNotification;
                break;
            }
        }

        if(notification === null)
        {
            notification = new FriendNotification(typeCode, message ?? '', viewOnce);
            notifications.push(notification);
        }
        else if(!notifyOnUpdate)
        {
            return;
        }

        this.events.emit(NotificationEvent.FRIEND_NOTIFICATION_EVENT, new NotificationEvent(friend.id, notification));

        if(moveToFront)
        {
            this.setFriendAt(friend, 0);
        }

        if(friend.logEventId < 0)
        {
            friend.logEventId = friend.getNextLogEventId();
        }

        this._tracking?.trackEventLog(
            'FriendBar',
            FriendNotification.typeCodeToString(typeCode),
            'notified',
            '',
            friend.logEventId > 0 ? friend.logEventId : 0
        );
    }

    // AS3: .../data/HabboFriendBarData.as::buildFriendList()
    private buildFriendList(fragment: FriendData[]): void
    {
        if(this._friendsById === null)
        {
            return;
        }

        for(const data of fragment)
        {
            if(data.online)
            {
                const entity = this.createEntity(data);

                this._friends.push(entity);
                this._friendsById.add(entity.id, entity);
            }
        }

        this._friends = this.sortByName(this._friends);
        this.events.emit(FriendBarUpdateEvent.FRIEND_LIST_UPDATED, new FriendBarUpdateEvent());
    }

    /**
     * `lastAccess` is declared on the wire DTO and never read from the socket — the AS3
     * parser's constructor skips it — so it is always empty here, exactly as in the
     * real client. See `friendlist/domain/Friend.ts` for the same finding.
     */
    private lastAccessOf(_data: FriendData): string
    {
        return '';
    }

    private createEntity(data: FriendData): FriendEntity
    {
        return new FriendEntity(
            data.id,
            data.name,
            data.realName,
            data.motto,
            data.gender,
            data.online,
            data.followingAllowed,
            data.figure,
            data.categoryId,
            this.lastAccessOf(data)
        );
    }

    /**
     * AS3's `sortByName()` returns the array untouched — the display order is the order
     * the server sent, plus whatever `setFriendAt()` has moved. Kept as-is: the sibling
     * `sortByNameAndOnlineStatus()` below is what a real sort would look like, and
     * nothing calls it.
     */
    // AS3: .../data/HabboFriendBarData.as::sortByName()
    private sortByName(friends: FriendEntity[]): FriendEntity[]
    {
        return friends;
    }

    /**
     * Online friends first, offline after, each block keeping its relative order.
     * Dead code in AS3 too — no caller — but ported because the bar is one config flag
     * (`SHOW_OFFLINE_FRIENDS`) away from needing it.
     */
    // AS3: .../data/HabboFriendBarData.as::sortByNameAndOnlineStatus()
    private sortByNameAndOnlineStatus(friends: FriendEntity[]): FriendEntity[]
    {
        const online: FriendEntity[] = [];
        const offline: FriendEntity[] = [];

        for(let i = friends.length - 1; i >= 0; i--)
        {
            const friend = friends[i]!;

            if(friend.online)
            {
                online.push(friend);
            }
            else
            {
                offline.push(friend);
            }
        }

        while(offline.length > 0)
        {
            online.push(offline.pop()!);
        }

        return online;
    }

    // AS3: .../data/HabboFriendBarData.as::removeFriendRequest()
    private removeFriendRequest(id: number): void
    {
        for(const request of this._friendRequests)
        {
            if(request.id === id)
            {
                this._friendRequests.splice(this._friendRequests.indexOf(request), 1);
                this.events.emit(FriendRequestUpdateEvent.FRIEND_REQUEST_UPDATE, new FriendRequestUpdateEvent());

                return;
            }
        }
    }

    // AS3: .../data/HabboFriendBarData.as::sendEventLogTracking()
    private sendEventLogTracking(action: string, extra: string): void
    {
        this._habboCommunicationManager?.connection?.send(new EventLogMessageComposer(
            HabboFriendBarData.TRACKING_EVENT_CATEGORY,
            HabboFriendBarData.TRACKING_EVENT_TYPE,
            action,
            extra,
            this.numFriends
        ));
    }

    private addMessageEvent(event: IMessageEvent): void
    {
        if(this._habboCommunicationManager)
        {
            this._habboCommunicationManager.addMessageEvent(event);
            this._messageEvents.push(event);
        }
    }

    // AS3: .../data/HabboFriendBarData.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        if(this._habboFriendListComponent !== null)
        {
            this._habboFriendListComponent.events.off(FriendRequestEvent.ACCEPTED, this.onFriendRequestEvent);
            this._habboFriendListComponent.events.off(FriendRequestEvent.DECLINED, this.onFriendRequestEvent);
        }

        this._habboMessengerComponent?.events.off(
            ActiveConversationEvent.ACTIVE_CONVERSATION_COUNT_CHANGED,
            this.onUpdateActiveConversationCount
        );

        if(this._habboCommunicationManager)
        {
            for(const event of this._messageEvents)
            {
                this._habboCommunicationManager.removeMessageEvent(event);
            }
        }

        this._messageEvents = [];
        this._friends = [];
        this._friendsById?.dispose();
        this._friendsById = null;
        this._friendRequests = [];

        log.debug('HabboFriendBarData disposed');

        super.dispose();
    }
}
