import type {PetFigureData} from '@habbo/communication/messages/parser/room/pet/PetFigureData';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {parsePetFigureData} from '../../../incoming/notifications/PetFigureDataParser';

/**
 * Parser for open pet package requested message
 *
 * @see source_as_win63/habbo/communication/messages/parser/room/furniture/OpenPetPackageRequestedMessageEventParser.as
 */
export class OpenPetPackageRequestedMessageEventParser implements IMessageParser
{
    private _objectId: number = -1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageRequestedMessageEventParser.as::get objectId()
    get objectId(): number
    {
        return this._objectId;
    }

    private _figureData: PetFigureData | null = null;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageRequestedMessageEventParser.as::get figureData()
    get figureData(): PetFigureData | null
    {
        return this._figureData;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageRequestedMessageEventParser.as::flush()
    flush(): boolean
    {
        this._objectId = -1;
        this._figureData = null;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageRequestedMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._objectId = wrapper.readInt();

        // The server omits the figure entirely for a package that has not been opened yet, so the
        // rest of the packet is optional — AS3 returns early on an exhausted buffer rather than
        // reading past its end.
        if(wrapper.bytesAvailable <= 0) return true;

        this._figureData = parsePetFigureData(wrapper);

        return true;
    }
}
