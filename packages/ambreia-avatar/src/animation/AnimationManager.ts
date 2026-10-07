import type {ActionDefinitionResolver} from './Animation';
import {Animation} from './Animation';
import type {AnimationLayerData} from './AnimationLayerData';
import type {IAnimation} from './IAnimation';

/**
 * Manages all registered avatar animations.
 *
 * @see sources/win63_version/habbo/avatar/animation/AnimationManager.as
 */
export class AnimationManager
{
    constructor()
    {
        this._animations = new Map();
    }

    private _animations: Map<string, Animation>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AnimationManager.as::get animations()
    public get animations(): Map<string, Animation>
    {
        return this._animations;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AnimationManager.as::registerAnimation()
    public registerAnimation(actionResolver: ActionDefinitionResolver, data: any): boolean
    {
        const name = String(data.name || '');

        this._animations.set(name, new Animation(actionResolver, data));

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AnimationManager.as::getAnimation()
    public getAnimation(name: string): IAnimation | null
    {
        return this._animations.get(name) || null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AnimationManager.as::getLayerData()
    public getLayerData(animationName: string, frameIndex: number, partId: string): AnimationLayerData | null
    {
        const animation = this._animations.get(animationName);

        if(animation)
        {
            return animation.getLayerData(frameIndex, partId);
        }

        return null;
    }
}
