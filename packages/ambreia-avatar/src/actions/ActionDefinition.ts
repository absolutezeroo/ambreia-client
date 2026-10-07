import type {IActionDefinition} from './IActionDefinition';
import {ActionType} from './ActionType';
import {getXmlAttribute, getXmlChildElements, getXmlRoot} from '../structure/AvatarXmlUtils';

/**
 * Defines an avatar action with its configuration, parameters, types, and offsets.
 * Parsed from AS3 XML.
 *
 * @see sources/win63_version/habbo/avatar/actions/ActionDefinition.as
 */
export class ActionDefinition implements IActionDefinition
{
    private _prevents: string[];
    private _preventHeadTurn: boolean;
    private _offsets: Map<string, Map<number, number[]>> | null = null;
    private _types: Map<string, ActionType>;
    private _defaultParam: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::ActionDefinition()
    constructor(data: any = null)
    {
        this._prevents = [];
        this._types = new Map();
        this._params = new Map();
        this._id = '';
        this._state = '';
        this._precedence = 0;
        this._activePartSet = '';
        this._assetPartDefinition = '';
        this._lay = '';
        this._geometryType = '';
        this._isMain = false;
        this._isDefault = false;
        this._isAnimation = false;
        this._startFromFrameZero = false;
        this._preventHeadTurn = false;

        if(data !== null)
        {
            this.createFromData(data);
        }
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get id()
    public get id(): string
    {
        return this._id;
    }

    private _state: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get state()
    public get state(): string
    {
        return this._state;
    }

    private _precedence: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get precedence()
    public get precedence(): number
    {
        return this._precedence;
    }

    private _activePartSet: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get activePartSet()
    public get activePartSet(): string
    {
        return this._activePartSet;
    }

    private _assetPartDefinition: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get assetPartDefinition()
    public get assetPartDefinition(): string
    {
        return this._assetPartDefinition;
    }

    private _lay: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get lay()
    public get lay(): string
    {
        return this._lay;
    }

    private _geometryType: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get geometryType()
    public get geometryType(): string
    {
        return this._geometryType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::_isMain
    private _isMain: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get isMain()
    public get isMain(): boolean
    {
        return this._isMain;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::_isDefault
    private _isDefault: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get isDefault()
    public get isDefault(): boolean
    {
        return this._isDefault;
    }

    private _isAnimation: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get isAnimation()
    public get isAnimation(): boolean
    {
        return this._isAnimation;
    }

    private _startFromFrameZero: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get startFromFrameZero()
    public get startFromFrameZero(): boolean
    {
        return this._startFromFrameZero;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::_params
    private _params: Map<string, string>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::get params()
    public get params(): Map<string, string>
    {
        return this._params;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::setOffsets()
    public setOffsets(setType: string, direction: number, offsets: number[]): void
    {
        if(!this._offsets)
        {
            this._offsets = new Map();
        }

        if(!this._offsets.has(setType))
        {
            this._offsets.set(setType, new Map());
        }

        const directionMap = this._offsets.get(setType)!;
        directionMap.set(direction, offsets);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::getOffsets()
    public getOffsets(setType: string, direction: number): number[] | null
    {
        if(!this._offsets) return null;

        const directionMap = this._offsets.get(setType);

        if(!directionMap) return null;

        return directionMap.get(direction) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::getParameterValue()
    public getParameterValue(key: string): string
    {
        if(key === '') return '';

        const value = this._params.get(key);

        if(value === undefined)
        {
            return this._defaultParam;
        }

        return value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::getPrevents()
    public getPrevents(id: string = ''): string[]
    {
        const typePrevents = this.getTypePrevents(id);

        if(typePrevents.length === 0) return this._prevents;
        if(this._prevents.length === 0) return typePrevents;

        const result = [...this._prevents];
        result.push(...typePrevents);

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::getPreventHeadTurn()
    public getPreventHeadTurn(id: string = ''): boolean
    {
        if(id === '')
        {
            return this._preventHeadTurn;
        }

        const actionType = this._types.get(id);

        if(actionType)
        {
            return actionType.preventHeadTurn;
        }

        return this._preventHeadTurn;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::isAnimated()
    public isAnimated(part: string): boolean
    {
        if(part === '') return true;

        const actionType = this._types.get(part);

        if(actionType)
        {
            return actionType.isAnimated;
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::setGeometryType()
    public setGeometryType(value: string): void
    {
        this._geometryType = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::setState()
    public setState(value: string): void
    {
        this._state = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::setAssetPartDefinition()
    public setAssetPartDefinition(value: string): void
    {
        this._assetPartDefinition = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::copy()
    public copy(): ActionDefinition
    {
        const copy = new ActionDefinition();

        copy._id = this._id;
        copy._state = this._state;
        copy._precedence = this._precedence;
        copy._activePartSet = this._activePartSet;
        copy._assetPartDefinition = this._assetPartDefinition;
        copy._lay = this._lay;
        copy._geometryType = this._geometryType;
        copy._isMain = this._isMain;
        copy._isDefault = this._isDefault;
        copy._isAnimation = this._isAnimation;
        copy._startFromFrameZero = this._startFromFrameZero;
        copy._prevents = this._prevents;
        copy._preventHeadTurn = this._preventHeadTurn;
        copy._offsets = this._offsets;
        copy._types = this._types;
        copy._params = this._params;
        copy._defaultParam = this._defaultParam;

        return copy;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::toString()
    public toString(): string
    {
        return '[ActionDefinition]\n'
			+ 'id:           ' + this._id + '\n'
			+ 'state:        ' + this._state + '\n'
			+ 'main:         ' + this._isMain + '\n'
			+ 'default:      ' + this._isDefault + '\n'
			+ 'geometry:     ' + this._state + '\n'
			+ 'precedence:   ' + this._precedence + '\n'
			+ 'activepartset:' + this._activePartSet + '\n'
			+ 'activepartdef:' + this._assetPartDefinition;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::createFromXml()
    private createFromData(data: any): void
    {
        const element = getXmlRoot(data);

        this._id = element ? getXmlAttribute(element, 'id') : String(data.id ?? '');
        this._state = element ? getXmlAttribute(element, 'state') : String(data.state ?? '');
        this._precedence = parseInt(element ? getXmlAttribute(element, 'precedence') : data.precedence) || 0;
        this._activePartSet = element ? getXmlAttribute(element, 'activepartset') : String(data.activePartSet ?? data.activepartset ?? '');
        this._assetPartDefinition = element ? getXmlAttribute(element, 'assetpartdefinition') : String(data.assetPartDefinition ?? data.assetpartdefinition ?? '');
        this._lay = element ? getXmlAttribute(element, 'lay') : String(data.lay ?? '');
        this._geometryType = element ? getXmlAttribute(element, 'geometrytype') : String(data.geometryType ?? data.geometrytype ?? '');
        this._isMain = element ? Boolean(parseInt(getXmlAttribute(element, 'main'))) : Boolean(typeof data.main === 'boolean' ? data.main : parseInt(data.main));
        this._isDefault = element ? Boolean(parseInt(getXmlAttribute(element, 'isdefault'))) : Boolean(data.isDefault ?? (data.isdefault !== undefined ? parseInt(data.isdefault) : false));
        this._isAnimation = element ? Boolean(parseInt(getXmlAttribute(element, 'animation'))) : Boolean(typeof data.animation === 'boolean' ? data.animation : parseInt(data.animation));
        this._startFromFrameZero = element ? getXmlAttribute(element, 'startfromframezero') === 'true' : Boolean(data.startFromFrameZero ?? (String(data.startfromframezero) === 'true'));
        this._preventHeadTurn = element ? getXmlAttribute(element, 'preventheadturn') === 'true' : Boolean(data.preventHeadTurn ?? (String(data.preventheadturn) === 'true'));

        const prevents = element ? getXmlAttribute(element, 'prevents') : String(data.prevents ?? '');

        if(prevents !== '')
        {
            this._prevents = Array.isArray(data.prevents) ? data.prevents : prevents.split(',');
        }

        if(element)
        {
            for(const paramElement of getXmlChildElements(element, 'param'))
            {
                const paramId = getXmlAttribute(paramElement, 'id');
                const paramValue = getXmlAttribute(paramElement, 'value');

                if(paramId === 'default')
                {
                    this._defaultParam = paramValue;
                }
                else
                {
                    this._params.set(paramId, paramValue);
                }
            }

            for(const typeElement of getXmlChildElements(element, 'type'))
            {
                this._types.set(getXmlAttribute(typeElement, 'id'), new ActionType(typeElement));
            }

            return;
        }

        if(data.params)
        {
            const params: any[] = Array.isArray(data.params) ? data.params : [data.params];

            for(const param of params)
            {
                const paramId = String(param.id ?? '');
                const paramValue = String(param.value ?? '');

                if(paramId === 'default')
                {
                    this._defaultParam = paramValue;
                }
                else
                {
                    this._params.set(paramId, paramValue);
                }
            }
        }

        if(data.types)
        {
            const types: any[] = Array.isArray(data.types) ? data.types : [data.types];

            for(const typeData of types)
            {
                const typeId = String(typeData.id ?? '');
                this._types.set(typeId, new ActionType(typeData));
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActionDefinition.as::getTypePrevents()
    private getTypePrevents(id: string): string[]
    {
        if(id === '') return [];

        const actionType = this._types.get(id);

        if(actionType)
        {
            return actionType.prevents;
        }

        return [];
    }
}