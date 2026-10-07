import type {IActionDefinition} from '../actions/IActionDefinition';
import type {ActionDefinition} from '../actions/ActionDefinition';
import type {IStructureData} from './IStructureData';
import {ActivePartSet} from './parts/ActivePartSet';
import {PartDefinition} from './parts/PartDefinition';
import {getXmlAttribute, getXmlChildElements, getXmlFirstChildElement, getXmlRoot} from './AvatarXmlUtils';

/**
 * Manages part set definitions and active part sets for avatar rendering.
 *
 * @see sources/win63_version/habbo/avatar/structure/PartSetsData.as
 */
export class PartSetsData implements IStructureData
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::PartSetsData()
    constructor()
    {
        this._parts = new Map();
        this._activePartSets = new Map();
    }

    private _parts: Map<string, PartDefinition>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::get parts()
    public get parts(): Map<string, PartDefinition>
    {
        return this._parts;
    }

    private _activePartSets: Map<string, ActivePartSet>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::get activePartSets()
    public get activePartSets(): Map<string, ActivePartSet>
    {
        return this._activePartSets;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::parse()
    public parse(data: any): boolean
    {
        if(!data) return false;

        const root = getXmlRoot(data);

        if(root)
        {
            this.parseXml(root);

            return true;
        }

        return this.parseObject(data);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::appendXML()
    public appendXML(data: any): boolean
    {
        if(!data) return false;

        const root = getXmlRoot(data);

        if(root)
        {
            this.parseXml(root);

            return false;
        }

        this.parseObject(data);

        return false;
    }

    public appendJSON(data: any): boolean
    {
        return this.appendXML(data);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::getActiveParts()
    public getActiveParts(action: IActionDefinition): string[]
    {
        const activePartSet = this._activePartSets.get(action.activePartSet);

        if(activePartSet) return activePartSet.parts;

        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::getPartDefinition()
    public getPartDefinition(setType: string): PartDefinition | null
    {
        return this._parts.get(setType) || null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::addPartDefinition()
    public addPartDefinition(data: any): PartDefinition
    {
        const element = getXmlRoot(data);
        const setType = element ? getXmlAttribute(element, 'set-type') : String(data.setType || data['set-type']);

        if(!this._parts.has(setType))
        {
            this._parts.set(setType, new PartDefinition(data));
        }

        return this._parts.get(setType)!;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::getActivePartSet()
    public getActivePartSet(action: ActionDefinition): ActivePartSet | null
    {
        return this._activePartSets.get(action.activePartSet) || null;
    }

    private parseObject(data: any): boolean
    {
        const partSet = Array.isArray(data.partSet) ? data.partSet[0] : data.partSet;
        const rawParts = partSet?.parts ?? partSet?.part;

        if(rawParts)
        {
            const parts: any[] = Array.isArray(rawParts) ? rawParts : [rawParts];

            for(const partData of parts)
            {
                this._parts.set(String(partData.setType ?? partData['set-type'] ?? ''), new PartDefinition(partData));
            }
        }

        const rawActivePartSets = data.activePartSets ?? data.activePartSet;

        if(rawActivePartSets)
        {
            const activePartSets: any[] = Array.isArray(rawActivePartSets) ? rawActivePartSets : [rawActivePartSets];

            for(const apsData of activePartSets)
            {
                this._activePartSets.set(String(apsData.id ?? apsData['@id'] ?? ''), new ActivePartSet(apsData));
            }
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/PartSetsData.as::parse()
    private parseXml(root: Element): void
    {
        const partSet = getXmlFirstChildElement(root, 'partSet');

        if(partSet !== null)
        {
            for(const partElement of getXmlChildElements(partSet, 'part'))
            {
                this._parts.set(getXmlAttribute(partElement, 'set-type'), new PartDefinition(partElement));
            }
        }

        for(const activePartSetElement of getXmlChildElements(root, 'activePartSet'))
        {
            this._activePartSets.set(getXmlAttribute(activePartSetElement, 'id'), new ActivePartSet(activePartSetElement));
        }
    }
}