<script lang="ts">
    // `habbo-nft/habbo-nft.html` — the shell: the small header (global, in App.svelte), the two-tab
    // bar, and a `ui-view`. Each tab is `<article class="main main--fixed static-content">` with no
    // side boxes, unlike playing-habbo, whose shell carries an aside.
    //
    // `.static-content` lives here rather than in each tab for the same reason the bar does: both
    // tabs are the same kind of editorial page, and a class declared twice is a class that drifts.
    import Tabs from '../../components/Tabs.svelte';
    import {HABBO_NFT_TABS} from '../../lib/tabs.js';

    let {children} = $props();
</script>

<Tabs tabs={HABBO_NFT_TABS} />

<main class="mx-auto w-full max-w-[1200px] px-3 py-6">
    <article class="static-content">
        {@render children()}
    </article>
</main>
