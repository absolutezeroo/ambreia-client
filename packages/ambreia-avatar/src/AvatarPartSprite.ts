import type {Texture} from 'pixi.js';

/**
 * One avatar part, described rather than drawn.
 *
 * TS-only: no AS3 counterpart. Flash composed body parts into a single BitmapData because it had no
 * other option; this is the same information at the point just before that composition happens, so a
 * GPU renderer can batch the parts instead of flattening them.
 *
 * The coordinates are deliberately **relative to the body-part container's registration point** —
 * that is, they are the `drawX`/`drawY` that `createUnionImage()` would have used to blit this part
 * into the union canvas. Keeping that frame of reference means every offset downstream
 * (`AvatarImage`'s `regPoint + canvas.offset + canvas.regPoint`) applies unchanged, so the two paths
 * put a part in the same place by construction rather than by a second calculation that has to be
 * kept in agreement with the first.
 */
export interface IAvatarPartSprite
{
    /** The asset texture, shared with the bundle — never owned, never destroyed by a consumer. */
    // TS-only: see the interface note.
    texture: Texture;

    /** X within the body-part container, relative to its registration point. */
    // TS-only: see the interface note.
    x: number;

    /** Y within the body-part container, relative to its registration point. */
    // TS-only: see the interface note.
    y: number;

    /** Whether this part draws mirrored: the direction's flip combined with the asset's own. */
    // TS-only: see the interface note.
    flipH: boolean;

    /** Colour transform as a `0xRRGGBB` tint; `0xFFFFFF` when the part carries none. */
    // TS-only: see the interface note.
    color: number;

    /** Alpha multiplier, 1 when the part carries no colour transform. */
    // TS-only: see the interface note.
    alpha: number;
}

/**
 * A whole avatar as parts, in the coordinate space `AvatarImage.getImage()` composes into.
 *
 * TS-only: no AS3 counterpart.
 *
 * `width`/`height` are the avatar canvas's, which is exactly what the composed texture measures —
 * `getImage()` allocates its surface at `canvas.width × canvas.height` and never crops it. That
 * equality is what lets the room place an avatar identically on either path without measuring a
 * texture it no longer has.
 */
export interface IAvatarPartSpriteSet
{
    /** The avatar canvas width; the composed texture's width on the other path. */
    // TS-only: see the interface note.
    width: number;

    /** The avatar canvas height; the composed texture's height on the other path. */
    // TS-only: see the interface note.
    height: number;

    /** Parts in draw order — first drawn first, so a consumer adds them in order. */
    // TS-only: see the interface note.
    parts: IAvatarPartSprite[];
}
