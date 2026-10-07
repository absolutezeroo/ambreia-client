import type {Texture} from 'pixi.js';

/**
 * Turns what `AvatarImage.getImage()` / `getCroppedImage()` actually return — a PixiJS `Texture`
 * over an `OffscreenCanvas` — into the `ImageBitmap` every `IBitmapWrapperWindow.bitmap` expects.
 *
 * TS-only: AS3 has no equivalent. There, both methods hand back a `BitmapData` that
 * `IBitmapWrapperWindow` takes directly and `bitmap.draw()` composes with, so no conversion step
 * exists in the source at all. This port's renderer produces a texture instead, and the window
 * system takes `ImageBitmap`s.
 *
 * The canvas is read straight off `texture.source.resource` rather than through
 * `renderer.extract.canvas()`. A freshly-composed avatar texture has not been through a render
 * pass, and `extract` reads back a blank square for one that has not — the same trap
 * `AvatarImageWidget.textureToImageBitmap()` documents. This variant is **synchronous**, because
 * every caller here is inside an AS3 method that returns void and repaints in place.
 */
export class AvatarTextureUtils
{
    // TS-only: see the class note.
    public static toImageBitmap(texture: Texture | null): ImageBitmap | null
    {
        const source = AvatarTextureUtils.toCanvasSource(texture);

        if(source === null) return null;

        const canvas = new OffscreenCanvas(source.frame.width, source.frame.height);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        context.drawImage(
            source.resource,
            source.frame.x, source.frame.y, source.frame.width, source.frame.height,
            0, 0, source.frame.width, source.frame.height
        );

        return canvas.transferToImageBitmap();
    }

    /**
     * The same conversion as `toImageBitmap()`, but into an `HTMLCanvasElement`.
     *
     * TS-only: `IRoomPreviewerWidget.showPreview()` takes a canvas — it is the port's stand-in for
     * the raw `BitmapData` AS3 hands it — so the avatar preview needs this shape rather than an
     * `ImageBitmap`.
     */
    // TS-only: see the class note.
    public static toCanvas(texture: Texture | null): HTMLCanvasElement | null
    {
        const source = AvatarTextureUtils.toCanvasSource(texture);

        if(source === null) return null;

        const canvas = document.createElement('canvas');

        canvas.width = source.frame.width;
        canvas.height = source.frame.height;

        const context = canvas.getContext('2d');

        if(context === null) return null;

        context.drawImage(
            source.resource,
            source.frame.x, source.frame.y, source.frame.width, source.frame.height,
            0, 0, source.frame.width, source.frame.height
        );

        return canvas;
    }

    /**
     * The drawable behind a texture, plus the sub-rectangle of it the texture actually covers.
     *
     * Separate from `toImageBitmap()` because the wardrobe composes *into* a fixed-size slot rather
     * than taking the avatar as-is, and doing that through an intermediate bitmap would blit twice.
     */
    // TS-only: see the class note.
    public static toCanvasSource(
        texture: Texture | null
    ): {resource: CanvasImageSource; frame: {x: number; y: number; width: number; height: number}} | null
    {
        if(texture === null || texture === undefined) return null;

        const resource = (texture as unknown as {source?: {resource?: CanvasImageSource}}).source?.resource;

        if(resource === null || resource === undefined) return null;

        const frame = texture.frame;

        if(frame === null || frame === undefined) return null;
        if(frame.width < 1 || frame.height < 1) return null;

        return {resource, frame: {x: frame.x, y: frame.y, width: frame.width, height: frame.height}};
    }
}
