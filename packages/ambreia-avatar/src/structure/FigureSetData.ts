import type {IStructureData} from './IStructureData';
import type {IFigureData} from './IFigureData';
import type {ISetType} from './figure/ISetType';
import type {IFigurePartSet} from './figure/IFigurePartSet';
import type {IPalette} from './figure/IPalette';
import {Palette} from './figure/Palette';
import {SetType} from './figure/SetType';
import {getXmlAttribute, getXmlChildElements, getXmlFirstChildElement, getXmlRoot} from './AvatarXmlUtils';

/**
 * Manages figure set data including palettes and set types.
 * Implements both IStructureData and IFigureData.
 *
 * @see sources/win63_version/habbo/avatar/structure/FigureSetData.as
 */
export class FigureSetData implements IStructureData, IFigureData
{
    private _palettes: Map<string, Palette>;
    private _setTypes: Map<string, SetType>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::FigureSetData()
    constructor()
    {
        this._palettes = new Map();
        this._setTypes = new Map();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::parse()
    public parse(data: any): boolean
    {
        if(!data) return false;

        const root = getXmlRoot(data);

        if(root)
        {
            this.parseXml(root, false);

            return true;
        }

        return this.parseObject(data, false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::injectXML()
    public injectXML(data: any): void
    {
        if(!data) return;

        const root = getXmlRoot(data);

        if(root)
        {
            const sets = getXmlFirstChildElement(root, 'sets');

            if(sets !== null)
            {
                for(const setTypeElement of getXmlChildElements(sets, 'settype'))
                {
                    const type = getXmlAttribute(setTypeElement, 'type');
                    const existing = this._setTypes.get(type);

                    if(existing)
                    {
                        existing.cleanUp(setTypeElement);
                    }
                    else
                    {
                        this._setTypes.set(type, new SetType(setTypeElement));
                    }
                }
            }

            this.appendXML(root);

            return;
        }

        this.injectJSON(data);
    }

    public injectJSON(data: any): void
    {
        data = data.figuredata ?? data.figureData ?? data;

        const setTypes: any[] | null = this.getObjectSetTypes(data);

        if(setTypes)
        {
            for(const setTypeData of setTypes)
            {
                const type = String(setTypeData.type);
                const existing = this._setTypes.get(type);

                if(existing)
                {
                    existing.cleanUp(setTypeData);
                }
                else
                {
                    this._setTypes.set(type, new SetType(setTypeData));
                }
            }
        }

        this.appendJSON(data);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::appendXML()
    public appendXML(data: any): boolean
    {
        if(!data) return false;

        const root = getXmlRoot(data);

        if(root)
        {
            this.parseXml(root, true);

            return false;
        }

        return this.appendJSON(data);
    }

    public appendJSON(data: any): boolean
    {
        if(!data) return false;

        return this.parseObject(data, true);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::getMandatorySetTypeIds()
    public getMandatorySetTypeIds(gender: string, clubLevel: number): string[]
    {
        const result: string[] = [];

        for(const setType of this._setTypes.values())
        {
            if(setType && setType.isMandatory(gender, clubLevel))
            {
                result.push(setType.type);
            }
        }

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::getDefaultPartSet()
    public getDefaultPartSet(type: string, gender: string): IFigurePartSet | null
    {
        const setType = this._setTypes.get(type);

        if(setType)
        {
            return setType.getDefaultPartSet(gender);
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::getSetType()
    public getSetType(type: string): ISetType | null
    {
        return this._setTypes.get(type) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::getPalette()
    public getPalette(id: number): IPalette | null
    {
        return this._palettes.get(String(id)) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::getFigurePartSet()
    public getFigurePartSet(id: number): IFigurePartSet | null
    {
        for(const setType of this._setTypes.values())
        {
            const partSet = setType.getPartSet(id);

            if(partSet !== null)
            {
                return partSet;
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/FigureSetData.as::dispose()
    public dispose(): void
    {
        this._palettes.clear();
        this._setTypes.clear();
    }

    private parseXml(root: Element, append: boolean): void
    {
        const colors = getXmlFirstChildElement(root, 'colors');

        if(colors !== null)
        {
            for(const paletteElement of getXmlChildElements(colors, 'palette'))
            {
                const id = getXmlAttribute(paletteElement, 'id');
                const existing = this._palettes.get(id);

                if(append && existing)
                {
                    existing.append(paletteElement);
                }
                else
                {
                    this._palettes.set(id, new Palette(paletteElement));
                }
            }
        }

        const sets = getXmlFirstChildElement(root, 'sets');

        if(sets !== null)
        {
            for(const setTypeElement of getXmlChildElements(sets, 'settype'))
            {
                const type = getXmlAttribute(setTypeElement, 'type');
                const existing = this._setTypes.get(type);

                if(append && existing)
                {
                    existing.append(setTypeElement);
                }
                else
                {
                    this._setTypes.set(type, new SetType(setTypeElement));
                }
            }
        }
    }

    private parseObject(data: any, append: boolean): boolean
    {
        data = data.figuredata ?? data.figureData ?? data;

        const palettes = this.getObjectPalettes(data);

        if(palettes)
        {
            for(const paletteData of palettes)
            {
                const id = String(paletteData.id);
                const existing = this._palettes.get(id);

                if(append && existing)
                {
                    existing.append(paletteData);
                }
                else
                {
                    this._palettes.set(id, new Palette(paletteData));
                }
            }
        }

        const setTypes = this.getObjectSetTypes(data);

        if(setTypes)
        {
            for(const setTypeData of setTypes)
            {
                const type = String(setTypeData.type);
                const existing = this._setTypes.get(type);

                if(append && existing)
                {
                    existing.append(setTypeData);
                }
                else
                {
                    this._setTypes.set(type, new SetType(setTypeData));
                }
            }
        }

        return !append;
    }

    private getObjectPalettes(data: any): any[] | null
    {
        if(Array.isArray(data.palettes)) return data.palettes;
        if(data.palettes && data.palettes.palette) return Array.isArray(data.palettes.palette) ? data.palettes.palette : [data.palettes.palette];
        if(data.colors && data.colors.palette) return Array.isArray(data.colors.palette) ? data.colors.palette : [data.colors.palette];

        return null;
    }

    private getObjectSetTypes(data: any): any[] | null
    {
        if(Array.isArray(data.setTypes)) return data.setTypes;
        if(Array.isArray(data.settypes)) return data.settypes;
        if(data.settypes && data.settypes.settype) return Array.isArray(data.settypes.settype) ? data.settypes.settype : [data.settypes.settype];
        if(Array.isArray(data.settype)) return data.settype;
        if(data.sets && data.sets.settype) return Array.isArray(data.sets.settype) ? data.sets.settype : [data.sets.settype];

        return null;
    }
}