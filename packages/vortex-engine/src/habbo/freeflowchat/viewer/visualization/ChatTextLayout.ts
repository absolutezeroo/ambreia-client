/**
 * ChatTextLayout
 *
 * Canvas-based rich-text layout/draw for chat bubbles - the freeflowchat
 * viewer builds bubbles as raw Sprites (see ChatBubble.as/PooledChatBubble.as),
 * not the IWindow/TextController layout-tree system @core/window/components
 * uses elsewhere in this port, so it needs its own small text renderer. Reuses
 * the same canvas-font primitives TextController itself uses
 * (buildCanvasFontString/measureFontLineHeight) rather than re-deriving them.
 *
 * AS3's Flash TextField/StyleSheet renders real inline HTML (`<b>`/`<i>`/`<a>`)
 * natively; this port has no such primitive (the window system's own
 * HTMLTextController already reduces HTML down to plain text + line breaks for
 * the same reason - see its header comment). Rather than build/parse an HTML
 * string only to strip it again, chat bubbles are composed directly as a flat
 * list of styled runs (bold/italic/color/underline), which is exactly what
 * ChatBubbleFactory's AS3 HTML-string construction reduces to anyway (no
 * nested tags occur in practice - italic wraps the whole message, bold wraps
 * either the username prefix or a shout, never both nested).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/visualization/ChatBubble.as
 */
import {quoteFontFamilyList, measureFontLineHeight} from '@core/window/utils/CanvasFontString';

export interface IChatTextRun
{
    readonly text: string;
    readonly bold: boolean;
    readonly italic: boolean;
    readonly color: number;
    readonly underline: boolean;
    /** Set for a link run - the URL a click should navigate to. */
    readonly url?: string;
}

interface IPlacedRun
{
    readonly run: IChatTextRun;
    readonly text: string;
    readonly x: number;
    readonly width: number;
}

export interface IChatTextLayout
{
    readonly lines: readonly (readonly IPlacedRun[])[];
    readonly width: number;
    readonly height: number;
    readonly lineHeight: number;
}

function fontKey(run: IChatTextRun, fontFace: string, fontSize: number): string
{
    return `${run.bold ? 1 : 0}${run.italic ? 1 : 0}${fontFace}${fontSize}`;
}

/**
 * Word-wraps a flat list of styled runs to `maxWidth`, splitting on spaces
 * (matching Flash TextField's default word-wrap - individual runs never
 * break mid-word). Returns per-line placed runs with local x offsets ready
 * to draw, plus the overall measured content box.
 */
