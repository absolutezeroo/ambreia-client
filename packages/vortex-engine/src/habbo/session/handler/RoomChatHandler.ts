import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';

// Message events
import {ChatMessageEvent} from '../../communication/messages/incoming/room/chat/ChatMessageEvent';
import {ShoutMessageEvent} from '../../communication/messages/incoming/room/chat/ShoutMessageEvent';
import {WhisperMessageEvent} from '../../communication/messages/incoming/room/chat/WhisperMessageEvent';
import {PetRespectNotificationEvent} from '../../communication/messages/incoming/notifications/PetRespectNotificationEvent';

// Parsers
import type {
    PetRespectNotificationEventParser
} from '../../communication/messages/parser/notifications/PetRespectNotificationEventParser';
import type {ChatMessageEventParser, IChatLink} from '../../communication/messages/parser/room/chat/ChatMessageEventParser';

import {RemainingMutePeriodMessageEvent} from '@habbo/communication/messages/incoming/room/session/RemainingMutePeriodMessageEvent';
import type {RemainingMutePeriodMessageParser} from '@habbo/communication/messages/parser/room/session/RemainingMutePeriodMessageParser';
import {FloodControlMessageEvent} from '../../communication/messages/incoming/room/chat/FloodControlMessageEvent';
import type {
    FloodControlMessageParser
} from '../../communication/messages/parser/room/chat/FloodControlMessageParser';
import {
    RespectNotificationMessageEvent
} from '../../communication/messages/incoming/notifications/RespectNotificationMessageEvent';
import type {
    RespectNotificationMessageEventParser
} from '../../communication/messages/parser/notifications/RespectNotificationMessageEventParser';
import {
    HandItemReceivedMessageEvent
} from '../../communication/messages/incoming/users/HandItemReceivedMessageEvent';
import type {
    HandItemReceivedMessageParser
} from '../../communication/messages/parser/users/HandItemReceivedMessageParser';
import {
    SpecialSystemChatMessageEvent
} from '../../communication/messages/incoming/room/chat/SpecialSystemChatMessageEvent';
import type {
    SpecialSystemChatMessageParser
} from '../../communication/messages/parser/room/chat/SpecialSystemChatMessageParser';

// Events
import {RoomSessionChatEvent} from '../events/RoomSessionChatEvent';

import {Logger} from '@core';

const log = Logger.getLogger('habbo.session.handler.RoomChatHandler');

/**
 * Room chat handler
 *
 * Based on AS3: com.sulake.habbo.session.handler.RoomChatHandler
 *
 * Handles chat messages (ChatMessageEvent, WhisperMessageEvent, ShoutMessageEvent)
 * and dispatches RoomSessionChatEvent.
 */
export class RoomChatHandler extends BaseHandler
{
    private _messageEvents: IMessageEvent[] = [];

    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        if(connection === null)
        {
            return;
        }

