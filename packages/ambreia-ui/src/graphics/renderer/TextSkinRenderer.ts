import {TextStyleManager} from '../../utils/TextStyleManager';
import type {IWindow} from '../../IWindow';
import {WindowType} from '../../enum/WindowType';
import {buildCanvasFontString, measureFontLineHeight} from '../../utils/CanvasFontString';
import {GlyphAtlas} from '../../utils/GlyphAtlas';
import {SkinRenderer} from './SkinRenderer';

/**
 * Duck-typed view of the `TextController` properties this renderer reads.
 *
 * AS3 casts the window to `ITextWindow`/`ITextFieldContainer` and reads the
 * same members off it; this port has no equivalent runtime cast, so the shape
 * is spelled out here.
 */
export interface ITextWindowShape
{
    // AS3: TextController.as::get border() / get borderColor() — Flash's TextField
    // paints these itself; see drawBorder().
    border?: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get borderColor()
    borderColor?: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get textColor()
    textColor?: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get fontSize()
    fontSize?: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get fontFace()
    fontFace?: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get bold()
    bold?: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get italic()
    italic?: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get underline()
    underline?: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get multiline()
    multiline?: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get wordWrap()
    wordWrap?: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get etchingColor()
    etchingColor?: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get etchingPosition()
    etchingPosition?: string;
    // AS3: TextController.as::get antiAliasType() / get sharpness() /
    // get thickness() / get gridFitType() — Flash's four text-quality knobs.
    // Inert against ctx.fillText(); consumed by GlyphAtlas at bake time.
    antiAliasType?: string;
    _antiAliasType?: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get sharpness()
    sharpness?: number;
    _sharpness?: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get thickness()
    thickness?: number;
    _thickness?: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get gridFitType()
    gridFitType?: string;
    _gridFitType?: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get autoSize()
    autoSize?: string;
    _autoSize?: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get spacing()
    spacing?: number;
    _spacing?: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get leading()
    leading?: number;
    _leading?: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get maxLines()
    maxLines?: number;
    _maxLines?: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get condenseWhite()
    condenseWhite?: boolean;
    _condenseWhite?: boolean;
    marginLeft?: number;
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    _marginLeft?: number;
    _marginTop?: number;
    _marginRight?: number;
    _marginBottom?: number;
}

/**
 * A per-range TextFormat override, as produced by `TextController.setTextFormat()`.
 */
interface ITextFormatRun
{
    start: number;
    end: number;
    format: { color?: number | null; underline?: boolean | null; bold?: boolean | null; italic?: boolean | null; size?: number | null };
}

/**
 * What drawing a formatted line needs beyond the line itself: the runs, and the base face they
 * override. Bundled rather than passed loose because compositeTextMultiline() already carries
 * thirteen positional arguments.
 */
interface IRunDrawContext
{
    runs: ReadonlyArray<ITextFormatRun>;
    fontFace: string;
    bold: boolean;
    italic: boolean;
    fillStyle: string;
}

/**
 * Draws a text window's content: the etched copy first, then the text itself.
 *
 * Ported from AS3 `TextSkinRenderer`, mapped by the game's own element
 * description (`window-skins/habbo_element_description_xml.xml`) onto the
 * `text`, `formatted_text`, `password` and `link` window types.
 *
 * The port is a behavioural one, not a line-for-line one, and the reason is
 * structural: AS3 does no text layout here at all. Flash's `TextField` has
 * already measured, wrapped and rendered the glyphs by the time `draw()` runs,
 * so AS3's whole method is two `BitmapData.draw()` calls that blit that
 * TextField — once through a flattening ColorTransform for the etch, once for
 * the text. Canvas2D has no TextField, so measuring, wrapping and stroking
 * glyphs has to happen here. Everything below `draw()` therefore has no AS3
 * counterpart to trace to; what is traceable is the order (etch, then text),
 * the etch offsets (`SkinRenderer.ETCHING_POSITION`), the alpha-gated etch
 * (`(etchingColor & 0xFF000000) != 0`), and `isStateDrawable()`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/TextSkinRenderer.as
 */
export class TextSkinRenderer extends SkinRenderer
{
    /**
	 * Flash reserves a 2px gutter at the top of every TextField, which the
	 * layouts' Y coordinates were authored against.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::_field
    protected static readonly FLASH_TEXT_FIELD_TOP_GUTTER: number = 2;

    /**
	 * The same gutter on the left — applied to editable fields only.
	 *
	 * Flash reserves the gutter on all four sides, and AS3's draw() inherits it:
	 * the matrix translates by `margins.left`, but what it blits is the
	 * TextField's own bitmap, whose glyphs are already inset by the gutter. So
	 * every text window in this port sits 2px left of where the layouts (authored
	 * in Flash) put it. It went unnoticed while nothing drew the field's border;
	 * with the border painted, the first glyph runs straight into it.
	 *
	 * sources/win63_version/core/window/components/TextController.as::_field —
	 * apply it to non-editable text too. It is held back to input/password fields
	 * here because those have fixed layout sizes, while an auto-sized label takes
	 * its width from the measured text: shifting the glyphs right without also
	 * widening the box (TextController.measureLayout(), which only compensates for
	 * the vertical gutter, and only for background-filled fields) would clip the
	 * last 2px off captions all over the client.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::_field
    protected static readonly FLASH_TEXT_FIELD_LEFT_GUTTER: number = 2;

    /**
	 * Glyph atlas for the text currently being drawn, resolved once per
	 * `draw()` and consumed by the line-drawing helpers below.
	 *
	 * TS-only, and a transient rather than state: skin renderers are shared
	 * singletons, but `draw()` is synchronous and never re-entered, so the
	 * atlas only has to survive the call it was resolved in. Null means the
	 * atlas is disabled and the helpers fall back to `ctx.fillText()`.
	 */
    protected _atlas: GlyphAtlas | null = null;

