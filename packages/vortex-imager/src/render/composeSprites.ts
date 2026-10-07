/**
 * Draws a room object's sprites onto a 2D canvas.
 *
 * This is the rasterizer the engine cannot lend the imager.
 * `RoomObjectSpriteVisualization.getImage()` builds a PixiJS `Container` of `Sprite`s and reads
 * it back with `renderer.extract.canvas()`, and `RoomRenderingCanvas` does the same for a whole
 * room — both need a live renderer, and there is none in Node. What they consume, though, is
 * plain data: `visualization.getSprite(i)` hands back a texture, an offset, a relative depth, a
 * tint, an alpha and a blend mode. So the compositing is redone here on
 * `@napi-rs/canvas`, which is what AS3 itself did — `getImage()` there is a `BitmapData.draw()`
 * loop with a `Matrix` and a `ColorTransform`, no renderer involved.
 *
 * Every rule below is read off the port rather than invented:
 *
 * - the descending-depth draw order is `RoomRenderingCanvas.compareSortableSprites()`
 *   (`b.z - a.z`, then children added front-to-back, so the deepest sprite is drawn first);
 * - `alpha / 255` is `RoomObjectSpriteVisualization.normalizeColourComponent()`;
 * - the tint is PixiJS's `Sprite.tint`, which multiplies the source by the colour.
 *
 * One deliberate omission: `getImage()` runs `extractDarknessToAlpha()` over `add`-blended
 * sprites when the background is transparent, re-encoding their darkness as alpha so an
 * additive glow does not disappear against nothing. Canvas 2D's `lighter` adds alpha as well as
 * colour, so such a sprite does render here — just not identically to the client. Glow furni
 * (fireworks, some lamps) are therefore approximate, and only on a transparent background.
 *
 * @see packages/vortex-engine/src/room/object/visualization/RoomObjectSpriteVisualization.ts
 * @see packages/vortex-engine/src/habbo/room/renderer/RoomRenderingCanvas.ts
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as
 */
import {createCanvas} from '@napi-rs/canvas';
import type {Canvas, SKRSContext2D} from '@napi-rs/canvas';
import type {IRoomObjectSprite} from '@ambreia/iso/object/visualization/IRoomObjectSprite';

/** No tint: PixiJS's identity value for `Sprite.tint`. */
const NO_TINT = 0xFFFFFF;

/**
 * One sprite, already placed in canvas space.
 *
 * `x`/`y` are the visual top-left — the rectangle the pixels occupy, mirroring included.
 * `RoomRenderingCanvas` stores a different `x` for a flipped sprite (`finalX + width`) because
 * PixiJS reflects around the anchor at (0,0) and has to be pushed back; a canvas transform
 * mirrors in place, so that correction would double-apply here.
 */
export interface ISpriteLayer
{
    sprite: IRoomObjectSprite;
    x: number;
    y: number;

    /** Higher is further back. */
    depth: number;
}

export interface IComposeOptions
{
    /**
	 * `0xAARRGGBB`. An alpha of 0 leaves the canvas transparent, which is what every
	 * `/habbo-imaging/` route wants; the room routes offer it for a solid backdrop.
	 */
    backgroundColor?: number;

    /** Fixed output size. Omit and the canvas is sized to the union of the layers. */
    width?: number;
    height?: number;

    /** Added to every layer, for a fixed-size canvas that needs the content centred. */
    offsetX?: number;
    offsetY?: number;
}

export interface IComposeResult
{
    canvas: Canvas;

    /** Where the union of the drawn layers starts, in the source coordinate space. */
    originX: number;
    originY: number;
}

/**
 * Collects the drawable sprites of one visualization, offset to `screenX`/`screenY`.
 *
 * The placement is `RoomRenderingCanvas.renderObject()`: the object's screen position plus the
 * sprite's own offset, with the depth being the object's screen z plus the sprite's relative
 * depth. The sub-pixel tie-breakers that method adds (`1.2e-7 * x`, `3.7e-11 * index`) exist to
 * keep a *stable* order across frames when two sprites share a depth; a single frame does not
 * need them, but the index term is kept because it is what decides ties within one object, and
 * dropping it makes co-planar layers flicker between builds.
 */
export function collectSprites(
    visualization: { spriteCount: number; getSprite(index: number): IRoomObjectSprite | null },
    screenX: number,
    screenY: number,
    screenZ: number,
    startIndex: number = 0
): ISpriteLayer[]
{
    const layers: ISpriteLayer[] = [];

    for(let i = 0; i < visualization.spriteCount; i++)
    {
        const sprite = visualization.getSprite(i);

        if(sprite === null || !sprite.visible || sprite.texture === null) continue;

        layers.push({
            sprite,
            x: screenX + sprite.offsetX,
            y: screenY + sprite.offsetY,
            depth: screenZ + sprite.relativeDepth + 3.7e-11 * (startIndex + layers.length)
        });
    }

    return layers;
}

export function composeSprites(layers: ISpriteLayer[], options: IComposeOptions = {}): IComposeResult | null
{
    if(layers.length === 0) return null;

    const offsetX = options.offsetX ?? 0;
    const offsetY = options.offsetY ?? 0;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for(const layer of layers)
    {
        const {width, height} = spriteSize(layer.sprite);

        minX = Math.min(minX, layer.x);
        minY = Math.min(minY, layer.y);
        maxX = Math.max(maxX, layer.x + width);
        maxY = Math.max(maxY, layer.y + height);
    }

    // A fixed size means the caller has already decided where the origin is (the room routes
    // pin it to the viewport), so the union only sets the size when it is not given.
    const fixed = options.width !== undefined && options.height !== undefined;
    const originX = fixed ? -offsetX : minX;
    const originY = fixed ? -offsetY : minY;
    const width = Math.max(1, Math.ceil(fixed ? options.width! : maxX - minX));
    const height = Math.max(1, Math.ceil(fixed ? options.height! : maxY - minY));

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    context.imageSmoothingEnabled = false;

    paintBackground(context, width, height, options.backgroundColor ?? 0);

    // Descending depth: the deepest sprite is drawn first and everything else lands on top.
    const ordered = [...layers].sort((a, b) => b.depth - a.depth);

    for(const layer of ordered) drawLayer(context, layer, originX, originY);

    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;

    return {canvas, originX, originY};
}

