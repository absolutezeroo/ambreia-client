import type {PetFigureData} from './PetFigureData';
import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import {parsePetFigureData} from '@habbo/communication/messages/incoming/notifications/PetFigureDataParser';

/**
 * A pet's figure changed — saddle fitted/removed, riding state, or a custom-part swap (header 3796).
 *
 * The figure body is AS3's `parser.inventory.pets.class_2486`, already ported as
 * parsePetFigureData(). Its AS3 constructor carries the recurring `while(0 < count)` decompiler
 * corruption (the custom-part loop increments an index it never compares — an infinite loop the
 * real client plainly does not have); the existing port already reads it as a correct counted loop.
 *
 * SERVER MISMATCH — Revision20260701's PetFigureUpdateMessageComposerSerializer has an empty body
 * (`//`), identical in Revision20260112, while the composer is sent from 2 call sites. parse() will
 * therefore throw RangeError('End of buffer') on the first readInt(); SocketConnection catches and
 * logs it per message. See docs/CLIENT-SERVER-ARCHITECTURE.md for the full pet mismatch table.
 *
 * AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetFigureUpdateEventParser.as
 */
export class PetFigureUpdateEventParser implements IMessageParser
{
    private _roomIndex: number = 0;

    private _petId: number = 0;

    private _figureData: PetFigureData | null = null;

    private _hasSaddle: boolean = false;

    private _isRiding: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetFigureUpdateEventParser.as::get roomIndex()
    get roomIndex(): number
    {
        return this._roomIndex;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetFigureUpdateEventParser.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetFigureUpdateEventParser.as::get figureData()
    get figureData(): PetFigureData | null
    {
        return this._figureData;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetFigureUpdateEventParser.as::get hasSaddle()
    get hasSaddle(): boolean
    {
        return this._hasSaddle;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetFigureUpdateEventParser.as::get isRiding()
    get isRiding(): boolean
    {
        return this._isRiding;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetFigureUpdateEventParser.as::flush()
    flush(): boolean
    {
        this._roomIndex = 0;
        this._petId = 0;
        this._figureData = null;
        this._hasSaddle = false;
        this._isRiding = false;

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetFigureUpdateEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._petId = wrapper.readInt();
        this._figureData = parsePetFigureData(wrapper);
        this._hasSaddle = wrapper.readBoolean();
        this._isRiding = wrapper.readBoolean();

        return true;
    }
}
