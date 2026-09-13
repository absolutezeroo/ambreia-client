<script lang="ts">
    // `/community` — `community/community.html` + `community/category/category.html`: the news tab,
    // laid out as the standard `main--fixed` + 304px safety aside.
    //
    // Real now: GET /api/public/articles answers `{ lang, page, pageSize, total, categories, items }`,
    // anonymous, with the ordering already done server-side (pinned first, then newest). The filter
    // row is built from the response's OWN categories rather than from a list held here — the hotel
    // decides which categories exist, and a hard-coded list would drift the moment one is added.
    import {link} from 'svelte-spa-router';
    import CommunityShell from './CommunityShell.svelte';
    import ContentAside from '../../components/ContentAside.svelte';
    import NewsList from '../../components/NewsList.svelte';
    import * as api from '../../lib/api.js';
    import type {IArticleFeed} from '../../lib/api.js';
    import {t} from '../../lib/i18n.js';

    let {params = {}} = $props();

    let feed = $state<IArticleFeed | null>(null);
    let error = $state('');
    let loading = $state(true);

    const category = $derived(params.category && params.category !== 'all' ? params.category : '');

    $effect(() =>
    {
        const wanted = category;
        let cancelled = false;

        loading = true;
        error = '';

        (async () =>
        {
            try
            {
                const answer = await api.getArticles({category: wanted});

                if(!cancelled)
                {
                    feed = answer;
                }
            }
            catch(failure)
            {
                if(!cancelled)
                {
                    error = (failure as Error)?.message ?? '';
                    feed = null;
                }
            }
            finally
            {
                if(!cancelled)
                {
                    loading = false;
                }
            }
        })();

        return () => (cancelled = true);
    });

    function categoryHref(id: string): string
    {
        return id ? `/community/category/${id}` : '/community/category/all';
    }

    // `all`/`tout` are the codes the "everything" pill uses, not categories — but the emulator's
    // seed contains a category row whose id is literally `tout`, because it was seeded from this
    // site's old mock (which carried a fake all-entry). Dropping them here stops a second "Tout"
    // pill appearing beside the real one; the row itself is theirs to delete.
    const pills = $derived((feed?.categories ?? [])
        .filter((item) => item.id !== 'tout' && item.id !== 'all'));
</script>

<CommunityShell>
<main>
    <ContentAside>
        <div>
            <h1>{t('NEWS_TITLE')}</h1>

            <!-- `NEWS_SHOW_MORE` — habbo.com's own line above the filter row. -->
            <p class="mt-6 mb-3 text-sm">{t('NEWS_SHOW_MORE')}</p>

            <ul class="mb-6 flex flex-wrap gap-1.5">
                <li>
                    <a href={categoryHref('')} use:link
                       class="block rounded-[3px] px-3 py-1 text-sm hover:border-b-0 {category ? 'bg-topbar text-white hover:bg-btn-hover' : 'bg-btn text-white'}">
                        {t('NEWS_CATEGORY_ALL')}
                    </a>
                </li>

                {#each pills as item (item.id)}
                    <li>
                        <a href={categoryHref(item.id)} use:link
                           class="block rounded-[3px] px-3 py-1 text-sm hover:border-b-0 {category === item.id ? 'bg-btn text-white' : 'bg-topbar text-white hover:bg-btn-hover'}">
                            {item.label}
                        </a>
                    </li>
                {/each}
            </ul>

            {#if loading}
                <p class="py-12 text-center">...</p>
            {:else if error}
                <p class="py-12 text-center">{error}</p>
            {:else}
                <NewsList articles={feed?.items ?? []} categories={feed?.categories ?? []} />
            {/if}
        </div>
    </ContentAside>
</main>
</CommunityShell>
