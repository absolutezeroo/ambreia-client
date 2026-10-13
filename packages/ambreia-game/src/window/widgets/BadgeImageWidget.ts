import type {IBadgeImageWidget} from '@ambreia/ui/kit/widgets/IBadgeImageWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IRegionWindow} from '@ambreia/ui/components/IRegionWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import {BadgeImageType} from '@ambreia/ui/kit/enum/BadgeImageType';

/**
 * Badge image rendering widget.
 *
 * Renders a badge image (normal, group, or perk) from a badge identifier.
 *
 * Everything the layout writes under the `badge_image:` namespace other than `type` and
 * `badge_id` is forwarded, namespace stripped, to the bitmap inside the widget — that is
 * how `badge_image:pivot_point`, `badge_image:stretched_x` and the rest reach it.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as
 */
export class BadgeImageWidget implements IBadgeImageWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::TYPE
    public static readonly TYPE: string = 'badge_image';

    // Derived name: the constant is obfuscated in every tree (`_Str_13540` in the
    // otherwise unobfuscated 2016 one), so `TYPE_KEY` is this port's name for it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::TYPE_KEY
    private static readonly TYPE_KEY: string = 'badge_image:type';
    // Derived name: same as `TYPE_KEY` above — obfuscated in every tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::BADGE_ID_KEY
    private static readonly BADGE_ID_KEY: string = 'badge_image:badge_id';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::NO_GLOW_COLOR
    private static readonly NO_GLOW_COLOR: number = -1;

    // Derived name: obfuscated in every tree, like the two keys above.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::TYPE_DEFAULT
    private static readonly TYPE_DEFAULT: PropertyStruct =
        new PropertyStruct(BadgeImageWidget.TYPE_KEY, BadgeImageType.NORMAL, PropertyStruct.STRING, false, BadgeImageType.ALL);

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::ID_DEFAULT
    private static readonly ID_DEFAULT: PropertyStruct =
        new PropertyStruct(BadgeImageWidget.BADGE_ID_KEY, '', PropertyStruct.STRING);

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_disposed
    private _disposed: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_widgetWindow
    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_refreshing
    private _refreshing: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_root
    private _root: IWindowContainer | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_bitmap
    private _bitmap: IStaticBitmapWrapperWindow | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_region
    private _region: IRegionWindow | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_type
    private _type: string = String(BadgeImageWidget.TYPE_DEFAULT.value);
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_badgeId
    private _badgeId: string = String(BadgeImageWidget.ID_DEFAULT.value);
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_groupId
    private _groupId: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_glowColor
    private _glowColor: number = BadgeImageWidget.NO_GLOW_COLOR;

    /** One step every 16ms, which is AS3's `new Timer(16, ...)` — roughly a frame at 60Hz. */
    // AS3: .../src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::startGlowAnimation()
    private static readonly GLOW_TICK_MS: number = 16;

    // AS3: .../src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_glowTimer
    private _glowTimer: ReturnType<typeof setInterval> | null = null;

    /** The filters the window had before the glow, put back by `clearGlow()`. */
    // AS3: .../src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_glowRestoreFilters
    private _glowRestoreFilters: unknown[] | null = null;

    // AS3: .../src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::_glowActive
    private _glowActive: boolean = false;

    // TS-only: AS3 reads these off its Timer's `currentCount`/`repeatCount`; setInterval has
    // neither, so the count is kept here.
    private _glowTicks: number = 0;

    // TS-only: see `_glowTicks`.
    private _glowTotalTicks: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::BadgeImageWidget()
    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('badge_image_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;
            this._bitmap = root.findChildByName('bitmap') as IStaticBitmapWrapperWindow | null;
            this._region = root.findChildByName('region') as IRegionWindow | null;

            this._widgetWindow.rootWindow = root;
            root.width = this._widgetWindow.width;
            root.height = this._widgetWindow.height;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        const props: PropertyStruct[] = [];

        if(this._disposed) return props;

        props.push(BadgeImageWidget.TYPE_DEFAULT.withValue(this._type));
        props.push(BadgeImageWidget.ID_DEFAULT.withValue(this._badgeId));

        for(const prop of (this._bitmap?.properties ?? []) as PropertyStruct[])
        {
            if(prop.key !== 'asset_uri') props.push(prop.withNameSpace('badge_image'));
        }

        return props;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        this._refreshing = true;

        const forwarded: PropertyStruct[] = [];

        for(const prop of values)
        {
            switch(prop.key)
            {
                case BadgeImageWidget.TYPE_KEY:
                    this.type = String(prop.value);
                    break;
                case BadgeImageWidget.BADGE_ID_KEY:
                    this.badgeId = String(prop.value);
                    break;
            }

            // The widget owns the asset URI — the bitmap must never be handed one from a
            // layout, or the badge would draw whatever the layout named instead.
            if(prop.key !== 'badge_image:asset_uri') forwarded.push(prop.withoutNameSpace());
        }

        if(this._bitmap) this._bitmap.properties = forwarded;

        this._refreshing = false;
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get type()
    public get type(): string
    {
        return this._type;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set type()
    public set type(value: string)
    {
        this._type = value;
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get badgeId()
    public get badgeId(): string
    {
        return this._badgeId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set badgeId()
    public set badgeId(value: string)
    {
        if(this._badgeId !== value)
        {
            this.clearGlow();
            this._glowColor = BadgeImageWidget.NO_GLOW_COLOR;
        }

        this._badgeId = value;
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get groupId()
    public get groupId(): number
    {
        return this._groupId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set groupId()
    public set groupId(value: number)
    {
        this._groupId = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get glowColor()
    public get glowColor(): number
    {
        return this._glowColor;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set glowColor()
    public set glowColor(value: number)
    {
        this._glowColor = value;

        // AS3 also tests `_glowing || _pendingGlowAssetUri != null` here; both are always
        // false while `playGlow()` is the stub below, so the branch cannot fire yet.
        if(this._glowColor < 0) this.clearGlow();
    }

    /**
	 * Plays the one-shot glow animation over the badge.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::playGlow()
    /**
     * DEVIATION: AS3 pre-fetches the badge asset through `resourceManager.retrieveAsset()` behind
     *   a 5s timeout timer and starts the animation from `receiveAsset()`. The bitmap this widget
     *   glows is already resolved by the time anything calls `playGlow()` — `assetUri` is set and
     *   the image is in the library — so the fetch, its timeout and `receiveAsset()` collapse
     *   into starting the animation here. `cancelPendingGlow()` goes with them.
     *
     * All three of AS3's filters render. The inner one used to be skipped on the grounds that
     * Canvas2D has no inset shadow, which is true of `ctx.filter` and not of Canvas2D: an inner
     * glow is the blurred *inverse* of the shape's own alpha, painted in the glow colour and
     * clipped to the shape, which is two composite operations. `applyInnerGlows()` in
     * `WindowFilterCss.ts` does it, and `WindowComposite` runs it on the window's buffer before
     * the blit.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::playGlow()
    public playGlow(color: number, durationMs: number = 500, _scale: number = 1.04): void
    {
        if(this._disposed || this._bitmap === null || this._widgetWindow === null) return;

        this._glowColor = color & 0xFFFFFF;

        this.clearGlow();
        this.startGlowAnimation(this._glowColor, durationMs > 0 ? durationMs : 1000);
    }

    /**
     * Ramps the glow from nothing to full over `durationMs`, one step every 16ms.
     *
     * The filters the widget already had are snapshotted first and put back by `clearGlow()`,
     * which is what makes the glow additive rather than destructive.
     */
    // AS3: .../src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::startGlowAnimation()
    private startGlowAnimation(color: number, durationMs: number): void
    {
        const window = this._widgetWindow as unknown as {filters: unknown[]} | null;

        if(window === null) return;

        this._glowColor = color & 0xFFFFFF;
        this._glowRestoreFilters = window.filters.slice();
        this._glowActive = true;
        this._glowTicks = 0;
        this._glowTotalTicks = Math.max(1, Math.trunc(durationMs / BadgeImageWidget.GLOW_TICK_MS));

        this.applyGlowStrength(0);

        this._glowTimer = setInterval(this.onGlowTick, BadgeImageWidget.GLOW_TICK_MS);
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::onGlowTick()
    private onGlowTick = (): void =>
    {
        this._glowTicks++;

        this.applyGlowStrength(
            BadgeImageWidget.easeInOutCubic(this._glowTicks, 0, 1, this._glowTotalTicks));

        // AS3's Timer carries its own repeat count and raises `timerComplete`; setInterval has
        // no such thing, so the last tick ends the run itself.
        if(this._glowTicks >= this._glowTotalTicks) this.clearGlow();
    };

    /**
     * Writes the glow at strength `t` (0..1) onto the widget window.
     *
     * The restore list is copied first, so each step replaces the previous step's filters rather
     * than stacking on them — AS3 rebuilds the array the same way every tick.
     */
    // AS3: .../src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::applyGlowStrength()
    private applyGlowStrength(strength: number): void
    {
        const window = this._widgetWindow as unknown as {filters: unknown[]} | null;

        if(window === null) return;

        const t = Math.min(1, Math.max(0, strength));
        const filters = (this._glowRestoreFilters ?? []).slice();

        if(t > 0.001 && this._glowColor >= 0)
        {
            // AS3: createOuterGlowFilter() / createInnerGlowFilter(), coefficients and all.
            filters.push({
                type: 'GlowFilter', color: this._glowColor, alpha: 0.7 * t,
                blurX: 4 + t * 4, blurY: 4 + t * 4, strength: 1 + t * 1.2, inner: false
            });
            filters.push({
                type: 'GlowFilter', color: this._glowColor, alpha: 0.22 * t,
                blurX: 2 + t * 2, blurY: 2 + t * 2, strength: 0.8 + t * 0.6, inner: true
            });
        }

        window.filters = filters;
        this.refresh();
    }

    /**
     * AS3's easing for the ramp: slow at both ends, fastest in the middle.
     */
    // AS3: .../src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::easeInOutCubic()
    private static easeInOutCubic(time: number, start: number, change: number, duration: number): number
    {
        let t = time / (duration / 2);

        if(t < 1) return (change / 2) * t * t * t + start;

        t -= 2;

        return (change / 2) * (t * t * t + 2) + start;
    }

    /**
	 * Stops the glow animation and restores the filters the widget had before it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::clearGlow()
    public clearGlow(): void
    {
        if(this._glowTimer !== null)
        {
            clearInterval(this._glowTimer);
            this._glowTimer = null;
        }

        // AS3 returns here when no glow is running, so a stray clearGlow() cannot wipe the
        // filters a layout put on the window.
        if(!this._glowActive) return;

        const window = this._widgetWindow as unknown as {filters: unknown[]} | null;

        if(window !== null) window.filters = this._glowRestoreFilters ?? [];

        this.refresh();
        this._glowActive = false;
        this._glowRestoreFilters = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::refresh()
    // Public: ProductIconWidget calls (badgeImageWidget.widget as BadgeImageWidget).refresh()
    // directly after changing blend, matching AS3's external call into this method.
    public refresh(): void
    {
        if(this._refreshing) return;

        const bitmap = this._bitmap;

        if(!bitmap) return;

        bitmap.assetUri = this.assetUri;
        bitmap.blend = this._widgetWindow?.blend ?? 0;
        bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get assetUri()
    private get assetUri(): string
    {
        if(!this._badgeId || this._badgeId.length === 0) return '';

        switch(this._type)
        {
            case BadgeImageType.NORMAL:
                // Both crypted trees (WIN63-202607011411 and win63_version) say ".png" here,
                // but the unobfuscated 2016 PRODUCTION tree says ".gif", and real badge
                // assets are gifs (confirmed empirically) - the crypted decompiler corrupted
                // this literal in both trees. Using the real extension, not the crypted one.
                return '${image.library.url}album1584/' + this._badgeId + '.gif';
            case BadgeImageType.GROUP: {
                // AS3: _windowManager.getProperty("group.badge.url").replace("%imagerdata%", _badgeId)
                const template = (this._windowManager as unknown as {
                    getProperty?: (k: string) => string
                }).getProperty?.('group.badge.url') ?? '';

                return template ? template.replace('%imagerdata%', this._badgeId) : this._badgeId;
            }
            case BadgeImageType.PERK:
                return '${image.library.url}perk/' + this._badgeId + '.png';
            default:
                return '';
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get bitmapData()
    public get bitmapData(): ImageBitmap | null
    {
        return this._bitmap?.bitmapData ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get pivotPoint()
    public get pivotPoint(): number
    {
        return this._bitmap?.pivotPoint ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set pivotPoint()
    public set pivotPoint(value: number)
    {
        if(!this._bitmap) return;

        this._bitmap.pivotPoint = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get stretchedX()
    public get stretchedX(): boolean
    {
        return this._bitmap?.stretchedX ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set stretchedX()
    public set stretchedX(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.stretchedX = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get stretchedY()
    public get stretchedY(): boolean
    {
        return this._bitmap?.stretchedY ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set stretchedY()
    public set stretchedY(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.stretchedY = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get zoomX()
    public get zoomX(): number
    {
        return this._bitmap?.zoomX ?? 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set zoomX()
    public set zoomX(value: number)
    {
        if(!this._bitmap) return;

        this._bitmap.zoomX = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get zoomY()
    public get zoomY(): number
    {
        return this._bitmap?.zoomY ?? 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set zoomY()
    public set zoomY(value: number)
    {
        if(!this._bitmap) return;

        this._bitmap.zoomY = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get greyscale()
    public get greyscale(): boolean
    {
        return this._bitmap?.greyscale ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set greyscale()
    public set greyscale(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.greyscale = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get etchingColor()
    public get etchingColor(): number
    {
        return this._bitmap?.etchingColor ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set etchingColor()
    public set etchingColor(value: number)
    {
        if(!this._bitmap) return;

        this._bitmap.etchingColor = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get fitSizeToContents()
    public get fitSizeToContents(): boolean
    {
        return this._bitmap?.fitSizeToContents ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set fitSizeToContents()
    public set fitSizeToContents(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.fitSizeToContents = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get etchingPoint()
    public get etchingPoint(): { x: number; y: number }
    {
        return {x: 0, y: 1};
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get wrapX()
    public get wrapX(): boolean
    {
        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set wrapX()
    // Empty in AS3: a badge never tiles.
    public set wrapX(_value: boolean)
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get wrapY()
    public get wrapY(): boolean
    {
        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set wrapY()
    // Empty in AS3: a badge never tiles.
    public set wrapY(_value: boolean)
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get flipX()
    public get flipX(): boolean
    {
        return this._bitmap?.flipX ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set flipX()
    public set flipX(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.flipX = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get flipY()
    public get flipY(): boolean
    {
        return this._bitmap?.flipY ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set flipY()
    public set flipY(value: boolean)
    {
        if(!this._bitmap) return;

        this._bitmap.flipY = value;
        this._bitmap.invalidate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::get rotation()
    public get rotation(): number
    {
        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::set rotation()
    // Empty in AS3: a badge never rotates.
    public set rotation(_value: number)
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this.clearGlow();
        this.groupId = 0;

        if(this._region)
        {
            this._region.dispose();
            this._region = null;
        }

        this._bitmap = null;

        if(this._root)
        {
            this._root.dispose();
            this._root = null;
        }

        if(this._widgetWindow)
        {
            this._widgetWindow.rootWindow = null;
            this._widgetWindow = null;
        }

        this._windowManager = null;
        this._disposed = true;
    }
}
