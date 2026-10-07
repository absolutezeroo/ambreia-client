/**
 * Result of a getFurnitureIcon()/getWallItemIcon()/getGenericRoomObjectThumbnail() request.
 *
 * `id === 0` means `data` is already populated (synchronous hit).
 * `id > 0` means the image is loading; the caller (an IGetImageListener) receives
 * `imageReady(id, data)` or `imageFailed(id)` once loading completes.
 * `id === -1` means the request could not be started at all.
 *
 * AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/ImageResult.as
 * (real class name recovered from PRODUCTION-201601012205-226667486; win63 decompiles this as class_2198/class_3266)
 *
 * TS deviation: `data` is ImageBitmap (matching IBitmapWrapperWindow.bitmap), not AS3's BitmapData.
 *
 * **Callers must handle both halves.** This header used to claim RoomEngine always resolved via
 * the id>0 pending path, on the grounds that Texture->ImageBitmap conversion is inherently async.
 * It is not — `OffscreenCanvas.transferToImageBitmap()` is synchronous — and
 * `getGenericRoomObjectImage()` was changed to honour AS3's real contract precisely because the
 * always-async version made the pet widgets' `imageReady()` -> `updateImage()` chain spin forever.
 * A caller that reads only `imageReady()` therefore shows nothing for any already-loaded asset,
 * which is the common case; one that reads only `data` shows nothing for an asset still loading.
 * See `PurchaseConfirmationDialog.showProductImage()` for the shape AS3 uses: take `data` now,
 * remember `id`, and let `imageReady()` fill in later.
 */
export class ImageResult 
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/ImageResult.as::id
    public id: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/ImageResult.as::data
    public data: ImageBitmap | null = null;
}
