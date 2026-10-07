/**
 * Badge image info holder
 * @see source_as_win63/habbo/session/BadgeInfo.as
 */
export class BadgeInfo
{
    constructor(image: HTMLImageElement | null, placeHolder: boolean)
    {
        this._image = image;
        this._placeHolder = placeHolder;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/BadgeInfo.as::_image
    private _image: HTMLImageElement | null;

    // AS3: .../src/com/sulake/habbo/session/BadgeInfo.as::get image()
    get image(): HTMLImageElement | null
    {
        return this._image;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/BadgeInfo.as::_placeHolder
    private _placeHolder: boolean;

    // AS3: .../src/com/sulake/habbo/session/BadgeInfo.as::get placeHolder()
    get placeHolder(): boolean
    {
        return this._placeHolder;
    }
}