    /**
	 * The window's Flash text-quality settings, kept alongside `_atlas` so the
	 * per-run path can resolve sibling atlases (bold/italic runs) with the same
	 * quality.
	 */
    protected _textQuality: { aa: string; sharpness: number; thickness: number; gridFit: string } | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/TextSkinRenderer.as::isStateDrawable()
    /**
	 * Registers the stylesheet this renderer skins text with.
	 *
	 * AS3 reads the CSS out of the skin asset it is handed. This port has no such
	 * asset shipped — TextStyleManager.init() parses a built-in copy instead — so
	 * the source text is taken directly, and the member stays the one entry point
	 * that feeds the style registry from a skin.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/TextSkinRenderer.as::parse()
    public override parse(source?: string): void
    {
        if(!source) return;

        TextStyleManager.setStyles(TextStyleManager.parseCSS(source));
    }

    public override isStateDrawable(state: number): boolean
    {
        return state === 0;
    }

    /**
     * How far below the box top the first line sits.
     *
     * Only meaningful when the box has room for it: the offset costs the
     * bottom gutter, and a field authored exactly as tall as its line box has
     * none to give. TextController sizes its fields as line box + both
     * gutters, so text windows do; LabelRenderer overrides this to 0 because
     * TextLabelController does not size that way.
     */
    // TS-only: Flash's TextField owns its gutters, so AS3 never had to expose
    // one — the port splits the box and the glyph placement across two classes
    // and needs them to agree on it.
    protected get topGutter(): number
    {
        return TextSkinRenderer.FLASH_TEXT_FIELD_TOP_GUTTER;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/TextSkinRenderer.as::draw()
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

        const type = window.type;
        const typedWindow = window as unknown as { text?: string };
        const text = typedWindow.text ?? window.caption;

        const tw = window as unknown as ITextWindowShape;

        // Flash's TextField draws its own 1px border, and AS3 gets it here for
        // free: draw() blits the whole live TextField into the window's buffer
        // (`param2.draw(_loc8_, ...)`), border included. This port has no
        // TextField — it strokes the glyphs itself below — so the border has to be
        // drawn explicitly, or every layout field that asks for one renders as a
        // bare fill: room settings' name/description/tags, the group wizard's
        // name/description, and every other `<var key="border">` input.
        //
        // Before the empty-text return, because AS3 blits the field whatever it
        // holds: an empty bordered field still has its border.
        this.drawBorder(tw, ctx, rect);

        if(!text) return;

        const fontSize = tw.fontSize ?? 12;
        const fontFace = tw.fontFace || 'Ubuntu, Arial, sans-serif';
        const isBold = tw.bold ?? false;
        const isItalic = tw.italic ?? false;

        // Text color from TextController.textColor (defaults to 0x000000 = black)
        const textColor = tw.textColor ?? 0x000000;
        const r = (textColor >> 16) & 0xFF;
        const g = (textColor >> 8) & 0xFF;
        const b = textColor & 0xFF;

        // Build CSS font string
        const fontStr = buildCanvasFontString(fontSize, fontFace, isBold, isItalic);

        ctx.font = fontStr;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.textBaseline = 'top';

        // Resolve the atlas before the first measurement: with
        // gridFitType="pixel" it rounds advances, so measuring any other way
        // would disagree with what gets drawn.
        this.useAtlas(tw, fontStr, fontSize);

        // Margins from TextController
        const marginL = tw.marginLeft ?? tw._marginLeft ?? 2;
        const isDropListTitleText = window.name === '_DROPLIST_TITLETEXT';
        const isDropListButtonText = window.name === '_BTN_TEXT'
			&& (window.parent?.type === WindowType.DROPMENU_ITEM || window.parent?.type === WindowType.DROPLIST_ITEM);
        const isCompactDropListText = isDropListTitleText || isDropListButtonText;
        const marginT = isCompactDropListText
            ? 0
            : tw.marginTop ?? tw._marginTop ?? 2;
        const marginR = tw.marginRight ?? tw._marginRight ?? 2;
        const marginB = isCompactDropListText
            ? 0
            : tw.marginBottom ?? tw._marginBottom ?? 2;
        const autoSize = (tw.autoSize ?? tw._autoSize ?? 'none').toLowerCase();
        const spacing = tw.spacing ?? tw._spacing ?? 0;
        const leading = tw.leading ?? tw._leading ?? 0;

        // See FLASH_TEXT_FIELD_LEFT_GUTTER: editable fields only, for now. Taking
        // it out of maxWidth as well as adding it to the origin keeps the line's
        // right-hand clip exactly where it was, so nothing that fitted before is
        // cut off now — only the start moves inwards, off the border.
        const flashTextFieldLeftGutter = (type === WindowType.TEXTFIELD || type === WindowType.PASSWORD)
            ? TextSkinRenderer.FLASH_TEXT_FIELD_LEFT_GUTTER
            : 0;
        const textLeft = absX + marginL + flashTextFieldLeftGutter;
        const maxWidth = w - marginL - marginR - flashTextFieldLeftGutter;
        // Every text window, as Flash does — no longer editable-only.
        //
        // It WAS editable-only, and for a good reason at the time: applied to every window it
        // pushed non-editable captions 2px down, and since the box was only as tall as the line
        // box those 2px came off the bottom and took the descenders with them ("Settings" read
        // "Settinas", 42 of ros_room_settings_xml's 79 text windows clipped by exactly 2px).
        //
        // That was half the model. The box is now the line box plus BOTH gutters — Flash's own
        // line metrics, recovered from the authored layouts by
        // scripts/extract-flash-text-metrics.mjs — so offsetting by the top gutter leaves the
        // bottom one intact instead of eating it. Measured over three windows, every auto-sized
        // box now matches its authored height exactly, which is the room this offset needs.
        const flashTextFieldTopGutter = this.topGutter;

        if(maxWidth <= 0) return;

        // Determine display text
        let displayText = text;

        // TextController.measureLayout() collapses whitespace under this flag before it measures,
        // so the box is sized for the collapsed string; drawing the raw one made the line wider
        // than the box that was sized for it. One shipped layout sets it.
        // Caveat, shared with the controller: collapsing shifts character indices, so a field that
        // combined condense_white with format runs would misalign them. None does.
        if(tw.condenseWhite ?? tw._condenseWhite ?? false)
        {
            displayText = displayText.replace(/\s+/g, ' ');
        }

        if(type === WindowType.PASSWORD)
        {
            displayText = '•'.repeat(text.length);
        }

        if(isCompactDropListText)
        {
            ctx.textBaseline = 'alphabetic';
        }

        // Etching (shadow text) support for il_* styles. AS3 gates on the etch
        // colour's alpha byte: `(etchingColor & 0xFF000000) != 0`.
        const etchColor = tw.etchingColor ?? 0;
        const hasEtching = etchColor !== 0 && ((etchColor >>> 24) & 0xFF) > 0;

        // Duck-typed per-range TextFormat overrides from TextController (chat-message links, and
        // <b>/<i>/<u> runs from FormattedTextController's HTML-lite parser).
        //
        // Read HERE rather than just before the single-line draw, which is where it used to sit:
        // the link/underline branch and the multiline branch both `return` before that point, so
        // both drew formatted text with no formatting at all. `catalog.search.results` is
        // `<b>%count% items</b> were found...` in a wrapping field and rendered entirely regular.
        const formatRuns = (window as unknown as { formatRuns?: ReadonlyArray<ITextFormatRun> }).formatRuns ?? [];
        const runContext = formatRuns.length > 0
            ? {runs: formatRuns, fontFace, bold: isBold, italic: isItalic, fillStyle: `rgb(${r},${g},${b})`}
            : null;

        // Underline support for link windows
        if(type === WindowType.LINK || tw.underline)
        {
            ctx.save();

            const measuredWidth = this.measureTextWidth(ctx, displayText, spacing);
            const textW = Math.min(measuredWidth, maxWidth);
            const textX = this.resolveAlignedTextX(textLeft, maxWidth, measuredWidth, autoSize);
            const textY = absY + marginT + flashTextFieldTopGutter;

            if(hasEtching)
            {
                this.drawEtching(ctx, displayText, textX, textY, maxWidth, etchColor, tw.etchingPosition, spacing);
            }

            if(runContext)
            {
                this.drawTextLineWithRuns(ctx, displayText, runContext.runs, textX, textY, maxWidth, spacing, fontSize, runContext.fontFace, runContext.bold, runContext.italic, runContext.fillStyle);
            }
            else
            {
                this.drawTextLine(ctx, displayText, textX, textY, maxWidth, spacing);
            }

            // Draw underline
            const underlineY = textY + fontSize + 1;

            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(textX, underlineY);
            ctx.lineTo(textX + textW, underlineY);
            ctx.stroke();
            ctx.restore();

            return;
        }

        // Multiline / word-wrap rendering
        //
        // Editable fields wrap too: Flash's TextField lays out its text from
        // `multiline`/`wordWrap` alone, with no regard for whether the user can
        // type into it, and the layouts rely on it — `group_management_window`'s
        // `desc_txt` is an 80px-tall `<input>` with `word_wrap`, i.e. four lines
        // of description. Leaving TEXTFIELD out of this test drew it as one line
        // clipped at the right edge.
        if((tw.multiline || tw.wordWrap)
			&& (type === WindowType.TEXT || type === WindowType.FORMATTED_TEXT || type === WindowType.HTML || type === WindowType.TEXTFIELD))
        {
            this.compositeTextMultiline(
                ctx,
                displayText,
                textLeft,
                absY + marginT + flashTextFieldTopGutter,
                maxWidth,
                h - marginT - marginB - flashTextFieldTopGutter,
                fontSize,
                tw.wordWrap ?? false,
                hasEtching ? etchColor : 0,
                tw.etchingPosition,
                spacing,
                leading,
                autoSize,
                runContext,
                tw.maxLines ?? tw._maxLines ?? 0
            );

            return;
        }

        const measuredWidth = this.measureTextWidth(ctx, displayText, spacing);
        const textX = this.resolveAlignedTextX(textLeft, maxWidth, measuredWidth, autoSize);
        const textY = isCompactDropListText
            ? this.resolveCompactDropListTextY(ctx, displayText, absY, h, fontSize)
            : absY + marginT + flashTextFieldTopGutter;
        const clipY = isCompactDropListText ? absY : undefined;
        const clipHeight = isCompactDropListText ? h : undefined;

        if(hasEtching)
        {
            this.drawEtching(ctx, displayText, textX, textY, maxWidth, etchColor, tw.etchingPosition, spacing, clipY, clipHeight);
        }

        if(runContext)
        {
            this.drawTextLineWithRuns(ctx, displayText, runContext.runs, textX, textY, maxWidth, spacing, fontSize, runContext.fontFace, runContext.bold, runContext.italic, runContext.fillStyle, clipY, clipHeight);
        }
        else
        {
            this.drawTextLine(ctx, displayText, textX, textY, maxWidth, spacing, clipY, clipHeight);
        }
    }

