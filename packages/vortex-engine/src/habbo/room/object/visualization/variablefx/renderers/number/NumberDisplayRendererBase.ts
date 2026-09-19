import type {IVariableFxRenderer} from '../../IVariableFxRenderer';
import {VariableFxFrame} from '../../VariableFxFrame';
import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxConfiguredIcon} from '../../rendering/VariableFxConfiguredIcon';
import {VariableFxIconOverlayLayout} from '../../rendering/VariableFxIconOverlayLayout';
import type {INumberDisplayDesign, INumberDisplayDigit} from './NumberDisplayDesigns';

/**
 * A number drawn as a row of glyphs cut out of a sheet, with an optional icon beside it.
 *
 * The two subclasses differ in exactly one method — `drawDigit()` — and everything else is here:
 * which glyphs the value maps to, how wide the row comes out, where the icon goes, and when any of
 * it has to be redrawn. That last one is a string comparison rather than a number: the displayed
 * value is normalised to a string ONCE and the frame is stale when that string changes, which
 * means a value moving from 7.1 to 7.9 costs nothing.
 *
 * `composer` is deliberately a throwing getter rather than a field. It exists only between
 * `renderFrame()` setting it and the `finally` that clears it, so a subclass reaching for it
 * outside a draw gets an error naming the mistake instead of a null dereference.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/number/NumberDisplayRendererBase.as
 */
