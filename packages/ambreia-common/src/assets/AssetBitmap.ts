import type {Texture} from 'pixi.js';

/**
 * Converts the `content` of a loaded bitmap asset into an `ImageBitmap`.
 *
 * TS-only. In AS3 an asset's content already IS a `BitmapData`, so every
 * `asset.content as BitmapData` in the client is a safe cast and nothing like
 * this class is needed. Here `BitmapDataAsset` stores a PixiJS `Texture`
 * (`BitmapDataAsset.setUnknownContent()`), while the window system draws with
 * Canvas2D and `IBitmapWrapperWindow.bitmap` is an `ImageBitmap` — two
 * different things that the AS3-inherited `as ImageBitmap` casts quietly
 * conflate. `IAsset.content` is `unknown`, so the compiler cannot catch it:
 * the Texture flows all the way to `drawImage()`, which throws
 * "The provided value is not of type (... or ImageBitmap or ...)" — and since
 * that throw happens inside the window manager's update receiver, it aborts
 * the whole render pass rather than just that window.
 *
 * Prefer `resolveSync()`: catalogue PNGs are loaded through
 * `BitmapFileLoader`, which builds the texture from an `ImageBitmap`, so a
 * full-frame texture can hand back that exact object with no copy and no
 * await. `resolve()` covers the rest (atlas sub-frames) by blitting the frame
 * rect, which needs no renderer — the pixels are already in CPU memory.
 */
export class AssetBitmap
{
    /**
	 * The `ImageBitmap` behind `content`, when it can be had without copying:
	 * `content` already being one, or being a texture that covers its whole
	 * unrotated, untrimmed source. Null means "use resolve()".
	 */
    public static resolveSync(content: unknown): ImageBitmap | null
    {
        if(typeof ImageBitmap !== 'undefined' && content instanceof ImageBitmap) return content;

        const texture = AssetBitmap.asTexture(content);

        if(!texture) return null;

        const resource = AssetBitmap.resourceOf(texture);

        if(!(typeof ImageBitmap !== 'undefined' && resource instanceof ImageBitmap)) return null;

        if((texture.rotate ?? 0) !== 0 || texture.trim) return null;

        const frame = texture.frame;

        if(frame.x !== 0 || frame.y !== 0) return null;
        if(frame.width !== resource.width || frame.height !== resource.height) return null;

        return resource;
    }

    /**
	 * The frame of `content` as an `ImageBitmap`, copying it out of the source
	 * when it is only part of one. Resolves to null when `content` is not an
	 * image at all, so callers can skip rather than assign something
	 * undrawable.
	 */
    public static async resolve(content: unknown): Promise<ImageBitmap | null>
    {
        const direct = AssetBitmap.resolveSync(content);

        if(direct) return direct;

        const texture = AssetBitmap.asTexture(content);

        if(!texture) return null;

        const resource = AssetBitmap.resourceOf(texture);
        const drawable = (typeof ImageBitmap !== 'undefined' && resource instanceof ImageBitmap)
			|| (typeof HTMLCanvasElement !== 'undefined' && resource instanceof HTMLCanvasElement)
			|| (typeof HTMLImageElement !== 'undefined' && resource instanceof HTMLImageElement);

        if(!drawable) return null;

        const frame = texture.frame;
        const width = Math.max(1, Math.ceil(frame.width));
        const height = Math.max(1, Math.ceil(frame.height));
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');

        if(!ctx) return null;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(resource as CanvasImageSource, frame.x, frame.y, frame.width, frame.height, 0, 0, width, height);

        return createImageBitmap(canvas);
    }

    /**
	 * The frame of `content` as an `HTMLImageElement`.
	 *
	 * Needed because the two image managers (`BadgeImageManager`,
	 * `FurniIconImageManager`) are typed in `HTMLImageElement` end to end — AS3 hands them
	 * `BitmapData` and they scale, cache and hand it back, and this port picked `HTMLImageElement`
	 * as the closest thing at every one of those points.
	 *
	 * The element is returned before its pixels have decoded: `src` is set from a data URL, and
	 * the browser fills it in on its own. That is fine for the one thing it is used for — a
	 * placeholder that is drawn every frame until the real image lands — and is what lets this be
	 * synchronous, which the AS3 signature it stands in for requires.
	 */
    public static resolveImageElementSync(content: unknown): HTMLImageElement | null
    {
        if(typeof HTMLImageElement === 'undefined' || typeof document === 'undefined') return null;

        const texture = AssetBitmap.asTexture(content);
        const resource = texture ? AssetBitmap.resourceOf(texture) : null;

        // The library loads PNGs through `BitmapFileLoader`, which builds from an `ImageBitmap`,
        // so this fast path rarely hits — but a texture built from an `<img>` needs no copy.
        if(resource instanceof HTMLImageElement) return resource;

        const bitmap = AssetBitmap.resolveSync(content);

        if(!bitmap) return null;

        const canvas = document.createElement('canvas');

        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const ctx = canvas.getContext('2d');

        if(!ctx) return null;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bitmap, 0, 0);

        const image = new Image(bitmap.width, bitmap.height);

        image.src = canvas.toDataURL();

        return image;
    }

    // Duck-typed rather than `instanceof Texture`: this module must not depend
    // on which Texture class the asset was built with.
    private static asTexture(content: unknown): Texture | null
    {
        if(typeof content !== 'object' || content === null) return null;

        const candidate = content as Partial<Texture>;

        return candidate.source && candidate.frame ? (content as Texture) : null;
    }

    private static resourceOf(texture: Texture): unknown
    {
        return (texture.source as unknown as { resource?: unknown } | null)?.resource ?? null;
    }
}
