import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {HabboNavigator} from './HabboNavigator';
import type {NavigatorData} from './domain';
import {Logger} from '@core/utils/Logger';

// Message events
import {UserObjectMessageEvent} from '../communication/messages/incoming/handshake/UserObjectMessageEvent';
import {
    NoOwnedRoomsAlertMessageEvent,
    NoSuchFlatMessageEvent,
    RoomFilterSettingsMessageEvent,
    RoomMuteAllMessageEvent,
    RoomSettingsErrorMessageEvent,
} from '../communication/messages/incoming/navigator';
import type {
    RoomFilterSettingsMessageEventParser,
    RoomMuteAllMessageEventParser,
} from '../communication/messages/parser/navigator';
import {FlatAccessibleMessageEvent} from '../communication/messages/incoming/room/session/FlatAccessibleMessageEvent';
import type {FlatAccessibleMessageParser} from '../communication/messages/parser/room/session/FlatAccessibleMessageParser';
import {CantConnectMessageEvent} from '../communication/messages/incoming/room/session/CantConnectMessageEvent';
import {RoomForwardMessageEvent} from '../communication/messages/incoming/room/session/RoomForwardMessageEvent';
import {RoomEntryInfoMessageEvent} from '../communication/messages/incoming/room/engine/RoomEntryInfoMessageEvent';
import {CloseConnectionMessageEvent} from '../communication/messages/incoming/room/session/CloseConnectionMessageEvent';
import {GenericErrorMessageEvent} from '../communication/messages/incoming/handshake/GenericErrorMessageEvent';
import {UserRightsMessageEvent} from '../communication/messages/incoming/handshake/UserRightsMessageEvent';
import {
    HabboGroupDetailsMessageEvent
} from '../communication/messages/incoming/users/HabboGroupDetailsMessageEvent';
import type {
    HabboGroupDetailsMessageParser
} from '../communication/messages/parser/users/HabboGroupDetailsMessageParser';
import {ScrSendUserInfoEvent} from '../communication/messages/incoming/users/ScrSendUserInfoEvent';
import {
    FriendListFragmentMessageEvent,
    FriendListUpdateMessageEvent,
} from '../communication/messages/incoming/friendlist';
import {RoomSettingsSavedEvent} from '../communication/messages/incoming/roomsettings';
import type {CantConnectMessageParser} from '../communication/messages/parser/room/session/CantConnectMessageParser';
import type {RoomForwardMessageParser} from '../communication/messages/parser/room/session/RoomForwardMessageParser';
import type {RoomEntryInfoMessageParser} from '../communication/messages/parser/room/engine/RoomEntryInfoMessageParser';
import type {GenericErrorMessageParser} from '../communication/messages/parser/handshake/GenericErrorMessageParser';
import type {UserRightsMessageParser} from '../communication/messages/parser/handshake/UserRightsMessageParser';
import type {ScrSendUserInfoMessageParser} from '../communication/messages/parser/users/ScrSendUserInfoMessageParser';
import type {RoomSettingsSavedEventParser} from '../communication/messages/parser/roomsettings';
import {GetGuestRoomMessageComposer} from '../communication/messages/outgoing/navigator/GetGuestRoomMessageComposer';
import {
    FollowFriendMessageComposer
} from '../communication/messages/outgoing/friendlist/FollowFriendMessageComposer';
import {isRoomViewerMode} from '../configuration/enum/HabboComponentFlags';
import {QuitMessageComposer} from '../communication/messages/outgoing/room/session/QuitMessageComposer';
import {HabboWebTools} from '../utils/HabboWebTools';
import {HabboToolbarEvent} from '../toolbar/events/HabboToolbarEvent';
import {SimpleAlertView} from './SimpleAlertView';
import {ClubPromoAlertView} from './ClubPromoAlertView';
import {AlertView} from './AlertView';
import {
    BannedUsersFromRoomEvent,
    FlatControllerAddedEvent,
    FlatControllerRemovedEvent,
    FlatControllersEvent,
    RoomSettingsDataEvent,
    RoomSettingsSaveErrorEvent,
    ShowEnforceRoomCategoryDialogEvent,
    UserUnbannedFromRoomEvent,
} from '../communication/messages/incoming/roomsettings';
import type {
    BannedUsersFromRoomEventParser,
    FlatControllerAddedEventParser,
    FlatControllerRemovedEventParser,
    FlatControllersEventParser,
    RoomSettingsDataEventParser,
    RoomSettingsSaveErrorEventParser,
    ShowEnforceRoomCategoryDialogEventParser,
    UserUnbannedFromRoomEventParser,
} from '../communication/messages/parser/roomsettings';
import {
    CanCreateRoomEventMessageEvent,
    CanCreateRoomMessageEvent,
    CategoriesWithVisitorCountMessageEvent,
    CompetitionRoomsDataMessageEvent,
    ConvertedRoomIdMessageEvent,
    DoorbellMessageEvent,
    FavouriteChangedMessageEvent,
    FavouritesMessageEvent,
    FlatAccessDeniedMessageEvent,
    FlatCreatedMessageEvent,
    GetGuestRoomResultMessageEvent,
    GuestRoomSearchResultMessageEvent,
    NavigatorSettingsMessageEvent,
    OfficialRoomsMessageEvent,
    PopularRoomTagsResultMessageEvent,
    RoomEventCancelMessageEvent,
    RoomEventMessageEvent,
    RoomInfoUpdatedMessageEvent,
    UserEventCatsMessageEvent,
    UserFlatCatsMessageEvent,
} from '../communication/messages/incoming/navigator';

