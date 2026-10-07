/**
 * Translates a window's Flash filter list into a Canvas2D `ctx.filter` string.
 *
 * AS3 hands its filter array to Flash, which composites each one onto the window's own bitmap.
 * There is no such pipeline here: `WindowComposite` blits each window's buffer onto one canvas,
 * and Canvas2D's only filter hook is the CSS filter string it applies to whatever is drawn next.
 * That hook is enough for the one filter the layouts actually use — 225 shipped layouts declare
 * `<DropShadowFilter>` and nothing else — because `drop-shadow()` is the same operation.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter()
 */

/**
 * The shape `WindowParser.buildBitmapFilter()` produces, and the only one stored on a window.
 */
// AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter()
export interface IWindowDropShadowFilter
{
    // TS-only: the discriminant. AS3 has a real `DropShadowFilter` class and tests with `is`.
    type: 'DropShadowFilter';
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`distance`)
    distance: number;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`angle`)
    angle: number;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`color`)
    color: number;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`alpha`)
    alpha: number;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`blurX`)
    blurX: number;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`blurY`)
    blurY: number;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`strength`)
    strength: number;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`quality`)
    quality: number;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`inner`)
    inner: boolean;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`knockout`)
    knockout: boolean;
    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter() (`hideObject`)
    hideObject: boolean;
}

/**
 * A glow, which Flash models as a shadow with no offset.
 *
 * `WindowParser` never builds one — no shipped layout declares `<GlowFilter>` — but
 * `BadgeImageWidget` builds them from code, which is what this exists for.
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/BadgeImageWidget.as::createOuterGlowFilter()
export interface IWindowGlowFilter
{
    // TS-only: the discriminant; AS3 has a real `flash.filters.GlowFilter` and tests with `is`.
    type: 'GlowFilter';
    // AS3: .../widgets/BadgeImageWidget.as::createOuterGlowFilter() (`param1`)
    color: number;
    // AS3: .../widgets/BadgeImageWidget.as::createOuterGlowFilter() (`0.7 * param2`)
    alpha: number;
    // AS3: .../widgets/BadgeImageWidget.as::createOuterGlowFilter() (`4 + param2 * 4`)
    blurX: number;
    // AS3: .../widgets/BadgeImageWidget.as::createOuterGlowFilter() (`4 + param2 * 4`)
    blurY: number;
    // AS3: .../widgets/BadgeImageWidget.as::createOuterGlowFilter() (`1 + param2 * 1.2`)
    strength: number;
    // AS3: .../widgets/BadgeImageWidget.as::createInnerGlowFilter() (`true`)
    inner: boolean;
}

/**
 * How many times `drop-shadow()` is repeated to approximate Flash's `strength`.
 *
 * Flash multiplies the shadow's alpha by `strength` and clamps; CSS has no such knob, and
 * stacking the same shadow darkens it the same way. Capped because each repeat is another
 * full-canvas pass, and past three the difference stops being visible.
 */
const MAX_STRENGTH_PASSES = 3;

/**
 * One CSS `drop-shadow()` per filter, joined — or `''` when the list contributes nothing.
 *
 * Returns `''` rather than `'none'` so the caller can test it as a boolean and leave
 * `ctx.filter` untouched, which is cheaper than assigning a no-op filter per window.
 *
 * A `GlowFilter` is a shadow with no offset — Flash models it exactly that way — so it takes the
 * same path with `distance` absent and reading as zero.
 *
 * `inner` is skipped **here** — `ctx.filter` has no inset shadow — but it is not skipped: it is a
 * compositing job rather than a filter string, and {@link applyInnerGlows} does it. `knockout` is
 * still skipped, and no shipped layout sets it.
 */
export function windowFiltersToCss(filters: readonly unknown[] | null): string
{
    if(filters === null || filters.length === 0) return '';

    const parts: string[] = [];

    for(const entry of filters)
    {
        // Read structurally rather than as `A & B`: the two discriminants exclude each other, so
        // the intersection is `never` and every field read off it fails.
        const filter = entry as Partial<Omit<IWindowDropShadowFilter, 'type'>> & {type?: string} | null;

        if(filter == null) continue;
        if(filter.type !== 'DropShadowFilter' && filter.type !== 'GlowFilter') continue;
        if(filter.inner === true || filter.knockout === true) continue;

        const alpha = filter.alpha ?? 1;

        if(alpha <= 0) continue;

        // Flash gives distance and angle; CSS wants x/y. The angle is in degrees, clockwise from
        // east, which is the same convention `Math.cos`/`Math.sin` use once converted to radians.
        const distance = filter.distance ?? 0;
        const radians = ((filter.angle ?? 45) * Math.PI) / 180;
        const offsetX = Math.round(Math.cos(radians) * distance * 100) / 100;
        const offsetY = Math.round(Math.sin(radians) * distance * 100) / 100;

        // CSS takes one blur radius where Flash takes two. The larger of the pair keeps a
        // deliberately-wide shadow wide; averaging would quietly shrink it.
        const blur = Math.max(filter.blurX ?? 0, filter.blurY ?? 0);

        // No blur and no offset means the shadow lands exactly behind the source and is never
        // seen — a filter pass for nothing. Flash draws it too; skipping is the cheaper identity.
        if(blur === 0 && offsetX === 0 && offsetY === 0) continue;

        const color = filter.color ?? 0;
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        const shadow = `drop-shadow(${offsetX}px ${offsetY}px ${blur}px rgba(${r},${g},${b},${alpha}))`;

        const passes = Math.min(MAX_STRENGTH_PASSES, Math.max(1, Math.round(filter.strength ?? 1)));

        for(let i = 0; i < passes; i++) parts.push(shadow);
    }

    return parts.join(' ');
}

