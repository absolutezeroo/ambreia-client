<script lang="ts">
    // Rendered by packages/vortex-imager, which runs the client's own avatar pipeline — so a head
    // here is pixel-identical to the same head in a room, which is the whole reason the imager
    // exists rather than a second renderer.
    //
    // `well` is habbo.com's circular head badge (`.user-menu__avatar`, `.item__icon`): a 46px disc
    // with the head laid over it, not clipped into it, so the circle reads as a rim around the jaw
    // and the hair overhangs it. Clipping a 1x head inside the circle gives a small face in a dark
    // disc, which is the thing that reads as "not Habbo".
    //
    // The well asks the imager for `size=l` (zoom 2, a 180x260 canvas) and places it by the head's
    // own anchor — see the constants below for which anchor, and why it is not the bounding box.
    import {avatarUrl, hideOnError} from '../lib/config.js';

    let {
        figure = '',
        user = '',
        size = 'm',
        direction = 2,
        headOnly = false,
        action = '',
        gesture = '',
        well = 0,
        className = '',
    } = $props();

    // The imager's zoom is fixed per size token (s .5 / m 1 / l 2 / b 3) — there is no arbitrary
    // one — so the size habbo.com's "bighead" comes back at (54x62, from `getDimensions` in its own
    // bundle) has to be reached in CSS from `l`, a 180x260 canvas.
    //
    // THE ANCHOR IS THE CHIN AND THE BARE FACE, not the head's bounding box. That distinction is
    // the whole fix: the box moves with the outfit, and measuring it once fixes the scale to
    // whichever figure happened to be measured. Rendered `headonly=1` at `size=l`:
    //
    //   chauve             x 66-115 (50)   y  80-141 (62)
    //   cheveux            x 48-115 (68)   y  72-141 (70)
    //   cheveux + chapeau  x 48-119 (72)   y  68-141 (74)
    //
    // The bottom edge is 141 in all three — the chin is where the geometry cuts, and it does not
    // care what is on the head. The top and the sides are the hair. Scaling the WHOLE box to the
    // well, which is what this did, therefore drew a bald head at 62/70 of a haired one and a
    // hatted one at 74/70, and at the 1.06 it used the head covered the well exactly: the circle
    // never showed, which is the one thing it is there for.
    //
    // So the BARE FACE is mapped onto the well and the chin is parked just above its bottom edge.
    // Hair and hats then overhang the top, which is what habbo.com's own crowned heads do.
    const CANVAS_W = 180;
    const CANVAS_H = 260;

    /** The bald face: 62 tall, centred on x 90.5, chin at y 141. Properties of the geometry. */
    const FACE_HEIGHT = 62;
    const FACE_CENTRE_X = 90.5;
    const CHIN_Y = 141;

    /** How far the chin sits above the well's bottom edge, so the jaw is not flush with the rim. */
    const CHIN_GAP = 4;

    const scale = $derived(well / FACE_HEIGHT);
    const offsetX = $derived(well / 2 - FACE_CENTRE_X * scale);
    const offsetY = $derived((well - CHIN_GAP) - CHIN_Y * scale);

    const src = $derived(avatarUrl({
        figure,
        user,
        size: well ? 'l' : size,
        direction,
        headOnly: headOnly || well > 0,
        action,
        gesture,
    }));
</script>

{#if well}
    <span class="relative block shrink-0 rounded-full border-2 border-pill-line bg-pill {className}"
          style="width:{well}px;height:{well}px">
        <!-- `image-rendering: auto` here and only here: the source is a 2x render being scaled DOWN,
             and nearest-neighbour on a non-integer downscale drops every other pixel row. -->
        <!-- `pointer-events: none` is not decoration. habbo.com's `.user-menu__avatar img` is a
             `size="bighead"` render — an image the size of a head — where this one is the imager's
             `l`, a 180x260 body canvas scaled to 0.7 and offset by the head's own centre. Same
             picture, box seven times the size: 125x181 of transparency hanging 129px BELOW a 46px
             well that is not `overflow:hidden` (the head is deliberately larger than the circle).
             Inside the user menu's toggle button that box reached across the whole navigation bar
             and swallowed the right half of the green hotel button — clicking JOUER opened the user
             menu instead. Nothing needs to receive a click on a head. -->
        <img {src} alt={user || 'Avatar'} loading="lazy" onerror={hideOnError}
             class="pointer-events-none absolute max-w-none [image-rendering:auto]"
             style="left:{offsetX}px;top:{offsetY}px;width:{CANVAS_W * scale}px;height:{CANVAS_H * scale}px" />
    </span>
{:else}
    <img {src} alt={user || 'Avatar'} class={className} loading="lazy" onerror={hideOnError} />
{/if}
