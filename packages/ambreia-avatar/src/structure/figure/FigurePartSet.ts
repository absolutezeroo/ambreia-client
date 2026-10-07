import type {IFigurePart} from './IFigurePart';
import type {IFigurePartSet} from './IFigurePartSet';
import {FigurePart} from './FigurePart';
import {getXmlAttribute, getXmlChildElements, getXmlFirstChildElement, getXmlRoot} from '../AvatarXmlUtils';

/**
 * Represents a set of figure parts parsed from figure data XML.
 *
 * @see sources/win63_version/habbo/avatar/structure/figure/FigurePartSet.as
 */
export class FigurePartSet implements IFigurePartSet
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::FigurePartSet()
    constructor(data: any, type: string)
    {
        const element = getXmlRoot(data);

        this._type = type;
        this._id = parseInt(element ? getXmlAttribute(element, 'id') : data.id) || 0;
        this._gender = element ? getXmlAttribute(element, 'gender') : String(data.gender || '');
        this._clubLevel = parseInt(element ? getXmlAttribute(element, 'club') : data.club) || 0;
        this._isColorable = element
            ? Boolean(parseInt(getXmlAttribute(element, 'colorable')))
            : Boolean(typeof data.colorable === 'boolean' ? data.colorable : parseInt(data.colorable));
        this._isSelectable = element
            ? Boolean(parseInt(getXmlAttribute(element, 'selectable')))
            : Boolean(typeof data.selectable === 'boolean' ? data.selectable : parseInt(data.selectable));
        this._isPreSelectable = element
            ? Boolean(parseInt(getXmlAttribute(element, 'preselectable')))
            : Boolean(typeof data.preselectable === 'boolean' ? data.preselectable : parseInt(data.preselectable));
        this._isSellable = element
            ? Boolean(parseInt(getXmlAttribute(element, 'sellable')))
            : Boolean(typeof data.sellable === 'boolean' ? data.sellable : parseInt(data.sellable));
        this._parts = [];
        this._hiddenLayers = [];

        if(element)
        {
            for(const partElement of getXmlChildElements(element, 'part'))
            {
                this.addPart(new FigurePart(partElement));
            }

            const hiddenLayersElement = getXmlFirstChildElement(element, 'hiddenlayers');

            if(hiddenLayersElement !== null)
            {
                for(const layerElement of getXmlChildElements(hiddenLayersElement, 'layer'))
                {
                    this._hiddenLayers.push(getXmlAttribute(layerElement, 'parttype'));
                }
            }

            return;
        }

        const rawParts = data.parts?.part || data.parts || data.part;

        if(rawParts)
        {
            const parts: any[] = Array.isArray(rawParts) ? rawParts : [rawParts];

            for(const partData of parts)
            {
                this.addPart(new FigurePart(partData));
            }
        }

        if(data.hiddenLayers)
        {
            const layers: any[] = Array.isArray(data.hiddenLayers) ? data.hiddenLayers : [data.hiddenLayers];

            for(const layer of layers)
            {
                this._hiddenLayers.push(String(layer.partType || layer.parttype));
            }
        }
        else if(data.hiddenlayers && data.hiddenlayers.layer)
        {
            const layers: any[] = Array.isArray(data.hiddenlayers.layer)
                ? data.hiddenlayers.layer
                : [data.hiddenlayers.layer];

            for(const layer of layers)
            {
                this._hiddenLayers.push(String(layer.parttype));
            }
        }
    }

    private _type: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get type()
    public get type(): string
    {
        return this._type;
    }

    private _id: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get id()
    public get id(): number
    {
        return this._id;
    }

    private _gender: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get gender()
    public get gender(): string
    {
        return this._gender;
    }

    private _clubLevel: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get clubLevel()
    public get clubLevel(): number
    {
        return this._clubLevel;
    }

    private _isColorable: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get isColorable()
    public get isColorable(): boolean
    {
        return this._isColorable;
    }

    private _isSelectable: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get isSelectable()
    public get isSelectable(): boolean
    {
        return this._isSelectable;
    }

    private _isPreSelectable: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get isPreSelectable()
    public get isPreSelectable(): boolean
    {
        return this._isPreSelectable;
    }

    private _isSellable: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get isSellable()
    public get isSellable(): boolean
    {
        return this._isSellable;
    }

    private _parts: IFigurePart[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get parts()
    public get parts(): IFigurePart[]
    {
        return this._parts;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::_hiddenLayers
    private _hiddenLayers: string[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::get hiddenLayers()
    public get hiddenLayers(): string[]
    {
        return this._hiddenLayers;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::getPart()
    public getPart(type: string, id: number): IFigurePart | null
    {
        for(const part of this._parts)
        {
            if(part.type === type && part.id === id)
            {
                return part;
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::dispose()
    public dispose(): void
    {
        this._parts = [];
        this._hiddenLayers = [];
    }

    private addPart(part: FigurePart): void
    {
        const insertIndex = this.indexOfPartType(part);

        if(insertIndex !== -1)
        {
            this._parts.splice(insertIndex, 0, part);
        }
        else
        {
            this._parts.push(part);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/FigurePartSet.as::indexOfPartType()
    private indexOfPartType(part: FigurePart): number
    {
        for(let i = 0; i < this._parts.length; i++)
        {
            const existing = this._parts[i];

            if(existing.type === part.type && existing.index < part.index)
            {
                return i;
            }
        }

        return -1;
    }
}