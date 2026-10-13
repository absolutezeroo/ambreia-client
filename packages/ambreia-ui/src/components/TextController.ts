import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {ITextWindow, ITextFormat, ITextLineMetrics} from './ITextWindow';
import type {IMargins} from '../utils/IMargins';
import {WindowController} from '../WindowController';
import {WindowEvent} from '../events/WindowEvent';
import {PropertyStruct} from '../utils/PropertyStruct';
import {TextStyleManager} from '../utils/TextStyleManager';
import type {TextStyle} from '../utils/TextStyle';
import {TextMargins} from '../utils/TextMargins';
import {quoteFontFamilyList, measureFontLineHeight} from '../utils/CanvasFontString';
import {GlyphAtlas} from '../utils/GlyphAtlas';
import {OrderedMap} from '@ambreia/common/utils/OrderedMap';
import {XMLVariableParser} from '@ambreia/common/utils/XMLVariableParser';

type MeasureContext = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

interface ITextLayout
{
    lines: string[];
    width: number;
    height: number;
}

// TS-only: internal storage type for TextController._formatRuns (see setTextFormat()).
export interface ITextFormatRange
{
    // TS-only: start index of the range (inclusive), in `text` coordinates.
    start: number;
    // TS-only: end index of the range (exclusive), in `text` coordinates.
    end: number;
    // TS-only: the format override applied to [start, end).
    format: ITextFormat;
}

/**
 * Port of AS3 TextController.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as
 */
