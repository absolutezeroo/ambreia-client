import type {IWindow} from '../../IWindow';
import {Logger} from '@ambreia/common/utils/Logger';
import {PivotPoint} from '../../enum/PivotPoint';
import {SkinRenderer} from './SkinRenderer';

const log = Logger.getLogger('core.window.graphics.renderer.BitmapDataRenderer');

/**
 * PERFORMANCE CACHE — do not remove or "simplify away".
 *
 * Holds the fully-composited output of `BitmapDataRenderer.draw()` for one
 * bitmap-wrapper window, plus every input that output depends on. Rebuilding
 * that output requires `getImageData`/`putImageData` (in `tintBitmap()` and
 * `applyGreyscale()`), which are pixel-by-pixel CPU operations — by far the
 * most expensive step in the whole window-compositing pipeline (see
 * docs/STYLEGUIDE.md "Performance"). Without this cache, the draw path
 * re-ran that pixel work for every bitmap-wrapper window on every single
 * frame where ANY window in the desktop was dirty, not just when that
 * window's own bitmap/colour actually changed.
 *
 * AS3 needs no equivalent: there, `WindowRendererItem` only calls a skin
 * renderer's `draw()` when its `_refresh` flag is set, so the renderer is
 * never asked to repeat identical work. This port still calls `draw()` from
 * `WindowComposite` on every composite pass (see that class's note on the
 * two-stage render), so the skip has to live here instead.
 *
 * If you find this entry unused after a refactor, verify the replacement
 * still skips getImageData/putImageData when nothing changed before deleting
 * this — otherwise the CPU cost regresses silently (no functional bug, no
 * test failure, just a slower client).
 */
interface IBitmapWrapperCacheEntry
{
    canvas: OffscreenCanvas;
    ctx: OffscreenCanvasRenderingContext2D;
    bmp: ImageBitmap | null;
    zoomX: number;
    zoomY: number;
    isFlippedX: boolean;
    isFlippedY: boolean;
    stretchedX: boolean;
    stretchedY: boolean;
    wrapX: boolean;
    wrapY: boolean;
    rotation: number;
    greyscale: boolean;
    pivotPoint: number;
    etchColor: number;
    w: number;
    h: number;
    color: number;
    hasDynamicStyle: boolean;
    dsRedMultiplier: number;
    dsGreenMultiplier: number;
    dsBlueMultiplier: number;
    dsAlphaMultiplier: number;
    dsRedOffset: number;
    dsGreenOffset: number;
    dsBlueOffset: number;
    dsAlphaOffset: number;
}

/**
 * Draws a bitmap-wrapper window's content: rotation, zoom/flip, stretch,
 * pivot placement, wrap/tiling, the etching silhouette, then either the
 * greyscale or the colour-multiply transform over the whole buffer.
 *
 * Ported from AS3 `BitmapDataRenderer`, which does the same work with Flash's
 * `BitmapData.draw()` + `applyFilter()`. The step order below is Flash's, and
 * the `AS3 l.NN` markers refer to lines of the source file named in `@see`.
 *
 * One deliberate deviation, kept visible rather than hidden: AS3 draws into
 * the per-window `BitmapData` that `WindowRendererItem` hands it, and the
 * graphic context composites that buffer onto the desktop afterwards. Here
 * the per-window buffer is this class's own cache canvas, and `draw()` blits
 * it to the target context itself, because `WindowComposite` — not
 * `WindowRendererItem` — currently drives this renderer. See the class note on
 * `WindowComposite` for why, and `IBitmapWrapperCacheEntry` above for what
 * that costs.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapDataRenderer.as
 */
export class BitmapDataRenderer extends SkinRenderer
{
    // See IBitmapWrapperCacheEntry doc comment above — perf-critical, keyed by
    // window identity, WeakMap so entries drop automatically once a window is
    // disposed and no longer referenced elsewhere.
    private _bitmapWrapperCache: WeakMap<IWindow, IBitmapWrapperCacheEntry> = new WeakMap();

