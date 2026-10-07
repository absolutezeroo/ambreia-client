import {MessageComposer} from '@ambreia/net/messages/MessageComposer';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';

/**
 * Places a new object (from inventory) into the active room.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2135.as
 *
 * One composer, two wire formats, chosen by the object's category — AS3 switches on
 * `category - 10`, so only 10 (floor furniture) and 20 (wall items) produce anything at all and
 * every other category sends an empty array.
 *
 * A wall item carries no coordinates: its whole position is the `wallLocation` string that
 * `LegacyWallGeometry.getOldLocationString()` builds (":w=wallX,wallY l=localX,localY side").
 */
export class PlaceObjectMessageComposer extends MessageComposer<[string]>
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2135.as::getMessageArray()
    // backing fields — the six constructor-assigned members. Their AS3 identifiers are obfuscated in
    // every available tree, so there is no real name to trace each one to individually.
    private _itemId: number;
    private _category: number;
    private _wallLocation: string;
    private _x: number;
    private _y: number;
    private _rotation: number;

    constructor(
        itemId: number,
        category: number,
        wallLocation: string,
        x: number,
        y: number,
        rotation: number
    )
    {
        super();

        this._itemId = itemId;
        this._category = category;
        this._wallLocation = wallLocation;
        this._x = x;
        this._y = y;
        this._rotation = rotation;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2135.as::getMessageArray()
    getMessageArray(): [string]
    {
        if(this._category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
        {
            return [`${this._itemId} ${this._x} ${this._y} ${this._rotation}`];
        }

        if(this._category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            return [`${this._itemId} ${this._wallLocation}`];
        }

        // AS3 returns a zero-length array here, which puts no field on the wire at all; this port's
        // MessageComposer is typed to one string, so it sends an empty one instead. Unreachable in
        // practice — placeObject() only ever selects this composer for category 10 or 20.
        return [''];
    }
}