// Parsers
import type {
    CanCreateRoomEventMessageParser,
    CanCreateRoomMessageParser,
    CategoriesWithVisitorCountMessageParser,
    CompetitionRoomsDataMessageParser,
    ConvertedRoomIdMessageParser,
    DoorbellMessageParser,
    FavouriteChangedMessageParser,
    FavouritesMessageParser,
    FlatAccessDeniedMessageParser,
    FlatCreatedMessageParser,
    GetGuestRoomResultMessageParser,
    GuestRoomSearchResultMessageParser,
    NavigatorSettingsMessageParser,
    OfficialRoomsMessageParser,
    PopularRoomTagsResultMessageParser,
    RoomEventMessageParser,
    RoomInfoUpdatedMessageParser,
    UserEventCatsMessageParser,
    UserFlatCatsMessageParser,
} from '../communication/messages/parser/navigator';
import type {UserObjectMessageParser} from '../communication/messages/parser/handshake/UserObjectMessageParser';

import {
    GetUserEventCatsMessageComposer,
    GetUserFlatCatsMessageComposer,
} from '../communication/messages/outgoing/navigator';

const log = Logger.getLogger('habbo.navigator.IncomingMessages');

/**
 * Handles incoming navigator messages
 *
 */
export class IncomingMessages
{
    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::_navigator
    private _navigator: HabboNavigator;
    private _messageEvents: IMessageEvent[] = [];

