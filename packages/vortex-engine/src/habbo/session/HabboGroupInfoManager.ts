import type {IHabboGroupInfoManager} from './IHabboGroupInfoManager';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IMessageComposer} from '@ambreia/net/messages/IMessageComposer';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import {HabboGroupBadgesMessageEvent, RoomReadyMessageEvent} from "@habbo/communication";
import {
    GetHabboGroupBadgesMessageComposer
} from "@habbo/communication/messages/outgoing/users/GetHabboGroupBadgesMessageComposer";
import type {HabboGroupBadgesMessageParser} from "@habbo/communication/messages/parser/users/HabboGroupBadgesMessageParser";

/**
 * Habbo group info manager
 * Based on AS3 com.sulake.habbo.session.HabboGroupInfoManager
 */
export class HabboGroupInfoManager implements IHabboGroupInfoManager
{
    private _communication: IHabboCommunicationManager | null = null;
    private _sendCallback: ((composer: IMessageComposer<unknown[]>) => void) | null = null;
    private _groupBadges: Map<number, string> = new Map();
    private _messageEvents: IMessageEvent[] = [];

    constructor(communication: IHabboCommunicationManager | null, sendCallback: ((composer: IMessageComposer<unknown[]>) => void) | null)
    {
        this._communication = communication;
        this._sendCallback = sendCallback;

        this.registerMessageEvents();
    }

    // AS3: .../src/com/sulake/habbo/session/HabboGroupInfoManager.as::get disposed()
    get disposed(): boolean
    {
        return this._communication === null;
    }

    // AS3: .../src/com/sulake/habbo/session/HabboGroupInfoManager.as::getBadgeId()
    getBadgeId(groupId: number): string | null
    {
        return this._groupBadges.get(groupId) ?? null;
    }

    /**
	 * Set a group badge (called by message handler)
	 */
    setGroupBadge(groupId: number, badgeId: string): void
    {
        this._groupBadges.set(groupId, badgeId);
    }

    /**
	 * Set multiple group badges (called by message handler)
	 */
    setGroupBadges(badges: Map<number, string>): void
    {
        for(const [groupId, badgeId] of badges)
        {
            this._groupBadges.set(groupId, badgeId);
        }
    }

    /**
	 * Request group badges for the current room (called on room ready)
	 */
    requestGroupBadges(): void
    {
        if(this._sendCallback)
        {
            this._sendCallback(new GetHabboGroupBadgesMessageComposer());
        }
    }

    // AS3: .../src/com/sulake/habbo/session/HabboGroupInfoManager.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        for(const event of this._messageEvents)
        {
            this._communication?.removeMessageEvent(event);
        }

        this._messageEvents = [];
        this._groupBadges.clear();
        this._communication = null;
        this._sendCallback = null;
    }

    private registerMessageEvents(): void
    {
        if(this._communication)
        {
            const roomReadyEvent = new RoomReadyMessageEvent(this.onRoomReady.bind(this));

            this._communication.addMessageEvent(roomReadyEvent);
            this._messageEvents.push(roomReadyEvent);

            const groupBadgesEvent = new HabboGroupBadgesMessageEvent(this.onGroupBadges.bind(this));

            this._communication.addMessageEvent(groupBadgesEvent);
            this._messageEvents.push(groupBadgesEvent);
        }
    }

    // AS3: .../src/com/sulake/habbo/session/HabboGroupInfoManager.as::onRoomReady()
    private onRoomReady(_event: IMessageEvent): void
    {
        this.requestGroupBadges();
    }

    private onGroupBadges(event: IMessageEvent): void
    {
        const parser = event.parser as HabboGroupBadgesMessageParser;

        if(!parser) return;

        if(!parser.badges) return;

        this.setGroupBadges(parser.badges);
    }
}
