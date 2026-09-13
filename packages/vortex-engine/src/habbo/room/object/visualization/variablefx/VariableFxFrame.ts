/**
 * What a renderer produces: one composited image plus the geometry the room needs to place it.
 *
 * `bitmapData` is an `OffscreenCanvas` where AS3 has a `BitmapData` — the port's standing
 * translation for it (see `room/utils/Rasterizer`), and what the renderers draw onto.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxFrame.as
 */
export class VariableFxFrame
{
    // AS3: .../variablefx/VariableFxFrame.as::bitmapData
    bitmapData: OffscreenCanvas | null = null;

    /**
     * Whatever the renderer needs to recognise the bitmap it last produced, so it can skip
     * recompositing an identical one. Opaque here on purpose: AS3 types it `Object` and each
     * renderer decides its own shape.
     */
    // AS3: .../variablefx/VariableFxFrame.as::cacheKey
    //   Name derived: the AS3 field is `_SafeStr_6799`, obfuscated and read only by whichever
    //   renderer wrote it.
    cacheKey: unknown = null;

    // AS3: .../variablefx/VariableFxFrame.as::updateId
    updateId: number = 0;

    // AS3: .../variablefx/VariableFxFrame.as::width
    width: number = 0;

    // AS3: .../variablefx/VariableFxFrame.as::height
    height: number = 0;

    /**
     * Nudges applied on top of the default placement, not the placement itself.
     * `VariableFxStackAddition` centres the bitmap horizontally and hangs it by its bottom edge,
     * then adds these:
     *
     *   offsetX = -(bitmapData.width / 2) + offsetX
     *   offsetY = stacked ? offsetY : -bitmapData.height + offsetY
     *
     * so a renderer whose artwork is not centred on its own hotspot corrects for it here rather
     * than padding the bitmap.
     */
    // AS3: .../variablefx/VariableFxFrame.as::offsetX
    //   Name RECOVERED, not derived: the AS3 field is `_SafeStr_10698`, and its one reader adds it
    //   into `offsetX` in VariableFxStackAddition.
    offsetX: number = 0;

    // AS3: .../variablefx/VariableFxFrame.as::offsetY
    //   Name RECOVERED — same reader, added into `offsetY`.
    offsetY: number = 0;

    // AS3: .../variablefx/VariableFxFrame.as::disposeBitmap()
    disposeBitmap(): void
    {
        // AS3 calls `bitmapData.dispose()`; an OffscreenCanvas has no such method and is collected
        // once nothing references it, so dropping the reference IS the disposal.
        this.bitmapData = null;
        this.cacheKey = null;
        this.width = 0;
        this.height = 0;
    }
}
