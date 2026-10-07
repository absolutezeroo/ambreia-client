/**
 * AnimationLayerData
 *
 * @see com.sulake.habbo.room.object.visualization.data.AnimationLayerData
 *
 * Sequences per animation layer. Manages loopCount, frameRepeat, isRandom.
 * getFrame handles loop counting and sequence traversal.
 */
import {AnimationFrame} from './AnimationFrame';
import type {AnimationFrameData} from './AnimationFrameData';
import {AnimationFrameSequenceData} from './AnimationFrameSequenceData';

export class AnimationLayerData
{
    private _sequences: AnimationFrameSequenceData[] = [];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::_loopCount
    private _loopCount: number = 1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::_frameRepeat
    private _frameRepeat: number = 1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::_isRandom
    private _isRandom: boolean = false;

    constructor(loopCount: number, frameRepeat: number, isRandom: boolean)
    {
        if(loopCount < 0) loopCount = 0;
        if(frameRepeat < 1) frameRepeat = 1;

        this._loopCount = loopCount;
        this._frameRepeat = frameRepeat;
        this._isRandom = isRandom;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::_frameCount
    private _frameCount: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::get frameCount()
    get frameCount(): number
    {
        if(this._frameCount < 0)
        {
            this.calculateLength();
        }

        return this._frameCount;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::dispose()
    dispose(): void
    {
        for(const sequence of this._sequences)
        {
            if(sequence !== null)
            {
                sequence.dispose();
            }
        }

        this._sequences = [];
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::addFrameSequence()
    addFrameSequence(loopCount: number, isRandom: boolean): AnimationFrameSequenceData
    {
        const sequence = new AnimationFrameSequenceData(loopCount, isRandom);
        this._sequences.push(sequence);

        return sequence;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::calculateLength()
    calculateLength(): void
    {
        this._frameCount = 0;

        for(const sequence of this._sequences)
        {
            if(sequence !== null)
            {
                this._frameCount += sequence.frameCount;
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::getFrame()
    getFrame(direction: number, frameCounter: number): AnimationFrame | null
    {
        if(this._frameCount < 1)
        {
            return null;
        }

        let sequence: AnimationFrameSequenceData | null = null;
        frameCounter = Math.floor(frameCounter / this._frameRepeat);

        let isLastFrame = false;
        let sequenceIndex: number;

        if(!this._isRandom)
        {
            const loopIndex = Math.floor(frameCounter / this._frameCount);
            frameCounter = frameCounter % this._frameCount;

            if((this._loopCount > 0 && loopIndex >= this._loopCount) || (this._loopCount <= 0 && this._frameCount === 1))
            {
                frameCounter = this._frameCount - 1;
                isLastFrame = true;
            }

            let offset = 0;
            sequenceIndex = 0;

            while(sequenceIndex < this._sequences.length)
            {
                sequence = this._sequences[sequenceIndex];

                if(sequence !== null)
                {
                    if(frameCounter < offset + sequence.frameCount)
                    {
                        break;
                    }

                    offset += sequence.frameCount;
                }

                sequenceIndex++;
            }

            return this.getFrameFromSpecificSequence(direction, sequence, sequenceIndex, frameCounter - offset, isLastFrame);
        }

        // Random mode
        sequenceIndex = Math.floor(Math.random() * this._sequences.length);
        sequence = this._sequences[sequenceIndex];

        if(sequence === null || sequence.frameCount < 1)
        {
            return null;
        }

        return this.getFrameFromSpecificSequence(direction, sequence, sequenceIndex, 0, false);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::getFrameFromSequence()
    getFrameFromSequence(direction: number, sequenceIndex: number, frameIndex: number, frameCounter: number): AnimationFrame | null
    {
        if(sequenceIndex < 0 || sequenceIndex >= this._sequences.length)
        {
            return null;
        }

        const sequence = this._sequences[sequenceIndex];

        if(sequence !== null)
        {
            if(frameIndex >= sequence.frameCount)
            {
                return this.getFrame(direction, frameCounter);
            }

            return this.getFrameFromSpecificSequence(direction, sequence, sequenceIndex, frameIndex, false);
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationLayerData.as::getFrameFromSpecificSequence()
    private getFrameFromSpecificSequence(
        direction: number,
        sequence: AnimationFrameSequenceData | null,
        sequenceIndex: number,
        frameIndex: number,
        isLastFrame: boolean
    ): AnimationFrame | null
    {
        if(sequence === null)
        {
            return null;
        }

        const actualIndex = sequence.getFrameIndex(frameIndex);
        const frameData: AnimationFrameData | null = sequence.getFrame(actualIndex);

        if(frameData === null)
        {
            return null;
        }

        let x = frameData.getX(direction);
        let y = frameData.getY(direction);
        const randomX = frameData.randomX;
        const randomY = frameData.randomY;

        if(randomX !== 0)
        {
            x += Math.floor(randomX * Math.random());
        }

        if(randomY !== 0)
        {
            y += Math.floor(randomY * Math.random());
        }

        let repeats = frameData.repeats;

        if(repeats > 1)
        {
            repeats = sequence.getRepeats(actualIndex);
        }

        let frameRepeats = this._frameRepeat * repeats;

        if(isLastFrame)
        {
            frameRepeats = -1;
        }

        let isLast = false;

        if(!this._isRandom && !sequence.isRandom)
        {
            if(sequenceIndex === this._sequences.length - 1 && frameIndex === sequence.frameCount - 1)
            {
                isLast = true;
            }
        }

        return AnimationFrame.allocate(
            frameData.id, x, y, repeats, frameRepeats, isLast,
            sequenceIndex, frameIndex
        );
    }
}
