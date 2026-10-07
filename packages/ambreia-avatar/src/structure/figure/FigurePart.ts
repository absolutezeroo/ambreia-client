import type {IFigurePart} from './IFigurePart';
import {getXmlAttribute, getXmlRoot} from '../AvatarXmlUtils';

/**
 * Represents a single figure part parsed from figure data XML.
 *
 * @see sources/win63_version/habbo/avatar/structure/figure/FigurePart.as
 */
export class FigurePart implements IFigurePart
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePart.as::FigurePart()
    constructor(data: any)
    {
        const element = getXmlRoot(data);

        this._id = parseInt(element ? getXmlAttribute(element, 'id') : data.id) || 0;
        this._type = element ? getXmlAttribute(element, 'type') : String(data.type || '');
        this._index = parseInt(element ? getXmlAttribute(element, 'index') : data.index) || 0;
        this._colorLayerIndex = parseInt(element ? getXmlAttribute(element, 'colorindex') : data.colorindex) || 0;

        const breed = element ? getXmlAttribute(element, 'breed') : String(data.breed ?? '');
        this._breed = (breed !== '') ? parseInt(breed) : -1;

        const paletteMapId = element ? getXmlAttribute(element, 'palettemapid') : String(data.palettemapid ?? '');
        this._paletteMap = (paletteMapId !== '') ? parseInt(paletteMapId) : -1;
    }

    private _id: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePart.as::get id()
    public get id(): number
    {
        return this._id;
    }

    private _type: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePart.as::get type()
    public get type(): string
    {
        return this._type;
    }

    private _breed: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePart.as::get breed()
    public get breed(): number
    {
        return this._breed;
    }

    private _colorLayerIndex: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePart.as::get colorLayerIndex()
    public get colorLayerIndex(): number
    {
        return this._colorLayerIndex;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePart.as::_index
    private _index: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePart.as::get index()
    public get index(): number
    {
        return this._index;
    }

    private _paletteMap: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePart.as::get paletteMap()
    public get paletteMap(): number
    {
        return this._paletteMap;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePart.as::dispose()
    public dispose(): void
    {
    }
}