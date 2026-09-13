/**
 * HabbiconBubble
 *
 * The Habbicon a user triggered, floating above their avatar for three seconds: the icon itself on
 * a white outline, over a blurred drop shadow, sliding up 12px as it fades in and fading out again
 * — the icon and its background on deliberately different clocks, so the panel outlives the icon by
 * a third of a second.
 *
 * **Flash composited this with `BitmapData`; the port composites with `OffscreenCanvas` and hands
 * PixiJS a `Texture`.** The three static caches survive that change unaltered and matter as much
 * here as there: the outline is 24 stamped copies of a silhouette and the shadow is a blur, both
 * per habbicon frame, and every avatar in the room triggering the same icon would otherwise redo
 * them. They are keyed exactly as AS3 keys them — id, kind, size and frame index.
 *
 * Almost every field in the AS3 is obfuscated (`_SafeStr_4609`, `_SafeStr_8105`, …) and recovered in
 * no tree, so the names below are DERIVED from what each one is compared against or written from;
 * the methods and the constants kept their real names and are traced as such.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/additions/HabbiconBubble.as
 */
import {Texture} from 'pixi.js';
import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import type {IAvatarAddition} from './IAvatarAddition';
import type {IStackedAvatarAddition} from './IStackedAvatarAddition';
import type {StackedAdditionSource} from '../../stacked/IStackedAddition';
import type {AvatarVisualization} from '../AvatarVisualization';
import {HabbiconAssetManager} from '@habbo/habbicons/assets/HabbiconAssetManager';
import type {
    IHabbiconAnimationStep,
    IHabbiconRuntimeAsset
} from '@habbo/habbicons/assets/HabbiconDefinition';

export class HabbiconBubble implements IAvatarAddition, IStackedAvatarAddition
{
    /**
     * The picture, kept alongside the texture so the addition stack can composite it.
     *
     * `setBitmap()` hands its canvas to `transferToImageBitmap()`, which DETACHES the canvas — so
     * the ImageBitmap is the only drawable copy left, and the stack needs one. See the deviation
     * note on `IStackedAddition.stackSourceBitmap` for why the stack cannot read the texture back.
     */
    // AS3: .../additions/HabbiconBubble.as::_bitmap
    private _stackSource: ImageBitmap | null = null;

    // AS3: .../additions/HabbiconBubble.as::_isPartOfStack (name derived)
    private _isPartOfStack: boolean = false;

    // AS3: .../additions/HabbiconBubble.as::DEFAULT_VISIBLE_DURATION_MS
    private static readonly DEFAULT_VISIBLE_DURATION_MS: number = 3000;
    // AS3: .../additions/HabbiconBubble.as::INTRO_DURATION_MS
    private static readonly INTRO_DURATION_MS: number = 180;
    // AS3: .../additions/HabbiconBubble.as::INTRO_START_OFFSET_Y
    private static readonly INTRO_START_OFFSET_Y: number = 12;
    // AS3: .../additions/HabbiconBubble.as::FADE_IN_DURATION_MS
    private static readonly FADE_IN_DURATION_MS: number = 150;
    // AS3: .../additions/HabbiconBubble.as::FADE_OUT_DURATION_MS
    private static readonly FADE_OUT_DURATION_MS: number = 350;
    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_VISIBLE_DURATION_MS
    private static readonly BACKGROUND_VISIBLE_DURATION_MS: number = 3350;
    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_FADE_OUT_DURATION_MS
    private static readonly BACKGROUND_FADE_OUT_DURATION_MS: number = 530;

    // AS3: .../additions/HabbiconBubble.as::ROOM_LARGE_OFFSET_X
    private static readonly ROOM_LARGE_OFFSET_X: number = -20;
    // AS3: .../additions/HabbiconBubble.as::ROOM_LARGE_OFFSET_Y
    private static readonly ROOM_LARGE_OFFSET_Y: number = -126;
    // AS3: .../additions/HabbiconBubble.as::ROOM_SMALL_OFFSET_X
    private static readonly ROOM_SMALL_OFFSET_X: number = -10;
    // AS3: .../additions/HabbiconBubble.as::ROOM_SMALL_OFFSET_Y
    private static readonly ROOM_SMALL_OFFSET_Y: number = -65;
    // AS3: .../additions/HabbiconBubble.as::DEFAULT_RELATIVE_DEPTH
    private static readonly DEFAULT_RELATIVE_DEPTH: number = -0.2;

    /** Half-width of the outline, in pixels: the silhouette is stamped across a -2..2 square. */
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_10643
    private static readonly OUTLINE_THICKNESS: number = 2;
    /** The outline's colour — AS3 spells it as the literal `4294967295`, opaque white. */
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_10625
    private static readonly OUTLINE_COLOR: string = '#ffffff';

    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_SHADOW_PADDING
    private static readonly BACKGROUND_SHADOW_PADDING: number = 5;
    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_CONTENT_INSET
    private static readonly BACKGROUND_CONTENT_INSET: number = 7;
    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_SHADOW_OFFSET_X
    private static readonly BACKGROUND_SHADOW_OFFSET_X: number = 1.5;
    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_SHADOW_OFFSET_Y
    private static readonly BACKGROUND_SHADOW_OFFSET_Y: number = 2;
    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_SHADOW_BLUR
    private static readonly BACKGROUND_SHADOW_BLUR: number = 6;
    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_SHADOW_ALPHA
    private static readonly BACKGROUND_SHADOW_ALPHA: number = 0.55;
    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_SHADOW_COLOR
    private static readonly BACKGROUND_SHADOW_COLOR: string = '#000000';

