<script lang="ts">
    // `common/tabs/tabs.html`. Every page on habbo.com has one of these under the navigation.
    //
    // The bar sits on its OWN dark band — `habbo-tabs { background-color: #001726; display: block }`
    // — which is a rule on the custom element, not on `.tabs`, and is the easiest thing in the whole
    // stylesheet to miss: grep `.tabs` and it is not there. Without it the tab links float on the
    // page background and the page loses the horizontal band that separates chrome from content.
    //
    // Two layouts: below 767 the bar collapses to a single centred toggle that opens the list; from
    // 767 the toggle disappears and the tabs sit in a row.
    //
    // The links are Ubuntu, NOT Ubuntu Condensed — the one uppercase run on the site that is not
    // condensed — and `line-height: 50px` is what gives the band its height.
    import {link, location} from 'svelte-spa-router';
    import Sprite from './Sprite.svelte';
    import type {ITab} from '../lib/tabs.js';

    let {title = '', tabs = []}: {title?: string; tabs?: ITab[]} = $props();

    let open = $state(false);

    // `strict` mirrors habbo.com's `strict-path`: / and /shop must match exactly or they would stay
    // active on every child route.
    function isActive(tab: ITab): boolean
    {
        return tab.strict ? $location === tab.path : $location.startsWith(tab.path);
    }

    const active = $derived(tabs.find(isActive) ?? tabs[0] ?? null);
</script>

<!-- habbo.com hides the bar when there are fewer than two tabs, but keeps the band. -->
<div class="w-full bg-[#001726]">
    <nav class="mx-auto w-full max-w-[1200px] px-3">
        {#if title}
            <h1 class="m-0 pt-3 text-center md:text-left">{title}</h1>
        {/if}

        {#if tabs.length > 1}
            <div class="flex h-[50px] items-center justify-center text-white md:hidden">
                <button type="button" onclick={() => (open = !open)} class="relative pr-6 text-right leading-[22px] uppercase">
                    {active?.label ?? ''}
                    <Sprite name="caret" className="absolute right-0 top-1/2 -translate-y-1/2 transition-transform duration-300 {open ? 'rotate-180' : ''}" />
                </button>
            </div>

            <!-- DEVIATION: `flex-wrap` and `whitespace-nowrap` are ours; habbo.com's bar is a plain
                 non-wrapping row. Its tabs are flex items, so once they no longer fit they SHRINK,
                 and the label breaks mid-word: "PROTECTION DU / COMPTE" over two lines with the
                 separators stranded at the baseline of the first. habbo.com does this too, which is
                 why it is not a porting gap — but it is ugly at any width where a bar is one label
                 too long, and the settings bar has been exactly that since the wallet tab arrived.
                 Wrapping whole tabs onto a second row is the same information, laid out as rows of
                 tabs instead of rows of syllables. -->
            <ul class="{open ? 'block' : 'hidden'} md:flex md:flex-wrap md:items-center md:justify-start">
                {#each tabs as tab, index (tab.path)}
                    <li class="block w-full md:w-auto md:pr-6 xl:flex xl:items-center xl:pr-0">
                        <a href={tab.path} use:link onclick={() => (open = false)}
                           class="block w-full leading-[50px] uppercase hover:border-b-0 md:whitespace-nowrap xl:w-auto {isActive(tab) ? 'text-[#6796b1]' : 'text-white hover:text-[#406180]'}">
                            {tab.label}
                        </a>

                        <!-- `habbo-tab:not(:last-child)::after`: a 2px #406180 bar, 1em tall, with
                             24px either side — and only from 1199px, where the tabs stop filling
                             the row. It is a separate element here because the link is a block that
                             fills its item, so a ::after on the item has nowhere to sit. -->
                        {#if index < tabs.length - 1}
                            <span class="mx-6 hidden h-[1em] w-[2px] bg-[#406180] align-text-bottom xl:inline-block"></span>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    </nav>
</div>
