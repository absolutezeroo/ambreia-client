import {Assets, Texture} from 'pixi.js';
import {BinaryFileLoader} from './BinaryFileLoader';
import {Logger} from '../../utils/Logger';

/**
 * BitmapFileLoader
 *
 * Based on AS3: com.sulake.core.assets.loaders.BitmapFileLoader
 *
 * Loader for image files. Converts loaded content to PixiJS Texture.
 */
export class BitmapFileLoader extends BinaryFileLoader
{
    constructor(mimeType: string, url?: string, id: number = -1)
    {
        super(mimeType, url, id);
    }

    private _texture: Texture | null = null;

    /**
	 * The loaded texture
	 */
    get texture(): Texture | null
    {
        return this._texture;
    }

    /**
	 * The loaded content
	 */
    override get content(): unknown
    {
        return this._texture;
    }

    /**
	 * Load content from a URL
	 */
    override load(url: string): void
    {
        const previousUrl = this._url;

        this._url = url;

        if(this._texture)
        {
            // This texture is cached/refcounted by PixiJS Assets (loaded via
            // Assets.load() below) — destroying it directly desyncs that cache
            // and breaks the texture for every other consumer still using it
            // (e.g. the same furniture icon shown elsewhere). Assets.unload()
            // is the correct release path; it only frees the source once no
            // other reference needs it.
            if(previousUrl)
            {
                Assets.unload(previousUrl).catch(() => {});
            }

            this._texture = null;
        }

        this._errorCode = 0;
        this.handleLoadEvent('open');

        // PixiJS's Assets loader has no GIF parser, so `Assets.load(...gif)` warns
        // ("we don't know how to parse it") and fails — which is what left catalogue promo images
        // (e.g. c_images/catalogue/hubbly_h.gif) blank. GIFs are decoded natively by the browser via
        // createImageBitmap (first frame), so route them through that instead of the parser.
        const loadTexture = this.isGifUrl(url)
            ? this.loadGifTexture(url)
            : Assets.load<Texture>(url);

        loadTexture
            .then((texture: Texture) =>
            {
                if(this._disposed)
                {
                    Assets.unload(url).catch(() => {});
                    return;
                }

                this._texture = texture;
                this._bytesLoaded = 1;
                this._bytesTotal = 1;
                this._status = 200;

                this.handleLoadEvent('complete');
            })
            .catch((error: Error) =>
            {
                Logger.getLogger('core.assets.loaders.BitmapFileLoader').error('Error loading texture:', error);
                this.handleLoadEvent('ioError');
            });
    }

    private isGifUrl(url: string): boolean
    {
        return /\.gif(\?|#|$)/i.test(url);
    }

    /**
     * Decodes a GIF (first frame) with the browser and wraps it as a Texture, bypassing PixiJS's
     * parser. The texture is not registered in the Assets cache, so the Assets.unload() calls
     * elsewhere in this loader are harmless no-ops for it and the BitmapDataAsset that takes
     * ownership destroys it the same way as any other texture.
     */
    private async loadGifTexture(url: string): Promise<Texture>
    {
        const response = await fetch(url);

        if(!response.ok)
        {
            throw new Error(`HTTP ${response.status} for ${url}`);
        }

        const bitmap = await createImageBitmap(await response.blob());

        return Texture.from(bitmap);
    }

    /**
	 * Dispose of this loader
	 */
    override dispose(): void
    {
        if(!this._disposed)
        {
            // Do NOT Assets.unload() here: AssetLibrary.handleAssetLoadEvent() disposes this
            // loader as routine cleanup immediately after a successful load, right after handing
            // this._texture off to a BitmapDataAsset that's meant to own it going forward (cached
            // under an asset name, retrieved again later via getAssetByName()). Unloading here
            // would have PixiJS's Assets cache tear down the underlying GPU resource the very
            // first time this loader's job is "done" - meaning the texture renders fine once, then
            // fails (extract.canvas()/drawImage() on a destroyed source) on every later reuse of
            // that cached asset. The BitmapDataAsset we handed the texture to owns its lifecycle
            // from here (its own dispose() calls texture.destroy(true)) - this loader just drops
            // its local reference.
            this._texture = null;

            super.dispose();
        }
    }
}
