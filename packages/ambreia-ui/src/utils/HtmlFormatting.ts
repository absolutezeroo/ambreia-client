import type {ITextFormat} from '../components/ITextWindow';

// TS-only: no AS3 equivalent — Flash's native TextField.htmlText parses a
// restricted HTML subset (<b>/<i>/<u>/<br>/...) internally; the Canvas2D port
// has no such engine, so formatted_text/html windows need this to turn markup
// into plain text + per-range TextFormat overrides (TextController.setTextFormat())
// before drawing. Only a hardcoded, closed set of tag names is ever recognized -
// no attributes are parsed and nothing is ever interpreted as markup by the
// renderer (plain Canvas2D fillText()), so unknown/malformed tags are simply
// dropped as text, never executed or otherwise acted upon.
export interface IParsedHtmlText
{
    // TS-only: the plain text with all recognized/unrecognized tags stripped.
    text: string;
    // TS-only: TextController.setTextFormat()-compatible ranges over `text`.
    runs: Array<{ start: number; end: number; format: ITextFormat }>;
}

const TAG_FORMAT_KEY: Record<string, keyof ITextFormat> = {
    b: 'bold',
    i: 'italic',
    u: 'underline',
};

// `<font>` carries its formatting in attributes, so unlike b/i/u it is matched with its tail and
// parsed. Flash's own TextField accepts `size` and `color` there; `face` is deliberately left out
// because this client ships one family and honouring it would silently break every measurement
// that assumes the field's own face.
const RECOGNIZED_TAG_PATTERN = /<(\/?)(b|i|u|font)((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
const UNRECOGNIZED_TAG_PATTERN = /<(?!\/?(?:b|i|u|font)\b)[^>]+>/gi;
const FONT_SIZE_PATTERN = /\bsize\s*=\s*["']?(\d+)/i;
// Six digits BEFORE three: the other way round the alternation matches the first three of
// `#7adde9` and expands them as shorthand, turning it into `#77aadd`.
const FONT_COLOR_PATTERN = /\bcolor\s*=\s*["']?#?([0-9a-f]{6}|[0-9a-f]{3})/i;

/**
 * The format one opening tag contributes. b/i/u each flip their single flag; `<font>` reads its
 * `size`/`color` attributes, and contributes nothing for the ones it does not carry.
 */
function formatForTag(tag: string, attributes: string): ITextFormat
{
    if(tag !== 'font') return {[TAG_FORMAT_KEY[tag]]: true} as ITextFormat;

    const format: ITextFormat = {};
    const size = FONT_SIZE_PATTERN.exec(attributes);
    const color = FONT_COLOR_PATTERN.exec(attributes);

    if(size) format.size = parseInt(size[1], 10);

    if(color)
    {
        // `#abc` is Flash's shorthand for `#aabbcc`.
        const hex = color[1].length === 3
            ? color[1].split('').map((c) => c + c).join('')
            : color[1];

        format.color = parseInt(hex, 16);
    }

    return format;
}

/**
 * Parses a small, hardcoded subset of Flash's htmlText markup (<b>, <i>,
 * <u>, <br>) into plain text plus TextController.setTextFormat()-compatible
 * ranges. Any other tag is stripped without being interpreted.
 */
export function parseHtmlFormatting(html: string): IParsedHtmlText
{
    const normalized = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(UNRECOGNIZED_TAG_PATTERN, '');

    let text = '';
    let lastIndex = 0;
    const openStack: Array<{ tag: string; start: number; format: ITextFormat }> = [];
    const runs: Array<{ start: number; end: number; format: ITextFormat }> = [];
    let match: RegExpExecArray | null;

    RECOGNIZED_TAG_PATTERN.lastIndex = 0;

    while((match = RECOGNIZED_TAG_PATTERN.exec(normalized)) !== null)
    {
        text += normalized.slice(lastIndex, match.index);
        lastIndex = match.index + match[0].length;

        const isClosing = match[1] === '/';
        const tag = match[2].toLowerCase();

        if(!isClosing)
        {
            openStack.push({tag, start: text.length, format: formatForTag(tag, match[3] ?? '')});
            continue;
        }

        for(let i = openStack.length - 1; i >= 0; i--)
        {
            if(openStack[i].tag !== tag) continue;

            const open = openStack.splice(i, 1)[0];

            if(text.length > open.start)
            {
                runs.push({start: open.start, end: text.length, format: open.format});
            }

            break;
        }
    }

    text += normalized.slice(lastIndex);

    for(const open of openStack)
    {
        if(text.length > open.start)
        {
            runs.push({start: open.start, end: text.length, format: open.format});
        }
    }

    return {text, runs: flattenRuns(runs, text.length)};
}

/**
 * Rewrites overlapping runs as one run per maximal segment, with the formats merged.
 *
 * Every consumer resolves a character's format with `runs.find()`, which keeps the FIRST run
 * covering it and silently drops the rest. That was harmless while only b/i/u existed and nesting
 * was rare; with `<font>` it is not — `wiredchests.big_fat_warning` is
 * `<font color="#C42F3D"><b>Usage warning:</b> ...` and the bold half would have come out unred.
 *
 * Merged here rather than in the three call sites that read runs, so they keep their one-line
 * lookup and cannot disagree about precedence. Outer tags are applied first and inner ones last,
 * so the innermost tag wins any key the two both set.
 */
// TS-only: Flash's TextField resolved nested htmlText formatting internally.
function flattenRuns(
    runs: Array<{ start: number; end: number; format: ITextFormat }>,
    length: number
): Array<{ start: number; end: number; format: ITextFormat }>
{
    if(runs.length < 2) return runs;

    const outerFirst = [...runs].sort((a, b) => (b.end - b.start) - (a.end - a.start));
    const boundaries = new Set<number>([0, length]);

    for(const run of runs)
    {
        boundaries.add(run.start);
        boundaries.add(run.end);
    }

    const edges = [...boundaries].sort((a, b) => a - b);
    const out: Array<{ start: number; end: number; format: ITextFormat }> = [];

    for(let i = 0; i < edges.length - 1; i++)
    {
        const start = edges[i];
        const end = edges[i + 1];
        let format: ITextFormat | null = null;

        for(const run of outerFirst)
        {
            if(run.start > start || run.end < end) continue;

            format = {...(format ?? {}), ...run.format};
        }

        if(format !== null) out.push({start, end, format});
    }

    return out;
}