    /**
	 * Strokes the field's Flash `border` in its `borderColor`.
	 *
	 * TS-only in the same sense the rest of this class is: AS3 never draws a
	 * border because Flash's TextField has already drawn one into the bitmap
	 * draw() blits. The colour is Flash's `TextField.borderColor`, a plain RGB
	 * uint with no alpha byte — so it is always opaque, and its default (0) is
	 * black, which is what the layouts that set only `border` expect.
	 *
	 * Half-pixel offsets keep the 1px stroke on whole pixels instead of
	 * straddling two, and the inset matches Flash: the border is drawn INSIDE the
	 * field's bounds, not around them.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setBorder()
    protected drawBorder(
        tw: ITextWindowShape,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number }
    ): void
    {
        if(tw.border !== true || rect.width < 1 || rect.height < 1) return;

        const color = (tw.borderColor ?? 0) & 0xFFFFFF;
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;

        ctx.save();
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
        ctx.restore();
    }

    /**
	 * Renders multiline text with optional word wrapping.
	 *
	 * TS-only: Flash's TextField wraps its own text before AS3's draw() ever
	 * sees it.
	 */
    protected compositeTextMultiline(
        ctx: OffscreenCanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        maxHeight: number,
        fontSize: number,
        wordWrap: boolean,
        etchingColor: number = 0,
        etchingPosition?: string,
        spacing: number = 0,
        leading: number = 0,
        autoSize: string = 'none',
        runContext: IRunDrawContext | null = null,
        maxLines: number = 0
    ): void
    {
        // Must be the SAME line height the controller sized the box with
        // (TextController.getLineHeight() → measureFontLineHeight()). This used
        // to be `fontSize + 2 + leading`, an approximation with nothing behind
        // it: for Volter 9px the font's own metrics give 11.02px (ascender
        // 1024, descender -230, unitsPerEm 1024) and so a 12px line, while the
        // guess gave 11 — the controller sized a multiline box at 12px per line
        // and this loop then stacked them every 11px, drifting the text a pixel
        // per line up inside its own box.
        // The tallest size any run asks for, because a line has to clear its biggest glyph.
        // Field-wide rather than per line: a multiline field that mixes sizes gets uniform lines
        // at the largest, which is roomier than Flash but never cuts. TextController.getLineHeight()
        // takes the same measure, and the two have to agree or the box holds the wrong count.
        let runFontSize = fontSize;

        for(const run of runContext?.runs ?? [])
        {
            if(run.format.size != null && run.format.size > runFontSize) runFontSize = run.format.size;
        }

        const lineHeight = Math.max(1, measureFontLineHeight(ctx, runFontSize, leading));
        const lines = text.split('\n');
        let currentY = y;
        const hasEtching = etchingColor !== 0 && ((etchingColor >>> 24) & 0xFF) > 0;

        // Where the line about to be drawn starts inside `text`, which is the coordinate space the
        // format runs are expressed in. Walked with indexOf from a cursor, the same way
        // TextController.measureLayout() recovers it - split and wrapped lines are substrings of
        // `text`, in order.
        let cursor = 0;
        const offsetOf = (line: string): number =>
        {
            const found = line.length > 0 ? text.indexOf(line, cursor) : -1;
            const start = found === -1 ? cursor : found;

            cursor = start + line.length;

            return start;
        };

        // Lines already drawn, against `maxLines`. TextController.measureLayout() truncates its
        // measured line list to this, so the box is sized for that many; without the same cap here
        // the surplus lines were drawn anyway and merely cut by the box edge.
        let drawn = 0;

        const measureOne = (line: string, offset: number): number => runContext
            ? this.measureRunTextWidth(ctx, line, spacing, runContext.runs, fontSize, runContext.fontFace, runContext.bold, runContext.italic, offset)
            : this.measureTextWidth(ctx, line, spacing);

        const drawOne = (line: string, offset: number): void =>
        {
            const measuredWidth = measureOne(line, offset);
            const drawX = this.resolveAlignedTextX(x, maxWidth, measuredWidth, autoSize);

            if(hasEtching)
            {
                this.drawEtching(ctx, line, drawX, currentY, maxWidth, etchingColor, etchingPosition, spacing);
            }

            if(runContext)
            {
                this.drawTextLineWithRuns(ctx, line, runContext.runs, drawX, currentY, maxWidth, spacing, fontSize, runContext.fontFace, runContext.bold, runContext.italic, runContext.fillStyle, undefined, undefined, offset);
            }
            else
            {
                this.drawTextLine(ctx, line, drawX, currentY, maxWidth, spacing);
            }

            currentY += lineHeight;
            drawn++;
        };

        for(const line of lines)
        {
            if(this.isLineBelowBox(currentY, y, maxHeight) || (maxLines > 0 && drawn >= maxLines))
            {
                break;
            }

            // Peeked, not consumed: if the line wraps, its pieces claim the offsets instead.
            const peeked = text.indexOf(line, cursor);

            if(wordWrap && measureOne(line, peeked === -1 ? cursor : peeked) > maxWidth)
            {
                for(const wrappedLine of this.wrapLine(ctx, line, maxWidth, spacing))
                {
                    if(this.isLineBelowBox(currentY, y, maxHeight) || (maxLines > 0 && drawn >= maxLines))
                    {
                        break;
                    }

                    drawOne(wrappedLine, offsetOf(wrappedLine));
                }
            }
            else
            {
                drawOne(line, offsetOf(line));
            }
        }
    }