    /** Below this the room is drawn at half size and every offset and frame halves with it. */
    // AS3: .../additions/HabbiconBubble.as::update() (the `param2 < 48` test, spelled inline)
    private static readonly SMALL_SCALE_THRESHOLD: number = 48;

    /** Side of the placeholder square, per scale. AS3 spells both inline in resolveBitmap(). */
    // AS3: .../additions/HabbiconBubble.as::resolveBitmap()
    private static readonly PLACEHOLDER_SIZE_SMALL: number = 20;
    // AS3: .../additions/HabbiconBubble.as::resolveBitmap()
    private static readonly PLACEHOLDER_SIZE_LARGE: number = 40;

    // AS3: .../additions/HabbiconBubble.as::_SafeStr_8676
    private static readonly OUTLINE_BITMAP_CACHE: Map<string, ImageBitmap> = new Map();
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_8554
    private static readonly MIRRORED_BITMAP_CACHE: Map<string, ImageBitmap> = new Map();
    // AS3: .../additions/HabbiconBubble.as::BACKGROUND_SHADOW_BITMAP_CACHE
    private static readonly BACKGROUND_SHADOW_BITMAP_CACHE: Map<string, ImageBitmap> = new Map();

    // AS3: .../additions/HabbiconBubble.as::_SafeStr_4872
    private _id: number = -1;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_4736
    private _avatar: AvatarVisualization | null;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_6120
    private _habbiconId: number;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_8840
    private _triggerSequence: number;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_4751
    private _scale: number = 0;

    /**
     * The composed frame, as a texture rather than AS3's `BitmapData`. Owned here and destroyed on
     * replacement — the equivalent of AS3's `_bitmap.dispose()`, and just as necessary: a texture
     * per animation frame per avatar adds up on the GPU.
     */
    // AS3: .../additions/HabbiconBubble.as::_bitmap
    private _texture: Texture | null = null;
    // TS-only: AS3 reads `_bitmap.width` / `.height` off the BitmapData whenever it needs them.
    //   A PixiJS Texture is handed the pixels and the canvas is blanked, so the two dimensions the
    //   anchor compensation depends on are remembered here instead.
    private _textureWidth: number = 0;
    // TS-only: as above.
    private _textureHeight: number = 0;

    /**
     * The canvas the frame is composed on, kept across frames exactly as AS3 keeps `_bitmap`.
     * `transferToImageBitmap()` hands the pixels away and leaves the canvas blank at the same size,
     * so reuse costs nothing and matches AS3's "same size and not shared" branch.
     */
    // TS-only: AS3 composes into the BitmapData it is about to display; this port cannot, because
    //   the displayed object is an immutable texture, so the scratch surface is separate.
    private _composeCanvas: OffscreenCanvas | null = null;

    // AS3: .../additions/HabbiconBubble.as::_SafeStr_5743
    private _textureIsShared: boolean = false;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_6037
    private _textureHasBackground: boolean = false;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_6851
    private _textureSize: number = 0;

    // The three staged by resolveBitmap() and consumed by applyFrame(), as in AS3.
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_6660
    private _nextTextureIsShared: boolean = false;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_6914
    private _nextTextureHasBackground: boolean = false;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_6826
    private _nextTextureSize: number = 0;

    // AS3: .../additions/HabbiconBubble.as::_SafeStr_4609
    private _asset: IHabbiconRuntimeAsset | null = null;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_5698
    private _startTime: number = 0;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_8530
    private _fadeOutStartTime: number = 0;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_8105
    private _endTime: number = 0;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_7128
    private _visibleEndTime: number = 0;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_7065
    private _backgroundFadeOutStartTime: number = 0;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_6737
    private _backgroundEndTime: number = 0;

    // AS3: .../additions/HabbiconBubble.as::_SafeStr_5385
    private _frameIndex: number = -1;
    // AS3: .../additions/HabbiconBubble.as::_lastComposedSourceAlpha
    private _lastComposedSourceAlpha: number = -1;
    // AS3: .../additions/HabbiconBubble.as::_lastComposedBackgroundAlpha
    private _lastComposedBackgroundAlpha: number = -1;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_8302
    private _animated: boolean = false;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_5267
    private _initialized: boolean = false;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_5611
    private _finished: boolean = false;
    // AS3: .../additions/HabbiconBubble.as::_relativeDepth
    private _relativeDepth: number = HabbiconBubble.DEFAULT_RELATIVE_DEPTH;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_8267
    private _mirrorResolved: boolean = false;
    // AS3: .../additions/HabbiconBubble.as::_SafeStr_8000
    private _mirrored: boolean = false;

