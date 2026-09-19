import type {IWindow} from '../../IWindow';
import {buildCanvasFontString} from '../../utils/CanvasFontString';
import type {ITextWindowShape} from './TextSkinRenderer';
import {TextSkinRenderer} from './TextSkinRenderer';

/**
 * Duck-typed view of the `TextLabelController` members this renderer reads.
 */
interface ILabelWindowShape
{
    text?: string;
    vertical?: boolean;
    drawOffsetX?: number;
    drawOffsetY?: number;
    hasTextColor?: boolean;
    textColor?: number;
    fontSize?: number;
    fontFace?: string;
    bold?: boolean;
    italic?: boolean;
    etchingColor?: number;
    etchingPosition?: string;
    spacing?: number;
    _spacing?: number;
    marginTop?: number;
    _marginTop?: number;
    marginBottom?: number;
    _marginBottom?: number;
}

/**
 * Draws a `label` window's content — the type the game's own element
 * description (`window-skins/habbo_element_description_xml.xml`) maps to
 * `renderer="label"`, and the only one.
 *
 * Ported from AS3 `LabelRenderer`, which — unlike `TextSkinRenderer` — reads
 * its text style off `TextLabelController.textStyle` rather than the window,
 * positions at `drawOffsetX`/`drawOffsetY`, and supports `vertical` labels by
 * rotating its draw matrix a quarter-turn.
 *
 * Two of those three differences are already satisfied by the inherited path
 * and are deliberately not re-implemented here:
 *
 * - `drawOffsetX`/`drawOffsetY` are `margins.left`/`margins.top` in AS3
 *   (`TextLabelController.as:184-192`) and in this port
 *   (`TextLabelController.ts:215-227`), which is the same value the inherited
 *   draw already positions against. Reading them through the other accessor
 *   would change nothing.
 * - AS3 sources the etch colour and position from the *style*
 *   (`textStyle.etchingColor`); this port resolves the style into the
 *   controller's own `_etchingColor`/`_etchingPosition` fields at parse time
 *   (`TextLabelController.ts:265-266`), so the window-level read the inherited
 *   draw performs already returns the style's value.
 *
 * `vertical` is the one that was genuinely lost when this drawing lived in
 * `WindowComposite`: the flag was parsed and stored, `TextLabelController`
 * swapped the box's width and height for it, and nothing ever rotated the
 * glyphs. No shipped layout sets it on a label today, so this restores a latent
 * mechanism rather than fixing a visible bug.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/LabelRenderer.as
 */
