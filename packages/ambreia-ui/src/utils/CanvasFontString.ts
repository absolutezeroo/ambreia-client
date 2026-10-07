import {flashLineBox} from './FlashTextMetrics';

/**
 * Shared helper for building Canvas 2D `ctx.font` strings.
 *
 * `ctx.font` (unlike a real CSS `font-family` declaration) requires
 * multi-word/special-character family names to be quoted — e.g. "Volter
 * (Goldfish)" is invalid unquoted (the parentheses/space break the shorthand
 * grammar) and silently drops the *entire* font declaration, falling back to
 * the canvas default with no console error. Not an AS3 concept (Flash
 * TextField never needed CSS font-string quoting) — pure TS canvas-rendering
 * infrastructure shared by every text-measuring/drawing call site.
 */
const GENERIC_FONT_KEYWORDS = new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
]);

export function quoteFontFamilyList(fontFace: string): string
{
    return fontFace
        .split(',')
        .map((rawName) =>
        {
            const name = rawName.trim();

            if(name.length === 0) return name;

            if(GENERIC_FONT_KEYWORDS.has(name.toLowerCase())) return name;

            const unquoted = name.replace(/^["']|["']$/g, '');

            return `"${unquoted.replace(/"/g, '\\"')}"`;
        })
        .filter((name) => name.length > 0)
        .join(', ');
}

/**
 * Builds a Canvas 2D `ctx.font` string from the same style/weight fields
 * TextController exposes (fontSize/fontFace/bold/italic).
 */
export function buildCanvasFontString(fontSize: number, fontFace: string, bold: boolean, italic: boolean): string
{
    let fontStr = '';

    if(italic) fontStr += 'italic ';
    if(bold) fontStr += 'bold ';
    fontStr += `${fontSize}px ${quoteFontFamilyList(fontFace)}`;

    return fontStr;
}

/**
 * Returns the full line height (ascent + descent) needed to render a line of
 * text for the currently-set `ctx.font`, without clipping descenders.
 *
 * A flat `fontSize`-based estimate (what AS3 Flash never needed — TextField
 * exposed a real measured `.textHeight`) has no headroom for descenders
 * (g/y/p/q), so labels auto-sized from it come out a few pixels too short;
 * once clipped, descenders get sheared off (observed as "My World" rendering
 * as "Mv World"). `metrics.actualBoundingBox*` is the wrong fix — it's the
 * tight ink box of the *specific characters measured*, so it varies per
 * string and undershoots single words with no tall/low glyphs (tried this;
 * made cropping worse). `fontBoundingBoxAscent`/`Descent` reflect the font's
 * own fixed design metrics instead — same value regardless of the text
 * being measured — so use those when the browser provides them (all
 * evergreen browsers do), falling back to the old heuristic otherwise.
 */
export function measureFontLineHeight(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    fontSize: number,
    leading: number = 0
): number
{
    // Flash's own number first, where the layouts pinned it down. The browser
    // metric below is the whole font face's box — Ubuntu's runs 3px past the
    // em at size 12 — and it is not what the player advanced by. Measured over
    // three unrelated windows, every auto-sized box came out exactly 2px short
    // of the authored one, which is this difference plus the missing gutter.
    const flash = flashLineBox(fontSize);

    if(flash !== null) return flash + Math.max(0, leading);

    const metrics = ctx.measureText('Mg');
    const ascent = metrics.fontBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent;

    if(typeof ascent === 'number' && typeof descent === 'number' && (ascent + descent) > 0)
    {
        return Math.ceil(ascent + descent + Math.max(0, leading));
    }

    return Math.ceil(fontSize + Math.max(0, leading));
}
