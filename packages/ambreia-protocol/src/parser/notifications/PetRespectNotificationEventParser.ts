import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IPetInfoData} from '../../incoming/notifications/PetFigureDataParser';
import {parsePetInfoData} from '../../incoming/notifications/PetFigureDataParser';

/**
 * Parser for pet respect notification event
 *
 * Parses respect count, pet owner ID, and pet data.
 *
 * @see source_as_win63/habbo/communication/messages/parser/users/PetRespectNotificationEventParser.as
 */
export class PetRespectNotificationEventParser implements IMessageParser
{
    public static readonly PET_TREAT_TYPE_ID: number = 16;

    private _respect: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/PetRespectNotificationEventParser.as::get respect()
    get respect(): number
    {
        return this._respect;
    }

    private _petOwnerId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/PetRespectNotificationEventParser.as::get petOwnerId()
    get petOwnerId(): number
    {
        return this._petOwnerId;
    }

    private _petData: IPetInfoData | null = null;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/PetRespectNotificationEventParser.as::get petData()
    get petData(): IPetInfoData | null
    {
        return this._petData;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/PetRespectNotificationEventParser.as::flush()
    flush(): boolean
    {
        this._respect = 0;
        this._petOwnerId = 0;
        this._petData = null;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/PetRespectNotificationEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._respect = wrapper.readInt();
        this._petOwnerId = wrapper.readInt();
        this._petData = parsePetInfoData(wrapper);

        return true;
    }

    /**
	 * Returns whether this is a treat notification
	 */
    // AS3: sources/win63_version/habbo/communication/messages/parser/users/PetRespectNotificationEventParser.as::isTreat()
    isTreat(): boolean
    {
        return this._petData !== null && this._petData.figureData.typeId === PetRespectNotificationEventParser.PET_TREAT_TYPE_ID;
    }
}