    /**
	 * Whether a line starts past the bottom of the text box, and so is not drawn.
	 *
	 * TS-only, like compositeTextMultiline() above: AS3 has no line loop to bound,
	 * because Flash's TextField has already laid the text out by the time draw()
	 * blits it.
	 *
	 * Flash never drops a line for being too tall: the TextField renders its text
	 * and clips whatever runs past its bounds, and AS3's draw() blits that bitmap
	 * whole with no height test of its own. So the only thing worth skipping here
	 * is a line that begins below the box; a line that merely fails to fit gets
	 * drawn and clipped by the buffer, exactly as Flash does.
	 *
	 * This used to require a whole `lineHeight` to fit (`currentY + lineHeight >
	 * y + maxHeight`), which no single-line autoSize field could ever satisfy:
	 * TextController sizes such a field to exactly `lines.length *
	 * getLineHeight()` and makes no allowance for the top gutter, while this
	 * renderer starts at `marginTop + gutter` *and* subtracts the gutter from the
	 * height it measures against — leaving it about 2px short of its own
	 * requirement, every time. The line was dropped, the buffer stayed empty, and
	 * the field rendered nothing at all while reporting correct text, geometry and
	 * colour. That is why furniture names were blank in the inventory: the name
	 * reached furni_name intact and was thrown away here.
	 */
    protected isLineBelowBox(currentY: number, boxY: number, maxHeight: number): boolean
    {
        return currentY >= boxY + maxHeight;
    }

