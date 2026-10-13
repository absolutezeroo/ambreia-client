import type {IWindow} from '../IWindow';
import type {IScrollableWindow} from './IScrollableWindow';
import type {IMargins} from '../utils/IMargins';

/**
 * A per-range text format override, mirroring the subset of Flash's
 * `flash.text.TextFormat` that WindowComposite's Canvas2D text renderer can
 * actually apply per-range (see getTextFormat()/setTextFormat() below).
 *
 * Every field `flash.text.TextFormat` carries is declared, so a caller can build the format AS3
 * builds. What the renderer *applies* per range is narrower: it paints one font and size per text
 * window, so `font`/`size` set here take effect only through the controller's own properties, and
 * `align`/`leftMargin`/`rightMargin`/`indent`/`leading` are whole-window settings rather than
 * per-range ones. `getTextFormat()` fills in only what the controller actually tracks.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getTextFormat()
 */
export interface ITextFormat
{
    font?: string | null;
    size?: number | null;
    color?: number | null;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get bold()
    bold?: boolean | null;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get italic()
    italic?: boolean | null;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get underline()
    underline?: boolean | null;

    /**
	 * Paragraph alignment — `"left"`, `"center"` or `"right"`.
	 *
	 * `TextController` tracks no alignment of its own, so `getTextFormat()` never fills this in;
	 * it exists because callers build a format to hand back to `setTextFormat()` and AS3's
	 * `flash.text.TextFormat` carries it.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextController.as::setTextFormatting() (`_loc3_.align`)
    align?: string | null;

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get leading()
    leading?: number | null;

    // AS3: .../src/com/sulake/core/window/components/TextController.as::setTextFormatting() (`_loc3_.leftMargin`)
    leftMargin?: number | null;

    // AS3: .../src/com/sulake/core/window/components/TextController.as::setTextFormatting() (`_loc3_.rightMargin`)
    rightMargin?: number | null;

    // AS3: .../src/com/sulake/core/window/components/TextController.as::setTextFormatting() (`_loc3_.indent`)
    indent?: number | null;

    /** The href an `<a>` range links to; `target` is its window, as in HTML. */
    // AS3: .../src/com/sulake/core/window/components/TextController.as::setTextFormatting() (`_loc3_.url`)
    url?: string | null;

    // AS3: .../src/com/sulake/core/window/components/TextController.as::setTextFormatting() (`_loc3_.target`)
    target?: string | null;
}

/**
 * One line's box, mirroring `flash.text.TextLineMetrics`.
 *
 * TS-only shape: AS3 hands back the Flash class itself, which has no counterpart here.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getLineMetrics()
 */
export interface ITextLineMetrics
{
    // TS-only: `flash.text.TextLineMetrics.x` — the line's left edge, this port's left margin.
    x: number;
    // TS-only: `flash.text.TextLineMetrics.width`.
    width: number;
    // TS-only: `flash.text.TextLineMetrics.height` — the full line box, leading included.
    height: number;
    // TS-only: `flash.text.TextLineMetrics.ascent` — baseline to the top of the tallest glyph.
    ascent: number;
    // TS-only: `flash.text.TextLineMetrics.descent` — baseline to the bottom of the lowest glyph.
    descent: number;
    // TS-only: `flash.text.TextLineMetrics.leading` — whatever the line box has left over.
    leading: number;
}

/**
 * Interface for text windows.
 *
 * Provides access to text content, formatting properties (font, size, bold,
 * italic, color), scrolling, and margins.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as
 */
export interface ITextWindow extends IWindow, IScrollableWindow
{
    // TextController has had a setter all along; the interface declared `bold` read-only, so
    // callers that need it (the mannequin's name field, SearchView's placeholder, and now every
    // forum row, which bolds an unread thread) had to cast around the type. The same was already
    // true of `italic` below.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get margins()
    readonly margins: IMargins;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get bold()
    bold: boolean;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get italic()
    italic: boolean;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get underline()
    underline: boolean;
    // Writable for the same reason as `bold` above: TextController has had the setter all along
    // (IssueHandler bolds the highest-priority report's category by swapping the face).
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get fontFace()
    fontFace: string;
    // AS3 ITextWindow exposes fontSize as read/write; TextController already implements the setter.
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get fontSize()
    fontSize: number;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get length()
    readonly length: number;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get numLines()
    readonly numLines: number;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textHeight()
    readonly textHeight: number;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textWidth()
    readonly textWidth: number;

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get text()
    text: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get htmlText()
    // Declared on AS3's ITextWindow (lines 37 and 107) and implemented by this port's
    // TextController all along — the interface simply never exposed it, so a caster to
    // ITextWindow could not reach it. PollOfferDialog (since removed with polls in the RPG fork) was
    // the first ported caller that needed it.
    htmlText: string;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textColor()
    textColor: number;
    // TS-only: the caption colour of a selected tab (`selected_text_color`), null when the layout sets none.
    readonly selectedTextColor: number | null;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textBackground()
    textBackground: boolean;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textBackgroundColor()
    textBackgroundColor: number;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get maxChars()
    maxChars: number;
    // AS3-settable line cap (TextController implements it); used by wired TextPreset multiline mode.
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get maxLines()
    maxLines: number;
    // AS3-settable overflow ellipsis replacement (TextController implements it); wired overflow mode.
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get overflowReplace()
    overflowReplace: string;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get multiline()
    multiline: boolean;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get wordWrap()
    wordWrap: boolean;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get autoSize()
    autoSize: string;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get etchingColor()
    etchingColor: number;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get etchingPosition()
    etchingPosition: string;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::get border()
    border: boolean;

