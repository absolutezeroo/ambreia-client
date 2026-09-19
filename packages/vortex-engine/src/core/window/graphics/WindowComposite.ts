import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IWindowContainer} from '../IWindowContainer';
import type {IGraphicContext} from './IGraphicContext';
import {applyInnerGlows, windowFiltersToCss, windowInnerGlowFilters} from './WindowFilterCss';
import {WindowType} from '../enum/WindowType';
import {WindowParam} from '../enum/WindowParam';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('core.window.WindowComposite');

type DrawBufferResolver = (window: IWindow) => OffscreenCanvas | null;

/** An absolute-coordinate clip rectangle threaded down the composite walk. */
type ClipRect = { left: number; top: number; right: number; bottom: number };

/**
 * A window held back to be composited above its context owner's bitmap, with the coordinates and
 * clip it would have been drawn at.
 *
 * See `compositeWindow()`: AS3 layers by graphic-context ownership, not by tree order alone, and
 * an own-context window rises to its nearest context-owning ancestor rather than to its parent.
 */
type DeferredComposite = {
    window: IWindow;
    offsetX: number;
    offsetY: number;
    clip: ClipRect | null;
    visibleRegion: ClipRect | null;
    /** The cascaded context alpha in force where this window was held back. */
    alpha: number;
};

/**
 * Canvas composition and hit-test adapter for the web runtime.
 *
 * This class is not part of AS3 WindowRenderer itself; it contains the
 * bridge logic needed by the DOM canvas shell.
 *
 * This class draws no window content. Every renderer AS3 declares — skin,
 * bitmap, text, label — runs in the render stage, where `WindowRendererItem`
 * resolves it through `SkinContainer.getSkinRendererByTypeAndStyle()` and hands
 * it the window's own buffer, exactly as AS3 does. What is left here is what
 * Flash got from its display list for free and Canvas2D does not: walking the
 * tree, blitting each buffer at its absolute position, applying per-window blend
 * and the dynamic-style colour transform, and hit-testing.
 */
