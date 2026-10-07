import {getXmlAttribute, getXmlChildElements, getXmlRoot} from '../AvatarXmlUtils';

/**
 * Represents a named set of active body part types used during avatar rendering.
 *
 * @see sources/win63_version/habbo/avatar/structure/parts/ActivePartSet.as
 */
export class ActivePartSet
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/ActivePartSet.as::ActivePartSet()
    constructor(data: any)
    {
        const element = getXmlRoot(data);

        this._id = element ? getXmlAttribute(element, 'id') : String(data.id ?? data['@id'] ?? '');
        this._parts = [];

        if(element)
        {
            for(const activePart of getXmlChildElements(element, 'activePart'))
            {
                this._parts.push(getXmlAttribute(activePart, 'set-type'));
            }

            return;
        }

        const rawParts = data.activeParts || data.activePart;

        if(rawParts)
        {
            const activeParts: any[] = Array.isArray(rawParts) ? rawParts : [rawParts];

            for(const part of activeParts)
            {
                this._parts.push(String(part.setType ?? part['set-type'] ?? ''));
            }
        }
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/ActivePartSet.as::get id()
    public get id(): string
    {
        return this._id;
    }

    private _parts: string[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/parts/ActivePartSet.as::get parts()
    public get parts(): string[]
    {
        return this._parts;
    }
}