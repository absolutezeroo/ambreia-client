import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxClipRect} from '../../rendering/VariableFxClipRect';

/** The artwork a badge is built from. `background` is absent on the details badge. */
export interface ILevelBadgeAssets
{
    background: VariableFxDrawable | null;
    darkening: VariableFxDrawable;
    frame: VariableFxDrawable;
    lighting: VariableFxDrawable;
    numbers: VariableFxDrawable;
}

/** Which part of the source artwork is the badge — the details sheet has it at an offset. */
export interface ILevelBadgeSourceRect
{
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The four widened layers for one digit count, shared unless the count is unusually large. */
interface ILevelBadgeSourcePrebake
{
    backgroundAndFrame: OffscreenCanvas;
    darkening: OffscreenCanvas;
    frame: OffscreenCanvas;
    lighting: OffscreenCanvas;
}

/** One badge, recoloured — plus whether the caller has to free the prebake behind it. */
export interface ILevelBadgeRender
{
    backgroundAndFrame: OffscreenCanvas;
    ownsSourcePrebake: boolean;
    sourcePrebake: ILevelBadgeSourcePrebake;
}

/**
 * The rounded plate carrying the level number, at whatever width the number needs.
 *
 * Two caches, one behind the other, because two different things vary. The SHAPE varies with the
 * digit count — a three-digit badge is a wider nine-slice than a one-digit badge — and is cached by
 * count. The COLOUR varies with the animated paint and is composited on top of the shape, so a
 * badge whose colour is moving re-runs only the second step.
 *
 * Both caches stop at {@link MAX_SHARED_BADGE_PREBAKE_DIGITS}. Past that the count is unbounded
 * wire data, so caching it would let a level of 999999999 pin nine bitmaps; instead the caller is
 * handed ownership and frees it after the frame. `ownsSourcePrebake` is that flag.
 *
 * Digits are drawn by CLIPPING rather than by slicing: the whole numbers sheet is blitted with its
 * origin pushed left by `digit * 8`, through an 8px window. Same result as a source region, one
 * fewer concept.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/level/LevelBadgePainter.as
 */
export class LevelBadgePainter
{
    /** Past this many digits a badge is built per-frame and freed, never cached. */
    // AS3: .../renderers/level/LevelBadgePainter.as::MAX_SHARED_BADGE_PREBAKE_DIGITS
    static readonly MAX_SHARED_BADGE_PREBAKE_DIGITS: number = 5;

    // AS3: .../renderers/level/LevelBadgePainter.as::DIGIT_WIDTH
    private static readonly DIGIT_WIDTH: number = 8;

    // AS3: .../renderers/level/LevelBadgePainter.as::NUMBER_Y
    private static readonly NUMBER_Y: number = 5;

    /** A lone digit is centred; two or more start a pixel further left. */
    // AS3: .../renderers/level/LevelBadgePainter.as::SINGLE_DIGIT_NUMBER_X
    private static readonly SINGLE_DIGIT_NUMBER_X: number = 7;

    // AS3: .../renderers/level/LevelBadgePainter.as::MULTI_DIGIT_NUMBER_X
    private static readonly MULTI_DIGIT_NUMBER_X: number = 6;

    // AS3: .../renderers/level/LevelBadgePainter.as::SINGLE_DIGIT_FRAME_WIDTH
    private static readonly SINGLE_DIGIT_FRAME_WIDTH: number = 21;

    // AS3: .../renderers/level/LevelBadgePainter.as::MULTI_DIGIT_RIGHT_PADDING
    private static readonly MULTI_DIGIT_RIGHT_PADDING: number = 5;

    // AS3: .../renderers/level/LevelBadgePainter.as::THREE_SLICE_LEFT_WIDTH
    private static readonly THREE_SLICE_LEFT_WIDTH: number = 10;

    // AS3: .../renderers/level/LevelBadgePainter.as::THREE_SLICE_RIGHT_WIDTH
    private static readonly THREE_SLICE_RIGHT_WIDTH: number = 10;

    // AS3: .../renderers/level/LevelBadgePainter.as::_badgePrebakes
    private _badgePrebakes: Map<number, ILevelBadgeSourcePrebake> = new Map();

    // AS3: .../renderers/level/LevelBadgePainter.as::_layers (name derived)
    //   `_SafeStr_5288`: the four source layers, already cropped to the badge rect.
    private _layers: {
        background: OffscreenCanvas | null;
        darkening: OffscreenCanvas;
        frame: OffscreenCanvas;
        lighting: OffscreenCanvas;
    };

    // AS3: .../renderers/level/LevelBadgePainter.as::_numbers
    private _numbers: VariableFxDrawable;

