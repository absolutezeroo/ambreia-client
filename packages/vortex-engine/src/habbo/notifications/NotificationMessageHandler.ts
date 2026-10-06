import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {HabboNotifications} from './HabboNotifications';
import {MOTDNotification} from './singular/MOTDNotification';
import {Logger} from '@core/utils/Logger';

// Existing message events
import {
    MaintenanceStatusMessageEvent
} from '@habbo/communication/messages/incoming/availability/MaintenanceStatusMessageEvent';
import {
    LoginFailedHotelClosedMessageEvent
} from '@habbo/communication/messages/incoming/availability/LoginFailedHotelClosedMessageEvent';
import {
    InfoFeedEnableMessageEvent
} from '@habbo/communication/messages/incoming/notifications/InfoFeedEnableMessageEvent';
import {
    OpenConnectionMessageEvent
} from '@habbo/communication/messages/incoming/room/session/OpenConnectionMessageEvent';
import {RoomEntryInfoMessageEvent} from '@habbo/communication/messages/incoming/room/engine/RoomEntryInfoMessageEvent';
import {
    RecyclerFinishedMessageEvent
} from '@habbo/communication/messages/incoming/catalog/RecyclerFinishedMessageEvent';
import {
    UserPurchasableChatStyleChangedMessageEvent
} from '@habbo/communication/messages/incoming/users/UserPurchasableChatStyleChangedMessageEvent';
import type {
    RecyclerFinishedMessageEventParser
} from '@habbo/communication/messages/parser/catalog/RecyclerFinishedMessageEventParser';
import type {
    UserPurchasableChatStyleChangedMessageParser
} from '@habbo/communication/messages/parser/users/UserPurchasableChatStyleChangedMessageParser';

// Existing parsers
import type {
    MaintenanceStatusMessageEventParser
} from '@habbo/communication/messages/parser/availability/MaintenanceStatusMessageEventParser';
import type {
    InfoFeedEnableMessageParser
} from '@habbo/communication/messages/parser/notifications/InfoFeedEnableMessageParser';
import type {
    HabboBroadcastMessageEventParser,
    InfoHotelClosedMessageEventParser,
    InfoHotelClosingMessageEventParser,
    LoginFailedHotelClosedMessageEventParser,
    MOTDNotificationEventParser,
    NotificationDialogMessageEventParser,
    PetLevelNotificationEventParser,
    PetReceivedMessageEventParser,
    PetRespectFailedEventParser,
    RoomMessageNotificationMessageEventParser} from "@habbo/communication";
import {
    HabboAchievementNotificationMessageEvent,
    HabboActivityPointNotificationMessageEvent,
    HabboBroadcastMessageEvent,
    InfoHotelClosedMessageEvent,
    InfoHotelClosingMessageEvent,
    MOTDNotificationEvent,
    NotificationDialogMessageEvent,
    PetLevelNotificationEvent,
    PetReceivedMessageEvent,
    PetRespectFailedEvent,
    RoomMessageNotificationMessageEvent
} from "@habbo/communication";
import {ActivityPointTypeEnum} from '@habbo/catalog/purse/ActivityPointTypeEnum';

// Moderation / safety-lock / club-gift events. These all live under
// `incoming/notifications/` in this port, not under the `moderation/`, `users/` and
// `catalog/` paths the AS3 package tree uses.
import {
    ModeratorMessageEvent
} from '@habbo/communication/messages/incoming/notifications/ModeratorMessageEvent';
import {
    ModeratorCautionEvent
} from '@habbo/communication/messages/incoming/notifications/ModeratorCautionEvent';
import {
    UserBannedMessageEvent
} from '@habbo/communication/messages/incoming/notifications/UserBannedMessageEvent';
import {
    RespectNotificationMessageEvent
} from '@habbo/communication/messages/incoming/notifications/RespectNotificationMessageEvent';
import {
    ClubGiftNotificationEvent
} from '@habbo/communication/messages/incoming/notifications/ClubGiftNotificationEvent';
import {
    ClubGiftSelectedEvent
} from '@habbo/communication/messages/incoming/notifications/ClubGiftSelectedEvent';
import {
    AccountSafetyLockStatusChangeMessageEvent
} from '@habbo/communication/messages/incoming/notifications/AccountSafetyLockStatusChangeMessageEvent';
import {
    RestoreClientMessageEvent
} from '@habbo/communication/messages/incoming/notifications/RestoreClientMessageEvent';
import {UserObjectMessageEvent} from '@habbo/communication/messages/incoming/handshake/UserObjectMessageEvent';
import {
    BadgeReceivedEvent
} from '@habbo/communication/messages/incoming/inventory/badges/BadgeReceivedEvent';
import type {
    BadgeReceivedEventParser
} from '@habbo/communication/messages/parser/inventory/badges/BadgeReceivedEventParser';
import {NotificationType} from './NotificationType';

