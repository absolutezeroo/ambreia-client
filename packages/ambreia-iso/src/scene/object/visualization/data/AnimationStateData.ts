/**
 * AnimationStateData
 *
 * @see com.sulake.habbo.room.object.visualization.data.AnimationStateData
 *
 * Runtime animation state: animationId, frameCounter, frames/played/lastFramePlayed per layer.
 * Recycles AnimationFrame instances back to the pool.
 */
import {AnimationFrame} from './AnimationFrame';

export class AnimationStateData
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::_frames
    private _frames: (AnimationFrame | null)[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::_lastFramePlayed
    private _lastFramePlayed: boolean[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::_animationPlayed
    private _animationPlayed: boolean[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::_layerCount
    private _layerCount: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::_animationId
    private _animationId: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::get animationId()
    get animationId(): number
    {
        return this._animationId;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::set animationId()
    set animationId(value: number)
    {
        if(value !== this._animationId)
        {
            this._animationId = value;
            this.resetAnimationFrames(false);
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::_animationAfterTransitionId
    private _animationAfterTransitionId: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::get animationAfterTransitionId()
    get animationAfterTransitionId(): number
    {
        return this._animationAfterTransitionId;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::set animationAfterTransitionId()
    set animationAfterTransitionId(value: number)
    {
        this._animationAfterTransitionId = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::_animationOver
    private _animationOver: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::get animationOver()
    get animationOver(): boolean
    {
        return this._animationOver;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::set animationOver()
    set animationOver(value: boolean)
    {
        this._animationOver = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::_frameCounter
    private _frameCounter: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::get frameCounter()
    get frameCounter(): number
    {
        return this._frameCounter;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::set frameCounter()
    set frameCounter(value: number)
    {
        this._frameCounter = value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::setLayerCount()
    setLayerCount(count: number): void
    {
        this._layerCount = count;
        this.resetAnimationFrames();
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::resetAnimationFrames()
    resetAnimationFrames(recycleAll: boolean = true): void
    {
        if(recycleAll || this._frames === null)
        {
            this.recycleFrames();
            this._frames = [];
        }

        this._lastFramePlayed = [];
        this._animationPlayed = [];
        this._animationOver = false;
        this._frameCounter = 0;

        for(let i = 0; i < this._layerCount; i++)
        {
            if(recycleAll || this._frames.length <= i)
            {
                this._frames[i] = null;
            }
            else
            {
                const frame = this._frames[i];

                if(frame !== null)
                {
                    frame.recycle();
                    this._frames[i] = AnimationFrame.allocate(
                        frame.id, frame.x, frame.y,
                        frame.repeats, 0, frame.isLastFrame
                    );
                }
            }

            this._lastFramePlayed[i] = false;
            this._animationPlayed[i] = false;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::getFrame()
    getFrame(layerIndex: number): AnimationFrame | null
    {
        if(layerIndex >= 0 && layerIndex < this._layerCount)
        {
            return this._frames[layerIndex];
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::setFrame()
    setFrame(layerIndex: number, frame: AnimationFrame): void
    {
        if(layerIndex >= 0 && layerIndex < this._layerCount)
        {
            const existing = this._frames[layerIndex];

            if(existing !== null)
            {
                existing.recycle();
            }

            this._frames[layerIndex] = frame;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::getAnimationPlayed()
    getAnimationPlayed(layerIndex: number): boolean
    {
        if(layerIndex >= 0 && layerIndex < this._layerCount)
        {
            return this._animationPlayed[layerIndex];
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::setAnimationPlayed()
    setAnimationPlayed(layerIndex: number, value: boolean): void
    {
        if(layerIndex >= 0 && layerIndex < this._layerCount)
        {
            this._animationPlayed[layerIndex] = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::getLastFramePlayed()
    getLastFramePlayed(layerIndex: number): boolean
    {
        if(layerIndex >= 0 && layerIndex < this._layerCount)
        {
            return this._lastFramePlayed[layerIndex];
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::setLastFramePlayed()
    setLastFramePlayed(layerIndex: number, value: boolean): void
    {
        if(layerIndex >= 0 && layerIndex < this._layerCount)
        {
            this._lastFramePlayed[layerIndex] = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::dispose()
    dispose(): void
    {
        this.recycleFrames();
        this._frames = [];
        this._lastFramePlayed = [];
        this._animationPlayed = [];
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationStateData.as::recycleFrames()
    private recycleFrames(): void
    {
        if(this._frames !== null)
        {
            for(const frame of this._frames)
            {
                if(frame !== null)
                {
                    frame.recycle();
                }
            }
        }
    }
}
