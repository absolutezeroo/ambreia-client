import {OrderedMap} from '@core/utils/OrderedMap';
import type {IVariableFxRenderer} from '../../IVariableFxRenderer';
import {VariableFxConfigData} from '../../VariableFxConfigData';
import {VariableFxFrame} from '../../VariableFxFrame';
import {VariableFxPaintColor} from '../../VariableFxPaintColor';
import type {VariableFxRendererContext as Context} from '../../VariableFxRendererContext';
import {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import {resolveVariableFxRendererById} from '../../VariableFxRendererType';
import {VariableFxStatusData} from '../../VariableFxStatusData';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {LevelBadgePainter, type ILevelBadgeAssets, type ILevelBadgeRender} from './LevelBadgePainter';
import {LevelProgressPathAnimator} from './LevelProgressPathAnimator';
import {LevelProgressPathSample} from './LevelProgressPathSample';
import {LevelWithProgressConfigPrebake} from './LevelWithProgressConfigPrebake';

/**
 * A level badge with a progress bar running out of its right-hand side.
 *
 * The only renderer in the feature that BUILDS ANOTHER RENDERER. The bar is not drawn here: the
 * config's `sub_renderer` extra names one by server id, the registry is asked for its factory, and
 * whatever comes back is driven with a synthetic config and a synthetic status of its own. The
 * frame is then sized around whatever that renderer's frame turned out to be, and the badge is
 * drawn over its left edge — hence {@link PROGRESS_BAR_OVERLAP_WIDTH}, which is how far the bar
 * tucks under the badge.
 *
 * Everything about the sub-renderer is optional and fails soft: no extra, an unknown id, a
 * self-reference, or a registry with no such factory all leave `_progressRenderer` null and the
 * badge renders alone. That is deliberate — a mapping the client does not understand should cost
 * the bar, not the badge.
 *
 * The colour is delegated DOWN rather than resolved twice: when the bar's config asks for
 * `DYNAMIC_DELEGATED`, this renderer writes its own displayed colour into the bar's status as a hex
 * string, so a levelling badge and its bar stay exactly in step through the animation.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/level/LevelWithProgressRenderer.as
 */
export class LevelWithProgressRenderer implements IVariableFxRenderer
{
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::FRAME_HEIGHT
    private static readonly FRAME_HEIGHT: number = 21;

    /** How far the bar tucks under the badge, so the two read as one object. */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::PROGRESS_BAR_OVERLAP_WIDTH
    private static readonly PROGRESS_BAR_OVERLAP_WIDTH: number = 3;

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::LEVEL_WITH_PROGRESS_ASSETS (name derived)
    //   The AS3 constant is `_SafeStr_6165`.
    private static readonly LEVEL_WITH_PROGRESS_ASSETS = {
        background: 'variablefx_level_with_progress_background',
        darkening: 'variablefx_level_with_progress_darkening',
        darkeningMetallic: 'variablefx_level_with_progress_darkening_metallic',
        frame: 'variablefx_level_with_progress_frame',
        lighting: 'variablefx_level_with_progress_lighting',
        lightingMetallic: 'variablefx_level_with_progress_lighting_metallic',
        numbers: 'variablefx_numbers_large'
    };

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_badgeRender (name derived)
    //   `_SafeStr_6447`: the current badge, recoloured.
    private _badgeRender: ILevelBadgeRender | null = null;

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_badgeRenderKey
    private _badgeRenderKey: string = '';

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_context
    private _context: Context;

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_frame
    private _frame: VariableFxFrame = new VariableFxFrame();

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_renderedSignature (name derived)
    //   `_SafeStr_8154`: what the frame on screen currently shows.
    private _renderedSignature: string = '';

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_levelProgress
    private _levelProgress: LevelProgressPathAnimator = new LevelProgressPathAnimator();

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_initialized (name derived)
    private _initialized: boolean = false;

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_configPrebake (name derived)
    private _configPrebake: LevelWithProgressConfigPrebake;

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_progressRenderer (name derived)
    //   `_SafeStr_4866`: the nested bar; null when none could be resolved.
    private _progressRenderer: IVariableFxRenderer | null = null;

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::_progressRendererConfig
    private _progressRendererConfig: VariableFxConfigData | null = null;

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::LevelWithProgressRenderer()
    constructor(context: Context)
    {
        this._context = context;
        this._configPrebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => this.createPrebake(context)
        ) as LevelWithProgressConfigPrebake;

        this.initializeProgressRenderer(context);
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get frame()
    get frame(): VariableFxFrame
    {
        return this._frame;
    }

    /** Continuous only if the nested bar is — the badge itself never animates on its own. */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get isContinuous()
    get isContinuous(): boolean
    {
        return this._progressRenderer !== null && this._progressRenderer.isContinuous;
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::updateData()
    updateData(context: Context, time: number): void
    {
        this._context = context;

        this.updateLevelProgressTarget(context, time);
        this.updateProgressRendererData(context, time);
    }

    /** A renderer whose config prebake has been freed reports nothing to do, ever. */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::needsUpdate()
    needsUpdate(time: number): boolean
    {
        if(this.isConfigPrebakeDisposed()) return false;

        return this._levelProgress.needsUpdate(time, this.levelProgressPathPixelScale)
            || (this._progressRenderer !== null && this._progressRenderer.needsUpdate(time))
            || this.hasRenderChange();
    }

    /**
     * The level animation is advanced BEFORE the bar is told anything, because the bar's own
     * progress is read out of it — feeding the bar first would run it a frame behind.
     */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::update()
    update(time: number): boolean
    {
        if(this.isConfigPrebakeDisposed()) return false;

        if(this._levelProgress.update(time)) this.updateProgressRendererData(this._context, time);

        const barChanged = this._progressRenderer !== null && this._progressRenderer.update(time);

        if(!barChanged && !this.hasRenderChange()) return false;

        this.ensureFrameBitmap();
        this.renderFrame();

        this._renderedSignature = this.createRenderedSignature();
        this._frame.updateId += 1;

        return true;
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get levelText()
    private get levelText(): string
    {
        return String(this._levelProgress.displayedLevel);
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get digitCount()
    private get digitCount(): number
    {
        return Math.max(1, this.levelText.length);
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get badgeWidth()
    private get badgeWidth(): number
    {
        const painter = this._configPrebake.badgePainter;

        return painter === null ? 0 : painter.resolveFrameWidth(this.digitCount);
    }

    /** With no bar the frame is just the badge; with one it reaches to the bar's right edge. */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get frameWidth()
    private get frameWidth(): number
    {
        const barWidth = this._progressRenderer === null ? 0 : this._progressRenderer.frame.width;

        if(barWidth <= 0) return this.badgeWidth;

        return this.progressX + barWidth;
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get frameHeight()
    private get frameHeight(): number
    {
        return Math.max(
            LevelWithProgressRenderer.FRAME_HEIGHT,
            this._progressRenderer === null ? 0 : this._progressRenderer.frame.height
        );
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get progressX()
    private get progressX(): number
    {
        return Math.max(0, this.badgeWidth - LevelWithProgressRenderer.PROGRESS_BAR_OVERLAP_WIDTH);
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get progressY()
    private get progressY(): number
    {
        const barHeight = this._progressRenderer === null ? 0 : this._progressRenderer.frame.height;

        if(barHeight <= 0) return 0;

        return Math.max(0, ((this.frameHeight - barHeight) / 2) | 0);
    }

    /**
     * How many pixels one unit of path is worth, which is what tells `AnimatedScalar` when a change
     * is too small to be visible. The bar's width is the right scale because the bar is what a
     * fractional level actually moves.
     */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get levelProgressPathPixelScale()
    private get levelProgressPathPixelScale(): number
    {
        return Math.max(1, this._progressRenderer === null ? this.badgeWidth : this._progressRenderer.frame.width);
    }

    /** Resolved against the DISPLAYED level, not the target — so the badge recolours as it climbs. */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::get displayedFrameArgb()
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

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::createPrebake()
    private createPrebake(context: Context): LevelWithProgressConfigPrebake
    {
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const assets = this.resolveAssets(context, paintColor.isMetallic);

        return new LevelWithProgressConfigPrebake(
            new LevelBadgePainter(assets, {
                height: LevelWithProgressRenderer.FRAME_HEIGHT,
                width: LevelWithProgressRenderer.FRAME_HEIGHT,
                x: 0,
                y: 0
            })
        );
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::resolveAssets()
    private resolveAssets(context: Context, isMetallic: boolean): ILevelBadgeAssets
    {
        const names = LevelWithProgressRenderer.LEVEL_WITH_PROGRESS_ASSETS;

        return {
            background: this.getLayer(context, names.background),
            darkening: this.getLayer(context, isMetallic ? names.darkeningMetallic : names.darkening),
            frame: this.getLayer(context, names.frame),
            lighting: this.getLayer(context, isMetallic ? names.lightingMetallic : names.lighting),
            numbers: this.getLayer(context, names.numbers)
        };
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::getLayer()
    private getLayer(context: Context, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX level with progress layer '${name}'.`);

        return layer;
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::ensureFrameBitmap()
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

    /** The bar first, then the badge over it — the badge owns the overlap. */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::renderFrame()
    private renderFrame(): void
    {
        const target = this._frame.bitmapData;

        if(target === null) return;

        const composer = new VariableFxBitmapComposer(target);
        const bar = this._progressRenderer === null ? null : this._progressRenderer.frame.bitmapData;
        const badge = this.getCurrentBadgeRender();
        const painter = this._configPrebake.badgePainter;

        composer.clear(0);

        if(bar !== null) composer.drawLayer(bar, this.progressX, this.progressY, 'normal', 255);

        if(badge !== null && painter !== null) painter.drawBadge(composer, badge, this.levelText, 0, 0);
    }

    /** Rebuilt only when the digit count or the colour moves — not every frame. */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::getCurrentBadgeRender()
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

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::disposeCurrentBadgeRender()
    private disposeCurrentBadgeRender(): void
    {
        const painter = this._configPrebake === null ? null : this._configPrebake.badgePainter;

        if(painter !== null) painter.disposeBadgeRender(this._badgeRender);

        this._badgeRender = null;
        this._badgeRenderKey = '';
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::createRenderedSignature()
    private createRenderedSignature(): string
    {
        return `${this.frameWidth}x${this.frameHeight}:${this._levelProgress.displayedLevel}:${this.displayedFrameArgb}`;
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::hasRenderChange()
    private hasRenderChange(): boolean
    {
        return this._frame.bitmapData === null
            || this._frame.width !== this.frameWidth
            || this._frame.height !== this.frameHeight
            || this.createRenderedSignature() !== this._renderedSignature;
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::isConfigPrebakeDisposed()
    private isConfigPrebakeDisposed(): boolean
    {
        return this._configPrebake === null || this._configPrebake.disposed;
    }

    /**
     * Resolves the nested bar, or gives up quietly.
     *
     * Four ways to end with no bar, all of them intentional: the config names no `sub_renderer`,
     * the id maps to no known renderer, the id maps to THIS renderer (which would recurse), or the
     * registry has no factory for it. A badge with no bar is a valid render; a stack overflow is
     * not.
     */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::initializeProgressRenderer()
    private initializeProgressRenderer(context: Context): void
    {
        const subRendererId = LevelWithProgressRenderer.resolveSubRendererId(context);

        if(subRendererId === null) return;

        const renderer = resolveVariableFxRendererById(subRendererId);

        if(renderer === null || renderer === context.config.renderer) return;

        const factory = LevelWithProgressRenderer.resolveSubRendererFactory(context, subRendererId, renderer);

        if(factory === null) return;

        this._progressRendererConfig = this._configPrebake.getOrCreateProgressRendererConfig(
            () => LevelWithProgressRenderer.createProgressRendererConfig(context, subRendererId, renderer)
        );
        this._progressRenderer = factory(this.createProgressRendererContext(context));
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::updateProgressRendererData()
    private updateProgressRendererData(context: Context, time: number): void
    {
        if(this._progressRenderer !== null)
        {
            this._progressRenderer.updateData(this.createProgressRendererContext(context), time);
        }
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::resolveSubRendererId()
    private static resolveSubRendererId(context: Context): number | null
    {
        const raw = VariableFxPaintColor.readExtra(context.config.extra, 'sub_renderer');

        if(raw === null || raw.length === 0) return null;

        const parsed = Number(raw);

        return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
    }

    /** By server id first, then by category and style — the id is the newer, narrower key. */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::resolveSubRendererFactory()
    private static resolveSubRendererFactory(context: Context, rendererId: number, renderer: string)
    {
        const registry = context.registry;

        if(registry === null) return null;

        return registry.resolveByServerRenderer(rendererId) ?? registry.resolve('progress_bar', renderer);
    }

    /**
     * The bar's own config: its range is 0..1 because it is fed a FRACTION, not the level's value.
     *
     * `DYNAMIC_LEVELLING` becomes `DYNAMIC_DELEGATED` on the way down — the badge is the thing that
     * knows the level, so it resolves the levelling colour itself and hands the bar the result.
     */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::createProgressRendererConfig()
    private static createProgressRendererConfig(
        context: Context,
        rendererId: number,
        renderer: string
    ): VariableFxConfigData
    {
        const color = context.config.color === VariableFxPaintColor.DYNAMIC_LEVELLING
            ? VariableFxPaintColor.DYNAMIC_DELEGATED
            : context.config.color;

        return new VariableFxConfigData(
            'progress_bar', renderer, renderer, context.config.width, color, 0, 1,
            context.config.extra, context.config.categoryId, context.config.styleId, rendererId
        );
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::createProgressRendererContext()
    private createProgressRendererContext(context: Context): VariableFxRendererContext
    {
        const progress = this._levelProgress.displayedProgress;
        const config = this._progressRendererConfig;

        return new VariableFxRendererContext(
            context.assetProvider,
            config === null ? context.config : config,
            new VariableFxStatusData(progress, null, null, this.createProgressRendererStatusExtra(config), true),
            0, 1, progress, context.registry
        );
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::disposeProgressRenderer()
    private disposeProgressRenderer(): void
    {
        if(this._progressRenderer !== null)
        {
            this._progressRenderer.dispose();
            this._progressRenderer = null;
        }

        this._progressRendererConfig = null;
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::updateLevelProgressTarget()
    private updateLevelProgressTarget(context: Context, time: number): void
    {
        const sample = LevelWithProgressRenderer.resolveLevelProgressSample(context);

        // An initialize is a whole-room sync, not a level-up: snap, do not animate.
        if(!this._initialized || context.status.isInitialize)
        {
            this._levelProgress.snapTo(sample, time);
            this._initialized = true;

            return;
        }

        this._levelProgress.setTarget(sample, time);
    }

    /**
     * DEVIATION: AS3 calls `.toLowerCase()` straight on `readExtra(..., "is_maxed")`, which is a
     *   #1009 whenever the status carries no `is_maxed` — every status that is not a level, and
     *   every level status before the server sends one. Guarded here: the faithful version takes
     *   the whole room's render down on a field the server is free to omit.
     * AS3: .../renderers/level/LevelWithProgressRenderer.as::resolveLevelProgressSample()
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

    /**
     * The status the paint colour is resolved against, with `current_level` replaced by the
     * DISPLAYED one — so a levelling colour interpolates with the badge rather than jumping when
     * the server's level lands.
     */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::createDisplayedLevelStatusExtra()
    private createDisplayedLevelStatusExtra(): OrderedMap
    {
        const extra = new OrderedMap();
        const statusExtra = this._context.status.extra;
        const maxLevel = VariableFxPaintColor.readExtra(statusExtra, 'max_level');
        const isMaxed = VariableFxPaintColor.readExtra(statusExtra, 'is_maxed');

        // AS3 stores these even when null, and reading a null-valued key back gives null — so a
        // key that is simply absent is indistinguishable to every consumer. Not adding it keeps
        // that and avoids introducing an empty string, which `parseExtraNumber` would NOT treat
        // the same way as an absent value.
        if(maxLevel !== null) extra.add('max_level', maxLevel);

        if(isMaxed !== null) extra.add('is_maxed', isMaxed);

        extra.add('current_level', String(this._levelProgress.displayedLevel));

        const delegated = VariableFxPaintColor.readExtra(statusExtra, 'delegated_color');

        if(delegated !== null) extra.add('delegated_color', delegated);

        return extra;
    }

    /** Hands the bar a colour when it asked to be told one, and passes a team colour through. */
    // AS3: .../renderers/level/LevelWithProgressRenderer.as::createProgressRendererStatusExtra()
    private createProgressRendererStatusExtra(config: VariableFxConfigData | null): OrderedMap
    {
        const extra = new OrderedMap();

        if(config === null || config.color !== VariableFxPaintColor.DYNAMIC_DELEGATED)
        {
            const delegated = config !== null && config.color === VariableFxPaintColor.DYNAMIC_TEAM_COLOR
                ? VariableFxPaintColor.readExtra(this._context.status.extra, 'delegated_color')
                : null;

            if(delegated !== null) extra.add('delegated_color', delegated);

            return extra;
        }

        extra.add('delegated_color', LevelWithProgressRenderer.formatRgbHex(this.displayedFrameArgb & 0xFFFFFF));

        return extra;
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::formatRgbHex()
    private static formatRgbHex(rgb: number): string
    {
        return `#${(rgb & 0xFFFFFF).toString(16).padStart(6, '0')}`;
    }

    // AS3: .../renderers/level/LevelWithProgressRenderer.as::dispose()
    dispose(): void
    {
        this.disposeCurrentBadgeRender();
        this.disposeProgressRenderer();
        this._frame.disposeBitmap();
    }
}
