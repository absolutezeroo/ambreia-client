<script lang="ts">
    // `habbo-profile-header` — `profile/profile-header/profile-header.html`, which habbo.com puts on
    // two pages: the profile itself (`profile="true"`: the whole avatar, nothing linked) and a
    // photo's page (the LARGE HEAD, and both the head and the plate linking to the profile). One
    // component there, so one here; the page passes what goes on the plate.
    //
    // DEVIATION: habbo.com hangs this on the SMALL HEADER itself
    // (`<habbo-header-small class="profile__header">`), so the room art runs behind the logo and the
    // navigation as one continuous band — `habbo-header-small{background:#069}` is what it replaces.
    // Here the header and the navigation are rendered by `App.svelte` for every route, and reaching
    // up to repaint them from one page would mean a store or prop-drilling through the shell for a
    // background image. The band therefore starts below the navigation. Its own proportions are
    // habbo.com's exactly, which is what puts the avatar, the name and the motto where they belong.
    import {link} from 'svelte-spa-router';
    import type {Snippet} from 'svelte';
    import Avatar from './Avatar.svelte';

    let {name, figure, profile = false, children}: {
        name: string;
        figure: string;
        /** habbo.com's `profile="true"`: the profile page itself, where nothing links anywhere. */
        profile?: boolean;
        children: Snippet;
    } = $props();

    // `.profile__header`'s own background — fetched by tools/fetch-assets.mjs like every other
    // habbo.com bitmap here, and gitignored with them.
    const HEADER_BAND = new URL('../assets/profile_header.png', import.meta.url).href;

    const PLATE = 'min-w-0 max-w-[500px] flex-1 self-center rounded-[3px] bg-black/50 py-3 pl-[58px] pr-6 break-all';
</script>

<!-- `.profile__header`: a room shot behind the avatar, `left bottom / 100%` and
     `image-rendering: pixelated` — it IS pixel art, and smoothing it turns the tiles to mush. The
     `::before` under it is a 2px gradient, which is what stops the band ending on a hard line. -->
<header class="relative mb-6 w-full bg-[length:100%] bg-[position:left_bottom] bg-no-repeat [image-rendering:pixelated] after:absolute after:-bottom-[2px] after:left-0 after:h-[2px] after:w-full after:bg-gradient-to-b after:from-black/30 after:to-transparent after:content-['']"
        style="background-image:url({HEADER_BAND})">
    <!-- `habbo-profile-header{display:flex; align-items:center; height:142px}`, with
         `padding-left: 90px` from 767 and `130px` from 959.

         `.profile-header__avatar` reserves 46px and `align-self: flex-start`, and the image inside
         it is 104 wide over an 88px disc — so the avatar OVERFLOWS its slot and tucks under the
         details plate, which reserves 58px of left padding for exactly that. -->
    <div class="mx-auto flex h-[142px] max-w-[1200px] items-center px-3 md:pl-[90px] lg:pl-[130px]">
        <div class="w-[46px] shrink-0 self-start">
            {#if profile}
                <!-- `.profile-header__image`: margin 16/24, the disc at (-16, 24). -->
                <div class="relative ml-4 mr-6 w-[104px] pt-[5px] before:absolute before:-left-4 before:top-6 before:h-[88px] before:w-[88px] before:rounded-full before:border-2 before:border-pill-line before:bg-pill before:shadow-pill before:content-['']">
                    <Avatar {figure} size="m" direction={2} className="relative block" />
                </div>
            {:else}
                <!-- `.profile-header__image--largehead`: no margins, the disc at (0, 24), and the
                     imager's `largehead` — the head alone, at twice the size. -->
                <a href="/profile/{encodeURIComponent(name)}" use:link
                   class="relative block w-[104px] hover:border-b-0 before:absolute before:left-0 before:top-6 before:h-[88px] before:w-[88px] before:rounded-full before:border-2 before:border-pill-line before:bg-pill before:shadow-pill before:content-['']">
                    <Avatar {figure} size="l" headOnly direction={2} className="relative -ml-[3px] block" />
                </a>
            {/if}
        </div>

        <!-- `.profile-header__details`: a translucent black plate, rounded 3px, 500px wide. Linked
             to the profile everywhere but on the profile. -->
        {#if profile}
            <div class={PLATE}>{@render children()}</div>
        {:else}
            <a href="/profile/{encodeURIComponent(name)}" use:link class="{PLATE} text-white hover:border-b-0">
                {@render children()}
            </a>
        {/if}
    </div>
</header>