export class WindowComposite
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::COLOR_TRANSFORM
    // ColorTransform(0.25,0.25,0.25) multiplies R/G/B by 0.25 and leaves alpha
    // untouched — exactly what the CSS brightness() filter does, so no
    // approximation is needed here (unlike buildColorTransformFilter() below,
    // which combines multipliers/offsets/alpha and can't map 1:1 to filters).
    private static readonly MODAL_DARKEN_FILTER: string = 'brightness(25%)';

    /**
     * Flash blend modes mapped onto their Canvas2D `globalCompositeOperation` equivalents.
     *
     * Flash's names line up with the CSS compositing spec for every mode both support. The ones
     * absent here — `subtract`, `invert`, `alpha`, `erase`, `layer`, `shader` — have no Canvas2D
     * counterpart at all.
     */
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::render()
    private static readonly BLEND_MODES: Readonly<Record<string, GlobalCompositeOperation>> = {
        normal: 'source-over',
        add: 'lighter',
        multiply: 'multiply',
        screen: 'screen',
        overlay: 'overlay',
        darken: 'darken',
        lighten: 'lighten',
        difference: 'difference',
        hardlight: 'hard-light'
    };

    /**
     * The blend mode a `BLEND_*` tag asks for, as a Canvas2D composite operation.
     *
     * AS3 scans every tag and keeps the last one starting with `BLEND_`, lowercasing the remainder
     * and handing it to `BitmapData.draw()`. A mode Canvas2D cannot express is reported and falls
     * back to normal — `warn`, because the window then renders differently from what the layout
     * asked for while throwing nothing.
     */
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::render()
    private static blendModeOf(window: IWindow): GlobalCompositeOperation
    {
        const tags = window.tags;

        if(!tags) return 'source-over';

        let mode = 'normal';

        for(const tag of tags)
        {
            if(tag.indexOf('BLEND_') === 0) mode = tag.substring(6).toLowerCase();
        }

        if(mode === 'normal') return 'source-over';

        const resolved = WindowComposite.BLEND_MODES[mode];

        if(!resolved)
        {
            if(!WindowComposite.WARNED_BLEND_MODES.has(mode))
            {
                WindowComposite.WARNED_BLEND_MODES.add(mode);
                log.warn(`Flash blend mode '${mode}' has no Canvas2D equivalent; drawing normally`);
            }

            return 'source-over';
        }

        return resolved;
    }

    // TS-only: the warning above is per-window-per-frame without it, which is thousands a second.
    private static readonly WARNED_BLEND_MODES: Set<string> = new Set<string>();

    // TS-only: distinguishes a plain pre-rendered bitmap (drawable straight
    // into the composite) from an externally-managed PixiJS DisplayObject
    // (needs the clearRect hole-punch instead — see compositeWindow()).
    private static isDrawableImage(value: unknown): value is CanvasImageSource
    {
        return value instanceof HTMLCanvasElement
            || value instanceof OffscreenCanvas
            || value instanceof HTMLImageElement
            || value instanceof ImageBitmap;
    }

    private _compositeBuffer: OffscreenCanvas | null = null;
    private _compositeCtx: OffscreenCanvasRenderingContext2D | null = null;
    private _drawBufferResolver: DrawBufferResolver;

    constructor(drawBufferResolver: DrawBufferResolver)
    {
        this._drawBufferResolver = drawBufferResolver;
    }

    public composite(contexts: IWindowContext[], width: number, height: number): OffscreenCanvas
    {
        if(!this._compositeBuffer || (this._compositeBuffer.width !== width) || (this._compositeBuffer.height !== height))
        {
            this._compositeBuffer = new OffscreenCanvas(width, height);
            this._compositeCtx = this._compositeBuffer.getContext('2d');
        }

        const ctx = this._compositeCtx;

        if(!ctx)
        {
            return this._compositeBuffer!;
        }

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);

        for(let i = 0; i < contexts.length; i++)
        {
            const desktop = contexts[i].getDesktopWindow();

            if(!desktop || !desktop.visible)
            {
                continue;
            }

            const container = desktop as unknown as IWindowContainer;

            if(!this.isWindowContainer(container))
            {
                continue;
            }

            for(let j = 0; j < container.numChildren; j++)
            {
                const child = container.getChildAt(j);

                if(child)
                {
                    this.compositeWindow(ctx, child, 0, 0, null);
                }
            }

            this.drawRedrawRegionOverlay(ctx, contexts[i]);
        }

        return this._compositeBuffer;
    }

    /**
     * A window's own filter list, or null.
     *
     * `IWindow` does not declare `getGraphicContext()` — it is on `WindowController` — so this
     * takes the same cast `drawRedrawRegionOverlay()` below does. `createIfMissing` is false: a
     * window with no context has no filters either, and building one to ask would allocate a
     * draw buffer per window per frame.
     */
    // TS-only: AS3 reads `window.filters` straight off the DisplayObject.
    private getWindowFilters(window: IWindow): readonly unknown[] | null
    {
        const controller = window as unknown as
            { getGraphicContext?(createIfMissing: boolean): IGraphicContext | null };

        return controller.getGraphicContext?.(false)?.filters ?? null;
    }

    /**
     * The debug overlay `GraphicContext.showRedrawRegion()` arms: a green box around the context
     * and a blue one around the dirty region inside it.
     *
     * Off unless something has called `showRedrawRegion()`, which nothing does — in AS3 either,
     * where the method has no caller in any tree. AS3 strokes into the context's own `graphics`;
     * there is no display list here, so the stroke happens at composite time instead, which is
     * the only place that has a canvas covering the whole desktop.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::showRedrawRegion()
    private drawRedrawRegionOverlay(ctx: OffscreenCanvasRenderingContext2D, context: IWindowContext): void
    {
        const desktop = context.getDesktopWindow() as unknown as
            { getGraphicContext(createIfMissing: boolean): IGraphicContext | null } | null;
        const graphicContext = desktop?.getGraphicContext(false) ?? null;
        const region = graphicContext?.redrawRegion ?? null;

        if(graphicContext == null || region === null) return;

        const bounds = graphicContext.getDrawRegion();

        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#00FF00';
        ctx.strokeRect(bounds.x + 0.5, bounds.y + 0.5, bounds.width - 1, bounds.height - 1);
        ctx.strokeStyle = '#0000FF';
        ctx.strokeRect(region.x + 0.5, region.y + 0.5, region.width - 1, region.height - 1);
        ctx.restore();
    }

    public findWindowAtPoint(contexts: IWindowContext[], x: number, y: number): IWindow | null
    {
        for(let i = contexts.length - 1; i >= 0; i--)
        {
            const desktop = contexts[i].getDesktopWindow();

            if(!desktop || !desktop.visible)
            {
                continue;
            }

            const container = desktop as unknown as IWindowContainer;

            if(!this.isWindowContainer(container))
            {
                continue;
            }

            for(let j = container.numChildren - 1; j >= 0; j--)
            {
                const child = container.getChildAt(j);

                if(!child)
                {
                    continue;
                }

                const hit = this.hitTestRecursive(child, x, y, 0, 0);

                if(hit)
                {
                    return hit;
                }
            }
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/window/utils/ModalDialog.as::dispose()
    public dispose(): void
    {
        this._compositeBuffer = null;
        this._compositeCtx = null;
    }

    /**
	 * Renders a single window (and its children) into its own scratch canvas,
	 * optionally darkened. Unlike `composite()`, this does not touch the
	 * shared `_compositeBuffer` — the returned canvas is freshly allocated and
	 * safe for the caller to own/consume (e.g. via `transferToImageBitmap()`).
	 *
	 * Used by ModalDialog to freeze a previous dialog's rendered appearance
	 * into the accumulated background snapshot when a new dialog stacks on
	 * top of it (AS3: `WindowController(param).getGraphicContext(true)`
	 * drawn with a ColorTransform onto the accumulated BitmapData).
	 */
    public renderWindowToCanvas(window: IWindow, width: number, height: number, darken: boolean = false): OffscreenCanvas
    {
        const canvas = new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
        const ctx = canvas.getContext('2d');

        if(ctx)
        {
            ctx.imageSmoothingEnabled = false;

            if(darken)
            {
                ctx.filter = WindowComposite.MODAL_DARKEN_FILTER;
            }

            this.compositeWindow(ctx, window, 0, 0, null);
        }

        return canvas;
    }

    /**
	 * Draws `source` into a freshly allocated canvas with the modal-dialog
	 * darkening filter applied.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::refresh()
	 * (`_loc1_.colorTransform(_loc1_.rect, COLOR_TRANSFORM)`)
	 */
    public darken(source: OffscreenCanvas | ImageBitmap, width: number, height: number): OffscreenCanvas
    {
        const canvas = new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
        const ctx = canvas.getContext('2d');

        if(ctx)
        {
            ctx.imageSmoothingEnabled = false;
            ctx.filter = WindowComposite.MODAL_DARKEN_FILTER;
            ctx.drawImage(source, 0, 0);
        }

        return canvas;
    }

    private getDrawBufferForRenderable(window: IWindow): OffscreenCanvas | null
    {
        return this._drawBufferResolver(window);
    }

    private isWindowContainer(target: unknown): target is IWindowContainer
    {
        return !!target
            && (typeof (target as IWindowContainer).numChildren === 'number')
            && (typeof (target as IWindowContainer).getChildAt === 'function');
    }

    private compositeWindow(
        ctx: OffscreenCanvasRenderingContext2D,
        window: IWindow,
        offsetX: number,
        offsetY: number,
        inheritedClip: ClipRect | null,
        inheritedVisibleRegion: ClipRect | null = null,
        deferred: DeferredComposite[] | null = null,
        inheritedAlpha: number = 1
    ): void
    {
        if(!window.visible) return;

        const absX = offsetX + window.x + window.offsetX;
        const absY = offsetY + window.y + window.offsetY;
        const w = window.width;
        const h = window.height;

        if(w <= 0 || h <= 0) return;

        // Resolve the clip this window imposes on itself and its children.
        //
        // AS3 does not clip a window against every ancestor: WindowRenderer's
        // childRectToClippedDrawRegion() walks up only through windows that share
        // their parent's graphic context (USE_PARENT_GRAPHIC_CONTEXT, param 0x10) and
        // stops at the first window that owns its own context — that window's buffer
        // is a fresh clip origin, and its ancestors clip the buffer as a whole, not
        // its individual descendants (and only when FORCE_CLIPPING is set). A cascaded
        // ctx.clip() at every clipping ancestor is therefore too aggressive: it was
        // cutting the 1px bottom border off buttons that sit flush against an
        // own-context list's edge, because outer panels (furni/contentArea) clipped a
        // pixel their own-context descendant list did not.
        //
        // So an own-context window (no 0x10) without FORCE_CLIPPING resets the base to
        // null, discarding ancestor clips; everything else keeps intersecting.
        const usesParentContext = window.testParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT);
        const forceClipping = window.testParamFlag(WindowParam.FORCE_CLIPPING);
        const base: ClipRect | null = (!usesParentContext && !forceClipping) ? null : inheritedClip;

        /**
         * Discarding the ancestor clip above is only half of what AS3 does with such a window.
         * `WindowRenderer.renderWindowBranch()` also narrows a `visibleRegion` at every clipping
         * ancestor and switches a child's graphic context off outright when it falls outside —
         * `else if(!RECT.intersects(param3)) → getGraphicContext(true).visible = false`. An
         * own-context window may widen the *draw* clip past its ancestors; it may not appear
         * outside a clipping ancestor's box at all.
         *
         * Only this branch needs the gate: every other window is already clipped to nothing by
         * `effectiveClip` when it lands outside, so the rendered result elsewhere is unchanged.
         *
         * Without it, collapsing a container by shrinking its height left its own-context
         * descendants on screen — how the mystery-box tracker kept its `${mysterybox.tracker.link}`
         * FAQ link visible after being minimised to 25px. That link is params 193: no
         * USE_PARENT_GRAPHIC_CONTEXT, no FORCE_CLIPPING, so the draw clip lets it straight through.
         */
        if(base === null && inheritedVisibleRegion !== null)
        {
            const outside = absX >= inheritedVisibleRegion.right
                || (absX + w) <= inheritedVisibleRegion.left
                || absY >= inheritedVisibleRegion.bottom
                || (absY + h) <= inheritedVisibleRegion.top;

            if(outside) return;
        }

        let effectiveClip: ClipRect | null = base;

        if(window.clipping)
        {
            const bounds: ClipRect = {left: absX, top: absY, right: absX + w, bottom: absY + h};

            effectiveClip = base ? this.intersectClip(base, bounds) : bounds;
        }

        // A collapsed clip means neither this window nor its children can draw.
        if(effectiveClip && (effectiveClip.right <= effectiveClip.left || effectiveClip.bottom <= effectiveClip.top))
        {
            return;
        }

        // AS3 narrows the visible region at a clipping window only (`param3 =
        // param3.intersection(param1.renderingRectangle)`), and threads it down untouched
        // otherwise. Unlike the draw clip, it is never discarded on the way down.
        const visibleRegion: ClipRect | null = window.clipping
            ? (inheritedVisibleRegion
                ? this.intersectClip(inheritedVisibleRegion, {left: absX, top: absY, right: absX + w, bottom: absY + h})
                : {left: absX, top: absY, right: absX + w, bottom: absY + h})
            : inheritedVisibleRegion;

        ctx.save();

        if(effectiveClip)
        {
            ctx.beginPath();
            ctx.rect(effectiveClip.left, effectiveClip.top, effectiveClip.right - effectiveClip.left, effectiveClip.bottom - effectiveClip.top);
            ctx.clip();
        }

        // display_object_wrapper windows (DisplayObjectWrapperController) hold no
        // bitmap content of their own by default — they exist to let an
        // externally-rendered PixiJS DisplayObject (e.g. a live room preview
        // canvas; see RoomPreviewerWidget) show through at this exact screen
        // position. A transparent *background* fill isn't enough for that:
        // fillRect with alpha 0 is a no-op blend, it doesn't erase whatever an
        // ancestor window already painted at these same pixels. clearRect
        // actually punches the hole through the composited buffer so the
        // separately-rendered PixiJS layer underneath is visible.
        //
        // A plain drawable (HTMLCanvasElement/ImageBitmap/etc, e.g. a static
        // avatar snapshot set via RoomPreviewerWidget.showPreview()) needs the
        // opposite treatment: it has no separate PIXI layer to show through
        // to, so punching a transparent hole here would just erase whatever
        // an ancestor already painted (e.g. the cover art behind it) without
        // anything replacing it. Draw it straight into the composite instead,
        // same as any other bitmap window.
        //
        // An *empty* wrapper is the third case and must paint nothing at all. AS3 gives it a
        // GC_TYPE_CONTAINER — an empty Sprite — which has no skin buffer, so `WindowRendererItem`
        // blits nothing and the parent's pixels stay put. Clearing there erases whatever the
        // window already painted underneath: `camera_editor_xml` stacks `save_click_catcher` and
        // `purchase_display_object`, both pure click catchers with no display object, exactly on
        // top of `save_button` and `purchase_button`, and both buttons came out as black holes
        // punched through to the page background.
        if(window.type === WindowType.DISPLAY_OBJECT_WRAPPER)
        {
            const displayObject = (window as unknown as {getDisplayObject?: () => unknown}).getDisplayObject?.();

            if(WindowComposite.isDrawableImage(displayObject))
            {
                ctx.drawImage(displayObject, absX, absY);
            }
            else if(displayObject !== null && displayObject !== undefined)
            {
                ctx.clearRect(absX, absY, w, h);
            }
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRendererItem.as::MATRIX
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRendererItem.as::COLOR_TRANSFORM
        // AS3 blits its skin buffer onto the parent BitmapData via
        // `param5.draw(_SafeStr_4797, MATRIX, COLOR_TRANSFORM, blendMode, param3, false)`,
        // with MATRIX carrying the draw offset and COLOR_TRANSFORM.alphaMultiplier
        // carrying window.blend, only when blend<1 or a BLEND_* tag is set (otherwise
        // it takes the cheaper `copyPixels()` path). Canvas 2D has no matching
        // "draw with alpha + offset" primitive; ctx.drawImage(buffer, absX, absY)
        // below already carries the offset MATRIX.tx/ty applied, so only the alpha
        // half needs reproducing here, via globalAlpha before that same drawImage call.
        // Apply blend (opacity)
        //
        // `inheritedAlpha` is the one property of the window system that genuinely cascades.
        // `GraphicContext.set blend` writes `this.alpha` on the context *Sprite*, and a Sprite's
        // alpha covers its child container — so an own-context window's blend also dims every
        // own-context descendant. AS3 never puts a shared-context window's blend on a context at
        // all (`WindowRendererItem.invalidate()` case 16 returns before the assignment for one), so
        // that half stays confined to its own blit; see `childAlpha` below.
        //
        // Neither `filters` nor the dynamic-style `colorTransform` cascades, in AS3 either: both go
        // on `getDisplayObject()`, the Bitmap alone. Measured over the 783 shipped layouts, 54
        // windows have blend<1 with real children and 52 carry param 16, so this reaches two —
        // `own_avatar_decorating` and `room_tools_toolbar_xml`.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::set blend()
        const blend = inheritedAlpha * window.blend;

        if(blend < 1)
        {
            ctx.globalAlpha = blend;
        }

        // The other half of that same `param5.draw()` call: its `blendMode` argument, which AS3
        // reads off a `BLEND_*` tag. 14 shipped layouts declare one and the port has been dropping
        // all of them — 8 `BLEND_ADD`, plus 3 `BLEND_SUBTRACT` and 3 `BLEND_INVERT` that Canvas2D
        // cannot express and `blendModeOf()` reports rather than fake.
        // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::render()
        const blendMode = WindowComposite.blendModeOf(window);

        if(blendMode !== 'source-over')
        {
            ctx.globalCompositeOperation = blendMode;
        }

        // Bitmap wrappers apply the colour/dynamic-style transform exactly inside
        // BitmapDataRenderer.draw(); the CSS-filter approximation must not also run
        // for them, or the transform would be applied twice.
        const isBitmapWrapper = window.type === WindowType.BITMAP_WRAPPER || window.type === WindowType.STATIC_BITMAP_WRAPPER;

        // Apply dynamic style color transform as a CSS brightness/opacity filter.
        // In AS3 this was BitmapData.colorTransform() applied to each window's buffer.
        // Canvas 2D has no direct colorTransform API so we approximate with filters.
        //
        // Bitmap wrappers are excluded because BitmapDataRenderer already applied
        // the exact transform, per-pixel, when it filled the buffer this is about
        // to blit — running the approximation over it would apply it twice.
        const ctFilter = isBitmapWrapper ? '' : this.buildColorTransformFilter(window.dynamicStyleColor);

        // The window's own Flash filter list, which 225 shipped layouts declare and nothing has
        // ever rendered: WindowController.filters writes them onto the graphic context and this
        // was the only place that could read them back. Concatenated with the colour transform
        // because ctx.filter takes one string and applies the whole chain left to right — the
        // same order Flash composites them in.
        // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter()
        const windowFilter = windowFiltersToCss(this.getWindowFilters(window));
        const combined = [ctFilter, windowFilter].filter(part => part.length > 0).join(' ');

        if(combined)
        {
            ctx.filter = combined;
        }

        // Draw background fill if the window has one
        if(window.background)
        {
            const color = window.color;
            const a = ((color >>> 24) & 0xFF) / 255;
            const r = (color >> 16) & 0xFF;
            const g = (color >> 8) & 0xFF;
            const b = color & 0xFF;

            ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
            ctx.fillRect(absX, absY, w, h);
        }

        // Draw the window's own content. Every renderer AS3 declares now runs in
        // the render stage, into this buffer — skin, bitmap, text and label alike
        // (see the class note). Compositing it is all that is left to do here.
        const buffer = this.getDrawBufferForRenderable(window);

        if(buffer && buffer.width > 0 && buffer.height > 0)
        {
            // An inner glow is not expressible as a filter string — `ctx.filter` has no inset
            // shadow — so it is burned into a copy of the buffer instead, clipped to the buffer's
            // own alpha. `applyInnerGlows()` returns the buffer untouched when there is none,
            // which is every window bar a rare-badge widget mid-glow.
            // AS3: .../src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::createInnerGlowFilter()
            const glows = windowInnerGlowFilters(this.getWindowFilters(window));

            ctx.drawImage(applyInnerGlows(buffer, glows), absX, absY);
        }

        // Tear down this window's clip, blend and filter before descending. AS3 treats
        // both blend and the colour transform as per-window, not cascading — WindowUtils.
        // disableSection() dims a section by walking every child explicitly rather than
        // relying on a parent alpha, so nothing set here may leak onto a child (this is
        // the fix for chat-style previews rendering dark under a translucent ancestor).
        // The clip is not inherited through the context either; it is threaded to
        // children as `effectiveClip`, so each re-applies it from a clean context and an
        // own-context child can legitimately widen it past its ancestors.
        ctx.restore();

        // Does this window own a graphic context? AS3's `hasGraphicsContext()` is
        // `_context != null || !testParamFlag(16)`, so anything without USE_PARENT_GRAPHIC_CONTEXT
        // does — and a context is a display container whose `setDisplayObject()` inserts the
        // rendered bitmap at index 0, leaving every own-context descendant above it.
        const ownsContext = !window.testParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT);
        const ownDeferred: DeferredComposite[] = [];
        const collector = ownsContext ? ownDeferred : deferred;

        // Only an own-context window hands its blend down — that is the one AS3 puts on the context
        // Sprite, whose alpha covers the child container. A shared-context window's blend lives in
        // its own blit, so its children inherit whatever the last context owner above them set.
        const childAlpha = ownsContext ? blend : inheritedAlpha;

        const container = window as unknown as IWindowContainer;

        if(typeof container.numChildren === 'number')
        {
            // Layering follows GRAPHIC-CONTEXT ownership, not tree order alone.
            //
            // AS3 does not composite a window tree flatly. `hasGraphicsContext()` is
            // `_context != null || !testParamFlag(16)`, so a child WITHOUT
            // USE_PARENT_GRAPHIC_CONTEXT owns a graphic context of its own, and a context is a
            // Flash display container whose `setDisplayObject()` puts the rendered bitmap at
            // **index 0**. Everything rendered into that bitmap — the window's own content and
            // every `param 16` descendant — is therefore BELOW every own-context descendant,
            // whatever order they were declared in.
            //
            // Composited flatly, a `param 16` sibling declared later wins instead. That is what
            // hid the toolbar's collapse arrow: the unnamed `<border x="-6" style="2">` is the
            // bar's left end cap, `param 16`, and the LAST child of `main_toolbar`; the arrow's
            // region `collapse_left` is `param 1`, owns a context, and is declared before it. AS3
            // draws the cap into the bar's bitmap and the arrow above it. This drew the cap last,
            // over an arrow whose own render buffer had the chevron in it all along.
            //
            // The deferral is to the nearest context-OWNING ancestor, not to the immediate parent:
            // `collapse_left` is a grandchild of `main_toolbar`, and holding it back only within
            // `arrow_container_left` still leaves it inside that container's own turn — ahead of
            // the cap, which is `main_toolbar`'s last child. It has to rise all the way to
            // `main_toolbar`, which is what owning a graphic context means in AS3.
            for(let i = 0; i < container.numChildren; i++)
            {
                const child = container.getChildAt(i);

                if(!child) continue;

                if(collector !== null && !child.testParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT))
                {
                    collector.push({
                        window: child, offsetX: absX, offsetY: absY, clip: effectiveClip, visibleRegion,
                        alpha: childAlpha
                    });

                    continue;
                }

                this.compositeWindow(ctx, child, absX, absY, effectiveClip, visibleRegion, collector, childAlpha);
            }
        }

        // This window owns the context, so everything held back above belongs on top of the bitmap
        // just drawn. Each entry owns a context of its own, so compositing it starts a fresh
        // collector and the same rule applies one level down.
        if(ownsContext)
        {
            for(const entry of ownDeferred)
            {
                this.compositeWindow(
                    ctx, entry.window, entry.offsetX, entry.offsetY, entry.clip, entry.visibleRegion, null,
                    entry.alpha
                );
            }
        }
    }

    /** Intersection of two absolute-coordinate clip rectangles. */
    private intersectClip(a: ClipRect, b: ClipRect): ClipRect
    {
        return {
            left: Math.max(a.left, b.left),
            top: Math.max(a.top, b.top),
            right: Math.min(a.right, b.right),
            bottom: Math.min(a.bottom, b.bottom)
        };
    }

    /**
	 * Converts a DynamicStyle color transform to a CSS filter string.
	 *
	 * In AS3, colorTransform was applied directly to BitmapData pixels.
	 * Canvas 2D approximates this with brightness() and opacity() filters.
	 * Returns an empty string when the transform is identity (no-op).
	 *
	 * @see sources/win63_version/core/window/dynamicstyle/DynamicStyle.as getColorTransform()
	 */
    private buildColorTransformFilter(ct: IWindow['dynamicStyleColor']): string
    {
        if(!ct) return '';

        const { redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier,
            redOffset, greenOffset, blueOffset } = ct;

        const isIdentity =
            redMultiplier === 1 && greenMultiplier === 1 && blueMultiplier === 1
			&& alphaMultiplier === 1 && redOffset === 0 && greenOffset === 0 && blueOffset === 0;

        if(isIdentity) return '';

        const parts: string[] = [];

        // Average RGB multipliers → brightness
        const brightness = (redMultiplier + greenMultiplier + blueMultiplier) / 3;

        if(Math.abs(brightness - 1) > 0.005)
        {
            parts.push(`brightness(${(brightness * 100).toFixed(1)}%)`);
        }

        // Uniform RGB offset → additional brightness boost (offset 77 ≈ +30%)
        const offsetMag = (Math.abs(redOffset) + Math.abs(greenOffset) + Math.abs(blueOffset)) / 3;

        if(offsetMag > 0)
        {
            const boost = 1 + offsetMag / 255;
            parts.push(`brightness(${(boost * 100).toFixed(1)}%)`);
        }

        if(alphaMultiplier !== 1)
        {
            parts.push(`opacity(${(alphaMultiplier * 100).toFixed(1)}%)`);
        }

        return parts.join(' ');
    }

    /**
	 * Recursively hit-tests a window tree.
	 *
	 * Returns the deepest window that has INPUT_EVENT_PROCESSOR (param flag 1).
	 * Child windows without this flag (e.g. static bitmaps with param 208) are
	 * tested for bounds but not returned as targets — their parent region is
	 * returned instead. This mirrors AS3's event routing where mouse events
	 * target the INPUT_EVENT_PROCESSOR container, not its passive children.
	 *
	 * @param window - The window to test
	 * @param globalX - The global X coordinate
	 * @param globalY - The global Y coordinate
	 * @param offsetX - The parent's absolute X offset
	 * @param offsetY - The parent's absolute Y offset
	 * @returns The deepest INPUT_EVENT_PROCESSOR window at the point, or null
	 */
    private hitTestRecursive(
        window: IWindow,
        globalX: number,
        globalY: number,
        offsetX: number,
        offsetY: number
    ): IWindow | null
    {
        if(!window.visible) return null;

        // FLAG 9 = INTERNAL_EVENT_HANDLING → ignore mouse events
        if(window.testParamFlag(9))
        {
            return null;
        }

        const absX = offsetX + window.x;
        const absY = offsetY + window.y;
        const w = window.width;
        const h = window.height;

        // AABB bounds test
        if(globalX < absX || globalX >= absX + w || globalY < absY || globalY >= absY + h)
        {
            return null;
        }

        // Test children in reverse (topmost first)
        const container = window as unknown as IWindowContainer;

        if(typeof container.numChildren === 'number')
        {
            for(let i = container.numChildren - 1; i >= 0; i--)
            {
                const child = container.getChildAt(i);

                if(!child) continue;

                const hit = this.hitTestRecursive(child, globalX, globalY, absX, absY);

                if(hit) return hit;
            }
        }

        // Only return this window as a hit target if it is an INPUT_EVENT_PROCESSOR
        if(window.testParamFlag(1))
        {
            return window;
        }

        return null;
    }
}
