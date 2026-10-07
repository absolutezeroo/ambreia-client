import type {IRoomObjectSprite} from './IRoomObjectSprite';

/**
 * A sprite with a position in the room's sort order.
 *
 * The renderer builds a flat list of these each frame and sorts it by `z` descending; the photo
 * serialiser walks the same list. `SortableSprite` is the implementation.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/ISortableSprite.as
 */
export interface ISortableSprite
{
    // AS3: .../src/com/sulake/room/object/visualization/ISortableSprite.as::get x()
    readonly x: number;

    // AS3: .../src/com/sulake/room/object/visualization/ISortableSprite.as::get y()
    readonly y: number;

    // AS3: .../src/com/sulake/room/object/visualization/ISortableSprite.as::get z()
    readonly z: number;

    // AS3: .../src/com/sulake/room/object/visualization/ISortableSprite.as::get sprite()
    readonly sprite: IRoomObjectSprite | null;
}
