/**
 * AnimationSizeData
 *
 * @see com.sulake.habbo.room.object.visualization.data.AnimationSizeData
 *
 * Extends SizeData with animation support. Manages animations Map,
 * defines animations from JSON, provides frame access per animation/layer.
 */
import type {AnimationFrame} from './AnimationFrame';
import {AnimationData} from './AnimationData';
import {SizeData} from './SizeData';

export class AnimationSizeData extends SizeData
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::_animations
    private _animations: Map<number, AnimationData> = new Map();
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::_animationIds
    private _animationIds: number[] = [];

    constructor(layerCount: number, angle: number)
    {
        super(layerCount, angle);
    }

    override dispose(): void
    {
        super.dispose();

        for(const animation of this._animations.values())
        {
            if(animation !== null)
            {
                animation.dispose();
            }
        }

        this._animations.clear();
    }

    /**
	 * Define animations from Nitro JSON data.
	 *
	 * JSON format:
	 * ```json
	 * {
	 *   "0": {
	 *     "transitionTo": 1,
	 *     "transitionFrom": 2,
	 *     "immediateChangeFrom": "0,1,2",
	 *     "randomStart": 1,
	 *     "layers": { ... }
	 *   }
	 * }
	 * ```
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::defineAnimations()
    defineAnimations(data: Record<string, unknown>): boolean
    {
        if(data === null || data === undefined)
        {
            return true;
        }

        const animations = data as Record<string, Record<string, unknown>>;

        for(const idStr in animations)
        {
            const animDef = animations[idStr];
            let animationId = parseInt(idStr);

            if(isNaN(animationId))
            {
                continue;
            }

            let isTransition = false;

            const transitionTo = (animDef['transitionTo'] ?? null) as number | null;

            if(transitionTo !== null)
            {
                animationId = AnimationData.getTransitionToAnimationId(transitionTo);
                isTransition = true;
            }

            const transitionFrom = (animDef['transitionFrom'] ?? null) as number | null;

            if(transitionFrom !== null)
            {
                animationId = AnimationData.getTransitionFromAnimationId(transitionFrom);
                isTransition = true;
            }

            const animData = this.createAnimationData();

            if(!animData.initialize(animDef))
            {
                animData.dispose();
                return false;
            }

            const immediateChangeFrom = (animDef['immediateChangeFrom'] ?? null) as string | null;

            if(immediateChangeFrom && immediateChangeFrom.length > 0)
            {
                const parts = immediateChangeFrom.split(',');
                const changes: number[] = [];

                for(const part of parts)
                {
                    const changeId = parseInt(part);

                    if(!isNaN(changeId) && changes.indexOf(changeId) < 0)
                    {
                        changes.push(changeId);
                    }
                }

                animData.setImmediateChanges(changes);
            }

            this._animations.set(animationId, animData);

            if(!isTransition)
            {
                this._animationIds.push(animationId);
            }
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::hasAnimation()
    hasAnimation(animationId: number): boolean
    {
        return this._animations.has(animationId);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::getAnimationCount()
    getAnimationCount(): number
    {
        return this._animationIds.length;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::getAnimationId()
    getAnimationId(index: number): number
    {
        const count = this.getAnimationCount();

        if(index >= 0 && count > 0)
        {
            return this._animationIds[index % count];
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::isImmediateChange()
    isImmediateChange(animationId: number, fromAnimationId: number): boolean
    {
        const animData = this._animations.get(animationId);

        if(animData !== undefined)
        {
            return animData.isImmediateChange(fromAnimationId);
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::getStartFrame()
    getStartFrame(animationId: number, layerIndex: number): number
    {
        const animData = this._animations.get(animationId);

        if(animData !== undefined)
        {
            return animData.getStartFrame(layerIndex);
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::getFrame()
    getFrame(animationId: number, direction: number, layerId: number, frameCounter: number): AnimationFrame | null
    {
        const animData = this._animations.get(animationId);

        if(animData !== undefined)
        {
            return animData.getFrame(direction, layerId, frameCounter);
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::getFrameFromSequence()
    getFrameFromSequence(
        animationId: number,
        direction: number,
        layerId: number,
        sequenceIndex: number,
        frameIndex: number,
        frameCounter: number
    ): AnimationFrame | null
    {
        const animData = this._animations.get(animationId);

        if(animData !== undefined)
        {
            return animData.getFrameFromSequence(direction, layerId, sequenceIndex, frameIndex, frameCounter);
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationSizeData.as::createAnimationData()
    protected createAnimationData(): AnimationData
    {
        return new AnimationData();
    }
}
