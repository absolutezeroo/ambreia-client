import {getXmlAttribute, getXmlRoot} from '../AvatarXmlUtils';

/**
 * Defines the relationship between a body part and its set types,
 * including flipping and removal mappings.
 *
 * @see sources/win63_version/habbo/avatar/structure/parts/PartDefinition.as
 */
export class PartDefinition
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::PartDefinition()
    constructor(data: any)
    {
        const element = getXmlRoot(data);

        this._setType = element ? getXmlAttribute(element, 'set-type') : String(data.setType ?? data['set-type'] ?? '');
        this._flippedSetType = element ? getXmlAttribute(element, 'flipped-set-type') : String(data.flippedSetType ?? data['flipped-set-type'] ?? '');
        this._removeSetType = element ? getXmlAttribute(element, 'remove-set-type') : String(data.removeSetType ?? data['remove-set-type'] ?? '');
        this._appendToFigure = false;
        this._staticId = -1;
    }

    private _setType: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::get setType()
    public get setType(): string
    {
        return this._setType;
    }

    private _flippedSetType: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::get flippedSetType()
    public get flippedSetType(): string
    {
        return this._flippedSetType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::set flippedSetType()
    public set flippedSetType(value: string)
    {
        this._flippedSetType = value;
    }

    private _removeSetType: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::get removeSetType()
    public get removeSetType(): string
    {
        return this._removeSetType;
    }

    private _appendToFigure: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::get appendToFigure()
    public get appendToFigure(): boolean
    {
        return this._appendToFigure;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::set appendToFigure()
    public set appendToFigure(value: boolean)
    {
        this._appendToFigure = value;
    }

    private _staticId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::get staticId()
    public get staticId(): number
    {
        return this._staticId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::set staticId()
    public set staticId(value: number)
    {
        this._staticId = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/PartDefinition.as::hasStaticId()
    public hasStaticId(): boolean
    {
        return this._staticId >= 0;
    }
}