export class LabelRenderer extends TextSkinRenderer
{
    // An override used to sit here returning 0, so that no label ever took the base class's 2px
    // gutter. It asked, in as many words, to be revisited once the label boxes had been measured
    // the way the text ones were. They have been, and it said the opposite of what it assumed:
    //
    // - AS3 draws a **TextField** in both renderers — `LabelRenderer.as` blits one out of
    //   `TextFieldCache` at `drawOffsetY` exactly as `TextSkinRenderer.as` blits its own at
    //   `margins.top` — so a label carries the same 2px internal gutter a text window does.
    // - Of the 148 shipped labels whose style resolves to a size `FLASH_LINE_BOX` knows, **134
    //   are authored at exactly `lineBox + 4`** and not one at `lineBox` alone. They are sized
    //   for both gutters.
    //
    // The counter-example the note cited — the friend list's `caption`, style `bold`, size 9,
    // authored 13px — no longer clips, and the reason is that the note predates
    // `FlashTextMetrics`. `measureFontLineHeight()` now answers 10 for size 9 where it used to
    // return the browser's font box, which for Ubuntu runs several pixels taller; 2 + 10 = 12
    // fits in 13, and it is the old taller number that was pushing descenders out.
    //
    // So: no override. A label is a TextField and gets the gutter.

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/LabelRenderer.as::isStateDrawable()
    public override isStateDrawable(state: number): boolean
    {
        return state === 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/LabelRenderer.as::draw()
    public override draw(
        window: IWindow,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        state: number,
        colorize: boolean
    ): void
    {
        const lw = window as unknown as ILabelWindowShape;

        if(!lw.vertical)
        {
            super.draw(window, ctx, rect, state, colorize);

            return;
        }

        this.drawVertical(window, lw, ctx, rect);
    }

    /**
	 * Draws a quarter-turned label.
	 *
	 * AS3 rotates the blit matrix rather than the text: `a=0, b=-1, c=1, d=0`
	 * with `ty += height` (LabelRenderer.as l.51-57). Canvas2D's
	 * `transform(a,b,c,d,e,f)` uses the same convention as `flash.geom.Matrix`,
	 * so the same six numbers apply directly, composed on top of a translate to
	 * the window's absolute position — AS3 draws into the window's own buffer,
	 * where that translate is implicit.
	 *
	 * The etch offsets swap and one negates under the rotation
	 * (`tx += offset.y; ty -= offset.x`, l.68-73), because the offsets are
	 * expressed in unrotated screen space.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/LabelRenderer.as::draw()
    private drawVertical(
        window: IWindow,
        lw: ILabelWindowShape,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number }
    ): void
    {
        const text = lw.text ?? window.caption;

        if(!text) return;

        const fontSize = lw.fontSize ?? 12;
        const fontFace = lw.fontFace || 'Ubuntu, Arial, sans-serif';
        const isBold = lw.bold ?? false;
        const isItalic = lw.italic ?? false;

        // AS3 falls back to the style's colour when the label carries no
        // explicit one: `textField.textColor = hasTextColor ? textColor : style.color`.
        // This port resolves the style into _textColor at parse time, so the
        // window-level read already carries whichever of the two applies.
        const textColor = lw.textColor ?? 0x000000;
        const r = (textColor >> 16) & 0xFF;
        const g = (textColor >> 8) & 0xFF;
        const b = textColor & 0xFF;

        const drawOffsetX = lw.drawOffsetX ?? 0;
        const drawOffsetY = lw.drawOffsetY ?? 0;
        const spacing = lw.spacing ?? lw._spacing ?? 0;
        const marginT = lw.marginTop ?? lw._marginTop ?? 0;
        const marginB = lw.marginBottom ?? lw._marginBottom ?? 0;

        // A vertical label's text runs along the box's height, so the height —
        // not the width — bounds the line. TextLabelController.autoSize() sizes
        // the box that way too (its `vertical` branch swaps the two).
        const maxWidth = rect.height - marginT - marginB;

        if(maxWidth <= 0) return;

        const etchColor = lw.etchingColor ?? 0;
        const hasEtching = etchColor !== 0 && ((etchColor >>> 24) & 0xFF) > 0;
        const offset = hasEtching ? LabelRenderer.ETCHING_POSITION[lw.etchingPosition ?? ''] : null;

        const fontStr = buildCanvasFontString(fontSize, fontFace, isBold, isItalic);

        // drawVertical() bypasses super.draw(), so it has to resolve its own
        // atlas — otherwise drawTextLine() would reuse whatever the previous
        // window left behind.
        this.useAtlas(window as unknown as ITextWindowShape, fontStr, fontSize);

        ctx.save();
        ctx.font = fontStr;
        ctx.textBaseline = 'top';

        // AS3 draws into the window's own buffer; this port draws into the
        // shared composite, so the window's absolute origin is applied first
        // and the AS3 matrix composed on top of it.
        ctx.translate(rect.x, rect.y);

        if(offset)
        {
            const a = ((etchColor >>> 24) & 0xFF) / 255;
            const er = (etchColor >> 16) & 0xFF;
            const eg = (etchColor >> 8) & 0xFF;
            const eb = etchColor & 0xFF;

            ctx.save();
            ctx.transform(0, -1, 1, 0, drawOffsetX + offset.y, drawOffsetY + rect.height - offset.x);
            ctx.fillStyle = `rgba(${er},${eg},${eb},${a})`;
            this.drawTextLine(ctx, text, 0, 0, maxWidth, spacing);
            ctx.restore();
        }

        ctx.transform(0, -1, 1, 0, drawOffsetX, drawOffsetY + rect.height);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        this.drawTextLine(ctx, text, 0, 0, maxWidth, spacing);

        ctx.restore();
    }
}
