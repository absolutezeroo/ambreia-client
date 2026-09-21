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
    // FeedComposer imports FeedPost's sibling and FeedPost imports FeedComposer — a cycle Vite
    // resolves because neither reads the other at module scope. Keep both imports inside the
    // component and nothing at the top level of either module.
    import FeedComposer from './FeedComposer.svelte';
    import {FEED_KIND, FEED_REACTION, getPost, setReaction, type IFeedPost} from '../../lib/feed.js';
    import {photoUrl} from '../../lib/api.js';
    import {groupBadgeUrl, hideOnError} from '../../lib/config.js';
    import {t} from '../../lib/i18n.js';
    import {signedIn} from '../../lib/session.js';
    import * as notifier from '../../lib/notifier.js';

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

    let reacting = $state(false);
    let expanding = $state(false);

    // A new comment is appended and the count stepped by hand rather than refetching the post:
    // the server already answered with the comment itself, and a refetch here would cost a round
    // trip to learn what we are holding.
    function added(child: IFeedPost)
    {
        post = {
            ...post,
            comments: [...(post.comments ?? []), child],
            commentCount: post.commentCount + 1,
        };
    }

    async function expand()
    {
        if(expanding)
        {
            return;
        }

        expanding = true;

        try
        {
            post = await getPost(post.id);
        }
        catch(failure)
        {
            notifier.error((failure as Error).message);
        }
        finally
        {
            expanding = false;
        }
    }

    async function react(kind: number, on: boolean)
    {
        if(reacting)
        {
            return;
        }

        reacting = true;

        try
        {
            // The server answers with the whole post, counters recomputed, so the card takes its
            // word rather than incrementing locally — which would drift the moment two readers
            // press at once.
            post = await setReaction(post.id, kind, on);
        }
        catch(failure)
        {
            notifier.error((failure as Error).message);
        }
        finally
        {
            reacting = false;
        }
    }
</script>

<article class="flex gap-3">
    <!-- A post published under a group wears the GROUP'S BADGE, not its author's head. The row
         still records who wrote it — `authorName` is what a delete checks and what moderation
         reads — but the card is the group speaking, and showing a face there would attribute it
         to the person instead.

         The author is named on hover rather than nowhere: a group post with no attribution at all
         lets a member speak as the group with nothing tying it back to them, and the row knows
         perfectly well who wrote it. -->
    {#if post.groupId}
        <img
            src={groupBadgeUrl(post.groupBadgeCode ?? '')}
            alt={post.groupName ?? ''}
            title="{post.groupName ?? ''} — {post.authorName}"
            width="40"
            height="40"
            onerror={hideOnError}
            class="hidden shrink-0 xs:block"
        />
    {:else}
        <Avatar user={post.authorName} figure={post.authorFigureString} headOnly className="hidden shrink-0 xs:block" />
    {/if}

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

            <!-- The counters bar. A signed-out visitor still reads every number — the two
                 reaction controls are buttons only for someone who could act on them, rather than
                 controls that look live and answer 401. -->
            <div class="flex items-baseline gap-6 border-t border-rule pt-3 text-sm">
                <span><b>{post.commentCount}</b> {t('SITE_FEED_COMMENTS')}</span>

                <button
                    type="button"
                    onclick={() => react(FEED_REACTION.REPOST, !post.repostedByMe)}
                    disabled={reacting || !$signedIn}
                    class="ml-auto disabled:cursor-default {post.repostedByMe ? 'text-ink' : ''}"
                    aria-pressed={post.repostedByMe}
                >
                    <b>{post.repostCount}</b> {t('SITE_FEED_REPOSTS')}
                </button>

                <button
                    type="button"
                    onclick={() => react(FEED_REACTION.FAVORITE, !post.favoritedByMe)}
                    disabled={reacting || !$signedIn}
                    class="disabled:cursor-default {post.favoritedByMe ? 'text-ink' : ''}"
                    aria-pressed={post.favoritedByMe}
                >
                    <b>{post.favoriteCount}</b> {t('SITE_FEED_FAVORITES')}
                </button>
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

        <!-- The card carries the three most recent; the rest arrive with the whole post, so
             expanding is one read and not a second paged endpoint. -->
        {#if !comment && post.commentCount > (post.comments?.length ?? 0)}
            <button type="button" onclick={expand} disabled={expanding} class="mt-3 pl-6 text-sm underline">
                {t('SITE_FEED_SEE_ALL_COMMENTS', {count: String(post.commentCount)})}
            </button>
        {/if}

        {#if !comment && $signedIn}
            <div class="mt-3 pl-6">
                <FeedComposer parentId={post.id} onpublished={added} />
            </div>
        {/if}
    </div>
</article>