export class NumberDisplayRendererBase implements IVariableFxRenderer
{
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::_composer (name derived)
    //   `_SafeStr_7032`: live only for the duration of one `renderFrame()`.
    private _composer: VariableFxBitmapComposer | null = null;

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::_design (name derived)
    //   `_SafeStr_6658`: the metrics and glyph table this renderer was built with.
    private _design: INumberDisplayDesign;

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::_digitsByValue (name derived)
    //   `_SafeStr_8961`: the design's glyph table indexed by character.
    private _digitsByValue: Map<string, INumberDisplayDigit> = new Map();

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::_displayValue (name derived)
    //   `_SafeStr_6513`: the value as it will be drawn — already a string.
    private _displayValue: string;

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::_frame
    private _frame: VariableFxFrame = new VariableFxFrame();

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::_icon
    private _icon: VariableFxConfiguredIcon | null;

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::_alignment (name derived)
    //   `_SafeStr_9352`: which side the icon hangs off.
    private _alignment: string;

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::_renderedValue (name derived)
    //   `_SafeStr_7985`: the value the frame on screen currently shows.
    private _renderedValue: string = '';

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::NumberDisplayRendererBase()
    constructor(context: VariableFxRendererContext, design: INumberDisplayDesign)
    {
        this._design = design;
        this._displayValue = NumberDisplayRendererBase.normalizeDisplayValue(context.status.value);
        this._icon = VariableFxConfiguredIcon.resolve(context);
        this._alignment = VariableFxConfiguredIcon.resolveAlignment(context);

        for(const digit of design.digits) this._digitsByValue.set(digit.value, digit);
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::get frame()
    get frame(): VariableFxFrame
    {
        return this._frame;
    }

    /** A number never animates on its own — it changes when the value does, and not otherwise. */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::get isContinuous()
    get isContinuous(): boolean
    {
        return false;
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::updateData()
    updateData(context: VariableFxRendererContext, time: number): void
    {
        this._displayValue = NumberDisplayRendererBase.normalizeDisplayValue(context.status.value);

        this.updateRendererData(context, time);
    }

    /**
     * The frame's SIZE is not checked here — `ensureFrameBitmap()` does that, and the size is a
     * function of the value, so a size change always arrives as a value change first.
     */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::needsUpdate()
    needsUpdate(_time: number): boolean
    {
        return this._frame.bitmapData === null
            || this._displayValue !== this._renderedValue
            || this.needsRendererUpdate();
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::update()
    update(time: number): boolean
    {
        if(!this.needsUpdate(time)) return false;

        this.ensureFrameBitmap();
        this.renderFrame();

        this._renderedValue = this._displayValue;

        this.didRenderFrame();

        this._frame.updateId += 1;

        return true;
    }

    /** Available only while a frame is being drawn; see the class comment. */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::get composer()
    protected get composer(): VariableFxBitmapComposer
    {
        if(this._composer === null)
        {
            throw new Error('Variable FX number display composer is only available while rendering.');
        }

        return this._composer;
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::get digitHeight()
    protected get digitHeight(): number
    {
        return this._design.digitHeight;
    }

    /**
     * Can be NEGATIVE — `freeze_style` runs -4 so its glyphs overlap.
     *
     * AS3 guards this against a null field; every design in the dump sets it, so the guard is
     * unreachable there and the field is simply required here.
     */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::get digitSpacing()
    protected get digitSpacing(): number
    {
        return this._design.digitSpacing;
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::drawDigit()
    protected drawDigit(_digit: INumberDisplayDigit, _x: number, _y: number): void
    {
        // Subclasses draw.
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::updateRendererData()
    protected updateRendererData(_context: VariableFxRendererContext, _time: number): void
    {
        // Subclasses hook.
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::needsRendererUpdate()
    protected needsRendererUpdate(): boolean
    {
        return false;
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::didRenderFrame()
    protected didRenderFrame(): void
    {
        // Subclasses hook.
    }

    /**
     * A hook with two implementations and no caller, in the source as here. `resolveBitmapDataClassLayer`
     * has exactly three occurrences in the AIR dump — this declaration and the two overrides in
     * `BakedColorNumberDisplayRenderer` / `RecolorableNumberDisplayRenderer` — and the port carries
     * all three. The stacked-additions layer, which was the candidate caller when this was first
     * written, has since landed and does not call it either. Nothing is owed; it is declared so the
     * two overrides have something to override, exactly as in AS3.
     */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::resolveBitmapDataClassLayer()
    protected resolveBitmapDataClassLayer(): VariableFxDrawable | null
    {
        return null;
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::resolveContentLayout()
    protected resolveContentLayout(): VariableFxIconOverlayLayout
    {
        return VariableFxIconOverlayLayout.resolve({
            alignment: this._alignment,
            contentHeight: this.contentHeight,
            contentWidth: this.contentWidth,
            contentYOffsetPx: this._design.iconContentYOffsetPx,
            iconHeight: this._icon === null ? 0 : this._icon.bitmapData.height,
            iconOffsetX: 0,
            iconOffsetY: 0,
            iconWidth: this._icon === null ? 0 : this._icon.bitmapData.width,
            overlapPx: this._design.iconOverlapPx
        });
    }

    /** The glyphs' widths plus the gaps between them — not a digit count times a fixed width. */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::get contentWidth()
    private get contentWidth(): number
    {
        const digits = this.resolveDisplayDigits();
        let width = 0;

        for(let index = 0; index < digits.length; index++)
        {
            if(index > 0) width += this.digitSpacing;

            width += digits[index].width;
        }

        return Math.max(0, width);
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::get contentHeight()
    private get contentHeight(): number
    {
        return this._design.digitHeight;
    }

    /** Clearing the rendered value is what makes the next `update()` redraw into the new bitmap. */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::ensureFrameBitmap()
    private ensureFrameBitmap(): void
    {
        const layout = this.resolveContentLayout();

        if(this._frame.bitmapData !== null
            && this._frame.width === layout.frameWidth
            && this._frame.height === layout.frameHeight)
        {
            return;
        }

        this._frame.disposeBitmap();

        const bitmap = new OffscreenCanvas(Math.max(1, layout.frameWidth), Math.max(1, layout.frameHeight));

        this._frame.bitmapData = bitmap;
        this._frame.cacheKey = null;
        this._frame.width = bitmap.width;
        this._frame.height = bitmap.height;
        this._renderedValue = '';
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::renderFrame()
    private renderFrame(): void
    {
        const target = this._frame.bitmapData;

        if(target === null) return;

        const layout = this.resolveContentLayout();

        this._composer = new VariableFxBitmapComposer(target);

        try
        {
            this._composer.clear(0);
            this.drawNumberContent(layout.contentX, layout.contentY);
            this.drawConfiguredIcons(layout);
        }
        finally
        {
            this._composer = null;
        }
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::drawNumberContent()
    private drawNumberContent(x: number, y: number): void
    {
        let penX = x;

        for(const digit of this.resolveDisplayDigits())
        {
            this.drawDigit(digit, penX, y);

            penX += digit.width + this.digitSpacing;
        }
    }

    /** The same icon at every placement the layout asked for — usually one, occasionally two. */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::drawConfiguredIcons()
    private drawConfiguredIcons(layout: VariableFxIconOverlayLayout): void
    {
        const icon = this._icon;

        if(icon === null) return;

        for(const placement of layout.iconPlacements)
        {
            this.composer.drawLayer(icon.bitmapData, placement.x, placement.y, 'normal', 255);
        }
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::resolveDisplayDigits()
    private resolveDisplayDigits(): INumberDisplayDigit[]
    {
        const digits: INumberDisplayDigit[] = [];

        for(let index = 0; index < this._displayValue.length; index++)
        {
            digits.push(this.resolveDigit(this._displayValue.charAt(index)));
        }

        return digits;
    }

    /**
     * Throws on a character the design has no glyph for. Kept: the value is normalised to digits
     * and a minus sign, all of which every design carries, so this firing means the normalisation
     * let something else through.
     */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::resolveDigit()
    private resolveDigit(value: string): INumberDisplayDigit
    {
        const digit = this._digitsByValue.get(value);

        if(digit === undefined) throw new Error(`Missing Variable FX number display digit '${value}'.`);

        return digit;
    }

    /** Truncated, not rounded — and a non-finite value shows as `0` rather than throwing. */
    // AS3: .../renderers/number/NumberDisplayRendererBase.as::normalizeDisplayValue()
    private static normalizeDisplayValue(value: number): string
    {
        if(!Number.isFinite(value)) return '0';

        return String(Math.trunc(value));
    }

    // AS3: .../renderers/number/NumberDisplayRendererBase.as::dispose()
    dispose(): void
    {
        this._frame.disposeBitmap();
    }
}
