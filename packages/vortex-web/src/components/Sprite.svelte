<script lang="ts">
    // One icon out of habbo.com's sprite sheet. This is the single place the port keeps a real CSS
    // rule instead of a Tailwind utility: `background-position` is a pair of pixel offsets that
    // differ for all ~40 icons, so a utility per icon would be 40 arbitrary-value classes naming
    // numbers that lib/sprite.js already holds.
    import {SPRITE, SPRITE_URL} from '../lib/sprite.js';

    // `name` is deliberately the sheet's own key union and not a bare string: every icon in the
    // port is one of the ~90 entries in lib/sprite.ts, and a typo used to render a 0x0 span —
    // nothing on screen, nothing in the console. Now it is a compile error at the call site.
    let {name, label = '', className = ''}:
    {
        name: keyof typeof SPRITE;
        label?: string;
        className?: string;
    } = $props();

    const box = $derived(SPRITE[name] ?? [0, 0, 0, 0]);
</script>

<span
    class="inline-block bg-no-repeat align-middle {className}"
    style="background-image:url({SPRITE_URL});background-position:-{box[0]}px -{box[1]}px;width:{box[2]}px;height:{box[3]}px"
    role={label ? 'img' : 'presentation'}
    aria-label={label || null}
></span>
