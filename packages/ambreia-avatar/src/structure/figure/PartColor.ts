import type {IPartColor} from './IPartColor';
import {getXmlAttribute, getXmlRoot, getXmlText} from '../AvatarXmlUtils';

/**
 * Represents a color entry parsed from a palette in figure data XML.
 *
 * @see sources/win63_version/habbo/avatar/structure/figure/PartColor.as
 */
export class PartColor implements IPartColor
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::PartColor()
    constructor(data: any)
    {
        const element = getXmlRoot(data);

        this._id = parseInt(element ? getXmlAttribute(element, 'id') : data.id) || 0;
        this._index = parseInt(element ? getXmlAttribute(element, 'index') : data.index) || 0;
        this._clubLevel = parseInt(element ? getXmlAttribute(element, 'club') : data.club) || 0;
        this._isSelectable = element
            ? Boolean(parseInt(getXmlAttribute(element, 'selectable')))
            : Boolean(typeof data.selectable === 'boolean' ? data.selectable : parseInt(data.selectable));

        const colorHex = element ? getXmlText(element) : String(data.hexCode || data.color || '0');
        this._rgb = parseInt(colorHex, 16);
        this._r = (this._rgb >> 16) & 0xFF;
        this._g = (this._rgb >> 8) & 0xFF;
        this._b = this._rgb & 0xFF;
        this._redMultiplier = (this._r / 255) * 1;
        this._greenMultiplier = (this._g / 255) * 1;
        this._blueMultiplier = (this._b / 255) * 1;
        this._colorTransform = {
            redMultiplier: this._redMultiplier,
            greenMultiplier: this._greenMultiplier,
            blueMultiplier: this._blueMultiplier
        };
    }

    private _id: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get id()
    public get id(): number
    {
        return this._id;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::_index
    private _index: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get index()
    public get index(): number
    {
        return this._index;
    }

    private _clubLevel: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get clubLevel()
    public get clubLevel(): number
    {
        return this._clubLevel;
    }

    private _isSelectable: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get isSelectable()
    public get isSelectable(): boolean
    {
        return this._isSelectable;
    }

    private _rgb: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get rgb()
    public get rgb(): number
    {
        return this._rgb;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::_r
    private _r: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get r()
    public get r(): number
    {
        return this._r;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::_g
    private _g: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get g()
    public get g(): number
    {
        return this._g;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::_b
    private _b: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get b()
    public get b(): number
    {
        return this._b;
    }

    private _redMultiplier: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get redMultiplier()
    public get redMultiplier(): number
    {
        return this._redMultiplier;
    }

    private _greenMultiplier: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get greenMultiplier()
    public get greenMultiplier(): number
    {
        return this._greenMultiplier;
    }

    private _blueMultiplier: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get blueMultiplier()
    public get blueMultiplier(): number
    {
        return this._blueMultiplier;
    }

    private _colorTransform: { redMultiplier: number; greenMultiplier: number; blueMultiplier: number };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/PartColor.as::get colorTransform()
    public get colorTransform(): { redMultiplier: number; greenMultiplier: number; blueMultiplier: number }
    {
        return this._colorTransform;
    }
}