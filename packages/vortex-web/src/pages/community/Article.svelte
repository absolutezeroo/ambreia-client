<script lang="ts">
    // `/article/:id/:title` — `community/article/article.html`, the standard `main--fixed` + 304px
    // safety aside, and the community tab bar stays lit on it.
    //
    // The page's own shape, from the rendered site:
    //
    //   the HERO       the same `.news-header--single` plate the feed leads with — the article's
    //                  image full width, its title, the italic "date | catégorie" line and the
    //                  summary laid over the left third of it
    //   the article    the title again, then the body
    //   two panels     "Voir aussi" (the server's `related` list) beside "Nouveautés" (the newest
    //                  articles), each entry a title with its date dimmed after it
    //
    // Real now: GET /api/public/articles/{slug} answers `{ lang, article, body, related }`, and the
    // body is the closed block vocabulary — see components/ArticleBody.svelte. The newest list is a
    // second, small feed read, which is what habbo.com's own page does too.
    import {link} from 'svelte-spa-router';
    import CommunityShell from './CommunityShell.svelte';
    import ContentAside from '../../components/ContentAside.svelte';
    import ArticleBody from '../../components/ArticleBody.svelte';
    import Panel from '../../components/Panel.svelte';
    import * as api from '../../lib/api.js';
    import type {IArticleDetail, IArticleSummary} from '../../lib/api.js';
    import {IMAGES} from '../../lib/config.js';
    import {t, formatLongDate} from '../../lib/i18n.js';

    let {params = {}} = $props();

    let detail = $state<IArticleDetail | null>(null);
    let newest = $state<IArticleSummary[]>([]);
    let categories = $state<{id: string; label: string}[]>([]);
    let error = $state('');
    let loading = $state(true);

    const article = $derived(detail?.article ?? null);

    // The date and the category read together as one italic line, so they are resolved together.
    function label(id: string): string
    {
        return categories.find((category) => category.id === id)?.label ?? id;
    }

    function when(date: string): string
    {
        return formatLongDate(date);
    }

    // Takes only what it reads. The "Nouveautés" panel passes a full summary and the related list
    // passes an `ArticleLink`, which is just an id and a title — asking for a summary here made the
    // second caller a type error for fields the function never touches.
    function href(entry: {id: string}): string
    {
        return `/article/${entry.id}/${entry.id}`;
    }

    $effect(() =>
    {
        const slug = params.id;
        let cancelled = false;

        loading = true;
        error = '';

        (async () =>
        {
            try
            {
                // Both reads at once: the article is the page, the feed only fills the "Nouveautés"
                // panel and its categories, so neither should wait on the other.
                const [one, feed] = await Promise.all([
                    api.getArticle(slug),
                    api.getArticles({pageSize: 5}),
                ]);

                if(!cancelled)
                {
                    detail = one;
                    newest = feed?.items ?? [];
                    categories = feed?.categories ?? [];
                }
            }
            catch(failure)
            {
                if(!cancelled)
                {
                    error = (failure as Error)?.message ?? '';
                    detail = null;
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
</script>

<CommunityShell>
<main>
    <ContentAside>
        <div>
            {#if loading}
                <p class="py-12 text-center">...</p>
            <!-- Guarded on BOTH: `article` is derived from `detail`, and the checker cannot infer
                 one from the other — so without naming `detail` here the branch below reads its
                 `body` and `related` off a value it has not proved is there. -->
            {:else if !detail || !article}
                <h1>{error || t('EMPTY_RESULTS_TEXT')}</h1>
                <p><a href="/community" use:link>{t('NEWS_TITLE')}</a></p>
            {:else}
                <!-- The hero: `.news-header--single`, the story over the left third of a 300px plate
                     from 767px; below that the two stack and the plate drops to 200px. -->
                <article class="relative mb-6 md:h-[300px]">
                    <div class="overflow-hidden shadow-[3px_3px_rgba(0,0,0,0.3)] md:absolute md:inset-0 md:max-w-[759px] md:shadow-none">
                        <img src="{IMAGES}{article.image}" alt=""
                             class="h-[200px] w-full object-cover [image-rendering:auto] md:h-[300px]" />
                    </div>

                    <div class="relative p-3 md:h-full md:max-w-[330px] md:bg-black/45">
                        <h2 class="mt-0 mb-1.5">{article.title}</h2>
                        <p class="m-0 text-sm text-[#ccc] italic">{when(article.date)} | {label(article.category)}</p>
                        <p class="mt-3 text-sm text-white">{article.summary}</p>
                    </div>
                </article>

                <!-- `.news-article` -->
                <article>
                    <h1>{article.title}</h1>

                    <ArticleBody body={detail.body ?? []} />

                    {#if article.author}
                        <p class="mt-6 text-sm italic">{article.author}</p>
                    {/if}
                </article>

                <!-- The two lists habbo.com puts under an article, side by side. -->
                <div class="mt-12 grid grid-cols-1 items-start gap-6 md:grid-cols-2">
                    {#if detail.related?.length}
                        <Panel title={t('NEWS_RELATED')}>
                            <ul>
                                {#each detail.related as entry (entry.id)}
                                    <li class="py-1.5">
                                        <a href={href(entry)} use:link>{entry.title}</a>
                                    </li>
                                {/each}
                            </ul>
                        </Panel>
                    {/if}

                    {#if newest.length}
                        <Panel title={t('NEWS_NEWEST')}>
                            <ul>
                                {#each newest as entry (entry.id)}
                                    <li class="py-1.5">
                                        <a href={href(entry)} use:link>{entry.title}</a>
                                        <span class="text-ink"> ({when(entry.date)})</span>
                                    </li>
                                {/each}
                            </ul>
                        </Panel>
                    {/if}
                </div>
            {/if}
        </div>
    </ContentAside>
</main>
</CommunityShell>