    // AS3: .../additions/HabbiconBubble.as::HabbiconBubble()
    constructor(id: number, habbiconId: number, triggerSequence: number, avatar: AvatarVisualization)
    {
        this._id = id;
        this._habbiconId = habbiconId;
        this._triggerSequence = triggerSequence;
        this._avatar = avatar;
    }

    // AS3: .../additions/HabbiconBubble.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: .../additions/HabbiconBubble.as::get habbiconId()
    get habbiconId(): number
    {
        return this._habbiconId;
    }

    // AS3: .../additions/HabbiconBubble.as::get triggerSequence()
    get triggerSequence(): number
    {
        return this._triggerSequence;
    }

    // AS3: .../additions/HabbiconBubble.as::get disposed()
    get disposed(): boolean
    {
        return this._avatar === null;
    }

    // AS3: .../additions/HabbiconBubble.as::get isPartOfStack()
    get isPartOfStack(): boolean
    {
        return this._isPartOfStack;
    }

    // AS3: .../additions/HabbiconBubble.as::set isPartOfStack()
    set isPartOfStack(value: boolean)
    {
        this._isPartOfStack = value;
    }

    /** Always true: a bubble is never a passenger, it always pushes what is above it. */
    // AS3: .../additions/HabbiconBubble.as::get contributesToStackLayout()
    get contributesToStackLayout(): boolean
    {
        return true;
    }

    // AS3: .../additions/HabbiconBubble.as::get invisible()
    get invisible(): boolean
    {
        return false;
    }

    /**
     * Always false, unlike a Variable FX effect. A bubble's end of life is the visualization
     * removing it, not the bubble reporting itself spent.
     */
    // AS3: .../additions/HabbiconBubble.as::get isFinished()
    get isFinished(): boolean
    {
        return false;
    }

    /** Always true: the bubble is animated for its whole life. */
    // AS3: .../additions/HabbiconBubble.as::get requiresAnimationTick()
    get requiresAnimationTick(): boolean
    {
        return true;
    }

    // AS3: .../additions/HabbiconBubble.as::_bitmap
    get stackSourceBitmap(): StackedAdditionSource | null
    {
        return this._stackSource;
    }

    // AS3: .../additions/HabbiconBubble.as::set relativeDepth()
    set relativeDepth(value: number)
    {
        this._relativeDepth = value;
    }

    /**
     * First frame: resolve the asset, fix the timings, compose, and place the sprite.
     *
     * DEVIATION: AS3 also zeroes three fields here (`_SafeStr_10284`, `_SafeStr_10244`,
     *   `_SafeStr_10200`) that nothing in the class ever reads — grepping the file shows this
     *   method as their only mention besides their declarations. They are leftovers of the
     *   fade/move counters `NumberBubble` really uses, and porting them would be three dead fields.
     * AS3: .../additions/HabbiconBubble.as::update()
     */
    // AS3: .../additions/HabbiconBubble.as::update()
    update(sprite: IRoomObjectSprite | null, scale: number): void
    {
        if(!sprite) return;

        const isFirstUpdate = !this._initialized;

        if(this._finished || (this._endTime > 0 && Date.now() >= this._endTime))
        {
            this._finished = true;
            sprite.alpha = 0;
            sprite.visible = false;

            return;
        }

        this._scale = scale;

        if(isFirstUpdate)
        {
            this._asset = HabbiconAssetManager.getRuntimeAsset(this._habbiconId);
            this._animated = this._asset !== null && this._asset.animated;
            this._startTime = Date.now();
            this._frameIndex = this.resolveFrameIndex(0);

            this.configureTiming();
            this.applyFrame(
                this.resolveBitmap(scale, this.resolveAlpha(this._startTime), this.resolveBackgroundAlpha(this._startTime))
            );

            this._initialized = true;
        }

        const elapsed = Date.now() - this._startTime;

        let offsetX: number;
        let offsetY: number;
        let fullSize = 64;

        if(scale < HabbiconBubble.SMALL_SCALE_THRESHOLD)
        {
            offsetX = HabbiconBubble.ROOM_SMALL_OFFSET_X;
            offsetY = HabbiconBubble.ROOM_SMALL_OFFSET_Y;
            fullSize = 32;
        }
        else
        {
            offsetX = HabbiconBubble.ROOM_LARGE_OFFSET_X;
            offsetY = HabbiconBubble.ROOM_LARGE_OFFSET_Y;
        }

        if(this._avatar?.posture === 'sit') offsetY += fullSize / 2;
        else if(this._avatar?.posture === 'lay') offsetY += fullSize;

        sprite.texture = this._texture;
        sprite.offsetX = offsetX + this.resolveFrameAnchorCompensationX();
        sprite.offsetY = offsetY + this.getIntroOffsetY(elapsed) + this.resolveFrameAnchorCompensationY();
        sprite.relativeDepth = this._relativeDepth;

        if(isFirstUpdate)
        {
            sprite.visible = true;
            sprite.alpha = 255;
        }
    }

