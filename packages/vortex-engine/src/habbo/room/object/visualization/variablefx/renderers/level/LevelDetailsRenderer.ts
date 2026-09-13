import {OrderedMap} from '@core/utils/OrderedMap';
import type {IVariableFxRenderer} from '../../IVariableFxRenderer';
import {VariableFxConfigData} from '../../VariableFxConfigData';
import {VariableFxFrame} from '../../VariableFxFrame';
import {VariableFxPaintColor} from '../../VariableFxPaintColor';
import type {VariableFxRendererContext as Context} from '../../VariableFxRendererContext';
import {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import {VariableFxStatusData} from '../../VariableFxStatusData';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {ClassicMiniProgressBarRenderer} from '../bar/ClassicMiniProgressBarRenderer';
import {LevelBadgePainter, type ILevelBadgeAssets, type ILevelBadgeRender} from './LevelBadgePainter';
import {LevelDetailsConfigPrebake} from './LevelDetailsConfigPrebake';
import {LevelDetailsNumberPainter, type ILevelNumberRenderPlan} from './LevelDetailsNumberPainter';
import {LevelDetailsNumberProgress} from './LevelDetailsNumberProgress';
import {LevelProgressPathAnimator} from './LevelProgressPathAnimator';
import {LevelProgressPathSample} from './LevelProgressPathSample';

/**
 * The full level plate: a badge, a mini progress bar, and a `123/456` caption under it.
 *
 * Where {@link LevelWithProgressRenderer} resolves its bar through the registry, this one is fixed:
 * it constructs a {@link ClassicMiniProgressBarRenderer} directly, because the plate's geometry is
 * built around that bar's size and no other. Everything else about the nesting is the same — a
 * synthetic 0..1 config, a synthetic status, and the colour delegated down when the bar asks to be
 * told one.
 *
 * The caption is the part that needs a second animator. {@link LevelDetailsNumberProgress} tracks
 * the `value/max` text along the same path, because the maximum changes at a level boundary and
 * cannot be interpolated — it shows `...` while crossing.
 *
 * `hasFinalNumberRenderChange()` is the subtle half of the redraw test. The caption's text is not
 * in the frame signature (it would redraw on every counted-up digit, which the bar's own animation
 * already covers), so it is only consulted once the path has SETTLED — which is the one moment the
 * caption can change without anything else doing so.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/level/LevelDetailsRenderer.as
 */
export class LevelDetailsRenderer implements IVariableFxRenderer
{
    // AS3: .../renderers/level/LevelDetailsRenderer.as::BADGE_X
    static readonly BADGE_X: number = 5;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::BADGE_Y
    static readonly BADGE_Y: number = 4;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::BADGE_SOURCE_WIDTH
    static readonly BADGE_SOURCE_WIDTH: number = 21;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::BADGE_SOURCE_HEIGHT
    static readonly BADGE_SOURCE_HEIGHT: number = 21;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::BAR_SPACING_X
    static readonly BAR_SPACING_X: number = 3;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::BAR_Y
    static readonly BAR_Y: number = 19;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::NUMBER_Y
    static readonly NUMBER_Y: number = 7;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::FRAME_RIGHT_PADDING (name derived)
    //   The AS3 constant is `_SafeStr_11157`, value 6 — the gap right of the bar.
    static readonly FRAME_RIGHT_PADDING: number = 6;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::FRAME_HEIGHT
    static readonly FRAME_HEIGHT: number = 29;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::BACKGROUND_SLICE_LEFT_WIDTH
    static readonly BACKGROUND_SLICE_LEFT_WIDTH: number = 29;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::BACKGROUND_SLICE_RIGHT_WIDTH
    static readonly BACKGROUND_SLICE_RIGHT_WIDTH: number = 6;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::LEVEL_DETAILS_ASSETS
    private static readonly LEVEL_DETAILS_ASSETS = {
        background: 'variablefx_level_details_background',
        darkening: 'variablefx_level_details_darkening',
        darkeningMetallic: 'variablefx_level_details_darkening_metallic',
        frame: 'variablefx_level_details_frame',
        lighting: 'variablefx_level_details_lighting',
        lightingMetallic: 'variablefx_level_details_lighting_metallic',
        numbers: 'variablefx_numbers_large',
        smallNumbers: 'variablefx_numbers_small'
    };

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_badgeRender (name derived)
    private _badgeRender: ILevelBadgeRender | null = null;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_badgeRenderKey
    private _badgeRenderKey: string = '';

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_context
    private _context: Context;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_frame
    private _frame: VariableFxFrame = new VariableFxFrame();

    /**
     * TODO(AS3): `_SafeStr_10568` is ASSIGNED in `renderFrame()` (to the digit count) and read
     *   nowhere in the AIR dump — a dead field. Kept so the assignment in `renderFrame()` is a
     *   faithful transcription rather than a silent omission; delete both if a later build shows
     *   it was never meant to exist.
     */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::_lastRenderedDigitCount (name derived)
    private _lastRenderedDigitCount: number = 0;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_lastRenderedNumberKey
    private _lastRenderedNumberKey: string = '';

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_renderedSignature (name derived)
    private _renderedSignature: string = '';

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_levelProgress
    private _levelProgress: LevelProgressPathAnimator = new LevelProgressPathAnimator();

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_initialized (name derived)
    private _initialized: boolean = false;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_numberProgress
    private _numberProgress: LevelDetailsNumberProgress = new LevelDetailsNumberProgress();

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_configPrebake (name derived)
    private _configPrebake: LevelDetailsConfigPrebake;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_progressRenderer (name derived)
    private _progressRenderer: ClassicMiniProgressBarRenderer;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::_progressRendererConfig
    private _progressRendererConfig: VariableFxConfigData;

    // AS3: .../renderers/level/LevelDetailsRenderer.as::LevelDetailsRenderer()
    constructor(context: Context)
    {
        this._context = context;
        this._configPrebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => this.createPrebake(context)
        ) as LevelDetailsConfigPrebake;
        this._progressRendererConfig = this._configPrebake.getOrCreateProgressRendererConfig(
            () => LevelDetailsRenderer.createProgressRendererConfig(context)
        );
        this._progressRenderer = new ClassicMiniProgressBarRenderer(this.createProgressRendererContext(context));
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::get frame()
    get frame(): VariableFxFrame
    {
        return this._frame;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::get isContinuous()
    get isContinuous(): boolean
    {
        return this._progressRenderer.isContinuous;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::updateData()
    updateData(context: Context, time: number): void
    {
        this._context = context;

        const sample = LevelDetailsRenderer.resolveLevelProgressSample(context);

        this.updateLevelProgressTarget(context, sample, time);
        this.updateNumberProgressTarget(context, sample);
        this.updateProgressRendererData(context, time);
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::needsUpdate()
    needsUpdate(time: number): boolean
    {
        if(this.isConfigPrebakeDisposed()) return false;

        return this._levelProgress.needsUpdate(time, this.levelProgressPathPixelScale)
            || this._progressRenderer.needsUpdate(time)
            || this.hasRenderChange()
            || this.hasFinalNumberRenderChange();
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::update()
    update(time: number): boolean
    {
        if(this.isConfigPrebakeDisposed()) return false;

        if(this._levelProgress.update(time)) this.updateProgressRendererData(this._context, time);

        const barChanged = this._progressRenderer.update(time);

        if(!barChanged && !this.hasRenderChange() && !this.hasFinalNumberRenderChange()) return false;

        this.ensureFrameBitmap();
        this.renderFrame();

        this._renderedSignature = this.createRenderedSignature();
        this._frame.updateId += 1;

        return true;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::get levelText()
    private get levelText(): string
    {
        return String(this._levelProgress.displayedLevel);
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::get digitCount()
    private get digitCount(): number
    {
        return Math.max(1, this.levelText.length);
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::get badgeWidth()
    private get badgeWidth(): number
    {
        const painter = this._configPrebake.badgePainter;

        return painter === null ? 0 : painter.resolveFrameWidth(this.digitCount);
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::get progressX()
    private get progressX(): number
    {
        return LevelDetailsRenderer.BADGE_X + this.badgeWidth + LevelDetailsRenderer.BAR_SPACING_X;
    }

    /**
     * Falls back to the configured width when the bar has not drawn yet — the plate has to be laid
     * out on the first frame, before the bar's own frame bitmap exists.
     */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::get progressFrameWidth()
    private get progressFrameWidth(): number
    {
        return this._progressRenderer.frame.width > 0
            ? this._progressRenderer.frame.width
            : LevelDetailsRenderer.resolveClassicProgressBarFrameWidth(this._context.config.width);
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::get frameWidth()
    private get frameWidth(): number
    {
        return this.progressX + this.progressFrameWidth + LevelDetailsRenderer.FRAME_RIGHT_PADDING;
    }

    /** Fixed: unlike the badge-only renderer, this plate is always 29px tall. */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::get frameHeight()
    private get frameHeight(): number
    {
        return LevelDetailsRenderer.FRAME_HEIGHT;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::get levelProgressPathPixelScale()
    private get levelProgressPathPixelScale(): number
    {
        return Math.max(1, this.progressFrameWidth);
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::get displayedFrameArgb()
    private get displayedFrameArgb(): number
    {
        const paintColor = VariableFxPaintColor.resolveTargetPaintColor(
            this._context.config.color,
            this._context.config.extra,
            this._levelProgress.displayedProgress,
            this.createDisplayedLevelStatusExtra()
        );

        return (0xFF000000 | paintColor.rgb) >>> 0;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::createPrebake()
    private createPrebake(context: Context): LevelDetailsConfigPrebake
    {
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const assets = this.resolveBadgeAssets(paintColor.isMetallic);
        const background = this.getLayer(LevelDetailsRenderer.LEVEL_DETAILS_ASSETS.background);

        return new LevelDetailsConfigPrebake(
            background,
            new LevelBadgePainter(assets, {
                height: LevelDetailsRenderer.BADGE_SOURCE_HEIGHT,
                width: LevelDetailsRenderer.BADGE_SOURCE_WIDTH,
                x: LevelDetailsRenderer.BADGE_X,
                y: LevelDetailsRenderer.BADGE_Y
            }),
            new LevelDetailsNumberPainter(this.getLayer(LevelDetailsRenderer.LEVEL_DETAILS_ASSETS.smallNumbers))
        );
    }

    /** No badge background here: the plate behind it is the background, drawn separately. */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::resolveBadgeAssets()
    private resolveBadgeAssets(isMetallic: boolean): ILevelBadgeAssets
    {
        const names = LevelDetailsRenderer.LEVEL_DETAILS_ASSETS;

        return {
            background: null,
            darkening: this.getLayer(isMetallic ? names.darkeningMetallic : names.darkening),
            frame: this.getLayer(names.frame),
            lighting: this.getLayer(isMetallic ? names.lightingMetallic : names.lighting),
            numbers: this.getLayer(names.numbers)
        };
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::getLayer()
    private getLayer(name: string): VariableFxDrawable
    {
        const layer = this._context.assetProvider === null
            ? null
            : this._context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX level details layer '${name}'.`);

        return layer;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::ensureFrameBitmap()
    private ensureFrameBitmap(): void
    {
        if(this._frame.bitmapData !== null
            && this._frame.width === this.frameWidth
            && this._frame.height === this.frameHeight)
        {
            return;
        }

        this._frame.disposeBitmap();

        const bitmap = new OffscreenCanvas(Math.max(1, this.frameWidth), Math.max(1, this.frameHeight));

        this._frame.bitmapData = bitmap;
        this._frame.cacheKey = null;
        this._frame.width = bitmap.width;
        this._frame.height = bitmap.height;
        this._renderedSignature = '';
    }

    /** Plate, bar, caption, badge — in that order, so the badge sits over the plate's left end. */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::renderFrame()
    private renderFrame(): void
    {
        const target = this._frame.bitmapData;

        if(target === null) return;

        const composer = new VariableFxBitmapComposer(target);
        const digitCount = this.digitCount;
        const background = this._configPrebake.getBackgroundPrebake(digitCount, this.frameWidth);
        const bar = this._progressRenderer.frame.bitmapData;
        const badge = this.getCurrentBadgeRender();
        const plan = this.createCurrentNumberRenderPlan();
        const numberPainter = this._configPrebake.numberPainter;
        const badgePainter = this._configPrebake.badgePainter;

        composer.clear(0);
        composer.drawLayer(background.bitmapData, 0, 0, 'normal', 255);

        if(bar !== null) composer.drawLayer(bar, this.progressX, LevelDetailsRenderer.BAR_Y, 'normal', 255);

        if(numberPainter !== null)
        {
            numberPainter.draw(composer, plan, this.resolveNumberX(plan), LevelDetailsRenderer.NUMBER_Y);
        }

        if(badge !== null && badgePainter !== null)
        {
            badgePainter.drawBadge(
                composer, badge, this.levelText, LevelDetailsRenderer.BADGE_X, LevelDetailsRenderer.BADGE_Y
            );
        }

        this._lastRenderedDigitCount = digitCount;
        this._lastRenderedNumberKey = plan.key;

        // AS3 disposes the background here when `ownsPrebake` is set. An OffscreenCanvas is
        // collected once unreferenced, so honouring the flag means simply not keeping it — which
        // is already the case, since it is a local.
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::getCurrentBadgeRender()
    private getCurrentBadgeRender(): ILevelBadgeRender | null
    {
        const key = `${this.digitCount}:${this.displayedFrameArgb}`;

        if(this._badgeRender !== null && this._badgeRenderKey === key) return this._badgeRender;

        this.disposeCurrentBadgeRender();

        const painter = this._configPrebake.badgePainter;

        if(painter === null) return null;

        this._badgeRender = painter.createBadgeRender(this.digitCount, this.displayedFrameArgb);
        this._badgeRenderKey = key;

        return this._badgeRender;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::disposeCurrentBadgeRender()
    private disposeCurrentBadgeRender(): void
    {
        const painter = this._configPrebake === null ? null : this._configPrebake.badgePainter;

        if(painter !== null) painter.disposeBadgeRender(this._badgeRender);

        this._badgeRender = null;
        this._badgeRenderKey = '';
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::createRenderedSignature()
    private createRenderedSignature(): string
    {
        return `${this.frameWidth}x${this.frameHeight}:${this._levelProgress.displayedLevel}:${this.displayedFrameArgb}`;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::hasRenderChange()
    private hasRenderChange(): boolean
    {
        return this._frame.bitmapData === null
            || this._frame.width !== this.frameWidth
            || this._frame.height !== this.frameHeight
            || this.createRenderedSignature() !== this._renderedSignature;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::isConfigPrebakeDisposed()
    private isConfigPrebakeDisposed(): boolean
    {
        return this._configPrebake === null || this._configPrebake.disposed;
    }

    /**
     * Only once the path has SETTLED. Mid-animation the caption changes constantly and the bar's
     * own redraw already carries it; the settled case is the one where nothing else would notice.
     */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::hasFinalNumberRenderChange()
    private hasFinalNumberRenderChange(): boolean
    {
        return this._numberProgress.isAtTarget(this._levelProgress.displayedPath)
            && this.createCurrentNumberRenderPlan().key !== this._lastRenderedNumberKey;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::createCurrentNumberRenderPlan()
    private createCurrentNumberRenderPlan(): ILevelNumberRenderPlan
    {
        const display = this._numberProgress.resolveDisplay(this._levelProgress.displayedPath);
        const painter = this._configPrebake.numberPainter;

        if(painter === null) return {key: 'empty', parts: [], width: 0};

        return painter.createRenderPlan(display.currentText, display.maxText, this.progressFrameWidth);
    }

    /** Centred over the bar, not over the plate. */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::resolveNumberX()
    private resolveNumberX(plan: ILevelNumberRenderPlan): number
    {
        return this.progressX + (((this.progressFrameWidth - plan.width) / 2) | 0);
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::updateProgressRendererData()
    private updateProgressRendererData(context: Context, time: number): void
    {
        this._progressRenderer.updateData(this.createProgressRendererContext(context), time);
    }

    /**
     * The bar's config carries only `color` and `metallic` from the parent's extras — not the whole
     * map, unlike {@link LevelWithProgressRenderer}. Passing everything would hand the bar the
     * level's own `sub_renderer` and `icon`, which are not its.
     */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::createProgressRendererConfig()
    private static createProgressRendererConfig(context: Context): VariableFxConfigData
    {
        const color = context.config.color === VariableFxPaintColor.DYNAMIC_LEVELLING
            ? VariableFxPaintColor.DYNAMIC_DELEGATED
            : context.config.color;

        return new VariableFxConfigData(
            'progress_bar', 'classic_mini_progress', 'classic_mini_progress', context.config.width, color, 0, 1,
            LevelDetailsRenderer.createProgressRendererConfigExtra(context),
            context.config.categoryId, context.config.styleId, 1
        );
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::createProgressRendererConfigExtra()
    private static createProgressRendererConfigExtra(context: Context): OrderedMap
    {
        const extra = new OrderedMap();
        const color = VariableFxPaintColor.readExtra(context.config.extra, 'color');
        const metallic = VariableFxPaintColor.readExtra(context.config.extra, 'metallic');

        if(color !== null) extra.add('color', color);

        if(metallic !== null) extra.add('metallic', metallic);

        return extra;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::createProgressRendererContext()
    private createProgressRendererContext(context: Context): VariableFxRendererContext
    {
        const progress = this._levelProgress.displayedProgress;

        return new VariableFxRendererContext(
            context.assetProvider,
            this._progressRendererConfig,
            new VariableFxStatusData(progress, null, null, this.createProgressRendererStatusExtra(), true),
            0, 1, progress, context.registry
        );
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::updateLevelProgressTarget()
    private updateLevelProgressTarget(context: Context, sample: LevelProgressPathSample, time: number): void
    {
        // An initialize is a whole-room sync, not a level-up: snap, do not animate.
        if(!this._initialized || context.status.isInitialize)
        {
            this._levelProgress.snapTo(sample, time);
            this._initialized = true;

            return;
        }

        this._levelProgress.setTarget(sample, time);
    }

    /** The caption is retargeted from the path the badge is CURRENTLY at, not from the last target. */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::updateNumberProgressTarget()
    private updateNumberProgressTarget(context: Context, sample: LevelProgressPathSample): void
    {
        const target = {
            maxValue: context.maxValue,
            pathSample: sample,
            value: Math.min(context.maxValue, context.status.value)
        };

        if(context.status.isInitialize)
        {
            this._numberProgress.snapTo(target);

            return;
        }

        this._numberProgress.setTarget(target, this._levelProgress.displayedPath);
    }

    /**
     * DEVIATION: AS3 calls `.toLowerCase()` straight on `readExtra(..., "is_maxed")`, which is a
     *   #1009 whenever the status carries no `is_maxed`. Guarded here, as in
     *   {@link LevelWithProgressRenderer} and `VariableFxPaintColor.resolveDynamicLevellingRgb()`:
     *   the faithful version takes the whole room's render down on an optional field.
     * AS3: .../renderers/level/LevelDetailsRenderer.as::resolveLevelProgressSample()
     */
    private static resolveLevelProgressSample(context: Context): LevelProgressPathSample
    {
        const currentLevel = Number(VariableFxPaintColor.readExtra(context.status.extra, 'current_level'));
        const maxLevel = Number(VariableFxPaintColor.readExtra(context.status.extra, 'max_level'));
        const rawMaxed = VariableFxPaintColor.readExtra(context.status.extra, 'is_maxed');
        const isMaxed = rawMaxed !== null && rawMaxed.toLowerCase() === 'true';
        const progress = LevelProgressPathAnimator.resolveLevelProgressSampleProgress(
            context.progress, context.status.value, context.minValue, context.maxValue, isMaxed
        );

        return new LevelProgressPathSample(
            currentLevel, progress, isMaxed, Number.isFinite(maxLevel) ? maxLevel : null
        );
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::createDisplayedLevelStatusExtra()
    private createDisplayedLevelStatusExtra(): OrderedMap
    {
        const extra = new OrderedMap();
        const statusExtra = this._context.status.extra;
        const maxLevel = VariableFxPaintColor.readExtra(statusExtra, 'max_level');
        const isMaxed = VariableFxPaintColor.readExtra(statusExtra, 'is_maxed');

        // See LevelWithProgressRenderer.createDisplayedLevelStatusExtra(): AS3 stores these even
        // when null, and an absent key reads back the same way.
        if(maxLevel !== null) extra.add('max_level', maxLevel);

        if(isMaxed !== null) extra.add('is_maxed', isMaxed);

        extra.add('current_level', String(this._levelProgress.displayedLevel));

        const delegated = VariableFxPaintColor.readExtra(statusExtra, 'delegated_color');

        if(delegated !== null) extra.add('delegated_color', delegated);

        return extra;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::createProgressRendererStatusExtra()
    private createProgressRendererStatusExtra(): OrderedMap
    {
        const extra = new OrderedMap();
        const config = this._progressRendererConfig;

        if(config.color !== VariableFxPaintColor.DYNAMIC_DELEGATED)
        {
            const delegated = config.color === VariableFxPaintColor.DYNAMIC_TEAM_COLOR
                ? VariableFxPaintColor.readExtra(this._context.status.extra, 'delegated_color')
                : null;

            if(delegated !== null) extra.add('delegated_color', delegated);

            return extra;
        }

        extra.add('delegated_color', LevelDetailsRenderer.formatRgbHex(this.displayedFrameArgb & 0xFFFFFF));

        return extra;
    }

    /**
     * The classic bar's five sizes, repeated here rather than imported.
     *
     * AS3 duplicates them too — this is the width used before the bar has ever drawn, so it cannot
     * ask the bar, and `ClassicProgressBarRenderer.resolveFrameWidth()` is an instance method there
     * as it is here.
     */
    // AS3: .../renderers/level/LevelDetailsRenderer.as::resolveClassicProgressBarFrameWidth()
    private static resolveClassicProgressBarFrameWidth(width: string): number
    {
        switch(width)
        {
            case 'extra_small': return 29;
            case 'small': return 45;
            case 'medium': return 61;
            case 'large': return 77;
            case 'extra_large': return 93;
            default: return 61;
        }
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::formatRgbHex()
    private static formatRgbHex(rgb: number): string
    {
        return `#${(rgb & 0xFFFFFF).toString(16).padStart(6, '0')}`;
    }

    // AS3: .../renderers/level/LevelDetailsRenderer.as::dispose()
    dispose(): void
    {
        this.disposeCurrentBadgeRender();
        this._progressRenderer.dispose();
        this._frame.disposeBitmap();
    }
}
