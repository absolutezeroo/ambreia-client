<script lang="ts">
    // The social feed. Ours, not habbo.com's — see the note on COMMUNITY_TABS in lib/tabs.ts.
    //
    // Built from a single screenshot of a 2015-era Habbo dashboard, which is in no dump in this
    // repository; the layout below is `ContentAside`, the site's own main+304px split, because that
    // is the proportion the screenshot has and the one every other content page here already uses.
    import CommunityShell from './CommunityShell.svelte';
    import PageHeader from '../../components/PageHeader.svelte';
    import ContentAside from '../../components/ContentAside.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import Button from '../../components/Button.svelte';
    import FeedPost from '../../components/feed/FeedPost.svelte';
    import FeedComposer from '../../components/feed/FeedComposer.svelte';
    import {getFeed, getPost, listenToFeed, type IFeedPost} from '../../lib/feed.js';
    import {t} from '../../lib/i18n.js';
    import {signedIn} from '../../lib/session.js';
    import {querystring, push, link} from 'svelte-spa-router';

    let posts = $state<IFeedPost[]>([]);
    let loading = $state(true);

    // How many roots exist under the current filter, as the server counts them. The page holds
    // the first N of those and `total` is what says whether there are more — without it the feed
    // was capped at one page for good, and the server had been answering the number all along.
    let total = $state(0);
    let loadingMore = $state(false);

    // The filter lives in the URL, not in a local variable: a tag link in a post body is an
    // ordinary `<a href="?tag=…">`, the browser's back button has to undo a filter, and a filtered
    // feed has to survive being shared or reloaded.
    let tag = $derived(new URLSearchParams($querystring ?? '').get('tag') ?? '');

    let term = $state('');

    // ONE effect, re-running whenever `tag` changes — reading it here is what subscribes it. A
    // second effect beside the original would fetch the feed twice on every mount.
    $effect(() =>
    {
        // Read before the async work so the dependency is registered on this run rather than
        // after the first await, where the effect would never see it.
        const wanted = tag;

        let cancelled = false;

        loading = true;

        // `cancelled` now does real work: changing the filter starts a second request while the
        // first is still open, and without this guard the slower answer overwrites the newer one.
        void getFeed({tag: wanted || undefined})
            .then((answer) =>
            {
                if(cancelled)
                {
                    return;
                }

                posts = answer.items ?? [];
                total = answer.total;
            })
            .catch(() => !cancelled && ((posts = []), (total = 0)))
            .finally(() => !cancelled && (loading = false));

        return () => (cancelled = true);
    });

    /**
     * Older posts, appended.
     *
     * The page asked for is derived from what is already held rather than kept in a counter: a
     * live update can insert a post at the top, and a counter would then skip whichever post the
     * insertion pushed across the page boundary.
     */
    async function more()
    {
        if(loadingMore || posts.length >= total)
        {
            return;
        }

        loadingMore = true;

        try
        {
            const answer = await getFeed({
                tag: tag || undefined,
                page: Math.floor(posts.length / PAGE_SIZE) + 1,
            });

            // Filtered against what is held, because a post arriving at the top while this was in
            // flight shifts the page boundary and would otherwise send one back twice.
            const held = new Set(posts.map((post) => post.id));

            posts = [...posts, ...(answer.items ?? []).filter((post) => !held.has(post.id))];
            total = answer.total;
        }
        catch
        {
            // Silent, like the background refresh: the feed on screen is still good.
        }
        finally
        {
            loadingMore = false;
        }
    }

    /** The server's own default page size, which it applies when the request names none. */
    const PAGE_SIZE = 20;

    // A second effect, and unlike the one above it depends on NOTHING — no `tag`, no state read
    // at all — so it opens one stream for the life of the page and closes it on unmount. Folding
    // it into the effect above would reopen the connection every time the filter changed.
    $effect(() => listenToFeed((rootId) => void refresh(rootId)));

    // What somebody else just did.
    //
    // The card is refetched rather than patched from the event, because the event carries an id
    // and the card carries answers about ME: whether I liked it, whether I shared it, whether it
    // is mine. Only my own fetch can answer those.
    async function refresh(rootId: number)
    {
        if(!posts.some((post) => post.id === rootId))
        {
            // A thread I am not showing: a brand-new post, or one under a filter I am not on.
            // Refetching the FIRST page sorts both out — it either arrives at the top or it does
            // not match the filter and nothing changes.
            await reloadFirstPage();

            return;
        }

        try
        {
            const fresh = await getPost(rootId);

            // EVERY entry for that post, not just the first. A shared post is on the page more
            // than once — the original and one per sharer — and they all carry the same counters,
            // so refreshing one would leave the others showing the old numbers.
            //
            // `reposter` is kept per entry: it belongs to the entry and the fetched post has none.
            posts = posts.map((post) =>
                post.id === rootId ? {...fresh, reposter: post.reposter} : post);
        }
        catch
        {
            // Gone — deleted while somebody was looking at it. Every entry for it goes, shares
            // included: they point at a post that is no longer there.
            posts = posts.filter((post) => post.id !== rootId);
        }
    }

    /**
     * Re-reads the first page and merges it in front of what is held.
     *
     * NOT a reload: somebody may have pressed "show more" three times, and replacing the whole
     * list because one new post arrived would snatch sixty posts out from under them. Everything
     * already held that is not in the fresh first page keeps its place — which is exactly the
     * posts the new one pushed further down.
     */
    async function reloadFirstPage()
    {
        try
        {
            const first = await getFeed({tag: tag || undefined});
            const fresh = new Set((first.items ?? []).map((post) => post.id));

            posts = [...(first.items ?? []), ...posts.filter((post) => !fresh.has(post.id))];
            total = first.total;
        }
        catch
        {
            // Silent: the page already has posts on it, and a failed background refresh must not
            // empty a feed somebody is reading.
        }
    }

    function search(event: SubmitEvent)
    {
        event.preventDefault();

        // The `#` is stripped because the links in a post body carry the bare word, and a player
        // typing in this box will type the hash they can see. The server accepts either, but the
        // URL should read the same whichever way the filter was reached.
        const wanted = term.trim().replace(/^#/, '');

        push(wanted ? `/community/chats?tag=${encodeURIComponent(wanted)}` : '/community/chats');
    }
</script>

<CommunityShell>
    <!-- The search sits in the page header, not in the tab bar: `Tabs` is shared by seven pages
         and shells, and it has no business learning a search field for one of them. -->
    <PageHeader title={t('SITE_FEED_TITLE')} description={t('SITE_FEED_DESCRIPTION')}>
        <form onsubmit={search} class="mt-3 flex items-center gap-2">
            <input
                bind:value={term}
                placeholder={t('SITE_FEED_SEARCH_TAGS')}
                aria-label={t('SITE_FEED_SEARCH_TAGS')}
                class="rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field placeholder:text-[#888] focus:border-field-line-focus focus:bg-white focus:outline-none"
            />

            {#if tag}
                <a href="/community/chats" use:link class="text-sm underline">
                    {t('SITE_FEED_CLEAR_TAG', {tag})}
                </a>
            {/if}
        </form>
    </PageHeader>

    <ContentAside>
        <div class="flex flex-col gap-6">
            {#if $signedIn}
                <FeedComposer onpublished={(post) => (posts = [post, ...posts])} />
            {/if}

            <!-- `bind:` and an index, not `{post}`: a card answers a vote or a reaction with the
                 whole post as it now stands, and writing it back here keeps this array the one
                 copy. Bound through `posts[i]` because an each-block's alias is not itself a
                 writable target. -->
            <!-- Keyed by the ENTRY, not by the post. Since a share puts the same post in the feed
                 a second time, `post.id` alone is a duplicate key — which Svelte refuses — and the
                 sharer's name is what tells the two entries apart. -->
            {#each posts as post, i (`${post.id}:${post.reposter?.name ?? ''}`)}
                <FeedPost bind:post={posts[i]} ondeleted={() => (posts = posts.filter((p) => p.id !== post.id))} />
            {/each}

            <!-- Appended, not paged back and forth. The site's only other pager is the
                 leaderboard's prev/next arrows, which suit a table of standings; a feed is read
                 downwards, and a reader who has gone three pages deep must not lose their place
                 to a button. `total` is the server's count of roots under the current filter, so
                 this disappears exactly when there is nothing more. -->
            {#if posts.length < total}
                <div class="flex justify-center py-6">
                    <Button disabled={loadingMore} onclick={more}>{t('SITE_FEED_MORE')}</Button>
                </div>
            {/if}

            {#if !loading && !posts.length}
                <EmptyResults className="py-12" />
            {/if}
        </div>
    </ContentAside>
</CommunityShell>
