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
    import FeedComposer from '../../components/feed/FeedComposer.svelte';
    import {getFeed, type IFeedPost} from '../../lib/feed.js';
    import {t} from '../../lib/i18n.js';
    import {signedIn} from '../../lib/session.js';

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
            {#if $signedIn}
                <FeedComposer onpublished={(post) => (posts = [post, ...posts])} />
            {/if}

            <!-- `bind:` and an index, not `{post}`: a card answers a vote or a reaction with the
                 whole post as it now stands, and writing it back here keeps this array the one
                 copy. Bound through `posts[i]` because an each-block's alias is not itself a
                 writable target. -->
            {#each posts as post, i (post.id)}
                <FeedPost bind:post={posts[i]} />
            {/each}

            {#if !loading && !posts.length}
                <EmptyResults className="py-12" />
            {/if}
        </div>
    </ContentAside>
</CommunityShell>