    // Names of the global constructors drawImage() accepts, in the order the
    // spec lists CanvasImageSource. Looked up by name rather than referenced
    // directly so a missing type is a false, not a ReferenceError.
    private static readonly DRAWABLE_TYPES: readonly string[] = [
        'ImageBitmap', 'OffscreenCanvas', 'HTMLCanvasElement', 'HTMLImageElement',
        'HTMLVideoElement', 'SVGImageElement', 'VideoFrame',
    ];

    // Window names already reported by reportUndrawableBitmap(), so the warning
    // fires once per window instead of once per frame.
    private static readonly REPORTED_UNDRAWABLE: Set<string> = new Set();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapDataRenderer.as::isStateDrawable()
    public override isStateDrawable(state: number): boolean
    {
        return state === 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapDataRenderer.as::draw()
    public override draw(
        window: IWindow,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        _state: number,
        _colorize: boolean
    ): void
    {
        const absX = rect.x;
        const absY = rect.y;
        const w = rect.width;
        const h = rect.height;

        const bdc = window as unknown as {
            bitmapData?: ImageBitmap | null;
            zoomX?: number;
            zoomY?: number;
            flipX?: boolean;
            flipY?: boolean;
            stretchedX?: boolean;
            stretchedY?: boolean;
            wrapX?: boolean;
            wrapY?: boolean;
            rotation?: number;
            greyscale?: boolean;
            etchingColor?: number;
            pivotPoint?: number;
        };

        const bmp = bdc.bitmapData ?? null;

        if(!bmp) return;

        // `bitmapData` is typed `ImageBitmap | null`, but several call sites
        // assign to it through a cast (`asset.content as ImageBitmap` and
        // friends), so a non-image can reach here with the type system none the
        // wiser. Every drawImage() below then throws, and because draw() runs
        // inside HabboWindowManager's update receiver, that one bad window
        // aborts the WHOLE window-manager update — every frame, taking the rest
        // of the UI's rendering down with it. Skip the window instead, and name
        // it once so the actual assigner can be found.
        //
        // TS-only: AS3 cannot reach this state — `bitmapData` is a typed
        // `BitmapData` reference there, checked by the AVM, not a structural
        // cast.
        if(!BitmapDataRenderer.isDrawable(bmp))
        {
            BitmapDataRenderer.reportUndrawableBitmap(window, bmp);

            return;
        }

        const zoomX = bdc.zoomX ?? 1;
        const zoomY = bdc.zoomY ?? 1;
        // AS3 flips around an independent flipX/flipY flag XOR'd against the zoom
        // sign (BitmapDataRenderer.draw() l.68-69), not the zoom sign alone - a
        // negative zoom and flipX=true cancel out back to unflipped.
        const isFlippedX = (zoomX < 0) !== (bdc.flipX ?? false);
        const isFlippedY = (zoomY < 0) !== (bdc.flipY ?? false);
        const stretchedX = bdc.stretchedX ?? false;
        const stretchedY = bdc.stretchedY ?? false;
        const wrapX = bdc.wrapX ?? false;
        const wrapY = bdc.wrapY ?? false;
        const rotation = bdc.rotation ?? 0;
        const greyscale = bdc.greyscale ?? false;
        const pivotPoint = bdc.pivotPoint ?? PivotPoint.TOP_LEFT;
        const etchColor = bdc.etchingColor ?? 0;
        const etchPt = window.etchingPoint;
        const ds = window.dynamicStyleColor;

        // PERF: see IBitmapWrapperCacheEntry doc comment. Only re-run the
        // pixel-level compositing (rotate/tile/tint/greyscale) below when a
        // value it actually depends on has changed since the last frame;
        // otherwise reuse last frame's canvas as-is.
        const cached = this._bitmapWrapperCache.get(window) ?? null;
        const paramsUnchanged = cached !== null
			&& cached.bmp === bmp
			&& cached.zoomX === zoomX
			&& cached.zoomY === zoomY
			&& cached.isFlippedX === isFlippedX
			&& cached.isFlippedY === isFlippedY
			&& cached.stretchedX === stretchedX
			&& cached.stretchedY === stretchedY
			&& cached.wrapX === wrapX
			&& cached.wrapY === wrapY
			&& cached.rotation === rotation
			&& cached.greyscale === greyscale
			&& cached.pivotPoint === pivotPoint
			&& cached.etchColor === etchColor
			&& cached.w === w
			&& cached.h === h
			&& cached.color === window.color
			&& cached.hasDynamicStyle === (ds !== null)
			&& (ds === null
				|| (cached.dsRedMultiplier === ds.redMultiplier
					&& cached.dsGreenMultiplier === ds.greenMultiplier
					&& cached.dsBlueMultiplier === ds.blueMultiplier
					&& cached.dsAlphaMultiplier === ds.alphaMultiplier
					&& cached.dsRedOffset === ds.redOffset
					&& cached.dsGreenOffset === ds.greenOffset
					&& cached.dsBlueOffset === ds.blueOffset
					&& cached.dsAlphaOffset === ds.alphaOffset));

        const entry = this.acquireBitmapWrapperCacheEntry(window, cached, w, h);

        if(!entry) return;

        if(!paramsUnchanged)
        {
            const bctx = entry.ctx;

            bctx.imageSmoothingEnabled = false;
            bctx.setTransform(1, 0, 0, 1, 0, 0);
            bctx.clearRect(0, 0, w, h);

            // Rotation: pre-rotate the source around its centre (AS3 l.55-66).
            const source = rotation !== 0 ? this.rotateBitmap(bmp, rotation) : bmp;
            const srcW = bmp.width;
            const srcH = bmp.height;

            // AS3 l.73-118 read param1.width/param1.height (the WINDOW's own logical
            // size) for every stretch/tile/pivot computation below - never param3 (the
            // Rectangle this method receives, which it doesn't use at all). w/h here
            // are renderingWidth/renderingHeight (rect, from WindowRendererItem), which
            // include the etching-point margin (defaults to 1px when no etching is
            // configured - see BitmapDataController.etchingPoint) - stretching to that
            // instead of the window's true size drew every unetched bitmap 1px taller/
            // wider than intended, e.g. squashing ProgressBar's bar_c 1px short at the
            // bottom. w/h stay correct for the canvas allocation and greyscale filter
            // area below, which DO need the etching-inclusive buffer size (matching
            // AS3's param2 BitmapData, sized by the caller to fit an etching shadow).
            const logicalW = window.width;
            const logicalH = window.height;

            // Unsigned tile size (AS3 l.67-68 take Math.abs of the zoom-scaled size);
            // direction is applied separately via isFlippedX/isFlippedY below, since
            // flip is (zoom sign XOR flipX), not the zoom sign alone.
            const drawW = (stretchedX ? logicalW : srcW) * Math.abs(zoomX);
            const drawH = (stretchedY ? logicalH : srcH) * Math.abs(zoomY);

            if(drawW !== 0 && drawH !== 0)
            {
                // Tile counts (AS3 l.69-70).
                const tilesX = !wrapX ? 1 : Math.floor(logicalW / drawW) + 2;
                const tilesY = !wrapY ? 1 : Math.floor(logicalH / drawH) + 2;

                // Base position from pivot (AS3 l.73-116).
                let baseTx: number;

                switch(pivotPoint)
                {
                    // AS3 l.88-92 (case 1/4/7, the centre-column pivots):
                    // `int((width - drawW) / 2) + (flipped ? drawW : 0)`. The flip term was
                    // missing here, and it is not optional: `setTransform` gets a NEGATIVE
                    // scaleX for a mirrored bitmap, so tx has to name the destination's RIGHT
                    // edge. Without it the image draws from the centre LEFTWARDS — the toolbar's
                    // expand chevron (`zoom_x=-1`, `pivot_point=center`) landed 6px to the left,
                    // half of it outside its own 13px window. The left- and right-column cases
                    // below and above already carried their own version of this term.
                    case PivotPoint.TOP_CENTER:
                    case PivotPoint.CENTER:
                    case PivotPoint.BOTTOM_CENTER:
                        baseTx = Math.trunc((logicalW - drawW) / 2) + (isFlippedX ? drawW : 0);
                        break;
                    case PivotPoint.TOP_RIGHT:
                    case PivotPoint.CENTER_RIGHT:
                    case PivotPoint.BOTTOM_RIGHT:
                        baseTx = isFlippedX ? logicalW : logicalW - drawW;
                        break;
                    // AS3 l.83-87 (case 0/3/6, the left-column pivots): tx = flipped
                    // ? drawW : 0 - a POSITIVE drawW. This was negated here, which for
                    // a flipped (negative zoom) bitmap at a left pivot pushed the whole
                    // draw origin off-canvas (e.g. arrow_expand's zoom_x=-1 at the
                    // default TOP_LEFT pivot rendered nothing - the transform placed
                    // every source pixel at a negative destination x).
                    default:
                        baseTx = isFlippedX ? drawW : 0;
                        break;
                }

                let baseTy: number;

                switch(pivotPoint)
                {
                    // AS3 l.110-114 (case 3/4/5): the same flip term on the vertical axis.
                    case PivotPoint.CENTER_LEFT:
                    case PivotPoint.CENTER:
                    case PivotPoint.CENTER_RIGHT:
                        baseTy = Math.trunc((logicalH - drawH) / 2) + (isFlippedY ? drawH : 0);
                        break;
                    case PivotPoint.BOTTOM_LEFT:
                    case PivotPoint.BOTTOM_CENTER:
                    case PivotPoint.BOTTOM_RIGHT:
                        baseTy = isFlippedY ? logicalH : logicalH - drawH;
                        break;
                    // AS3 l.105-109 (case 0/1/2, the top-row pivots): ty = flipped ?
                    // drawH : 0 - same positive-on-flip fix as baseTx above.
                    default:
                        baseTy = isFlippedY ? drawH : 0;
                        break;
                }

                // Wrap start: shift back by one tile until <= 0 (AS3 l.91-94, 113-116).
                while(wrapX && baseTx > 0) baseTx -= drawW;
                while(wrapY && baseTy > 0) baseTy -= drawH;

                const etchAlpha = (etchColor >>> 24) & 0xFF;
                const drawEtch = etchAlpha > 0;
                const silhouette = drawEtch ? this.makeSilhouette(source, srcW, srcH, etchColor) : null;

                // In the non-greyscale branch AS3 applies the colour transform to the
                // MAIN bitmap only (not the etch), so pre-tint the source once.
                const tinted = !greyscale
                    ? this.tintBitmap(source, srcW, srcH, window.color, ds)
                    : null;
                const mainBitmap = tinted ?? source;

                // Scale sign carries the flip (AS3 l.75-76: MATRIX.a/d negated when
                // isFlipped), applied on top of the always-positive drawW/drawH.
                const scaleX = (isFlippedX ? -1 : 1) * drawW / srcW;
                const scaleY = (isFlippedY ? -1 : 1) * drawH / srcH;

                // AS3's single static `_MATRIX` is reused as the a/d/tx/ty passed to each
                // BitmapData.draw() call in the tile loop below; ctx.setTransform() takes
                // the same 6 components directly, so there is no persisted Matrix object
                // to port - scaleX/scaleY (a/d) and px/py (tx/ty) are its TS equivalent.
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapDataRenderer.as::_MATRIX
                // Tile loop (AS3 l.127-176): etch silhouette first, then the main bitmap.
                for(let ty = 0; ty < tilesY; ty++)
                {
                    for(let tx = 0; tx < tilesX; tx++)
                    {
                        const px = baseTx + (tx * drawW);
                        const py = baseTy + (ty * drawH);

                        if(silhouette)
                        {
                            bctx.save();
                            bctx.globalAlpha = etchAlpha / 255;
                            bctx.setTransform(scaleX, 0, 0, scaleY, px + etchPt.x, py + etchPt.y);
                            bctx.drawImage(silhouette, 0, 0);
                            bctx.restore();
                        }

                        bctx.save();
                        bctx.setTransform(scaleX, 0, 0, scaleY, px, py);
                        bctx.drawImage(mainBitmap, 0, 0);
                        bctx.restore();
                    }
                }

                bctx.setTransform(1, 0, 0, 1, 0, 0);

                // Greyscale converts the WHOLE buffer to luminance, tinted by window.color
                // (AS3 l.133-146 applyFilter over param2.rect).
                if(greyscale)
                {
                    this.applyGreyscale(bctx, w, h, window.color);
                }
            }

            // Snapshot every input this render depended on, so next frame can
            // detect "nothing changed" and skip straight to the blit below.
            entry.bmp = bmp;
            entry.zoomX = zoomX;
            entry.zoomY = zoomY;
            entry.isFlippedX = isFlippedX;
            entry.isFlippedY = isFlippedY;
            entry.stretchedX = stretchedX;
            entry.stretchedY = stretchedY;
            entry.wrapX = wrapX;
            entry.wrapY = wrapY;
            entry.rotation = rotation;
            entry.greyscale = greyscale;
            entry.pivotPoint = pivotPoint;
            entry.etchColor = etchColor;
            entry.w = w;
            entry.h = h;
            entry.color = window.color;
            entry.hasDynamicStyle = ds !== null;
            entry.dsRedMultiplier = ds?.redMultiplier ?? 1;
            entry.dsGreenMultiplier = ds?.greenMultiplier ?? 1;
            entry.dsBlueMultiplier = ds?.blueMultiplier ?? 1;
            entry.dsAlphaMultiplier = ds?.alphaMultiplier ?? 1;
            entry.dsRedOffset = ds?.redOffset ?? 0;
            entry.dsGreenOffset = ds?.greenOffset ?? 0;
            entry.dsBlueOffset = ds?.blueOffset ?? 0;
            entry.dsAlphaOffset = ds?.alphaOffset ?? 0;
        }

        // Blit the (possibly cached, unchanged) buffer to the composite,
        // clipped to window bounds.
        const blend = window.blend;

        ctx.save();
        ctx.beginPath();
        ctx.rect(absX, absY, w, h);
        ctx.clip();

        if(blend < 1) ctx.globalAlpha = blend;

        ctx.drawImage(entry.canvas, 0, 0, w, h, absX, absY, w, h);

        ctx.restore();
    }

    /**
	 * Gets or creates the persistent per-window canvas backing
	 * `IBitmapWrapperCacheEntry`. Resizing counts as a cache miss (the caller's
	 * `paramsUnchanged` check already covers `w`/`h`), so a fresh, blank entry
	 * is handed back for the caller to populate.
	 */
    private acquireBitmapWrapperCacheEntry(
        window: IWindow,
        cached: IBitmapWrapperCacheEntry | null,
        w: number,
        h: number
    ): IBitmapWrapperCacheEntry | null
    {
        const width = Math.max(1, w);
        const height = Math.max(1, h);

        if(cached && cached.canvas.width === width && cached.canvas.height === height)
        {
            return cached;
        }

        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d', {willReadFrequently: true});

        if(!ctx) return null;

        // Sentinel values guarantee the very first comparison in
        // `draw()` treats this entry as "changed".
        const entry: IBitmapWrapperCacheEntry = {
            canvas,
            ctx,
            bmp: null,
            zoomX: NaN,
            zoomY: NaN,
            isFlippedX: false,
            isFlippedY: false,
            stretchedX: false,
            stretchedY: false,
            wrapX: false,
            wrapY: false,
            rotation: NaN,
            greyscale: false,
            pivotPoint: -1,
            etchColor: NaN,
            w: -1,
            h: -1,
            color: NaN,
            hasDynamicStyle: false,
            dsRedMultiplier: NaN,
            dsGreenMultiplier: NaN,
            dsBlueMultiplier: NaN,
            dsAlphaMultiplier: NaN,
            dsRedOffset: NaN,
            dsGreenOffset: NaN,
            dsBlueOffset: NaN,
            dsAlphaOffset: NaN,
        };

        this._bitmapWrapperCache.set(window, entry);

        return entry;
    }

    /**
	 * Rotates a bitmap around its centre into a same-sized canvas (AS3 l.55-66).
	 */
    private rotateBitmap(bmp: ImageBitmap, degrees: number): OffscreenCanvas | ImageBitmap
    {
        const canvas = new OffscreenCanvas(bmp.width, bmp.height);
        const rctx = canvas.getContext('2d');

        if(!rctx) return bmp;

        rctx.imageSmoothingEnabled = false;
        rctx.translate(bmp.width / 2, bmp.height / 2);
        rctx.rotate((degrees / 180) * Math.PI);
        rctx.translate(-bmp.width / 2, -bmp.height / 2);
        rctx.drawImage(bmp, 0, 0);

        return canvas;
    }

    /**
	 * Whether a value is something `CanvasRenderingContext2D.drawImage()` will
	 * actually accept (a `CanvasImageSource`).
	 *
	 * Each constructor is checked for existence first: `VideoFrame` is absent in
	 * older engines and every DOM-only type is absent in a worker, where
	 * referencing the bare identifier would throw a ReferenceError rather than
	 * return false.
	 */
    // TS-only: guards a cast the type system cannot — see draw().
    private static isDrawable(value: unknown): value is CanvasImageSource
    {
        if(typeof value !== 'object' || value === null) return false;

        const globals = globalThis as unknown as Record<string, unknown>;

        for(const name of BitmapDataRenderer.DRAWABLE_TYPES)
        {
            const ctor = globals[name];

            if(typeof ctor === 'function' && value instanceof (ctor as new (...args: never[]) => unknown))
            {
                return true;
            }
        }

        return false;
    }

    /**
	 * Logs an undrawable `bitmapData` once per window name, with the value's
	 * actual constructor — the one piece of information needed to find the
	 * assigner. Rate-limited by name because draw() runs every frame the window
	 * is dirty, and an unbounded log would bury everything else.
	 */
    // TS-only: diagnostic for the guard above.
    private static reportUndrawableBitmap(window: IWindow, value: unknown): void
    {
        const name = window.name || '<unnamed>';

        if(BitmapDataRenderer.REPORTED_UNDRAWABLE.has(name)) return;

        BitmapDataRenderer.REPORTED_UNDRAWABLE.add(name);

        const actual = (value as { constructor?: { name?: string } })?.constructor?.name ?? typeof value;

        log.warn(
            `Window "${name}" (type ${window.type}, style ${window.style}) has a bitmapData that drawImage() cannot accept: `
			+ `got ${actual}. The window is skipped. Whatever assigns this window's bitmap is passing a non-image `
			+ `through a cast — fix it there; this guard only keeps one bad window from aborting the whole render pass.`
        );
    }

    /**
	 * Builds a flat-colour silhouette of the bitmap (its alpha shape filled with
	 * the etch RGB). Mirrors AS3 `const_10` colour transform (RGB multipliers 0,
	 * offsets = etch colour). Drawn later at reduced alpha = etch alpha / 255.
	 */
    private makeSilhouette(
        source: OffscreenCanvas | ImageBitmap,
        srcW: number,
        srcH: number,
        etchColor: number
    ): OffscreenCanvas | null
    {
        const canvas = new OffscreenCanvas(srcW, srcH);
        const sctx = canvas.getContext('2d');

        if(!sctx) return null;

        const r = (etchColor >> 16) & 0xFF;
        const g = (etchColor >> 8) & 0xFF;
        const b = etchColor & 0xFF;

        sctx.imageSmoothingEnabled = false;
        sctx.drawImage(source, 0, 0);
        sctx.globalCompositeOperation = 'source-in';
        sctx.fillStyle = `rgb(${r},${g},${b})`;
        sctx.fillRect(0, 0, srcW, srcH);

        return canvas;
    }

    /**
	 * Applies the non-greyscale colour transform (AS3 `const_7`) to a copy of the
	 * source bitmap: multiply by window.color RGB, then concat the dynamic-style
	 * colour transform. Returns null when the transform is identity so the caller
	 * can draw the untouched source.
	 */
    private tintBitmap(
        source: OffscreenCanvas | ImageBitmap,
        srcW: number,
        srcH: number,
        color: number,
        ds: IWindow['dynamicStyleColor']
    ): OffscreenCanvas | null
    {
        let rMult = ((color >> 16) & 0xFF) / 255;
        let gMult = ((color >> 8) & 0xFF) / 255;
        let bMult = (color & 0xFF) / 255;
        let aMult = 1;
        let rOff = 0;
        let gOff = 0;
        let bOff = 0;
        let aOff = 0;

        // ColorTransform.concat: first has zero offsets, so result.offset = ds.offset
        // and result.mult = firstMult * ds.mult (AS3 l.157-160).
        if(ds)
        {
            rMult *= ds.redMultiplier;
            gMult *= ds.greenMultiplier;
            bMult *= ds.blueMultiplier;
            aMult = ds.alphaMultiplier;
            rOff = ds.redOffset;
            gOff = ds.greenOffset;
            bOff = ds.blueOffset;
            aOff = ds.alphaOffset;
        }

        const isIdentity = rMult === 1 && gMult === 1 && bMult === 1 && aMult === 1
			&& rOff === 0 && gOff === 0 && bOff === 0 && aOff === 0;

        if(isIdentity) return null;

        const canvas = new OffscreenCanvas(srcW, srcH);
        const tctx = canvas.getContext('2d', {willReadFrequently: true});

        if(!tctx) return null;

        tctx.imageSmoothingEnabled = false;
        tctx.drawImage(source, 0, 0);

        const image = tctx.getImageData(0, 0, srcW, srcH);
        const data = image.data;

        for(let i = 0; i < data.length; i += 4)
        {
            data[i] = this.clampByte(data[i] * rMult + rOff);
            data[i + 1] = this.clampByte(data[i + 1] * gMult + gOff);
            data[i + 2] = this.clampByte(data[i + 2] * bMult + bOff);
            data[i + 3] = this.clampByte(data[i + 3] * aMult + aOff);
        }

        tctx.putImageData(image, 0, 0);

        return canvas;
    }

    /**
	 * Converts the whole scratch buffer to luminance, tinted by window.color
	 * (AS3 greyscale matrix l.135 — Rec.709 weights, per-channel colour multiply).
	 *
	 * Replaces AS3's static `_GREYSCALE_FILTER` (a `flash.filters.ColorMatrixFilter`
	 * applied via `BitmapData.applyFilter()`) - Canvas 2D has no matching filter type,
	 * so the same 5x4 matrix is applied by hand below, per pixel, via getImageData/
	 * putImageData. `B` (= 0.072169, the blue-channel Rec.709 weight in that matrix)
	 * is the literal below rather than a named constant, alongside its R/G weights
	 * (0.212671/0.71516), which are equally obfuscated in AS3's own source.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapDataRenderer.as::_GREYSCALE_FILTER
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapDataRenderer.as::B
    private applyGreyscale(
        ctx: OffscreenCanvasRenderingContext2D,
        w: number,
        h: number,
        color: number
    ): void
    {
        const rMult = ((color >> 16) & 0xFF) / 255;
        const gMult = ((color >> 8) & 0xFF) / 255;
        const bMult = (color & 0xFF) / 255;

        const image = ctx.getImageData(0, 0, w, h);
        const data = image.data;

        for(let i = 0; i < data.length; i += 4)
        {
            const lum = (data[i] * 0.212671) + (data[i + 1] * 0.71516) + (data[i + 2] * 0.072169);

            data[i] = this.clampByte(rMult * lum);
            data[i + 1] = this.clampByte(gMult * lum);
            data[i + 2] = this.clampByte(bMult * lum);
            // Alpha unchanged (matrix alpha row = [0,0,0,1,0]).
        }

        ctx.putImageData(image, 0, 0);
    }

    private clampByte(value: number): number
    {
        if(value < 0) return 0;
        if(value > 255) return 255;

        return value;
    }

    public override dispose(): void
    {
        if(this._disposed) return;

        this._bitmapWrapperCache = new WeakMap();

        super.dispose();
    }
}