    /**
     * Per-frame: advance the animation, recompose only when the frame or either alpha changed, and
     * re-place the sprite because the intro offset is still moving.
     */
    // AS3: .../additions/HabbiconBubble.as::animate()
    animate(sprite: IRoomObjectSprite | null): boolean
    {
        if(!sprite) return false;

        // `AvatarVisualization` animates every addition on every frame but only *updates* them
        // inside `if(modelChanged || scaleChanged || no image)`. Adding this bubble sets
        // `modelChanged`, so on the frame it appears the update loop does run first — but nothing
        // in the contract guarantees that, and uninitialised every deadline is 0, which makes the
        // `now >= _endTime` test below read as "expired" and kill the bubble on its first frame.
        // AS3 cannot reach that state; this port can, so it is refused explicitly.
        if(!this._initialized) return false;

        const now = Date.now();
        const elapsed = now - this._startTime;

        this._asset = HabbiconAssetManager.getRuntimeAsset(this._habbiconId);

        // The sheet can land after the bubble opened, turning a still into an animation mid-flight;
        // the timings depend on that, so they are recomputed rather than trusted.
        if(this._asset !== null && this._asset.animated !== this._animated)
        {
            this._animated = this._asset.animated;

            this.configureTiming();
        }

        const frameIndex = this.resolveFrameIndex(elapsed);

        let recompose = false;

        if(this._asset !== null && frameIndex !== this._frameIndex)
        {
            this._frameIndex = frameIndex;
            recompose = true;
        }

        const sourceAlpha = this.resolveAlpha(now);
        const backgroundAlpha = this.resolveBackgroundAlpha(now);

        if(sourceAlpha !== this._lastComposedSourceAlpha || backgroundAlpha !== this._lastComposedBackgroundAlpha)
        {
            recompose = true;
        }

        if(recompose)
        {
            this.applyFrame(this.resolveBitmap(this._scale, sourceAlpha, backgroundAlpha));
        }

        if(this._texture !== null) sprite.texture = this._texture;

        sprite.relativeDepth = this._relativeDepth;

        let offsetY = this._scale < HabbiconBubble.SMALL_SCALE_THRESHOLD
            ? HabbiconBubble.ROOM_SMALL_OFFSET_Y
            : HabbiconBubble.ROOM_LARGE_OFFSET_Y;

        // AS3 hardcodes 64 in this method where update() carries the per-scale `fullSize`, so a
        // small-scale seated avatar shifts by 32 on the first frame and 32 here too — the halves
        // agree only because the literal is halved. Kept as written.
        if(this._avatar?.posture === 'sit') offsetY += 64 / 2;
        else if(this._avatar?.posture === 'lay') offsetY += 64;

        sprite.offsetY = offsetY + this.getIntroOffsetY(elapsed) + this.resolveFrameAnchorCompensationY();
        sprite.offsetX = (this._scale < HabbiconBubble.SMALL_SCALE_THRESHOLD
            ? HabbiconBubble.ROOM_SMALL_OFFSET_X
            : HabbiconBubble.ROOM_LARGE_OFFSET_X) + this.resolveFrameAnchorCompensationX();

        if(now >= this._endTime)
        {
            this._finished = true;
            sprite.alpha = 0;
            sprite.visible = false;

            return true;
        }

        // The sprite stays fully opaque: both fades are composited into the pixels, because the
        // icon and its background fade on different clocks and one sprite alpha cannot do that.
        if(sprite.alpha !== 255) sprite.alpha = 255;

        sprite.visible = Math.max(sourceAlpha, backgroundAlpha) > 0;

        return true;
    }

