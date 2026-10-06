/**
 * The port of a three-line idiom AS3 repeats at every bitmap-wrapper slot in the client:
 *
 *     var slot:BitmapData = new BitmapData(wrapper.width, wrapper.height);
 *     slot.fillRect(slot.rect, 0);
 *     slot.copyPixels(image, image.rect, new Point((slot.width - image.width) / 2,
 *                                                 (slot.height - image.height) / 2));
 *     wrapper.bitmap = slot;
 *
 * Two things it does that assigning the raw image does NOT:
 * - the result is always exactly the slot's size, so the wrapper never scales it. A wrapper whose
 *   layout does not switch stretching off will otherwise stretch whatever it is given to fill the
 *   slot, which is how a 64x110 avatar came out as a distorted 100x150 one;
 * - the image is centred, and cropped rather than shrunk when it is bigger than the slot.
 *
 * `PurchaseConfirmationDialog.setImage()` already carried this by hand; the inventory grids and
 * previews (bots, pets) assumed the wrapper would centre for them, and it does not.
 *
 * `offsetX`/`offsetY` nudge the centred image, which is the shape AS3 writes at the call sites that
 * take one: the offsets are added to the centring term.
 *
 * TS-only in the sense that AS3 has no such shared function — it inlines these lines per call site.
 */
export function drawIntoBitmapSlot(
    image: ImageBitmap | null,
    slotWidth: number,
    slotHeight: number,
    closeSource: boolean = true,
    offsetX: number = 0,
    offsetY: number = 0
): ImageBitmap | null
{
    if(image === null) return null;

    const width = Math.max(1, Math.floor(slotWidth));
    const height = Math.max(1, Math.floor(slotHeight));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    if(context === null) return null;

    context.drawImage(
        image,
        Math.floor((width - image.width) * 0.5) + offsetX,
        Math.floor((height - image.height) * 0.5) + offsetY
    );

    const result = canvas.transferToImageBitmap();

    // AS3 hands the source BitmapData's lifetime to the caller; here the source is a throwaway
    // render in every current call site, so it is released unless the caller says otherwise.
    if(closeSource) image.close();

    return result;
}

/**
 * Turns a *loaded* `HTMLImageElement` into an `ImageBitmap`, synchronously.
 *
 * BadgeImageManager caches `HTMLImageElement`s — it loads them through the hotel's image library,
 * which has no ImageBitmap path — while every window's `bitmap` takes an `ImageBitmap`. The
 * obvious bridge, `createImageBitmap()`, is async, and AS3's badge getters are not: in Flash
 * `getGroupBadgeImage()` hands back a BitmapData that is either already decoded or null, and
 * callers just return it inline. Drawing into an OffscreenCanvas and calling
 * `transferToImageBitmap()` gives that same synchronous shape.
 *
 * Returns null for an image that has not finished loading, which is the null AS3 would have
 * returned at that moment anyway — the caller gets the badge on a later repaint.
 *
 * TS-only: no AS3 counterpart; Flash has one bitmap type where this port has two.
 */
export function imageElementToBitmap(image: HTMLImageElement | null): ImageBitmap | null
{
    if(image === null || !image.complete) return null;

    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if(width === 0 || height === 0) return null;

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    if(context === null) return null;

    context.drawImage(image, 0, 0);

    return canvas.transferToImageBitmap();
}
