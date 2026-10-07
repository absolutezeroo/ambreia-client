import type {IWindow} from '../IWindow';
import type {IBitmapDataContainer} from '../utils/IBitmapDataContainer';

/**
 * Interface for bitmap wrapper windows.
 *
 * Bitmap wrappers hold a programmatic bitmap set by code (e.g. avatar rendering).
 * The `bitmap` property is the primary way to set the content; pivot, stretch, zoom,
 * wrap, flip, greyscale, etching and rotation come from `IBitmapDataContainer`, as in
 * AS3's `_SafeCls_2133 extends IWindow, _SafeCls_1989`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/_SafeCls_2133.as
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IBitmapWrapperWindow.as
 */
export interface IBitmapWrapperWindow extends IWindow, IBitmapDataContainer
{
    /**
     * The programmatic bitmap for this window.
     *
     * Setting this disposes the old bitmap if `disposesBitmap` is true,
     * calls `fitSize()`, and invalidates the window.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::get bitmap()
    bitmap: ImageBitmap | null;

    /**
     * The underlying bitmap data (alias for bitmap).
     */
    // The getter is `BitmapDataController.as::get bitmapData()` (l.69), declared by the interface
    //   both controllers implement, `core/window/utils/_SafeCls_1989.as::get bitmapData()`; the
    //   setter is BitmapWrapperController's own and forwards to `bitmap`, which is why assigning
    //   through this alias is the same thing AS3 does.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::set bitmapData()
    bitmapData: ImageBitmap | null;

    /**
     * Whether this window owns the bitmap and should dispose it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::get disposesBitmap()
    disposesBitmap: boolean;

    /**
     * The named catalog/asset-library image this bitmap was last set from.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapWrapperController.as::get bitmapAssetName()
    bitmapAssetName: string;
}