        // Register chat message events
        this.addMessageEvent(connection, new ChatMessageEvent(this.onRoomChat.bind(this)));
        this.addMessageEvent(connection, new WhisperMessageEvent(this.onRoomWhisper.bind(this)));
        this.addMessageEvent(connection, new ShoutMessageEvent(this.onRoomShout.bind(this)));
        // DEVIATION: AS3 also subscribes PetSupplementedNotification; the RPG fork removed the
        //   monsterplant supplements.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomChatHandler.as::RoomChatHandler()
        this.addMessageEvent(connection, new PetRespectNotificationEvent(this.onPetRespectNotification.bind(this)));

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomChatHandler.as::RoomChatHandler()
        this.addMessageEvent(connection, new FloodControlMessageEvent(this.onFloodControl.bind(this)));
        this.addMessageEvent(connection, new RemainingMutePeriodMessageEvent(this.onRemainingMutePeriod.bind(this)));

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomChatHandler.as::RoomChatHandler()
        // The last three of AS3's ten. They were the difference between this handler and its
        // source: `RespectNotification` sat behind "register when implemented" while its event and
        // parser had both been ported, `HandItemReceived` was in the registry and constructed
        // nowhere, and `SpecialSystemChat` had no message at all.
        this.addMessageEvent(connection, new RespectNotificationMessageEvent(this.onRespectNotification.bind(this)));
        this.addMessageEvent(connection, new HandItemReceivedMessageEvent(this.onHandItemNotification.bind(this)));
        this.addMessageEvent(connection, new SpecialSystemChatMessageEvent(this.onSpecialSystemChat.bind(this)));
    }

    override dispose(): void
    {
        if(this.connection)
        {
            for(const event of this._messageEvents)
            {
                this.connection.removeMessageEvent(event);
            }
        }
        this._messageEvents = [];

        super.dispose();
    }

    private addMessageEvent(connection: IConnection, event: IMessageEvent): void
    {
        connection.addMessageEvent(event);
        this._messageEvents.push(event);
    }

    /**
	 * Helper method to dispatch a chat event
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomChatHandler.as (all 3 onRoom* handlers)
    // `links` passes parser.links straight through, unmodified - AS3 never
    // flattens it, only display text plus the url/isTrusted it needs to open.
    private dispatchChatEvent(
        userId: number,
        text: string,
        chatType: number,
        styleId: number,
        links: IChatLink[] | null = null,
        extraParam: number = -1
    ): void
    {
        const session = this.listener.getSession(this.roomId);
        if(session === null)
        {
            return;
        }

        if(this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionChatEvent.RSCE_CHAT_EVENT,
                new RoomSessionChatEvent(
                    RoomSessionChatEvent.RSCE_CHAT_EVENT,
                    session,
                    userId,
                    text,
                    chatType,
                    styleId,
                    links,
                    extraParam
                )
            );
        }
    }

    /**
     * Scratching a pet, or feeding it a treat, surfaces as a bubble over the pet. Which of the
     * two it was is not a field on the message: AS3 infers it from the pet's own figure type, so
     * `isTreat()` is a look at the payload rather than a flag.
     *
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomChatHandler.as::onPetRespectNotification()
     */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomChatHandler.as::onPetRespectNotification()
    private onPetRespectNotification(event: IMessageEvent): void
    {
        const parser = event.parser as PetRespectNotificationEventParser | null;

        if(parser === null || parser.petData === null) return;

        const session = this.listener.getSession(this.roomId);

        if(session === null) return;

        const petData = session.userDataManager.getPetUserData(parser.petData.id);

        if(petData === null) return;

        const chatType = parser.isTreat()
            ? RoomSessionChatEvent.CHAT_TYPE_PET_TREAT
            : RoomSessionChatEvent.CHAT_TYPE_PET_RESPECT;

        // AS3 passes no giver here.
        this.dispatchChatEvent(petData.roomObjectId, '', chatType, 1);
    }

    /**
	 * Somebody was respected. The bubble goes over the *respected* user, so the payload's `userId`
	 * is resolved to a room object through the session rather than dispatched as-is.
	 *
	 * AS3 reads `respectTotal` off the same parser and ignores it here — the running total is the
	 * notifications module's business, and it subscribes this message separately.
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomChatHandler.as::onRespectNotification()
    private onRespectNotification(event: IMessageEvent): void
    {
        const parser = event.parser as RespectNotificationMessageEventParser | null;

        if(parser === null) return;

        const session = this.listener.getSession(this.roomId);

        if(session === null) return;

        const userData = session.userDataManager.getUserData(parser.userId);

        if(userData === null) return;

        this.dispatchChatEvent(userData.roomObjectId, '', RoomSessionChatEvent.CHAT_TYPE_RESPECT, 1);
    }

    /**
	 * Someone handed this player an item — a drink, a camera. The bubble belongs over the *giver*,
	 * and AS3 dispatches `giverUserId` straight through without a `userDataManager` lookup: it is
	 * already a room object id here, unlike the respect message's web id one method up.
	 *
	 * `handItemType` rides in `extraParam`, which is how the chat layer knows which item to draw.
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomChatHandler.as::onHandItemNotification()
    private onHandItemNotification(event: IMessageEvent): void
    {
        const parser = event.parser as HandItemReceivedMessageParser | null;

        if(parser === null) return;

        this.dispatchChatEvent(
            parser.giverUserId,
            '',
            RoomSessionChatEvent.CHAT_TYPE_HAND_ITEM_RECEIVED,
            1,
            null,
            parser.handItemType
        );
    }

    /**
	 * A special system message over a user. The payload carries no text at all — only
	 * `specialSystemType`, which rides in `extraParam` for the chat layer to resolve.
	 *
	 * The user is identified by room *index*, not by id, so this is the one handler here that goes
	 * through `getUserDataByIndex()`.
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomChatHandler.as::onSpecialSystemChat()
    private onSpecialSystemChat(event: IMessageEvent): void
    {
        const parser = event.parser as SpecialSystemChatMessageParser | null;

        if(parser === null) return;

        const session = this.listener.getSession(this.roomId);

        if(session === null) return;

        const userData = session.userDataManager.getUserDataByIndex(parser.userIndex);

        if(userData === null) return;

        this.dispatchChatEvent(
            userData.roomObjectId,
            '',
            RoomSessionChatEvent.CHAT_TYPE_SPECIAL_SYSTEM,
            1,
            null,
            parser.specialSystemType
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomChatHandler.as::onFloodControl()
    // The server is refusing this player's chat for N seconds. AS3 does not go through
    // dispatchChatEvent(): it builds the event by hand with a different type (RSCE_FLOOD_EVENT), a
    // userId of -1, and the seconds carried as the *text* field. `ChatInputWidgetHandler` was
    // already listening for it and reading it back that way.
    private onFloodControl(event: IMessageEvent): void
    {
        const parser = event.parser as FloodControlMessageParser | null;

        if(parser === null) return;

        const session = this.listener.getSession(this.roomId);

        if(session === null) return;

        const seconds = parser.seconds;

        log.debug(`received flood control event for ${seconds} seconds`);

        if(this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionChatEvent.RSCE_FLOOD_EVENT,
                new RoomSessionChatEvent(
                    RoomSessionChatEvent.RSCE_FLOOD_EVENT, session, -1, `${seconds}`, 0, 0, null
                )
            );
        }
    }

    /**
     * The player is muted for N more seconds.
     *
     * Unlike the flood event above, AS3 sends this one as an ordinary chat event on the player's
     * *own* avatar (chat type 10, style 1) with the seconds in `extraParam` rather than the text —
     * so it renders as a bubble over their head instead of an input-bar warning.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomChatHandler.as::onRemainingMutePeriod()
    private onRemainingMutePeriod(event: IMessageEvent): void
    {
        const parser = event.parser as RemainingMutePeriodMessageParser | null;

        if(parser === null || !this.listener?.sessionEvents) return;

        const session = this.listener.getSession(this.roomId);

        if(session === null) return;

        this.listener.sessionEvents.emit(
            RoomSessionChatEvent.RSCE_CHAT_EVENT,
            new RoomSessionChatEvent(
                RoomSessionChatEvent.RSCE_CHAT_EVENT, session, session.ownUserRoomId, '', 10, 1, null, parser.secondsRemaining
            )
        );
    }

    /**
	 * Handle normal chat message
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomChatHandler.as::onRoomChat()
    private onRoomChat(event: IMessageEvent): void
    {
        const chatEvent = event as ChatMessageEvent;
        if(chatEvent === null)
        {
            return;
        }

        const parser = chatEvent.parser as ChatMessageEventParser;
        if(parser === null)
        {
            return;
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomChatHandler.as::onRoomChat()
        // Closes the loop opened by RoomSession.sendChatMessage(), which records a send time per
        // tracking id. Without this the entries are never removed and chat-lag is never reported.
        if(parser.trackingId !== -1)
        {
            this.listener?.getSession(this.roomId)?.receivedChatWithTrackingId(parser.trackingId);
        }

        this.dispatchChatEvent(
            parser.userId,
            parser.text,
            RoomSessionChatEvent.CHAT_TYPE_SPEAK,
            parser.styleId,
            parser.links
        );
    }

    /**
	 * Handle whisper message
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomChatHandler.as::onRoomWhisper()
    private onRoomWhisper(event: IMessageEvent): void
    {
        const whisperEvent = event as WhisperMessageEvent;
        if(whisperEvent === null)
        {
            return;
        }

        const parser = whisperEvent.parser as ChatMessageEventParser;
        if(parser === null)
        {
            return;
        }

        this.dispatchChatEvent(
            parser.userId,
            parser.text,
            RoomSessionChatEvent.CHAT_TYPE_WHISPER,
            parser.styleId,
            parser.links
        );
    }

    /**
	 * Handle shout message
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomChatHandler.as::onRoomShout()
    private onRoomShout(event: IMessageEvent): void
    {
        const shoutEvent = event as ShoutMessageEvent;
        if(shoutEvent === null)
        {
            return;
        }

        const parser = shoutEvent.parser as ChatMessageEventParser;
        if(parser === null)
        {
            return;
        }

        this.dispatchChatEvent(
            parser.userId,
            parser.text,
            RoomSessionChatEvent.CHAT_TYPE_SHOUT,
            parser.styleId,
            parser.links
        );
    }
}
