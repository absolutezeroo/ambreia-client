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
    import FeedPost from '../../components/feed/FeedPost.svelte';
    import {getFeed, type IFeedPost} from '../../lib/feed.js';
    import {t} from '../../lib/i18n.js';

    let posts = $state<IFeedPost[]>([]);
    let loading = $state(true);

    $effect(() =>
    {
        let cancelled = false;

        void getFeed()
            .then((answer) => !cancelled && (posts = answer.items ?? []))
            .catch(() => !cancelled && (posts = []))
            .finally(() => !cancelled && (loading = false));

        return () => (cancelled = true);
    });
</script>

<CommunityShell>
    <PageHeader title={t('SITE_FEED_TITLE')} description={t('SITE_FEED_DESCRIPTION')} />

    <ContentAside>
        <div class="flex flex-col gap-6">
            {#each posts as post (post.id)}
                <FeedPost {post} />
            {/each}

            {#if !loading && !posts.length}
                <EmptyResults className="py-12" />
            {/if}
        </div>
    </ContentAside>
</CommunityShell>
