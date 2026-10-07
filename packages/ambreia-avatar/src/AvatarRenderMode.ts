/**
 * Which of the two avatar rendering paths the room uses.
 *
 * TS-only: no AS3 counterpart. Flash had one path because it had no GPU; the choice only exists
 * because this port runs on one.
 *
 * **Composed** is what AS3 does and what the port has always done: every body part is rasterised
 * onto a canvas, the parts are drawn into one union image, and that image is uploaded as a texture.
 * The cost is per avatar per animation frame, and it is paid on the CPU — measured at 100 walking
 * avatars, body-part composition was essentially the whole frame.
 *
 * **Sprite parts** does not compose at all: each part becomes an ordinary room sprite, and the
 * renderer batches them. Tint becomes `sprite.color`, the mirror becomes `flipH`, and there is
 * nothing left to rasterise, cache or upload — so there is also no cache to warm, which is what
 * costs the first ten seconds of a busy room today. The room's sprite model already carries every
 * property a part needs, and `AvatarVisualization` already emits several sprites per avatar.
 *
 * Both paths stay live so a run can be measured with each. Every conclusion in this area that was
 * reached by reading code rather than measuring turned out to be wrong, including several that
 * looked obvious.
 */
export class AvatarRenderMode
{
    // TS-only: see `get spriteParts()`.
    private static _spriteParts: boolean = true;

    // TS-only: see `get generation()`.
    private static _generation: number = 0;

    /**
     * Whether the room draws avatars as batched part sprites instead of one composed image.
     *
     * On, having been measured: 100 avatars went from about 10 fps with an eight-second warm-up to a
     * steady 170, and 200 avatars hold 139, with `AvatarImageCache` no longer appearing anywhere in
     * the profile's top twelve. `:spriteparts off` returns to the composed path at runtime, which is
     * the first thing to try if an avatar ever renders wrongly.
     *
     * Everything outside the room — previews, the avatar editor, the imager — still calls
     * `getImage()` and is untouched by this.
     */
    // TS-only: see the class note.
    public static get spriteParts(): boolean
    {
        return AvatarRenderMode._spriteParts;
    }

    // TS-only: see the class note.
    public static set spriteParts(value: boolean)
    {
        if(value === AvatarRenderMode._spriteParts) return;

        AvatarRenderMode._spriteParts = value;
        AvatarRenderMode._generation++;
    }

    /**
     * Bumped whenever the mode changes, so the caches can notice.
     *
     * A body-part container built under one mode carries exactly the half the other mode does not
     * read — a texture and no parts, or parts and no texture — and a consumer finding the half it
     * wants missing draws nothing rather than failing. Every avatar in the room would quietly lose
     * pieces of itself until its cache happened to be rebuilt.
     *
     * A counter rather than a reset call because the caches are per avatar image and nothing owns
     * them collectively; each compares this on its next lookup and flushes itself, which costs one
     * integer comparison and needs no registry of who exists.
     */
    // TS-only: see the class note.
    public static get generation(): number
    {
        return AvatarRenderMode._generation;
    }
}
