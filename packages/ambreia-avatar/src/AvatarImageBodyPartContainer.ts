import type {Texture} from 'pixi.js';

import type {IAvatarPartSprite} from './AvatarPartSprite';

/**
 * Container for a rendered avatar body part image.
 * Holds the composited texture, registration point, offset, and cacheability flag.
 *
 * @see sources/win63_version/habbo/avatar/AvatarImageBodyPartContainer.as
 */
export class AvatarImageBodyPartContainer
{
    constructor(image: Texture | null, regPoint: { x: number; y: number }, isCacheable: boolean, faceOffset: { x: number; y: number } | null = null)
    {
        this._offset = {x: 0, y: 0};
        this._image = image;
        this._regPoint = {x: regPoint.x, y: regPoint.y};
        this._isCacheable = isCacheable;
        this._faceOffset = faceOffset;
        this.cleanPoints();
    }

    private _image: Texture | null;

    /**
	 * The rendered texture for this body part.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::get image()
    public get image(): Texture | null
    {
        return this._image;
    }

    /**
	 * Sets the rendered texture, disposing the previous one if different.
	 */
    public set image(value: Texture | null)
    {
        if(this._image && this._image !== value)
        {
            this._image.destroy(true);
        }

        this._image = value;
    }

    // TS-only: see `get parts()`.
    private _parts: IAvatarPartSprite[] | null = null;

    /**
     * The parts this container is made of, when it was built without compositing them.
     *
     * Null on the composed path, where the parts were blitted into `image` and thrown away. Non-null
     * only under `AvatarRenderMode.spriteParts`, and then `image` is null instead: a container
     * carries one or the other, never both, because holding both would mean paying for the
     * composition this exists to avoid.
     */
    // TS-only: no AS3 counterpart — AS3 had nothing to hand parts to.
    public get parts(): IAvatarPartSprite[] | null
    {
        return this._parts;
    }

    // TS-only: see `get parts()`.
    public set parts(value: IAvatarPartSprite[] | null)
    {
        this._parts = value;
    }

    // TS-only: see `get size()`.
    private _size: { width: number; height: number } = {width: 0, height: 0};

    /**
     * The union bounding box the parts would have composited into.
     *
     * The composed path reads these off the finished texture; without a texture there is nothing to
     * measure, so the size is recorded when the box is computed. `AvatarVisualization` needs it to
     * place the avatar: its offsets are expressed in terms of the composed image's dimensions.
     */
    // TS-only: no AS3 counterpart — AS3 read `image.width`/`image.height`.
    public get size(): { width: number; height: number }
    {
        return this._size;
    }

    // TS-only: see `get size()`.
    public set size(value: { width: number; height: number })
    {
        this._size = {width: value.width, height: value.height};
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::_regPoint
    private _regPoint: { x: number; y: number };

    /**
	 * The combined registration point (regPoint + offset).
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::get regPoint()
    public get regPoint(): { x: number; y: number }
    {
        return {
            x: this._regPoint.x + this._offset.x,
            y: this._regPoint.y + this._offset.y
        };
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::_offset
    private _offset: { x: number; y: number };

    /**
	 * Sets the offset and rounds coordinates.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::set offset()
    public set offset(value: { x: number; y: number })
    {
        this._offset = {x: value.x, y: value.y};
        this.cleanPoints();
    }

    private _isCacheable: boolean;

    /**
	 * Whether this body part container can be cached.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::get isCacheable()
    public get isCacheable(): boolean
    {
        return this._isCacheable;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::faceOffset
    private _faceOffset: { x: number; y: number } | null;

    /**
	 * The face part's own offset (only set on the "head" container's face part), used
	 * for chat-bubble placement.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::get faceOffset()
    public get faceOffset(): { x: number; y: number } | null
    {
        return this._faceOffset;
    }

    /**
	 * Sets the registration point and rounds coordinates.
	 */
    public setRegPoint(point: { x: number; y: number }): void
    {
        this._regPoint = {x: point.x, y: point.y};
        this.cleanPoints();
    }

    /**
	 * Disposes the texture and nullifies references.
	 */
    /**
     * `destroy(true)`, not `destroy()`.
     *
     * AS3 held a `BitmapData` here and called `dispose()` on it, which frees the pixels. The PixiJS
     * equivalent of that is `Texture.destroy(destroySource)` — and `destroySource` defaults to
     * **false**, so the bare call frees the texture wrapper and leaves the `CanvasSource`, its
     * OffscreenCanvas and the GPU texture behind. Every composed body part leaked one.
     *
     * That leak is invisible to the obvious instrument: it lives outside the JS heap, so a stress
     * run showed `heapMb` flat at ~290MB while each composition kept getting more expensive and the
     * cost carried over into the next run. Safe to destroy the source here because each of these
     * textures is built by `createUnionImage()` over its own private canvas, one to one, and is
     * only ever read synchronously as a `drawImage` source — nothing else holds it.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::dispose()
    public dispose(): void
    {
        if(this._image)
        {
            this._image.destroy(true);
        }

        this._image = null;
        this._regPoint = null!;
        this._offset = null!;
    }

    /**
	 * Rounds all point coordinates to integers (mimics AS3 int() cast).
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImageBodyPartContainer.as::cleanPoints()
    private cleanPoints(): void
    {
        this._regPoint.x = Math.trunc(this._regPoint.x);
        this._regPoint.y = Math.trunc(this._regPoint.y);
        this._offset.x = Math.trunc(this._offset.x);
        this._offset.y = Math.trunc(this._offset.y);
    }
}