    /**
     * Picks the frame's source pixels and composes shadow + outline + icon, or falls back to a
     * coloured placeholder square while the asset pack has not produced anything for this id.
     */
    // AS3: .../additions/HabbiconBubble.as::resolveBitmap()
    private resolveBitmap(scale: number, sourceAlpha: number = -1, backgroundAlpha: number = -1): OffscreenCanvas | null
    {
        const small = scale < HabbiconBubble.SMALL_SCALE_THRESHOLD;
        const placeholderSize = small ? HabbiconBubble.PLACEHOLDER_SIZE_SMALL : HabbiconBubble.PLACEHOLDER_SIZE_LARGE;

        if(sourceAlpha < 0) sourceAlpha = this.resolveAlpha(Date.now());
        if(backgroundAlpha < 0) backgroundAlpha = this.resolveBackgroundAlpha(Date.now());

        this._nextTextureIsShared = false;
        this._nextTextureHasBackground = false;
        this._nextTextureSize = placeholderSize;

        let source: ImageBitmap | null;

        if(this._asset !== null && this._asset.frames.length > 0)
        {
            const frames = this._asset.frames;

            if(this._frameIndex < 0 || this._frameIndex >= frames.length) this._frameIndex = 0;

            source = small ? frames[this._frameIndex].smallBitmap : frames[this._frameIndex].bitmap;

            // An animated habbicon's frames come from `animation/<id>.png`, fetched separately and
            // later than the sheet, so a frame can exist in the metadata with no pixels behind it
            // yet. AS3 hands the null straight to `copyPixels`, where Flash ignores it; here
            // `drawImage(undefined)` throws, and the throw escapes AvatarVisualization.update() and
            // takes the whole avatar off screen with it. Fall back to the preview until it lands.
            source ??= HabbiconAssetManager.getPreviewBitmap(this._habbiconId, small);
        }
        else
        {
            source = HabbiconAssetManager.getPreviewBitmap(this._habbiconId, small);
        }

        if(source !== null)
        {
            this._nextTextureHasBackground = true;
            this._nextTextureSize = source.width
                + HabbiconBubble.OUTLINE_THICKNESS * 2
                + HabbiconBubble.BACKGROUND_SHADOW_PADDING * 2;

            this._lastComposedSourceAlpha = sourceAlpha;
            this._lastComposedBackgroundAlpha = backgroundAlpha;

            let cacheKey = this.createOutlineBitmapCacheKey(small);

            if(this.shouldMirrorHabbicon())
            {
                cacheKey += ':mirrored';
                source = HabbiconBubble.getMirroredBitmap(source, cacheKey);
            }

            const outline = HabbiconBubble.getOutlineBitmap(source, cacheKey);

            return this.composeBitmap(
                source,
                outline,
                HabbiconBubble.getBackgroundShadowBitmap(outline, cacheKey),
                sourceAlpha,
                backgroundAlpha
            );
        }

        // Nothing to draw yet. AS3 keeps the previous BitmapData when it is the right size; the port
        // keeps the previous *texture* by returning null, which applyFrame() reads as "no change".
        if(this._texture !== null && !this._textureIsShared && this._textureSize === placeholderSize)
        {
            return null;
        }

        return this.createBitmap(placeholderSize, HabbiconBubble.seededColor(this._habbiconId * 37));
    }

    // AS3: .../additions/HabbiconBubble.as::applyFrame()
    private applyFrame(canvas: OffscreenCanvas | null): void
    {
        this.setBitmap(canvas, this._nextTextureIsShared, this._nextTextureSize, this._nextTextureHasBackground);
    }

