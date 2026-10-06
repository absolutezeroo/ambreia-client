import type {IRoomWidgetHandler} from '../IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '../IRoomWidgetHandlerContainer';
import type {RoomWidgetMessage} from '../widget/messages/RoomWidgetMessage';
import type {RoomWidgetUpdateEvent} from '../widget/events/RoomWidgetUpdateEvent';
import {RoomWidgetFriendRequestMessage} from '../widget/messages/RoomWidgetFriendRequestMessage';
import {RoomWidgetFriendRequestUpdateEvent} from '../widget/events/RoomWidgetFriendRequestUpdateEvent';
import {RoomSessionFriendRequestEvent} from '@habbo/session/events/RoomSessionFriendRequestEvent';
import {FriendRequestEvent} from '@habbo/friendlist/events/FriendRequestEvent';

/**
 * Turns an incoming friend request into the bubble over the sender's head, and the bubble's two
 * buttons back into friend-list calls.
 *
 * Its three processed events come from **two different buses**: the request itself is a room
 * session event, while the accepted/declined pair belongs to the friend-list component — which
 * is why `RoomDesktop`'s `friendList` setter subscribes to them directly. Accepting from the
 * friend-list window and accepting from the bubble therefore both close it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/FriendRequestWidgetHandler.as
 */
export class FriendRequestWidgetHandler implements IRoomWidgetHandler
{
    // AS3: .../handler/FriendRequestWidgetHandler.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../handler/FriendRequestWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: .../handler/FriendRequestWidgetHandler.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * AS3 returns `"RWE_ROOM_POLL"` here, which is not this widget's type — a copy-paste it
     * shares with `UiHelpBubbleWidgetHandler` and AS3's poll widget handler (removed with polls in
     * the RPG fork). Kept, because `type` is only read to match an open/close-widget event's
     * target, and changing it would make this handler answer one it never answers in the client.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/FriendRequestWidgetHandler.as::get type()
    get type(): string
    {
        return 'RWE_ROOM_POLL';
    }

    // AS3: .../handler/FriendRequestWidgetHandler.as::set container()
    set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container = value;
    }

    // AS3: .../handler/FriendRequestWidgetHandler.as::getWidgetMessages()
    getWidgetMessages(): string[]
    {
        return [RoomWidgetFriendRequestMessage.ACCEPT, RoomWidgetFriendRequestMessage.DECLINE];
    }

    // AS3: .../handler/FriendRequestWidgetHandler.as::processWidgetMessage()
    // AS3 casts inside each case rather than once before the switch; the effect is the same.
    processWidgetMessage(message: RoomWidgetMessage): RoomWidgetUpdateEvent | null
    {
        if(this._container === null) return null;

        if(!(message instanceof RoomWidgetFriendRequestMessage)) return null;

        const friendList = this._container.friendList;

        if(friendList === null) return null;

        switch(message.type)
        {
            case RoomWidgetFriendRequestMessage.ACCEPT:
                friendList.acceptFriendRequest(message.requestId);
                break;

            case RoomWidgetFriendRequestMessage.DECLINE:
                friendList.declineFriendRequest(message.requestId);
                break;
        }

        return null;
    }

    // AS3: .../handler/FriendRequestWidgetHandler.as::getProcessedEvents()
    getProcessedEvents(): string[]
    {
        return [
            RoomSessionFriendRequestEvent.FRIEND_REQUEST,
            FriendRequestEvent.ACCEPTED,
            FriendRequestEvent.DECLINED
        ];
    }

    // AS3: .../handler/FriendRequestWidgetHandler.as::processEvent()
    // Accepted and declined share a body: both mean "this request is answered, take it down".
    processEvent(event: {type: string}): void
    {
        if(this._container === null) return;

        let update: RoomWidgetFriendRequestUpdateEvent | null = null;

        switch(event.type)
        {
            case RoomSessionFriendRequestEvent.FRIEND_REQUEST:
            {
                if(!(event instanceof RoomSessionFriendRequestEvent)) return;

                update = new RoomWidgetFriendRequestUpdateEvent(
                    RoomWidgetFriendRequestUpdateEvent.SHOW_FRIEND_REQUEST,
                    event.requestId,
                    event.userId,
                    event.userName
                );

                break;
            }

            case FriendRequestEvent.ACCEPTED:
            case FriendRequestEvent.DECLINED:
            {
                if(!(event instanceof FriendRequestEvent)) return;

                update = new RoomWidgetFriendRequestUpdateEvent(
                    RoomWidgetFriendRequestUpdateEvent.HIDE_FRIEND_REQUEST,
                    event.requestId
                );

                break;
            }
        }

        if(update === null) return;

        this._container.desktopEvents.emit(update.type, update);
    }

    // AS3: .../handler/FriendRequestWidgetHandler.as::update()
    // Empty in AS3 too.
    update(): void
    {
    }

    // AS3: .../handler/FriendRequestWidgetHandler.as::dispose()
    dispose(): void
    {
        this._disposed = true;
        this._container = null;
    }
}