    /**
	 * Resolves the X of a line under AS3's `autoSize` alignment.
	 *
	 * AS3 does this inline in draw() against the TextField's own measured
	 * width: `tx = floor(width - textField.width - margins.right)` for "right",
	 * `tx = floor(width/2 - textField.width/2)` for "center".
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/TextSkinRenderer.as::draw()
    protected resolveAlignedTextX(
        baseX: number,
        maxWidth: number,
        textWidth: number,
        autoSize: string
    ): number
    {
        if(autoSize === 'center')
        {
            return baseX + Math.max(0, Math.floor((maxWidth - textWidth) / 2));
        }

        if(autoSize === 'right')
        {
            return baseX + Math.max(0, Math.floor(maxWidth - textWidth));
        }

        return baseX;
    }

    /**
	 * Resolves the glyph atlas for the window being drawn, and the quality
	 * settings its sibling atlases (bold/italic format runs) must share.
	 *
	 * The four settings are Flash's, read off the window exactly as the rest of
	 * draw() reads its style: AS3 hands them to `flash.text.TextField`, which
	 * rasterises accordingly (`TextController.as::setAntiAliasType()` and
	 * friends). Their defaults are AS3's too — `advanced` + `pixel`, sharpness
	 * and thickness 0 (`TextController.as` ctor, l.82-90, and the style
	 * resolution at l.554-566).
	 */
    // TS-only: no AS3 counterpart — Flash's TextField owns this step.
    protected useAtlas(tw: ITextWindowShape, fontString: string, fontSize: number): void
    {
        const aa = tw.antiAliasType ?? tw._antiAliasType ?? 'advanced';

        if(!GlyphAtlas.handles(aa))
        {
            this._atlas = null;
            this._textQuality = null;

            return;
        }

        this._textQuality = {
            aa,
            sharpness: tw.sharpness ?? tw._sharpness ?? 0,
            thickness: tw.thickness ?? tw._thickness ?? 0,
            gridFit: tw.gridFitType ?? tw._gridFitType ?? 'pixel',
        };

        this._atlas = this.atlasFor(fontString, fontSize);
    }

