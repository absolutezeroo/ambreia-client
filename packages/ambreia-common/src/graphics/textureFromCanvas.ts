import {ImageSource, Texture, type ALPHA_MODES} from 'pixi.js';

/**
 * A texture over any drawable with a size: a canvas, an ImageBitmap, a decoded image.
 *
 * In a browser this is `Texture.from()`, unchanged: it picks the source class the GPU upload needs
 * (CanvasSource for a canvas, ImageSource for a bitmap). `Texture.from()` decides that through
 * browser globals, so in Node the resource is wrapped in an ImageSource instead — never a bare
 * TextureSource, whose upload method is "unknown" and would draw nothing on a GPU.
 */
export function textureFromCanvas(
    resource: {readonly width: number; readonly height: number},
    alphaMode?: ALPHA_MODES
): Texture
{
    if(typeof OffscreenCanvas !== 'undefined' || typeof HTMLCanvasElement !== 'undefined')
    {
        return Texture.from(alphaMode ? {resource: resource as never, alphaMode} : resource as never);
    }

    return new Texture({source: new ImageSource({resource: resource as never, alphaMode})});
}
