import {AnimationActionPart} from './AnimationActionPart';
import {
    getXmlAttribute,
    getXmlChildElements,
    getXmlFirstChildElement,
    getXmlRoot
} from '../AvatarXmlUtils';

/**
 * Represents a complete animation action containing parts and body part offsets.
 * Each action has multiple parts (keyed by set-type) and optional per-frame,
 * per-direction body part offsets.
 *
 * @see sources/win63_version/habbo/avatar/structure/animation/AnimationAction.as
 */
export class AnimationAction
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationAction.as::DEFAULT_OFFSET
    public static readonly DEFAULT_OFFSET: { x: number; y: number } = {x: 0, y: 0};
    private _offsets: Map<number, Map<number, Map<string, { x: number; y: number }>>>;
    private _offsetFrames: number[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationAction.as::AnimationAction()
    constructor(data: any)
    {
        const element = getXmlRoot(data);

        this._id = element ? getXmlAttribute(element, 'id') : String(data.id ?? '');
        this._parts = new Map();
        this._offsets = new Map();
        this._frameCount = 0;
        this._offsetFrames = [];

        if(element)
        {
            this.parseXml(element);
        }
        else
        {
            this.parseObject(data);
        }
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationAction.as::get id()
    public get id(): string
    {
        return this._id;
    }

    private _parts: Map<string, AnimationActionPart>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationAction.as::get parts()
    public get parts(): Map<string, AnimationActionPart>
    {
        return this._parts;
    }

    private _frameCount: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationAction.as::get frameCount()
    public get frameCount(): number
    {
        return this._frameCount;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationAction.as::getPart()
    public getPart(setType: string): AnimationActionPart | null
    {
        return this._parts.get(setType) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/animation/AnimationAction.as::getFrameBodyPartOffset()
    public getFrameBodyPartOffset(direction: number, frameIndex: number, bodyPartId: string): { x: number; y: number }
    {
        if(this._offsetFrames.length === 0)
        {
            return AnimationAction.DEFAULT_OFFSET;
        }

        const normalizedIndex = frameIndex % this._offsetFrames.length;
        const frameId = this._offsetFrames[normalizedIndex];
        const directionMap = this._offsets.get(frameId);

        if(directionMap)
        {
            const bodyPartMap = directionMap.get(direction);

            if(bodyPartMap)
            {
                const offset = bodyPartMap.get(bodyPartId);

                if(offset)
                {
                    return offset;
                }
            }
        }

        return AnimationAction.DEFAULT_OFFSET;
    }

    private parseXml(element: Element): void
    {
        for(const partElement of getXmlChildElements(element, 'part'))
        {
            const actionPart = new AnimationActionPart(partElement);

            this._parts.set(getXmlAttribute(partElement, 'set-type'), actionPart);
            this._frameCount = Math.max(this._frameCount, actionPart.frames.length);
        }

        const offsetsElement = getXmlFirstChildElement(element, 'offsets');

        if(offsetsElement !== null)
        {
            for(const frameElement of getXmlChildElements(offsetsElement, 'frame'))
            {
                this.parseOffsetFrame(
                    getXmlAttribute(frameElement, 'id'),
                    getXmlAttribute(frameElement, 'repeats'),
                    getXmlFirstChildElement(frameElement, 'directions')
                );
            }
        }
    }

    private parseObject(data: any): void
    {
        const rawParts = data.parts || data.part;

        if(rawParts)
        {
            const parts: any[] = Array.isArray(rawParts) ? rawParts : [rawParts];

            for(const partData of parts)
            {
                const actionPart = new AnimationActionPart(partData);

                this._parts.set(String(partData.setType ?? partData['set-type']), actionPart);
                this._frameCount = Math.max(this._frameCount, actionPart.frames.length);
            }
        }

        const rawOffsetFrames = Array.isArray(data.offsets)
            ? data.offsets
            : (data.offsets?.frame ? (Array.isArray(data.offsets.frame) ? data.offsets.frame : [data.offsets.frame]) : null);

        if(rawOffsetFrames)
        {
            for(const frameData of rawOffsetFrames)
            {
                this.parseObjectOffsetFrame(frameData);
            }
        }
    }

    private parseOffsetFrame(frameIdData: string, repeatsData: string, directionsElement: Element | null): void
    {
        const frameId = parseInt(frameIdData) || 0;
        this._frameCount = Math.max(this._frameCount, frameId);

        const directionMap = new Map<number, Map<string, { x: number; y: number }>>();
        this._offsets.set(frameId, directionMap);

        if(directionsElement !== null)
        {
            for(const directionElement of getXmlChildElements(directionsElement, 'direction'))
            {
                const directionId = parseInt(getXmlAttribute(directionElement, 'id')) || 0;
                const bodyPartMap = new Map<string, { x: number; y: number }>();
                directionMap.set(directionId, bodyPartMap);

                for(const bodyPartElement of getXmlChildElements(directionElement, 'bodypart'))
                {
                    bodyPartMap.set(getXmlAttribute(bodyPartElement, 'id'), {
                        x: parseInt(getXmlAttribute(bodyPartElement, 'dx')) || 0,
                        y: parseInt(getXmlAttribute(bodyPartElement, 'dy')) || 0
                    });
                }
            }
        }

        this.pushOffsetFrame(frameId, repeatsData);
    }

    private parseObjectOffsetFrame(frameData: any): void
    {
        const frameId = parseInt(frameData.id) || 0;
        this._frameCount = Math.max(this._frameCount, frameId);

        const directionMap = new Map<number, Map<string, { x: number; y: number }>>();
        this._offsets.set(frameId, directionMap);

        const rawDirections = Array.isArray(frameData.directions)
            ? frameData.directions
            : (frameData.directions?.direction
                ? (Array.isArray(frameData.directions.direction) ? frameData.directions.direction : [frameData.directions.direction])
                : null);

        if(rawDirections)
        {
            for(const directionData of rawDirections)
            {
                const directionId = parseInt(directionData.id) || 0;
                const bodyPartMap = new Map<string, { x: number; y: number }>();
                directionMap.set(directionId, bodyPartMap);

                const rawBodyParts = directionData.bodyParts || directionData.bodypart;

                if(rawBodyParts)
                {
                    const bodyParts: any[] = Array.isArray(rawBodyParts) ? rawBodyParts : [rawBodyParts];

                    for(const bodyPartData of bodyParts)
                    {
                        bodyPartMap.set(String(bodyPartData.id), {
                            x: (bodyPartData.dx !== undefined) ? parseInt(bodyPartData.dx) || 0 : 0,
                            y: (bodyPartData.dy !== undefined) ? parseInt(bodyPartData.dy) || 0 : 0
                        });
                    }
                }
            }
        }

        this.pushOffsetFrame(frameId, frameData.repeats);
    }

    private pushOffsetFrame(frameId: number, repeatsData: any): void
    {
        this._offsetFrames.push(frameId);

        let repeats = parseInt(repeatsData) || 0;

        if(repeats > 1)
        {
            while(--repeats > 0)
            {
                this._offsetFrames.push(frameId);
            }
        }
    }
}