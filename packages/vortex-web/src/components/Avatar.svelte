<script lang="ts">
    // Rendered by packages/vortex-imager, which runs the client's own avatar pipeline — so a head
    // here is pixel-identical to the same head in a room, which is the whole reason the imager
    // exists rather than a second renderer.
    //
    // `well` is habbo.com's circular head badge (`.user-menu__avatar`, `.item__icon`), and the
    // detail that makes it look right is that the head is BIGGER than the circle and is not clipped
    // by it: habbo.com asks its imager for `size="bighead"` and lays that over a 46px well, so the
    // circle shows as a rim around the jaw rather than as a frame the head sits inside. Clipping a
    // 1x head into the circle — what this component did first — gives a small face in a dark disc,
    // which is the thing that reads as "not Habbo".
    //
    // So the well asks for `size=l` (the imager's zoom 2: a 180x260 canvas) and positions it by the
    // head's own centre. Both numbers below are measured off the alpha bounding box of a rendered
    // `headonly=1` at that size — box x 52-117, y 72-141 — not guessed.
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
    // one — so the exact size habbo.com's "bighead" comes back at has to be reached in CSS. `l` is
    // the closest source: a 180x260 canvas whose head measures 66x70 with its centre at (85, 107),
    // all four numbers measured off the alpha bounding box of a rendered `headonly=1`.
    //
    // The head is then drawn a touch LARGER than the well (1.06), which is what leaves the circle
    // showing as a rim around the jaw instead of a frame the face sits inside. At 1x it is far too
    // small for the circle; at full 2x it swamps it.
    const CANVAS_W = 180;
    const CANVAS_H = 260;
    const CANVAS_HEAD_H = 70;
    const CENTRE_X = 85;
    const CENTRE_Y = 107;
    const OVERFLOW = 1.06;

    const scale = $derived((well * OVERFLOW) / CANVAS_HEAD_H);
    const offsetX = $derived(well / 2 - CENTRE_X * scale);
    const offsetY = $derived(well / 2 - CENTRE_Y * scale);

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
        <img {src} alt={user || 'Avatar'} loading="lazy" onerror={hideOnError}
             class="absolute max-w-none [image-rendering:auto]"
             style="left:{offsetX}px;top:{offsetY}px;width:{CANVAS_W * scale}px;height:{CANVAS_H * scale}px" />
    </span>
{:else}
    <img {src} alt={user || 'Avatar'} class={className} loading="lazy" onerror={hideOnError} />
{/if}