/**
 * The inner glows in a window's filter list, in declaration order.
 *
 * Separate from {@link windowFiltersToCss} because they are a different operation: a filter string
 * is applied to whatever is drawn next, and an inner glow has to be composited *against the shape
 * it lives inside*. Returns an empty array for the overwhelmingly common case of no inner glow, so
 * the caller can skip the scratch canvas entirely.
 */
// TS-only: AS3 hands `inner` to Flash, which has one code path for both directions; splitting them
//   is what Canvas2D forces, since only the outer one is expressible as a filter string.
export function windowInnerGlowFilters(filters: readonly unknown[] | null): IWindowGlowFilter[]
{
    if(filters === null || filters.length === 0) return [];

    const glows: IWindowGlowFilter[] = [];

    for(const entry of filters)
    {
        const filter = entry as Partial<IWindowGlowFilter> & {type?: string; knockout?: boolean} | null;

        if(filter == null) continue;
        if(filter.type !== 'GlowFilter' && filter.type !== 'DropShadowFilter') continue;
        if(filter.inner !== true || filter.knockout === true) continue;
        if((filter.alpha ?? 1) <= 0) continue;
        if(Math.max(filter.blurX ?? 0, filter.blurY ?? 0) <= 0) continue;

        glows.push(filter as IWindowGlowFilter);
    }

    return glows;
}

/**
 * Draws `source` with its inner glows burned in, and returns the result.
 *
 * Flash multiplies the *inverted*, blurred alpha of the shape by `strength` and paints it in
 * `color`, clipped to the shape — so the colour is strongest just inside the silhouette and fades
 * towards the middle. Canvas2D expresses exactly that with two composite operations and no
 * approximation:
 *
 * 1. fill a scratch canvas with the glow colour,
 * 2. `destination-out` the blurred source into it, punching a soft hole where the shape is opaque
 *    — what is left is the inverted, blurred alpha,
 * 3. `source-atop` that onto a copy of the source, which clips it to the shape.
 *
 * Returns `source` itself when there is nothing to do, so the caller can blit the result
 * unconditionally.
 */
// TS-only: the compositing half of `inner`; see windowInnerGlowFilters() above.
export function applyInnerGlows(source: OffscreenCanvas, glows: readonly IWindowGlowFilter[]): OffscreenCanvas
{
    if(glows.length === 0 || source.width <= 0 || source.height <= 0) return source;

    const composed = new OffscreenCanvas(source.width, source.height);
    const target = composed.getContext('2d');

    if(target === null) return source;

    target.drawImage(source, 0, 0);

    const mask = new OffscreenCanvas(source.width, source.height);
    const maskCtx = mask.getContext('2d');

    if(maskCtx === null) return source;

    for(const glow of glows)
    {
        const blur = Math.max(glow.blurX ?? 0, glow.blurY ?? 0);
        const color = glow.color ?? 0;
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;

        maskCtx.setTransform(1, 0, 0, 1, 0, 0);
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.filter = 'none';
        maskCtx.clearRect(0, 0, mask.width, mask.height);

        maskCtx.fillStyle = `rgba(${r},${g},${b},${glow.alpha ?? 1})`;
        maskCtx.fillRect(0, 0, mask.width, mask.height);

        maskCtx.globalCompositeOperation = 'destination-out';
        maskCtx.filter = `blur(${blur}px)`;
        maskCtx.drawImage(source, 0, 0);
        maskCtx.filter = 'none';

        // Same `strength` convention as the outer path: Flash multiplies the alpha and clamps,
        // and repeating the draw is how compositing reaches the same place.
        const passes = Math.min(MAX_STRENGTH_PASSES, Math.max(1, Math.round(glow.strength ?? 1)));

        target.globalCompositeOperation = 'source-atop';

        for(let i = 0; i < passes; i++) target.drawImage(mask, 0, 0);
    }

    target.globalCompositeOperation = 'source-over';

    return composed;
}
