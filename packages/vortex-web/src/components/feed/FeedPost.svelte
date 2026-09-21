<script lang="ts">
    // One card in the feed. It renders a comment too — a comment IS a post with a parent, so the
    // component recurses rather than existing twice.
    //
    // The screenshot's card is a `.aside--box` with its title bled into a darker band across the
    // top, which is exactly what `Panel` does, so the header is Panel's own title band and not a
    // second implementation of it.
    import Panel from '../Panel.svelte';
    import Avatar from '../Avatar.svelte';
    import Sprite from '../Sprite.svelte';
    import FeedBody from './FeedBody.svelte';
    // `<svelte:self>` is deprecated in this version (svelte_self_deprecated) — a component imports
    // itself by name instead.
    import FeedPost from './FeedPost.svelte';
    import FeedPoll from './FeedPoll.svelte';
    // FeedComposer imports FeedPost's sibling and FeedPost imports FeedComposer — a cycle Vite
    // resolves because neither reads the other at module scope. Keep both imports inside the
    // component and nothing at the top level of either module.
    import FeedComposer from './FeedComposer.svelte';
    import {
        FEED_KIND,
        FEED_REACTION,
        getPost,
        remove,
        setReaction,
        type IFeedPost,
    } from '../../lib/feed.js';
    import {photoUrl} from '../../lib/api.js';
    import {groupBadgeUrl, hideOnError} from '../../lib/config.js';
    import {t} from '../../lib/i18n.js';
    import {signedIn} from '../../lib/session.js';
    import * as notifier from '../../lib/notifier.js';

    // `post` is bindable because voting, reacting and commenting all answer with the WHOLE post as
    // it now stands, and the card's job is then to show that answer rather than to adjust a count
    // by hand. Writing back through the binding keeps the page's array the single copy — the
    // alternative, a local override, would quietly win over a later refetch.
    // `ondeleted` rather than writing through the binding: removing a card means splicing the
    // array it lives in, and a bound prop can replace its own element but not take it out.
    // `comment` is the second level, `reply` the third. The server allows exactly these: a post,
    // its comments, and replies to those comments — a reply to a reply is refused, so a reply
    // draws no thread of its own.
    let {
        post = $bindable(),
        comment = false,
        reply = false,
        ondeleted = undefined,
    }: {
        post: IFeedPost;
        comment?: boolean;
        reply?: boolean;
        ondeleted?: (() => void) | undefined;
    } = $props();

    // "PRODIIGY published 2 new pictures" / "posted a new poll" / "updated his/her status" — the
    // screenshot's three headings, one per kind.
    let heading = $derived(
        post.kind === FEED_KIND.PHOTO
            ? t('SITE_FEED_PUBLISHED_PICTURES', {count: String(post.photos?.length ?? 0)})
            : post.kind === FEED_KIND.POLL
              ? t('SITE_FEED_POSTED_POLL')
              : t('SITE_FEED_UPDATED_STATUS'),
    );

    // Drawn for this bar, because habbo.com's sprite sheet has nothing that means "repost".
    const ICON_SHARE = new URL('../../assets/icon_share.png', import.meta.url).href;

    let reacting = $state(false);
    let expanding = $state(false);

    // Which of the post's photos is the big one, and whether it is open full-screen.
    let shown = $state(0);
    let lightbox = $state(false);

    // The comments are FOLDED by default. A feed where every card carries three comments plus a
    // form is unreadable at a glance — the counter is the affordance, and opening is one click.
    let open = $state(false);

    let dialog = $state<HTMLDialogElement | null>(null);

    async function toggle()
    {
        open = !open;

        // Opening pulls the whole thread if the card is only carrying its preview. Done here
        // rather than on mount because a folded card should cost nothing: the feed's own read
        // already brought three, and the rest are only worth a round trip once somebody looks.
        if(open && post.commentCount > (post.comments?.length ?? 0))
        {
            await expand();
        }
    }

    // `<dialog>` is opened imperatively or not at all. Using the element rather than a div of our
    // own buys Escape, the backdrop and the focus trap without writing any of the three.
    $effect(() =>
    {
        if(!dialog)
        {
            return;
        }

        if(lightbox && !dialog.open)
        {
            dialog.showModal();
        }
        else if(!lightbox && dialog.open)
        {
            dialog.close();
        }
    });

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

    let deleting = $state(false);

    async function destroy()
    {
        // A native confirm rather than a modal of our own: deleting takes the post's comments with
        // it, including other people's, and that is worth one deliberate click. `confirm` is the
        // browser's, so it is accessible and dismissible without us building either.
        if(deleting || !confirm(t('SITE_FEED_DELETE_CONFIRM')))
        {
            return;
        }

        deleting = true;

        try
        {
            await remove(post.id);
            ondeleted?.();
        }
        catch(failure)
        {
            notifier.error((failure as Error).message);
        }
        finally
        {
            deleting = false;
        }
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

<!-- One reaction, built the way `PhotoLike.svelte` builds the site's like: the LABEL SWAPS on
     state ("Partages" ↔ "Ne plus partager", as habbo.com's own control swaps LIKE ↔ UNLIKE), the
     count sits beside it, and a signed-out visitor reads the number as plain text rather than
     pressing a control that always answers 401.

     The favourite's icon is `like`, the THUMB — the one `PhotoLike` already uses and the hotel's
     established mark for this. It was a `heart` for a while, which was in the sprite sheet but
     nowhere in the site: picked because it was available rather than because anything used it.

     The repost's comes from `src/assets/`, drawn for this bar, because habbo.com's sheet has
     nothing that means it. So the two icons here have two different sources — one a sprite-sheet
     cut, one a file — and the branch below is that, not an accident. -->
{#snippet glyph(icon: 'like' | 'share' | null)}
    {#if icon === 'like'}
        <Sprite name="like" />
    {:else if icon === 'share'}
        <img src={ICON_SHARE} alt="" class="block" />
    {/if}
{/snippet}

{#snippet reaction(kind: number, mine: boolean, count: number, key: string, icon: 'like' | 'share' | null)}
    {#if $signedIn}
        <button
            type="button"
            onclick={() => react(kind, !mine)}
            disabled={reacting}
            aria-pressed={mine}
            class="inline-flex items-center gap-1.5 leading-6 disabled:cursor-default {mine ? 'text-ink' : 'hover:text-nav-link-hover'}"
        >
            <span><b>{count}</b> {t(key)}</span>
            {@render glyph(icon)}
        </button>
    {:else}
        <span class="inline-flex items-center gap-1.5 leading-6">
            <span><b>{count}</b> {t(key)}</span>
            {@render glyph(icon)}
        </span>
    {/if}
{/snippet}

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
            class="hidden shrink-0 self-start xs:block"
        />
    {:else}
        <!-- `well`, not a bare `headOnly` image. Without it `Avatar` renders an `<img>` with no
             width or height, and a flex row stretches it to the row's own height — which is why a
             tall card (a poll, a long thread) drew a grotesque elongated head while a short one
             looked almost right. `well` is the site's own circular head badge and carries explicit
             dimensions; 46 and 60 are the two sizes the rest of the site uses. -->
        <Avatar
            user={post.authorName}
            figure={post.authorFigureString}
            well={comment ? 46 : 60}
            className="hidden self-start xs:block"
        />
    {/if}

    <div class="min-w-0 flex-1">
        <Panel title="{post.groupName ?? post.authorName}  {heading}" className={comment ? 'bg-panel-head' : ''}>
            <p class="mb-3"><FeedBody body={post.body} /></p>

            <!-- One photo shown big, the others as thumbnails under it — not a grid of equals.
                 A grid of four halves every picture to fit the card; a gallery shows the one being
                 looked at at full width and keeps the rest one click away. With a single photo
                 there are no thumbnails to draw at all. -->
            {#if post.kind === FEED_KIND.PHOTO && post.photos?.length}
                <div class="mb-3">
                    <button type="button" onclick={() => (lightbox = true)} class="block w-full">
                        <img
                            src={photoUrl(post.photos[shown]?.key ?? post.photos[0].key)}
                            alt=""
                            class="w-full"
                            loading="lazy"
                        />
                    </button>

                    {#if post.photos.length > 1}
                        <div class="mt-1 flex gap-1">
                            {#each post.photos as photo, i (photo.key)}
                                <button
                                    type="button"
                                    onclick={() => (shown = i)}
                                    aria-label={t('SITE_FEED_PHOTO_N', {n: String(i + 1)})}
                                    aria-current={i === shown}
                                    class="w-16 border-2 {i === shown ? 'border-ink' : 'border-transparent'}"
                                >
                                    <img src={photoUrl(photo.key)} alt="" class="w-full" loading="lazy" />
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

            {#if post.kind === FEED_KIND.POLL}
                <FeedPoll {post} onvoted={(updated) => (post = updated)} />
            {/if}

            <!-- The counters bar. A signed-out visitor still reads every number — the two
                 reaction controls are buttons only for someone who could act on them, rather than
                 controls that look live and answer 401. -->
            <div class="flex items-baseline gap-6 border-t border-rule pt-3 text-sm">
                <!-- The counter IS the control that folds the thread open, on a comment as well as
                     on a post: a reply is written under the comment it answers, so the comment
                     needs the same affordance. A signed-out visitor can still open and read. -->
                <button
                    type="button"
                    onclick={toggle}
                    class="{open ? 'text-ink' : ''}"
                    aria-expanded={open}
                >
                    <b>{post.commentCount}</b> {t('SITE_FEED_COMMENTS')}
                </button>

                <span class="ml-auto">
                    {@render reaction(
                        FEED_REACTION.REPOST,
                        post.repostedByMe,
                        post.repostCount,
                        post.repostedByMe ? 'SITE_FEED_UNREPOST' : 'SITE_FEED_REPOSTS',
                        'share',
                    )}
                </span>

                <!-- habbo.com's OWN keys, not ours: `LIKE` and `UNLIKE` already say "J'aime" and
                     "Je n'aime plus" in all nine languages, and `PhotoLike` already swaps between
                     them. This read "Favoris" for a while, which was a word this hotel uses
                     nowhere — invented beside a dictionary that already had the right one.

                     The server still calls the row a `Favorite`; only the wording is the site's.
                     Renaming the enum would be a rename across both repos for no behaviour, so it
                     is left, and this comment is the bridge. -->
                {@render reaction(
                    FEED_REACTION.FAVORITE,
                    post.favoritedByMe,
                    post.favoriteCount,
                    post.favoritedByMe ? 'UNLIKE' : 'LIKE',
                    'like',
                )}

                {#if post.mine}
                    <button type="button" onclick={destroy} disabled={deleting} class="underline">
                        {t('SITE_FEED_DELETE')}
                    </button>
                {/if}
            </div>
        </Panel>

        <!-- Everything below is behind `open`. Folded is the default: the counter says how many
             there are, and a click brings the thread and its form.

             `reply` marks the third level — a reply has no thread of its own, so it gets no
             counter to open and no form under it. That is the depth bound the server enforces,
             drawn. -->
        {#if open && !reply}
            <!-- Bound like the page binds its own cards, and for the same reason: a comment may
                 itself be a poll — its form has the same three tabs — so a vote inside one has to
                 write back somewhere rather than be lost on the next render. -->
            {#if post.comments?.length}
                <div class="mt-3 flex flex-col gap-3 pl-6">
                    {#each post.comments as child, i (child.id)}
                        <FeedPost
                            bind:post={post.comments[i]}
                            comment
                            reply={comment}
                            ondeleted={() => (post = {
                                ...post,
                                comments: (post.comments ?? []).filter((c) => c.id !== child.id),
                                commentCount: Math.max(0, post.commentCount - 1),
                            })}
                        />
                    {/each}
                </div>
            {/if}

            <!-- The card carries the three most recent; the rest arrive with the whole post, so
                 expanding is one read and not a second paged endpoint. -->
            {#if post.commentCount > (post.comments?.length ?? 0)}
                <button type="button" onclick={expand} disabled={expanding} class="mt-3 pl-6 text-sm underline">
                    {t('SITE_FEED_SEE_ALL_COMMENTS', {count: String(post.commentCount)})}
                </button>
            {/if}

            {#if $signedIn}
                <div class="mt-3 pl-6">
                    <FeedComposer parentId={post.id} onpublished={added} />
                </div>
            {/if}
        {/if}
    </div>
</article>

<!-- The viewer. A native `<dialog>`, so Escape, the backdrop and the focus trap come from the
     browser rather than from us; `onclose` keeps the flag honest when the browser closes it.
     `m-auto` because Tailwind's preflight strips the margin a modal dialog is centred by — without
     it the panel sits wherever the default box lands, which is the top-left corner.

     The row inside is `PhotoPage`'s own: two 69px arrow columns in `bg-box` around the picture,
     the `arrowPrev`/`arrowNext` sprites, and a dead arrow left at `opacity-20` rather than removed
     so the frame keeps its shape on the first and last photo. -->
{#if post.kind === FEED_KIND.PHOTO && post.photos?.length}
    <dialog
        bind:this={dialog}
        onclose={() => (lightbox = false)}
        class="m-auto max-h-[90vh] max-w-[90vw] bg-transparent p-0 backdrop:bg-black/80"
    >
        <div class="flex items-stretch">
            <button
                type="button"
                onclick={() => (shown = Math.max(0, shown - 1))}
                aria-label={t('SITE_PHOTO_PREVIOUS')}
                class="flex w-[69px] items-center justify-center bg-box hover:bg-[#0d2f4f] {shown > 0 ? '' : 'pointer-events-none opacity-20'}"
            >
                <Sprite name="arrowPrev" />
            </button>

            <img
                src={photoUrl(post.photos[shown]?.key ?? post.photos[0].key)}
                alt=""
                class="block max-h-[80vh] max-w-full"
            />

            <button
                type="button"
                onclick={() => (shown = Math.min(post.photos.length - 1, shown + 1))}
                aria-label={t('SITE_PHOTO_NEXT')}
                class="flex w-[69px] items-center justify-center bg-box hover:bg-[#0d2f4f] {shown < post.photos.length - 1 ? '' : 'pointer-events-none opacity-20'}"
            >
                <Sprite name="arrowNext" />
            </button>
        </div>

        <!-- Thumbnails only when there is something to choose between, and centred under the
             picture rather than under the whole frame including the arrow columns. -->
        {#if post.photos.length > 1}
            <div class="flex justify-center gap-1 bg-box px-[69px] py-2">
                {#each post.photos as photo, i (photo.key)}
                    <button
                        type="button"
                        onclick={() => (shown = i)}
                        aria-label={t('SITE_FEED_PHOTO_N', {n: String(i + 1)})}
                        aria-current={i === shown}
                        class="w-16 border-2 {i === shown ? 'border-ink' : 'border-transparent'}"
                    >
                        <img src={photoUrl(photo.key)} alt="" class="block w-full" />
                    </button>
                {/each}
            </div>
        {/if}
    </dialog>
{/if}
