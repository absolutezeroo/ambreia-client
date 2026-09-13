<script lang="ts">
    // `playing-habbo/playing-habbo.html` — the shell: header, the five tabs, and a `ui-view`.
    //
    // Each tab is its own template (`what-is-habbo.html`, `how-to-play.html`, `habbo-way.html`,
    // `safety.html`, `help.html`) and they differ in exactly one thing besides the CMS key: WHICH
    // side boxes they carry. That is why each is a page here and the box list is a prop, rather than
    // one file holding a route -> key map.
    import Tabs from '../../components/Tabs.svelte';
    import WebPage from '../../components/WebPage.svelte';
    import {PLAYING_HABBO_TABS} from '../../lib/tabs.js';

    let {page, boxes = []} = $props();

    const BOX = 'static-content--box mb-6 overflow-hidden rounded-[3px] bg-card px-3 py-6 xs:px-6';
</script>

<Tabs tabs={PLAYING_HABBO_TABS} />

<main class="mx-auto flex max-w-[1200px] flex-col gap-6 px-3 py-6 lg:flex-row lg:items-start">
    <!-- `.main--fixed`: calc(100% - 304px) from 959px. -->
    <article class="min-w-0 lg:w-[calc(100%-304px)] lg:pr-6">
        <WebPage key={page} />
    </article>

    <!-- `.aside--fixed`: a FIXED 304px, however many boxes this tab declares. -->
    <aside class="w-full shrink-0 lg:w-[304px]">
        {#each boxes as box (box)}
            <WebPage key={box} className={BOX} />
        {/each}
    </aside>
</main>
