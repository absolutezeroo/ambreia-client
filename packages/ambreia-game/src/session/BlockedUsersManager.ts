import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IMessageComposer} from '@ambreia/net/messages/IMessageComposer';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import {
    BlockListInitComposer,
    BlockUserMessageComposer,
    UnblockUserMessageComposer,
} from '@ambreia/protocol/outgoing/users/index';
import {
    BlockListMessageEvent,
    BlockUserUpdateMessageEvent,
} from '@ambreia/protocol/incoming/users/index';

/**
 * Blocked users manager.
 *
 * @see sources/win63_version/habbo/session/BlockedUsersManager.as
 */
export class BlockedUsersManager
{
    private _communication: IHabboCommunicationManager | null;
    private _sendCallback: ((composer: IMessageComposer<unknown[]>) => void) | null;
    private _blockedUserIds: Set<number> = new Set();
    private _messageEvents: IMessageEvent[] = [];

    constructor(
        communication: IHabboCommunicationManager | null,
        sendCallback: ((composer: IMessageComposer<unknown[]>) => void) | null
    )
    {
        this._communication = communication;
        this._sendCallback = sendCallback;

        this.registerMessageEvents();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::get disposed()
    get disposed(): boolean
    {
        return this._communication === null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::initBlockList()
    initBlockList(): void
    {
        this._sendCallback?.(new BlockListInitComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::blockUser()
    blockUser(userId: number): void
    {
        this._sendCallback?.(new BlockUserMessageComposer(userId));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::unblockUser()
    unblockUser(userId: number): void
    {
        this._sendCallback?.(new UnblockUserMessageComposer(userId));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::isBlocked()
    isBlocked(userId: number): boolean
    {
        return this._blockedUserIds.has(userId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        for(const event of this._messageEvents)
        {
            this._communication?.removeMessageEvent(event);
        }

        this._messageEvents.length = 0;
        this._blockedUserIds.clear();
        this._communication = null;
        this._sendCallback = null;
    }

    private registerMessageEvents(): void
    {
        if(!this._communication) return;

        const blockUpdateEvent = new BlockUserUpdateMessageEvent(this.onBlockUpdate.bind(this));
        this._communication.addMessageEvent(blockUpdateEvent);
        this._messageEvents.push(blockUpdateEvent);

        const blockListEvent = new BlockListMessageEvent(this.onBlockList.bind(this));
        this._communication.addMessageEvent(blockListEvent);
        this._messageEvents.push(blockListEvent);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::onBlockList()
    private onBlockList(event: IMessageEvent): void
    {
        if(!(event instanceof BlockListMessageEvent)) return;

        this._blockedUserIds = new Set(event.blockedUserIds);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::onBlockUpdate()
    private onBlockUpdate(event: IMessageEvent): void
    {
        if(!(event instanceof BlockUserUpdateMessageEvent)) return;

        switch(event.result)
        {
            case BlockUserUpdateMessageEvent.UNBLOCKED:
                // AS3 also toasts '${notification.unblocked_player}'; notifications left with the core cut.
                this.removeUserFromBlockList(event.userId);
                break;

            case BlockUserUpdateMessageEvent.BLOCKED:
                // AS3 also toasts '${notification.blocked_player}'; notifications left with the core cut.
                this.addUserToBlockList(event.userId);
                break;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::addUserToBlockList()
    private addUserToBlockList(userId: number): void
    {
        this._blockedUserIds.add(userId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BlockedUsersManager.as::removeUserFromBlockList()
    private removeUserFromBlockList(userId: number): void
    {
        this._blockedUserIds.delete(userId);
    }
}
