import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for in-client link messages sent by the server
 *
 * @see source_as_win63/habbo/communication/messages/parser/users/HabboGroupBadgesMessageParser.as
 */
export class HabboGroupBadgesMessageParser implements IMessageParser
{
    private _badges: Map<number, string> | null;

    get badges(): Map<number, string> | null
    {
        return this._badges;
    }

    flush(): boolean
    {
        if(this._badges)
        {
            this._badges.clear();

            this._badges = null;
        }

        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count: number = wrapper.readInt();

        this._badges = new Map<number, string>();

        for(let i = 0; i < count; i++)
        {
            const groupId: number = wrapper.readInt();
            const badgeCode: string = wrapper.readString();

            this._badges.set(groupId, badgeCode);
        }

        return true;
    }
}
