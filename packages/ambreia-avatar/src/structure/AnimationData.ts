import type {IActionDefinition} from '../actions/IActionDefinition';
import type {IStructureData} from './IStructureData';
import {AnimationAction} from './animation/AnimationAction';
import {getXmlAttribute, getXmlChildElements, getXmlRoot} from './AvatarXmlUtils';

/**
 * Manages avatar animation action data parsed from configuration XML.
 *
 * @see sources/win63_version/habbo/avatar/structure/AnimationData.as
 */
export class AnimationData implements IStructureData
{
    private _actions: Map<string, AnimationAction>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AnimationData.as::AnimationData()
    constructor()
    {
        this._actions = new Map();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AnimationData.as::parse()
    public parse(data: any): boolean
    {
        if(!data) return false;

        this.appendXML(data);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AnimationData.as::appendXML()
    public appendXML(data: any): boolean
    {
        if(!data) return false;

        const root = getXmlRoot(data);

        if(root)
        {
            for(const actionElement of getXmlChildElements(root, 'action'))
            {
                this._actions.set(getXmlAttribute(actionElement, 'id'), new AnimationAction(actionElement));
            }

            return true;
        }

        const actions = data.actions ?? data.action;

        if(actions)
        {
            const actionList = Array.isArray(actions) ? actions : [actions];

            for(const actionData of actionList)
            {
                this._actions.set(String(actionData.id), new AnimationAction(actionData));
            }
        }

        return true;
    }

    public appendJSON(data: any): boolean
    {
        return this.appendXML(data);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AnimationData.as::getAction()
    public getAction(action: IActionDefinition): AnimationAction | null
    {
        return this._actions.get(action.id) || null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AnimationData.as::getFrameCount()
    public getFrameCount(action: IActionDefinition): number
    {
        const animAction = this.getAction(action);

        if(!animAction) return 0;

        return animAction.frameCount;
    }
}