export function layoutChatText(
    ctx: OffscreenCanvasRenderingContext2D,
    runs: readonly IChatTextRun[],
    fontFace: string,
    fontSize: number,
    maxWidth: number
): IChatTextLayout
{
    const fontCache = new Map<string, string>();
    const fontFor = (run: IChatTextRun): string =>
    {
        const key = fontKey(run, fontFace, fontSize);
        let font = fontCache.get(key);

        if(!font)
        {
            font = `${run.italic ? 'italic ' : ''}${run.bold ? 'bold ' : ''}${fontSize}px ${quoteFontFamilyList(fontFace)}`;
            fontCache.set(key, font);
        }

        return font;
    };

    ctx.font = fontFor({bold: false, italic: false} as IChatTextRun);

    const lineHeight = measureFontLineHeight(ctx, fontSize);
    const lines: IPlacedRun[][] = [[]];
    let lineWidth = 0;
    let maxLineWidth = 0;

    const pushWord = (run: IChatTextRun, word: string): void =>
    {
        if(word.length === 0) return;

        ctx.font = fontFor(run);

        const width = ctx.measureText(word).width;

        if(lineWidth > 0 && lineWidth + width > maxWidth)
        {
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
            lines.push([]);
            lineWidth = 0;
        }

        const currentLine = lines[lines.length - 1];
        const previous = currentLine[currentLine.length - 1];

        // Merge consecutive words of the same run so drawing/underlining treats
        // them as one continuous span (matches how a single <b>/<i> run reads).
        if(previous && previous.run === run)
        {
            currentLine[currentLine.length - 1] = {run, text: previous.text + word, x: previous.x, width: previous.width + width};
        }
        else
        {
            currentLine.push({run, text: word, x: lineWidth, width});
        }

        lineWidth += width;
    };

    for(const run of runs)
    {
        const segments = run.text.split(/(\s+)/);

        for(const segment of segments)
        {
            if(segment.length === 0) continue;

            if(/^\s+$/.test(segment))
            {
                ctx.font = fontFor(run);

                const spaceWidth = ctx.measureText(segment).width;
                const currentLine = lines[lines.length - 1];
                const previous = currentLine[currentLine.length - 1];

                // Attach the space to the preceding placed run's text so a
                // same-run merge in pushWord() below doesn't concatenate the
                // next word directly onto this one with no space between them.
                // A line-leading space (no `previous`) is dropped, matching
                // normal word-wrap behavior.
                if(previous)
                {
                    currentLine[currentLine.length - 1] = {run: previous.run, text: previous.text + segment, x: previous.x, width: previous.width + spaceWidth};
                }

                lineWidth += spaceWidth;
                continue;
            }

            pushWord(run, segment);
        }
    }

    maxLineWidth = Math.max(maxLineWidth, lineWidth);

    return {
        lines,
        width: Math.ceil(maxLineWidth),
        height: Math.ceil(lineHeight * lines.length),
        lineHeight
    };
}

/** Draws a previously computed layout onto a 2D context, top-left at (0, 0). */
export function drawChatText(
    ctx: OffscreenCanvasRenderingContext2D,
    layout: IChatTextLayout,
    fontFace: string,
    fontSize: number
): void
{
    ctx.textBaseline = 'top';

    for(let i = 0; i < layout.lines.length; i++)
    {
        const y = i * layout.lineHeight;

        for(const placed of layout.lines[i])
        {
            const {run} = placed;

            ctx.font = `${run.italic ? 'italic ' : ''}${run.bold ? 'bold ' : ''}${fontSize}px ${quoteFontFamilyList(fontFace)}`;
            ctx.fillStyle = `#${(run.color & 0xFFFFFF).toString(16).padStart(6, '0')}`;
            ctx.fillText(placed.text, placed.x, y);

            if(run.underline)
            {
                const underlineY = y + fontSize + 1;

                ctx.beginPath();
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 1;
                ctx.moveTo(placed.x, underlineY);
                ctx.lineTo(placed.x + placed.width, underlineY);
                ctx.stroke();
            }
        }
    }
}

interface IStyledSpan
{
    readonly text: string;
    readonly bold: boolean;
    readonly italic: boolean;
    readonly underline: boolean;
    readonly color: number | null;
}

const MARKUP_TAG_RE = /<(\/?)(b|i|u|font)(?:\s+color="(#[0-9A-Fa-f]{6})")?>/g;

/**
 * Splits text containing the inline tags ChatMarkup.applyToElements()/
 * applyColourToChat() produce (`<b>`, `<i>`, `<u>`, `<font color="#hex">`)
 * into plain-text spans with resolved bold/italic/underline/color state -
 * this port's stand-in for handing that markup to a real HTML text
 * component (see this file's header). Unknown/malformed tags are left as
 * literal text rather than throwing, matching AS3's tolerant TextField HTML
 * parsing.
 */
