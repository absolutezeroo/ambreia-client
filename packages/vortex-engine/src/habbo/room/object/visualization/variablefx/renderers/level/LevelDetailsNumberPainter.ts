import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxClipRect} from '../../rendering/VariableFxClipRect';

/** Where one glyph lives in the small-numbers strip. */
interface ILevelNumberGlyph
{
    sourceX: number;
    width: number;
}

/** One measured run of text inside a plan. */
export interface ILevelNumberPart
{
    text: string;
    width: number;
}

/** A laid-out "123/456" (or a fallback), measured and keyed so it can be compared cheaply. */
export interface ILevelNumberRenderPlan
{
    key: string;
    parts: ILevelNumberPart[];
    width: number;
}

/**
 * The small "value/max" caption under a level badge, laid out to fit a given width.
 *
 * It degrades rather than overflows, in three steps: the full `123/456`, then the current value
 * alone, then the current value truncated a character at a time with an ellipsis — and if even
 * `...` will not fit, an empty plan that draws nothing. That last case is why `parts` can be empty
 * and why `draw()` must tolerate it.
 *
 * The ellipsis is a GLYPH, not three periods: `...` has its own 8px cell in the strip, which is
 * what `resolveGlyphs()` is scanning three characters ahead for.
 *
 * Rendered text is cached whole, by string. A caption changes at most once per level and the same
 * few strings recur, so caching the composed bitmap beats re-blitting five glyphs every frame.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/level/LevelDetailsNumberPainter.as
 */
export class LevelDetailsNumberPainter
{
    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::GLYPH_HEIGHT
    private static readonly GLYPH_HEIGHT: number = 9;

    /** Negative: the glyphs are drawn one pixel tighter than their cells. */
    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::GLYPH_SPACING_X
    private static readonly GLYPH_SPACING_X: number = -1;

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::ELLIPSIS (name derived)
    //   The AS3 constant is `_SafeStr_11480` on `LevelDetailsNumberProgress`, value "...", and the
    //   same literal keys the glyph below.
    private static readonly ELLIPSIS: string = '...';

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::GLYPHS
    private static readonly GLYPHS: Readonly<Record<string, ILevelNumberGlyph>> = {
        '0': {sourceX: 0, width: 7},
        '1': {sourceX: 8, width: 4},
        '2': {sourceX: 13, width: 7},
        '3': {sourceX: 21, width: 7},
        '4': {sourceX: 29, width: 7},
        '5': {sourceX: 37, width: 7},
        '6': {sourceX: 45, width: 7},
        '7': {sourceX: 53, width: 7},
        '8': {sourceX: 61, width: 7},
        '9': {sourceX: 69, width: 7},
        '/': {sourceX: 77, width: 12},
        '...': {sourceX: 90, width: 8}
    };

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::_numbers
    private _numbers: VariableFxDrawable;

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::_textBitmaps (name derived)
    //   `_SafeStr_6452`: composed runs of text, by the text itself.
    private _textBitmaps: Map<string, OffscreenCanvas> = new Map();

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::LevelDetailsNumberPainter()
    constructor(numbers: VariableFxDrawable)
    {
        this._numbers = numbers;
    }

