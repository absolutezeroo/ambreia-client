/**
 * Flattens an avatar and its effect sprites onto one canvas.
 *
 * `AvatarImage.getImage()` composites the *body* only. An effect is two things — an animation
 * the body plays, and extra sprites drawn around it (the hoverboard under the feet, the
 * spotlight cone, the bubble) — and the second half never reaches the body composite: in the
 * client `AvatarVisualization` reads them off `getSprites()` and gives each its own room
 * sprite. Render without this pass and effects come out as a plain standing avatar, which is
 * exactly what they did before it existed.
 *
 * Every offset formula below is `AvatarVisualization.updateSprites()` /
 * `updateMainSprite()`, at room scale 64 with the room-specific terms fixed at zero — an
 * imager has no tile to sit on, so `sitOffset` and `verticalOffset` (which only ever apply to
 * an avatar on furniture) contribute nothing.
 *
 * @see packages/vortex-engine/src/habbo/room/object/visualization/avatar/AvatarVisualization.ts
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as
 */
import {createCanvas} from '@napi-rs/canvas';
import type {Canvas} from '@napi-rs/canvas';
import type {IAvatarImage} from '@habbo/avatar/IAvatarImage';
import {extractDarknessToAlpha} from './extractDarknessToAlpha';

/**
 * The part of a texture this file uses.
 *
 * Structural rather than the shim's `Texture` because the two sources disagree on paper: a
 * body composite comes back through `IAvatarImage.getImage()` (typed `any`), while an effect
 * sprite arrives as `IGraphicAsset.texture`, which is annotated with the *real* PixiJS
 * `Texture`. At runtime both are the shim — `tools/build.mjs` aliases `pixi.js` to it — so the
 * common shape is what matters, and this is all of it.
 */
interface IDrawableTexture
{
    frame: { x: number; y: number; width: number; height: number };
    source: { resource: unknown };
}

/** `AvatarVisualization.as::AVATAR` — the sprite entry that *is* the body, not an extra. */
const AVATAR_SPRITE_ID = 'avatar';

/** `AvatarVisualization.as::AVATAR_SPRITE_DEFAULT_DEPTH` */
const AVATAR_SPRITE_DEFAULT_DEPTH = -0.01;

/**
 * The room geometry scale an avatar is drawn at. Every avatar this service renders composites
 * at `AvatarScaleType.LARGE`, whose room scale is 64 — `size=s` shrinks the finished image
 * rather than the parts, so there is no 32 case to handle.
 */
const ROOM_SCALE = 64;

/** `ISpriteDataContainer.ink` 33 is the additive-blend marker. */
const INK_ADDITIVE = 33;

interface ILayer
{
    texture: IDrawableTexture;
    x: number;
    y: number;

    /** Higher is further back — the room renderer sorts descending and draws in order. */
    depth: number;

    additive: boolean;
}

/**
 * Returns the flattened composite, or `null` when the avatar has no extra sprites and the
 * caller should just encode the body texture as-is.
 */