function parseInlineMarkup(text: string): IStyledSpan[]
{
    const spans: IStyledSpan[] = [];
    const stack: {tag: string; color: string | null}[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const currentStyle = (): {bold: boolean; italic: boolean; underline: boolean; color: number | null} =>
    {
        let bold = false;
        let italic = false;
        let underline = false;
        let color: number | null = null;

        for(const entry of stack)
        {
            if(entry.tag === 'b') bold = true;
            else if(entry.tag === 'i') italic = true;
            else if(entry.tag === 'u') underline = true;
            else if(entry.tag === 'font' && entry.color) color = Number(entry.color.replace('#', '0x'));
        }

        return {bold, italic, underline, color};
    };

    const pushSpan = (segment: string): void =>
    {
        if(segment.length === 0) return;

        spans.push({text: segment, ...currentStyle()});
    };

    MARKUP_TAG_RE.lastIndex = 0;

    while((match = MARKUP_TAG_RE.exec(text)) !== null)
    {
        pushSpan(text.slice(lastIndex, match.index));
        lastIndex = MARKUP_TAG_RE.lastIndex;

        const [, closing, tag, color] = match;

        if(closing)
        {
            const openIndex = stack.map((entry) => entry.tag).lastIndexOf(tag);

            if(openIndex !== -1) stack.splice(openIndex, 1);
        }
        else
        {
            stack.push({tag, color: color ?? null});
        }
    }

    pushSpan(text.slice(lastIndex));

    return spans;
}

/**
 * Builds the flat run list ChatBubble/PooledChatBubble need from a chat
 * message: username prefix (bold, unless anonymous), the message body
 * (italic for whisper, bold for shout, plus any ChatMarkup-produced
 * `<b>`/`<i>`/`<u>`/`<font color>` spans - see parseInlineMarkup()), with
 * `{i}` placeholders substituted for the message's trusted links (rendered
 * in the style's link color, underlined) - same substitution AS3's
 * ChatBubble constructor performs.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/visualization/ChatBubble.as::ChatBubble()
 */
export function buildChatTextRuns(
    text: string,
    userName: string,
    isAnonymous: boolean,
    isShout: boolean,
    italic: boolean,
    baseColor: number,
    linkColor: number,
    links: readonly {url: string; displayText: string}[]
): IChatTextRun[]
{
    const runs: IChatTextRun[] = [];

    if(!isAnonymous && userName)
    {
        runs.push({text: `${userName}: `, bold: true, italic, color: baseColor, underline: false});
    }

    for(const span of parseInlineMarkup(text))
    {
        const segments = span.text.split(/(\{\d+\})/g);

        for(const segment of segments)
        {
            const match = /^\{(\d+)\}$/.exec(segment);

            if(match)
            {
                const link = links[Number(match[1])];

                if(link)
                {
                    runs.push({text: link.displayText, bold: isShout || span.bold, italic: italic || span.italic, color: linkColor, underline: true, url: link.url});
                    continue;
                }
            }

            if(segment.length > 0)
            {
                runs.push({
                    text: segment,
                    bold: isShout || span.bold,
                    italic: italic || span.italic,
                    color: span.color ?? baseColor,
                    underline: span.underline
                });
            }
        }
    }

    return runs;
}

/**
 * The URL of the link run at a point in the laid-out text, or null.
 *
 * Coordinates are local to the text block — the origin `drawChatText()` draws from, which is the
 * text sprite's own position inside the bubble.
 *
 * Flash needed no equivalent: the bubble's TextField carried the links as `htmlText` anchors and
 * dispatched a `TextEvent` with the href, so AS3 reads `event.text` and never hit-tests. This port
 * rasterizes its runs to a canvas, so the hit test is what stands in for that event — the geometry
 * is already here, it just had no reader.
 */
// DEVIATION: AS3 gets the clicked href from Flash's `"link"` TextEvent on a TextField. This port
//   draws text itself and has no TextField, so the same information is recovered from the layout
//   the draw already produced.
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/visualization/PooledChatBubble.as::onTextLinkEvent()
export function hitTestChatTextLayout(layout: IChatTextLayout, x: number, y: number): string | null
{
    if(y < 0 || y >= layout.height || x < 0) return null;

    const line = layout.lines[Math.floor(y / layout.lineHeight)];

    if(!line) return null;

    for(const placed of line)
    {
        if(x >= placed.x && x < placed.x + placed.width) return placed.run.url ?? null;
    }

    return null;
}
