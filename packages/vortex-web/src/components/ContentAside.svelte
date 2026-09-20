<script lang="ts">
    // The standard content layout, and it really is standard: `home/news/news.html`,
    // `community/category/category.html` and `community/article/article.html` are all
    //
    //   <section class="wrapper wrapper--content">
    //     <div class="main main--fixed">…</div>
    //     <habbo-web-pages key="common/box_learn_how_to_stay_safe" class="aside aside--box aside--fixed">
    //
    // `main--fixed` is `calc(100% - 304px)` and `aside--fixed` is a FIXED 304px, both from 959px.
    // The aside is the same CMS safety box on all three pages — not a per-page sidebar.
    import WebPage from './WebPage.svelte';

    let {children} = $props();

    // The same class SettingsShell and PlayingShell give their boxes: `.aside--box` plus the
    // `.static-content` rules the injected CMS markup needs.
    const BOX = 'static-content--box overflow-hidden rounded-[3px] bg-card px-3 py-6 xs:px-6';
</script>

<section class="mx-auto flex max-w-[1200px] flex-col gap-6 px-3 py-6 lg:flex-row lg:items-start">
    <div class="min-w-0 lg:w-[calc(100%-304px)] lg:pr-6">
        {@render children()}
    </div>

    <aside class="w-full shrink-0 lg:w-[304px]">
        <!-- The CMS box itself, not a transcription of it. The comment above already said this
             aside IS `<habbo-web-pages key="common/box_learn_how_to_stay_safe">`, and the markup
             underneath had the French typed out by hand — so the one page in the site that reads
             this box was the one page that could not be translated, while SettingsShell rendered
             the very same key properly. It is mirrored in all nine languages. -->
        <WebPage key="common/box_learn_how_to_stay_safe" className={BOX} />
    </aside>
</section>
