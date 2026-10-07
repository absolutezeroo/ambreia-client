/**
 * One sprite as the room-photo payload describes it.
 *
 * This is the record the camera serialises, not the record the renderer draws: `SortableSprite`
 * next door is the draw-order entry, holding a live `IRoomObjectSprite` and a z. This one is flat,
 * resolved and independent of the sprite it came from, which is what lets `SpriteDataCollector`
 * merge culled avatars and mannequin parts into the same list and then sort the lot.
 *
 * Every field is public and mutable, as AS3 declares them — the merge passes in
 * `getFurniData()` add offsets to `x`/`y`/`z` in place.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as
 */
export class RoomObjectSpriteData
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::objectId
    public objectId: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::x
    public x: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::y
    public y: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::z
    public z: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::name
    public name: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::blendMode
    public blendMode: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::flipH
    public flipH: boolean = false;

    /**
     * A horizontal shear, set only for the two sprite kinds that are drawn on a wall at an angle —
     * see `isSkewedSprite()` on the canvas. Zero means no shear, which is every other sprite.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::skew
    public skew: number = 0;

    /** Whether the renderer should draw a picture frame around this sprite. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::frame
    public frame: boolean = false;

    /**
     * A string, not a number, because AS3 assigns `sprite.color.toString()` — and for the sprites
     * whose pixels are fetched at render time it assigns the *average* colour instead, so the
     * payload can stand in for an image it cannot include.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::color
    public color: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::alpha
    public alpha: number = 255;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::width
    public width: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::height
    public height: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::objectType
    public objectType: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/data/RoomObjectSpriteData.as::posture
    public posture: string = '';
}