export function composeAvatarWithSprites(
    avatarImage: IAvatarImage,
    body: IDrawableTexture,
    includeBody: boolean = true
): Canvas | null
{
    const sprites = avatarImage.getSprites();
    const extras = sprites.filter((sprite) => sprite.id !== AVATAR_SPRITE_ID);

    if(extras.length === 0) return null;

    const direction = avatarImage.getDirection();
    const offsets = avatarImage.getCanvasOffsets();
    const layers: ILayer[] = [];

    let bodyX = ((-ROOM_SCALE / 2) + (offsets[0] ?? 0)) - ((body.frame.width - ROOM_SCALE) / 2);
    let bodyY = (-body.frame.height + (ROOM_SCALE / 4)) + (offsets[1] ?? 0);

    // The `avatar` entry does not draw anything of its own; it nudges the body, which is how
    // effects that lift the avatar (hoverboard, jetpack) sit it above its own feet.
    for(const sprite of sprites)
    {
        if(sprite.id !== AVATAR_SPRITE_ID) continue;

        const layerData = avatarImage.getLayerData(sprite);

        bodyX += sprite.getDirectionOffsetX(direction) + (layerData?.dx ?? 0);
        bodyY += sprite.getDirectionOffsetY(direction) + (layerData?.dy ?? 0);
    }

    // The `/effect/` route wants the sprites an effect adds and nothing else, so the body is
    // skipped — but only after the loop above has run, because the `avatar` sprite entry nudges
    // the *other* sprites into place relative to it and dropping it early would move them.
    if(includeBody)
    {
        layers.push({
            texture: body,
            x: bodyX,
            y: bodyY,
            depth: AVATAR_SPRITE_DEFAULT_DEPTH + (offsets[2] ?? 0),
            additive: false
        });
    }

    // `spriteCount` scales the per-sprite depth step in AvatarVisualization; the room counts
    // its own sprite pool, which here is the body plus the extras.
    const spriteCount = extras.length + 1;

    for(const sprite of extras)
    {
        const layerData = avatarImage.getLayerData(sprite);

        let dx = sprite.getDirectionOffsetX(direction);
        let dy = sprite.getDirectionOffsetY(direction);
        const dz = sprite.getDirectionOffsetZ(direction);
        let dd = sprite.hasDirections ? direction : 0;

        let animationFrame = 0;

        if(layerData !== null)
        {
            animationFrame = layerData.animationFrame;
            dx += layerData.dx;
            dy += layerData.dy;
            dd += layerData.directionOffset;
        }

        if(dd < 0) dd += 8;
        else if(dd > 7) dd -= 8;

        const assetName = `${avatarImage.getScale()}_${sprite.member}_${dd}_${animationFrame}`;
        const asset = avatarImage.getAsset(assetName);

        if(asset === null || asset.texture === null) continue;

        // The offsets are added, where AS3 (`AvatarVisualization.as:297-298`) and the port
        // both subtract them. That is deliberate, and it is the one formula here that is not
        // a straight copy.
        //
        // Body parts and effect sprites have to end up in the same space, and the body path
        // negates twice: `AvatarImageCache` stores `-asset.offset` as the part's regPoint, and
        // `ImageData.offsetRect` negates that again — so a part with `y: 50` in the bundle
        // lands 50 *above* the origin. The sprite path negates once, which puts a sprite with
        // `y: 31` 31 below it. Copying the subtraction drew Hoverboard's board ~35px under the
        // avatar's feet with clear air between them; adding puts it exactly under them, and
        // effects 9 and 178 (hearts, the emblem halo) land correctly too.
        //
        // Which side is wrong in the room now has an answer: the room's was, and
        // `AvatarVisualization.updateExtraSprites` was changed to add too (2026-08-30). It had
        // never shown, because effect libraries were not registered with the alias collection
        // until recently and `getAsset()` returned null there, so no effect sprite was ever drawn
        // in a room. The two paths agree again; keep them that way.
        layers.push({
            texture: asset.texture,
            x: (asset.offsetX - (ROOM_SCALE / 2)) + dx,
            y: asset.offsetY + dy,
            depth: AVATAR_SPRITE_DEFAULT_DEPTH - ((0.001 * spriteCount) * dz),
            additive: sprite.ink === INK_ADDITIVE
        });
    }

    // With the body in, one layer means the extras all resolved to nothing and the caller should
    // encode the body texture as-is. Without it, one layer is a real sprite and must be drawn.
    if(layers.length === (includeBody ? 1 : 0)) return null;

    return draw(layers);
}

/**
 * Draws the layers back to front onto a canvas sized to their union, so nothing an effect adds
 * outside the body's own canvas gets clipped away.
 */
function draw(layers: ILayer[]): Canvas
{
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for(const layer of layers)
    {
        minX = Math.min(minX, layer.x);
        minY = Math.min(minY, layer.y);
        maxX = Math.max(maxX, layer.x + layer.texture.frame.width);
        maxY = Math.max(maxY, layer.y + layer.texture.frame.height);
    }

    const width = Math.max(1, Math.ceil(maxX - minX));
    const height = Math.max(1, Math.ceil(maxY - minY));
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    context.imageSmoothingEnabled = false;

    // Descending depth, matching RoomObjectSpriteVisualization's sort: the deepest sprite is
    // drawn first and everything else lands on top of it.
    const ordered = [...layers].sort((a, b) => b.depth - a.depth);

    for(const layer of ordered)
    {
        const source = layer.texture.source.resource;

        if(!source) continue;

        const frame = layer.texture.frame;

        // This canvas is always transparent — there is no room behind an avatar — so every
        // additive layer needs its darkness dissolved first, or a glow arrives as a dark blob.
        // See `extractDarknessToAlpha()`; the engine does the same, at the same point.
        const lit = layer.additive ? extractDarknessToAlpha(layer.texture) : null;

        context.globalCompositeOperation = layer.additive ? 'lighter' : 'source-over';

        if(lit !== null)
        {
            context.drawImage(lit, Math.round(layer.x - minX), Math.round(layer.y - minY));

            continue;
        }

        context.drawImage(
            source as Parameters<typeof context.drawImage>[0],
            frame.x, frame.y, frame.width, frame.height,
            Math.round(layer.x - minX), Math.round(layer.y - minY), frame.width, frame.height
        );
    }

    context.globalCompositeOperation = 'source-over';

    return canvas;
}
