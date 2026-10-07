import {AnimationFrame} from './AnimationFrame';
import {getXmlAttribute, getXmlChildElements, getXmlRoot} from '../AvatarXmlUtils';

/**
 * Represents the frames for a single body part within an animation action.
 * Frames with repeats are expanded into the frame array.
 *
 * @see sources/win63_version/habbo/avatar/structure/animation/AnimationActionPart.as
 */
export class AnimationActionPart
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationActionPart.as::AnimationActionPart()
    constructor(data: any)
    {
        this._frames = [];

        const element = getXmlRoot(data);

        if(element)
        {
            for(const frameElement of getXmlChildElements(element, 'frame'))
            {
                this.pushFrame(frameElement, getXmlAttribute(frameElement, 'repeats'));
            }

            return;
        }

        const rawFrames = data.frames || data.frame;

        if(rawFrames)
        {
            const frames: any[] = Array.isArray(rawFrames) ? rawFrames : [rawFrames];

            for(const frameData of frames)
            {
                this.pushFrame(frameData, frameData.repeats);
            }
        }
    }

    private _frames: AnimationFrame[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationActionPart.as::get frames()
    public get frames(): AnimationFrame[]
    {
        return this._frames;
    }

    private pushFrame(frameData: any, repeatsData: any): void
    {
        const frame = new AnimationFrame(frameData);
        this._frames.push(frame);

        let repeats = parseInt(repeatsData) || 0;

        if(repeats > 1)
        {
            while(--repeats > 0)
            {
                this._frames.push(frame);
            }
        }
    }
}