    /**
     * The layers are cropped to `sourceRect` up front, so every draw afterwards works in badge
     * coordinates — the details sheet keeps its badge at (5, 4) inside a 36x29 plate and nothing
     * downstream needs to know that.
     */
    // AS3: .../renderers/level/LevelBadgePainter.as::LevelBadgePainter()
    constructor(assets: ILevelBadgeAssets, sourceRect: ILevelBadgeSourceRect)
    {
        this._numbers = assets.numbers;
        this._layers = {
            background: assets.background === null
                ? null
                : LevelBadgePainter.createNormalizedLayer(assets.background, sourceRect),
            darkening: LevelBadgePainter.createNormalizedLayer(assets.darkening, sourceRect),
            frame: LevelBadgePainter.createNormalizedLayer(assets.frame, sourceRect),
            lighting: LevelBadgePainter.createNormalizedLayer(assets.lighting, sourceRect)
        };
    }

    /** A single digit gets the artwork's natural width; more digits stretch the middle. */
    // AS3: .../renderers/level/LevelBadgePainter.as::resolveFrameWidth()
    resolveFrameWidth(digitCount: number): number
    {
        const digits = Math.max(1, digitCount);

        if(digits === 1) return LevelBadgePainter.SINGLE_DIGIT_FRAME_WIDTH;

        return LevelBadgePainter.MULTI_DIGIT_NUMBER_X
            + digits * LevelBadgePainter.DIGIT_WIDTH
            + LevelBadgePainter.MULTI_DIGIT_RIGHT_PADDING;
    }

    // AS3: .../renderers/level/LevelBadgePainter.as::createBadgeRender()
    createBadgeRender(digitCount: number, argb: number): ILevelBadgeRender
    {
        const source = this.getBadgeSourcePrebake(digitCount);
        const prebake = source.prebake;
        const backgroundAndFrame = LevelBadgePainter.createTransparentBitmap(
            prebake.backgroundAndFrame.width, prebake.backgroundAndFrame.height
        );

        LevelBadgePainter.drawRecoloredBackgroundAndFrame(backgroundAndFrame, prebake, argb);

        return {backgroundAndFrame, ownsSourcePrebake: source.ownsPrebake, sourcePrebake: prebake};
    }

    /**
     * AS3 disposes two BitmapData here. An OffscreenCanvas is collected once unreferenced, so this
     * is left as the call site the contract asks for rather than made to do nothing invisibly —
     * `ownsSourcePrebake` is the flag a caller must still honour.
     */
    // AS3: .../renderers/level/LevelBadgePainter.as::disposeBadgeRender()
    disposeBadgeRender(_render: ILevelBadgeRender | null): void
    {
        // Nothing to free: see above.
    }

    /** Plate, digits, then the two shading passes over both — so the number is shaded too. */
    // AS3: .../renderers/level/LevelBadgePainter.as::drawBadge()
    drawBadge(composer: VariableFxBitmapComposer, render: ILevelBadgeRender, text: string, x: number, y: number): void
    {
        composer.drawLayer(render.backgroundAndFrame, x, y, 'normal', 255);

        this.drawDigits(composer, text, x, y);

        composer.drawLayer(render.sourcePrebake.darkening, x, y, 'multiply', 255);
        composer.drawLayer(render.sourcePrebake.lighting, x, y, 'add', 255);
    }

    // AS3: .../renderers/level/LevelBadgePainter.as::getBadgeSourcePrebake()
    private getBadgeSourcePrebake(digitCount: number): {ownsPrebake: boolean; prebake: ILevelBadgeSourcePrebake}
    {
        const digits = Math.max(1, digitCount);

        if(digits > LevelBadgePainter.MAX_SHARED_BADGE_PREBAKE_DIGITS)
        {
            return {ownsPrebake: true, prebake: this.createBadgeSourcePrebake(digits)};
        }

        let prebake = this._badgePrebakes.get(digits);

        if(prebake === undefined)
        {
            prebake = this.createBadgeSourcePrebake(digits);

            this._badgePrebakes.set(digits, prebake);
        }

        return {ownsPrebake: false, prebake};
    }

    /**
     * Four layers at the same width: the plate, the frame alone (which is what gets tinted), and
     * the two shading passes.
     *
     * The frame is baked twice on purpose — once inside `backgroundAndFrame` untinted, once alone —
     * because recolouring composites the tinted copy OVER the untinted plate, which is what keeps
     * the frame's own highlights from being flattened by the tint.
     */
    // AS3: .../renderers/level/LevelBadgePainter.as::createBadgeSourcePrebake()
    private createBadgeSourcePrebake(digitCount: number): ILevelBadgeSourcePrebake
    {
        const width = this.resolveFrameWidth(digitCount);
        const height = this._layers.frame.height;
        const backgroundAndFrame = LevelBadgePainter.createTransparentBitmap(width, height);
        const frame = LevelBadgePainter.createTransparentBitmap(width, height);
        const darkening = LevelBadgePainter.createTransparentBitmap(width, height);
        const lighting = LevelBadgePainter.createTransparentBitmap(width, height);

        this.drawBackgroundAndFramePrebake(backgroundAndFrame);
        this.drawFramePrebake(frame);

        LevelBadgePainter.drawOverlayPrebake(darkening, this._layers.darkening);
        LevelBadgePainter.drawOverlayPrebake(lighting, this._layers.lighting);

        return {backgroundAndFrame, darkening, frame, lighting};
    }

