import type {Texture} from 'pixi.js';

/**
 * Color transform data for avatar part tinting.
 * Replaces Flash's ColorTransform class.
 */
export interface IColorTransformData
{
    redMultiplier: number;
    greenMultiplier: number;
    blueMultiplier: number;
    alphaMultiplier: number;
}

/**
 * Holds a rendered image (Texture) along with its spatial metadata:
 * bounding rectangle, registration point, horizontal flip flag, and color transform.
 *
 * @see sources/win63_version/habbo/avatar/cache/ImageData.as
 */
export class ImageData
{
    constructor(
        texture: Texture | null,
        rect: { x: number; y: number; width: number; height: number },
        regPoint: { x: number; y: number },
        flipH: boolean,
        colorTransform: IColorTransformData | null
    )
    {
        this._texture = texture;
        this._rect = rect;
        this._regPoint = {x: regPoint.x, y: regPoint.y};
        this._flipH = flipH;
        this._colorTransform = colorTransform;

        if(flipH)
        {
            this._regPoint.x = -(this._regPoint.x) + rect.width;
        }
    }

    private _texture: Texture | null;

    /**
	 * The rendered texture for this image data.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/ImageData.as::get bitmap()
    public get texture(): Texture | null
    {
        return this._texture;
    }

    private _rect: { x: number; y: number; width: number; height: number };

    /**
	 * The bounding rectangle of the source asset.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/ImageData.as::get rect()
    public get rect(): { x: number; y: number; width: number; height: number }
    {
        return this._rect;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/ImageData.as::_regPoint
    private _regPoint: { x: number; y: number };

    /**
	 * The registration point (origin offset) of this image.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/ImageData.as::get regPoint()
    public get regPoint(): { x: number; y: number }
    {
        return this._regPoint;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/ImageData.as::_flipH
    private _flipH: boolean;

    /**
	 * Whether this image is horizontally flipped.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/ImageData.as::get flipH()
    public get flipH(): boolean
    {
        return this._flipH;
    }

    private _colorTransform: IColorTransformData | null;

    /**
	 * The color transform applied to this image, or null if none.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/ImageData.as::get colorTransform()
    public get colorTransform(): IColorTransformData | null
    {
        return this._colorTransform;
    }

    /**
	 * Returns a new rectangle offset by the negative registration point.
	 * Matches AS3: new Rectangle(0, 0, width, height).offset(-regPoint.x, -regPoint.y)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/ImageData.as::get offsetRect()
    public get offsetRect(): { x: number; y: number; width: number; height: number }
    {
        return {
            x: -this._regPoint.x,
            y: -this._regPoint.y,
            width: this._rect.width,
            height: this._rect.height
        };
    }

    /**
	 * Disposes the texture and nullifies references.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/ImageData.as::dispose()
    public dispose(): void
    {
        this._texture = null;
        this._regPoint = null!;
        this._colorTransform = null;
    }
}
