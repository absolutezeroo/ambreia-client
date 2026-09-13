import type {IVariableFxRendererPrebake} from '../../IVariableFxRendererPrebake';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxClipRect} from '../../rendering/VariableFxClipRect';
import type {IVariableFxBarOverlay} from './IVariableFxBarLayout';

/** The nine layers a heart fill is built from. */
export interface IMaskedHeartFillAssets
{
    background: VariableFxDrawable;
    bar: VariableFxDrawable;
    endPointer: VariableFxDrawable;
    mask: VariableFxDrawable;
    metallic: VariableFxDrawable | null;
    overlays: IVariableFxBarOverlay[];
}

/**
 * Every frame this heart has ever shown, kept by (colour, filled width).
 *
 * Unlike the other bars, which composite once per redraw, this one memoises WHOLE FRAMES. There are
 * only ever `progressPixelWidth + 1` of them per colour and a heart is small, so a bar that has
 * animated once replays for free — and with a static colour that is a single row of frames shared
 * by every object using the config.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/MaskedHeartFillFramePrebake.as
 */
export class MaskedHeartFillFramePrebake implements IVariableFxRendererPrebake
{
    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::FILL_X
    private static readonly FILL_X: number = 2;

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::FILL_RIGHT_PADDING
    private static readonly FILL_RIGHT_PADDING: number = 2;

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::POINTER_WIDTH
    //   Name derived: the AS3 constant is `_SafeStr_10955`, value 1 — the width of the clip the end
    //   pointer is drawn through.
    private static readonly POINTER_WIDTH: number = 1;

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::POINTER_VERTICAL_PADDING
    private static readonly POINTER_VERTICAL_PADDING: number = 2;

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::frameWidth
    frameWidth: number;

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::frameHeight
    frameHeight: number;

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::progressPixelWidth
    progressPixelWidth: number;

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::_assets
    private _assets: IMaskedHeartFillAssets | null;

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::_frames (name derived)
    private _frames: Map<number, Map<number, OffscreenCanvas>> = new Map();

    /** The heart's size is the BACKGROUND artwork's — nothing here is configurable. */
    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::MaskedHeartFillFramePrebake()
    constructor(assets: IMaskedHeartFillAssets)
    {
        this._assets = assets;
        this.frameWidth = assets.background.width;
        this.frameHeight = assets.background.height;
        this.progressPixelWidth = Math.max(
            0,
            this.frameWidth - MaskedHeartFillFramePrebake.FILL_X - MaskedHeartFillFramePrebake.FILL_RIGHT_PADDING
        );
    }

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::getOrCreateFrame()
    getOrCreateFrame(argb: number, filledWidth: number): OffscreenCanvas | null
    {
        if(this._assets === null) return null;

        const width = Math.max(0, Math.min(this.progressPixelWidth, filledWidth));

        let byWidth = this._frames.get(argb);

        if(byWidth === undefined)
        {
            byWidth = new Map();
            this._frames.set(argb, byWidth);
        }

        const cached = byWidth.get(width);

        if(cached !== undefined) return cached;

        const frame = this.createFrame(argb, width);

        byWidth.set(width, frame);

        return frame;
    }

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::createFrame()
    private createFrame(argb: number, filledWidth: number): OffscreenCanvas
    {
        const frame = new OffscreenCanvas(Math.max(1, this.frameWidth), Math.max(1, this.frameHeight));
        const composer = new VariableFxBitmapComposer(frame);
        const clip = this.createProgressClip(filledWidth);
        const assets = this._assets;

        if(assets === null) return frame;

        composer.drawLayer(assets.background, 0, 0, 'normal', 255);

        if(filledWidth > 0 && clip !== null)
        {
            // The fill is one tinted layer clipped to the filled width — the heart's SHAPE comes
            // from the artwork's own alpha, not from a mask, which is why there is no cut edge to
            // hide.
            composer.drawTintedLayer(assets.bar, 0, 0, argb, 'normal', 255, clip);
            this.drawEndPointer(composer, assets.endPointer, assets.mask, filledWidth);

            if(assets.metallic !== null) composer.drawLayer(assets.metallic, 0, 0, 'add', 255, clip);

            for(const overlay of assets.overlays)
            {
                composer.drawLayer(overlay.layer, 0, 0, overlay.blendMode, 255, clip);
            }
        }

        return frame;
    }

    /**
     * The 1px darker line at the fill's leading edge, masked to the heart's silhouette so it stops
     * at the outline instead of running past it.
     *
     * This is the one place in the whole feature that uses the red-channel mask: the pointer is
     * drawn through `mask`'s RED, not its alpha — the mask art is opaque everywhere, so reading its
     * alpha would mask nothing and the line would cross the heart's border.
     */
    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::drawEndPointer()
    private drawEndPointer(
        composer: VariableFxBitmapComposer,
        endPointer: VariableFxDrawable,
        mask: VariableFxDrawable,
        filledWidth: number
    ): void
    {
        const edgeX = MaskedHeartFillFramePrebake.FILL_X + filledWidth - 1;
        const pointerX = edgeX - 1;
        const maskX = mask.width >= this.frameWidth ? 0 : edgeX - ((mask.width / 2) | 0);
        const maskY = mask.height >= this.frameHeight ? 0 : (((this.frameHeight - mask.height) / 2) | 0);

        composer.drawMaskedLayer(
            endPointer, mask, pointerX, 0, maskX, maskY, 'multiply', 255,
            new VariableFxClipRect(
                edgeX,
                MaskedHeartFillFramePrebake.POINTER_VERTICAL_PADDING,
                MaskedHeartFillFramePrebake.POINTER_WIDTH,
                Math.max(0, this.frameHeight - MaskedHeartFillFramePrebake.POINTER_VERTICAL_PADDING * 2)
            )
        );
    }

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::createProgressClip()
    private createProgressClip(filledWidth: number): VariableFxClipRect | null
    {
        if(filledWidth <= 0) return null;

        return new VariableFxClipRect(MaskedHeartFillFramePrebake.FILL_X, 0, filledWidth, this.frameHeight);
    }

    // AS3: .../renderers/bar/MaskedHeartFillFramePrebake.as::dispose()
    dispose(): void
    {
        this._frames = new Map();
        this._assets = null;
    }
}
