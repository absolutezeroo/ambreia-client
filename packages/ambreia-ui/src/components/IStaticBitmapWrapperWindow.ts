import type {IWindow} from '../IWindow';
import type {IBitmapDataContainer} from '../utils/IBitmapDataContainer';

/**
 * Interface for static bitmap wrapper windows.
 *
 * Static bitmaps load their content via `assetUri` through the ResourceManager.
 * Everything else — pivot, stretch, zoom, wrap, flip, greyscale, etching, rotation —
 * comes from `IBitmapDataContainer`, exactly as AS3's
 * `IStaticBitmapWrapperWindow extends IWindow, _SafeCls_1989` does, and is implemented
 * on the concrete `BitmapDataController` the controller inherits from.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IStaticBitmapWrapperWindow.as
 */
export interface IStaticBitmapWrapperWindow extends IWindow, IBitmapDataContainer
{
    /**
	 * The asset URI for this static bitmap.
	 *
	 * Setting this triggers an asset request via the ResourceManager.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StaticBitmapWrapperController.as::get assetUri()
    assetUri: string;

    /**
	 * The decoded bitmap content for this window.
	 *
	 * Set automatically by `receiveAsset()` when the asset loads.
	 */
    // TS-only: AS3 exposes `bitmapData` read-only through `_SafeCls_1989`; this port's
    // ported callers assign the decoded bitmap back through the interface.
    bitmapData: ImageBitmap | null;
}