import type {
    ModeratorMessageEventParser
} from '@habbo/communication/messages/parser/notifications/ModeratorMessageEventParser';
import type {
    ModeratorCautionEventParser
} from '@habbo/communication/messages/parser/notifications/ModeratorCautionEventParser';
import type {
    UserBannedMessageEventParser
} from '@habbo/communication/messages/parser/notifications/UserBannedMessageEventParser';
import type {
    RespectNotificationMessageEventParser
} from '@habbo/communication/messages/parser/notifications/RespectNotificationMessageEventParser';
import type {
    ClubGiftNotificationEventParser
} from '@habbo/communication/messages/parser/notifications/ClubGiftNotificationEventParser';
import type {
    ClubGiftSelectedEventParser
} from '@habbo/communication/messages/parser/notifications/ClubGiftSelectedEventParser';
import type {
    AccountSafetyLockStatusChangeMessageEventParser
} from '@habbo/communication/messages/parser/notifications/AccountSafetyLockStatusChangeMessageEventParser';
import type {
    UserObjectMessageParser
} from '@habbo/communication/messages/parser/handshake/UserObjectMessageParser';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import {HabboFaceFocuser} from '@habbo/utils/HabboFaceFocuser';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import {BanInfoMessageEvent} from '@habbo/communication/messages/incoming/moderation/BanInfoMessageEvent';
import type {
    BanInfoMessageEventParser
} from '@habbo/communication/messages/parser/moderation/BanInfoMessageEventParser';
import {
    TreasureHuntUpdateMessageEvent
} from '@habbo/communication/messages/incoming/campaign/treasurehunt/TreasureHuntUpdateMessageEvent';
import {
    TreasureHuntFailMessageEvent
} from '@habbo/communication/messages/incoming/campaign/treasurehunt/TreasureHuntFailMessageEvent';
import {
    TreasureHuntFirstWinnerMessageEvent
} from '@habbo/communication/messages/incoming/campaign/treasurehunt/TreasureHuntFirstWinnerMessageEvent';
import type {
    TreasureHuntUpdateMessageEventParser
} from '@habbo/communication/messages/parser/campaign/treasurehunt/TreasureHuntUpdateMessageEventParser';
import type {
    TreasureHuntFailMessageEventParser
} from '@habbo/communication/messages/parser/campaign/treasurehunt/TreasureHuntFailMessageEventParser';
import type {
    TreasureHuntFirstWinnerMessageEventParser
} from '@habbo/communication/messages/parser/campaign/treasurehunt/TreasureHuntFirstWinnerMessageEventParser';
import {
    ClaimProductResultMessageEvent
} from '@habbo/communication/messages/incoming/notifications/ClaimProductResultMessageEvent';
import type {
    ClaimProductResultMessageParser
} from '@habbo/communication/messages/parser/notifications/ClaimProductResultMessageParser';
import type {
    TreasureHuntWinnerInfo
} from '@habbo/communication/messages/parser/campaign/treasurehunt/TreasureHuntWinnerInfo';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {imageElementToBitmap} from '@core/utils/BitmapSlot';
import type {
    HabboAchievementNotificationMessageEventParser
} from '@habbo/communication/messages/parser/notifications/HabboAchievementNotificationMessageEventParser';

const log = Logger.getLogger('habbo.notifications.NotificationMessageHandler');

/**
 * Notification message handler hub.
 * Listens to incoming message events and routes them to the appropriate
 * notification display methods (alert dialogs, bubble notifications, feed items).
 *
 * This is the obfuscated class_3353 in the AS3 source. It registers all
 * notification-related message event handlers and processes them.
 *
 * @see source_as_win63/habbo/notifications/class_3353.as
 */
export class NotificationMessageHandler implements IAvatarImageListener
{
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::CALL_FOR_HELP_NOTIFICATION_TYPE
    private static readonly CALL_FOR_HELP_NOTIFICATION_TYPE: string = 'cfh.created';

    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::_notifications
    private _notifications: HabboNotifications | null;

