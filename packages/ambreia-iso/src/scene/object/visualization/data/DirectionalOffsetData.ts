/**
 * DirectionalOffsetData
 *
 * @see com.sulake.habbo.room.object.visualization.data.class_3534
 *
 * Offsets x/y per direction for animation frames.
 */
export class DirectionalOffsetData
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/DirectionalOffsetData.as::_offsetX
    private _offsetX: Map<number, number> = new Map();
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/DirectionalOffsetData.as::_offsetY
    private _offsetY: Map<number, number> = new Map();

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/DirectionalOffsetData.as::getOffsetX()
    getOffsetX(direction: number, defaultValue: number): number
    {
        const value = this._offsetX.get(direction);

        if(value === undefined)
        {
            return defaultValue;
        }

        return value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/DirectionalOffsetData.as::getOffsetY()
    getOffsetY(direction: number, defaultValue: number): number
    {
        const value = this._offsetY.get(direction);

        if(value === undefined)
        {
            return defaultValue;
        }

        return value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/DirectionalOffsetData.as::setOffset()
    setOffset(direction: number, x: number, y: number): void
    {
        this._offsetX.set(direction, x);
        this._offsetY.set(direction, y);
    }
}
