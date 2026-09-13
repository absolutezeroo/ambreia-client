<script lang="ts">
    // `community/fansites/fansites.html`:
    //
    //   <section class="wrapper wrapper--content">
    //     <article class="main main--fixed static-content">
    //       <habbo-compile data="FansitesController.fansites">
    //     <habbo-web-pages key="common/box_habbo_way" class="aside aside--box aside--fixed">
    //
    // So the page is a CMS page — its whole body is `webPages` content compiled at runtime, which
    // is why there is no markup for a fansite anywhere in habbo.js. This hotel has no such page on
    // its asset host and no fansite to list, so the main column falls to habbo.com's own empty
    // state; the tabs and the side box are the page, and it had neither while it was a StaticPage.
    import CommunityShell from './CommunityShell.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import WebPage from '../../components/WebPage.svelte';

    const BOX = 'static-content--box overflow-hidden rounded-[3px] bg-card px-3 py-6 xs:px-6';
</script>

<CommunityShell>
    <section class="mx-auto flex max-w-[1200px] flex-col gap-6 px-3 py-6 lg:flex-row lg:items-start">
        <!-- `.main--fixed`: calc(100% - 304px) from 959px. -->
        <article class="min-w-0 lg:w-[calc(100%-304px)] lg:pr-6">
            <EmptyResults className="py-12" />
        </article>

        <!-- `.aside--fixed`: a fixed 304px. -->
        <aside class="w-full shrink-0 lg:w-[304px]">
            <WebPage key="common/box_habbo_way" className={BOX} />
        </aside>
    </section>
</CommunityShell>
