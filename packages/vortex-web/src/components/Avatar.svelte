<script lang="ts">
    // Rendered by packages/vortex-imager, which runs the client's own avatar pipeline — so a head
    // here is pixel-identical to the same head in a room, which is the whole reason the imager
    // exists rather than a second renderer.
    //
    // `well` is habbo.com's circular head badge (`.user-menu__avatar`, `.item__icon`): a 46px disc
    // with the head laid over it and NOT clipped into it, so the circle shows all round the head —
    // which, measured against habbo.fr's own render, is 34px in a 46px disc. See the constants
    // below, and the table they come from.
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
    // one — and `m` turns out to be exactly the one habbo.com uses here.
    //
    // THE WELL DRAWS habbo.com's OWN PIXELS, 1:1, and the way to that was to stop reasoning about
    // it and fetch one. habbo.fr's imager answers the very same request this hotel's does, so the
    // two are directly comparable on the same figure — canvas, and the head's real alpha box inside
    // it:
    //
    //                            canvas     coiffee    chauve
    //   habbo.fr size=bighead    54x62      34x34      25x31
    //   vortex   size=m          90x130     34x35      25x31
    //   vortex   size=l          180x260    68x70      50x62
    //
    // `m` IS `bighead`: same renderer, same scale, identical to the pixel. `l` is exactly twice it,
    // and that is what made every head in a disc too big — not the placement, the SIZE. Everything
    // this component said about anchoring on the chin and scaling the bare face onto the well was
    // solving the wrong problem, and its claim that "the head is bigger than the circle" was the
    // opposite of what habbo.com draws: 34 in a 46 disc, with the circle showing all round it.
    //
    // So nothing is scaled at a 46px well. The canvas is placed at a FIXED offset, which is what
    // habbo.com does — `.user-menu__avatar` pins the img at the element origin and lets the head
    // fall wherever the canvas puts it, so the head shifts a little with the hair and habbo.com
    // simply accepts that. Their placement, measured:
    //
    //   img 54x62 at the element origin, disc 46x46 at left:0 top:6
    //   -> head at disc-relative x 6, y 9   (coiffee: img x 6-39, y 15-48)
    //
    // Ours sits at canvas x 26, y 38, so the canvas goes at (6-26, 9-38) = (-20, -29). Those two
    // are the MEASURED values, not the arithmetic: computing them off the standalone render put the
    // head at (8, 11) once it was in the page, so the offsets were closed against what the browser
    // actually draws.
    const CANVAS_W = 90;
    const CANVAS_H = 130;

    /** The disc habbo.com's numbers were measured against; a bigger well scales from it. */
    const REFERENCE_WELL = 46;

    /** Where the canvas goes, relative to the disc's top-left, at REFERENCE_WELL. */
    const CANVAS_X = -20;
    const CANVAS_Y = -29;

    const scale = $derived(well / REFERENCE_WELL);
    const offsetX = $derived(CANVAS_X * scale);
    const offsetY = $derived(CANVAS_Y * scale);

    const src = $derived(avatarUrl({
        figure,
        user,
        size: well ? 'm' : size,
        direction,
        headOnly: headOnly || well > 0,
        action,
        gesture,
    }));
</script>

{#if well}
    <span class="relative block shrink-0 rounded-full border-2 border-pill-line bg-pill {className}"
          style="width:{well}px;height:{well}px">
        <!-- `pointer-events: none` is not decoration. habbo.com's `.user-menu__avatar img` is a
             54x62 `bighead`, an image barely bigger than the head; this is the imager's `m`, a
             90x130 body canvas carrying the same head, so there is a good deal of transparency
             hanging around a well that is not `overflow:hidden` — and it must not be, because the
             hair overhangs the circle. Inside the user menu's toggle that box reached across the
             navigation bar and swallowed the right half of the green hotel button: clicking JOUER
             opened the user menu. Nothing needs to receive a click on a head.

             `image-rendering: pixelated` comes from the base rule on `img` and is RIGHT here now:
             at a 46px well the render is drawn 1:1, and at 60 it is a clean 1.304x of pixel art.
             The `auto` this used to carry was for the 2x source that is gone. -->
        <img {src} alt={user || 'Avatar'} loading="lazy" onerror={hideOnError}
             class="pointer-events-none absolute max-w-none"
             style="left:{offsetX}px;top:{offsetY}px;width:{CANVAS_W * scale}px;height:{CANVAS_H * scale}px" />
    </span>
{:else}
    <img {src} alt={user || 'Avatar'} class={className} loading="lazy" onerror={hideOnError} />
{/if}