    // AS3: .../renderers/level/LevelBadgePainter.as::drawBackgroundAndFramePrebake()
    private drawBackgroundAndFramePrebake(target: OffscreenCanvas): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);

        if(this._layers.background !== null)
        {
            composer.drawThreeSlice(
                this._layers.background,
                LevelBadgePainter.THREE_SLICE_LEFT_WIDTH, LevelBadgePainter.THREE_SLICE_RIGHT_WIDTH,
                target.width, 0, 0, 'normal', 255
            );
        }

        composer.drawThreeSlice(
            this._layers.frame,
            LevelBadgePainter.THREE_SLICE_LEFT_WIDTH, LevelBadgePainter.THREE_SLICE_RIGHT_WIDTH,
            target.width, 0, 0, 'normal', 255
        );
    }

    // AS3: .../renderers/level/LevelBadgePainter.as::drawFramePrebake()
    private drawFramePrebake(target: OffscreenCanvas): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawThreeSlice(
            this._layers.frame,
            LevelBadgePainter.THREE_SLICE_LEFT_WIDTH, LevelBadgePainter.THREE_SLICE_RIGHT_WIDTH,
            target.width, 0, 0, 'normal', 255
        );
    }

    // AS3: .../renderers/level/LevelBadgePainter.as::drawOverlayPrebake()
    private static drawOverlayPrebake(target: OffscreenCanvas, layer: VariableFxDrawable): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawThreeSlice(
            layer,
            LevelBadgePainter.THREE_SLICE_LEFT_WIDTH, LevelBadgePainter.THREE_SLICE_RIGHT_WIDTH,
            target.width, 0, 0, 'normal', 255
        );
    }

    // AS3: .../renderers/level/LevelBadgePainter.as::drawRecoloredBackgroundAndFrame()
    private static drawRecoloredBackgroundAndFrame(
        target: OffscreenCanvas,
        prebake: ILevelBadgeSourcePrebake,
        argb: number
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawLayer(prebake.backgroundAndFrame, 0, 0, 'normal', 255);
        composer.drawTintedLayer(prebake.frame, 0, 0, argb, 'normal', 255);
    }

    /**
     * One glyph per character, cut out of the numbers strip by CLIPPING.
     *
     * The whole strip is drawn with its origin pushed left by `digit * DIGIT_WIDTH` through an
     * 8px-wide window — so the wanted glyph is the only part that lands. AS3 does it this way and
     * the result is identical to a source region.
     */
    // AS3: .../renderers/level/LevelBadgePainter.as::drawDigits()
    private drawDigits(composer: VariableFxBitmapComposer, text: string, x: number, y: number): void
    {
        const startX = text.length === 1
            ? LevelBadgePainter.SINGLE_DIGIT_NUMBER_X
            : LevelBadgePainter.MULTI_DIGIT_NUMBER_X;

        for(let index = 0; index < text.length; index++)
        {
            // AS3 `int("7")` is 7 and `int("x")` is 0; the text is always digits, and a stray
            // character would land on glyph 0 rather than throwing, exactly as it does there.
            const digit = LevelBadgePainter.parseDigit(text.charAt(index));
            const digitX = x + startX + index * LevelBadgePainter.DIGIT_WIDTH;
            const digitY = y + LevelBadgePainter.NUMBER_Y;

            composer.drawLayer(
                this._numbers,
                digitX - digit * LevelBadgePainter.DIGIT_WIDTH,
                digitY,
                'normal',
                255,
                new VariableFxClipRect(digitX, digitY, LevelBadgePainter.DIGIT_WIDTH, this._numbers.height)
            );
        }
    }

    // AS3: .../renderers/level/LevelBadgePainter.as::drawDigits()
    private static parseDigit(character: string): number
    {
        const parsed = Number(character);

        return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
    }

    /** Re-origins a layer to the badge's rect, so every later draw is in badge coordinates. */
    // AS3: .../renderers/level/LevelBadgePainter.as::createNormalizedLayer()
    private static createNormalizedLayer(layer: VariableFxDrawable, rect: ILevelBadgeSourceRect): OffscreenCanvas
    {
        const target = LevelBadgePainter.createTransparentBitmap(rect.width, rect.height);
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawLayer(layer, -rect.x, -rect.y, 'normal', 255);

        return target;
    }

    // AS3: .../renderers/level/LevelBadgePainter.as::createTransparentBitmap()
    private static createTransparentBitmap(width: number, height: number): OffscreenCanvas
    {
        return new OffscreenCanvas(Math.max(1, width | 0), Math.max(1, height | 0));
    }

    // AS3: .../renderers/level/LevelBadgePainter.as::dispose()
    dispose(): void
    {
        this._badgePrebakes = new Map();
    }
}
