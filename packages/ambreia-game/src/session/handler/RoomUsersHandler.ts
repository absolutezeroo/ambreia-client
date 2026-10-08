import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';
import {RoomShakingEffect} from '@ambreia/iso/utils/RoomShakingEffect';

// Message events
import {UsersMessageEvent} from '@ambreia/protocol/incoming/room/engine/UsersMessageEvent';
import {UserRemoveMessageEvent} from '@ambreia/protocol/incoming/room/engine/UserRemoveMessageEvent';
import {DoorbellMessageEvent} from '@ambreia/protocol/incoming/navigator/DoorbellMessageEvent';
import {BlockUserUpdateMessageEvent} from '@ambreia/protocol/incoming/users/BlockUserUpdateMessageEvent';
import {HabboUserBadgesMessageEvent} from '@ambreia/protocol/incoming/users/HabboUserBadgesMessageEvent';
import {UserChangeMessageEvent} from '@ambreia/protocol/incoming/room/action/UserChangeMessageEvent';
import {DanceMessageEvent} from '@ambreia/protocol/incoming/room/action/DanceMessageEvent';
import type {
    DanceMessageEventParser
} from '@ambreia/protocol/parser/room/action/DanceMessageEventParser';
import {
    NewFriendRequestMessageEvent
} from '@ambreia/protocol/incoming/friendlist/NewFriendRequestMessageEvent';
import type {
    NewFriendRequestMessageParser
} from '@ambreia/protocol/parser/friendlist/NewFriendRequestMessageParser';
import {RoomSessionDanceEvent} from '../events/RoomSessionDanceEvent';
import {RoomSessionFriendRequestEvent} from '../events/RoomSessionFriendRequestEvent';

// Parsers
import type {UsersMessageParser} from '@ambreia/protocol/parser/room/engine/UsersMessageParser';
import type {UserRemoveMessageParser} from '@ambreia/protocol/parser/room/engine/UserRemoveMessageParser';
import type {DoorbellMessageParser} from '@ambreia/protocol/parser/navigator/DoorbellMessageParser';
import type {HabboUserBadgesMessageParser} from '@ambreia/protocol/parser/users/HabboUserBadgesMessageParser';
import type {
    UserChangeMessageEventParser
} from '@ambreia/protocol/parser/room/action/UserChangeMessageEventParser';

// Events
import {RoomSessionUserDataUpdateEvent} from '../events/RoomSessionUserDataUpdateEvent';
import {RoomSessionDoorbellEvent} from '../events/RoomSessionDoorbellEvent';
import {RoomSessionUserBadgesEvent} from '../events/RoomSessionUserBadgesEvent';
import {RoomSessionUserFigureUpdateEvent} from '../events/RoomSessionUserFigureUpdateEvent';
import type {IUserData} from '../index';
import { UserData} from '../index';
import type {RoomUserData} from '../../communication/index';
import {
    UserNameChangedMessageEvent
} from '@ambreia/protocol/incoming/help/UserNameChangedMessageEvent';
import type {
    UserNameChangedMessageParser
} from '@ambreia/protocol/parser/help/UserNameChangedMessageParser';

/**
 * Room users handler
 *
 * Based on AS3: com.sulake.habbo.session.handler.RoomUsersHandler
 *
 * Handles user-related messages and manages user data in the session, in AS3's registration
 * order minus the messages the RPG server does not send (see the constructor).
 */
export class RoomUsersHandler extends BaseHandler
{
    private _messageEvents: IMessageEvent[] = [];

    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        if(connection === null)
        {
            return;
        }

        // Register core message events
        this.addMessageEvent(connection, new UsersMessageEvent(this.onUsers.bind(this)));
        this.addMessageEvent(connection, new UserRemoveMessageEvent(this.onUserRemove.bind(this)));
        this.addMessageEvent(connection, new HabboUserBadgesMessageEvent(this.onUserBadges.bind(this)));
        this.addMessageEvent(connection, new DoorbellMessageEvent(this.onDoorbell.bind(this)));
        this.addMessageEvent(connection, new BlockUserUpdateMessageEvent(this.onBlockUserUpdate.bind(this)));
        // DEVIATION: AS3 also subscribes the pet messages (info, commands, placing error, figure,
        //   status, level, breeding), the favourite-group update and the bot error. The RPG server
        //   sends none of them; pets and bots come back as RPG companions and monsters.
        this.addMessageEvent(connection, new UserChangeMessageEvent(this.onUserChange.bind(this)));

