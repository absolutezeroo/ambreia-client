import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import type {IMessageParser} from '@core/communication/messages/IMessageParser';

/**
 * Parser for user NFT chat styles message
 *
 * @see source_as_win63/habbo/communication/messages/parser/nft/UserNftChatStylesMessageEventParser.as
 */
export class UserNftChatStylesMessageParser implements IMessageParser
{
    private _chatStyleIds: number[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/nft/UserNftChatStylesMessageEventParser.as::get chatStyleIds()
    get chatStyleIds(): number[]
    {
        return this._chatStyleIds;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/nft/UserNftChatStylesMessageEventParser.as::flush()
    flush(): boolean
    {
        this._chatStyleIds = [];
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/nft/UserNftChatStylesMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();

        this._chatStyleIds = [];

        for(let i = 0; i < count; i++)
        {
            this._chatStyleIds.push(wrapper.readInt());
        }

        return true;
    }
}
