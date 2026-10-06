/**
 * Copies an `ImageBitmap` so a notification can own it.
 *
 * **A bubble closes the icon it is given.** `SingularNotificationController` builds its
 * `HabboNotificationItemStyle` with `ownsIcon` true, and that style's `dispose()` calls
 * `icon.close()` when the bubble expires. That is AS3's own contract — Flash passed `BitmapData` by
 * reference and made disposal the owner's job — and it is safe for a caller that composed the image
 * itself. It is not safe for a caller handing over an asset out of the library.
 *
 * Doing that destroys the asset for the rest of the session. The `ImageBitmap` detaches, every later
 * `drawImage` of it throws `InvalidStateError: The image source is detached`, and because the throw
 * happens **inside a paint** the frame aborts: what the user sees is not a missing icon but a window
 * stranded half-drawn and the tooltips dead beside it. It cost the Fish-O-Pedia, whose species
 * previews are the same sprites the catch bubble borrowed.
 *
 * So: copy at every call site that passes a library asset. `HabboFishing` does (the reward track
 * did too, before the RPG fork removed it).
 *
 * @param source The library asset, or null.
 * @returns A private copy the notification may close, or null.
 */
// TS-only: no AS3 counterpart — Flash had no transferable-bitmap ownership to get wrong.
export function copyBitmap(source: ImageBitmap | null): ImageBitmap | null
{
    if(source === null || source.width === 0 || source.height === 0) return null;

    const canvas = new OffscreenCanvas(source.width, source.height);
    const context = canvas.getContext('2d');

    if(context === null) return null;

    context.drawImage(source, 0, 0);

    return canvas.transferToImageBitmap();
}
