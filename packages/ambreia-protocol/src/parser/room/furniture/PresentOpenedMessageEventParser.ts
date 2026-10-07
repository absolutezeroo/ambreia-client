import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for present opened message
 *
 * @see source_as_win63/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as
 */
export class PresentOpenedMessageEventParser implements IMessageParser
{
    private _itemType: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::get itemType()
    get itemType(): string
    {
        return this._itemType;
    }

    private _classId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::get classId()
    get classId(): number
    {
        return this._classId;
    }

    private _productCode: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::get productCode()
    get productCode(): string
    {
        return this._productCode;
    }

    private _placedItemId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::get placedItemId()
    get placedItemId(): number
    {
        return this._placedItemId;
    }

    private _placedItemType: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::get placedItemType()
    get placedItemType(): string
    {
        return this._placedItemType;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::_placedInRoom
    private _placedInRoom: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::get placedInRoom()
    get placedInRoom(): boolean
    {
        return this._placedInRoom;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::_petFigureString
    private _petFigureString: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::get petFigureString()
    get petFigureString(): string
    {
        return this._petFigureString;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::flush()
    flush(): boolean
    {
        this._itemType = '';
        this._classId = 0;
        this._productCode = '';
        this._placedItemId = 0;
        this._placedItemType = '';
        this._placedInRoom = false;
        this._petFigureString = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/PresentOpenedMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._itemType = wrapper.readString();
        this._classId = wrapper.readInt();
        this._productCode = wrapper.readString();
        this._placedItemId = wrapper.readInt();
        this._placedItemType = wrapper.readString();
        this._placedInRoom = wrapper.readBoolean();
        this._petFigureString = wrapper.readString();

        return true;
    }
}