    /** Full caption, then current-only, then truncated — the first that fits `maxWidth`. */
    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::createRenderPlan()
    createRenderPlan(currentText: string, maxText: string, maxWidth: number): ILevelNumberRenderPlan
    {
        const limit = Math.max(0, maxWidth);
        const full = this.createPlan(`full:${currentText}/${maxText}`, [currentText, '/', maxText]);

        if(full.width <= limit) return full;

        const currentOnly = this.createPlan(`current:${currentText}`, [currentText]);

        if(currentOnly.width <= limit) return currentOnly;

        return this.createTruncatedCurrentPlan(currentText, limit);
    }

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::draw()
    draw(composer: VariableFxBitmapComposer, plan: ILevelNumberRenderPlan, x: number, y: number): void
    {
        let penX = x;

        for(const part of plan.parts)
        {
            composer.drawLayer(this.getTextBitmap(part.text), penX, y, 'normal', 255);

            penX += part.width + LevelDetailsNumberPainter.GLYPH_SPACING_X;
        }
    }

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::createTruncatedCurrentPlan()
    private createTruncatedCurrentPlan(currentText: string, maxWidth: number): ILevelNumberRenderPlan
    {
        for(let length = currentText.length; length > 0; length--)
        {
            const head = currentText.substr(0, length);
            const plan = this.createPlan(
                `truncated:${head}${LevelDetailsNumberPainter.ELLIPSIS}`,
                [head, LevelDetailsNumberPainter.ELLIPSIS]
            );

            if(plan.width <= maxWidth) return plan;
        }

        const ellipsisOnly = this.createPlan(
            `truncated:${LevelDetailsNumberPainter.ELLIPSIS}`,
            [LevelDetailsNumberPainter.ELLIPSIS]
        );

        return ellipsisOnly.width <= maxWidth ? ellipsisOnly : {key: 'empty', parts: [], width: 0};
    }

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::createPlan()
    private createPlan(key: string, texts: string[]): ILevelNumberRenderPlan
    {
        const parts: ILevelNumberPart[] = [];

        for(const text of texts)
        {
            if(text.length > 0) parts.push({text, width: this.measureText(text)});
        }

        return {key, parts, width: LevelDetailsNumberPainter.measureParts(parts)};
    }

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::measureParts()
    private static measureParts(parts: ILevelNumberPart[]): number
    {
        let width = 0;

        for(const part of parts) width += part.width;

        if(parts.length === 0) return 0;

        return width + LevelDetailsNumberPainter.GLYPH_SPACING_X * (parts.length - 1);
    }

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::measureText()
    private measureText(text: string): number
    {
        const glyphs = LevelDetailsNumberPainter.resolveGlyphs(text);

        if(glyphs.length === 0) return 0;

        let width = 0;

        for(const glyph of glyphs) width += glyph.width;

        return width + LevelDetailsNumberPainter.GLYPH_SPACING_X * (glyphs.length - 1);
    }

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::getTextBitmap()
    private getTextBitmap(text: string): OffscreenCanvas
    {
        const cached = this._textBitmaps.get(text);

        if(cached !== undefined) return cached;

        const bitmap = new OffscreenCanvas(
            Math.max(1, this.measureText(text)), LevelDetailsNumberPainter.GLYPH_HEIGHT
        );
        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);
        this.drawTextGlyphs(composer, text, 0, 0);

        this._textBitmaps.set(text, bitmap);

        return bitmap;
    }

    /** Same clip-and-offset trick as the badge digits: the whole strip, through a glyph-wide window. */
    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::drawTextGlyphs()
    private drawTextGlyphs(composer: VariableFxBitmapComposer, text: string, x: number, y: number): void
    {
        let penX = x;

        for(const glyph of LevelDetailsNumberPainter.resolveGlyphs(text))
        {
            composer.drawLayer(
                this._numbers, penX - glyph.sourceX, y, 'normal', 255,
                new VariableFxClipRect(penX, y, glyph.width, LevelDetailsNumberPainter.GLYPH_HEIGHT)
            );

            penX += glyph.width + LevelDetailsNumberPainter.GLYPH_SPACING_X;
        }
    }

    /** Scans three ahead for the ellipsis, which is one glyph and not three periods. */
    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::resolveGlyphs()
    private static resolveGlyphs(text: string): ILevelNumberGlyph[]
    {
        const glyphs: ILevelNumberGlyph[] = [];
        let index = 0;

        while(index < text.length)
        {
            if(text.substr(index, 3) === LevelDetailsNumberPainter.ELLIPSIS)
            {
                glyphs.push(LevelDetailsNumberPainter.GLYPHS[LevelDetailsNumberPainter.ELLIPSIS]);
                index += 3;

                continue;
            }

            const glyph = LevelDetailsNumberPainter.GLYPHS[text.charAt(index)];

            // A character with no glyph is skipped, not substituted — the caption is built from
            // digits and a slash, so this can only fire on data that is already wrong.
            if(glyph !== undefined) glyphs.push(glyph);

            index += 1;
        }

        return glyphs;
    }

    // AS3: .../renderers/level/LevelDetailsNumberPainter.as::dispose()
    dispose(): void
    {
        this._textBitmaps = new Map();
    }
}
