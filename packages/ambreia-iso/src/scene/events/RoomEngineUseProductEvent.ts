/**
 * RoomEngineUseProductEvent
 *
 * @see source_as_win63/habbo/room/events/RoomEngineUseProductEvent.as
 *
 * Event dispatched when using a product on a room object (e.g. pet food).
 */
import {RoomEngineObjectEvent} from './RoomEngineObjectEvent';

export class RoomEngineUseProductEvent extends RoomEngineObjectEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineUseProductEvent.as::USE_PRODUCT_FROM_ROOM
    public static readonly USE_PRODUCT_FROM_ROOM = 'ROSM_USE_PRODUCT_FROM_ROOM';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineUseProductEvent.as::USE_PRODUCT_FROM_INVENTORY
    public static readonly USE_PRODUCT_FROM_INVENTORY = 'ROSM_USE_PRODUCT_FROM_INVENTORY';

    constructor(
        type: string,
        roomId: number,
        objectId: number,
        category: number,
        inventoryStripId: number = -1,
        furnitureTypeId: number = -1
    )
    {
        super(type, roomId, objectId, category);
        this._inventoryStripId = inventoryStripId;
        this._furnitureTypeId = furnitureTypeId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineUseProductEvent.as::_inventoryStripId
    private _inventoryStripId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineUseProductEvent.as::get inventoryStripId()
    get inventoryStripId(): number
    {
        return this._inventoryStripId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineUseProductEvent.as::_furnitureTypeId
    private _furnitureTypeId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineUseProductEvent.as::get furnitureTypeId()
    get furnitureTypeId(): number
    {
        return this._furnitureTypeId;
    }
}
