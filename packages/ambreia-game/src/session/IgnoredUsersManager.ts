import type {IIgnoredUsersManager} from './IIgnoredUsersManager';
import {IgnoreResult} from './IIgnoredUsersManager';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IMessageComposer} from '@ambreia/net/messages/IMessageComposer';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import {
    GetIgnoredUsersMessageComposer,
    IgnoreUserMessageComposer,
    UnignoreUserMessageComposer,
} from '@ambreia/protocol/outgoing/users/index';
import {IgnoreResultMessageEvent, IgnoredUsersMessageEvent} from '@ambreia/protocol/incoming/users/index';

/**
 * Ignored users manager
 * Based on AS3 com.sulake.habbo.session.IgnoredUsersManager
 */
export class IgnoredUsersManager implements IIgnoredUsersManager
{
    private _communication: IHabboCommunicationManager | null = null;
    private _sendCallback: ((composer: IMessageComposer<unknown[]>) => void) | null = null;
    private _ignoredUserIds: Set<number> = new Set();
    private _messageEvents: IMessageEvent[] = [];

    constructor(communication: IHabboCommunicationManager | null, sendCallback: ((composer: IMessageComposer<unknown[]>) => void) | null)
    {
        this._communication = communication;
        this._sendCallback = sendCallback;

        this.registerMessageEvents();
    }

    // AS3: .../src/com/sulake/habbo/session/IgnoredUsersManager.as::get disposed()
    get disposed(): boolean
    {
        return this._communication === null;
    }

    // AS3: .../src/com/sulake/habbo/session/IgnoredUsersManager.as::initIgnoreList()
    initIgnoreList(): void
    {
        if(this._sendCallback)
        {
            this._sendCallback(new GetIgnoredUsersMessageComposer());
        }
    }

    // AS3: .../src/com/sulake/habbo/session/IgnoredUsersManager.as::ignoreUser()
    ignoreUser(userId: number): void
    {
        if(this._sendCallback)
        {
            this._sendCallback(new IgnoreUserMessageComposer(userId));
        }
    }

    // AS3: .../src/com/sulake/habbo/session/IgnoredUsersManager.as::unignoreUser()
    unignoreUser(userId: number): void
    {
        if(this._sendCallback)
        {
            this._sendCallback(new UnignoreUserMessageComposer(userId));
        }
    }

    // AS3: .../src/com/sulake/habbo/session/IgnoredUsersManager.as::isIgnored()
    isIgnored(userId: number): boolean
    {
        return this._ignoredUserIds.has(userId);
    }

    /**
	 * Set the ignored users list (called by message handler)
	 */
    setIgnoredUsers(userIds: number[]): void
    {
        this._ignoredUserIds = new Set(userIds);
    }

    /**
	 * Handle ignore result from server
	 */
    handleIgnoreResult(result: number, userId: number): void
    {
        switch(result)
        {
            case IgnoreResult.FAILED:
                // Do nothing
                break;

            case IgnoreResult.IGNORED:
                this.addUserToIgnoreList(userId);
                break;

            case IgnoreResult.IGNORED_LIST_FULL:
                // Add user but remove oldest
                this.addUserToIgnoreList(userId);
                {
                    const oldest = this._ignoredUserIds.values().next().value;
                    if(oldest !== undefined) this._ignoredUserIds.delete(oldest);
                }
                break;

            case IgnoreResult.UNIGNORED:
                this.removeUserFromIgnoreList(userId);
                break;
        }
    }

    // AS3: .../src/com/sulake/habbo/session/IgnoredUsersManager.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        for(const event of this._messageEvents)
        {
            this._communication?.removeMessageEvent(event);
        }

        this._messageEvents.length = 0;
        this._ignoredUserIds.clear();
        this._communication = null;
        this._sendCallback = null;
    }

    // AS3: .../src/com/sulake/habbo/session/IgnoredUsersManager.as::addUserToIgnoreList()
    private addUserToIgnoreList(userId: number): void
    {
        this._ignoredUserIds.add(userId);
    }

    // AS3: .../src/com/sulake/habbo/session/IgnoredUsersManager.as::removeUserFromIgnoreList()
    private removeUserFromIgnoreList(userId: number): void
    {
        this._ignoredUserIds.delete(userId);
    }

    private registerMessageEvents(): void
    {
        if(this._communication)
        {
            const ignoreResultEvent = new IgnoreResultMessageEvent(this.onIgnoreResult.bind(this));
            this._communication.addMessageEvent(ignoreResultEvent);
            this._messageEvents.push(ignoreResultEvent);

            const ignoredUsersEvent = new IgnoredUsersMessageEvent(this.onIgnoredUsers.bind(this));
            this._communication.addMessageEvent(ignoredUsersEvent);
            this._messageEvents.push(ignoredUsersEvent);
        }
    }

    private onIgnoredUsers(event: IMessageEvent): void
    {
        const ignoredUsersEvent = event as IgnoreResultMessageEvent | IgnoredUsersMessageEvent;

        if(!(ignoredUsersEvent instanceof IgnoredUsersMessageEvent))
        {
            return;
        }

        this.setIgnoredUsers(ignoredUsersEvent.ignoredUserIds);
    }

    // AS3: .../src/com/sulake/habbo/session/IgnoredUsersManager.as::onIgnoreResult()
    private onIgnoreResult(event: IMessageEvent): void
    {
        const ignoreResultEvent = event as IgnoreResultMessageEvent | IgnoredUsersMessageEvent;

        if(!(ignoreResultEvent instanceof IgnoreResultMessageEvent))
        {
            return;
        }

        this.handleIgnoreResult(ignoreResultEvent.result, ignoreResultEvent.userId);
    }
}
