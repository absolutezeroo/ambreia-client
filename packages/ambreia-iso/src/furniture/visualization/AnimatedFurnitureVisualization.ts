/**
 * AnimatedFurnitureVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.AnimatedFurnitureVisualization
 *
 * Extends FurnitureVisualization with animation state machine.
 * Supports transitions (TO_OFFSET=1000000, FROM_OFFSET=2000000).
 * updateAnimations/updateFrames returns bitmask of changed layers.
 */
import type {IRoomObjectVisualizationData} from '../../object/visualization/IRoomObjectVisualizationData';
import type {AnimationFrame} from '../../scene/object/visualization/data/AnimationFrame';
import {AnimationData} from '../../scene/object/visualization/data/AnimationData';
import {AnimationStateData} from '../../scene/object/visualization/data/AnimationStateData';
import {AnimatedFurnitureVisualizationData} from './AnimatedFurnitureVisualizationData';
import {FurnitureVisualization} from './FurnitureVisualization';

export class AnimatedFurnitureVisualization extends FurnitureVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::DEFAULT_ANIMATION_ID
    public static readonly DEFAULT_ANIMATION_ID: number = 0;

    protected _needsAnimationUpdate: boolean = false;

    private _animData: AnimatedFurnitureVisualizationData | null = null;
    private _lastState: number = -1;
    private _animationState: AnimationStateData;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::_animationChangeTime
    private _animationChangeTime: number = 0;
    private _animScale: number = 0;
    private _animLayerCount: number = 0;

    constructor()
    {
        super();
        this._animationState = new AnimationStateData();
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::get animationId()
    get animationId(): number
    {
        return this._animationState.animationId;
    }

    private _frameIncrease: number = 1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::get frameIncrease()
    protected get frameIncrease(): number
    {
        return this._frameIncrease;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::get animatedLayerCount()
    protected get animatedLayerCount(): number
    {
        return this._animLayerCount;
    }

    override dispose(): void
    {
        super.dispose();

        this._animData = null;

        if(this._animationState !== null)
        {
            this._animationState.dispose();
        }
    }

    override initialize(data: IRoomObjectVisualizationData): boolean
    {
        if(!(data instanceof AnimatedFurnitureVisualizationData))
        {
            return false;
        }

        this._animData = data;

        return super.initialize(data);
    }

    protected override updateObject(scale: number, geometryDirection: number): boolean
    {
        if(super.updateObject(scale, geometryDirection))
        {
            const roomObject = this.object;

            if(roomObject === null)
            {
                return false;
            }

            const state = roomObject.getState(0);

            if(state !== this._lastState)
            {
                this.setAnimation(state);
                this._lastState = state;

                const model = roomObject.getModel();

                if(model !== null)
                {
                    this._animationChangeTime = model.getNumber('furniture_state_update_time') || 0;
                }
            }

            return true;
        }

        return false;
    }

    protected override updateModel(scale: number): boolean
    {
        if(super.updateModel(scale))
        {
            const roomObject = this.object;

            if(roomObject !== null)
            {
                const model = roomObject.getModel();

                if(model !== null)
                {
                    if(this.usesAnimationResetting())
                    {
                        const stateUpdateTime = model.getNumber('furniture_state_update_time') || 0;

                        if(stateUpdateTime > this._animationChangeTime)
                        {
                            this._animationChangeTime = stateUpdateTime;
                            this.setAnimation(this._lastState);
                        }
                    }

                    const autoStateIndex = model.getNumber('furniture_automatic_state_index');

                    if(!isNaN(autoStateIndex) && this._animData !== null)
                    {
                        const animId = this._animData.getAnimationId(this._animScale, autoStateIndex);
                        this.setAnimation(animId);
                    }
                }
            }

            return true;
        }

        return false;
    }

    protected override updateAnimation(scale: number): number
    {
        if(this._animData === null)
        {
            return 0;
        }

        if(scale !== this._animScale)
        {
            this._animScale = scale;
            this._animLayerCount = this._animData.getLayerCount(scale);
            this.resetAllAnimationFrames();
        }

        const result = this.updateAnimations(scale);
        this._needsAnimationUpdate = false;

        return result;
    }

    protected override getFrameNumber(scale: number, layerIndex: number): number
    {
        const frame = this._animationState.getFrame(layerIndex);

        if(frame !== null)
        {
            return frame.id;
        }

        return super.getFrameNumber(scale, layerIndex);
    }

    protected override getSpriteXOffset(scale: number, direction: number, layerIndex: number): number
    {
        let offset = super.getSpriteXOffset(scale, direction, layerIndex);
        const frame = this._animationState.getFrame(layerIndex);

        if(frame !== null)
        {
            offset += frame.x;
        }

        return offset;
    }

    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        let offset = super.getSpriteYOffset(scale, direction, layerIndex);
        const frame = this._animationState.getFrame(layerIndex);

        if(frame !== null)
        {
            offset += frame.y;
        }

        return offset;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::getAnimationId()
    protected getAnimationId(_stateData: AnimationStateData): number
    {
        const id = this.animationId;

        if(id !== 0 && this._animData !== null && this._animData.hasAnimation(this._animScale, id))
        {
            return id;
        }

        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::setAnimation()
    protected setAnimation(animationId: number): void
    {
        if(this._animData !== null)
        {
            this.setSubAnimation(this._animationState, animationId, this._lastState >= 0);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::setSubAnimation()
    protected setSubAnimation(stateData: AnimationStateData, animationId: number, hasOldAnimation: boolean = true): boolean
    {
        const oldAnimationId = stateData.animationId;

        if(hasOldAnimation && this._animData !== null)
        {
            if(this.isPlayingTransition(stateData, animationId))
            {
                return false;
            }

            const currentState = this.getCurrentState(stateData);

            if(animationId !== currentState)
            {
                if(!this._animData.isImmediateChange(this._animScale, animationId, currentState))
                {
                    let transitionId = AnimationData.getTransitionFromAnimationId(currentState);

                    if(this._animData.hasAnimation(this._animScale, transitionId))
                    {
                        stateData.animationAfterTransitionId = animationId;
                        animationId = transitionId;
                    }
                    else
                    {
                        transitionId = AnimationData.getTransitionToAnimationId(animationId);

                        if(this._animData.hasAnimation(this._animScale, transitionId))
                        {
                            stateData.animationAfterTransitionId = animationId;
                            animationId = transitionId;
                        }
                    }
                }
            }
            else if(AnimationData.isTransitionFromAnimation(oldAnimationId))
            {
                const transitionId = AnimationData.getTransitionToAnimationId(animationId);

                if(this._animData.hasAnimation(this._animScale, transitionId))
                {
                    stateData.animationAfterTransitionId = animationId;
                    animationId = transitionId;
                }
            }
            else if(!AnimationData.isTransitionToAnimation(oldAnimationId))
            {
                if(this.usesAnimationResetting())
                {
                    let transitionId = AnimationData.getTransitionFromAnimationId(currentState);

                    if(this._animData.hasAnimation(this._animScale, transitionId))
                    {
                        stateData.animationAfterTransitionId = animationId;
                        animationId = transitionId;
                    }
                    else
                    {
                        transitionId = AnimationData.getTransitionToAnimationId(animationId);

                        if(this._animData.hasAnimation(this._animScale, transitionId))
                        {
                            stateData.animationAfterTransitionId = animationId;
                            animationId = transitionId;
                        }
                    }
                }
            }
        }

        if(oldAnimationId !== animationId)
        {
            stateData.animationId = animationId;
            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::getLastFramePlayed()
    protected getLastFramePlayed(layerIndex: number): boolean
    {
        return this._animationState.getLastFramePlayed(layerIndex);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::resetAllAnimationFrames()
    protected resetAllAnimationFrames(): void
    {
        if(this._animationState !== null)
        {
            this._animationState.setLayerCount(this._animLayerCount);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::updateAnimations()
    protected updateAnimations(scale: number): number
    {
        let result = 0;

        if(!this._animationState.animationOver || this._needsAnimationUpdate)
        {
            result = this.updateFramesForAnimation(this._animationState, scale);

            if(this._animationState.animationOver)
            {
                if(AnimationData.isTransitionFromAnimation(this._animationState.animationId) ||
					AnimationData.isTransitionToAnimation(this._animationState.animationId))
                {
                    this.setAnimation(this._animationState.animationAfterTransitionId);
                    this._animationState.animationOver = false;
                }
            }
        }

        return result;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::updateFramesForAnimation()
    protected updateFramesForAnimation(stateData: AnimationStateData, scale: number): number
    {
        if(stateData.animationOver && !this._needsAnimationUpdate)
        {
            return 0;
        }

        let frameCounter = stateData.frameCounter;
        const animationId = this.getAnimationId(stateData);

        if(frameCounter === 0 && this._animData !== null)
        {
            frameCounter = this._animData.getStartFrame(scale, animationId, this.direction);
        }

        frameCounter += this._frameIncrease;
        stateData.frameCounter = frameCounter;

        let result = 0;
        stateData.animationOver = true;
        let layerMask = 1 << (this._animLayerCount - 1);

        for(let layer = this._animLayerCount - 1; layer >= 0; layer--)
        {
            const animPlayed = stateData.getAnimationPlayed(layer);
            let lastFramePlayed = stateData.getLastFramePlayed(layer);
            let currentPlayed = animPlayed;

            if(!animPlayed || this._needsAnimationUpdate)
            {
                let frame: AnimationFrame | null = stateData.getFrame(layer);

                if(frame !== null)
                {
                    if(frame.isLastFrame && frame.remainingFrameRepeats <= this._frameIncrease)
                    {
                        lastFramePlayed = true;
                    }
                }

                if(this._needsAnimationUpdate || frame === null ||
					(frame.remainingFrameRepeats >= 0 && (frame.remainingFrameRepeats -= this._frameIncrease) <= 0))
                {
                    let activeSequence = -1;

                    if(frame !== null)
                    {
                        activeSequence = frame.activeSequence;
                    }

                    if(this._animData !== null)
                    {
                        if(activeSequence === -1)
                        {
                            frame = this._animData.getFrame(scale, animationId, this.direction, layer, frameCounter);
                        }
                        else
                        {
                            frame = this._animData.getFrameFromSequence(
                                scale, animationId, this.direction, layer,
                                activeSequence, frame!.activeSequenceOffset + frame!.repeats, frameCounter
                            );
                        }
                    }

                    stateData.setFrame(layer, frame!);
                    result |= layerMask;
                }

                if(frame === null || frame.remainingFrameRepeats === -1)
                {
                    lastFramePlayed = true;
                    currentPlayed = true;
                }
                else
                {
                    stateData.animationOver = false;
                }

                stateData.setLastFramePlayed(layer, lastFramePlayed);
                stateData.setAnimationPlayed(layer, currentPlayed);
            }

            layerMask >>= 1;
        }

        return result;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::usesAnimationResetting()
    protected usesAnimationResetting(): boolean
    {
        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::isPlayingTransition()
    private isPlayingTransition(stateData: AnimationStateData, targetAnimationId: number): boolean
    {
        const currentId = stateData.animationId;

        if(AnimationData.isTransitionFromAnimation(currentId) || AnimationData.isTransitionToAnimation(currentId))
        {
            if(targetAnimationId === stateData.animationAfterTransitionId)
            {
                if(!stateData.animationOver)
                {
                    return true;
                }
            }
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/AnimatedFurnitureVisualization.as::getCurrentState()
    private getCurrentState(stateData: AnimationStateData): number
    {
        const currentId = stateData.animationId;

        if(AnimationData.isTransitionFromAnimation(currentId) || AnimationData.isTransitionToAnimation(currentId))
        {
            return stateData.animationAfterTransitionId;
        }

        return currentId;
    }
}
