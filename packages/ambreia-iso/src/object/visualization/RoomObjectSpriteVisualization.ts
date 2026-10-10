/**
 * RoomObjectSpriteVisualization
 *
 * Based on AS3: com.sulake.room.object.visualization.RoomObjectSpriteVisualization
 *
 * Base class for sprite-based room object visualizations.
 * Manages a collection of RoomObjectSprite data objects.
 * The canvas (RoomRenderingCanvas) reads sprite data via getSprite(i)
 * and owns the actual display objects (ExtendedSprites).
 */
import {Container, Graphics, Sprite, Texture} from 'pixi.js';
import type {IRoomObject} from '../IRoomObject';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import {ColorConverter} from '../../utils/ColorConverter';
import type {IRoomObjectSprite} from './IRoomObjectSprite';
import type {IRoomObjectSpriteVisualization} from './IRoomObjectSpriteVisualization';
import type {IRoomObjectVisualizationData} from './IRoomObjectVisualizationData';
import type {IGraphicAssetCollection} from '@ambreia/common/graphics/IGraphicAssetCollection';
import type {RoomObjectSpriteData} from '@ambreia/common/graphics/RoomObjectSpriteData';
import {RoomObjectSprite} from './RoomObjectSprite';
import {extractCanvas} from '../../renderer/TextureExtractor';

let visualizationInstanceCounter = 0;

export class RoomObjectSpriteVisualization implements IRoomObjectSpriteVisualization
{
    protected static readonly LAYER_SEPARATOR: string = '_';
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::ICON_LAYER_ID
    protected static readonly ICON_LAYER_ID: string = '_icon_';
    protected _scale: number = -1;
    protected _updateModelCounter: number = -1;
    protected _direction: number = -1;
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::_sprites
    private _sprites: RoomObjectSprite[] = [];
    private _instanceId: number;
    private _updateId: number = 0;
    private _boundsDirty: boolean = true;
    private _cachedBounds: { x: number; y: number; width: number; height: number } = {x: 0, y: 0, width: 0, height: 0};

    constructor()
    {
        this._instanceId = visualizationInstanceCounter++;
    }