/**
 * The subset of a text style that can be posted directly onto one window.
 *
 * AS3 reuses the style struct itself for this, under an identifier that is
 * obfuscated in every tree (`_SafeStr_4862` here, `_Str_3808` in the 2016
 * build) — but the public `resetExplicitStyle()` sitting beside it is not
 * obfuscated, and is where this name comes from.
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::resetExplicitStyle()
export interface IExplicitTextStyle
{
    fontFamily?: string;
    fontSize?: number;
    color?: number;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    leading?: number;
    kerning?: boolean;
    letterSpacing?: number;
    antiAliasType?: string;
    sharpness?: number;
    thickness?: number;
    etchingColor?: number;
    etchingPosition?: string;
}

export class TextController extends WindowController implements ITextWindow
{
    private static readonly _propertySetters: Record<string, (ctrl: TextController, value: unknown) => void> = TextController.createPropertySetterTable();
    private static _measureCtx: MeasureContext | null = null;
    private static _measureCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;

    // AS3: .../src/com/sulake/core/window/components/TextController.as::_textStyleName
    protected _textStyleName: string = 'regular';
    protected _text: string = '';
    protected _htmlText: string = '';
    // AS3: .../src/com/sulake/core/window/components/TextController.as::_localized
    protected _localized: boolean = false;
    protected _displayRaw: boolean = false;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::_drawing
    protected _drawing: boolean = false;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::_settingRectangle
    protected _settingRectangle: boolean = false;

    protected _marginLeft: number = 0;
    protected _marginTop: number = 0;
    protected _marginRight: number = 0;
    protected _marginBottom: number = 0;
    protected _margins: TextMargins = new TextMargins(0, 0, 0, 0, (margins: IMargins) => this.setTextMargins(margins));

    protected _scrollH: number = 0;
    protected _scrollV: number = 0;

    protected _autoSize: string = 'none';
    protected _overflowReplace: string = '';
    protected _maxChars: number = 0;
    // AS3: .../src/com/sulake/core/window/components/TextController.as::_maxLines
    protected _maxLines: number = 0;

    /**
     * Every value posted directly onto this window - a layout `<var>`, a public
     * setter - as opposed to inherited from its named style. AS3 keeps a style
     * struct here and lets {@link applyTextStyle} fill a field from the named
     * style ONLY where this one is empty, which is what makes a layout's
     * `font_size="13"` survive a theme that says 9.
     *
     * A field is "set" by AS3's own falsy test, not by presence: `letterSpacing`
     * of 0 or `kerning` of false read as unset there, and this port keeps that
     * rather than tightening it. The two etching fields are the exception - AS3
     * tests those with `== null`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::resetExplicitStyle()
    //      (the field itself is obfuscated in every tree; that member names it)
    protected _explicitStyle: IExplicitTextStyle = {};

    // TS-only: AS3 keeps the style name out of its explicit-style struct because
    // nothing in the player re-resolves it after construction. This port's
    // finalize() does, so it needs to know whether it may.
    protected _hasExplicitTextStyle: boolean = false;

    protected _textColor: number = 0;
    // TS-only: the colour a tab's caption takes while its tab is selected (`selected_text_color`); null leaves it alone.
    protected _selectedTextColor: number | null = null;
    protected _bold: boolean = false;

    // TS-only: remembers that `_bold` came from a Flash font NAME rather than from a `bold` var,
    //   so that switching the name back to a regular one can take it away again. Flash needs no
    //   such flag — there, the two are different fonts and the bold flag is untouched by either.
    protected _boldFromFontName: boolean = false;
    protected _italic: boolean = false;
    protected _underline: boolean = false;
    protected _fontFace: string = 'Ubuntu, Arial, sans-serif';
    protected _fontSize: number = 12;
    protected _spacing: number = 0;
    protected _leading: number = 0;
    protected _kerning: boolean = false;
    protected _restrict: string = '';

    // TS-only: parsed form of `_restrict`, rebuilt whenever the raw mask changes. Flash parsed
    // the mask inside the player; here it has to be done by hand, so the result is cached rather
    // than recomputed per keystroke.
    private _restrictSource: string | null = null;
    private _restrictAllow: Array<[number, number]> = [];
    private _restrictDeny: Array<[number, number]> = [];

    // AS3: .../src/com/sulake/core/window/components/TextController.as::_etchingColor
    protected _etchingColor: number = 0;
    protected _etchingPosition: string = 'bottom';

    protected _multiline: boolean = false;
    protected _wordWrap: boolean = false;
    protected _border: boolean = false;
    protected _borderColor: number = 0;
    protected _mouseWheelEnabled: boolean = false;
    protected _condenseWhite: boolean = false;
    protected _antiAliasType: string = 'advanced';
    protected _gridFitType: string = 'pixel';
    protected _alwaysShowSelection: boolean = false;
    protected _sharpness: number = 0;
    protected _thickness: number = 0;

    protected _fieldWidth: number = 0;
    protected _fieldHeight: number = 0;
    protected _textWidthCache: number = 0;
    protected _textHeightCache: number = 0;
    protected _numLinesCache: number = 1;
    // TS-only: the wrapped lines behind `_numLinesCache`, kept so getLineText() and its
    // siblings can answer without a Flash TextField.
    protected _linesCache: string[] = [''];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::_embedFonts
    // Derived name: obfuscated in the primary tree; AS3 keeps the flag on the TextField.
    protected _embedFonts: boolean = false;

    protected _maxScrollHCache: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::_field
    // Flash's own top-padding quirk for TextField content — must match
    // WindowComposite.FLASH_TEXT_FIELD_TOP_GUTTER, which renders the same text.
    // Protected, not private: TextFieldController positions its DOM caret bridge
    // against the very same gutter (see positionInputElement()).
    protected static readonly FLASH_TEXT_FIELD_TOP_GUTTER: number = 2;

    // The horizontal half of the same Flash gutter. TextSkinRenderer applies it to
    // editable fields only — its own FLASH_TEXT_FIELD_LEFT_GUTTER explains why: an
    // auto-sized label takes its width from the measured text, so shifting its
    // glyphs right without widening the box would clip the last 2px off captions
    // across the client. The caret bridge has to start from the same origin either
    // way, or the caret sits 2px left of the glyphs.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::_field
    protected static readonly FLASH_TEXT_FIELD_LEFT_GUTTER: number = 2;

    // TS-only: per-range TextFormat overrides applied via setTextFormat().
    // Cleared whenever `text`/`htmlText` is reassigned, matching Flash's
    // TextField resetting all character formatting on content replacement.
    protected _formatRuns: ITextFormatRange[] = [];

    // TS-only: exposes _formatRuns to WindowComposite's duck-typed read
    // (see WindowComposite.compositeText()'s per-range rendering branch).
    public get formatRuns(): ReadonlyArray<ITextFormatRange>
    {
        return this._formatRuns;
    }

    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        parent: IWindow | null = null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        properties: unknown[] | null = null,
        id: number = 0,
        dynamicStyle: string = ''
    )
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id, dynamicStyle);

        // These two only depend on the constructor's own `rect` argument (not
        // on anything another phase computes) and must already be correct
        // before applyProperties()'s refreshTextImage() call measures text -
        // so they stay here rather than moving to finalize().
        this._fieldWidth = rect.width;
        this._fieldHeight = rect.height;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::TextController() (setTextFormatting(), called post-super)
    protected override finalize(): void
    {
        super.finalize();

        this._hasVisualContent = true;

        // Only fall back to the theme's style when the window was not given one.
        //
        // completeConstruction() runs applyProperties() — where a layout's
        // `text_style` variable lands — and THEN finalize(), so resolving
        // unconditionally here overwrote what the layout had just asked for.
        // The me-menu declares `text_style="u_regular"` (Ubuntu 12) on every
        // entry and rendered in `regular` (Volter 11) instead: a pixel font two
        // sizes above its design size, which is why the menu did not look like
        // the same typeface as the real client's at all.
        if(!this._hasExplicitTextStyle)
        {
            this._textStyleName = this.resolveThemeTextStyle(this._context, this._style);
        }

        this.applyTextStyle();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get text()
    public get text(): string
    {
        return this._text;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set text()
    public set text(value: string)
    {
        if(value == null) return;

        this._formatRuns = [];

        if(this._localized)
        {
            this.removeLocalizationListenerForCaption();
            this._localized = false;
        }

        this._caption = value;

        if(!this._displayRaw && this.isLocalizationKey(this._caption))
        {
            this._localized = true;
            this.registerLocalizationListenerForCaption();

            return;
        }

        this._text = this.replaceNonRenderableCharacters(this._caption);
        this._htmlText = this._text;
        this.refreshTextImage();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::get caption()
    // Declaring `set caption` below WITHOUT a matching getter creates an accessor
    // whose [[Get]] is undefined, which shadows WindowController's inherited
    // `get caption` - so `textField.caption` returned undefined even though `_caption`
    // was correctly kept in sync (via set text). That silently broke every caller
    // reading a text field's caption: e.g. SpinnerCatalogWidget.onInputEvent read
    // `event.target.caption` (undefined) and reset the catalog quantity to 1 on every
    // keystroke. Re-expose the base getter so caption reflects the live content again.
    public override get caption(): string
    {
        return super.caption;
    }

    public override set caption(value: string)
    {
        this.text = value;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textColor()
    public get textColor(): number
    {
        return this._textColor;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set textColor()
    public set textColor(value: number)
    {
        this._textColor = value;
        this.refreshTextImage();
        this._explicitStyle.color = value;
    }

    // TS-only: see `_selectedTextColor`.
    public get selectedTextColor(): number | null
    {
        return this._selectedTextColor;
    }

    // DEVIATION: AS3's TextController declares no `color` getter at all — the opacity below is
    //   Flash's, supplied by the TextField this port does not have. Reproducing it in the getter
    //   WindowComposite reads is the port's own move, which is why the trace is on the setter it
    //   compensates for rather than on a member of the same name.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set background()
    // AS3's TextController mirrors `background` onto a real flash.text.TextField
    // (`_field.background = param1`), and Flash always paints a TextField's background
    // OPAQUE using its `backgroundColor` (default 0xFFFFFF white). This port has no
    // `_field`; the background is filled by WindowComposite, which derives the fill
    // alpha from the colour's high byte. That byte defaults to 0 (see WindowModel
    // `_alphaColor = 0`), so a background-enabled text field with no explicit
    // `background_color` filled fully transparent and drew nothing - which is why the
    // inventory stack-count number disappeared, leaving only the teal `number_container`
    // badge (the "blue square"). Force the high byte opaque when a background is enabled
    // and no alpha was set, so the default white backing is painted like Flash. Fills
    // that already carry an alpha are left untouched (WindowComposite already draws
    // those), so this can only add a previously-invisible backing, never alter a visible one.
    public override get color(): number
    {
        const value = super.color;

        if(this.background && (value & 0xFF000000) === 0)
        {
            return value | 0xFF000000;
        }

        return value;
    }

    // Re-expose the base setter: declaring the getter above would otherwise shadow
    // WindowController's `set color`, silently dropping assignments (e.g. the
    // `background_color` property handler). Delegates unchanged to the base.
    public override set color(value: number)
    {
        super.color = value;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get bold()
    public get bold(): boolean
    {
        return this._bold;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set bold()
    public set bold(value: boolean)
    {
        this._bold = value;
        // An explicit weight outranks one inferred from a font name, and stops `set fontFace()`
        // from taking it back on the next assignment.
        this._boldFromFontName = false;
        this.refreshTextImage();
        // AS3's setBold() writes "bold" whatever the argument is, so turning
        // bold off still marks the weight explicitly set. Ported as written.
        this._explicitStyle.fontWeight = 'bold';
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get italic()
    public get italic(): boolean
    {
        return this._italic;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set italic()
    public set italic(value: boolean)
    {
        this._italic = value;
        this.refreshTextImage();
        this._explicitStyle.fontStyle = value ? 'italic' : 'normal';
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get underline()
    public get underline(): boolean
    {
        return this._underline;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set underline()
    public set underline(value: boolean)
    {
        this._underline = value;
        this.refreshTextImage();
        this._explicitStyle.textDecoration = value ? 'underline' : 'none';
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get fontFace()
    public get fontFace(): string
    {
        return this._fontFace;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set fontFace()
    // A layout's `font_face` is a Flash font name ("Volter Bold"), not a CSS
    // family — no such family is registered, and the browser silently falls
    // back to its default. The stylesheet path has always resolved the name
    // through mapFontFamily(); this one had not, which stayed invisible only
    // while applyTextStyle() was overwriting the field on every window.
    public set fontFace(value: string)
    {
        this._fontFace = TextStyleManager.mapFontFamily(value);

        // The stylesheet path infers the weight out of the same name (`parseStyleBlock()`, the
        // `Volter Bold` arm); this one did not, so a layout that asked for bold the only way
        // Flash lets it — by naming the bold font — got the regular face. 113 of the 115
        // `font_face="Volter Bold"` windows in the shipped layouts carry no `bold` var, because
        // in Flash there was nothing to carry.
        //
        // The inference goes both ways, and it has to: `IssueHandler.updateIssues()` toggles a
        // row between `"Volter Bold"` and `"Volter"` by assigning this very property, so a
        // one-way rule would leave every row that was ever highlighted permanently bold. Only a
        // weight this setter put there is taken back — an explicit `bold` var, or a `bold` set
        // through `defaultTextFormat`, is left alone whichever side of `font_face` it lands on.
        if(TextStyleManager.isBoldFontName(value))
        {
            if(this._explicitStyle.fontWeight == null || this._boldFromFontName)
            {
                this._bold = true;
                this._boldFromFontName = true;
                this._explicitStyle.fontWeight = 'bold';
            }
        }
        else if(this._boldFromFontName)
        {
            this._bold = false;
            this._boldFromFontName = false;
            delete this._explicitStyle.fontWeight;
        }

        this.refreshTextImage();
        this._explicitStyle.fontFamily = this._fontFace;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get fontSize()
    public get fontSize(): number
    {
        return this._fontSize;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set fontSize()
    public set fontSize(value: number)
    {
        this._fontSize = value;
        this.refreshTextImage();
        this._explicitStyle.fontSize = value;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get etchingColor()
    public get etchingColor(): number
    {
        return this._etchingColor;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set etchingColor()
    public set etchingColor(value: number)
    {
        this._etchingColor = value;
        this.refreshTextImage();
        this._explicitStyle.etchingColor = this._etchingColor;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get etchingPosition()
    public get etchingPosition(): string
    {
        return this._etchingPosition;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set etchingPosition()
    public set etchingPosition(value: string)
    {
        this._etchingPosition = value;
        this.refreshTextImage();
        this._explicitStyle.etchingPosition = this._etchingPosition;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get antiAliasType()
    public get antiAliasType(): string
    {
        return this._antiAliasType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set antiAliasType()
    // AS3 normalises anything that is not "normal" to "advanced"
    // (TextController.as::setAntiAliasType()).
    public set antiAliasType(value: string)
    {
        this._antiAliasType = value === 'normal' ? 'normal' : 'advanced';
        this.refreshTextImage();
        this._explicitStyle.antiAliasType = this._antiAliasType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get gridFitType()
    public get gridFitType(): string
    {
        return this._gridFitType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set gridFitType()
    public set gridFitType(value: string)
    {
        this._gridFitType = value;
        this.refreshTextImage();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get sharpness()
    public get sharpness(): number
    {
        return this._sharpness;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set sharpness()
    public set sharpness(value: number)
    {
        this._sharpness = value;
        this.refreshTextImage();
        this._explicitStyle.sharpness = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get thickness()
    public get thickness(): number
    {
        return this._thickness;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set thickness()
    public set thickness(value: number)
    {
        this._thickness = value;
        this.refreshTextImage();
        this._explicitStyle.thickness = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get border()
    public get border(): boolean
    {
        return this._border;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setBorder()
    public set border(value: boolean)
    {
        this._border = value;
        this.refreshTextImage();
    }

    /**
	 * Flash's `TextField.borderColor` is a plain RGB uint with no alpha channel —
	 * the border it draws is always opaque. WindowComposite relies on that when it
	 * paints the border, and on the default staying black (Flash's own).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get borderColor()
    public get borderColor(): number
    {
        return this._borderColor;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setBorderColor()
    public set borderColor(value: number)
    {
        this._borderColor = value;
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get multiline()
    public get multiline(): boolean
    {
        return this._multiline;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set multiline()
    public set multiline(value: boolean)
    {
        this._multiline = value;
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get wordWrap()
    public get wordWrap(): boolean
    {
        return this._wordWrap;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set wordWrap()
    public set wordWrap(value: boolean)
    {
        this._wordWrap = value;
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get maxChars()
    public get maxChars(): number
    {
        return this._maxChars;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set maxChars()
    public set maxChars(value: number)
    {
        this._maxChars = Math.max(0, value);
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get maxLines()
    public get maxLines(): number
    {
        return this._maxLines;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set maxLines()
    public set maxLines(value: number)
    {
        this._maxLines = Math.max(0, value);
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get overflowReplace()
    public get overflowReplace(): string
    {
        return this._overflowReplace;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set overflowReplace()
    public set overflowReplace(value: string)
    {
        this._overflowReplace = value ?? '';
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get isOverflowReplaceOn()
    public get isOverflowReplaceOn(): boolean
    {
        return this._overflowReplace !== '';
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get autoSize()
    public get autoSize(): string
    {
        return this._autoSize;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set autoSize()
    public set autoSize(value: string)
    {
        if(value === this._autoSize) return;

        this._autoSize = value;
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get length()
    public get length(): number
    {
        return this._text.length;
    }

    /**
	 * Index of the last line currently visible. AS3 reads `TextField.bottomScrollV`; here it is
	 * the scroll position plus however many lines fit in the field.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get bottomScrollV()
    public get bottomScrollV(): number
    {
        const lineHeight = this._numLinesCache > 0 ? this._textHeightCache / this._numLinesCache : 0;
        const visible = lineHeight > 0 ? Math.max(1, Math.floor(this._fieldHeight / lineHeight)) : 1;

        return Math.min(this._numLinesCache, this._scrollV + visible);
    }

    /**
	 * Whether the text does not fit the field — what drives the `overflowReplace` ellipsis.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get isOverflown()
    public get isOverflown(): boolean
    {
        return this._textWidthCache > this._fieldWidth || this._textHeightCache > this._fieldHeight;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get textStyle()
    public get textStyle(): TextStyle | null
    {
        return TextStyleManager.getStyle(this._textStyleName);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set textStyle()
    public set textStyle(value: TextStyle | null)
    {
        if(value === null) return;

        this._textStyleName = value.name;
        this._hasExplicitTextStyle = true;
        this.refreshTextImage();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get embedFonts()
    // AS3 reads and writes `TextField.embedFonts`, which picks between an [Embed]ed font and a
    // device one. This port renders through the glyph atlas with web fonts only, so the flag is
    // stored and inert: there is no second font source to switch to. Kept because ported callers
    // set it.
    public get embedFonts(): boolean
    {
        return this._embedFonts;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set embedFonts()
    public set embedFonts(value: boolean)
    {
        this._embedFonts = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get kerning()
    // AS3 maps this to `TextField.kerning`. Canvas 2D does expose `ctx.fontKerning`, but measured
    // on this client's own fonts it moves nothing: 'auto', 'normal' and 'none' all give 104.33px
    // for the same string in 13px Ubuntu. Stored and inert because wiring it through the renderer
    // would change no pixels — not because the platform lacks the switch.
    public get kerning(): boolean
    {
        return this._kerning;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set kerning()
    public set kerning(value: boolean)
    {
        this._kerning = value;
        this._explicitStyle.kerning = value;
    }

    /**
     * The field-wide base format, as `flash.text.TextFormat` is in AS3.
     *
     * `ITextFormat` is that TextFormat's portable subset, so this pair is the same exchange the
     * original does — the getter hands back the whole-field format, the setter writes each present
     * field onto the individual accessor behind it. Absent keys are left alone, which is Flash's
     * own rule: a TextFormat property set to `null` means "do not change this one".
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get defaultTextFormat()
    public get defaultTextFormat(): ITextFormat
    {
        return this.getTextFormat();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set defaultTextFormat()
    public set defaultTextFormat(value: ITextFormat)
    {
        if(value == null) return;

        if(value.font != null) this.fontFace = value.font;
        if(value.size != null) this.fontSize = value.size;
        if(value.color != null) this.textColor = value.color;
        if(value.bold != null) this.bold = value.bold;
        if(value.italic != null) this.italic = value.italic;
        if(value.underline != null) this.underline = value.underline;
    }

    // TS-only: AS3 keeps a `flash.text.StyleSheet` object; this port keeps the CSS text it would
    // have been built from, because that is also the shape the `html_stylesheet` layout property
    // arrives in.
    protected _styleSheet: string | null = null;

    /**
	 * The stylesheet the text is rendered against.
	 *
	 * AS3 takes a `flash.text.StyleSheet`; this port takes the CSS as a string, which is what
	 * every caller builds anyway (`TextWindowUtils.setHTMLLinkStyle()`,
	 * `HTMLTextController.initializeLinkStyle()` and the two catalog widgets all assemble the same
	 * four `a:link`/`a:hover`/`a:active`/`.visited` rules).
	 *
	 * Only `HTMLTextController` reads it, and only for `a:link` — see its `linkColor`. A plain
	 * text window has no anchors to style, so storing it there is inert, exactly as it is in AS3
	 * when the field holds no markup.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set styleSheet()
    public set styleSheet(value: unknown)
    {
        this._styleSheet = typeof value === 'string' ? value : null;

        this.refreshTextImage();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get styleSheet()
    public get styleSheet(): unknown
    {
        return this._styleSheet;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::resetExplicitStyle()
    public resetExplicitStyle(): void
    {
        this._explicitStyle = {};
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getLineText()
    public getLineText(lineIndex: number): string
    {
        return this._linesCache[lineIndex] ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getLineLength()
    public getLineLength(lineIndex: number): number
    {
        return this.getLineText(lineIndex).length;
    }

    /**
	 * Character offset a line starts at, counting the newline each earlier line ends with.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getLineOffset()
    public getLineOffset(lineIndex: number): number
    {
        let offset = 0;

        for(let i = 0; i < lineIndex && i < this._linesCache.length; i++) offset += this._linesCache[i].length + 1;

        return offset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getLineIndexOfChar()
    public getLineIndexOfChar(charIndex: number): number
    {
        if(charIndex < 0) return -1;

        let offset = 0;

        for(let i = 0; i < this._linesCache.length; i++)
        {
            offset += this._linesCache[i].length + 1;

            if(charIndex < offset) return i;
        }

        return -1;
    }

    /**
	 * A paragraph is what the *source* text separates with a newline, not what wrapping split.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getFirstCharInParagraph()
    public getFirstCharInParagraph(charIndex: number): number
    {
        const text = this.text;

        if(charIndex < 0 || charIndex > text.length) return -1;

        const start = text.lastIndexOf('\n', Math.max(0, charIndex - 1));

        return start === -1 ? 0 : start + 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getParagraphLength()
    public getParagraphLength(charIndex: number): number
    {
        const text = this.text;
        const start = this.getFirstCharInParagraph(charIndex);

        if(start < 0) return -1;

        const end = text.indexOf('\n', start);

        return (end === -1 ? text.length : end + 1) - start;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getLineIndexAtPoint()
    public getLineIndexAtPoint(_x: number, y: number): number
    {
        const lineHeight = this._numLinesCache > 0 ? this._textHeightCache / this._numLinesCache : 0;

        if(lineHeight <= 0) return -1;

        const index = Math.floor(y / lineHeight);

        return index >= 0 && index < this._numLinesCache ? index : -1;
    }

    /**
     * One line's box, as Flash's `TextLineMetrics`.
     *
     * The baseline pair comes from the same measure context the renderer draws with, so ascent and
     * descent describe the glyphs actually on screen rather than the font's nominal box. `leading`
     * is whatever the line height has left over once those two are accounted for — Flash reports it
     * the same way, which is why it can read 0 on a tightly-set style.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getLineMetrics()
    public getLineMetrics(lineIndex: number): ITextLineMetrics | null
    {
        if(lineIndex < 0 || lineIndex >= this._linesCache.length) return null;

        const ctx = TextController.getMeasureContext();

        ctx.font = this.buildCanvasFontString();

        const line = this._linesCache[lineIndex];
        const metrics = ctx.measureText(line);
        const ascent = metrics.actualBoundingBoxAscent || metrics.fontBoundingBoxAscent || this._fontSize;
        const descent = metrics.actualBoundingBoxDescent || metrics.fontBoundingBoxDescent || 0;
        const height = this.getLineHeight();

        return {
            x: this._marginLeft,
            width: metrics.width + this._spacing * line.length,
            height,
            ascent,
            descent,
            leading: Math.max(0, height - ascent - descent),
        };
    }

    /**
     * One character's rectangle in field coordinates — the inverse of `getCharIndexAtPoint()`.
     *
     * It walks the same per-character advances that method walks rather than reading back a stored
     * layout, so the two agree by construction, and it inherits the same caveat: `getLineOffset()`
     * charges one character per line break, which runs a break short when a wrap fell mid-word.
     * Flash returns `null` for an out-of-range index, and so does this.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getCharBoundaries()
    public getCharBoundaries(charIndex: number): {x: number; y: number; width: number; height: number} | null
    {
        if(charIndex < 0 || !this._text) return null;

        const lineIndex = this.getLineIndexOfChar(charIndex);

        if(lineIndex < 0 || lineIndex >= this._linesCache.length) return null;

        const line = this._linesCache[lineIndex];
        const column = charIndex - this.getLineOffset(lineIndex);

        if(column < 0 || column >= line.length) return null;

        const ctx = TextController.getMeasureContext();

        ctx.font = this.buildCanvasFontString();

        const lineHeight = this.getLineHeight();

        let x = this._marginLeft;

        for(let i = 0; i < column; i++) x += ctx.measureText(line.charAt(i)).width + this._spacing;

        return {
            x,
            y: this._marginTop + TextController.FLASH_TEXT_FIELD_TOP_GUTTER + lineIndex * lineHeight,
            width: ctx.measureText(line.charAt(column)).width + this._spacing,
            height: lineHeight,
        };
    }

    /**
     * The display object behind an `<img>` in the text — always null, because nothing puts one
     * there.
     *
     * AS3's body is a single pass-through, `_field.getImageReference(id)`, handing back whatever
     * Flash's `TextField` built for an `<img src="…">` in its `htmlText`. There is no `TextField`
     * here to pass through to, and this renderer draws no inline images.
     *
     * DEVIATION rather than a gap, on three checks that all have to fail before it becomes one:
     *   - **Nothing calls it.** `grep -rn getImageReference sources/WIN63-…/src/` finds the
     *     interface declaration and this one-line body, and no call site anywhere.
     *   - **Nothing to reference.** No `<img` appears in any of the 788 shipped window layouts.
     *   - **Nothing arrives at runtime either.** No `<img` in `external_flash_texts.txt`, nor in
     *     the live gamedata the client actually loads.
     *
     *   So implementing inline-image layout would add a text feature with no content to render and
     *   no caller to ask for it. Returning null is what Flash returns for an id it does not know,
     *   which is every id here. Reclassified from a TODO on 2026-09-05: three failing checks is a
     *   decision, not a debt.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getImageReference()
    public getImageReference(_id: string): unknown
    {
        return null;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get numLines()
    public get numLines(): number
    {
        return this._numLinesCache;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textHeight()
    public get textHeight(): number
    {
        return this._textHeightCache;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textWidth()
    public get textWidth(): number
    {
        return this._textWidthCache;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textBackground()
    public get textBackground(): boolean
    {
        return this.background;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set textBackground()
    public set textBackground(value: boolean)
    {
        this.background = value;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get textBackgroundColor()
    public get textBackgroundColor(): number
    {
        return this.color;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set textBackgroundColor()
    public set textBackgroundColor(value: number)
    {
        this.color = value;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get scrollH()
    public get scrollH(): number
    {
        return this._scrollH;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set scrollH()
    public set scrollH(value: number)
    {
        this._scrollH = value;
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get scrollV()
    public get scrollV(): number
    {
        return this._scrollV;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set scrollV()
    public set scrollV(value: number)
    {
        if(value > this._scrollV || value < this._scrollV)
        {
            this._scrollV = value;
            this.refreshTextImage();
        }
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get maxScrollH()
    public get maxScrollH(): number
    {
        return this._maxScrollHCache;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get maxScrollV()
    public get maxScrollV(): number
    {
        return Math.max(this._textHeightCache - this.height, 0);
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get visibleRegion()
    public get visibleRegion(): { x: number; y: number; width: number; height: number }
    {
        return {
            x: this._scrollH * this.maxScrollH,
            y: this._scrollV * this.maxScrollV,
            width: this._width,
            height: this._height
        };
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get scrollableRegion()
    public get scrollableRegion(): { x: number; y: number; width: number; height: number }
    {
        return {
            x: 0,
            y: 0,
            width: this.maxScrollH + this._width,
            height: this.maxScrollV + this._height
        };
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get htmlText()
    public get htmlText(): string
    {
        return this._htmlText;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set htmlText()
    public set htmlText(value: string)
    {
        if(value == null) return;

        this._formatRuns = [];

        if(this._localized)
        {
            this.removeLocalizationListenerForCaption();
            this._localized = false;
        }

        this._caption = value;

        if(!this._displayRaw && this.isLocalizationKey(this._caption))
        {
            this._localized = true;
            this.registerLocalizationListenerForCaption();

            return;
        }

        this._htmlText = this._caption;
        this._text = this._caption;
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get margins()
    public get margins(): IMargins
    {
        return this._margins;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get spacing()
    public get spacing(): number
    {
        return this._spacing;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set spacing()
    public set spacing(value: number)
    {
        this._spacing = value;
        this.refreshTextImage();
        this._explicitStyle.letterSpacing = value;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::get leading()
    public get leading(): number
    {
        return this._leading;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set leading()
    public set leading(value: number)
    {
        this._leading = value;
        this.refreshTextImage();
        this._explicitStyle.leading = value;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::set localization()
    public set localization(value: string)
    {
        if(value == null) return;

        this._text = this.limitStringLength(value);
        this._htmlText = this._text;
        this.refreshTextImage();
    }

    public override setRectangle(x: number, y: number, width: number, height: number): void
    {
        if(this._settingRectangle || !this._multiline || !this._wordWrap)
        {
            super.setRectangle(x, y, width, height);

            return;
        }

        // AS3 early-out this port had dropped: neither the left edge nor the width moved, so
        // nothing can reflow and the mask below would only buy an extra measure pass.
        if(this._x === x && this._width === width)
        {
            super.setRectangle(x, y, width, height);

            return;
        }

        this._settingRectangle = true;

        const previousAutoSize = this.autoSize;

        // Through the ACCESSOR both times, exactly as AS3 does - and the restore is the half that
        // matters. `super.setRectangle()` dispatches WE_RESIZED, which comes back through
        // `update()` into `refreshTextImage()` while auto-sizing is still masked off: that pass
        // remeasures the text at the new width but, with `autoSize === 'none'`, is forbidden to
        // move the box. Writing the field directly here left that masked pass as the last word.
        //
        // Assigning through the setter runs one more pass with auto-sizing back on, and that is
        // the pass that grows the box to the wrapped lines. Measured on the wired "pick furnis"
        // note: 218x16 holding text that measures 182x36 - two of its three lines cut off.
        this.autoSize = 'none';
        super.setRectangle(x, y, width, height);
        this.autoSize = previousAutoSize;

        this._settingRectangle = false;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::appendText()
    public appendText(value: string): void
    {
        this._text += value;
        this._caption = this._text;
        this._htmlText = this._text;
        this.refreshTextImage();
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::replaceText()
    public replaceText(beginIndex: number, endIndex: number, newText: string): void
    {
        this._text = this._text.substring(0, beginIndex) + newText + this._text.substring(endIndex);
        this._caption = this._text;
        this._htmlText = this._text;
        this.refreshTextImage();
    }

    /**
	 * Maps a point local to this window (0,0 = top-left) to a character
	 * index in `text`, or -1 if the point isn't over any character.
	 *
	 * Walks the laid-out lines, not the source paragraphs: with word wrap on,
	 * a click three visual lines down lands in paragraph 0, and splitting the
	 * source on '\n' picked the wrong line entirely.
	 *
	 * The offset comes from getLineOffset(), which charges one character per
	 * line break. That is exact for a '\n' and for a wrap that consumed a
	 * space; a wrap that broke mid-word has no character to charge, so the
	 * index runs one short per such break. Reproducing that exactly would mean
	 * the layout recording where each line came from, which nothing needs yet.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getCharIndexAtPoint()
    public getCharIndexAtPoint(localX: number, localY: number): number
    {
        if(!this._text) return -1;

        const lineHeight = this.getLineHeight();
        const lineIndex = Math.floor((localY - this._marginTop - TextController.FLASH_TEXT_FIELD_TOP_GUTTER) / lineHeight);

        if(lineIndex < 0 || lineIndex >= this._linesCache.length) return -1;

        const charOffset = this.getLineOffset(lineIndex);
        const line = this._linesCache[lineIndex];
        const ctx = TextController.getMeasureContext();

        ctx.font = this.buildCanvasFontString();

        let x = this._marginLeft;

        for(let i = 0; i < line.length; i++)
        {
            const charWidth = ctx.measureText(line.charAt(i)).width + this._spacing;

            if(localX >= x && localX < x + charWidth)
            {
                return charOffset + i;
            }

            x += charWidth;
        }

        return -1;
    }

    /**
	 * Returns the base text format (color/underline/bold/italic/font/size).
	 * AS3's native TextField.getTextFormat(begin, end) can return the format
	 * of a sub-range when both indexes are given, but every real caller here
	 * (RoomChatItem, to seed a format it then narrows via setTextFormat())
	 * calls it with no arguments for the whole-field base format, so a
	 * per-range read isn't implemented.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::getTextFormat()
    public getTextFormat(_beginIndex: number = -1, _endIndex: number = -1): ITextFormat
    {
        return {
            font: this._fontFace,
            size: this._fontSize,
            color: this._textColor,
            bold: this._bold,
            italic: this._italic,
            underline: this._underline,
            leading: this._leading,
        };
    }

    /**
	 * Applies a format override to a character range. Faithful to AS3: only
	 * takes effect when a valid range is given (0 <= beginIndex < endIndex <
	 * text.length) — calling this with no range is a silent no-op in the
	 * original too (TextController.as::setTextFormat() guards on exactly
	 * this condition before touching `_field`).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setTextFormat()
    public setTextFormat(format: ITextFormat, beginIndex: number = -1, endIndex: number = -1): void
    {
        if(beginIndex >= 0 && endIndex > beginIndex && endIndex < this._text.length)
        {
            this._formatRuns.push({start: beginIndex, end: endIndex, format});
            this.refreshTextImage();
        }
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::setTextMargins()
    public setTextMargins(value: IMargins): void
    {
        if(value !== this._margins)
        {
            this._margins.dispose();
            this._margins = new TextMargins(value.left, value.top, value.right, value.bottom, (margins: IMargins) => this.setTextMargins(margins));
        }

        this._marginLeft = this._margins.left;
        this._marginTop = this._margins.top;
        this._marginRight = this._margins.right;
        this._marginBottom = this._margins.bottom;

        if(this._autoSize === 'left')
        {
            this._fieldWidth = this._width - this._marginLeft - this._marginRight;
        }

        this.refreshTextImage();
    }

    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('always_show_selection', this._alwaysShowSelection));
        props.push(this.createProperty('antialias_type', this._antiAliasType));
        props.push(this.createProperty('auto_size', this._autoSize));
        props.push(this.createProperty('border', this._border));
        props.push(this.createProperty('border_color', this._borderColor));
        props.push(this.createProperty('etching_color', this._etchingColor));
        props.push(this.createProperty('etching_position', this._etchingPosition));
        props.push(this.createProperty('condense_white', this._condenseWhite));
        props.push(this.createProperty('font_face', this._fontFace));
        props.push(this.createProperty('font_size', this._fontSize));
        props.push(this.createProperty('grid_fit_type', this._gridFitType));
        props.push(this.createProperty('text_color', this._textColor));
        if(this._selectedTextColor !== null) props.push(this.createProperty('selected_text_color', this._selectedTextColor));
        props.push(this.createProperty('text_style', this._textStyleName));
        props.push(this.createProperty('margin_left', this._marginLeft));
        props.push(this.createProperty('margin_top', this._marginTop));
        props.push(this.createProperty('margin_right', this._marginRight));
        props.push(this.createProperty('margin_bottom', this._marginBottom));
        props.push(this.createProperty('mouse_wheel_enabled', this._mouseWheelEnabled));
        props.push(this.createProperty('max_chars', this._maxChars));
        props.push(this.createProperty('multiline', this._multiline));
        props.push(this.createProperty('restrict', this._restrict));
        props.push(this.createProperty('sharpness', this._sharpness));
        props.push(this.createProperty('thickness', this._thickness));
        props.push(this.createProperty('word_wrap', this._wordWrap));
        props.push(this.createProperty('max_lines', this._maxLines));
        props.push(this.createProperty('overflow_replace', this._overflowReplace));
        props.push(this.createProperty('bold', this._bold));
        props.push(this.createProperty('italic', this._italic));
        props.push(this.createProperty('underline', this._underline));
        props.push(this.createProperty('kerning', this._kerning));
        props.push(this.createProperty('spacing', this._spacing));
        props.push(this.createProperty('leading', this._leading));

        return props;
    }

    /**
     * Applies a `<var>` set from a layout node, through the same setter table `properties` uses.
     *
     * The XML form of the array `properties` takes below — same lookup, same `_drawing` latch so
     * the whole set lands in one redraw rather than one per key.
     *
     * Dead in AS3 too: `protected`, never called from `TextController`, and grepping
     * `parseVariableSet` across all three trees finds only the declaration. Ported anyway so a
     * subclass that does call it gets the AS3 behaviour rather than a missing member.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::parseVariableSet()
    protected parseVariableSet(node: Element | null): void
    {
        if(node === null) return;

        const entries = new OrderedMap<string, unknown>();

        XMLVariableParser.parseVariableList(node.children, entries);

        this._drawing = true;

        for(let i = 0; i < entries.length; i++)
        {
            const key = entries.getKey(i);
            const setter = (key === null) ? undefined : TextController._propertySetters[key];

            if(setter) setter(this, entries.getValueByIndex(i));
        }

        this._drawing = false;
    }

    public override set properties(value: unknown[])
    {
        this._drawing = true;

        for(const item of value)
        {
            const prop = item as PropertyStruct;
            const setter = TextController._propertySetters[prop.key];

            if(setter)
            {
                setter(this, prop.value);
            }
        }

        this._drawing = false;
        super.properties = value;
        this.refreshTextImage();
    }

    public override update(source: WindowController, event: WindowEvent): boolean
    {
        if(!this._drawing && event.type === WindowEvent.WE_RESIZED)
        {
            this.refreshTextImage(true);
        }

        return super.update(source, event);
    }

    public override clone(): IWindow
    {
        const cloned = super.clone() as TextController;

        // Carried with the resolved fields it explains: without it the copy
        // looks identical until something re-runs applyTextStyle() on it, at
        // which point every value the layout set reverts to the theme's.
        cloned._explicitStyle = {...this._explicitStyle};
        cloned._hasExplicitTextStyle = this._hasExplicitTextStyle;
        cloned._textStyleName = this._textStyleName;
        cloned._text = this._text;
        cloned._htmlText = this._htmlText;
        cloned._localized = this._localized;
        cloned._displayRaw = this._displayRaw;
        cloned._drawing = false;
        cloned._settingRectangle = this._settingRectangle;
        cloned._marginLeft = this._marginLeft;
        cloned._marginTop = this._marginTop;
        cloned._marginRight = this._marginRight;
        cloned._marginBottom = this._marginBottom;
        cloned._margins = this._margins.clone((margins: IMargins) => cloned.setTextMargins(margins));
        cloned._scrollH = this._scrollH;
        cloned._scrollV = this._scrollV;
        cloned._autoSize = this._autoSize;
        cloned._overflowReplace = this._overflowReplace;
        cloned._maxChars = this._maxChars;
        cloned._maxLines = this._maxLines;
        cloned._textColor = this._textColor;
        cloned._bold = this._bold;
        cloned._boldFromFontName = this._boldFromFontName;
        cloned._italic = this._italic;
        cloned._underline = this._underline;
        cloned._fontFace = this._fontFace;
        cloned._fontSize = this._fontSize;
        cloned._spacing = this._spacing;
        cloned._leading = this._leading;
        cloned._kerning = this._kerning;
        cloned._restrict = this._restrict;
        cloned._etchingColor = this._etchingColor;
        cloned._etchingPosition = this._etchingPosition;
        cloned._multiline = this._multiline;
        cloned._wordWrap = this._wordWrap;
        cloned._border = this._border;
        cloned._borderColor = this._borderColor;
        cloned._mouseWheelEnabled = this._mouseWheelEnabled;
        cloned._condenseWhite = this._condenseWhite;
        cloned._antiAliasType = this._antiAliasType;
        cloned._gridFitType = this._gridFitType;
        cloned._alwaysShowSelection = this._alwaysShowSelection;
        cloned._sharpness = this._sharpness;
        cloned._thickness = this._thickness;
        cloned._fieldWidth = this._fieldWidth;
        cloned._fieldHeight = this._fieldHeight;
        cloned._textWidthCache = this._textWidthCache;
        cloned._textHeightCache = this._textHeightCache;
        cloned._numLinesCache = this._numLinesCache;
        cloned._maxScrollHCache = this._maxScrollHCache;
        cloned._formatRuns = [...this._formatRuns];

        return cloned;
    }

    public override dispose(): void
    {
        if(this._disposed) return;

        this.immediateClickMode = false;

        if(this._localized)
        {
            this.removeLocalizationListenerForCaption();
            this._localized = false;
        }

        if(this._margins)
        {
            this._margins.dispose();
        }

        super.dispose();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::get restrict()
    get restrict(): string
    {
        return this._restrict;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::set restrict()
    set restrict(value: string)
    {
        this._restrict = value;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::limitStringLength()
    protected limitStringLength(value: string): string
    {
        return this._maxChars > 0 ? value.substring(0, this._maxChars) : value;
    }

    /**
	 * Drops every character the `restrict` mask disallows.
	 *
	 * AS3 assigns the mask straight to `flash.text.TextField.restrict` and the player does the
	 * filtering, so there is no algorithm in the source to copy — what is ported here is the
	 * documented semantics of that property:
	 *
	 * - characters listed before any `^` are the only ones accepted;
	 * - characters after a `^` are removed from whatever is accepted so far, and a mask that
	 *   *starts* with `^` therefore means "everything except";
	 * - `a-z` is an inclusive range, and a `-` that cannot form one is a literal;
	 * - `\` escapes the next character, so `\-`, `\^` and `\\` are literals;
	 * - the mask applies to typing only, never to text assigned in code.
	 *
	 * One deliberate difference: Flash distinguishes `restrict = null` (no restriction) from
	 * `restrict = ""` (reject everything). This port has always typed the field as a plain
	 * `string` defaulting to `''`, and every layout leaves it unset, so `''` has to keep meaning
	 * "no restriction" — treating it as Flash's empty mask would silently make every text field
	 * in the client read-only.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setRestrict()
    protected applyRestrict(value: string): string
    {
        if(this._restrict === '') return value;

        this.parseRestrict();

        let result = '';

        for(const char of value)
        {
            if(this.isCharRestrictAllowed(char.charCodeAt(0))) result += char;
        }

        return result;
    }

    // TS-only: builds the cached range lists behind applyRestrict().
    private parseRestrict(): void
    {
        if(this._restrictSource === this._restrict) return;

        this._restrictSource = this._restrict;
        this._restrictAllow = [];
        this._restrictDeny = [];

        const mask = this._restrict;

        // `^` flips which list subsequent characters land in, and can appear more than once.
        let target = this._restrictAllow;
        let index = 0;

        const readChar = (): number | null =>
        {
            if(index >= mask.length) return null;

            const char = mask[index];

            if(char === '\\')
            {
                index++;

                return index < mask.length ? mask.charCodeAt(index++) : null;
            }

            index++;

            return char.charCodeAt(0);
        };

        while(index < mask.length)
        {
            if(mask[index] === '^')
            {
                target = target === this._restrictAllow ? this._restrictDeny : this._restrictAllow;
                index++;
                continue;
            }

            const start = readChar();

            if(start === null) break;

            // A `-` only opens a range when there is something on both sides of it; trailing or
            // escaped ones are literals.
            if(mask[index] === '-' && index + 1 < mask.length && mask[index + 1] !== '^')
            {
                index++;

                const end = readChar();

                if(end === null)
                {
                    target.push([start, start]);
                    target.push([0x2D, 0x2D]);
                    break;
                }

                target.push([start, end]);
            }
            else
            {
                target.push([start, start]);
            }
        }
    }

    // TS-only: range lookup for applyRestrict().
    private isCharRestrictAllowed(code: number): boolean
    {
        const inRanges = (ranges: Array<[number, number]>): boolean =>
            ranges.some(([start, end]) => code >= start && code <= end);

        // No allow list at all means the mask was purely subtractive ("^abc"): everything passes
        // except what the deny list names.
        const allowed = this._restrictAllow.length === 0 || inRanges(this._restrictAllow);

        return allowed && !inRanges(this._restrictDeny);
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::refreshTextImage()
    protected refreshTextImage(fromResize: boolean = false): void
    {
        if(this._drawing) return;

        this._drawing = true;

        const horizontalMargins = this._marginLeft + this._marginRight;
        const verticalMargins = this._marginTop + this._marginBottom;
        const availableWidth = this._width - horizontalMargins;
        const availableHeight = this._height - verticalMargins;
        const borderPadding = this._border ? 1 : 0;
        let hasResized = false;

        if(this._autoSize === 'none')
        {
            this._fieldWidth = Math.max(0, availableWidth - borderPadding);
            this._fieldHeight = Math.max(0, availableHeight - borderPadding);
        }

        let textValue = this._text;

        if(typeof textValue !== 'string')
        {
            textValue = String(textValue ?? '');
        }

        if(this._autoSize === 'none' && this.isOverflowReplaceOn)
        {
            textValue = this.applyOverflowReplace(textValue, Math.max(0, availableWidth), Math.max(0, availableHeight));
            this._text = textValue;
            this._htmlText = textValue;
        }

        const measured = this.measureLayout(textValue, Math.max(1, this._fieldWidth));

        if(this._autoSize !== 'none')
        {
            this._fieldWidth = Math.ceil(measured.width);
            this._fieldHeight = Math.ceil(measured.height);

            // A flash.text.TextField reserves a 2px gutter above AND below its text, so
            // its height is the line box + 4. This used to be added only to background
            // fields, on the reasoning that the gutter is invisible without a fill and
            // widening the rest would shift them.
            //
            // It shifts them into place. Measured against the authored layouts across
            // three unrelated windows — the chat font-size picker, the quest list, the
            // achievement browser — every auto-sized box was short by exactly 2px at
            // every font size, background or not: the line box above now returns Flash's
            // own, and the remaining gap was this gutter going unapplied.
            this._fieldHeight += 2 * TextController.FLASH_TEXT_FIELD_TOP_GUTTER;
        }

        const fieldWidthWithBorder = Math.floor(this._fieldWidth) + borderPadding;

        if(fieldWidthWithBorder !== availableWidth)
        {
            // Flash: with `wordWrap` on, `autoSize` only affects height - the field keeps its
            // authored width and the text reflows inside it. Only a non-wrapping field widens.
            if(this._autoSize === 'left' && !this._wordWrap)
            {
                this.setRectangle(this.x, this.y, fieldWidthWithBorder + horizontalMargins, Math.floor(this._fieldHeight) + verticalMargins);
                hasResized = true;
            }
            else if(this._wordWrap && this._autoSize !== 'none')
            {
                // Hold the authored width; leave `_fieldHeight` as measured so the height branch
                // below can grow the box to fit the wrapped lines.
                this._fieldWidth = Math.max(0, availableWidth - borderPadding);
            }
            else if(this._autoSize !== 'right' && this._autoSize !== 'center')
            {
                this._fieldWidth = Math.max(0, availableWidth - borderPadding);
                this._fieldHeight = Math.max(0, availableHeight - borderPadding);
            }
        }

        const fieldHeightWithBorder = Math.floor(this._fieldHeight) + borderPadding;

        if(fieldHeightWithBorder < availableHeight)
        {
            if(this._autoSize === 'none')
            {
                this._fieldHeight = Math.max(0, availableHeight - borderPadding);
            }
            else
            {
                this.height = Math.floor(this._fieldHeight) + verticalMargins;
                hasResized = true;
            }
        }
        else if(fieldHeightWithBorder > availableHeight)
        {
            if(this._autoSize !== 'none')
            {
                this.height = Math.floor(this._fieldHeight) + verticalMargins;
                hasResized = true;
            }
        }

        this._textWidthCache = measured.width;
        this._textHeightCache = measured.height;
        this._numLinesCache = measured.lines.length;
        // AS3 asks its TextField for a line's text on demand; this port measures the wrapped
        // lines here and nowhere else, so the getLine* family reads them off this cache.
        this._linesCache = measured.lines;
        this._maxScrollHCache = Math.max(0, Math.ceil(measured.width - Math.max(0, this._fieldWidth)));

        this._drawing = false;
        this._context.invalidate(this, null, 1);

        if(!hasResized && !fromResize && this._eventDispatcher)
        {
            const event = WindowEvent.allocate(WindowEvent.WE_RESIZED, this, null);
            this._eventDispatcher.dispatchEvent(event);
            event.recycle();
        }
    }

    /**
     * Fills in from the named style every field this window has NOT set for
     * itself.
     *
     * The direction is the whole point, and it used to be the other way round:
     * the named style was copied over the fields unconditionally, so a layout
     * that asked for `font_face="Ubuntu" font_size="13" antialias_type="advanced"`
     * rendered in whatever the theme's style for its `style` number said — the
     * theme won every time, on every text window in the client. AS3 guards each
     * assignment on the *instance* override being empty, never on the style
     * having a value.
     *
     * The emptiness test is AS3's own falsiness, not a null check, so a
     * `letterSpacing` of 0 or a `kerning` of false read as "not set" and take
     * the style's value. The two etching fields are the exception AS3 makes -
     * it tests those with `== null`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setTextFormatting()
    protected applyTextStyle(): void
    {
        const style = TextStyleManager.getStyle(this._textStyleName) ?? TextStyleManager.getStyle('regular');

        if(!style) return;

        const explicit = this._explicitStyle;

        if(!explicit.fontFamily && style.fontFamily != null) this._fontFace = style.fontFamily;
        if(!explicit.fontSize && style.fontSize != null) this._fontSize = style.fontSize;
        if(!explicit.color && style.color != null) this._textColor = style.color;
        if(!explicit.fontWeight && style.fontWeight != null) this._bold = style.fontWeight === 'bold';
        if(!explicit.fontStyle && style.fontStyle != null) this._italic = style.fontStyle === 'italic';
        if(!explicit.textDecoration && style.textDecoration != null) this._underline = style.textDecoration === 'underline';
        if(!explicit.letterSpacing && style.letterSpacing != null) this._spacing = style.letterSpacing;
        if(!explicit.leading && style.leading != null) this._leading = style.leading;
        if(!explicit.kerning && style.kerning != null) this._kerning = style.kerning;
        if(explicit.etchingColor == null && style.etchingColor != null) this._etchingColor = style.etchingColor;
        if(explicit.etchingPosition == null && style.etchingPosition != null) this._etchingPosition = style.etchingPosition;
        if(!explicit.antiAliasType && style.antiAliasType != null) this._antiAliasType = style.antiAliasType;
        if(!explicit.sharpness && style.sharpness != null) this._sharpness = style.sharpness;
        if(!explicit.thickness && style.thickness != null) this._thickness = style.thickness;

        this.applyTextStyleDefaults(style);
    }

    /**
     * setTextFormatting()'s second pass: every field that NEITHER the named
     * style NOR this window set falls back to a hard default.
     *
     * Field initialisers cover this for a freshly built window, which is why
     * the port could go without it — but not after a style change, where a
     * field still carries the previous style's value and neither the new style
     * nor the window has an opinion on it.
     *
     * The two etching lines go through their setters, not the backing fields,
     * because AS3's do (`param1.etchingColor = 0`) and those setters record an
     * explicit override — so defaulting etching here also pins it, and a later
     * style cannot move it. That is AS3's behaviour, quirk included.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setTextFormatting()
    // AS3's `_loc6_.indent = 0` line has no counterpart here — this port
    // models no text indent at all (TextStyle parses `text-indent`, TextController has
    // no field for it), so there is nothing to reset.
    protected applyTextStyleDefaults(style: TextStyle): void
    {
        const explicit = this._explicitStyle;

        if(!style.fontWeight && !explicit.fontWeight) this._bold = false;
        if(!style.fontStyle && !explicit.fontStyle) this._italic = false;
        if(!style.textDecoration && !explicit.textDecoration) this._underline = false;
        if(!style.leading && !explicit.leading) this._leading = 0;
        if(!style.kerning && !explicit.kerning) this._kerning = false;
        if(!style.letterSpacing && !explicit.letterSpacing) this._spacing = 0;

        if(!style.antiAliasType && !explicit.antiAliasType)
        {
            this._antiAliasType = 'advanced';
            this._gridFitType = 'pixel';
        }

        if(!style.sharpness && !explicit.sharpness) this._sharpness = 0;
        if(!style.thickness && !explicit.thickness) this._thickness = 0;
        if(style.etchingColor == null && explicit.etchingColor == null) this.etchingColor = 0;
        if(style.etchingPosition == null && explicit.etchingPosition == null) this.etchingPosition = 'bottom';
    }

    protected resolveThemeTextStyle(context: IWindowContext, style: number): string
    {
        try
        {
            const defaults = context.getWindowFactory()?.getThemeManager()?.getPropertyDefaults(style);
            const raw = defaults?.getValue('text_style');

            if(raw instanceof PropertyStruct)
            {
                if(typeof raw.value === 'string' && raw.value.length > 0)
                {
                    return raw.value;
                }
            }
            else if(typeof raw === 'string' && raw.length > 0)
            {
                return raw;
            }
        }
        catch (_error)
        {
            // Ignore theme bootstrap errors.
        }

        return 'regular';
    }

    protected applyOverflowReplace(value: string, maxWidth: number, maxHeight: number): string
    {
        let output = value;

        if(typeof output !== 'string')
        {
            output = String(output ?? '');
        }

        if(!output || !this._overflowReplace)
        {
            return output;
        }

        const verticalMargins = this._marginTop + this._marginBottom;
        const horizontalMargins = this._marginLeft + this._marginRight;
        const wrapWidth = Math.max(1, this._fieldWidth);

        if(this.measureLayout(output, wrapWidth).height + verticalMargins > maxHeight)
        {
            let index = output.length;

            while(index > 0)
            {
                const candidate = output.slice(0, index - 1) + this._overflowReplace;

                if(this.measureLayout(candidate, wrapWidth).height + verticalMargins <= maxHeight)
                {
                    output = candidate;
                    break;
                }

                index--;
            }
        }

        if(this.measureLineWidth(output) + horizontalMargins > maxWidth)
        {
            let index = output.length;

            while(index > 0)
            {
                const candidate = output.slice(0, index - 1) + this._overflowReplace;

                if(this.measureLineWidth(candidate) + horizontalMargins <= maxWidth)
                {
                    output = candidate;
                    break;
                }

                index--;
            }
        }

        return output;
    }

    protected measureLayout(value: string, maxWidth: number): ITextLayout
    {
        let safeValue = value;

        if(typeof safeValue !== 'string')
        {
            safeValue = String(safeValue ?? '');
        }

        const text = this._condenseWhite ? safeValue.replace(/\s+/g, ' ') : safeValue;
        const lines = text.length > 0 ? this.buildMeasureLines(text, maxWidth) : [''];
        let width = 0;

        if(this._maxLines > 0 && lines.length > this._maxLines)
        {
            lines.length = this._maxLines;
        }

        // The runs index into the text, so a line's width depends on where that line starts.
        // `indexOf` from a running cursor recovers it for both split and wrapped lines, which are
        // substrings of `text` in order. An unformatted field ignores the offset entirely.
        let cursor = 0;

        for(const line of lines)
        {
            const found = line.length > 0 ? text.indexOf(line, cursor) : -1;
            const start = found === -1 ? cursor : found;
            const current = this.measureLineWidth(line, start);

            cursor = start + line.length;

            if(current > width)
            {
                width = current;
            }
        }

        const lineHeight = this.getLineHeight();

        return {
            lines,
            width: Math.ceil(width),
            height: Math.ceil(Math.max(lineHeight, lines.length * lineHeight))
        };
    }

    protected buildMeasureLines(text: string, maxWidth: number): string[]
    {
        const out: string[] = [];
        const baseLines = text.split('\n');

        // Where this base line starts inside `text`, so wrapping can measure formatted runs.
        let offset = 0;

        for(const baseLine of baseLines)
        {
            // Flash wraps on `wordWrap` alone - `multiline` governs newline handling and input,
            // not line breaking - and `autoSize` does not disable it either, it only decides which
            // side the field grows on. Requiring autoSize === 'none' here left every
            // `word_wrap="true" auto_size="left"` field measured as one endless line - the alert
            // dialog's summary reached 265px inside a 266px container starting at x=27 and was
            // clipped, which is the truncated body text.
            //
            // Requiring `_multiline` on top of it left the measurement disagreeing with
            // `TextSkinRenderer`, which wraps on `tw.wordWrap` with no such condition: the infostand
            // motto (`<input word_wrap="true">`, no `multiline` var) measured as one 141px line, so
            // `InfoStandUserView.setMotto()`'s `min(textHeight + 5, 50)` sized the box for one line
            // and the renderer drew two, the second one cut off. The 50px clamp there is AS3's own
            // proof that this field wraps - a single line can never approach it.
            if(this._wordWrap)
            {
                const wrapped = this.wrapLine(baseLine, maxWidth, offset);

                for(const line of wrapped)
                {
                    out.push(line);
                }
            }
            else
            {
                out.push(baseLine);
            }

            // +1 for the newline the split consumed.
            offset += baseLine.length + 1;
        }

        return out.length > 0 ? out : [''];
    }

    protected wrapLine(line: string, maxWidth: number, offset: number = 0): string[]
    {
        if(!line) return [''];

        const words = line.split(' ');
        const out: string[] = [];
        let current = '';
        let currentOffset = offset;

        for(const word of words)
        {
            const candidate = current ? `${current} ${word}` : word;

            if(this.measureLineWidth(candidate, currentOffset) <= maxWidth || !current)
            {
                current = candidate;
            }
            else
            {
                out.push(current);
                // +1 for the space that separated the emitted line from this word.
                currentOffset += current.length + 1;
                current = word;
            }

            if(this.measureLineWidth(current, currentOffset) > maxWidth)
            {
                const broken = this.wrapLongWord(current, maxWidth, currentOffset);

                if(broken.length > 0)
                {
                    out.push(...broken.slice(0, broken.length - 1));
                    currentOffset += current.length - broken[broken.length - 1].length;
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

    protected wrapLongWord(word: string, maxWidth: number, offset: number = 0): string[]
    {
        const out: string[] = [];
        let current = '';
        let currentOffset = offset;

        for(let i = 0; i < word.length; i++)
        {
            const next = current + word.charAt(i);

            if(this.measureLineWidth(next, currentOffset) <= maxWidth || !current)
            {
                current = next;
            }
            else
            {
                out.push(current);
                currentOffset += current.length;
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
	 * The atlas this field's text is drawn through, or null when the atlas is
	 * disabled.
	 *
	 * Measurement has to come from the same place as drawing: with
	 * `gridFitType = "pixel"` the atlas rounds advances to whole pixels, so a
	 * field measured with `ctx.measureText()` and drawn with the atlas would
	 * auto-size to the wrong width.
	 */
    // TS-only: no AS3 counterpart — Flash's TextField both measures and draws.
    protected getAtlas(): GlyphAtlas | null
    {
        return this.atlasForFont(this.buildCanvasFontString());
    }

    /**
	 * The atlas for one specific font string, which for a formatted run is not
	 * this field's own — a bold run is a different face and therefore a
	 * different atlas, exactly as `TextSkinRenderer.drawTextLineWithRuns()`
	 * resolves it.
	 */
    // TS-only: no AS3 counterpart; see getAtlas().
    protected atlasForFont(fontString: string, fontSize: number = this._fontSize): GlyphAtlas | null
    {
        if(!GlyphAtlas.handles(this._antiAliasType)) return null;

        return GlyphAtlas.get(
            fontString,
            fontSize,
            this._antiAliasType,
            this._sharpness,
            this._thickness,
            this._gridFitType
        );
    }

    protected measureLineWidth(text: string, offset: number = 0): number
    {
        if(typeof text !== 'string')
        {
            text = String(text ?? '');
        }

        if(!text) return 0;

        // A formatted field is drawn run by run, so it has to be measured run by run: see
        // measureFormattedLineWidth(). `offset` is where `text` starts inside `_text`, which is
        // the coordinate space the runs are expressed in.
        if(this._formatRuns.length > 0) return this.measureFormattedLineWidth(text, offset);

        const atlas = this.getAtlas();

        if(atlas) return atlas.measure(text, this._spacing);

        const ctx = TextController.getMeasureContext();

        ctx.font = this.buildCanvasFontString();

        if(this._spacing === 0 || text.length <= 1)
        {
            return ctx.measureText(text).width;
        }

        // Per character, because that is how TextSkinRenderer.drawTextLine() walks a spaced line.
        // A whole-string measureText() is kerned and therefore shorter than the advances actually
        // walked, which sized the box narrower than the line drawn into it.
        let baseWidth = 0;

        for(let i = 0; i < text.length; i++)
        {
            baseWidth += ctx.measureText(text.charAt(i)).width;
        }

        return baseWidth + ((text.length - 1) * this._spacing);
    }

    /**
	 * Width of one line of a *formatted* field, measured the way it is drawn.
	 *
	 * The doc on getAtlas() states the rule this restores: measurement has to come from the same
	 * place as drawing. `TextSkinRenderer.drawTextLineWithRuns()` walks the line one character at a
	 * time, swapping the canvas font for whichever run covers that index, and sums those advances.
	 * This measured the whole string once in the field's *base* font instead, so every character a
	 * run made bold was measured narrow.
	 *
	 * On an auto-sizing field that is not cosmetic: the box is sized to this number, and the
	 * renderer clips the line to the box. `extendedprofile.username` is `<b>%username%</b>`, so
	 * "Admin" was measured at 33px regular, boxed at 33px, and drawn at ~37px bold — the "n" and
	 * half the "i" fell outside the clip. 93 of the 97 markup-carrying strings in
	 * external_flash_texts.json format only *part* of their text, so this cannot be shortcut by
	 * testing whether one run covers everything.
	 *
	 * Per character rather than per run on purpose: that is what the renderer does, and summing
	 * whole-run widths would drift from it by the kerning at each run boundary.
	 */
    // TS-only: mirrors TextSkinRenderer.drawTextLineWithRuns(); Flash's TextField measured and drew
    // its own formatted text, so AS3 has no counterpart.
    protected measureFormattedLineWidth(text: string, offset: number): number
    {
        const ctx = TextController.getMeasureContext();
        const baseFont = this.buildCanvasFontString();
        const atlasInUse = GlyphAtlas.handles(this._antiAliasType);
        let width = 0;
        let currentFont = '';

        for(let i = 0; i < text.length; i++)
        {
            const index = offset + i;
            const run = this._formatRuns.find((r) => index >= r.start && index < r.end);
            // `<font size>` sets its own size for the run; everything else keeps the field's.
            const runFontSize = run?.format.size ?? this._fontSize;
            const font = run
                ? this.buildCanvasFontString(run.format.bold ?? this._bold, run.format.italic ?? this._italic, runFontSize)
                : baseFont;
            const atlas = atlasInUse ? this.atlasForFont(font, runFontSize) : null;

            if(atlas)
            {
                width += atlas.measure(text.charAt(i), 0);

                continue;
            }

            if(font !== currentFont)
            {
                ctx.font = font;
                currentFont = font;
            }

            width += ctx.measureText(text.charAt(i)).width;
        }

        if(this._spacing !== 0 && text.length > 1) width += (text.length - 1) * this._spacing;

        return width;
    }

    protected buildCanvasFontString(bold: boolean = this._bold, italic: boolean = this._italic, fontSize: number = this._fontSize): string
    {
        let font = '';

        if(italic) font += 'italic ';
        if(bold) font += 'bold ';
        font += `${fontSize}px ${quoteFontFamilyList(this._fontFace || 'Ubuntu, Arial, sans-serif')}`;

        return font;
    }

    protected getLineHeight(): number
    {
        const ctx = TextController.getMeasureContext();

        // The tallest size any run asks for: a line has to clear its biggest glyph, and
        // `achievements.levelup.reward` puts a `<font size="30">` amount inside a small field.
        // Field-wide rather than per line, matching TextSkinRenderer.compositeTextMultiline() —
        // roomier than Flash on a multiline field that mixes sizes, never shorter.
        let fontSize = this._fontSize;

        for(const run of this._formatRuns)
        {
            if(run.format.size != null && run.format.size > fontSize) fontSize = run.format.size;
        }

        ctx.font = this.buildCanvasFontString(this._bold, this._italic, fontSize);

        return Math.max(1, measureFontLineHeight(ctx, fontSize, this._leading));
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::replaceNonRenderableCharacters()
    protected replaceNonRenderableCharacters(value: string): string
    {
        // AS3 checks glyph support on embedded fonts; browser canvas does not expose equivalent APIs.
        return value;
    }

    protected isLocalizationKey(value: string): boolean
    {
        return value.length > 3 && value.charAt(0) === '$' && value.charAt(1) === '{' && value.indexOf('}') > 1;
    }

    protected getLocalizationKeyFromCaption(): string | null
    {
        if(!this.isLocalizationKey(this._caption)) return null;

        const end = this._caption.indexOf('}');

        if(end <= 2) return null;

        return this._caption.slice(2, end);
    }

    protected registerLocalizationListenerForCaption(): void
    {
        const key = this.getLocalizationKeyFromCaption();

        if(!key) return;

        this.context.registerLocalizationListener(key, this);
    }

    protected removeLocalizationListenerForCaption(): void
    {
        const key = this.getLocalizationKeyFromCaption();

        if(!key) return;

        this.context.removeLocalizationListener(key, this);
    }

    protected static getMeasureContext(): MeasureContext
    {
        if(TextController._measureCtx)
        {
            return TextController._measureCtx;
        }

        if(typeof OffscreenCanvas !== 'undefined')
        {
            TextController._measureCanvas = new OffscreenCanvas(1, 1);
            TextController._measureCtx = TextController._measureCanvas.getContext('2d');
        }
        else if(typeof document !== 'undefined')
        {
            TextController._measureCanvas = document.createElement('canvas');
            TextController._measureCanvas.width = 1;
            TextController._measureCanvas.height = 1;
            TextController._measureCtx = TextController._measureCanvas.getContext('2d');
        }

        if(!TextController._measureCtx)
        {
            throw new Error('Text measurement context is unavailable.');
        }

        return TextController._measureCtx;
    }

    // Keys are wire-format property names (snake_case, e.g. from JSON layout
    // data) dispatching to setter logic - they must stay snake_case to match
    // what's actually parsed, not camelCase.
    /* eslint-disable @typescript-eslint/naming-convention */
    // AS3: .../src/com/sulake/core/window/components/TextController.as::createPropertySetterTable()
    protected static createPropertySetterTable(): Record<string, (ctrl: TextController, value: unknown) => void>
    {
        return {
            'always_show_selection': (ctrl, v) =>
            {
                ctrl._alwaysShowSelection = !!v;
            },
            'antialias_type': (ctrl, v) =>
            {
                ctrl.antiAliasType = String(v);
            },
            'auto_size': (ctrl, v) =>
            {
                ctrl._autoSize = String(v ?? 'none');
                ctrl.refreshTextImage();
            },
            'background': (ctrl, v) =>
            {
                ctrl.background = !!v;
            },
            'background_color': (ctrl, v) =>
            {
                ctrl.color = Number(v);
            },
            'bold': (ctrl, v) =>
            {
                ctrl.bold = !!v;
            },
            'border': (ctrl, v) =>
            {
                ctrl._border = !!v;
                ctrl.refreshTextImage();
            },
            'border_color': (ctrl, v) =>
            {
                ctrl._borderColor = Number(v);
                ctrl.refreshTextImage();
            },
            'condense_white': (ctrl, v) =>
            {
                ctrl._condenseWhite = !!v;
                ctrl.refreshTextImage();
            },
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setDefaultTextFormat()
            // AS3 assigns a whole flash.text.TextFormat object (`_field.defaultTextFormat = value`) in
            // one shot, and the port's `defaultTextFormat` accessor now takes the same exchange. The key
            // is still not handled here because a layout property arrives as a *string*: there is no
            // syntax for a TextFormat literal in the XML, and no shipped layout emits this key. The
            // granular keys in this table (bold/font_face/font_size/italic/...) are how a layout says it.
            'default_text_format': (ctrl) =>
            {
                ctrl.refreshTextImage();
            },
            'etching_color': (ctrl, v) =>
            {
                ctrl.etchingColor = Number(v);
            },
            'etching_position': (ctrl, v) =>
            {
                ctrl.etchingPosition = String(v);
            },
            'font_face': (ctrl, v) =>
            {
                ctrl.fontFace = String(v);
            },
            'font_size': (ctrl, v) =>
            {
                ctrl.fontSize = Number(v);
            },
            'grid_fit_type': (ctrl, v) =>
            {
                ctrl._gridFitType = String(v);
                ctrl.refreshTextImage();
            },
            'italic': (ctrl, v) =>
            {
                ctrl.italic = !!v;
            },
            'kerning': (ctrl, v) =>
            {
                ctrl.kerning = !!v;
            },
            'leading': (ctrl, v) =>
            {
                ctrl.leading = Number(v);
            },
            'margin_left': (ctrl, v) =>
            {
                ctrl._marginLeft = Number(v);
                ctrl.refreshTextImage();
            },
            'margin_top': (ctrl, v) =>
            {
                ctrl._marginTop = Number(v);
                ctrl.refreshTextImage();
            },
            'margin_right': (ctrl, v) =>
            {
                ctrl._marginRight = Number(v);
                ctrl.refreshTextImage();
            },
            'margin_bottom': (ctrl, v) =>
            {
                ctrl._marginBottom = Number(v);
                ctrl.refreshTextImage();
            },
            // JSON layouts commonly declare a single nested `margins: {left,top,right,bottom}`
            // var (serialized to XML as a Map) rather than 4 flat margin_* vars — without this
            // entry, that whole var was silently dropped and text rendered with 0 margins.
            'margins': (ctrl, v) =>
            {
                const margins = v as {left?: number; top?: number; right?: number; bottom?: number} | null;

                if(margins)
                {
                    if(typeof margins.left === 'number') ctrl._marginLeft = margins.left;
                    if(typeof margins.top === 'number') ctrl._marginTop = margins.top;
                    if(typeof margins.right === 'number') ctrl._marginRight = margins.right;
                    if(typeof margins.bottom === 'number') ctrl._marginBottom = margins.bottom;
                }

                ctrl.refreshTextImage();
            },
            'max_chars': (ctrl, v) =>
            {
                ctrl._maxChars = Math.max(0, Number(v));
                ctrl.refreshTextImage();
            },
            'max_lines': (ctrl, v) =>
            {
                ctrl._maxLines = Math.max(0, Number(v));
                ctrl.refreshTextImage();
            },
            'mouse_wheel_enabled': (ctrl, v) =>
            {
                ctrl._mouseWheelEnabled = !!v;
            },
            'multiline': (ctrl, v) =>
            {
                ctrl._multiline = !!v;
                ctrl.refreshTextImage();
            },
            'overflow_replace': (ctrl, v) =>
            {
                ctrl._overflowReplace = String(v ?? '');
                ctrl.refreshTextImage();
            },
            'restrict': (ctrl, v) =>
            {
                ctrl._restrict = String(v ?? '');
            },
            'sharpness': (ctrl, v) =>
            {
                ctrl.sharpness = Number(v);
            },
            'spacing': (ctrl, v) =>
            {
                ctrl.spacing = Number(v);
            },
            'text_color': (ctrl, v) =>
            {
                ctrl.textColor = Number(v);
            },
            'selected_text_color': (ctrl, v) =>
            {
                ctrl._selectedTextColor = Number(v);
            },
            'text_style': (ctrl, v) =>
            {
                ctrl._textStyleName = String(v);
                ctrl._hasExplicitTextStyle = true;
                ctrl.applyTextStyle();
                ctrl.refreshTextImage();
            },
            'thickness': (ctrl, v) =>
            {
                ctrl.thickness = Number(v);
            },
            'underline': (ctrl, v) =>
            {
                ctrl.underline = !!v;
            },
            'word_wrap': (ctrl, v) =>
            {
                ctrl._wordWrap = !!v;
                ctrl.refreshTextImage();
            },
        };
    }
    /* eslint-enable @typescript-eslint/naming-convention */
}
