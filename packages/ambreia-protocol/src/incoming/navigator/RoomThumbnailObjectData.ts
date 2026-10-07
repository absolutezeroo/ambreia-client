/**
 * Object in a room thumbnail
 *
 * Based on AS3 com.sulake.habbo.communication.messages.incoming.navigator.class_1788
 */
export class RoomThumbnailObjectData
{
    private _pos: number = 0;

    get pos(): number
    {
        return this._pos;
    }

    set pos(value: number)
    {
        this._pos = value;
    }

    private _imgId: number = 0;

    get imgId(): number
    {
        return this._imgId;
    }

    set imgId(value: number)
    {
        this._imgId = value;
    }

    getCopy(): RoomThumbnailObjectData
    {
        const copy = new RoomThumbnailObjectData();
        copy._pos = this._pos;
        copy._imgId = this._imgId;
        return copy;
    }
}
