import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for favourites rooms message
 *
 * @see source_as_win63/habbo/communication/messages/parser/navigator/FavouritesEventParser.as
 */
export class FavouritesMessageParser implements IMessageParser
{
    private _limit: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FavouritesEventParser.as::get limit()
    get limit(): number
    {
        return this._limit;
    }

    private _favouriteRoomIds: number[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FavouritesEventParser.as::get favouriteRoomIds()
    get favouriteRoomIds(): number[]
    {
        return this._favouriteRoomIds;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FavouritesEventParser.as::flush()
    flush(): boolean
    {
        this._limit = 0;
        this._favouriteRoomIds = [];
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FavouritesEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._limit = wrapper.readInt();
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            this._favouriteRoomIds.push(wrapper.readInt());
        }
        return true;
    }
}
