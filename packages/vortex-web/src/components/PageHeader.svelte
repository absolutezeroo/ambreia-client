<script lang="ts">
    // `.photos__header` / `.rooms__header` — the band a section leads with, and the piece that was
    // missing from every page here:
    //
    //   background-color: #069                     a lighter blue than the page, full width
    //   .…__container { display:flex; align-items:center; padding: 24px 0 }
    //   .…__image     { 243x295 illustration, margin-left: -81px }   hidden below its breakpoint
    //   .…__title     { border-bottom: 1px solid #0c3a65; padding-bottom: 12px; position: relative }
    //   .…__title::after { background:#2a9cde; height:1px; bottom:-2px }
    //
    // The title's rule is TWO lines again — dark then light, a pixel apart — the same engraved edge
    // the purse divider has. One border reads flat.
    //
    // The illustration is habbo.com's own `teaser_stories_channels` sheet; its negative left margin
    // lets it hang off the wrapper's left edge, which is why the band has to clip.
    import type {Snippet} from 'svelte';
    // `children` is OPTIONAL — most headers are a title and a sentence, and the three that add a
    // control (the rooms filter, the shop's tabs) pass one. It was required by inference, so every
    // caller without one was a type error the moment this file started being checked.
    let {title = '', description = '', illustration = false, children}:
    {
        title?: string;
        description?: string;
        illustration?: boolean;
        children?: Snippet;
    } = $props();

    const TEASER = new URL('../assets/teaser_channels.png', import.meta.url).href;
</script>

<header class="w-full overflow-hidden bg-[#069]">
    <div class="mx-auto flex w-full max-w-[1200px] items-center px-3 py-6">
        {#if illustration}
            <div class="hidden shrink-0 lg:block">
                <div class="-ml-[81px] h-[295px] w-[243px] bg-center bg-no-repeat [image-rendering:pixelated]"
                     style="background-image:url({TEASER})"></div>
            </div>
        {/if}

        <div class="min-w-0 flex-1">
            <h1 class="relative mt-0 border-b border-page pb-3 after:absolute after:-bottom-[2px] after:left-0 after:z-[1] after:block after:h-px after:w-full after:overflow-hidden after:bg-rule after:content-['']">
                {title}
            </h1>

            {#if description}
                <p>{description}</p>
            {/if}

            {#if children}
                {@render children()}
            {/if}
        </div>
    </div>
</header>