        // AS3: RoomUsersHandler.as:84 — the last registration this port was missing. Without it a
        // rename landed in the session's user list and nowhere else: the room kept rendering the
        // old nameplate until the next room entry.
        this.addMessageEvent(connection, new UserNameChangedMessageEvent(this.onUserNameChange.bind(this)));

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomUsersHandler.as::RoomUsersHandler()
        // Both events were ported, registered and dispatched by nobody. `RoomSessionDanceEvent` and
        // `RoomSessionFriendRequestEvent` each had a consumer already waiting — see the handlers.
        this.addMessageEvent(connection, new DanceMessageEvent(this.onDance.bind(this)));
        this.addMessageEvent(connection, new NewFriendRequestMessageEvent(this.onFriendRequest.bind(this)));
    }

    /**
	 * Convert a RoomUserData (from parser) into a UserData (for session storage).
	 *
	 * The RPG server sends no guild, badge rank, pet rarity or breeding flags, so none are copied.
	 */
    private static createUserDataFromRoomUser(roomUser: RoomUserData): UserData
    {
        const userData = new UserData(roomUser.roomIndex);

        userData.type = roomUser.userType;
        userData.webID = roomUser.webID;
        userData.name = roomUser.name;
        userData.figure = roomUser.figure;
        userData.sex = roomUser.sex;
        userData.custom = roomUser.custom;
        userData.achievementScore = roomUser.achievementScore;
        userData.isModerator = roomUser.isModerator;
        userData.ownerId = roomUser.ownerId;
        userData.ownerName = roomUser.ownerName;
        userData.petLevel = roomUser.petLevel;
        userData.hasSaddle = roomUser.hasSaddle;
        userData.isRiding = roomUser.isRiding;
        userData.botSkills = roomUser.botSkills;

        return userData;
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
	 * Handle users entering the room
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomUsersHandler.as::onUsers()
    private onUsers(event: IMessageEvent): void
    {
        const usersEvent = event as UsersMessageEvent;
        if(usersEvent === null)
        {
            return;
        }

        const parser = usersEvent.parser as UsersMessageParser;

        if(parser === null)
        {
            return;
        }

        const session = this.listener.getSession(this.roomId);

        if(session === null)
        {
            return;
        }

        // Collect added users for the event
        const addedUsers: IUserData[] = [];

        // AS3 flags the loop when the easter-egg bot is among the users, then shakes the room
        // once the loop finishes — not inside it, so a second Macklebee cannot re-init the effect.
        let shakeRoom = false;

        for(let i = 0; i < parser.userCount; i++)
        {
            const roomUserData = parser.getUser(i);

            if(roomUserData !== null)
            {
                const userData = RoomUsersHandler.createUserDataFromRoomUser(roomUserData);

                if(roomUserData.userType === 4 && roomUserData.ownerId === -1 && roomUserData.name === 'Macklebee')
                {
                    shakeRoom = true;
                }

                // AS3 reports a user as "added" only when its room index is not already
                // present — a repeated Users packet for an existing occupant is an update,
                // not a join. Check before the set. The old body pushed every user, so
                // consumers saw updates as fresh arrivals.
                if(session.userDataManager.getUserDataByIndex(roomUserData.roomIndex) === null)
                {
                    addedUsers.push(userData);
                }

                session.userDataManager.setUserData(userData);
            }
        }

        if(shakeRoom)
        {
            RoomShakingEffect.init(250, 5000);
            RoomShakingEffect.turnVisualizationOn();
        }

        // Dispatch user data update event
        if(this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionUserDataUpdateEvent.RSUDUE_USER_DATA_UPDATE,
                new RoomSessionUserDataUpdateEvent(session, addedUsers)
            );
        }
    }

    /**
	 * Handle user leaving the room
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomUsersHandler.as::onUserRemove()
    private onUserRemove(event: IMessageEvent): void
    {
        const removeEvent = event as UserRemoveMessageEvent;

        if(removeEvent === null)
        {
            return;
        }

        const parser = removeEvent.parser as UserRemoveMessageParser;

        if(parser === null)
        {
            return;
        }

        const session = this.listener.getSession(this.roomId);

        if(session === null)
        {
            return;
        }

        session.userDataManager.removeUserDataByRoomIndex(parser.roomIndex);
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomUsersHandler.as::onBlockUserUpdate()
    /**
	 * The server's word on who is dancing and to what.
	 *
	 * This is what `AvatarInfoWidgetHandler` reads to set `isDancing` — AS3 handles `RSDE_DANCE`
	 * there with `isDancing = danceStyle != 0`. The port had been setting that flag optimistically
	 * at the send site instead, so a dance the player did not start (a `:dance` command, another
	 * client, the server stopping it) never reached the bubble.
	 *
	 * AS3 dereferences the session and parser unguarded; the nulls checks are this port's.
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomUsersHandler.as::onDance()
    private onDance(event: IMessageEvent): void
    {
        const parser = event.parser as DanceMessageEventParser | null;

        if(!parser) return;

        const session = this.listener.getSession(this.roomId);

        if(session === null) return;

        if(this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionDanceEvent.RSDE_DANCE,
                new RoomSessionDanceEvent(session, parser.userId, parser.danceStyle)
            );
        }
    }

    /**
	 * A friend request that arrived while in a room, which is what raises the in-room request
	 * bubble — `FriendRequestWidgetHandler` was listening for this event and nothing dispatched it.
	 * The friend *list* subscribes the same message separately, for the list itself.
	 *
	 * AS3 passes `requestId` as both the request id and the user id. That is not a slip to correct:
	 * `FriendRequestData` sets `requesterUserId = requestId` for the same reason — the payload
	 * carries one id and a name, nothing else.
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomUsersHandler.as::onFriendRequest()
    private onFriendRequest(event: IMessageEvent): void
    {
        const parser = event.parser as NewFriendRequestMessageParser | null;

        if(!parser) return;

        const session = this.listener.getSession(this.roomId);

        if(session === null) return;

        const request = parser.req;

        if(!request) return;

        if(this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionFriendRequestEvent.FRIEND_REQUEST,
                new RoomSessionFriendRequestEvent(
                    session,
                    request.requestId,
                    request.requestId,
                    request.requesterName
                )
            );
        }
    }

    private onBlockUserUpdate(event: IMessageEvent): void
    {
        const blockEvent = event as BlockUserUpdateMessageEvent;

        if(blockEvent === null)
        {
            return;
        }

        const session = this.listener.getSession(this.roomId);

        if(session === null)
        {
            return;
        }

        const userData = session.userDataManager.getUserData(blockEvent.userId);

        if(userData !== null)
        {
            session.userDataManager.markAsBlocked(
                userData.roomObjectId,
                blockEvent.result === BlockUserUpdateMessageEvent.BLOCKED
            );
        }
    }

    /**
	 * Handle doorbell ring
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomUsersHandler.as::onDoorbell()
    private onDoorbell(event: IMessageEvent): void
    {
        const doorbellEvent = event as DoorbellMessageEvent;

        if(doorbellEvent === null)
        {
            return;
        }

        const userName = (doorbellEvent.parser as DoorbellMessageParser)?.userName;

        if(!userName || userName === '')
        {
            return;
        }

        const session = this.listener.getSession(this.roomId);

        if(session === null)
        {
            return;
        }

        if(this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionDoorbellEvent.RSDE_DOORBELL,
                new RoomSessionDoorbellEvent(RoomSessionDoorbellEvent.RSDE_DOORBELL, session, userName)
            );
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomUsersHandler.as::onUserChange()
    private onUserChange(event: IMessageEvent): void
    {
        const changeEvent = event as UserChangeMessageEvent;

        if(changeEvent === null)
        {
            return;
        }

        const parser = changeEvent.parser as UserChangeMessageEventParser;

        if(parser === null)
        {
            return;
        }

        const session = this.listener.getSession(this.roomId);

        if(session === null || session.userDataManager === null)
        {
            return;
        }

        if(parser.id < 0) return;

        session.userDataManager.updateFigure(parser.id, parser.figure, parser.sex, false, false);
        session.userDataManager.updateCustom(parser.id, parser.customInfo);
        session.userDataManager.updateAchievementScore(parser.id, parser.achievementScore);

        if(this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionUserFigureUpdateEvent.USER_FIGURE,
                new RoomSessionUserFigureUpdateEvent(
                    session,
                    parser.id,
                    parser.figure,
                    parser.sex,
                    parser.customInfo,
                    parser.achievementScore
                )
            );
        }
    }

    /**
	 * Handle user badges update
	 */
    // AS3: .../src/com/sulake/habbo/session/handler/RoomUsersHandler.as::onUserBadges()
    private onUserBadges(event: IMessageEvent): void
    {
        const badgesEvent = event as HabboUserBadgesMessageEvent;

        if(badgesEvent === null)
        {
            return;
        }

        const parser = badgesEvent.parser as HabboUserBadgesMessageParser;

        if(parser === null)
        {
            return;
        }

        const session = this.listener.getSession(this.roomId);

        if(session === null)
        {
            return;
        }

        // Both shapes: the codes for anything that only wants to draw them, and the full entries
        // for the infostand, which needs each badge's slot and rarity.
        session.userDataManager.setUserBadges(parser.userId, parser.badges);
        session.userDataManager.setUserSelectedBadges(parser.userId, parser.selectedBadges);

        if(this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionUserBadgesEvent.RSUBE_BADGES,
                new RoomSessionUserBadgesEvent(session, parser.userId, parser.badges)
            );
        }
    }

    /**
	 * Applies a rename to the user already in the room
	 *
	 * The parser carries both ids: `webId` is the account, `id` the room index, and it is the room
	 * index the user list is keyed by.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomUsersHandler.as::onUserNameChange()
    private onUserNameChange(event: IMessageEvent): void
    {
        const parser = (event as UserNameChangedMessageEvent).parser as UserNameChangedMessageParser | null;

        if(parser === null) return;

        const session = this.listener.getSession(this.roomId);

        if(session === null || session.userDataManager === null) return;

        session.userDataManager.updateNameByIndex(parser.id, parser.newName);
    }
}
