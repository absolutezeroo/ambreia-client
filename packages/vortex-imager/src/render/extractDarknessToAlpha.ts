/**
 * Re-encodes an additive sprite's darkness as transparency.
 *
 * A glow — a spotlight cone, a halo, a firework — is authored as light on black and drawn with
 * an additive blend, which on screen makes the black contribute nothing. Composited onto a
 * *transparent* canvas instead, there is nothing for it to add to: canvas 2D's `lighter` adds
 * alpha along with colour, so the black stays and the effect comes out as a dark blob. That is
 * what `/habbo-imaging/effect/1.png` looked like before this existed.
 *
 * The engine has the same problem and the same answer —
 * `RoomObjectSpriteVisualization.extractDarknessToAlpha()`, itself a port of AS3's per-pixel
 * `BitmapData.getVector()`/`setVector()` loop. A pixel darker than mid-lightness has its
 * lightness lifted to 128 and its alpha scaled by how dark it was, so black becomes fully
 * transparent and a half-lit pixel keeps half its opacity. This is that loop, with the engine's
 * own `ColorConverter` doing the HSL maths so the two cannot drift.
 *
 * @see packages/vortex-engine/src/room/object/visualization/RoomObjectSpriteVisualization.ts::extractDarknessToAlpha()
 */
import {createCanvas} from '@napi-rs/canvas';
import type {Canvas, SKRSContext2D} from '@napi-rs/canvas';
import {ColorConverter} from '@ambreia/iso/utils/ColorConverter';

/** The lightness at which a pixel stops being treated as darkness to be dissolved. */
const MID_LIGHTNESS = 128;

export interface IDarknessSource
{
    frame: { x: number; y: number; width: number; height: number };
    source: { resource: unknown };
    trim?: { x: number; y: number };
    orig?: { width: number; height: number };
}

/**
 * Returns the sprite's frame with its darkness turned into alpha, or `null` when there is
 * nothing to process — in which case the caller should draw the original.
 *
 * The canvas returned is the *frame*, not the untrimmed sprite: the caller already knows where
 * to put it, and copying the transparent margin back in would only cost memory.
 */
export function extractDarknessToAlpha(texture: IDarknessSource): Canvas | null
{
    const source = texture.source?.resource;
    const {width, height} = texture.frame;

    if(!source || width < 1 || height < 1) return null;

    const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
    const context = canvas.getContext('2d');

    context.imageSmoothingEnabled = false;
    context.drawImage(
        source as Parameters<SKRSContext2D['drawImage']>[0],
        texture.frame.x, texture.frame.y, width, height,
        0, 0, width, height
    );

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for(let i = 0; i < data.length; i += 4)
    {
        const alpha = data[i + 3];

        if(alpha === 0) continue;

        const hsl = ColorConverter.rgbToHSL((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
        const lightness = hsl & 0xFF;

        if(lightness > MID_LIGHTNESS) continue;

        const rgb = ColorConverter.hslToRGB((((hsl >> 16) & 0xFF) << 16) + (((hsl >> 8) & 0xFF) << 8) + MID_LIGHTNESS);

        data[i] = (rgb >> 16) & 0xFF;
        data[i + 1] = (rgb >> 8) & 0xFF;
        data[i + 2] = rgb & 0xFF;
        data[i + 3] = Math.round(alpha * (lightness / MID_LIGHTNESS));
    }

    context.putImageData(imageData, 0, 0);

    return canvas;
}
