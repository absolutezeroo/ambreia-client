/**
 * RoomEngineObjectPlacedOnUserEvent
 *
 * @see source_as_win63/habbo/room/events/RoomEngineObjectPlacedOnUserEvent.as
 *
 * Event dispatched when an object is placed on a user (e.g. pet food on pet).
 */
import {RoomEngineObjectEvent} from './RoomEngineObjectEvent';

export class RoomEngineObjectPlacedOnUserEvent extends RoomEngineObjectEvent
{
    constructor(
        type: string,
        roomId: number,
        objectId: number,
        category: number,
        droppedObjectId: number,
        droppedObjectCategory: number
    )
    {
        super(type, roomId, objectId, category);
        this._droppedObjectId = droppedObjectId;
        this._droppedObjectCategory = droppedObjectCategory;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineObjectPlacedOnUserEvent.as::_droppedObjectId
    private _droppedObjectId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectPlacedOnUserEvent.as::get droppedObjectId()
    get droppedObjectId(): number
    {
        return this._droppedObjectId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineObjectPlacedOnUserEvent.as::_droppedObjectCategory
    private _droppedObjectCategory: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectPlacedOnUserEvent.as::get droppedObjectCategory()
    get droppedObjectCategory(): number
    {
        return this._droppedObjectCategory;
    }
}
