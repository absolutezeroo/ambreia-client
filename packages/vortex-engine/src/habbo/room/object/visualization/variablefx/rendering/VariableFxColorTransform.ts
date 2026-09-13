/**
 * Flash's `ColorTransform`, reduced to what the VariableFx composer actually uses: per-channel
 * multipliers and no offsets.
 *
 * The composer only ever builds two shapes — an alpha-only transform for opacity, and a tint whose
 * RGB multipliers come from a colour — and never reads an offset back, so the offsets AS3's class
 * carries are deliberately absent rather than carried as always-zero fields. A renderer that needs
 * them will have to add them, and will be the first.
 *
 * Canvas has no equivalent at all, which is the whole reason this exists as a value the composer
 * interprets rather than something handed to a draw call: see
 * `VariableFxBitmapComposer.applyColorTransform()`.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/VariableFxBitmapComposer.as::createTintColorTransform()
 */
export class VariableFxColorTransform
{
    readonly redMultiplier: number;
    readonly greenMultiplier: number;
    readonly blueMultiplier: number;
    readonly alphaMultiplier: number;

    constructor(
        redMultiplier: number = 1,
        greenMultiplier: number = 1,
        blueMultiplier: number = 1,
        alphaMultiplier: number = 1
    )
    {
        this.redMultiplier = redMultiplier;
        this.greenMultiplier = greenMultiplier;
        this.blueMultiplier = blueMultiplier;
        this.alphaMultiplier = alphaMultiplier;
    }

    /** True when the transform only dims — the cheap case, which needs no pixel work. */
    get isAlphaOnly(): boolean
    {
        return this.redMultiplier === 1 && this.greenMultiplier === 1 && this.blueMultiplier === 1;
    }
}
