<script lang="ts">
    // `/` — `home/home.html` + `home/news/news.html`.
    //
    //   <habbo-tabs> Actualites | Messagerie
    //   <main class="wrapper wrapper--content">
    //     <section>
    //       <h1>NEWS_TITLE</h1>
    //       <div class="main main--fixed">   the promos, then a "more news" link
    //       <aside class="aside aside--box aside--fixed">   a safety box out of the CMS
    //
    // The split is `main--fixed` / `aside--fixed`: `calc(100% - 304px)` and a FIXED 304px, from
    // 959px — not a percentage pair. And there is no purse, no friend list and no badge shelf here;
    // this port used to put all three in a left sidebar, which habbo.com does not have. The purse
    // belongs to the shop (`shop/purse/purse.html`) and the rest to the profile.
    import {link} from 'svelte-spa-router';
    import Tabs from '../components/Tabs.svelte';
    import ContentAside from '../components/ContentAside.svelte';
    import NewsList from '../components/NewsList.svelte';
    import Sprite from '../components/Sprite.svelte';
    import {HOME_TABS} from '../lib/tabs.js';
    import {t} from '../lib/i18n.js';
    import * as api from '../lib/api.js';
    import type {IArticleFeed} from '../lib/api.js';
    import {signedIn} from '../lib/session.js';

    // The same feed the community tab reads — `news.html` fills this column from the CMS on
    // habbo.com, and the emulator's /api/public/articles is that CMS here. Anonymous, so the front
    // page renders with no session.
    let feed = $state<IArticleFeed | null>(null);

    $effect(() =>
    {
        let cancelled = false;

        api.getArticles({pageSize: 5})
            .then((answer) => !cancelled && (feed = answer))
            // A feed that will not load must not take the home page down with it: the rest of the
            // page — the hotel, the safety box — has nothing to do with the articles.
            .catch(() => !cancelled && (feed = null));

        return () => (cancelled = true);
    });
</script>

<Tabs tabs={$signedIn ? HOME_TABS : []} />

<main>
    <ContentAside>
        <div>
            <h1>{t('NEWS_TITLE')}</h1>

            <!-- The home leads with a 300px hero and runs the rest two-up; /community/category is
                 the flat one-column list. Two shapes of the same feed, and habbo.fr uses both. -->
            <div class="mt-6">
                <NewsList articles={feed?.items ?? []} categories={feed?.categories ?? []} lead columns={2} />
            </div>

            <!-- `.news__navigation` > `.news__more`: 20px condensed, floated right, with the double
                 chevron pinned in the 29px of padding it reserves on its right. -->
            <div class="mt-6 after:block after:clear-both after:content-['']">
                <a href="/community/category" use:link
                   class="relative float-right block py-1.5 pr-[29px] text-right font-condensed text-xl leading-7 uppercase hover:border-b-0 [text-shadow:0_1px_rgba(0,0,0,0.3)]">
                    {t('NEWS_MORE')}
                    <Sprite name="more" className="absolute top-1/2 right-0 -translate-y-1/2" />
                </a>
            </div>
        </div>
    </ContentAside>
</main>
