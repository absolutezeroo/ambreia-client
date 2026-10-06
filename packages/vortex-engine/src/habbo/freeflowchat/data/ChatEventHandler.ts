import type {RoomSessionChatEvent} from '@habbo/session/events/RoomSessionChatEvent';
import type {IHabboFreeFlowChat} from '../IHabboFreeFlowChat';
import {ChatItem} from './ChatItem';

/**
 * Room chat event listener. Listens to RoomSessionChatEvent on the
 * roomSessionManager and creates ChatItem instances for insertion
 * into the free flow chat system.
 *
 * Handles timestamp collision avoidance to ensure unique ordering
 * of chat items that arrive at the same millisecond.
 *
 * @see source_as_win63/habbo/freeflowchat/data/ChatEventHandler.as
 */
export class ChatEventHandler
{
    private _freeFlowChat: IHabboFreeFlowChat | null;
    private _lastTimeStamp: number = 0;
    private _timeStampCollisionCount: number = 0;
    private _onRoomChatBound: (event: RoomSessionChatEvent) => void;

    // DEVIATION: AS3 also subscribes `gameEventHandler()` to the games manager's `gce_game_chat` bus
    //   (snow-war chat, styles 120/121); the RPG fork removed Snow War and the games manager.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/data/ChatEventHandler.as::ChatEventHandler()
    constructor(freeFlowChat: IHabboFreeFlowChat)
    {
        this._freeFlowChat = freeFlowChat;

        this._onRoomChatBound = this.onRoomChat.bind(this);

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/data/ChatEventHandler.as::ChatEventHandler()
        // AS3 dereferences roomSessionManager here with no null check, because HabboFreeFlowChat
        // declares that dependency as required — initComponent(), which builds this handler, cannot
        // run before it resolves. The getter is still typed nullable, hence the assertion; guarding
        // instead would turn a loud failure back into a silent one, which is the bug this fixes.
        this._freeFlowChat.roomSessionManager!.sessionEvents.on(
            'RSCE_CHAT_EVENT',
            this._onRoomChatBound
        );
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatEventHandler.as::get disposed()
    get disposed(): boolean
    {
        return this._freeFlowChat === null;
    }

    /**
	 * Dispose of the handler and remove event listeners.
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatEventHandler.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        if(this._freeFlowChat?.roomSessionManager)
        {
            this._freeFlowChat.roomSessionManager.sessionEvents.off(
                'RSCE_CHAT_EVENT',
                this._onRoomChatBound
            );
        }

        this._freeFlowChat = null;
    }

    /**
	 * Handler for RoomSessionChatEvent. Creates a ChatItem with a
	 * collision-avoidant timestamp and inserts it into the free flow chat.
	 *
	 * @param event The room session chat event
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatEventHandler.as::onRoomChat()
    private onRoomChat(event: RoomSessionChatEvent): void
    {
        if(!this._freeFlowChat) return;

        const senderData = this._freeFlowChat.roomSessionManager
            ?.getSession(event.session.roomId)
            ?.userDataManager.getUserDataByIndex(event.userId) ?? null;

        if(senderData && this._freeFlowChat.sessionDataManager?.isBlocked(senderData.webID)) return;

        // AS3 passes event.userId directly (not senderData.roomObjectId) as the
        // object id here - in freeflowchat's RoomSessionChatEvent, userId already
        // is the room-local object id, distinct from ChatBubbleFactory's use of
        // userData.roomObjectId elsewhere for the same lookup.
        const roomObject = this._freeFlowChat.roomEngine?.getRoomObject(event.session.roomId, event.userId, 100) ?? null;
        const userLocation = roomObject?.getLocation() ?? null;

        const now = Math.floor(performance.now());

        if(now === this._lastTimeStamp)
        {
            this._timeStampCollisionCount++;
        }
        else
        {
            this._timeStampCollisionCount = 0;
        }

        this._freeFlowChat.insertChat(
            new ChatItem(event, now + this._timeStampCollisionCount, userLocation, event.extraParam)
        );

        this._lastTimeStamp = now;
    }
}
