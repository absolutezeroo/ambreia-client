import type {Container, Texture} from 'pixi.js';

/** Reads a display object's pixels back into a canvas: the PixiJS renderer's `extract.canvas()`. */
export type TextureExtractor = (target: Container | Texture) => HTMLCanvasElement | null;

let current: TextureExtractor | null = null;

/**
 * The host's pixel readback. The room renderer needs one to cut sprites and thumbnails out of the
 * GPU, but has no renderer of its own: the client sets its application's, a host without one (the
 * imager, a Node test) sets none and gets null. It used to reach `Vortex.instance.application`
 * directly, which is what tied the room renderer to the client (spec §3, J4).
 */
export function setTextureExtractor(extractor: TextureExtractor | null): void
{
    current = extractor;
}

/** The target's pixels, or null when there is no extractor or it fails (no renderer, lost context). */
export function extractCanvas(target: Container | Texture): HTMLCanvasElement | null
{
    if(current === null) return null;

    try
    {
        return current(target);
    }
    catch
    {
        return null;
    }
}
