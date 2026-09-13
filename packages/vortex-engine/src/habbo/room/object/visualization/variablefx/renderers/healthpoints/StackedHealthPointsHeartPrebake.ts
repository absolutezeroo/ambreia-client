import type {IVariableFxRendererPrebake} from '../../IVariableFxRendererPrebake';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import type {IVariableFxBarOverlay} from '../bar/IVariableFxBarLayout';

/** The layers one heart is built from. */
export interface IStackedHealthPointsAssets
{
    background: VariableFxDrawable;
    /** Only for a metallic paint colour; null otherwise. */
    metallic: VariableFxDrawable | null;
    overlays: IVariableFxBarOverlay[];
}

/**
 * One finished heart per colour, kept for as long as the config lives.
 *
 * A stack draws the SAME heart many times — up to 100 of them — so compositing it once and blitting
 * it is the whole optimisation. Keyed by colour only, because unlike the bars a heart has no partial
 * state: it is either drawn or it is not, and the fade is an opacity on the blit rather than a
 * different bitmap.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/healthpoints/StackedHealthPointsHeartPrebake.as
 */
export class StackedHealthPointsHeartPrebake implements IVariableFxRendererPrebake
{
    // AS3: .../renderers/healthpoints/StackedHealthPointsHeartPrebake.as::heartHeight
    heartHeight: number;

    // AS3: .../renderers/healthpoints/StackedHealthPointsHeartPrebake.as::heartWidth
    heartWidth: number;

    // AS3: .../renderers/healthpoints/StackedHealthPointsHeartPrebake.as::_assets
    private _assets: IStackedHealthPointsAssets | null;

    // AS3: .../renderers/healthpoints/StackedHealthPointsHeartPrebake.as::_hearts (name derived)
    //   `_SafeStr_6614`: the baked hearts, by ARGB. AS3 keys an untyped object with the number
    //   stringified; a Map keyed on the number itself is the same lookup.
    private _hearts: Map<number, OffscreenCanvas> = new Map();

    /** A heart's size is the BACKGROUND artwork's — nothing here is configurable. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsHeartPrebake.as::StackedHealthPointsHeartPrebake()
    constructor(assets: IStackedHealthPointsAssets)
    {
        this._assets = assets;
        this.heartWidth = assets.background.width;
        this.heartHeight = assets.background.height;
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsHeartPrebake.as::getOrCreateHeartPrebake()
    getOrCreateHeartPrebake(argb: number): OffscreenCanvas | null
    {
        if(this._assets === null) return null;

        const cached = this._hearts.get(argb);

        if(cached !== undefined) return cached;

        const heart = this.createHeartPrebake(argb);

        this._hearts.set(argb, heart);

        return heart;
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsHeartPrebake.as::createHeartPrebake()
    private createHeartPrebake(argb: number): OffscreenCanvas
    {
        const heart = new OffscreenCanvas(Math.max(1, this.heartWidth), Math.max(1, this.heartHeight));
        const composer = new VariableFxBitmapComposer(heart);
        const assets = this._assets;

        composer.clear(0);

        if(assets === null) return heart;

        composer.drawTintedLayer(assets.background, 0, 0, argb, 'normal', 255);

        if(assets.metallic !== null) composer.drawLayer(assets.metallic, 0, 0, 'add', 255);

        for(const overlay of assets.overlays)
        {
            composer.drawLayer(overlay.layer, 0, 0, overlay.blendMode, 255);
        }

        return heart;
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsHeartPrebake.as::dispose()
    dispose(): void
    {
        this._hearts = new Map();
        this._assets = null;
    }
}
