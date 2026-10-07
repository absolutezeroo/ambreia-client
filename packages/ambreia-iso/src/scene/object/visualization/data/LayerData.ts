/**
 * LayerData
 *
 * @see com.sulake.habbo.room.object.visualization.data.class_3646
 *
 * Per-layer visualization properties: tag, ink, alpha, offsets, ignoreMouse.
 */
export class LayerData
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::DEFAULT_TAG
    public static readonly DEFAULT_TAG: string = '';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::DEFAULT_INK
    public static readonly DEFAULT_INK: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::DEFAULT_ALPHA
    public static readonly DEFAULT_ALPHA: number = 255;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::DEFAULT_IGNORE_MOUSE
    public static readonly DEFAULT_IGNORE_MOUSE: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::DEFAULT_X_OFFSET
    public static readonly DEFAULT_X_OFFSET: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::DEFAULT_Y_OFFSET
    public static readonly DEFAULT_Y_OFFSET: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::DEFAULT_Z_OFFSET
    public static readonly DEFAULT_Z_OFFSET: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::INK_ADD
    public static readonly INK_ADD: number = 1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::INK_SUBTRACT
    public static readonly INK_SUBTRACT: number = 2;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::INK_DARKEN
    public static readonly INK_DARKEN: number = 3;
    public static readonly INK_DIFFERENCE: number = 4;
    public static readonly INK_MULTIPLY: number = 5;
    public static readonly INK_INVERT: number = 6;
    public static readonly INK_SCREEN: number = 7;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::_tag
    private _tag: string = '';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::get tag()
    get tag(): string
    {
        return this._tag;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::set tag()
    set tag(value: string)
    {
        this._tag = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::_ink
    private _ink: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::get ink()
    get ink(): number
    {
        return this._ink;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::set ink()
    set ink(value: number)
    {
        this._ink = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::_alpha
    private _alpha: number = 255;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::get alpha()
    get alpha(): number
    {
        return this._alpha;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::set alpha()
    set alpha(value: number)
    {
        this._alpha = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::_ignoreMouse
    private _ignoreMouse: boolean = false;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::get ignoreMouse()
    get ignoreMouse(): boolean
    {
        return this._ignoreMouse;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::set ignoreMouse()
    set ignoreMouse(value: boolean)
    {
        this._ignoreMouse = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::_xOffset
    private _xOffset: number = 0;

    get xOffset(): number
    {
        return this._xOffset;
    }

    set xOffset(value: number)
    {
        this._xOffset = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::_yOffset
    private _yOffset: number = 0;

    get yOffset(): number
    {
        return this._yOffset;
    }

    set yOffset(value: number)
    {
        this._yOffset = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/LayerData.as::_zOffset
    private _zOffset: number = 0;

    get zOffset(): number
    {
        return this._zOffset;
    }

    set zOffset(value: number)
    {
        this._zOffset = value;
    }

    copyValues(other: LayerData): void
    {
        if(other !== null)
        {
            this._tag = other.tag;
            this._ink = other.ink;
            this._alpha = other.alpha;
            this._ignoreMouse = other.ignoreMouse;
            this._xOffset = other.xOffset;
            this._yOffset = other.yOffset;
            this._zOffset = other.zOffset;
        }
    }
}