    /**
     * Adopts a freshly composed surface as the displayed texture, destroying the one it replaces.
     *
     * A null canvas means resolveBitmap() decided the current texture still stands, which is where
     * AS3's `_bitmap === param1` early return lands.
     */
    // AS3: .../additions/HabbiconBubble.as::setBitmap()
    private setBitmap(canvas: OffscreenCanvas | null, shared: boolean, size: number, hasBackground: boolean): void
    {
        if(canvas === null)
        {
            this._textureIsShared = shared;
            this._textureSize = size;
            this._textureHasBackground = hasBackground;

            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        const previous = this._texture;

        // Kept, not discarded: the canvas is detached by this call, so this ImageBitmap is the only
        // drawable copy left and the addition stack composites from it.
        const bitmap = canvas.transferToImageBitmap();

        this._stackSource = bitmap;
        this._texture = Texture.from(bitmap);
        this._textureWidth = width;
        this._textureHeight = height;
        this._textureIsShared = shared;
        this._textureSize = size;
        this._textureHasBackground = hasBackground;

        if(previous !== null && !shared) previous.destroy(true);
    }

    /**
     * Fixes every deadline the bubble runs on. The icon and the background each get a floor of
     * "visible duration" and "fade in + fade out", so shortening one constant can never produce a
     * window narrower than its own fades.
     */
    // AS3: .../additions/HabbiconBubble.as::configureTiming()
    private configureTiming(): void
    {
        const sourceWindow = Math.max(
            HabbiconBubble.DEFAULT_VISIBLE_DURATION_MS,
            HabbiconBubble.FADE_IN_DURATION_MS + HabbiconBubble.FADE_OUT_DURATION_MS
        );
        const backgroundWindow = Math.max(
            HabbiconBubble.BACKGROUND_VISIBLE_DURATION_MS,
            HabbiconBubble.FADE_IN_DURATION_MS + HabbiconBubble.BACKGROUND_FADE_OUT_DURATION_MS
        );

        this._visibleEndTime = this._startTime + sourceWindow;
        this._fadeOutStartTime = this._visibleEndTime - HabbiconBubble.FADE_OUT_DURATION_MS;
        this._backgroundEndTime = this._startTime + backgroundWindow;
        this._backgroundFadeOutStartTime = this._backgroundEndTime - HabbiconBubble.BACKGROUND_FADE_OUT_DURATION_MS;
        this._endTime = Math.max(this._visibleEndTime, this._backgroundEndTime);
    }

    // AS3: .../additions/HabbiconBubble.as::resolveFrameIndex()
    private resolveFrameIndex(elapsed: number): number
    {
        const step = this.getCurrentStep(elapsed);

        if(this._asset === null || this._asset.frames.length === 0) return 0;
        if(step === null) return 0;

        return Math.max(0, Math.min(step.sourceFrame | 0, this._asset.frames.length - 1));
    }

    /**
     * Walks the animation steps to the one covering `elapsed`. A looping habbicon wraps; a
     * one-shot holds its last step.
     */
    // AS3: .../additions/HabbiconBubble.as::getCurrentStep()
    private getCurrentStep(elapsed: number): IHabbiconAnimationStep | null
    {
        if(this._asset === null || this._asset.steps.length === 0) return null;

        const steps = this._asset.steps;

        if(steps.length === 1) return steps[0];

        let total = 0;

        for(const step of steps) total += Math.max(1, step.durationMs | 0);

        if(total <= 0) return steps[0];

        let position = elapsed;

        if(this._asset.animated) position %= total;
        else if(position >= total) return steps[steps.length - 1];

        let walked = 0;

        for(const step of steps)
        {
            walked += Math.max(1, step.durationMs | 0);

            if(position < walked) return step;
        }

        return steps[steps.length - 1];
    }

    /** The 12px rise over the first 180ms, eased by nothing: AS3 interpolates it linearly. */
    // AS3: .../additions/HabbiconBubble.as::getIntroOffsetY()
    private getIntroOffsetY(elapsed: number): number
    {
        const progress = Math.min(1, Math.max(0, elapsed / HabbiconBubble.INTRO_DURATION_MS));

        return Math.round((1 - progress) * HabbiconBubble.INTRO_START_OFFSET_Y);
    }

    // AS3: .../additions/HabbiconBubble.as::resolveAlpha()
    private resolveAlpha(now: number): number
    {
        const fadeIn = Math.min(1, Math.max(0, (now - this._startTime) / HabbiconBubble.FADE_IN_DURATION_MS));
        const fadeOut = now < this._fadeOutStartTime
            ? 1
            : 1 - Math.min(1, Math.max(0, (now - this._fadeOutStartTime) / HabbiconBubble.FADE_OUT_DURATION_MS));

        if(this._visibleEndTime > 0 && now >= this._visibleEndTime) return 0;

        return Math.round(255 * Math.min(fadeIn, fadeOut));
    }

    // AS3: .../additions/HabbiconBubble.as::resolveBackgroundAlpha()
    private resolveBackgroundAlpha(now: number): number
    {
        const fadeIn = Math.min(1, Math.max(0, (now - this._startTime) / HabbiconBubble.FADE_IN_DURATION_MS));
        const fadeOut = now < this._backgroundFadeOutStartTime
            ? 1
            : 1 - Math.min(
                1,
                Math.max(0, (now - this._backgroundFadeOutStartTime) / HabbiconBubble.BACKGROUND_FADE_OUT_DURATION_MS)
            );

        return Math.round(255 * Math.min(fadeIn, fadeOut));
    }

    /**
     * Keeps the composed frame centred on the habbicon's declared box, so frames of different
     * widths do not make the bubble jump sideways.
     */
    // AS3: .../additions/HabbiconBubble.as::resolveFrameAnchorCompensationX()
    private resolveFrameAnchorCompensationX(): number
    {
        if(this._texture === null) return 0;
        if(this._asset === null) return this._textureHasBackground ? -HabbiconBubble.BACKGROUND_CONTENT_INSET : 0;

        return Math.round((this.resolveBaseDimension(this._asset.baseWidth) - this._textureWidth) * 0.5);
    }

    /** Vertically the frame hangs from its base box's bottom, not its middle. */
    // AS3: .../additions/HabbiconBubble.as::resolveFrameAnchorCompensationY()
    private resolveFrameAnchorCompensationY(): number
    {
        if(this._texture === null) return 0;
        if(this._asset === null) return this._textureHasBackground ? -HabbiconBubble.BACKGROUND_CONTENT_INSET : 0;

        return this.resolveBaseDimension(this._asset.baseHeight)
            - this._textureHeight
            + (this._textureHasBackground ? HabbiconBubble.BACKGROUND_CONTENT_INSET : 0);
    }

    // AS3: .../additions/HabbiconBubble.as::resolveBaseDimension()
    private resolveBaseDimension(value: number): number
    {
        if(this._scale < HabbiconBubble.SMALL_SCALE_THRESHOLD) return Math.max(1, Math.round((value | 0) * 0.5));

        return Math.max(1, value | 0);
    }

    /**
     * The stand-in drawn when the pack has no pixels for this id: a square, a coloured border and a
     * white middle. Seeded off the id so two habbicons are at least told apart.
     */
    // AS3: .../additions/HabbiconBubble.as::createBitmap()
    private createBitmap(size: number, color: string): OffscreenCanvas | null
    {
        const canvas = new OffscreenCanvas(size, size);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        const border = Math.max(2, size / 8);
        const inner = Math.max(1, size / 4);

        context.fillStyle = color;
        context.fillRect(border, border, size - border * 2, size - border * 2);
        context.fillStyle = HabbiconBubble.OUTLINE_COLOR;
        context.fillRect(inner, inner, size - inner * 2, size - inner * 2);

        return canvas;
    }

    /**
     * Cache identity for the outline and shadow of one drawn frame. The frame index is part of it:
     * an animated habbicon has a different silhouette every frame.
     */
    // AS3: .../additions/HabbiconBubble.as::createOutlineBitmapCacheKey()
    private createOutlineBitmapCacheKey(small: boolean): string
    {
        const hasFrames = this._asset !== null && this._asset.frames.length > 0;
        const kind = hasFrames ? (this._asset!.animated ? 'animated' : 'runtime') : 'preview';

        return `${this._habbiconId}:${kind}:${small ? 'small' : 'large'}:${this._frameIndex}`;
    }

    /**
     * Whether the icon has to be flipped to face the same way as the avatar. Resolved once: the
     * avatar can turn while the bubble is up, and AS3 deliberately freezes the answer at the first
     * frame rather than letting the icon flip mid-animation.
     */
    // AS3: .../additions/HabbiconBubble.as::shouldMirrorHabbicon()
    private shouldMirrorHabbicon(): boolean
    {
        if(!this._mirrorResolved)
        {
            const avatarFacing = this._avatar !== null ? this._avatar.habbiconFacingDirection : 0;
            const habbiconFacing = HabbiconAssetManager.getDirection(this._habbiconId);

            this._mirrored = avatarFacing !== 0 && habbiconFacing !== 0 && avatarFacing !== habbiconFacing;
            this._mirrorResolved = true;
        }

        return this._mirrored;
    }

    /** Shadow, then outline inset by the shadow padding, then the icon inset by the content inset. */
    // AS3: .../additions/HabbiconBubble.as::composeBitmap()
    private composeBitmap(
        source: ImageBitmap,
        outline: ImageBitmap,
        shadow: ImageBitmap,
        sourceAlpha: number,
        backgroundAlpha: number
    ): OffscreenCanvas | null
    {
        const canvas = this.acquireComposeCanvas(shadow.width, shadow.height);
        const context = canvas?.getContext('2d') ?? null;

        if(canvas === null || context === null) return null;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = false;

        HabbiconBubble.drawBitmapLayer(context, shadow, 0, 0, backgroundAlpha);
        HabbiconBubble.drawBitmapLayer(
            context, outline, HabbiconBubble.BACKGROUND_SHADOW_PADDING, HabbiconBubble.BACKGROUND_SHADOW_PADDING, backgroundAlpha
        );
        HabbiconBubble.drawBitmapLayer(
            context, source, HabbiconBubble.BACKGROUND_CONTENT_INSET, HabbiconBubble.BACKGROUND_CONTENT_INSET, sourceAlpha
        );

        return canvas;
    }

    /** One canvas per bubble, reallocated only when the composed size changes. */
    // TS-only: stands in for AS3 reusing the BitmapData it is about to display.
    private acquireComposeCanvas(width: number, height: number): OffscreenCanvas | null
    {
        if(this._composeCanvas === null || this._composeCanvas.width !== width || this._composeCanvas.height !== height)
        {
            this._composeCanvas = new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
        }

        return this._composeCanvas;
    }

    // AS3: .../additions/HabbiconBubble.as::drawBitmapLayer()
    private static drawBitmapLayer(
        context: OffscreenCanvasRenderingContext2D,
        bitmap: ImageBitmap,
        x: number,
        y: number,
        alpha: number
    ): void
    {
        if(alpha <= 0) return;

        if(alpha >= 255)
        {
            context.drawImage(bitmap, x, y);

            return;
        }

        const previous = context.globalAlpha;

        context.globalAlpha = alpha / 255;
        context.drawImage(bitmap, x, y);
        context.globalAlpha = previous;
    }

    // AS3: .../additions/HabbiconBubble.as::getOutlineBitmap()
    private static getOutlineBitmap(source: ImageBitmap, key: string): ImageBitmap
    {
        const cached = HabbiconBubble.OUTLINE_BITMAP_CACHE.get(key);

        if(cached !== undefined) return cached;

        const created = HabbiconBubble.createOutlineBitmap(source);

        HabbiconBubble.OUTLINE_BITMAP_CACHE.set(key, created);

        return created;
    }

    // AS3: .../additions/HabbiconBubble.as::getMirroredBitmap()
    private static getMirroredBitmap(source: ImageBitmap, key: string): ImageBitmap
    {
        const cached = HabbiconBubble.MIRRORED_BITMAP_CACHE.get(key);

        if(cached !== undefined) return cached;

        const created = HabbiconBubble.createMirroredBitmap(source);

        HabbiconBubble.MIRRORED_BITMAP_CACHE.set(key, created);

        return created;
    }

    // AS3: .../additions/HabbiconBubble.as::getBackgroundShadowBitmap()
    private static getBackgroundShadowBitmap(source: ImageBitmap, key: string): ImageBitmap
    {
        const cached = HabbiconBubble.BACKGROUND_SHADOW_BITMAP_CACHE.get(key);

        if(cached !== undefined) return cached;

        const created = HabbiconBubble.createBackgroundShadowBitmap(source);

        HabbiconBubble.BACKGROUND_SHADOW_BITMAP_CACHE.set(key, created);

        return created;
    }

    // AS3: .../additions/HabbiconBubble.as::createMirroredBitmap()
    private static createMirroredBitmap(source: ImageBitmap): ImageBitmap
    {
        const canvas = new OffscreenCanvas(source.width, source.height);
        const context = canvas.getContext('2d')!;

        context.imageSmoothingEnabled = false;
        context.translate(source.width, 0);
        context.scale(-1, 1);
        context.drawImage(source, 0, 0);

        return canvas.transferToImageBitmap();
    }

    /**
     * The white halo: the source's own alpha channel, painted white, stamped at every offset in a
     * -2..2 square except the centre. AS3 builds it with `copyChannel(ALPHA -> ALPHA)` onto an
     * opaque-white surface; `source-in` against a white fill is the same operation here.
     */
    // AS3: .../additions/HabbiconBubble.as::createOutlineBitmap()
    private static createOutlineBitmap(source: ImageBitmap): ImageBitmap
    {
        const thickness = HabbiconBubble.OUTLINE_THICKNESS;
        const silhouette = HabbiconBubble.createSilhouette(source, HabbiconBubble.OUTLINE_COLOR);
        const canvas = new OffscreenCanvas(source.width + thickness * 2, source.height + thickness * 2);
        const context = canvas.getContext('2d')!;

        context.imageSmoothingEnabled = false;

        for(let y = -thickness; y <= thickness; y++)
        {
            for(let x = -thickness; x <= thickness; x++)
            {
                if(x === 0 && y === 0) continue;

                context.drawImage(silhouette, thickness + x, thickness + y);
            }
        }

        return canvas.transferToImageBitmap();
    }

    /**
     * The drop shadow: the outline's silhouette in black at 55%, offset down-right and blurred.
     *
     * DEVIATION: AS3 uses `BlurFilter(6, 6, 2)` — two passes of a box blur of radius 6. Canvas 2D
     *   offers a gaussian `filter: blur(<n>px)` instead, and no box blur at all. The radius is kept
     *   at 6 and the result is very slightly softer than Flash's; matching the box blur exactly
     *   would mean convolving by hand, per frame, for a shadow nobody can see the edge of.
     * AS3: .../additions/HabbiconBubble.as::createBackgroundShadowBitmap()
     */
    // AS3: .../additions/HabbiconBubble.as::createBackgroundShadowBitmap()
    private static createBackgroundShadowBitmap(source: ImageBitmap): ImageBitmap
    {
        const padding = HabbiconBubble.BACKGROUND_SHADOW_PADDING;
        const silhouette = HabbiconBubble.createSilhouette(source, HabbiconBubble.BACKGROUND_SHADOW_COLOR);
        const canvas = new OffscreenCanvas(source.width + padding * 2, source.height + padding * 2);
        const context = canvas.getContext('2d')!;

        context.imageSmoothingEnabled = false;
        context.filter = `blur(${HabbiconBubble.BACKGROUND_SHADOW_BLUR}px)`;
        context.globalAlpha = HabbiconBubble.BACKGROUND_SHADOW_ALPHA;
        context.drawImage(
            silhouette,
            padding + HabbiconBubble.BACKGROUND_SHADOW_OFFSET_X,
            padding + HabbiconBubble.BACKGROUND_SHADOW_OFFSET_Y
        );

        return canvas.transferToImageBitmap();
    }

    /** A flat-coloured copy of a bitmap's alpha channel. */
    // TS-only: canvas has no `copyChannel`; this is the two-step equivalent AS3 gets in one call.
    private static createSilhouette(source: ImageBitmap, color: string): ImageBitmap
    {
        const canvas = new OffscreenCanvas(source.width, source.height);
        const context = canvas.getContext('2d')!;

        context.imageSmoothingEnabled = false;
        context.drawImage(source, 0, 0);
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);

        return canvas.transferToImageBitmap();
    }

    // AS3: .../additions/HabbiconBubble.as::seededColor()
    private static seededColor(seed: number): string
    {
        switch(((seed % 6) + 6) % 6)
        {
            case 0: return '#f9c62f';
            case 1: return '#f3a72f';
            case 2: return '#ef8c2f';
            case 3: return '#8ecfff';
            case 4: return '#4dbf68';
            default: return '#c38b35';
        }
    }

    // AS3: .../additions/HabbiconBubble.as::dispose()
    dispose(): void
    {
        if(this._texture !== null && !this._textureIsShared) this._texture.destroy(true);

        this._texture = null;
        this._stackSource = null;
        this._composeCanvas = null;
        this._textureIsShared = false;
        this._textureHasBackground = false;
        this._textureSize = 0;
        this._textureWidth = 0;
        this._textureHeight = 0;
        this._nextTextureIsShared = false;
        this._nextTextureHasBackground = false;
        this._nextTextureSize = 0;
        this._lastComposedSourceAlpha = -1;
        this._lastComposedBackgroundAlpha = -1;
        this._initialized = false;
        this._finished = false;
        this._mirrorResolved = false;
        this._mirrored = false;
        this._avatar = null;
    }
}