    // TS-only: resolves a sibling atlas under the current quality settings.
    protected atlasFor(fontString: string, fontSize: number): GlyphAtlas | null
    {
        const quality = this._textQuality;

        if(!quality || !GlyphAtlas.handles(quality.aa)) return null;

        return GlyphAtlas.get(fontString, fontSize, quality.aa, quality.sharpness, quality.thickness, quality.gridFit);
    }

    // TS-only: Flash's TextField measures itself; Canvas2D has to be asked.
    protected measureTextWidth(
        ctx: OffscreenCanvasRenderingContext2D,
        text: string,
        spacing: number
    ): number
    {
        if(!text)
        {
            return 0;
        }

        // Must come from the atlas when one is in use: it is the thing that
        // decides the advances actually walked in drawText().
        if(this._atlas)
        {
            return this._atlas.measure(text, spacing);
        }

        if(spacing === 0 || text.length <= 1)
        {
            return ctx.measureText(text).width;
        }

        // With letter-spacing on, drawTextLine() walks the line one character at a time and adds
        // `spacing` after each advance. Measuring `measureText(wholeLine)` instead asks the shaper
        // for a kerned width, which is SHORTER than the sum of the individual advances - so the
        // box came out narrower than the line drawn into it and the tail was clipped. Summing the
        // same advances the draw walks is the only way the two agree.
        // Real users of a non-zero spacing: catalog_promo_xml / campaign_promo_xml (-0.6).
        let width = 0;

        for(let i = 0; i < text.length; i++)
        {
            width += ctx.measureText(text.charAt(i)).width;
        }

        return width + ((text.length - 1) * spacing);
    }

    /**
	 * Width of a formatted line, summed the way drawTextLineWithRuns() walks it.
	 *
	 * The plain measureTextWidth() above measures in the field's base font, which is narrower
	 * wherever a run turns the text bold. Wrapping on that number breaks the lines in different
	 * places than TextController.measureLayout() did when it sized the box, and the box then holds
	 * the wrong number of lines.
	 */
    // TS-only: mirrors TextController.measureFormattedLineWidth(); Flash's TextField measured its
    // own formatted text.
    protected measureRunTextWidth(
        ctx: OffscreenCanvasRenderingContext2D,
        text: string,
        spacing: number,
        runs: ReadonlyArray<ITextFormatRun>,
        fontSize: number,
        fontFace: string,
        baseBold: boolean,
        baseItalic: boolean,
        offset: number
    ): number
    {
        if(!text) return 0;

        const baseFontStr = buildCanvasFontString(fontSize, fontFace, baseBold, baseItalic);
        let currentFontStr = baseFontStr;
        let width = 0;

        ctx.save();
        ctx.font = currentFontStr;

        for(let i = 0; i < text.length; i++)
        {
            const run = runs.find((r) => offset + i >= r.start && offset + i < r.end);
            const runFontSize = run?.format.size ?? fontSize;
            const runFontStr = run
                ? buildCanvasFontString(runFontSize, fontFace, run.format.bold ?? baseBold, run.format.italic ?? baseItalic)
                : baseFontStr;
            const runAtlas = this._atlas ? this.atlasFor(runFontStr, runFontSize) : null;

            if(runAtlas)
            {
                width += runAtlas.measure(text.charAt(i), 0);

                continue;
            }

            if(runFontStr !== currentFontStr)
            {
                ctx.font = runFontStr;
                currentFontStr = runFontStr;
            }

            width += ctx.measureText(text.charAt(i)).width;
        }

        ctx.restore();

        if(spacing !== 0 && text.length > 1) width += (text.length - 1) * spacing;

        return width;
    }