function paintBackground(context: SKRSContext2D, width: number, height: number, color: number): void
{
    const alpha = (color >>> 24) & 0xFF;

    if(alpha === 0) return;

    context.globalAlpha = alpha / 255;
    context.fillStyle = toCssColor(color & 0xFFFFFF);
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 1;
}

function drawLayer(context: SKRSContext2D, layer: ISpriteLayer, originX: number, originY: number): void
{
    const sprite = layer.sprite;
    const texture = sprite.texture as unknown as IDrawableTexture | null;

    if(texture === null) return;

    const source = texture.source?.resource;

    if(!source) return;

    const frame = texture.frame;
    const {width, height} = spriteSize(sprite);
    const x = Math.round(layer.x - originX);
    const y = Math.round(layer.y - originY);
    const tinted = sprite.color !== NO_TINT && sprite.color !== 0 ? tint(texture, sprite.color) : null;

    context.globalAlpha = Math.max(0, Math.min(255, sprite.alpha)) / 255;
    context.globalCompositeOperation = toCompositeOperation(sprite.blendMode);

    context.save();
    context.translate(x + (sprite.flipH ? width : 0), y + (sprite.flipV ? height : 0));
    context.scale(sprite.flipH ? -1 : 1, sprite.flipV ? -1 : 1);

    // The trim offset is applied *inside* the mirrored frame, which is what mirrors it: content
    // sitting `trim.x` from the left of the untrimmed sprite ends up `trim.x` from the right,
    // exactly as PixiJS's `scale.x = -1` on a trimmed sprite puts it.
    const trim = texture.trim ?? {x: 0, y: 0};

    if(tinted === null)
    {
        context.drawImage(
            source as Parameters<SKRSContext2D['drawImage']>[0],
            frame.x, frame.y, frame.width, frame.height,
            trim.x, trim.y, frame.width, frame.height
        );
    }
    else
    {
        context.drawImage(tinted, trim.x, trim.y, frame.width, frame.height);
    }

    context.restore();
}

/**
 * Multiplies a frame by a colour, the way PixiJS's `Sprite.tint` does.
 *
 * `multiply` alone would also darken the transparent margin to opaque black, so the frame is
 * drawn back over the result with `destination-in` to restore the original alpha mask.
 */
function tint(texture: IDrawableTexture, color: number): Canvas
{
    const frame = texture.frame;
    const width = Math.max(1, Math.ceil(frame.width));
    const height = Math.max(1, Math.ceil(frame.height));
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    const source = texture.source.resource as Parameters<SKRSContext2D['drawImage']>[0];

    context.imageSmoothingEnabled = false;
    context.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, width, height);

    context.globalCompositeOperation = 'multiply';
    context.fillStyle = toCssColor(color);
    context.fillRect(0, 0, width, height);

    context.globalCompositeOperation = 'destination-in';
    context.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, width, height);

    return canvas;
}

/**
 * `RoomRenderingCanvas.renderObject()`: a sprite's own width/height wins when set, otherwise
 * the texture's. A plane sprite carries its own size because the plane is scaled; a furni
 * layer leaves it at 0 and takes the texture's.
 *
 * The texture's size is the *untrimmed* one, which is what every offset in a bundle is measured
 * against — `orig`, not the packed `frame`. They differ for any sprite the packer trimmed.
 */
function spriteSize(sprite: IRoomObjectSprite): { width: number; height: number }
{
    const texture = sprite.texture as unknown as IDrawableTexture | null;
    const orig = texture?.orig ?? (texture === null || texture === undefined
        ? null
        : {width: texture.frame.width, height: texture.frame.height});

    return {
        width: sprite.width > 0 ? sprite.width : orig?.width ?? 0,
        height: sprite.height > 0 ? sprite.height : orig?.height ?? 0
    };
}

/** PixiJS blend-mode names to their canvas-2D equivalents; anything else draws normally. */
function toCompositeOperation(blendMode: string): GlobalCompositeOperation
{
    switch(blendMode)
    {
        case 'add': return 'lighter';
        case 'multiply': return 'multiply';
        case 'screen': return 'screen';
        case 'overlay': return 'overlay';
        case 'darken': return 'darken';
        case 'lighten': return 'lighten';
        default: return 'source-over';
    }
}

function toCssColor(color: number): string
{
    return `#${(color & 0xFFFFFF).toString(16).padStart(6, '0')}`;
}

/**
 * The part of a texture this file reads. Structural rather than the shim's `Texture` for the
 * same reason `composeAvatar.ts` gives: the engine annotates `IRoomObjectSprite.texture` with
 * the real PixiJS type, while at runtime it is always the shim.
 */
interface IDrawableTexture
{
    frame: { x: number; y: number; width: number; height: number };
    source: { resource: unknown };

    /** Where `frame`'s pixels sit inside the untrimmed sprite; see the shim's `Texture.trim`. */
    trim?: { x: number; y: number };

    /** The untrimmed size — what a sprite's width/height mean, and what offsets are relative to. */
    orig?: { width: number; height: number };
}
