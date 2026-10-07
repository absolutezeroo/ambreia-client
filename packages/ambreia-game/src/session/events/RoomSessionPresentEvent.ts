import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session present event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionPresentEvent.as
 */
export class RoomSessionPresentEvent extends RoomSessionEvent
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::RSPE_PRESENT_OPENED
    public static readonly RSPE_PRESENT_OPENED = 'RSPE_PRESENT_OPENED';

    constructor(
        type: string,
        session: IRoomSession,
        classId: number,
        itemType: string,
        productCode: string,
        placedItemId: number,
        placedItemType: string,
        placedInRoom: boolean,
        petFigureString: string
    )
    {
        super(type, session);
        this._classId = classId;
        this._itemType = itemType;
        this._productCode = productCode;
        this._placedItemId = placedItemId;
        this._placedItemType = placedItemType;
        this._placedInRoom = placedInRoom;
        this._petFigureString = petFigureString;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::_classId
    private _classId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::get classId()
    get classId(): number
    {
        return this._classId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::_itemType
    private _itemType: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::get itemType()
    get itemType(): string
    {
        return this._itemType;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::_productCode
    private _productCode: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::get productCode()
    get productCode(): string
    {
        return this._productCode;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::_placedItemId
    private _placedItemId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::get placedItemId()
    get placedItemId(): number
    {
        return this._placedItemId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::_placedItemType
    private _placedItemType: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::get placedItemType()
    get placedItemType(): string
    {
        return this._placedItemType;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::_placedInRoom
    private _placedInRoom: boolean;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::get placedInRoom()
    get placedInRoom(): boolean
    {
        return this._placedInRoom;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::_petFigureString
    private _petFigureString: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPresentEvent.as::get petFigureString()
    get petFigureString(): string
    {
        return this._petFigureString;
    }
}