    constructor(navigator: HabboNavigator)
    {
        this._navigator = navigator;

        this.addMessageListeners();
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::get data()
    get data(): NavigatorData
    {
        return this._navigator.data;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_2208.as::removeLegacyMessageListeners()
    dispose(): void
    {
        for(const event of this._messageEvents)
        {
            this._navigator.communication.removeMessageEvent(event);
        }

        this._messageEvents = [];
    }

    // DEVIATION: AS3 also listens for RoomRatingEvent (`onRoomRating()`), storing the room's score
    //   and whether the viewer may vote. The RPG fork removed room voting; the server still sends
    //   the message (with CanRate false), and HabboMessages keeps it registered so it parses.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_2208.as::addMessageListeners()
    private addMessageListeners(): void
    {
        // Settings & Favourites
        // Room settings. AS3 registers these in the navigator's own incoming-messages class
        // (_SafeCls_1951.as lines 120-121/134 and the flat-controller/ban block) and routes
        // each to roomSettingsCtrl. None of them were subscribed here, so RoomSettingsCtrl —
        // complete, and holding every handler below — never heard a single reply: clicking
        // "room settings" sent GetRoomSettings (256) and nothing ever came back to open the
        // window. Room filter opened fine precisely because it needs no round trip.
        // Room lifecycle, forwarding and rights. AS3 registers all of these in the same
        // class (_SafeCls_1951.as); none were subscribed here, which is why entering a room
        // left the info/settings/filter windows open over it, and why HC, event-mod and
        // room-picker state never reached NavigatorData.
        this.addMessageEvent(new FlatAccessibleMessageEvent(this.onDoorOpened.bind(this)));
        this.addMessageEvent(new RoomMuteAllMessageEvent(this.onMuteAllEvent.bind(this)));
        this.addMessageEvent(new NoOwnedRoomsAlertMessageEvent(this.onNoOwnedRoomsAlert.bind(this)));
        this.addMessageEvent(new NoSuchFlatMessageEvent(this.onNoSuchFlat.bind(this)));
        this.addMessageEvent(new RoomFilterSettingsMessageEvent(this.onRoomFilterSettings.bind(this)));
        this.addMessageEvent(new RoomSettingsErrorMessageEvent(this.onRoomSettingsError.bind(this)));
        this.addMessageEvent(new RoomEntryInfoMessageEvent(this.onRoomEnter.bind(this)));
        this.addMessageEvent(new CloseConnectionMessageEvent(this.onRoomExit.bind(this)));
        this.addMessageEvent(new CantConnectMessageEvent(this.onCantConnect.bind(this)));
        this.addMessageEvent(new RoomForwardMessageEvent(this.onRoomForward.bind(this)));
        this.addMessageEvent(new GenericErrorMessageEvent(this.onError.bind(this)));
        this.addMessageEvent(new UserRightsMessageEvent(this.onUserRights.bind(this)));
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_2208.as::_SafeCls_2208()
        // The navigator is a second subscriber to this push — `HabboGroupsManager` takes it too,
        // for the group window. Without it `HabboNewNavigator._groupDetails` stayed empty and
        // `onGroupDetailsArrived()` never fired, though both were written.
        this.addMessageEvent(new HabboGroupDetailsMessageEvent(this.onGroupDetails.bind(this)));
        this.addMessageEvent(new ScrSendUserInfoEvent(this.onSubscriptionInfo.bind(this)));
        this.addMessageEvent(new RoomSettingsSavedEvent(this.onRoomSettingsSaved.bind(this)));
        this.addMessageEvent(new FriendListFragmentMessageEvent(this.onFriendsListFragment.bind(this)));
        this.addMessageEvent(new FriendListUpdateMessageEvent(this.onFriendListUpdate.bind(this)));

        this.addMessageEvent(new RoomSettingsDataEvent(this.onRoomSettingsData.bind(this)));
        this.addMessageEvent(new RoomSettingsSaveErrorEvent(this.onRoomSettingsSaveError.bind(this)));
        this.addMessageEvent(new FlatControllersEvent(this.onFlatControllers.bind(this)));
        this.addMessageEvent(new FlatControllerAddedEvent(this.onFlatControllerAdded.bind(this)));
        this.addMessageEvent(new FlatControllerRemovedEvent(this.onFlatControllerRemoved.bind(this)));
        this.addMessageEvent(new BannedUsersFromRoomEvent(this.onBannedUsersFromRoom.bind(this)));
        this.addMessageEvent(new UserUnbannedFromRoomEvent(this.onUserUnbannedFromRoom.bind(this)));
        this.addMessageEvent(new ShowEnforceRoomCategoryDialogEvent(this.onEnforceRoomCategorySelection.bind(this)));

        this.addMessageEvent(new NavigatorSettingsMessageEvent(this.onNavigatorSettings.bind(this)));
        this.addMessageEvent(new FavouritesMessageEvent(this.onFavourites.bind(this)));
        this.addMessageEvent(new FavouriteChangedMessageEvent(this.onFavouriteChanged.bind(this)));

        // Room info
        this.addMessageEvent(new GetGuestRoomResultMessageEvent(this.onGetGuestRoomResult.bind(this)));
        this.addMessageEvent(new RoomInfoUpdatedMessageEvent(this.onRoomInfoUpdated.bind(this)));

        // Search results
        this.addMessageEvent(new GuestRoomSearchResultMessageEvent(this.onGuestRoomSearchResult.bind(this)));
        this.addMessageEvent(new PopularRoomTagsResultMessageEvent(this.onPopularRoomTagsResult.bind(this)));
        this.addMessageEvent(new OfficialRoomsMessageEvent(this.onOfficialRooms.bind(this)));
        this.addMessageEvent(new CategoriesWithVisitorCountMessageEvent(this.onCategoriesWithVisitorCount.bind(this)));

        // Categories
        this.addMessageEvent(new UserFlatCatsMessageEvent(this.onUserFlatCats.bind(this)));
        this.addMessageEvent(new UserEventCatsMessageEvent(this.onUserEventCats.bind(this)));

        // Room creation
        this.addMessageEvent(new CanCreateRoomMessageEvent(this.onCanCreateRoom.bind(this)));
        this.addMessageEvent(new CanCreateRoomEventMessageEvent(this.onCanCreateRoomEvent.bind(this)));
        this.addMessageEvent(new FlatCreatedMessageEvent(this.onFlatCreated.bind(this)));

        // User data
        this.addMessageEvent(new UserObjectMessageEvent(this.onUserObject.bind(this)));

        // Room events
        this.addMessageEvent(new RoomEventMessageEvent(this.onRoomEvent.bind(this)));
        this.addMessageEvent(new RoomEventCancelMessageEvent(this.onRoomEventCancel.bind(this)));

        // Access
        this.addMessageEvent(new DoorbellMessageEvent(this.onDoorbell.bind(this)));
        this.addMessageEvent(new FlatAccessDeniedMessageEvent(this.onFlatAccessDenied.bind(this)));

        // Misc
        this.addMessageEvent(new ConvertedRoomIdMessageEvent(this.onConvertedRoomId.bind(this)));
        this.addMessageEvent(new CompetitionRoomsDataMessageEvent(this.onCompetitionRoomsData.bind(this)));
    }

    private addMessageEvent(event: IMessageEvent): void
    {
        this._navigator.communication.addMessageEvent(event);

        this._messageEvents.push(event);
    }

    /**
	 * The login landing decision, and the only place that makes it.
	 *
	 * The first settings packet of a session is what decides where you end up: an external
	 * `friend.id` follows a friend, an external `forward.type == 2` forwards to a room,
	 * `roomIdToEnter` re-enters wherever you logged out, and a `roomIdToEnter` equal to the home
	 * room goes through `goToHomeRoom()` instead — which can refuse, and then the navigator opens
	 * so you have somewhere to go. Every later packet takes the `else` branch and only reloads the
	 * room-info panel.
	 *
	 * The port had all of that missing: it recorded `homeRoomId`, set the flag and returned, so a
	 * session never auto-entered anything and the navigator never opened by itself.
	 * `HabboLandingView` covers only the `roomIdToEnter <= 0` half.
	 */
    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onNavigatorSettings()
    private onNavigatorSettings(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as NavigatorSettingsMessageParser;

        if(!parser) return;

        log.debug(`Got navigator settings: ${parser.homeRoomId}`);

        const firstTime = !this.data.settingsReceived;

        this.data.homeRoomId = parser.homeRoomId;
        this.data.settingsReceived = true;

        this._navigator.mainViewCtrl?.refresh();

        let forwardType = -1;
        let forwardId = -1;

        if(firstTime && !isRoomViewerMode(this._navigator.flags))
        {
            let openNavigator = false;

            if(this._navigator.propertyExists('friend.id'))
            {
                forwardType = 0;
                this._navigator.send(
                    new FollowFriendMessageComposer(parseInt(this._navigator.getProperty('friend.id'), 10))
                );
            }

            if(this._navigator.propertyExists('forward.type') && this._navigator.propertyExists('forward.id'))
            {
                forwardType = parseInt(this._navigator.getProperty('forward.type'), 10);
                forwardId = parseInt(this._navigator.getProperty('forward.id'), 10);
            }

            const noRoomToEnter = parser.roomIdToEnter <= 0;

            if(forwardType === 2)
            {
                log.debug(`Guest room forward on enter: ${forwardId}`);
                this.forwardToRoom(forwardId);
            }
            else if(forwardType === -1 && !noRoomToEnter)
            {
                const roomId = parser.roomIdToEnter;

                if(roomId !== this.data.homeRoomId)
                {
                    this._navigator.goToRoom(roomId, true);
                }
                else if(!this._navigator.goToHomeRoom())
                {
                    openNavigator = true;
                }
            }

            if(openNavigator && !(this._navigator.mainViewCtrl?.isOpen() ?? false))
            {
                this._navigator.mainViewCtrl?.onNavigatorToolBarIconClick();
            }
        }
        else
        {
            this._navigator.transitionalNavigator?.roomInfoViewCtrl?.reload();
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onFavourites()
    private onFavourites(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FavouritesMessageParser;

        if(!parser) return;

        this.data.onFavourites(parser.limit, parser.favouriteRoomIds);

        log.trace(`Favourites received: ${parser.favouriteRoomIds.length} rooms`);
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onFavouriteChanged()
    private onFavouriteChanged(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FavouriteChangedMessageParser;

        if(!parser) return;

        this.data.favouriteChanged(parser.flatId, parser.added);

        // The star has to be repainted in two places: the room-info panel and the navigator's own
        // list. AS3 does both here and the port did neither.
        this._navigator.transitionalNavigator?.roomInfoViewCtrl?.reload();
        this._navigator.mainViewCtrl?.refresh();

        log.debug(`Favourite changed: roomId=${parser.flatId}, added=${parser.added}`);
    }

    private onGetGuestRoomResult(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as GetGuestRoomResultMessageParser;

        if(!parser) return;

        if(!parser.data) return;

        // Based on AS3: com.sulake.habbo.navigator.IncomingMessages.onRoomInfo
        if(parser.enterRoom)
        {
            this.data.enteredRoom = parser.data;
            this.data.currentRoomIsStaffPick = parser.staffPick;

            // AS3 suppresses the ad for the room you have just created — `createdFlatId` is set by
            // onFlatCreated() and cleared two lines below, so it only matches on that first entry.
            const isRoomJustCreated = this.data.createdFlatId === parser.data.flatId;

            if(!isRoomJustCreated && parser.data.displayRoomEntryAd)
            {
                this.requestRoomEnterAd();
            }

            this.data.createdFlatId = 0;

            if(this.data.enteredGuestRoom !== null && this.data.enteredGuestRoom.habboGroupId > 0)
            {
                const roomEventInfoCtrl = this._navigator.transitionalNavigator?.roomEventInfoCtrl ?? null;

                if(roomEventInfoCtrl !== null)
                {
                    roomEventInfoCtrl.expanded = false;
                    roomEventInfoCtrl.refresh();
                }
            }

            // The tags the user picked before the room existed, replayed once the session is up.
            const sessionTags = this.data.getAndResetSessionTags();

            if(sessionTags !== null) this._navigator.send(sessionTags.getMsg());
        }
        else if(parser.roomForward)
        {
            if(parser.openingConnection)
            {
                this._navigator.goToRoom(parser.data.flatId, false, '', -1, true);
            }
            else if(parser.data.doorMode === 1 && (!parser.isGroupMember && this._navigator.sessionData?.userName !== parser.data.ownerName))
            {
                this._navigator.transitionalNavigator?.doorbell?.show(parser.data);
            }
            else if(parser.data.doorMode === 2 && (this._navigator.sessionData?.userName !== parser.data.ownerName && !parser.isGroupMember))
            {
                this._navigator.transitionalNavigator?.passwordInput?.show(parser.data);
            }
            else
            {
                if(parser.data.doorMode === 4 &&
					!this._navigator.sessionData?.isAmbassador &&
					!this._navigator.sessionData?.isRealNoob &&
					!this._navigator.sessionData?.isAnyRoomController)
                {
                    return;
                }

                this._navigator.goToRoom(parser.data.flatId, false);
            }
        }
        else
        {
            this.data.enteredRoom = parser.data;
            this.data.currentRoomIsStaffPick = parser.staffPick;

            this._navigator.transitionalNavigator?.roomInfoViewCtrl?.reload();
        }

        log.debug(`Guest room result: ${parser.data.roomName} (${parser.data.flatId}), enterRoom=${parser.enterRoom}, forward=${parser.roomForward}`);
    }

    /**
	 * Open the room-entry ad habblet, if the hotel has it switched on
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_1951.as::requestRoomEnterAd()
    private requestRoomEnterAd(): void
    {
        if(this._navigator.getProperty('roomenterad.habblet.enabled') === 'true')
        {
            HabboWebTools.openRoomEnterAd();
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onRoomInfoUpdated()
    private onRoomInfoUpdated(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomInfoUpdatedMessageParser;

        if(!parser) return;

        log.debug(`Room info updated: ${parser.flatId}`);

        // The message says "this room changed", not what changed: AS3 answers it by asking for
        // the room again. Without that, a settings edit left the navigator showing the old data.
        this._navigator.send(new GetGuestRoomMessageComposer(parser.flatId, false, false));
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onGuestRoomSearchResult()
    private onGuestRoomSearchResult(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as GuestRoomSearchResultMessageParser;

        if(!parser) return;

        this.data.guestRoomSearchResults = parser.data;

        log.debug(`Guest room search results: ${parser.data?.rooms.length ?? 0} rooms`);
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onPopularRoomTagsResult()
    private onPopularRoomTagsResult(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as PopularRoomTagsResultMessageParser;

        if(!parser) return;

        this.data.popularTags = parser.data;

        log.trace(`Popular tags received: ${parser.data?.tags.length ?? 0} tags`);
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onOfficialRooms()
    private onOfficialRooms(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as OfficialRoomsMessageParser;

        if(!parser) return;

        this.data.officialRooms = parser.data;
        this.data.adRoom = parser.adRoom;
        this.data.promotedRooms = parser.promotedRooms;

        log.trace(`Official rooms received: ${parser.data?.entries.length ?? 0} entries`);
    }

    private onCategoriesWithVisitorCount(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as CategoriesWithVisitorCountMessageParser;

        if(!parser) return;

        this.data.categoriesWithVisitorData = parser.data;

        log.trace('Categories with visitor count received');
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onUserFlatCats()
    private onUserFlatCats(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserFlatCatsMessageParser;

        if(!parser) return;

        this.data.categories = parser.nodes;

        log.trace(`User flat categories received: ${parser.nodes.length} categories`);
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onUserEventCats()
    private onUserEventCats(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserEventCatsMessageParser;

        if(!parser) return;

        this.data.eventCategories = parser.eventCategories;

        log.trace(`User event categories received: ${parser.eventCategories.length} categories`);
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onCanCreateRoom()
    private onCanCreateRoom(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as CanCreateRoomMessageParser;

        if(!parser) return;

        log.debug(`Can create room: code=${parser.resultCode}, limit=${parser.roomLimit}`);

        const transitional = this._navigator.transitionalNavigator;

        if(transitional === null) return;

        // Result 0 is "go ahead". Everything else is the room limit, and AS3 tells the user which
        // of two ways depending on whether they already pay for the privilege.
        if(parser.resultCode === 0)
        {
            transitional.roomCreateViewCtrl?.show();

            return;
        }

        this._navigator.registerParameter('navigator.createroom.limitreached', 'limit', `${parser.roomLimit}`);

        const alert = this._navigator.sessionData?.hasVip === true
            ? new SimpleAlertView(transitional, '${navigator.createroom.error}', '${navigator.createroom.limitreached}')
            : new ClubPromoAlertView(
                transitional,
                '${navigator.createroom.error}',
                '${navigator.createroom.limitreached}',
                '${navigator.createroom.vippromo}'
            );

        alert.show();
    }

    private onCanCreateRoomEvent(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as CanCreateRoomEventMessageParser;

        if(!parser) return;

        log.debug(`Can create room event: ${parser.canCreateEvent}, error=${parser.errorCode}`);

        // This is the ANSWER to the click on "create an event": either the form opens or the
        // refusal is shown, and neither happened. The error key is built from the code, so the
        // player is told which rule stopped them.
        if(parser.canCreateEvent)
        {
            this._navigator.roomEventViewCtrl?.show();

            return;
        }

        const transitional = this._navigator.transitionalNavigator;

        if(transitional === null) return;

        new SimpleAlertView(
            transitional,
            '${navigator.cannotcreateevent.title}',
            `\${navigator.cannotcreateevent.error.${parser.errorCode}}`
        ).show();
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onFlatCreated()
    private onFlatCreated(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FlatCreatedMessageParser;

        if(!parser) return;

        this.data.createdFlatId = parser.flatId;

        log.info(`Flat created: ${parser.flatName} (${parser.flatId})`);

        // AS3 does three more things here, and this port did none of them, so creating a room
        // recorded the id and left the create-room view sitting open on screen: it walks you into
        // the new room, refreshes "my rooms" (category 5) so it is listed, and returns the navigator
        // to its main view — which is what actually takes the creation form down.
        this._navigator.goToRoom(parser.flatId, true);
        // AS3 has two handlers for this message — `_SafeCls_1951` on the legacy window and
        // `_SafeCls_2208` on the new navigator — and both refresh their own controller. This port
        // merged them into one class, so it has to reach both: `mainViewCtrl` is the legacy
        // window, `transitionalNavigator.mainViewCtrl` the `FakeMainViewCtrl` that forwards to the
        // new navigator. Same pairing at `onRoomSettingsSaved()`.
        this._navigator.mainViewCtrl?.reloadRoomList(5);
        this._navigator.transitionalNavigator?.mainViewCtrl?.reloadRoomList(5);
        this._navigator.goToMainView();
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onUserObject()
    private onUserObject(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserObjectMessageParser;

        if(!parser) return;

        this.data.avatarId = parser.id;
        this._navigator.send(new GetUserFlatCatsMessageComposer());
        this._navigator.send(new GetUserEventCatsMessageComposer());
    }

    private onRoomEvent(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomEventMessageParser;

        if(!parser) return;

        this.data.roomEventData = parser.data;

        log.debug(`Room event: ${parser.data?.eventName}`);
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onRoomEventCancel()
    private onRoomEventCancel(_event: IMessageEvent): void
    {
        this.data.roomEventData = null;

        log.debug('Room event cancelled');
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onDoorbell()
    private onDoorbell(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as DoorbellMessageParser;

        if(!parser) return;

        log.debug(`Doorbell: ${parser.userName}`);

        // An empty name means the bell is YOURS: you rang and are waiting outside. A name means
        // someone else rang a room you have rights over, which the room-side doorbell widget
        // handles — hence AS3's early return, kept.
        if(parser.userName !== '') return;

        this._navigator.doorbell?.showWaiting();
    }

    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onFlatAccessDenied()
    private onFlatAccessDenied(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FlatAccessDeniedMessageParser;

        if(!parser) return;

        log.debug(`Flat access denied: roomId=${parser.flatId}, user=${parser.userName}`);

        // Same rule as the bell itself: no name means it was your own ring that went unanswered,
        // and the waiting dialog has to say so rather than hang there.
        if(parser.userName === null || parser.userName === '')
        {
            this._navigator.doorbell?.showNoAnswer();
        }
    }

    /**
	 * The answer to "what is this old global room id now?", and both of its uses are terminal:
	 * the site asked to REPORT that room, or the user followed a link INTO it. The port parsed the
	 * reply, logged it and stopped — so a room link carrying a global id entered nothing, and a
	 * report started from the website never reached the CFH. Every piece it needed was already
	 * here: `webRoomReport`, `webRoomReportedName`, `habboHelp.reportRoom()` and the
	 * `forwardToRoom()` two other handlers already call.
	 */
    // AS3: .../src/com/sulake/habbo/navigator/_SafeCls_1951.as::onConvertedRoomId()
    private onConvertedRoomId(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as ConvertedRoomIdMessageParser;

        if(!parser) return;

        if(this._navigator.webRoomReport)
        {
            this._navigator.habboHelp?.reportRoom(parser.convertedId, this._navigator.webRoomReportedName ?? '', '');

            return;
        }

        log.debug(`Got converted room ID for ${parser.globalId}, forward to room ${parser.convertedId}`);
        this.forwardToRoom(parser.convertedId);
    }

    private onCompetitionRoomsData(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as CompetitionRoomsDataMessageParser;

        if(!parser) return;

        this.data.competitionRoomsData = parser.data;

        log.debug(`Competition rooms data: goal=${parser.data?.goalId}, page=${parser.data?.pageIndex}`);
    }

    /**
     * The room-settings replies all land on the same controller, which this port hangs off
     * the transitional navigator rather than off HabboNavigator as AS3 does.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_1951.as::onRoomSettingsData()
    private onRoomSettingsData(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomSettingsDataEventParser;
        const data = parser?.data ?? null;

        if(data === null) return;

        this._navigator.transitionalNavigator?.roomSettingsCtrl?.onRoomSettings(data);
    }

    // AS3: .../_SafeCls_1951.as::onRoomSettingsSaveError()
    private onRoomSettingsSaveError(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomSettingsSaveErrorEventParser;

        if(!parser) return;

        this._navigator.transitionalNavigator?.roomSettingsCtrl?.onRoomSettingsSaveError(
            parser.roomId, parser.errorCode, parser.info
        );
    }

    // AS3: .../_SafeCls_1951.as::onFlatControllers()
    private onFlatControllers(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FlatControllersEventParser;

        if(!parser) return;

        this._navigator.transitionalNavigator?.roomSettingsCtrl?.onFlatControllers(parser.roomId, parser.controllers);
    }

    // AS3: .../_SafeCls_1951.as::onFlatControllerAdded()
    private onFlatControllerAdded(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FlatControllerAddedEventParser;
        const data = parser?.data ?? null;

        if(data === null) return;

        this._navigator.transitionalNavigator?.roomSettingsCtrl?.onFlatControllerAdded(parser.flatId, data);
    }

    // AS3: .../_SafeCls_1951.as::onFlatControllerRemoved()
    private onFlatControllerRemoved(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FlatControllerRemovedEventParser;

        if(!parser) return;

        this._navigator.transitionalNavigator?.roomSettingsCtrl?.onFlatControllerRemoved(parser.flatId, parser.userId);
    }

    // AS3: .../_SafeCls_1951.as::onBannedUsersFromRoom()
    private onBannedUsersFromRoom(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as BannedUsersFromRoomEventParser;

        if(!parser) return;

        this._navigator.transitionalNavigator?.roomSettingsCtrl?.onBannedUsersFromRoom(parser.roomId, parser.bannedUsers);
    }

    // AS3: .../_SafeCls_1951.as::onUserUnbannedFromRoom()
    private onUserUnbannedFromRoom(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserUnbannedFromRoomEventParser;

        if(!parser) return;

        this._navigator.transitionalNavigator?.roomSettingsCtrl?.onUserUnbannedFromRoom(parser.roomId, parser.userId);
    }

    /** AS3 passes the entered room's id, not the selection type the parser carries. */
    // AS3: .../_SafeCls_1951.as::onEnforceRoomCategorySelection()
    private onEnforceRoomCategorySelection(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as ShowEnforceRoomCategoryDialogEventParser;

        if(!parser) return;

        this._navigator.transitionalNavigator?.enforceCategoryCtrl?.show(
            this.data.enteredGuestRoom?.flatId ?? 0
        );
    }

    /**
     * Entering a room closes everything the navigator had open over it, then asks for the
     * room's own data - the reply is what fills the room-info card.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_1951.as::onRoomEnter()
    private onRoomEnter(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomEntryInfoMessageParser;

        if(!parser) return;

        log.debug('Navigator: entering room');

        this.data.onRoomEnter(parser);
        this.closeOpenCantConnectAlerts();

        const transitional = this._navigator.transitionalNavigator;

        transitional?.roomInfoViewCtrl?.close();
        this._navigator.send(new GetGuestRoomMessageComposer(parser.guestRoomId, true, false));
        transitional?.roomEventInfoCtrl?.refresh();
        transitional?.roomEventViewCtrl?.close();
        transitional?.roomSettingsCtrl?.close();
        transitional?.roomFilterCtrl?.close();

        HabboWebTools.closeNews();
    }

    // AS3: .../_SafeCls_1951.as::onRoomExit()
    private onRoomExit(_event: IMessageEvent): void
    {
        log.debug('Navigator: exiting room');

        this.data.onRoomExit();

        const transitional = this._navigator.transitionalNavigator;

        transitional?.roomInfoViewCtrl?.close();
        transitional?.roomEventInfoCtrl?.close();
        transitional?.roomEventViewCtrl?.close();
        transitional?.roomSettingsCtrl?.close();
        transitional?.roomFilterCtrl?.close();

        if(this._navigator.getBoolean('news.auto_popup.enabled')) HabboWebTools.openNews();
    }

    /**
     * The reason is read one lower than it is sent - AS3 switches on `reason - 1` - so 1 is
     * "room full", 3 a queue error, 4 banned and 5 blocked. Whatever the reason, the player
     * quits the queue and is sent back to reception.
     */
    // AS3: .../_SafeCls_1951.as::onCantConnect()
    private onCantConnect(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as CantConnectMessageParser;

        if(!parser) return;

        log.warn(`FAILED TO CONNECT: REASON: ${parser.reason}`);

        const transitional = this._navigator.transitionalNavigator;

        if(transitional !== null)
        {
            let caption = '${room.queue.error.title}';
            let text = '${room.queue.error.title}';

            switch(parser.reason - 1)
            {
                case 0:
                    caption = '${navigator.guestroomfull.title}';
                    text = '${navigator.guestroomfull.text}';
                    break;
                case 2:
                    caption = '${room.queue.error.title}';
                    text = `\${room.queue.error.${parser.parameter}}`;
                    break;
                case 3:
                    caption = '${navigator.banned.title}';
                    text = '${navigator.banned.text}';
                    break;
                case 4:
                    caption = '${navigator.blocked.title}';
                    text = '${navigator.blocked.text}';
                    break;
            }

            new SimpleAlertView(transitional, caption, text).show();
        }

        this._navigator.send(new QuitMessageComposer());

        const toolbarEvent = new HabboToolbarEvent(HabboToolbarEvent.TOOLBAR_CLICK);

        toolbarEvent.iconId = 'HTIE_ICON_RECEPTION';
        this._navigator.transitionalNavigator?.toolbar?.toolbarEvents.emit(HabboToolbarEvent.TOOLBAR_CLICK, toolbarEvent);
    }

    // AS3: .../_SafeCls_1951.as::onRoomForward()
    private onRoomForward(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomForwardMessageParser;

        if(!parser) return;

        log.debug(`Got room forward: ${parser.roomId}`);
        this.forwardToRoom(parser.roomId);
    }

    // AS3: .../_SafeCls_1951.as::forwardToRoom()
    private forwardToRoom(roomId: number): void
    {
        this._navigator.send(new GetGuestRoomMessageComposer(roomId, false, true));
        this._navigator.trackNavigationDataPoint('Room Forward', 'go.roomforward', '', roomId);
    }

    /** Only these six codes are handled; anything else falls through silently, as in AS3. */
    // DEVIATION: AS3 also alerts `${notification.nft_token_required}` on -100005 (an NFT-gated
    //   room); the RPG fork removed NFT.
    // AS3: .../_SafeCls_1951.as::onError()
    private onError(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as GenericErrorMessageParser;

        if(!parser) return;

        const alert = (key: string): void =>
        {
            this._navigator.transitionalNavigator?.windowManager?.alert('${generic.alert.title}', key, 0, (dialog: IDisposable) => dialog.dispose());
        };

        switch(parser.errorCode)
        {
            case -100002:
                this._navigator.transitionalNavigator?.passwordInput?.showRetry();
                break;
            case 4009:
                alert('${navigator.alert.need.to.be.vip}');
                break;
            case 4010:
                alert('${navigator.alert.invalid_room_name}');
                break;
            case 4011:
                alert('${navigator.alert.cannot_perm_ban}');
                break;
            case 4013:
                alert('${navigator.alert.room_in_maintenance}');
                break;
        }
    }

    // AS3: .../_SafeCls_1951.as::onUserRights()
    private onUserRights(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserRightsMessageParser;

        if(!parser) return;

        if(parser.securityLevel >= 5) this.data.eventMod = true;
        if(parser.securityLevel >= 7) this.data.roomPicker = true;
    }

    // AS3: .../_SafeCls_1951.as::onSubscriptionInfo()
    private onSubscriptionInfo(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as ScrSendUserInfoMessageParser;

        if(!parser) return;

        this.data.hcMember = parser.daysToPeriodEnd > 0;
    }

    // AS3: .../_SafeCls_1951.as::onRoomSettingsSaved()
    private onRoomSettingsSaved(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomSettingsSavedEventParser;

        if(!parser) return;

        log.debug(`Room settings saved: ${parser.roomId}`);
        this._navigator.mainViewCtrl?.reloadRoomList(5);
        this._navigator.transitionalNavigator?.mainViewCtrl?.reloadRoomList(5);
    }

    // AS3: .../_SafeCls_1951.as::onFriendsListFragment()
    private onFriendsListFragment(event: IMessageEvent): void
    {
        if(!event) return;

        this.data.friendList.onFriendsListFragment(event);
    }

    // AS3: .../_SafeCls_1951.as::onFriendListUpdate()
    private onFriendListUpdate(event: IMessageEvent): void
    {
        if(!event) return;

        this.data.friendList.onFriendListUpdate(event);
        this._navigator.transitionalNavigator?.roomSettingsCtrl?.onFriendListUpdate();
    }

    /**
     * Alerts opened by `onCantConnect()` are found by their `SimpleAlertView` tag on the
     * layer-2 desktop, since nothing keeps a reference to them once shown.
     */
    // AS3: .../_SafeCls_1951.as::closeOpenCantConnectAlerts()
    private closeOpenCantConnectAlerts(): void
    {
        const desktop = (this._navigator.transitionalNavigator?.windowManager?.getWindowContext(2)?.getDesktopWindow() ?? null) as IWindowContainer | null;

        if(desktop === null || desktop === undefined) return;

        const found: IWindow[] = [];

        for(let index = 0; index < desktop.numChildren; index++)
        {
            const child = desktop.getChildAt(index);

            if(child !== null && child !== undefined && child.tags.indexOf('SimpleAlertView') > -1) found.push(child);
        }

        for(const window of found)
        {
            AlertView.findAlertView(window)?.dispose();
        }
    }

    /** An empty user name means the doorbell has nothing left to show. */
    // AS3: .../_SafeCls_1951.as::onDoorOpened()
    private onDoorOpened(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FlatAccessibleMessageParser;

        if(!parser) return;

        if(parser.userName === null || parser.userName.length === 0)
        {
            this._navigator.transitionalNavigator?.doorbell?.hide();
        }
    }

    // DEVIATION: AS3 also closes both navigators when a snow-war game starts (header 2902); the RPG
    //   fork removed Snow War, so that message is neither registered nor subscribed.
    // AS3: .../_SafeCls_1951.as::onGameStarted()

    /** Redraws the room-info buttons so the mute-all button flips with the new state. */
    // AS3: .../_SafeCls_1951.as::onMuteAllEvent()
    private onMuteAllEvent(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomMuteAllMessageEventParser;
        const roomData = this.data.enteredGuestRoom;

        if(!parser || roomData === null) return;

        roomData.allInRoomMuted = parser.allMuted;

        const roomInfoViewCtrl = this._navigator.transitionalNavigator?.roomInfoViewCtrl ?? null;

        if(roomInfoViewCtrl !== null) roomInfoViewCtrl.refreshButtons(roomData);
    }

    // AS3: .../_SafeCls_1951.as::onNoOwnedRoomsAlert()
    private onNoOwnedRoomsAlert(_event: IMessageEvent): void
    {
        this._navigator.startRoomCreation();
    }

    /** AS3's handler body is empty; the flat id is parsed and dropped. */
    // AS3: .../_SafeCls_1951.as::onNoSuchFlat()
    private onNoSuchFlat(_event: IMessageEvent): void
    {
    }

    /**
	 * AS3 forwards the parsed payload straight to the navigator and does nothing else — the cache
	 * and the view notification both live in `HabboNewNavigator.onGroupDetails()`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_2208.as::onGroupDetails()
    private onGroupDetails(event: IMessageEvent): void
    {
        const parser = event.parser as HabboGroupDetailsMessageParser | null;
        const data = parser?.data ?? null;

        if(data === null) return;

        this._navigator.newNavigator?.onGroupDetails(data);
    }

    // AS3: .../_SafeCls_1951.as::onRoomFilterSettings()
    private onRoomFilterSettings(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomFilterSettingsMessageEventParser;

        if(!parser) return;

        this._navigator.transitionalNavigator?.roomFilterCtrl?.onRoomFilterSettings(parser.badWords);
        log.debug(`GOT ROOM FILTER SETTINGS: ${parser.badWords}`);
    }

    /** AS3 reads the parser into a local and does nothing with it. */
    // AS3: .../_SafeCls_1951.as::onRoomSettingsError()
    private onRoomSettingsError(_event: IMessageEvent): void
    {
    }
}
