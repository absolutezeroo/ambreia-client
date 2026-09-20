<script lang="ts">
    // The news feed. habbo.fr renders it in TWO shapes and they are not interchangeable:
    //
    //   the home (`lead` + `columns={2}`)  a full-width 300px lead plate with the story laid over
    //                                      its left third, then the rest two-up with 120px plates
    //   /community/category (`columns={1}`) a flat single-column list, no lead
    //
    // Common to both, and the part that was wrong here before:
    //   .news-header__title    { font-size: 24px; margin: 0 }   (36px, line-height 1, for the lead)
    //   .news-header__info     { font-size: 14px; color: #999; font-style: italic }
    //   .news-header__date::after { content: " | " }             between the date and the categories
    //   .news-header__summary  { font-size: 14px }
    //   .news-header__viewport { 100px square, box-shadow 3px 3px } -> 120px at 767
    //   .news-header--single .news-header__wrapper { max-width: 330px; padding: 12px 12px 0 }
    //
    // The feed's markup is SERVER-rendered on habbo.com (`habbo-compile data="…"`), so it is not in
    // sources/templates/ — this follows the rendered page, with the class rules above for geometry.
    import {link} from 'svelte-spa-router';
    import EmptyResults from './EmptyResults.svelte';
    import {IMAGES} from '../lib/config.js';
    import type {IArticleSummary} from '../lib/api.js';
    import {formatLongDate} from '../lib/i18n.js';

    let {articles = [], categories = [], lead = false, columns = 1}:
    {
        articles?: IArticleSummary[];
        categories?: {id: string; label: string}[];
        lead?: boolean;
        columns?: number;
    } = $props();

    const first = $derived(lead ? articles[0] ?? null : null);
    const rest = $derived(lead ? articles.slice(1) : articles);

    function href(article: IArticleSummary): string
    {
        return `/article/${article.id}/${article.id}`;
    }

    // An unknown category id shows as ITSELF rather than vanishing: the feed and the category list
    // are two calls, and one arriving first is not a reason to render a headline with no section.
    function label(id: string): string
    {
        return categories.find((category) => category.id === id)?.label ?? id;
    }

    function when(date: string): string
    {
        return formatLongDate(date);
    }
</script>

{#if first}
    <!-- `.news-header--single`: the plate fills the row and the story sits on top of its left third
         from 767px. Below that the two stack.

         An article with NO banner takes the flat shape instead of the 300px plate. habbo.com never
         has one — every story there is authored with its artwork, and the dark block the title sits
         on is painted INTO that artwork — so a lead with an empty image would be a 300px hole with
         four lines floating in it. The story still reads; it just does not pretend to be a poster. -->
    <article class="relative mb-6" class:md:h-[300px]={first.image}>
        <a href={href(first)} use:link class="block hover:border-b-0">
            {#if first.image}
                <div class="overflow-hidden shadow-[3px_3px_rgba(0,0,0,0.3)] md:absolute md:inset-0 md:max-w-[759px]">
                    <img src="{IMAGES}{first.image}" alt=""
                         class="h-[200px] w-full object-cover [image-rendering:auto] md:h-[300px]" />
                </div>
            {/if}

            <!-- No wash: `.news-header__wrapper` carries margin/max-width/padding and NO background
                 in app.5ac3d2f8.css, at any width. The dark left third of habbo.fr's lead is painted
                 into the banner artwork itself, which is why the title is readable over it — put a
                 `bg-black/45` here instead (as this did) and an article WITHOUT a banner renders as a
                 dark plate floating on the page, which is exactly what it looked like. -->
            <div class="relative p-3 md:pt-3 md:pr-3 md:pb-0 md:pl-3"
                 class:md:h-full={first.image} class:md:max-w-[330px]={first.image}>
                <h2 class="mt-0 mb-1.5 text-4xl leading-none">{first.title}</h2>
                <p class="m-0 text-sm text-[#ccc] italic">{when(first.date)} | {label(first.category)}</p>
                <p class="mt-3 text-sm text-white">{first.summary}</p>
            </div>
        </a>
    </article>
{/if}

<div class={columns > 1 ? 'grid grid-cols-1 gap-x-6 md:grid-cols-2' : ''}>
    {#each rest as article (article.id)}
        <article class="mb-6 flex gap-3">
            <a href={href(article)} use:link class="block shrink-0 hover:border-b-0">
                <span class="block h-[100px] w-[100px] overflow-hidden shadow-[3px_3px_rgba(0,0,0,0.3)] md:h-[120px] md:w-[120px]">
                    <img src="{IMAGES}{article.thumbnail ?? article.image}" alt=""
                         class="h-full w-full object-cover [image-rendering:auto]" />
                </span>
            </a>

            <div class="min-w-0 flex-1">
                <a href={href(article)} use:link class="hover:border-b-0">
                    <h2 class="m-0 text-2xl">{article.title}</h2>
                </a>

                <p class="m-0 text-sm text-[#999] italic">{when(article.date)} | {label(article.category)}</p>

                <p class="mt-1.5 text-sm">{article.summary}</p>
            </div>
        </article>
    {/each}
</div>

{#if !articles.length}
    <EmptyResults className="py-12" />
{/if}
