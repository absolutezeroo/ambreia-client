import {AvatarScaleType} from '../enum/AvatarScaleType';
import {getXmlAttribute, getXmlRoot} from './AvatarXmlUtils';

/**
 * Data class representing a canvas configuration for avatar rendering.
 * Parsed from AS3 XML or converted JSON with properties: id, width, height, dx, dy.
 *
 * @see sources/win63_version/habbo/avatar/structure/AvatarCanvas.as
 */
export class AvatarCanvas
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarCanvas.as::AvatarCanvas()
    constructor(data: any, scale: string)
    {
        const element = getXmlRoot(data);

        this._id = element ? getXmlAttribute(element, 'id') : String(data.id);
        this._width = parseInt(element ? getXmlAttribute(element, 'width') : data.width) || 0;
        this._height = parseInt(element ? getXmlAttribute(element, 'height') : data.height) || 0;
        this._offset = {
            x: parseInt(element ? getXmlAttribute(element, 'dx') : data.dx) || 0,
            y: parseInt(element ? getXmlAttribute(element, 'dy') : data.dy) || 0
        };

        if(scale === AvatarScaleType.LARGE)
        {
            this._regPoint = {x: (this._width - 64) / 2, y: 0};
        }
        else
        {
            this._regPoint = {x: (this._width - 32) / 2, y: 0};
        }
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarCanvas.as::get id()
    public get id(): string
    {
        return this._id;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarCanvas.as::_width
    private _width: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarCanvas.as::get width()
    public get width(): number
    {
        return this._width;
    }

    private _height: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarCanvas.as::get height()
    public get height(): number
    {
        return this._height;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarCanvas.as::_offset
    private _offset: { x: number; y: number };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarCanvas.as::get offset()
    public get offset(): { x: number; y: number }
    {
        return this._offset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarCanvas.as::_regPoint
    private _regPoint: { x: number; y: number };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarCanvas.as::get regPoint()
    public get regPoint(): { x: number; y: number }
    {
        return this._regPoint;
    }
}