    // AS3: .../src/com/sulake/core/window/components/TextController.as::appendText()
    appendText(text: string): void;

    // AS3: .../src/com/sulake/core/window/components/TextController.as::replaceText()
    replaceText(beginIndex: number, endIndex: number, newText: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getCharIndexAtPoint()
    getCharIndexAtPoint(localX: number, localY: number): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getTextFormat()
    getTextFormat(beginIndex?: number, endIndex?: number): ITextFormat;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setTextFormat()
    setTextFormat(format: ITextFormat, beginIndex?: number, endIndex?: number): void;

    /**
	 * Font-smoothing mode. Stored; the canvas renderer has no equivalent switch.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get antiAliasType()
    antiAliasType: string;

    /**
	 * Colour of the one-pixel border `border` draws.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get borderColor()
    borderColor: number;

    /**
	 * Index of the last line currently visible.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get bottomScrollV()
    readonly bottomScrollV: number;

    /**
	 * AS3 exchanges a `flash.text.TextFormat` here. This port has no such type — the same
	 * settings are the individual accessors on this interface — so it answers null.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get defaultTextFormat()
    defaultTextFormat: ITextFormat;

    /**
	 * AS3 picks between an embedded and a device font. Stored and inert here: the glyph atlas
	 * renders web fonts only.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get embedFonts()
    embedFonts: boolean;

    /**
	 * Pixel-grid fitting mode. Stored; no canvas equivalent.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get gridFitType()
    gridFitType: string;

    /**
	 * Stored and inert: Canvas 2D applies the font's own kerning and exposes no switch.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get kerning()
    kerning: boolean;

    /**
	 * Glyph-edge sharpness. Stored; no canvas equivalent.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get sharpness()
    sharpness: number;

    /**
	 * Extra spacing between characters.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get spacing()
    spacing: number;

    /**
	 * The named style this field draws with, resolved through `TextStyleManager`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get textStyle()
    textStyle: unknown;

    /**
	 * Stroke thickness. Stored; no canvas equivalent.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get thickness()
    thickness: number;

    /**
	 * Whether the text does not fit the field — what drives the `overflowReplace` ellipsis.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::get isOverflown()
    readonly isOverflown: boolean;

    /**
	 * AS3 hands a `flash.text.StyleSheet` to the field. The port's HTML text path has no
	 * stylesheet layer, so writing it does nothing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::set styleSheet()
    styleSheet: unknown;

    /**
	 * One character's rectangle. Null here: the atlas renderer keeps no per-glyph advances.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getCharBoundaries()
    getCharBoundaries(charIndex: number): {x: number; y: number; width: number; height: number} | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getFirstCharInParagraph()
    getFirstCharInParagraph(charIndex: number): number;

    /**
	 * The object an `<img>` in HTML text was loaded into. Null here: images render inline and
	 * no per-id handle is kept.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getImageReference()
    getImageReference(id: string): unknown;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getLineIndexAtPoint()
    getLineIndexAtPoint(x: number, y: number): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getLineIndexOfChar()
    getLineIndexOfChar(charIndex: number): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getLineLength()
    getLineLength(lineIndex: number): number;

    /**
	 * AS3 returns a `flash.text.TextLineMetrics`. Null here: the port measures a line's width
	 * and height but tracks no baseline metrics.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getLineMetrics()
    getLineMetrics(lineIndex: number): ITextLineMetrics | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getLineOffset()
    getLineOffset(lineIndex: number): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getLineText()
    getLineText(lineIndex: number): string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::getParagraphLength()
    getParagraphLength(charIndex: number): number;

    /**
	 * Drops per-instance style overrides so the named style applies again. No-op here: the port
	 * has no override layer — style writes go straight to the fields.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextWindow.as::resetExplicitStyle()
    resetExplicitStyle(): void;
}
