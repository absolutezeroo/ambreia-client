import {getXmlAttribute, getXmlRoot} from '../AvatarXmlUtils';

/**
 * Represents a single frame within an animation action part.
 *
 * @see sources/win63_version/habbo/avatar/structure/animation/AnimationFrame.as
 */
export class AnimationFrame
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationFrame.as::AnimationFrame()
    constructor(data: any)
    {
        const element = getXmlRoot(data);

        this._number = parseInt(element ? getXmlAttribute(element, 'number') : data.number) || 0;
        this._assetPartDefinition = element
            ? getXmlAttribute(element, 'assetpartdefinition')
            : String(data.assetPartDefinition ?? data.assetpartdefinition ?? '');
    }

    private _number: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationFrame.as::get number()
    public get number(): number
    {
        return this._number;
    }

    private _assetPartDefinition: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationFrame.as::get assetPartDefinition()
    public get assetPartDefinition(): string
    {
        return this._assetPartDefinition;
    }
}