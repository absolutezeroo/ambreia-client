/**
 * ObjectMouseData
 *
 * Based on AS3: com.sulake.room.renderer.utils.ObjectMouseData
 *
 * Tracks mouse hover state for a room object.
 * Stores the object identifier and the sprite tag currently under the mouse.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/ObjectMouseData.as
 */
export class ObjectMouseData 
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/ObjectMouseData.as::_objectId
    private _objectId: string = '';

    get objectId(): string 
    {
        return this._objectId;
    }

    set objectId(value: string) 
    {
        this._objectId = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/ObjectMouseData.as::_spriteTag
    private _spriteTag: string = '';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/ObjectMouseData.as::get spriteTag()
    get spriteTag(): string 
    {
        return this._spriteTag;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/utils/ObjectMouseData.as::set spriteTag()
    set spriteTag(value: string) 
    {
        this._spriteTag = value;
    }
}
