import type {IAvatarImage} from '@ambreia/avatar/IAvatarImage';

/**
 * TS-only: no AS3 counterpart — Flash's `getCroppedImage()`/`getImage()` hand back a `BitmapData`
 * that windows take directly, so nothing has to be copied.
 *
 * This port's equivalents return a PixiJS Texture backed by an OffscreenCanvas (no GPU render pass
 * involved), while every bitmap-wrapper window takes an `ImageBitmap` — and the only conversion the
 * browser offers, `createImageBitmap()`, is asynchronous. Copying the pixels out into an independent
 * canvas also keeps the result alive after the avatar image is disposed, which every caller does
 * immediately.
 *
 * `ClubCenterView`, `ProductGridItem` and the bot views all needed the same six lines; this is that
 * copy, once.
 */
export function textureToCanvas(texture: unknown): HTMLCanvasElement | null
{
    const source = texture as {
        width: number;
        height: number;
        source?: { resource?: CanvasImageSource };
    } | null;

    const resource = source?.source?.resource;

    if(!source || !resource) return null;

    const canvas = document.createElement('canvas');

    canvas.width = source.width;
    canvas.height = source.height;

    const ctx = canvas.getContext('2d');

    if(!ctx) return null;

    ctx.drawImage(resource, 0, 0);

    return canvas;
}

/**
 * TS-only: the async half of {@link textureToCanvas} — the `ImageBitmap` a bitmap-wrapper window's
 * `bitmap` setter takes.
 */
export function textureToBitmap(texture: unknown): Promise<ImageBitmap | null>
{
    const canvas = textureToCanvas(texture);

    if(canvas === null) return Promise.resolve(null);

    return createImageBitmap(canvas);
}

/**
 * TS-only: {@link textureToBitmap} over `getCroppedImage()`, the call every avatar thumbnail makes.
 */
export function avatarImageToBitmap(avatarImage: IAvatarImage, setType: string): Promise<ImageBitmap | null>
{
    return textureToBitmap(avatarImage.getCroppedImage(setType));
}
