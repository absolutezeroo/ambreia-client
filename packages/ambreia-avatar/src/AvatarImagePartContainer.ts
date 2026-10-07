import type {IActionDefinition} from './actions/IActionDefinition';
import type {AnimationFrame} from './structure/animation/AnimationFrame';
import type {IPartColor} from './structure/figure/IPartColor';

/**
 * Container for a single part in an avatar image, holding its rendering data.
 *
 * @see sources/win63_version/habbo/avatar/AvatarImagePartContainer.as
 */
export class AvatarImagePartContainer
{
    private _frames: any[];

    constructor(
        bodyPartId: string,
        partType: string,
        partId: string,
        color: IPartColor | null,
        frames: any[],
        action: IActionDefinition,
        isColorable: boolean,
        paletteMapId: number,
        flippedPartType: string = '',
        isBlendable: boolean = false,
        alpha: number = 1
    )
    {
        this._bodyPartId = bodyPartId;
        this._partType = partType;
        this._partId = partId;
        this._color = color;
        this._frames = frames;
        this._action = action;
        this._isColorable = isColorable;
        this._paletteMapId = paletteMapId;
        this._flippedPartType = flippedPartType;
        this._isBlendable = isBlendable;
        this._blendTransform = {redMultiplier: 1, greenMultiplier: 1, blueMultiplier: 1, alphaMultiplier: alpha};

        if(this._partType === 'ey')
        {
            this._isColorable = false;
        }
    }

    private _bodyPartId: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get bodyPartId()
    public get bodyPartId(): string
    {
        return this._bodyPartId;
    }

    private _partType: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get partType()
    public get partType(): string
    {
        return this._partType;
    }

    private _flippedPartType: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get flippedPartType()
    public get flippedPartType(): string
    {
        return this._flippedPartType;
    }

    private _partId: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get partId()
    public get partId(): string
    {
        return this._partId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::_color
    private _color: IPartColor | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get color()
    public get color(): IPartColor | null
    {
        return this._color;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::_action
    private _action: IActionDefinition;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get action()
    public get action(): IActionDefinition
    {
        return this._action;
    }

    private _isColorable: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get isColorable()
    public get isColorable(): boolean
    {
        return this._isColorable;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::set isColorable()
    public set isColorable(value: boolean)
    {
        this._isColorable = value;
    }

    private _isBlendable: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get isBlendable()
    public get isBlendable(): boolean
    {
        return this._isBlendable;
    }

    private _blendTransform: {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get blendTransform()
    public get blendTransform(): {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number
    }
    {
        return this._blendTransform;
    }

    private _paletteMapId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::get paletteMapId()
    public get paletteMapId(): number
    {
        return this._paletteMapId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::getFrameIndex()
    public getFrameIndex(frameCounter: number): number
    {
        if(!this._frames || this._frames.length === 0) return 0;

        const index = frameCounter % this._frames.length;
        const frame = this._frames[index];

        if(frame && typeof frame === 'object' && 'number' in frame)
        {
            return (frame as AnimationFrame).number;
        }

        return index;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::getFrameDefinition()
    public getFrameDefinition(frameCounter: number): AnimationFrame | null
    {
        const index = frameCounter % this._frames.length;

        if(this._frames && this._frames.length > index)
        {
            const frame = this._frames[index];

            if(frame && typeof frame === 'object' && 'number' in frame)
            {
                return frame as AnimationFrame;
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::getCacheableKey()
    public getCacheableKey(frameCounter: number): string
    {
        const index = frameCounter % this._frames.length;

        if(this._frames && this._frames.length > index)
        {
            const frame = this._frames[index];

            if(frame && typeof frame === 'object' && 'assetPartDefinition' in frame)
            {
                const animFrame = frame as AnimationFrame;

                return this._partId + ':' + animFrame.assetPartDefinition + ':' + animFrame.number;
            }
        }

        return this._partId + ':' + index;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImagePartContainer.as::toString()
    public toString(): string
    {
        return [this._bodyPartId, this._partType, this._partId].join(':');
    }
}
