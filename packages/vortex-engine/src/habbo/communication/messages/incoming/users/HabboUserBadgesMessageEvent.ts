import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {HabboUserBadgesMessageParser} from '../../parser/users/HabboUserBadgesMessageParser';
import type {ISelectedBadge} from '../../parser/users/HabboUserBadgesMessageParser';

/**
 * HabboUserBadgesMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.users.HabboUserBadgesMessageEvent
 */
export class HabboUserBadgesMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, HabboUserBadgesMessageParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/HabboUserBadgesMessageEvent.as::get userId()
    get userId(): number
    {
        return (this._parser as HabboUserBadgesMessageParser).userId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/HabboUserBadgesMessageEvent.as::get badges()
    get badges(): string[]
    {
        return (this._parser as HabboUserBadgesMessageParser).badges;
    }

    /**
	 * The full per-slot records — slot, code, owner count and rarity.
	 *
	 * `badges` above is the codes alone, which is all the callers wanted before rarity was read
	 * off the wire; anything that needs the glow colour or the authoritative slot takes this.
	 */
    // TS-only: the parser member this exposes is `selectedBadges`; AS3's event declares only the
    //   two accessors above and its consumers reach the parser directly through `getParser()`.
    get selectedBadges(): ISelectedBadge[]
    {
        return (this._parser as HabboUserBadgesMessageParser).selectedBadges;
    }
}
