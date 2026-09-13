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
    import {link} from 'svelte-spa-router';
    import Panel from './Panel.svelte';

    let {children} = $props();
</script>

<section class="mx-auto flex max-w-[1200px] flex-col gap-6 px-3 py-6 lg:flex-row lg:items-start">
    <div class="min-w-0 lg:w-[calc(100%-304px)] lg:pr-6">
        {@render children()}
    </div>

    <aside class="w-full shrink-0 lg:w-[304px]">
        <!-- habbo.fr's own box, wording included: "Conseils de sécurité". -->
        <Panel title="Conseils de sécurité">
            <p class="text-sm">
                Protège-toi en te sensibilisant! Apprends comment
                <a href="/playing-habbo/safety" use:link>rester en sécurité sur Internet</a>.
            </p>
        </Panel>
    </aside>
</section>
