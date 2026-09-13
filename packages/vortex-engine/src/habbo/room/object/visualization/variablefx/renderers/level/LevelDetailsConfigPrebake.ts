import type {IVariableFxRendererPrebake} from '../../IVariableFxRendererPrebake';
import type {VariableFxConfigData} from '../../VariableFxConfigData';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {LevelBadgePainter} from './LevelBadgePainter';
import type {LevelDetailsNumberPainter} from './LevelDetailsNumberPainter';

/** A background bitmap, plus whether the caller has to free it after the frame. */
export interface ILevelDetailsBackground
{
    bitmapData: OffscreenCanvas;
    ownsPrebake: boolean;
}

/**
 * What a level-details config owns: the plate, the badge painter, the caption painter, and the
 * nested progress bar's synthetic config.
 *
 * The plate is nine-sliced per WIDTH and cached per DIGIT COUNT, which is the same thing indexed by
 * its cause — the plate only gets wider because the badge did. Past
 * {@link LevelBadgePainter.MAX_SHARED_BADGE_PREBAKE_DIGITS} the count is unbounded wire data, so
 * nothing is cached and the caller frees it instead; `ownsPrebake` is that flag.
 *
 * See {@link LevelWithProgressConfigPrebake} for why the nested config is created here rather than
 * in the renderer, and why `disposed` is public.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/level/LevelDetailsConfigPrebake.as
 */
export class LevelDetailsConfigPrebake implements IVariableFxRendererPrebake
{
    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::FRAME_HEIGHT (name derived)
    //   AS3 inlines 29 into `createBackgroundPrebake`; it is `LevelDetailsRenderer.FRAME_HEIGHT`.
    private static readonly FRAME_HEIGHT: number = 29;

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::BACKGROUND_SLICE_LEFT_WIDTH (name derived)
    //   AS3 inlines 29; it is `LevelDetailsRenderer.BACKGROUND_SLICE_LEFT_WIDTH`.
    private static readonly BACKGROUND_SLICE_LEFT_WIDTH: number = 29;

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::BACKGROUND_SLICE_RIGHT_WIDTH (name derived)
    private static readonly BACKGROUND_SLICE_RIGHT_WIDTH: number = 6;

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::background
    background: VariableFxDrawable | null;

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::badgePainter
    badgePainter: LevelBadgePainter | null;

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::disposed
    disposed: boolean = false;

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::numberPainter (name derived)
    //   `_SafeStr_6962`: the caption painter, read by the renderer as well as disposed here.
    numberPainter: LevelDetailsNumberPainter | null;

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::_backgroundPrebakes
    private _backgroundPrebakes: Map<number, OffscreenCanvas> = new Map();

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::_progressRendererConfig
    private _progressRendererConfig: VariableFxConfigData | null = null;

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::LevelDetailsConfigPrebake()
    constructor(
        background: VariableFxDrawable,
        badgePainter: LevelBadgePainter,
        numberPainter: LevelDetailsNumberPainter
    )
    {
        this.background = background;
        this.badgePainter = badgePainter;
        this.numberPainter = numberPainter;
    }

    /** Keyed by digit count; above the shared limit the caller owns what it gets back. */
    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::getBackgroundPrebake()
    getBackgroundPrebake(digitCount: number, width: number): ILevelDetailsBackground
    {
        const digits = Math.max(1, digitCount);
        const frameWidth = Math.max(1, width);

        if(digits > LevelBadgePainter.MAX_SHARED_BADGE_PREBAKE_DIGITS)
        {
            return {bitmapData: this.createBackgroundPrebake(frameWidth), ownsPrebake: true};
        }

        let prebake = this._backgroundPrebakes.get(digits);

        if(prebake === undefined)
        {
            prebake = this.createBackgroundPrebake(frameWidth);

            this._backgroundPrebakes.set(digits, prebake);
        }

        return {bitmapData: prebake, ownsPrebake: false};
    }

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::getOrCreateProgressRendererConfig()
    getOrCreateProgressRendererConfig(create: () => VariableFxConfigData): VariableFxConfigData
    {
        if(this._progressRendererConfig === null) this._progressRendererConfig = create();

        return this._progressRendererConfig;
    }

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::createBackgroundPrebake()
    private createBackgroundPrebake(width: number): OffscreenCanvas
    {
        const target = new OffscreenCanvas(Math.max(1, width), LevelDetailsConfigPrebake.FRAME_HEIGHT);
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);

        if(this.background === null) return target;

        composer.drawThreeSlice(
            this.background,
            LevelDetailsConfigPrebake.BACKGROUND_SLICE_LEFT_WIDTH,
            LevelDetailsConfigPrebake.BACKGROUND_SLICE_RIGHT_WIDTH,
            width, 0, 0, 'normal', 255
        );

        return target;
    }

    // AS3: .../renderers/level/LevelDetailsConfigPrebake.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        this.disposed = true;

        if(this.badgePainter !== null) this.badgePainter.dispose();

        if(this.numberPainter !== null)
        {
            this.numberPainter.dispose();
            this.numberPainter = null;
        }

        this._backgroundPrebakes = new Map();

        if(this._progressRendererConfig !== null)
        {
            VariableFxRendererPrebakeCache.disposeConfigPrebake(this._progressRendererConfig);

            this._progressRendererConfig = null;
        }
    }
}
