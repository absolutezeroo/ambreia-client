/**
 * The bitmap-content property surface shared by every window that draws a bitmap.
 *
 * Obfuscated to `_SafeCls_1989` in the primary tree, which is where the member names are
 * readable; the class name is recovered from the unobfuscated 2016 tree, where the same
 * interface is `IBitmapDataContainer`. The 2016 declaration stops at `wrapY` — `flipX`,
 * `flipY` and `rotation` are additions of the 2026 build, so the shape below is the
 * primary tree's, only the name comes from PRODUCTION.
 *
 * `IStaticBitmapWrapperWindow` and `IBitmapWrapperWindow` both extend it, and the two
 * bitmap-backed widgets (`BadgeImageWidget`, `PixelLimitWidget`) implement it by
 * forwarding to the bitmap they wrap.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IBitmapDataContainer.as
 */
export interface IBitmapDataContainer
{
    /**
	 * The decoded bitmap this container currently draws.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get bitmapData()
    readonly bitmapData: ImageBitmap | null;

    /**
	 * Anchor point used when positioning/scaling the bitmap within the window.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get pivotPoint()
    pivotPoint: number;

    /**
	 * Whether the bitmap stretches horizontally to fill the window width.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get stretchedX()
    stretchedX: boolean;

    /**
	 * Whether the bitmap stretches vertically to fill the window height.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get stretchedY()
    stretchedY: boolean;

    /**
	 * Horizontal scale factor applied to the bitmap.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get zoomX()
    zoomX: number;

    /**
	 * Vertical scale factor applied to the bitmap.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get zoomY()
    zoomY: number;

    /**
	 * Whether the bitmap renders desaturated.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get greyscale()
    greyscale: boolean;

    /**
	 * Colour of the one-pixel etching drawn under the bitmap.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get etchingColor()
    etchingColor: number;

    /**
	 * Offset the etching is drawn at, relative to the bitmap.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get etchingPoint()
    readonly etchingPoint: { x: number; y: number };

    /**
	 * Whether the window resizes itself to the bitmap's dimensions.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get fitSizeToContents()
    fitSizeToContents: boolean;

    /**
	 * Whether the bitmap tiles horizontally instead of scaling.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get wrapX()
    wrapX: boolean;

    /**
	 * Whether the bitmap tiles vertically instead of scaling.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get wrapY()
    wrapY: boolean;

    /**
	 * Whether the bitmap is mirrored horizontally.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get flipX()
    flipX: boolean;

    /**
	 * Whether the bitmap is mirrored vertically.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get flipY()
    flipY: boolean;

    /**
	 * Rotation angle in degrees, applied to the bitmap content.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_1989.as::get rotation()
    rotation: number;
}