    private _assetCollection: IGraphicAssetCollection | null = null;

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::get assetCollection()
    get assetCollection(): IGraphicAssetCollection | null
    {
        return this._assetCollection;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::set assetCollection()
    set assetCollection(value: IGraphicAssetCollection | null)
    {
        if(value === this._assetCollection) return;

        // The collection is retained by what draws from it, and RoomContentLoader.purge() drops a
        // collection only once nothing has for CONTENT_DROP_DELAY. The port had lost both calls:
        // every purge (each session end) disposed every furniture and pet collection at once, and
        // re-entering a room downloaded and decoded all of it again.
        this._assetCollection?.removeReference();
        this._assetCollection = value;
        value?.addReference();
    }

    /**
     * A no-op at this level in AS3 too — RoomManager calls it on every visualization it creates
     * (right after assetCollection), but only FurnitureExternalImageVisualization overrides it to
     * do anything (it records the URLs used to resolve external-image/selfie thumbnails). The
     * base no-op is kept here for interface parity with every other visualization.
     */
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::setExternalBaseUrls()
    setExternalBaseUrls(_baseUrl: string, _secureBaseUrl: string, _batchesEnabled: boolean): void
    {
        // Override in subclasses
    }

    private _object: IRoomObject | null = null;

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::get object()
    get object(): IRoomObject | null
    {
        return this._object;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::set object()
    set object(value: IRoomObject | null)
    {
        this._object = value;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::get spriteCount()
    get spriteCount(): number
    {
        return this._sprites.length;
    }

    /**
	 * Get the bounding rectangle of all visible sprites
	 */
    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::get boundingRectangle()
    get boundingRectangle(): { x: number; y: number; width: number; height: number }
    {
        if(!this._boundsDirty)
        {
            return this._cachedBounds;
        }

        let left = 0;
        let top = 0;
        let right = 0;
        let bottom = 0;

        for(let i = 0; i < this._sprites.length; i++)
        {
            const sprite = this._sprites[i];

            if(sprite !== null && sprite.visible && sprite.texture !== null)
            {
                const x = sprite.offsetX;
                const y = sprite.offsetY;

                // AS3 seeds the rectangle from index 0 specifically (`if(_loc7_ == 0)`), not from
                // the first sprite it accepts: when sprite 0 is invisible or has no asset, the seed
                // branch never runs and the rect stays `new Rectangle()` — so every later sprite is
                // unioned against (0, 0), the object's own origin, and the box reaches down to it.
                // A `first`-accepted-sprite flag skipped that and produced a tight union instead,
                // which is a shorter box whenever sprite 0 is skipped. `height` feeds
                // `AvatarContextInfoView.getOffset()`'s `> 50` test and `getMaximumVerticalLead()`,
                // so a shorter box moves the name bubble.
                if(i === 0)
                {
                    left = x;
                    top = y;
                    right = x + sprite.width;
                    bottom = y + sprite.height;
                }
                else
                {
                    if(x < left) left = x;
                    if(y < top) top = y;
                    if(x + sprite.width > right) right = x + sprite.width;
                    if(y + sprite.height > bottom) bottom = y + sprite.height;
                }
            }
        }

        this._cachedBounds.x = left;
        this._cachedBounds.y = top;
        this._cachedBounds.width = right - left;
        this._cachedBounds.height = bottom - top;
        this._boundsDirty = false;

        return this._cachedBounds;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::get image()
    get image(): HTMLCanvasElement | null
    {
        return this.getImage(0, -1);
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::normalizeColourComponent()
    private static normalizeColourComponent(value: number): number
    {
        return Math.max(0, Math.min(255, value)) / 255;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::getImage()
    // TS deviation: AS3 composites via BitmapData.draw() (a software rasterizer with no
    // renderer dependency). PixiJS needs a live Renderer to rasterize, so this builds a
    // throwaway Container of plain Sprites (position/tint/alpha/blendMode/flip mirroring
    // AS3's Matrix+ColorTransform math exactly) and reads it back via
    // the host's renderer (extractCanvas(), see TextureExtractor) - the same synchronous
    // texture-to-canvas mechanism RoomEngine.pixiTextureToCanvas() already uses.
    getImage(backgroundColor: number, _originalId: number): HTMLCanvasElement | null
    {
        const bounds = this.boundingRectangle;

        // also backs every furniture icon, so an unfiltered log here floods the console.
        if(bounds.width * bounds.height === 0) return null;

        const visible: RoomObjectSprite[] = [];

        for(let i = 0; i < this._sprites.length; i++)
        {
            const sprite = this._sprites[i];

            if(sprite !== null && sprite.visible && sprite.texture !== null) visible.push(sprite);
        }

        if(visible.length > 1) visible.sort((a, b) => b.relativeDepth - a.relativeDepth);

        const container = new Container();

        const bgAlpha = (backgroundColor >>> 24) & 0xFF;

        if(bgAlpha > 0)
        {
            const fill = new Graphics()
                .rect(0, 0, bounds.width, bounds.height)
                .fill({color: backgroundColor & 0xFFFFFF, alpha: RoomObjectSpriteVisualization.normalizeColourComponent(bgAlpha)});

            container.addChild(fill);
        }

        for(const sprite of visible)
        {
            const displaySprite = this.buildCompositeSprite(sprite, bounds, backgroundColor);

            if(displaySprite !== null) container.addChild(displaySprite);
        }

        const canvas = this.extractContainerToCanvas(container);

        container.destroy({children: true});

        return canvas;
    }

    private extractContainerToCanvas(container: Container): HTMLCanvasElement | null
    {
        try
        {
            return extractCanvas(container);
        }
        catch
        {
            return null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::getImage()
    // (inlined per-sprite compositing loop body)
    private buildCompositeSprite(
        sprite: RoomObjectSprite,
        bounds: { x: number; y: number; width: number; height: number },
        backgroundColor: number
    ): Sprite | null
    {
        let texture = sprite.texture;

        if(texture === null) return null;

        if(backgroundColor === 0 && sprite.blendMode === 'add')
        {
            texture = this.extractDarknessToAlpha(texture);

            if(texture === null) return null;
        }

        const displaySprite = new Sprite(texture);

        displaySprite.tint = sprite.color;
        displaySprite.alpha = RoomObjectSpriteVisualization.normalizeColourComponent(sprite.alpha);
        displaySprite.blendMode = sprite.blendMode as Sprite['blendMode'];
        displaySprite.scale.x = sprite.flipH ? -1 : 1;
        displaySprite.scale.y = sprite.flipV ? -1 : 1;
        displaySprite.x = sprite.offsetX - bounds.x + (sprite.flipH ? sprite.width : 0);
        displaySprite.y = sprite.offsetY - bounds.y + (sprite.flipV ? sprite.height : 0);

        return displaySprite;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::extractDarknessToAlpha()
    // Encodes a sprite's darkness as transparency (used for "add"-blend glow sprites composited
    // onto a fully transparent background, where additive blending against nothing would
    // otherwise just vanish). Ported as a synchronous 2D-canvas pixel pass, matching AS3's
    // per-pixel BitmapData.getVector()/setVector() loop exactly (same HSL math via the
    // already-ported ColorConverter).
    private extractDarknessToAlpha(texture: Texture): Texture | null
    {
        try
        {
            const source = this.textureFrameToCanvas(texture) ?? extractCanvas(texture);

            if(source === null) return null;

            const width = source.width;
            const height = source.height;

            if(width < 1 || height < 1) return null;

            const context = source.getContext('2d');

            if(context === null) return null;

            const imageData = context.getImageData(0, 0, width, height);
            const data = imageData.data;

            for(let i = 0; i < data.length; i += 4)
            {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                const hsl = ColorConverter.rgbToHSL((r << 16) | (g << 8) | b);
                let lightness = hsl & 0xFF;

                if(lightness <= 128)
                {
                    const hue = (hsl >> 16) & 0xFF;
                    const saturation = (hsl >> 8) & 0xFF;
                    const newAlpha = a * (lightness / 128);

                    lightness = 128;

                    const rgb = ColorConverter.hslToRGB((hue << 16) + (saturation << 8) + lightness);

                    data[i] = (rgb >> 16) & 0xFF;
                    data[i + 1] = (rgb >> 8) & 0xFF;
                    data[i + 2] = rgb & 0xFF;
                    data[i + 3] = newAlpha;
                }
            }

            context.putImageData(imageData, 0, 0);

            return Texture.from(source);
        }
        catch
        {
            return null;
        }
    }

    /**
     * Copies a texture's frame out of its CPU-side source bitmap, with no GPU involvement.
     *
     * `extractDarknessToAlpha()` used to reach for `renderer.extract.canvas(texture)` here. That is
     * wrong for a canvas-backed texture - the ones `GraphicAssetCollection.colorizePalette()` hands
     * back as `Texture.from(canvas)` - because PixiJS leaves such a render target's framebuffer at
     * `null` and reads the screen instead of the texture (see the note in `Vortex.init()`; measured
     * to return the background colour in both `multiView` modes). It is also a synchronous GPU
     * readback on a path that runs once per furniture icon.
     *
     * AS3 has no equivalent step at all: `extractDarknessToAlpha(param1:BitmapData)` reads its
     * source with `param1.getVector(param1.rect)`, a plain CPU read. This restores that.
     *
     * Returns null when the frame is not provably a straight sub-rectangle of the resource - no CPU
     * resource, or a rotated or trimmed frame - and the caller falls back to `extract.canvas()`, so
     * correctness never depends on this path succeeding.
     */
    // TS-only: AS3 read the source BitmapData directly, so it had no conversion step of its own.
    private textureFrameToCanvas(texture: Texture): HTMLCanvasElement | null
    {
        const resource = (texture.source as unknown as { resource?: unknown } | null)?.resource;

        if(!resource) return null;

        const drawable = (typeof ImageBitmap !== 'undefined' && resource instanceof ImageBitmap)
            || (typeof OffscreenCanvas !== 'undefined' && resource instanceof OffscreenCanvas)
            || resource instanceof HTMLCanvasElement
            || resource instanceof HTMLImageElement;

        if(!drawable) return null;
        if((texture.rotate ?? 0) !== 0) return null;
        if(texture.trim) return null;

        const frame = texture.frame;

        if(frame.width < 1 || frame.height < 1) return null;

        const canvas = document.createElement('canvas');

        canvas.width = Math.ceil(frame.width);
        canvas.height = Math.ceil(frame.height);

        const context = canvas.getContext('2d');

        if(context === null) return null;

        context.imageSmoothingEnabled = false;
        context.drawImage(
            resource as CanvasImageSource,
            frame.x, frame.y, frame.width, frame.height,
            0, 0, canvas.width, canvas.height
        );

        return canvas;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::dispose()
    dispose(): void
    {
        if(this._sprites !== null)
        {
            while(this._sprites.length > 0)
            {
                const sprite = this._sprites[0];

                if(sprite !== null)
                {
                    sprite.dispose();
                }

                this._sprites.pop();
            }

            this._sprites = [];
        }

        this.assetCollection = null;
        this._object = null;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::getUpdateID()
    getUpdateID(): number
    {
        return this._updateId;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::getInstanceId()
    getInstanceId(): number
    {
        return this._instanceId;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::addSprite()
    addSprite(): IRoomObjectSprite
    {
        return this.addSpriteAt(this._sprites.length);
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::addSpriteAt()
    addSpriteAt(index: number): IRoomObjectSprite
    {
        const sprite = new RoomObjectSprite();

        if(index >= this._sprites.length)
        {
            this._sprites.push(sprite);
        }
        else
        {
            this._sprites.splice(index, 0, sprite);
        }

        return sprite;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::removeSprite()
    removeSprite(sprite: IRoomObjectSprite): void
    {
        const index = this._sprites.indexOf(sprite as RoomObjectSprite);

        if(index === -1)
        {
            throw new Error('Trying to remove non-existing sprite!');
        }

        this._sprites.splice(index, 1);
        (sprite as RoomObjectSprite).dispose();
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::getSprite()
    getSprite(index: number): IRoomObjectSprite | null
    {
        if(index >= 0 && index < this._sprites.length)
        {
            return this._sprites[index];
        }

        return null;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::update()
    update(_geometry: IRoomGeometry, _time: number, _update: boolean, _skipUpdate: boolean): void
    {
        // Override in subclasses
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::getSpriteList()
    getSpriteList(): RoomObjectSpriteData[] | null
    {
        return null;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::initialize()
    initialize(_data: IRoomObjectVisualizationData): boolean
    {
        return false;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::createSprites()
    protected createSprites(count: number): void
    {
        // Remove excess sprites
        while(this._sprites.length > count)
        {
            const sprite = this._sprites[this._sprites.length - 1];

            if(sprite !== null)
            {
                sprite.dispose();
            }

            this._sprites.pop();
        }

        // Add missing sprites
        while(this._sprites.length < count)
        {
            const sprite = new RoomObjectSprite();
            this._sprites.push(sprite);
        }
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::increaseUpdateId()
    protected increaseUpdateId(): void
    {
        this._updateId++;
        this._boundsDirty = true;
    }

    // AS3: .../src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::reset()
    protected reset(): void
    {
        this._scale = 0xFFFFFFFF;
        this._updateModelCounter = 0xFFFFFFFF;
        this._direction = -1;
    }
}
