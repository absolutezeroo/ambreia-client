/**
 * AnimationData
 *
 * @see com.sulake.habbo.room.object.visualization.data.AnimationData
 *
 * Collection of AnimationLayerData for a single animation.
 * Manages transition IDs (TO_OFFSET=1000000, FROM_OFFSET=2000000),
 * immediateChanges, and randomStart.
 */
import type {AnimationFrame} from './AnimationFrame';
import type {AnimationFrameSequenceData} from './AnimationFrameSequenceData';
import {AnimationLayerData} from './AnimationLayerData';
import {DirectionalOffsetData} from './DirectionalOffsetData';

export class AnimationData
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::DEFAULT_FRAME_NUMBER
    public static readonly DEFAULT_FRAME_NUMBER: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::TRANSITION_TO_ANIMATION_OFFSET
    private static readonly TRANSITION_TO_ANIMATION_OFFSET: number = 1000000;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::TRANSITION_FROM_ANIMATION_OFFSET
    private static readonly TRANSITION_FROM_ANIMATION_OFFSET: number = 2000000;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::_layers
    private _layers: Map<number, AnimationLayerData> = new Map();
    private _maxFrameCount: number = -1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::_randomStart
    private _randomStart: boolean = false;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::_immediateChanges
    private _immediateChanges: number[] | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::getTransitionToAnimationId()
    static getTransitionToAnimationId(animationId: number): number
    {
        return AnimationData.TRANSITION_TO_ANIMATION_OFFSET + animationId;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::getTransitionFromAnimationId()
    static getTransitionFromAnimationId(animationId: number): number
    {
        return AnimationData.TRANSITION_FROM_ANIMATION_OFFSET + animationId;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::isTransitionToAnimation()
    static isTransitionToAnimation(animationId: number): boolean
    {
        return animationId >= AnimationData.TRANSITION_TO_ANIMATION_OFFSET &&
			animationId < AnimationData.TRANSITION_FROM_ANIMATION_OFFSET;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::isTransitionFromAnimation()
    static isTransitionFromAnimation(animationId: number): boolean
    {
        return animationId >= AnimationData.TRANSITION_FROM_ANIMATION_OFFSET;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::setImmediateChanges()
    setImmediateChanges(changes: number[]): void
    {
        this._immediateChanges = changes;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::isImmediateChange()
    isImmediateChange(fromAnimationId: number): boolean
    {
        if(this._immediateChanges !== null && this._immediateChanges.indexOf(fromAnimationId) >= 0)
        {
            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::getStartFrame()
    getStartFrame(_layerIndex: number): number
    {
        if(!this._randomStart)
        {
            return 0;
        }

        return Math.floor(Math.random() * this._maxFrameCount);
    }

    /**
	 * Initialize from Nitro JSON data.
	 *
	 * JSON format:
	 * ```json
	 * {
	 *   "randomStart": 1,
	 *   "layers": {
	 *     "0": { "loopCount": 1, "frameRepeat": 2, "random": 0,
	 *       "frameSequences": { "0": { "loopCount": 1, "random": 0,
	 *         "frames": { "0": { "id": 0, "x": 0, "y": 0 }, ... }
	 *       } }
	 *     }
	 *   }
	 * }
	 * ```
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::initialize()
    initialize(data: Record<string, unknown>): boolean
    {
        this._randomStart = ((data['randomStart'] as number) || 0) !== 0;

        const layers = (data['layers'] ?? null) as Record<string, Record<string, unknown>> | null;

        if(!layers)
        {
            // AS3 uses 'animationLayer' in XML, Nitro JSON uses 'layers'
            return true;
        }

        for(const layerIdStr in layers)
        {
            const layerId = parseInt(layerIdStr);

            if(isNaN(layerId))
            {
                continue;
            }

            const layerDef = layers[layerIdStr];

            // `?? 1`, not `|| 1`: AS3 defaults these to 1 only when the attribute is *absent*
            // (`if(_loc10_.length > 0) _loc7_ = int(_loc10_)`), and `loopCount="0"` is a real,
            // meaningful value — `AnimationLayerData` reads `<= 0` as "loop forever" (its line 92
            // in the PRODUCTION source). `||` treats 0 as falsy and turned every infinite loop into
            // a single pass, which is why an animated furni played its sequence once and then held
            // the last frame: the dragon lamp's flame is layer 5 of animation 1, four frames with
            // `loopCount: 0`, and it looked frozen rather than lit.
            const rawLoopCount = layerDef['loopCount'];
            const rawFrameRepeat = layerDef['frameRepeat'];
            const loopCount = typeof rawLoopCount === 'number' ? rawLoopCount : 1;
            const frameRepeat = typeof rawFrameRepeat === 'number' ? rawFrameRepeat : 1;
            const isRandom = ((layerDef['random'] as number) || 0) !== 0;

            if(!this.addLayer(layerId, loopCount, frameRepeat, isRandom, layerDef))
            {
                return false;
            }
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::getFrame()
    getFrame(direction: number, layerId: number, frameCounter: number): AnimationFrame | null
    {
        const layerData = this._layers.get(layerId);

        if(layerData !== undefined)
        {
            return layerData.getFrame(direction, frameCounter);
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::getFrameFromSequence()
    getFrameFromSequence(direction: number, layerId: number, sequenceIndex: number, frameIndex: number, frameCounter: number): AnimationFrame | null
    {
        const layerData = this._layers.get(layerId);

        if(layerData !== undefined)
        {
            return layerData.getFrameFromSequence(direction, sequenceIndex, frameIndex, frameCounter);
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::dispose()
    dispose(): void
    {
        for(const layer of this._layers.values())
        {
            if(layer !== null)
            {
                layer.dispose();
            }
        }

        this._layers.clear();
        this._immediateChanges = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::addLayer()
    private addLayer(
        layerId: number,
        loopCount: number,
        frameRepeat: number,
        isRandom: boolean,
        layerDef: Record<string, unknown>
    ): boolean
    {
        const layerData = new AnimationLayerData(loopCount, frameRepeat, isRandom);

        const frameSequences = (layerDef['frameSequences'] ?? null) as Record<string, Record<string, unknown>> | null;

        if(frameSequences)
        {
            for(const seqIdStr in frameSequences)
            {
                const seqDef = frameSequences[seqIdStr];
                // Same absent-vs-zero distinction as the layer above. Harmless in practice here —
                // `AnimationFrameSequenceData` clamps anything below 1 up to 1, as AS3 does — but
                // written the same way so the two cannot drift apart.
                const rawSeqLoopCount = seqDef['loopCount'];
                const seqLoopCount = typeof rawSeqLoopCount === 'number' ? rawSeqLoopCount : 1;
                const seqRandom = ((seqDef['random'] as number) || 0) !== 0;

                const sequence: AnimationFrameSequenceData = layerData.addFrameSequence(seqLoopCount, seqRandom);

                const frames = (seqDef['frames'] ?? null) as Record<string, Record<string, unknown>> | null;

                if(frames)
                {
                    // Sort frame keys numerically to preserve order
                    const frameKeys = Object.keys(frames).sort((a, b) => parseInt(a) - parseInt(b));

                    for(const frameKey of frameKeys)
                    {
                        const frameDef = frames[frameKey];
                        const id = (frameDef['id'] as number) || 0;
                        const x = (frameDef['x'] as number) || 0;
                        const y = (frameDef['y'] as number) || 0;
                        const randomX = (frameDef['randomX'] as number) || 0;
                        const randomY = (frameDef['randomY'] as number) || 0;

                        const offsets = this.readDirectionalOffsets(frameDef);
                        sequence.addFrame(id, x, y, randomX, randomY, offsets);
                    }
                }

                sequence.initialize();
            }
        }

        layerData.calculateLength();
        this._layers.set(layerId, layerData);

        const frameCount = layerData.frameCount;

        if(frameCount > this._maxFrameCount)
        {
            this._maxFrameCount = frameCount;
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationData.as::readDirectionalOffsets()
    private readDirectionalOffsets(frameDef: Record<string, unknown>): DirectionalOffsetData | null
    {
        const offsets = (frameDef['offsets'] ?? null) as Record<string, Record<string, unknown>> | null;

        if(!offsets)
        {
            return null;
        }

        let offsetData: DirectionalOffsetData | null = null;

        for(const offsetKey in offsets)
        {
            const offsetDef = offsets[offsetKey];
            const direction = (offsetDef['direction'] ?? null) as number | null;

            if(direction === null)
            {
                continue;
            }

            const x = (offsetDef['x'] as number) || 0;
            const y = (offsetDef['y'] as number) || 0;

            if(offsetData === null)
            {
                offsetData = new DirectionalOffsetData();
            }

            offsetData.setOffset(direction, x, y);
        }

        return offsetData;
    }
}