    // AS3 lets each MOTD packet build a fresh dialog and drops the previous one on the floor; the
    // reference is kept here so the old window is actually disposed instead of leaking.
    // TS-only: AS3 keeps no field for it.
    private _motdNotification: MOTDNotification | null = null;
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::_communication
    private _communication: IHabboCommunicationManager | null;
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];

    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::_bufferedTreasureHuntWinnerInfo
    private _bufferedTreasureHuntWinnerInfo: TreasureHuntWinnerInfo | null = null;

    constructor(notifications: HabboNotifications, communication: IHabboCommunicationManager)
    {
        this._notifications = notifications;
        this._communication = communication;

        this.registerMessageEvents();

        // Activate the notifications component after handlers are set up
        this._notifications.activate();
    }

    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::dispose()
    dispose(): void
    {
        if(this._messageEvents != null && this._communication != null)
        {
            for(const event of this._messageEvents)
            {
                this._communication.removeMessageEvent(event);
            }
        }

        this._messageEvents = [];
        this._notifications = null;
        this._communication = null;
    }

    /**
	 * Handle room messages notification
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onRoomMessagesNotification()
	 */
    /**
	 * "N messages were posted in <room>" — the toast that told you your room had visitors while
	 * you were away. It was parsed and dropped on the floor.
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onRoomMessagesNotification()
    private onRoomMessagesNotification(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as RoomMessageNotificationMessageEvent).parser as RoomMessageNotificationMessageEventParser | null;
        const localization = this._notifications?.localizationManager;
        const singularController = this._notifications?.singularController;

        if(!parser || localization == null || singularController == null) return;

        const message = localization.getLocalizationWithParamMap(
            'notifications.text.room.messages.posted',
            '',
            new Map<string, string>([
                ['room_name', parser.roomName],
                ['messages_count', String(parser.messageCount)]
            ])
        );

        singularController.addItem(message, 'roommessagesposted', null);
    }

    /**
	 * The "you received a badge" toast. Separate from, and independent of, the inventory-side
	 * handler of the same message (HabboInventory.onBadgeReceived, which updates BadgesModel):
	 * AS3 registers the same event twice, in two different classes.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onBadgeReceived()
    private onBadgeReceived(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as BadgeReceivedEvent).parser as BadgeReceivedEventParser | null;
        const localization = this._notifications?.localizationManager;
        const singularController = this._notifications?.singularController;

        if(parser == null || localization == null || singularController == null) return;

        const badgeName = localization.getBadgeName(parser.badgeCode);
        // AS3 calls registerParameter() then getLocalization(); getLocalizationWithParamMap() is
        // this port's single-call form of exactly that pair.
        const message = localization.getLocalizationWithParamMap(
            'notification.new.badge',
            '',
            new Map<string, string>([['badge_name', badgeName]])
        );

        // `requestBadgeImage()` is both the request and the answer: it returns the image if the
        // library already has it and null while the load it just started is in flight. The two
        // representations the port keeps — `HTMLImageElement` here, `ImageBitmap` on the item —
        // are bridged by `imageElementToBitmap()`, which returns null for an image that has not
        // finished loading, i.e. exactly the null AS3 would have passed at that moment.
        // `badgeCode` still travels on param5, so a late arrival is still resolvable from it.
        const badgeImage = this._notifications?.sessionDataManager?.requestBadgeImage(parser.badgeCode) ?? null;

        singularController.addItem(
            message,
            NotificationType.BADGE_RECEIVED,
            imageElementToBitmap(badgeImage),
            null,
            parser.badgeCode,
            'inventory/open/badges'
        );
    }

    /**
	 * Register all message event listeners
	 */
    private registerMessageEvents(): void
    {
        // === Currently available events ===

        // Maintenance status
        this.addMessageEvent(new MaintenanceStatusMessageEvent(this.onHotelMaintenance.bind(this)));

        // Login failed - hotel closed
        this.addMessageEvent(new LoginFailedHotelClosedMessageEvent(this.onLoginFailedHotelClosed.bind(this)));

        // Info feed enable/disable
        this.addMessageEvent(new InfoFeedEnableMessageEvent(this.onInfoFeedEnable.bind(this)));

        // Room enter events (for moderation disclaimer)
        this.addMessageEvent(new OpenConnectionMessageEvent(this.onRoomEnter.bind(this)));
        this.addMessageEvent(new RoomEntryInfoMessageEvent(this.onRoomEnter.bind(this)));

        this.addMessageEvent(new ModeratorMessageEvent(this.onModMessageEvent.bind(this)));
        this.addMessageEvent(new ModeratorCautionEvent(this.onModCautionEvent.bind(this)));
        this.addMessageEvent(new UserBannedMessageEvent(this.onUserBannedMessageEvent.bind(this)));
        this.addMessageEvent(new RespectNotificationMessageEvent(this.onRespectNotification.bind(this)));
        this.addMessageEvent(new UserObjectMessageEvent(this.onUserObject.bind(this)));
        this.addMessageEvent(new MOTDNotificationEvent(this.onMOTD.bind(this)));
        this.addMessageEvent(new HabboBroadcastMessageEvent(this.onBroadcastMessageEvent.bind(this)));
        this.addMessageEvent(new HabboActivityPointNotificationMessageEvent(this.onActivityPointNotification.bind(this)));
        this.addMessageEvent(new NotificationDialogMessageEvent(this.onNotificationDialogMessageEvent.bind(this)));
        this.addMessageEvent(new ClubGiftNotificationEvent(this.onClubGiftNotification.bind(this)));
        this.addMessageEvent(new ClubGiftSelectedEvent(this.onClubGiftSelected.bind(this)));
        this.addMessageEvent(new HabboAchievementNotificationMessageEvent(this.onLevelUp.bind(this)));
        this.addMessageEvent(new PetLevelNotificationEvent(this.onPetLevelNotification.bind(this)));
        this.addMessageEvent(new PetReceivedMessageEvent(this.onPetReceived.bind(this)));
        this.addMessageEvent(new PetRespectFailedEvent(this.onPetRespectFailed.bind(this)));
        this.addMessageEvent(new InfoHotelClosingMessageEvent(this.onHotelClosing.bind(this)));
        this.addMessageEvent(new InfoHotelClosedMessageEvent(this.onHotelClosed.bind(this)));
        this.addMessageEvent(new RestoreClientMessageEvent(this.onRestoreClientMessageEvent.bind(this)));
        this.addMessageEvent(new AccountSafetyLockStatusChangeMessageEvent(this.onAccountSafetyLockStatusChanged.bind(this)));
        this.addMessageEvent(new RoomMessageNotificationMessageEvent(this.onRoomMessagesNotification.bind(this)));
        this.addMessageEvent(new BadgeReceivedEvent(this.onBadgeReceived.bind(this)));
        this.addMessageEvent(new RecyclerFinishedMessageEvent(this.onRecyclerFinished.bind(this)));
        this.addMessageEvent(new UserPurchasableChatStyleChangedMessageEvent(this.onChatStyleNotification.bind(this)));
        // AS3: _SafeCls_1951.as:130
        this.addMessageEvent(new BanInfoMessageEvent(this.onBanInfoMessageEvent.bind(this)));
        // AS3: _SafeCls_1951.as:118, 132, 147 — the treasure-hunt chain.
        this.addMessageEvent(new TreasureHuntUpdateMessageEvent(this.onTreasureHuntUpdate.bind(this)));
        this.addMessageEvent(new TreasureHuntFailMessageEvent(this.onTreasureHuntFail.bind(this)));
        this.addMessageEvent(new TreasureHuntFirstWinnerMessageEvent(this.onTreasureHuntFirstWinner.bind(this)));
        this.addMessageEvent(new ClaimProductResultMessageEvent(this.onClaimProductResult.bind(this)));

        log.debug('Notification message handlers registered');
    }

    // === Handler methods for currently available events ===

    /**
	 * Register a message event with the communication manager and track it for cleanup
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::addMessageEvent()
    private addMessageEvent(event: IMessageEvent): void
    {
        if(this._communication)
        {
            this._communication.addMessageEvent(event);
            this._messageEvents.push(event);
        }
    }

    /**
	 * Whether the notification *feed* is enabled by hotel configuration.
	 * AS3 gates every feed-item write behind this.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::useNotificationFeed()
    private useNotificationFeed(): boolean
    {
        return this._notifications?.getBoolean('notification.feed.enabled') ?? false;
    }

    /**
	 * Whether singular notification bubbles/dialogs are enabled by hotel configuration.
	 * AS3 gates the moderator alert dialogs behind this.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::useNotifications()
    private useNotifications(): boolean
    {
        return this._notifications?.getBoolean('notification.items.enabled') ?? false;
    }

    /**
	 * Handle hotel maintenance status message
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onHotelMaintenance()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onHotelMaintenance()
    private onHotelMaintenance(event: IMessageEvent): void
    {
        const parser = event.parser as MaintenanceStatusMessageEventParser;

        if(parser == null || this._notifications?.singularController?.alertDialogManager == null)
        {
            return;
        }

        this._notifications.singularController.alertDialogManager.handleHotelMaintenanceMessage(
            parser.minutesUntilMaintenance,
            parser.duration
        );
    }

    /**
	 * Handle login failed because hotel is closed
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onLoginFailedHotelClosed()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onLoginFailedHotelClosed()
    private onLoginFailedHotelClosed(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as LoginFailedHotelClosedMessageEventParser;

        if(parser == null || this._notifications?.singularController?.alertDialogManager == null) return;

        this._notifications.singularController.alertDialogManager.handleLoginFailedHotelClosedMessage(parser.openHour, parser.openMinute);

        log.debug('Login failed - hotel closed');
    }

    /**
	 * Handle info feed enable/disable
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onInfoFeedEnable()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onInfoFeedEnable()
    private onInfoFeedEnable(event: IMessageEvent): void
    {
        const parser = event.parser as InfoFeedEnableMessageParser;

        if(parser != null && this._notifications)
        {
            this._notifications.disabled = !parser.enabled;
        }
    }

    /**
	 * Handle moderator message event.
	 *
	 * The alert dialog is gated on `useNotifications()` and the feed item on
	 * `useNotificationFeed()` — two separate switches in AS3, not one.
	 *
	 * AS3's `useNotificationFeed()` branch calls
	 * `feedController.addFeedItem(3, GenericNotificationItemData{...})`, and that branch is dead in
	 * the original client: `HabboNotifications.as` declares `_SafeStr_6523`, the field behind
	 * `get feedController()`, and never assigns it anywhere — so the call would throw on a null
	 * reference the moment `notification.feed.enabled` was switched on. The dialog half below is
	 * the live one, and it is faithful.
	 *
	 * This port has no feed controller either (`habbo/notifications/feed/` holds only
	 * `FeedSettings`/`StateController`/`data`), which turns out to cost nothing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onModMessageEvent()
    private onModMessageEvent(event: IMessageEvent): void
    {
        const parser = (event as ModeratorMessageEvent).parser as ModeratorMessageEventParser;

        if(parser == null || this._notifications?.singularController?.alertDialogManager == null) return;

        if(this.useNotifications())
        {
            this._notifications.singularController.alertDialogManager.handleModeratorMessage(parser.message, parser.url);
        }
    }

    /**
	 * Handle moderator caution event.
	 *
	 * Same dead `feedController.addFeedItem(3, ...)` branch as
	 * onModMessageEvent() above.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onModCautionEvent()
    private onModCautionEvent(event: IMessageEvent): void
    {
        const parser = (event as ModeratorCautionEvent).parser as ModeratorCautionEventParser;

        if(parser == null || this._notifications?.singularController?.alertDialogManager == null) return;

        if(this.useNotifications())
        {
            this._notifications.singularController.alertDialogManager.handleModeratorCaution(parser.message, parser.url);
        }
    }

    /**
	 * Handle user banned message.
	 *
	 * Note this one is NOT gated on useNotifications() in AS3 — a ban dialog always shows.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onUserBannedMessageEvent()
    private onUserBannedMessageEvent(event: IMessageEvent): void
    {
        const parser = (event as UserBannedMessageEvent).parser as UserBannedMessageEventParser;

        if(parser == null || this._notifications?.singularController?.alertDialogManager == null) return;

        this._notifications.singularController.alertDialogManager.handleUserBannedMessage(parser.message);
    }

    /**
	 * Handle respect notification.
	 *
	 * The message is broadcast for every respect in the room, so the userId check is what
	 * makes it "someone respected *me*". AS3 shows two separate bubbles — `.1` (unparameterised)
	 * and `.2` (carrying the running total) — and skips either if its key is missing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onRespectNotification()
    private onRespectNotification(event: IMessageEvent): void
    {
        const parser = (event as RespectNotificationMessageEvent).parser as RespectNotificationMessageEventParser;

        if(parser == null) return;

        const localization = this._notifications?.localizationManager;

        if(localization == null || this._notifications?.sessionDataManager == null) return;

        if(this._notifications.sessionDataManager.userId !== parser.userId) return;

        localization.registerParameter('notifications.text.respect.2', 'count', String(parser.respectTotal));

        const first = localization.getLocalizationRaw('notifications.text.respect.1');
        const second = localization.getLocalizationRaw('notifications.text.respect.2');

        if(first)
        {
            this._notifications.singularController?.addItem(first.value, 'respect', null);
        }

        if(second)
        {
            this._notifications.singularController?.addItem(second.value, 'respect', null);
        }
    }

    /**
	 * Handle MOTD (Message of the Day)
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onMOTD()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onMOTD()
    private onMOTD(event: IMessageEvent): void
    {
        const parser = (event as MOTDNotificationEvent).parser as MOTDNotificationEventParser;

        if(!parser.messages || parser.messages.length === 0) return;

        // The feed half of AS3's body is deliberately absent: `notification.feed.enabled` is off
        // and NotificationController is never constructed in either tree, so the loop that built
        // GenericNotificationItemData here fed nothing. The dialog is the live half.
        if(this.useNotifications())
        {
            this._motdNotification?.dispose();
            this._motdNotification = new MOTDNotification(parser.messages, this._notifications?.windowManager ?? null);
        }
    }

    /**
	 * Handle broadcast message
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onBroadcastMessageEvent()
	 */
    /**
	 * A hotel-wide broadcast, and it showed nothing: the dialog was a `// Show broadcast alert
	 * dialog` comment. The line above it was worse than missing — `message.replace(...)` with the
	 * result thrown away, which in AS3 is the same mistake and in JavaScript is guaranteed to be
	 * one, strings being immutable. The server escapes its newlines as a literal `\r`, so without
	 * the substitution a multi-line announcement arrives as one run-on line.
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onBroadcastMessageEvent()
    private onBroadcastMessageEvent(event: IMessageEvent): void
    {
        const parser = (event as HabboBroadcastMessageEvent).parser as HabboBroadcastMessageEventParser;
        const message = parser.messageText.replace(/\\r/g, '\r');

        this._notifications?.windowManager?.simpleAlert(
            '${notifications.broadcast.title}', '', message, '', '', null,
            'illumina_alert_illustrations_frank_neutral_png'
        );
    }

    /**
	 * Handle notification dialog message
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onNotificationDialogMessageEvent()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onNotificationDialogMessageEvent()
    private onNotificationDialogMessageEvent(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as NotificationDialogMessageEvent).parser as NotificationDialogMessageEventParser;

        if(!parser) return;

        if(NotificationMessageHandler.CALL_FOR_HELP_NOTIFICATION_TYPE === parser.type)
        {
            this.showCallCreatedNotification(
                parser.parameters?.get('message') ?? '',
                parser.parameters?.get('linkUrl') ?? null
            );
        }
        else
        {
            this._notifications?.showNotification(parser.type, parser.parameters);
        }
    }

    /**
	 * The receipt for a call for help: without it, sending one produced no answer of any kind.
	 * The FAQ link is optional and the two AS3 branches differ only by it.
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::showCallCreatedNotification()
    private showCallCreatedNotification(message: string, linkUrl: string | null): void
    {
        const windowManager = this._notifications?.windowManager;

        if(!windowManager) return;

        // Same literal `\r` the broadcast carries — the server escapes its newlines.
        const text = message.replace(/\\r/g, '\r');

        if(linkUrl !== null)
        {
            windowManager.simpleAlert(
                '${help.cfh.sent.title}', '', text, '${help.main.faq.link.text}', linkUrl, null,
                'illumina_alert_illustrations_frank_neutral_png'
            );

            return;
        }

        windowManager.simpleAlert(
            '${help.cfh.sent.title}', '', text, null, null, null,
            'illumina_alert_illustrations_frank_neutral_png'
        );
    }

    /**
	 * Handle hotel closing message
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onHotelClosing()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onHotelClosing()
    private onHotelClosing(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as InfoHotelClosingMessageEvent).parser as InfoHotelClosingMessageEventParser;

        if(!parser) return;

        if(this._notifications?.singularController?.alertDialogManager == null) return;

        this._notifications.singularController.alertDialogManager.handleHotelClosingMessage(parser.minutesUntilClosing);
    }

    /**
	 * Handle hotel closed message
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onHotelClosed()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onHotelClosed()
    private onHotelClosed(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as InfoHotelClosedMessageEvent).parser as InfoHotelClosedMessageEventParser;

        if(!parser) return;

        if(this._notifications?.singularController?.alertDialogManager == null) return;

        this._notifications.singularController.alertDialogManager.handleHotelClosedMessage(parser.openHour, parser.openMinute, parser.userThrownOutAtClose);
    }

    /**
	 * Handle achievement level up notification
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onLevelUp()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onLevelUp()
    private onLevelUp(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as HabboAchievementNotificationMessageEvent).parser;

        if(!parser) return;

        const data = (parser as HabboAchievementNotificationMessageEventParser).data;
        const localization = this._notifications?.localizationManager ?? null;
        const singularController = this._notifications?.singularController ?? null;

        if(data === null || localization === null || singularController === null) return;

        // The body was an empty stub with a comment where these six lines should have been, so
        // levelling an achievement produced no notification at all.
        const achievementName = localization.getBadgeName(data.badgeCode);

        localization.registerParameter('notification.new.achievement', 'achievement_name', achievementName);

        const message = localization.getLocalization('notification.new.achievement');
        const badgeImage = this._notifications?.sessionDataManager?.requestBadgeImage(data.badgeCode) ?? null;

        singularController.addItem(
            message,
            NotificationType.ACHIEVEMENT_RECEIVED,
            imageElementToBitmap(badgeImage),
            null,
            data.badgeCode,
            `questengine/achievements/${data.category}`
        );
    }

    /**
	 * Handle pet level notification
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onPetLevelNotification()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onPetLevelNotification()
    private onPetLevelNotification(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as PetLevelNotificationEvent).parser as PetLevelNotificationEventParser;

        if(!parser) return;

        const localization = this._notifications?.localizationManager;

        localization?.registerParameter('notifications.text.petlevel', 'pet_name', parser.petName);
        localization?.registerParameter('notifications.text.petlevel', 'level', parser.level.toString());

        const text = localization?.getLocalizationRaw('notifications.text.petlevel');

        if(!text) return;

        const figureData = parser.figureData;
        const image = figureData
            ? this._notifications?.petImageUtility?.getPetImage(
                figureData.typeId, figureData.paletteId, figureData.color
            ) ?? null
            : null;

        this._notifications?.addItemWithBitmap(text.value, 'petlevel', image);
    }

    /**
	 * Handle pet received notification
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onPetReceived()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onPetReceived()
    private onPetReceived(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as PetReceivedMessageEvent).parser as PetReceivedMessageEventParser;

        if(!parser) return;

        const localization = this._notifications?.localizationManager;
        const text = localization?.getLocalizationRaw(
            parser.boughtAsGift ? 'notifications.text.petbought' : 'notifications.text.petreceived'
        );

        if(!text) return;

        const petFigure = parser.pet?.figureData ?? null;
        // AS3 tags this one 'petlevel' too — the feed styles both by that key.
        const image = petFigure
            ? this._notifications?.petImageUtility?.getPetImage(
                petFigure.typeId, petFigure.paletteId, petFigure.color
            ) ?? null
            : null;

        this._notifications?.addItemWithBitmap(text.value, 'petlevel', image);
    }

    /**
	 * Handle pet respect failed
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onPetRespectFailed()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onPetRespectFailed()
    private onPetRespectFailed(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as PetRespectFailedEvent).parser as PetRespectFailedEventParser;

        if(!parser) return;

        const localization = this._notifications?.localizationManager;

        localization?.registerParameter('room.error.pets.respectfailed', 'required_age', `${parser.requiredDays}`);
        localization?.registerParameter('room.error.pets.respectfailed', 'avatar_age', `${parser.avatarAgeInDays}`);

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onAlert()
        this._notifications?.windowManager?.alert(
            '${error.title}',
            '${room.error.pets.respectfailed}',
            0,
            (dialog: IDisposable, alertEvent: WindowEvent): void =>
            {
                if(alertEvent.type === 'WE_OK' || alertEvent.type === 'WE_CANCEL') dialog.dispose();
            }
        );
    }

    /**
	 * Handle club gift notification (N gifts are waiting to be claimed).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onClubGiftNotification()
    private onClubGiftNotification(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = (event as ClubGiftNotificationEvent).parser as ClubGiftNotificationEventParser;

        if(!parser) return;

        if(parser.numGifts < 1) return;

        this._notifications?.singularController?.showClubGiftNotification(parser.numGifts);
    }

    /**
	 * Handle club gift selected — the bubble confirming which gift was claimed, illustrated with
	 * the product's own icon.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onClubGiftSelected()
    private onClubGiftSelected(event: IMessageEvent): void
    {
        if(!event || !this._notifications?.localizationManager) return;

        const parser = (event as ClubGiftSelectedEvent).parser as ClubGiftSelectedEventParser;

        if(!parser) return;

        const products = parser.products;

        if(!products || products.length === 0) return;

        const product = products[0];

        if(!product) return;

        const message = this._notifications.localizationManager.getLocalization('notifications.text.club_gift.received');
        const image = this._notifications.productImageUtility?.getProductImage(
            product.productType, product.furniClassId, product.extraParam) ?? null;

        this._notifications.singularController?.addItem(message, 'info', image);
    }

    /**
	 * Handle the user object — the handshake message that says whether the account is
	 * safety-locked, in which case the lock notification goes up immediately at login.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onUserObject()
    private onUserObject(event: IMessageEvent): void
    {
        const parser = (event as UserObjectMessageEvent).parser as UserObjectMessageParser;

        if(!parser) return;

        if(parser.accountSafetyLocked)
        {
            this._notifications?.singularController?.showSafetyLockedNotification(parser.id);
        }
    }

    /**
	 * Handle account safety lock status change — status 1 means the lock was cleared.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onAccountSafetyLockStatusChanged()
    private onAccountSafetyLockStatusChanged(event: IMessageEvent): void
    {
        const parser = (event as AccountSafetyLockStatusChangeMessageEvent).parser as AccountSafetyLockStatusChangeMessageEventParser;

        if(!parser) return;

        if(parser.status === 1)
        {
            this._notifications?.singularController?.hideSafetyLockedNotification();
        }
    }

    /**
	 * Handle activity point notification (loyalty points etc.)
	 *
	 * AS3 switches on `type - 5` with a single `case 0`, i.e. only loyalty points (diamonds)
	 * produce a bubble; every other currency falls through the `default` and shows nothing.
	 *
	 * The icon asset is `if_icon_diamond_png` in AS3, because that is the field name in
	 * HabboNotificationsCom.as. This port registers images under the bare file basename
	 * (see App.ts::registerImageAssets), so the `_png` suffix has to go.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onActivityPointNotification()
    private onActivityPointNotification(event: IMessageEvent): void
    {
        if(!event) return;

        const notification = event as HabboActivityPointNotificationMessageEvent;

        if(!notification.parser) return;

        if(notification.change <= 0) return;

        if(notification.type !== ActivityPointTypeEnum.LOYALTY) return;

        const message = this._notifications?.localizationManager?.getLocalizationWithParams(
            'notifications.text.loyalty.received',
            '',
            'amount',
            String(notification.change)
        ) ?? '';

        this._notifications?.addItem(message, 'info', 'if_icon_diamond');
    }

    /**
	 * Handle restore client message — the server asking the surrounding web page to
	 * close whatever it opened over the client and hand focus back.
	 *
	 * AS3 ignores the event payload entirely; only the call matters.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onRestoreClientMessageEvent()
    private onRestoreClientMessageEvent(_event: IMessageEvent): void
    {
        HabboWebTools.closeWebPageAndRestoreClient();
    }

    /**
	 * Handle room enter events (triggers moderation disclaimer)
	 *
	 * @see source_as_win63/habbo/notifications/class_3353.as onRoomEnter()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onRoomEnter()
    private onRoomEnter(_event: IMessageEvent): void
    {
        this._notifications?.singularController?.showModerationDisclaimer();
    }

    /**
	 * The recycler finished. This is the second subscriber to the same push — `HabboCatalog`
	 * takes it too, to drive the recycler window; this one only raises the bubble.
	 *
	 * AS3 drops anything that is not status 1 (success) without a word, and reads the raw
	 * localization entry rather than the resolved string, so a hotel that has not defined
	 * `notifications.text.recycle.ok` shows nothing instead of the key.
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onRecyclerFinished()
    private onRecyclerFinished(event: IMessageEvent): void
    {
        const parser = event.parser as RecyclerFinishedMessageEventParser;

        if(parser == null || parser.recyclerFinishedStatus !== 1) return;

        const localization = this._notifications?.localizationManager?.getLocalizationRaw('notifications.text.recycle.ok');

        if(localization)
        {
            this._notifications?.singularController?.addItem(localization.value, 'recyclerok', null);
        }

        log.debug('[HabboNotifications] recycle ok');
    }

    /**
	 * A purchasable chat style was granted or taken away.
	 *
	 * AS3 clones the style's `selectorPreview` BitmapData before handing it over; this port has
	 * no mutable bitmap type and every other consumer of `selectorPreview` passes the
	 * `ImageBitmap` straight through, so it is passed by reference here too.
	 */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onChatStyleNotification()
    private onChatStyleNotification(event: IMessageEvent): void
    {
        const parser = event.parser as UserPurchasableChatStyleChangedMessageParser;

        if(parser == null || this._notifications == null) return;

        const message = this._notifications.localizationManager?.getLocalization(
            parser.added ? 'notification.chatstyles.added' : 'notification.chatstyles.removed'
        ) ?? '';

        const preview = this._notifications.freeFlowChat?.chatStyleLibrary?.getStyle(parser.styleId)?.selectorPreview ?? null;

        this._notifications.addItemWithBitmap(message, 'info', preview);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onBanInfoMessageEvent()
    private onBanInfoMessageEvent(event: IMessageEvent): void
    {
        const parser = event.parser as BanInfoMessageEventParser;

        if(parser == null || this._notifications?.singularController?.alertDialogManager == null)
        {
            return;
        }

        this._notifications.singularController.alertDialogManager.handleBanInfoMessage(
            parser.reason,
            parser.banExpirySeconds,
            parser.localizedReason
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::getHuntName()
    private getHuntName(huntId: string): string
    {
        return this._notifications?.localizationManager?.getLocalization(`treasure_hunt.${huntId}.name`, huntId) ?? huntId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onTreasureHuntUpdate()
    private onTreasureHuntUpdate(event: IMessageEvent): void
    {
        const parser = event.parser as TreasureHuntUpdateMessageEventParser;

        if(parser == null || this._notifications == null) return;

        const huntName = this.getHuntName(parser.huntId ?? '');

        const message = parser.isCompleted
            ? this._notifications.localizationManager?.getLocalizationWithParams(
                'treasure_hunt.won.desc', '', 'hunt_name', huntName
            )
            : this._notifications.localizationManager?.getLocalizationWithParams(
                'treasure_hunt.progress.desc', '',
                'current', String(parser.stepsCompleted),
                'total', String(parser.totalSteps),
                'hunt_name', huntName
            );

        this._notifications.addItem(message ?? '', 'treasure_hunt');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onTreasureHuntFail()
    private onTreasureHuntFail(event: IMessageEvent): void
    {
        const parser = event.parser as TreasureHuntFailMessageEventParser;

        if(parser == null || this._notifications == null) return;

        const message = this._notifications.localizationManager?.getLocalizationWithParams(
            'treasure_hunt.level_fail.desc', '',
            'level', String(parser.requiredLevel),
            'level_paying', String(parser.requiredLevelPaying)
        ) ?? '';

        this._notifications.addItem(message, 'treasure_hunt');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onTreasureHuntFirstWinner()
    /**
     * The result of claiming a product.
     *
     * The product name falls back to the raw `claimId` when the hotel has no
     * `claim_product.name.<id>` — AS3 passes it as `getLocalization()`'s second argument, so an
     * unnamed product still reads as something rather than as the key. This notification carries no
     * icon at all, which is AS3's `addItem(text, "info")` with nothing after it.
     */
    // AS3: .../src/com/sulake/habbo/notifications/_SafeCls_1951.as::onClaimProductResult()
    private onClaimProductResult(event: IMessageEvent): void
    {
        const localization = this._notifications?.localizationManager;

        if(!localization) return;

        const parser = event.parser as ClaimProductResultMessageParser;
        const claimName = localization.getLocalization(`claim_product.name.${parser.claimId}`, parser.claimId);

        this._notifications?.addItem(
            localization.getLocalizationWithParams(
                `claim_product.result.${parser.result}`, '', 'claim_name', claimName
            ),
            'info'
        );
    }

    private onTreasureHuntFirstWinner(event: IMessageEvent): void
    {
        const parser = event.parser as TreasureHuntFirstWinnerMessageEventParser;

        if(parser == null) return;

        this._bufferedTreasureHuntWinnerInfo = parser.winnerInfo;

        this.showTreasureHuntWinner();
    }

    /**
     * Renders the winner's face into a bubble.
     *
     * The two-pass shape is AS3's: the first call passes `this` as the avatar-image listener, so a
     * figure whose assets are still downloading comes back as a placeholder and produces a bubble
     * with no picture; `avatarImageReady()` then calls back with `retry = true`, which passes a
     * null listener (no second callback) and lets the bubble go out with the real face. AS3 posts
     * both, so the player sees the text immediately and the portrait a moment later.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::showTreasureHuntWinner()
    private showTreasureHuntWinner(retry: boolean = false): void
    {
        const winner = this._bufferedTreasureHuntWinnerInfo;

        if(winner == null || this._notifications == null) return;

        const message = this._notifications.localizationManager?.getLocalizationWithParams(
            'treasure_hunt.winner.desc', '',
            'user_name', winner.userName,
            'hunt_name', this.getHuntName(winner.huntId)
        ) ?? '';

        const avatarImage = this._notifications.avatarRenderManager?.createAvatarImage(
            winner.userFigure, 'h', winner.userGender, retry ? null : this, null
        ) ?? null;

        let face: ImageBitmap | null = null;

        if(avatarImage != null && !avatarImage.isPlaceholder())
        {
            face = HabboFaceFocuser.focusUserFace(avatarImage, 'head', 3, 1);
            avatarImage.dispose();
        }

        if(avatarImage != null || retry)
        {
            this._notifications.addItemWithBitmap(message, 'treasure_hunt', face);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::avatarImageReady()
    avatarImageReady(figureString: string): void
    {
        if(this._bufferedTreasureHuntWinnerInfo != null
            && this._bufferedTreasureHuntWinnerInfo.userFigure === figureString)
        {
            this.showTreasureHuntWinner(true);
        }
    }
}
