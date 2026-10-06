import {RoomWidgetMessage} from './RoomWidgetMessage';

/**
 * RoomWidgetUseProductMessage
 *
 * "Use this product on that thing" — a pet product applied to a pet. AS3 also plants a
 * monsterplant seed with it (RWUPM_MONSTERPLANT_SEED, no pet id); the RPG fork removed
 * monsterplants.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUseProductMessage.as
 */
export class RoomWidgetUseProductMessage extends RoomWidgetMessage
{
    // AS3: .../messages/RoomWidgetUseProductMessage.as::PET_PRODUCT
    public static readonly PET_PRODUCT: string = 'RWUPM_PET_PRODUCT';

    // AS3: .../messages/RoomWidgetUseProductMessage.as::RoomWidgetUseProductMessage()
    constructor(type: string, roomObjectId: number, petId: number = -1)
    {
        super(type);

        this._roomObjectId = roomObjectId;
        this._petId = petId;
    }

    // AS3: .../messages/RoomWidgetUseProductMessage.as::_SafeStr_8884
    private _roomObjectId: number = 0;

    // AS3: .../messages/RoomWidgetUseProductMessage.as::get roomObjectId()
    public get roomObjectId(): number
    {
        return this._roomObjectId;
    }

    // AS3: .../messages/RoomWidgetUseProductMessage.as::_SafeStr_7746
    private _petId: number = -1;

    // AS3: .../messages/RoomWidgetUseProductMessage.as::get petId()
    public get petId(): number
    {
        return this._petId;
    }
}
