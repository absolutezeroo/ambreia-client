import {getXmlAttribute, getXmlChildElements, getXmlRoot} from '../structure/AvatarXmlUtils';

/**
 * Represents a set of body parts for avatar rendering.
 *
 * @see sources/win63_version/habbo/avatar/geometry/AvatarSet.as
 */
export class AvatarSet
{
    private _subSets: Map<string, AvatarSet>;
    private _bodyPartIds: string[];
    private _allBodyPartIds: string[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/AvatarSet.as::AvatarSet()
    constructor(data: any)
    {
        const element = getXmlRoot(data);

        this._id = element ? getXmlAttribute(element, 'id') : String(data.id);
        this._isMain = element
            ? Boolean(parseInt(getXmlAttribute(element, 'main')))
            : Boolean(typeof data.main === 'boolean' ? data.main : parseInt(data.main));
        this._subSets = new Map();
        this._bodyPartIds = [];

        if(element)
        {
            for(const subElement of getXmlChildElements(element, 'avatarset'))
            {
                const subSet = new AvatarSet(subElement);

                this._subSets.set(getXmlAttribute(subElement, 'id'), subSet);
            }

            for(const bodyPart of getXmlChildElements(element, 'bodypart'))
            {
                this._bodyPartIds.push(getXmlAttribute(bodyPart, 'id'));
            }
        }
        else
        {
            const subSets = data.avatarSets || data.avatarsets;

            if(subSets)
            {
                for(const subData of subSets)
                {
                    const subSet = new AvatarSet(subData);

                    this._subSets.set(String(subData.id), subSet);
                }
            }

            const bodyParts = data.bodyParts || data.bodyparts;

            if(bodyParts)
            {
                for(const bp of bodyParts)
                {
                    this._bodyPartIds.push(String(bp.id));
                }
            }
        }

        const all = [...this._bodyPartIds];

        for(const subSet of this._subSets.values())
        {
            all.push(...subSet.getBodyParts());
        }

        this._allBodyPartIds = all;
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/AvatarSet.as::get id()
    public get id(): string
    {
        return this._id;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/AvatarSet.as::_isMain
    private _isMain: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/AvatarSet.as::get isMain()
    public get isMain(): boolean
    {
        if(this._isMain) return true;

        for(const subSet of this._subSets.values())
        {
            if(subSet.isMain) return true;
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/AvatarSet.as::findAvatarSet()
    public findAvatarSet(id: string): AvatarSet | null
    {
        if(id === this._id) return this;

        for(const subSet of this._subSets.values())
        {
            const found = subSet.findAvatarSet(id);

            if(found !== null) return found;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/geometry/AvatarSet.as::getBodyParts()
    public getBodyParts(): string[]
    {
        return [...this._allBodyPartIds];
    }
}