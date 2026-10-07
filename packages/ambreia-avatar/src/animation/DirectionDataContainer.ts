/**
 * Container for direction offset data in animations.
 *
 * @see sources/win63_version/habbo/avatar/animation/DirectionDataContainer.as
 */
export class DirectionDataContainer
{
    constructor(data: any)
    {
        this._offset = parseInt(data.offset) || 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/DirectionDataContainer.as::_offset
    private _offset: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/DirectionDataContainer.as::get offset()
    public get offset(): number
    {
        return this._offset;
    }
}
