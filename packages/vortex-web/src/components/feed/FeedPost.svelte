<script lang="ts">
    // One card in the feed. It renders a comment too — a comment IS a post with a parent, so the
    // component recurses rather than existing twice.
    //
    // The screenshot's card is a `.aside--box` with its title bled into a darker band across the
    // top, which is exactly what `Panel` does, so the header is Panel's own title band and not a
    // second implementation of it.
    import Panel from '../Panel.svelte';
    import Avatar from '../Avatar.svelte';
    import FeedBody from './FeedBody.svelte';
    // `<svelte:self>` is deprecated in this version (svelte_self_deprecated) — a component imports
    // itself by name instead.
    import FeedPost from './FeedPost.svelte';
    import FeedPoll from './FeedPoll.svelte';
    import {FEED_KIND, type IFeedPost} from '../../lib/feed.js';
    import {photoUrl} from '../../lib/api.js';
    import {t} from '../../lib/i18n.js';

    // `post` is bindable because voting, reacting and commenting all answer with the WHOLE post as
    // it now stands, and the card's job is then to show that answer rather than to adjust a count
    // by hand. Writing back through the binding keeps the page's array the single copy — the
    // alternative, a local override, would quietly win over a later refetch.
    let {post = $bindable(), comment = false}: {post: IFeedPost; comment?: boolean} = $props();

    // "PRODIIGY published 2 new pictures" / "posted a new poll" / "updated his/her status" — the
    // screenshot's three headings, one per kind.
    let heading = $derived(
        post.kind === FEED_KIND.PHOTO
            ? t('SITE_FEED_PUBLISHED_PICTURES', {count: String(post.photos?.length ?? 0)})
            : post.kind === FEED_KIND.POLL
              ? t('SITE_FEED_POSTED_POLL')
              : t('SITE_FEED_UPDATED_STATUS'),
    );
</script>

<article class="flex gap-3">
    <Avatar user={post.groupName ? '' : post.authorName} figure={post.authorFigureString} headOnly className="hidden shrink-0 xs:block" />

    <div class="min-w-0 flex-1">
        <Panel title="{post.groupName ?? post.authorName}  {heading}" className={comment ? 'bg-panel-head' : ''}>
            <p class="mb-3"><FeedBody body={post.body} /></p>

            {#if post.kind === FEED_KIND.PHOTO && post.photos?.length}
                <div class="mb-3 grid grid-cols-2 gap-1">
                    {#each post.photos as photo (photo.key)}
                        <img src={photoUrl(photo.key)} alt="" class="w-full" loading="lazy" />
                    {/each}
                </div>
            {/if}

            {#if post.kind === FEED_KIND.POLL}
                <FeedPoll {post} onvoted={(updated) => (post = updated)} />
            {/if}

            <!-- The counters bar. Its two reaction controls arrive in Task 8; until then it states
                 the numbers, which is what a signed-out visitor sees in any case. -->
            <div class="flex items-baseline gap-6 border-t border-rule pt-3 text-sm">
                <span><b>{post.commentCount}</b> {t('SITE_FEED_COMMENTS')}</span>
                <span class="ml-auto"><b>{post.repostCount}</b> {t('SITE_FEED_REPOSTS')}</span>
                <span><b>{post.favoriteCount}</b> {t('SITE_FEED_FAVORITES')}</span>
            </div>
        </Panel>

        <!-- Bound like the page binds its own cards, and for the same reason: a comment may itself
             be a poll — the design gives the comment form the same three tabs — so a vote inside
             one has to write back somewhere rather than be lost on the next render. -->
        {#if !comment && post.comments?.length}
            <div class="mt-3 flex flex-col gap-3 pl-6">
                {#each post.comments as child, i (child.id)}
                    <FeedPost bind:post={post.comments[i]} comment />
                {/each}
            </div>
        {/if}
    </div>
</article>