    // TS-only: compensates for Flash TextField's internal padding on the
    // compact droplist rows, which the layouts were authored around.
    protected resolveCompactDropListTextY(
        ctx: OffscreenCanvasRenderingContext2D,
        text: string,
        top: number,
        height: number,
        fontSize: number
    ): number
    {
        const metrics = ctx.measureText(text || 'Hg');
        const ascent = metrics.actualBoundingBoxAscent || Math.ceil(fontSize * 0.75);
        const descent = metrics.actualBoundingBoxDescent || Math.ceil(fontSize * 0.25);
        const textHeight = ascent + descent;
        const safeHeight = Math.max(1, height);

        if(textHeight <= safeHeight)
        {
            const flashTextFieldInnerOffset = 2;
            const centeredBaseline = top + ((safeHeight - textHeight) / 2) + ascent;
            const bottomSafeBaseline = top + safeHeight - descent;

            return Math.floor(Math.min(centeredBaseline + flashTextFieldInnerOffset, bottomSafeBaseline));
        }

        return Math.floor(top + safeHeight - descent);
    }

    /**
     * How far left of the pen the line may reach, so the clip does not shave
     * it off.
     *
     * The atlas draws a whole rendered string as one bitmap whose pen sits a
     * couple of pixels inside it, so a clip that starts exactly at the pen cuts
     * the first glyph — which is what took the "P" off the navigator's first
     * tab and left it reading "ublic". Zero when the atlas is not drawing,
     * because `fillText()` starts at the pen.
     */
    // TS-only: Flash clipped inside the TextField itself; this is the Canvas2D
    // port's equivalent, and the overhang is this port's own.
    protected get clipOverhang(): number
    {
        return this._atlas ? GlyphAtlas.overhangLeft : 0;
    }

    // TS-only: replaces Flash's own glyph stroking.
    protected drawTextLine(
        ctx: OffscreenCanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        spacing: number,
        clipY?: number,
        clipHeight?: number
    ): void
    {
        if(!text)
        {
            return;
        }

        const resolvedClipY = clipY ?? y - 2;
        const resolvedClipHeight = clipHeight ?? 4096;

        if(this._atlas)
        {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x - this.clipOverhang, resolvedClipY, maxWidth + this.clipOverhang, resolvedClipHeight);
            ctx.clip();

            // With no spacing the clip alone bounds the line, exactly as the
            // fillText path below does; with spacing the loop stops at the box
            // edge instead, which is the behaviour that path already had.
            this._atlas.drawText(
                ctx, text, x, y, ctx.fillStyle as string, spacing,
                spacing === 0 ? Number.POSITIVE_INFINITY : x + maxWidth
            );
            ctx.restore();

            return;
        }

        if(spacing === 0)
        {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x - this.clipOverhang, resolvedClipY, maxWidth + this.clipOverhang, resolvedClipHeight);
            ctx.clip();
            ctx.fillText(text, x, y);
            ctx.restore();

