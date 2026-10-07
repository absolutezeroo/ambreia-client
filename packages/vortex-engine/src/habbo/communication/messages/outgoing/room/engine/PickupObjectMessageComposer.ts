import {MessageComposer} from '@ambreia/net/messages/MessageComposer';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';

/**
 * Picks up (or ejects) a furniture/wall item back into inventory.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/engine/PickupObjectMessageComposer.as
 */
export class PickupObjectMessageComposer extends MessageComposer<(number | boolean)[]>
{
    private _objectId: number;
    private _category: number;
    private _confirmed: boolean;

    constructor(objectId: number, category: number, confirmed: boolean = false)
    {
        super();

        this._objectId = objectId;
        this._category = category;
        this._confirmed = confirmed;
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/engine/PickupObjectMessageComposer.as::getMessageArray()
    getMessageArray(): (number | boolean)[]
    {
        let categoryCode: number;

        switch(this._category)
        {
            case RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE:
                categoryCode = 2;
                break;
            case RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL:
                categoryCode = 1;
                break;
            default:
                return [];
        }

        return [categoryCode, this._objectId, this._confirmed];
    }
}
