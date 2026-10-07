import {getXmlAttribute, getXmlRoot} from '../structure/AvatarXmlUtils';

/**
 * Represents an action type with its behavioral flags, parsed from AS3 XML.
 *
 * @see sources/win63_version/habbo/avatar/actions/ActionType.as
 */
export class ActionType
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionType.as::ActionType()
    constructor(data: any)
    {
        const element = getXmlRoot(data);
        const value = element ? getXmlAttribute(element, 'value') : data.value;

        this._id = parseInt(value) || 0;
        this._value = parseInt(value) || 0;
        this._prevents = [];
        this._preventHeadTurn = true;
        this._isAnimated = true;

        const prevents = element ? getXmlAttribute(element, 'prevents') : String(data.prevents ?? '');

        if(prevents !== '')
        {
            this._prevents = prevents.split(',');
        }

        this._preventHeadTurn = (element ? getXmlAttribute(element, 'preventheadturn') : String(data.preventheadturn)) === 'true';

        const animated = element ? getXmlAttribute(element, 'animated') : String(data.animated ?? '');

        if(animated === '')
        {
            this._isAnimated = true;
        }
        else
        {
            this._isAnimated = (animated === 'true');
        }
    }

    private _id: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionType.as::get id()
    public get id(): number
    {
        return this._id;
    }

    // AS3: sources/win63_version/habbo/avatar/actions/ActionType.as::_value
    private _value: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionType.as::get value()
    public get value(): number
    {
        return this._value;
    }

    private _prevents: string[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionType.as::get prevents()
    public get prevents(): string[]
    {
        return this._prevents;
    }

    private _preventHeadTurn: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionType.as::get preventHeadTurn()
    public get preventHeadTurn(): boolean
    {
        return this._preventHeadTurn;
    }

    private _isAnimated: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionType.as::get isAnimated()
    public get isAnimated(): boolean
    {
        return this._isAnimated;
    }
}