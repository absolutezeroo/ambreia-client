import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for figure set IDs message (clothing)
 *
 * @see source_as_win63/habbo/communication/messages/parser/inventory/clothing/FigureSetIdsEventParser.as
 */
export class FigureSetIdsMessageParser implements IMessageParser
{
    private _figureSetIds: number[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/clothing/FigureSetIdsEventParser.as::get figureSetIds()
    get figureSetIds(): number[]
    {
        return this._figureSetIds;
    }

    private _boundFurnitureNames: string[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/clothing/FigureSetIdsEventParser.as::get boundFurnitureNames()
    get boundFurnitureNames(): string[]
    {
        return this._boundFurnitureNames;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/clothing/FigureSetIdsEventParser.as::flush()
    flush(): boolean
    {
        this._figureSetIds = [];
        this._boundFurnitureNames = [];
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/inventory/clothing/FigureSetIdsEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            this._figureSetIds.push(wrapper.readInt());
        }
        count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            this._boundFurnitureNames.push(wrapper.readString());
        }
        return true;
    }
}