            return;
        }

        let drawX = x;
        const maxX = x + maxWidth;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x - this.clipOverhang, resolvedClipY, maxWidth + this.clipOverhang, resolvedClipHeight);
        ctx.clip();

        for(let i = 0; i < text.length; i++)
        {
            const char = text.charAt(i);
            const charWidth = ctx.measureText(char).width;

            if(drawX + charWidth > maxX)
            {
                break;
            }

            ctx.fillText(char, drawX, y);
            drawX += charWidth + spacing;
        }

        ctx.restore();
    }

    /**
	 * Per-character variant of drawTextLine() that applies a per-range color/
	 * underline override where a format run covers the character, and the
	 * base fill style everywhere else. Always walks character-by-character
	 * (unlike drawTextLine()'s spacing===0 fast path) since every char needs
	 * an independent run lookup.
	 *
	 * Driven by RoomChatItem.applyMessageLinks()'s TextController.setTextFormat()
	 * calls (AS3: sources/win63_version/habbo/ui/widget/roomchat/RoomChatItem.as::renderView(),
	 * the links/var_1993 branch).
	 */
    // TS-only: no AS3 equivalent — Flash's native TextField renders per-range
    // TextFormat runs itself; this is the Canvas2D port's replacement.
    protected drawTextLineWithRuns(
        ctx: OffscreenCanvasRenderingContext2D,
        text: string,
        runs: ReadonlyArray<ITextFormatRun>,
        x: number,
        y: number,
        maxWidth: number,
        spacing: number,
        fontSize: number,
        fontFace: string,
        baseBold: boolean,
        baseItalic: boolean,
        baseFillStyle: string,
        clipY?: number,
        clipHeight?: number,
        offset: number = 0
    ): void
    {
        if(!text) return;

        const resolvedClipY = clipY ?? y - 2;
        const resolvedClipHeight = clipHeight ?? 4096;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x - this.clipOverhang, resolvedClipY, maxWidth + this.clipOverhang, resolvedClipHeight);
        ctx.clip();

        let drawX = x;
        const maxX = x + maxWidth;
        const baseFontStr = buildCanvasFontString(fontSize, fontFace, baseBold, baseItalic);
        let currentFontStr = baseFontStr;

        ctx.font = currentFontStr;

        for(let i = 0; i < text.length; i++)
        {
            const char = text.charAt(i);
            // The runs index into the whole text, not into this line: a wrapped line that starts
            // 40 characters in has to look its formats up at 40 + i.
            const run = runs.find((r) => offset + i >= r.start && offset + i < r.end);
            // `<font size>` sets its own size for the run; everything else keeps the field's.
            const runFontSize = run?.format.size ?? fontSize;
            const runFontStr = run
                ? buildCanvasFontString(runFontSize, fontFace, run.format.bold ?? baseBold, run.format.italic ?? baseItalic)
                : baseFontStr;

            if(runFontStr !== currentFontStr)
            {
                ctx.font = runFontStr;
                currentFontStr = runFontStr;
            }

            // A bold/italic/resized run is a different face, so it is a different
            // atlas — resolved under the same quality settings as the base one.
            const runAtlas = this._atlas ? this.atlasFor(runFontStr, runFontSize) : null;
            const charWidth = runAtlas ? runAtlas.measure(char, 0) : ctx.measureText(char).width;

            if(drawX + charWidth > maxX) break;

            const fillStyle = (run?.format.color != null) ? this.colorToRgbString(run.format.color) : baseFillStyle;

            ctx.fillStyle = fillStyle;

            if(runAtlas) runAtlas.drawText(ctx, char, drawX, y, fillStyle, 0);
            else ctx.fillText(char, drawX, y);

            if(run?.format.underline)
            {
                ctx.strokeStyle = fillStyle;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(drawX, y + fontSize + 1);
                ctx.lineTo(drawX + charWidth, y + fontSize + 1);
                ctx.stroke();
            }

            drawX += charWidth + spacing;
        }

        ctx.restore();
    }

    // TS-only: small ARGB->CSS helper shared by drawTextLineWithRuns().
    protected colorToRgbString(color: number): string
    {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;

        return `rgb(${r},${g},${b})`;
    }

    // TS-only: Flash's TextField wraps its own text.
    protected wrapLine(
        ctx: OffscreenCanvasRenderingContext2D,
        line: string,
        maxWidth: number,
        spacing: number
    ): string[]
    {
        if(!line)
        {
            return [''];
        }

        const words = line.split(' ');
        const out: string[] = [];
        let current = '';

        for(const word of words)
        {
            const candidate = current ? `${current} ${word}` : word;

            if(this.measureTextWidth(ctx, candidate, spacing) <= maxWidth || !current)
            {
                current = candidate;
            }
            else
            {
                out.push(current);
                current = word;
            }

            if(this.measureTextWidth(ctx, current, spacing) > maxWidth)
            {
                const broken = this.wrapLongWord(ctx, current, maxWidth, spacing);

                if(broken.length > 0)
                {
                    out.push(...broken.slice(0, broken.length - 1));
                    current = broken[broken.length - 1];
                }
            }
        }

        if(current)
        {
            out.push(current);
        }

        return out;
    }

    // TS-only: Flash's TextField breaks its own over-long words.
    protected wrapLongWord(
        ctx: OffscreenCanvasRenderingContext2D,
        word: string,
        maxWidth: number,
        spacing: number
    ): string[]
    {
        const out: string[] = [];
        let current = '';

        for(let i = 0; i < word.length; i++)
        {
            const next = current + word.charAt(i);

            if(this.measureTextWidth(ctx, next, spacing) <= maxWidth || !current)
            {
                current = next;
            }
            else
            {
                out.push(current);
                current = word.charAt(i);
            }
        }

        if(current)
        {
            out.push(current);
        }

        return out;
    }

    /**
	 * Draws the etched (embossed) copy of the text, offset by the entry
	 * `SkinRenderer.ETCHING_POSITION` holds for `position`.
	 *
	 * AS3 achieves this by blitting the same TextField a second time through a
	 * `ColorTransform(0,0,0,1,255,255,255,0)` — RGB multipliers zeroed, offsets
	 * set to the etch colour — which flattens the glyphs to a single-colour
	 * silhouette. Canvas2D reaches the same result by re-stroking the text in
	 * the etch colour, so the transform has no counterpart here.
	 *
	 * Skipping when the position is not a known key is AS3's behaviour too
	 * (`if(_loc9_ != null)`), not a defensive guard: an unrecognised
	 * etching-position name means no etch at all, not a fallback direction.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/TextSkinRenderer.as::draw()
    protected drawEtching(
        ctx: OffscreenCanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        color: number,
        position?: string,
        spacing: number = 0,
        clipY?: number,
        clipHeight?: number
    ): void
    {
        const offset = TextSkinRenderer.ETCHING_POSITION[position ?? ''];

        if(!offset) return;

        const a = ((color >>> 24) & 0xFF) / 255;
        const er = (color >> 16) & 0xFF;
        const eg = (color >> 8) & 0xFF;
        const eb = color & 0xFF;

        const prevFill = ctx.fillStyle;

        ctx.fillStyle = `rgba(${er},${eg},${eb},${a})`;
        this.drawTextLine(ctx, text, x + offset.x, y + offset.y, maxWidth, spacing, clipY, clipHeight);
        ctx.fillStyle = prevFill;
    }
}
