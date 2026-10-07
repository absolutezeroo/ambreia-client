import type {IFigurePartSet} from './IFigurePartSet';
import type {ISetType} from './ISetType';
import {FigurePartSet} from './FigurePartSet';
import {getXmlAttribute, getXmlChildElements, getXmlRoot} from '../AvatarXmlUtils';

/**
 * Represents a figure set type containing part sets and mandatory configuration.
 * Parsed from AS3 XML figure data.
 *
 * @see sources/win63_version/habbo/avatar/structure/figure/SetType.as
 */
export class SetType implements ISetType
{
    private _isMandatory: Map<string, boolean[]>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::SetType()
    constructor(data: any)
    {
        const element = getXmlRoot(data);

        this._type = element ? getXmlAttribute(element, 'type') : String(data.type || '');
        this._paletteID = parseInt(element ? getXmlAttribute(element, 'paletteid') : (data.paletteId ?? data.paletteid)) || 0;

        this._isMandatory = new Map();
        this._isMandatory.set('F', [
            this.readMandatory(data, element, 'mandatory_f_0', 'mand_f_0'),
            this.readMandatory(data, element, 'mandatory_f_1', 'mand_f_1')
        ]);
        this._isMandatory.set('M', [
            this.readMandatory(data, element, 'mandatory_m_0', 'mand_m_0'),
            this.readMandatory(data, element, 'mandatory_m_1', 'mand_m_1')
        ]);

        this._partSets = new Map();
        this.append(data);
    }

    private _type: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::get type()
    public get type(): string
    {
        return this._type;
    }

    private _paletteID: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::get paletteID()
    public get paletteID(): number
    {
        return this._paletteID;
    }

    private _partSets: Map<string, IFigurePartSet>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::get partSets()
    public get partSets(): Map<string, IFigurePartSet>
    {
        return this._partSets;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::append()
    public append(data: any): void
    {
        const element = getXmlRoot(data);

        if(element)
        {
            for(const setElement of getXmlChildElements(element, 'set'))
            {
                this._partSets.set(getXmlAttribute(setElement, 'id'), new FigurePartSet(setElement, this._type));
            }

            return;
        }

        const rawSets = data.sets?.set || data.sets || data.set;

        if(!rawSets) return;

        const sets: any[] = Array.isArray(rawSets) ? rawSets : [rawSets];

        for(const setData of sets)
        {
            const id = String(setData.id);
            this._partSets.set(id, new FigurePartSet(setData, this._type));
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::cleanUp()
    public cleanUp(data: any): void
    {
        const element = getXmlRoot(data);

        if(element)
        {
            for(const setElement of getXmlChildElements(element, 'set'))
            {
                this._partSets.delete(getXmlAttribute(setElement, 'id'));
            }

            return;
        }

        const rawSets = data.sets?.set || data.sets || data.set;

        if(!rawSets) return;

        const sets: any[] = Array.isArray(rawSets) ? rawSets : [rawSets];

        for(const setData of sets)
        {
            const id = String(setData.id);
            this._partSets.delete(id);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::getDefaultPartSet()
    public getDefaultPartSet(gender: string): IFigurePartSet | null
    {
        const keys = Array.from(this._partSets.keys());

        for(let i = keys.length - 1; i >= 0; i--)
        {
            const partSet = this._partSets.get(keys[i])!;

            if(partSet && partSet.clubLevel === 0 && (partSet.gender === gender || partSet.gender === 'U'))
            {
                return partSet;
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::getPartSet()
    public getPartSet(id: number): IFigurePartSet | null
    {
        return this._partSets.get(String(id)) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::isMandatory()
    public isMandatory(gender: string, clubLevel: number): boolean
    {
        const mandatory = this._isMandatory.get(gender.toUpperCase());

        if(!mandatory) return false;

        return mandatory[Math.min(clubLevel, 1)];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::optionalFromClubLevel()
    public optionalFromClubLevel(gender: string): number
    {
        const mandatory = this._isMandatory.get(gender.toUpperCase());

        if(!mandatory) return -1;

        return mandatory.indexOf(false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/SetType.as::dispose()
    public dispose(): void
    {
        this._partSets.clear();
    }

    private readMandatory(data: any, element: Element | null, nitroName: string, xmlName: string): boolean
    {
        if(element)
        {
            return Boolean(parseInt(getXmlAttribute(element, xmlName)));
        }

        return Boolean(data[nitroName] ?? parseInt(data[xmlName]));
    }
}