<script lang="ts">
    // The composer, and the comment form: the screenshot shows the same control in both places,
    // with the same three tabs, so it is one component with a `parentId`.
    //
    // The poll tab arrives in Task 7; the tab strip already has both of its siblings because moving
    // a working form into a tab later is how a working form stops working.
    import Panel from '../Panel.svelte';
    import Avatar from '../Avatar.svelte';
    import Button from '../Button.svelte';
    import Sprite from '../Sprite.svelte';
    import {publish, createAlbum, getPost, FEED_KIND, type IFeedPost} from '../../lib/feed.js';
    import {getMyPhotos, getProfile, photoUrl, type IPhotoSummary} from '../../lib/api.js';
    import * as notifier from '../../lib/notifier.js';
    import {t} from '../../lib/i18n.js';
    import {me} from '../../lib/session.js';

    let {parentId = undefined, onpublished}: {parentId?: number; onpublished: (post: IFeedPost) => void} =
        $props();

    let body = $state('');
    let busy = $state(false);
    let kind = $state<number>(FEED_KIND.STATUS);
    let mine = $state<IPhotoSummary[]>([]);
    let chosen = $state<string[]>([]);
    let groups = $state<{id: number; name: string}[]>([]);
    let groupId = $state<number | undefined>(undefined);

    // Distinguishes "no photos" from "not fetched yet". Without it the empty state renders for as
    // long as the request takes, so a player WITH photos is told they have none and then watches
    // it contradict itself.
    let photosLoaded = $state(false);

    // Two empty boxes to start: the minimum a poll can have, so the form shows what it needs
    // rather than an "add a choice" button over nothing.
    let choices = $state(['', '']);

    let identityOpen = $state(false);

    // The screenshot's three, in its order, and the album after them. A list rather than
    // hand-written buttons so the markup below cannot drift from it — the poll tab was missing for
    // exactly that reason once. No album on a comment: an album is a card of its own.
    let tabs = $derived([
        {kind: FEED_KIND.STATUS, key: 'SITE_FEED_TAB_STATUS'},
        {kind: FEED_KIND.PHOTO, key: 'SITE_FEED_TAB_PHOTOS'},
        {kind: FEED_KIND.POLL, key: 'SITE_FEED_TAB_POLL'},
        ...(parentId ? [] : [{kind: FEED_KIND.ALBUM, key: 'SITE_FEED_TAB_ALBUM'}]),
    ]);

    // The album's name; its description is the textarea every tab shares.
    let title = $state('');

    // The server's caps: four photos on a post, a hundred in an album (WebApiAlbumService).
    let photoCap = $derived(kind === FEED_KIND.ALBUM ? 100 : 4);
    let picking = $derived(kind === FEED_KIND.PHOTO || kind === FEED_KIND.ALBUM);

    // Two 1:1 pixel icons that say which kind of author a row is — a person or a guild. They are
    // different sizes on purpose (18x18 and 13x11) and are NOT stretched to match: each sits at
    // its own size inside a fixed 18px slot, so the labels line up while neither icon is
    // resampled. Scaling either would blur it, and a blurred 13px icon is worse than an
    // off-centre one.
    const ICON_USER = new URL('../../assets/icon_user.png', import.meta.url).href;
    const ICON_GROUP = new URL('../../assets/icon_group.png', import.meta.url).href;

    // Me first, then the groups — one list so the menu, the pill and the icon all read off the
    // same thing and cannot disagree about what is selected.
    let identities = $derived([
        {
            id: undefined as number | undefined,
            name: t(parentId ? 'SITE_FEED_WRITE_AS_ME' : 'SITE_FEED_POST_AS_ME', {
                name: $me?.name ?? '',
            }),
            icon: ICON_USER,
        },
        ...groups.map((g) => ({id: g.id as number | undefined, name: g.name, icon: ICON_GROUP})),
    ]);

    // `identity`, not `chosen`: that name is already the list of picked photo keys above.
    let identity = $derived(identities.find((i) => i.id === groupId) ?? identities[0]);

    // Loaded when the tab is first opened rather than on mount: most posts are statuses, and a
    // player with three hundred photos should not pay for them to write one line.
    //
    // getMyPhotos(), not getPlayerPhotos($me.uniqueId): the picker needs the caller's OWN photos,
    // and this hotel's profiles are private by default — the public per-player route would answer
    // an empty list for exactly the player it exists to help. See `GET /api/user/photos`.
    $effect(() =>
    {
        if(!picking || photosLoaded || !$me?.uniqueId)
        {
            return;
        }

        let cancelled = false;

        // `photosLoaded` rather than `mine.length` as the already-fetched guard: a player who
        // genuinely has none would otherwise refetch on every visit to the tab, and the empty
        // state could never be told apart from a request in flight.
        void getMyPhotos()
            .then((answer) => !cancelled && (mine = answer))
            .catch(() => undefined)
            .finally(() => !cancelled && (photosLoaded = true));

        return () => (cancelled = true);
    });

    // The groups come off my own profile rather than a route of their own: the profile read
    // already returns them, and the server re-checks membership on publish anyway — this list is
    // display, not authorisation.
    //
    // A COMMENT gets the menu too. The screenshot this feature is built from captions the comment
    // form `WRITE AS PRODIIGY ▾`, with the same control as the post form above it — a reply under a
    // group's identity is a thing the design offers, and `PublishAsync` validates `GroupId` the
    // same way whether or not `ParentId` is set.
    $effect(() =>
    {
        if(!$me?.uniqueId)
        {
            return;
        }

        let cancelled = false;

        void getProfile($me.uniqueId)
            .then((profile) => !cancelled && (groups = (profile.groups ?? []).map((g) => ({id: g.id, name: g.name}))))
            .catch(() => undefined);

        return () => (cancelled = true);
    });

    function toggle(key: string)
    {
        chosen = chosen.includes(key)
            ? chosen.filter((k) => k !== key)
            // The server's cap; refusing one more here rather than letting the request fail is
            // the difference between a disabled thumbnail and a red toast.
            : chosen.length < photoCap
              ? [...chosen, key]
              : chosen;
    }

    // What the server will accept, computed once so the button's disabled state and the submit
    // guard can never disagree — two copies of this rule drifting is how a form ends up with a
    // live button that always fails.
    let filledChoices = $derived(choices.map((c) => c.trim()).filter((c) => c.length > 0));

    let ready = $derived(
        kind === FEED_KIND.ALBUM
            ? Boolean(title.trim()) && chosen.length > 0
            : kind === FEED_KIND.PHOTO
            ? chosen.length > 0
            // A poll needs its question AND at least two answers; the server refuses either way,
            // and `PollInvalid` is a worse way to learn it than a disabled button.
            : kind === FEED_KIND.POLL
              ? Boolean(body.trim()) && filledChoices.length >= 2
              : Boolean(body.trim()),
    );

    async function submit()
    {
        if(busy || !ready)
        {
            return;
        }

        busy = true;

        try
        {
            if(kind === FEED_KIND.ALBUM)
            {
                // The album route answers the album; the feed wants its card, which is one read.
                const album = await createAlbum({title, description: body, photoKeys: chosen});

                onpublished(await getPost(album.feedPostId));
            }
            else
            {
                onpublished(await publish({
                    kind,
                    body,
                    parentId,
                    photoKeys: kind === FEED_KIND.PHOTO ? chosen : undefined,
                    pollChoices: kind === FEED_KIND.POLL ? filledChoices : undefined,
                    groupId,
                }));
            }

            body = '';
            title = '';
            chosen = [];
            choices = ['', ''];
        }
        catch(failure)
        {
            notifier.error((failure as Error).message);
        }
        finally
        {
            busy = false;
        }
    }
</script>

<!-- Closes on a click anywhere else, like `UserMenu` does. `event.target` is only an Element when
     the click landed on one — a click on a text node has no `closest` and would throw, and a
     TypeError in a window listener takes down the only thing that closes the menu. -->
<svelte:window onclick={(event) =>
{
    const target = event.target instanceof Element ? event.target : null;

    if(identityOpen && !target?.closest('[data-identity-menu]'))
    {
        identityOpen = false;
    }
}} />

<!-- `POST AS PRODIIGY ▾` on a post, `WRITE AS PRODIIGY ▾` on a comment — the screenshot's own two
     captions, over the same control. A player in no group has nothing to choose between, so the
     band falls back to the plain caption rather than showing a menu of one. -->
{#snippet identityTitle()}
    {#if groups.length}
        <!-- The site's own dropdown vocabulary, not a native `<select>`: the browser's listbox is
             a white system panel dropped into a dark blue card, and it looked exactly as foreign
             as it was. Borrowed from `UserMenu.svelte` — the `bg-pill` pastille with its 2px line
             and `shadow-pill`, the `caret` sprite that turns on open, and the `bg-black/90`
             rounded panel underneath. Not extracted into a shared component: the user menu's
             geometry is very particular (70px of header clearance, a pinned avatar) and only the
             look is shared. -->
        <span class="relative inline-block align-middle" data-identity-menu>
            <button
                type="button"
                onclick={() => (identityOpen = !identityOpen)}
                aria-expanded={identityOpen}
                class="relative flex items-center gap-2 rounded-[3px] border-2 border-pill-line bg-pill py-[3px] pr-3 pl-8 font-condensed text-sm leading-[18px] text-white shadow-pill"
            >
                <Sprite
                    name="caret"
                    className="absolute left-2 top-1/2 -translate-y-1/2 transition-transform duration-300 {identityOpen ? 'rotate-180' : ''}"
                />
                <!-- The icon is on the PILL too, not only in the open menu: which identity is
                     armed has to be readable without opening anything, because it is what the
                     next post will be signed with. -->
                <img src={identity.icon} alt="" class="block shrink-0" />
                {identity.name}
            </button>

            <!-- Opens DOWNWARD into the card's own body. `Panel` is `overflow-hidden`, so a panel
                 that escaped the card upward would be clipped; there is always room below,
                 because the form is under it. -->
            <span
                class="absolute top-full left-0 z-30 mt-1 block min-w-full overflow-hidden rounded-[10px] bg-black/90 transition-[max-height,opacity] duration-200 ease-out"
                style="max-height:{identityOpen ? '240px' : '0'};opacity:{identityOpen ? 1 : 0}"
            >
                <span class="block py-2">
                    <!-- `option`, not `identity`: `identity` is the derived one on the pill, and a
                         loop variable of the same name would shadow it here. It happens to work —
                         both mean the right thing in their own scope — which is exactly why it
                         would not survive the next edit. -->
                    {#each identities as option (option.id ?? 0)}
                        <button
                            type="button"
                            onclick={() => {
                                groupId = option.id;
                                identityOpen = false;
                            }}
                            class="flex w-full items-center gap-2 px-4 py-1.5 text-left font-condensed text-sm leading-[22px] whitespace-nowrap {groupId === option.id ? 'text-nav-link-active' : 'text-white hover:text-nav-link-hover'}"
                        >
                            <!-- A fixed slot with the icon centred in it, rather than a fixed
                                 icon SIZE: the three glyphs share a height of 18 but not a width
                                 (user 18, guild 21, share 22), and stretching them to match would
                                 blur pixel art to buy an alignment the slot gives for free. 22 is
                                 the widest of them. -->
                            <span class="flex w-[22px] shrink-0 justify-center">
                                <img src={option.icon} alt="" class="block" />
                            </span>
                            {option.name}
                        </button>
                    {/each}
                </span>
            </span>
        </span>
    {:else}
        {t(parentId ? 'SITE_FEED_WRITE_AS' : 'SITE_FEED_POST_AS')}
    {/if}
{/snippet}

<Panel titleSnippet={identityTitle}>
    <div class="flex gap-3">
        <!-- `well` for the same reason as FeedPost's: a bare `headOnly` image has no dimensions
             and a flex row stretches it to the row's height, which grows with the tab that is
             open. -->
        <Avatar
            user={$me?.name ?? ''}
            figure={$me?.figureString ?? ''}
            well={parentId ? 46 : 60}
            className="hidden self-start xs:block"
        />

        <div class="min-w-0 flex-1">
            <!-- A real tab strip, in the site's own tab vocabulary rather than three words with
                 gaps between them: condensed and uppercase like `Tabs.svelte`, the active one in
                 `text-nav-link-active` over a 2px underline that sits ON the rule, the rest muted
                 with the same hover. The rule under the row is what makes it read as tabs at all —
                 without it there is nothing for the active one to be attached to. -->
            <div class="mb-3 flex gap-6 border-b border-rule">
                {#each tabs as tab (tab.kind)}
                    <button
                        type="button"
                        onclick={() => (kind = tab.kind)}
                        aria-current={kind === tab.kind}
                        class="-mb-px border-b-2 pb-1.5 font-condensed text-sm leading-[22px] uppercase {kind === tab.kind
                            ? 'border-nav-link-active text-nav-link-active'
                            : 'border-transparent text-white hover:text-nav-link-hover'}"
                    >
                        {t(tab.key)}
                    </button>
                {/each}
            </div>

            {#if kind === FEED_KIND.ALBUM}
                <input
                    bind:value={title}
                    maxlength="60"
                    placeholder={t('SITE_ALBUM_TITLE_PLACEHOLDER')}
                    aria-label={t('SITE_ALBUM_TITLE_PLACEHOLDER')}
                    class="mb-2 w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field placeholder:text-[#888] focus:border-field-line-focus focus:bg-white focus:outline-none"
                />
            {/if}

            <textarea
                bind:value={body}
                maxlength="500"
                rows="3"
                placeholder={t(kind === FEED_KIND.ALBUM
                    ? 'SITE_ALBUM_DESCRIPTION_PLACEHOLDER'
                    : parentId ? 'SITE_FEED_COMMENT_PLACEHOLDER' : 'SITE_FEED_POST_PLACEHOLDER')}
                class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field placeholder:text-[#888] focus:border-field-line-focus focus:bg-white focus:outline-none"
            ></textarea>

            {#if picking}
                <div class="mt-2 grid grid-cols-4 gap-1">
                    {#each mine as photo (photo.key)}
                        <button
                            type="button"
                            onclick={() => toggle(photo.key)}
                            class="border-2 {chosen.includes(photo.key) ? 'border-ink' : 'border-transparent'}"
                        >
                            <img src={photoUrl(photo.key)} alt="" class="w-full" loading="lazy" />
                        </button>
                    {/each}

                    {#if photosLoaded && !mine.length}
                        <p class="col-span-4 text-sm">{t('SITE_FEED_NO_PHOTOS')}</p>
                    {/if}
                </div>
            {/if}

            <!-- The textarea above is the poll's QUESTION here — the screenshot's card shows the
                 question as the post's own text with the choices under it, so the poll tab adds
                 boxes rather than replacing the field. -->
            {#if kind === FEED_KIND.POLL}
                <div class="mt-2 flex flex-col gap-1">
                    {#each choices as _, i (i)}
                        <input
                            bind:value={choices[i]}
                            maxlength="80"
                            placeholder={t('SITE_FEED_POLL_CHOICE')}
                            class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field placeholder:text-[#888] focus:border-field-line-focus focus:bg-white focus:outline-none"
                        />
                    {/each}

                    <!-- Five is the server's cap. Same reasoning as the photo picker: a button
                         that vanishes beats a refusal the player has to read. -->
                    {#if choices.length < 5}
                        <button type="button" onclick={() => (choices = [...choices, ''])} class="self-start text-sm underline">
                            {t('SITE_FEED_POLL_ADD_CHOICE')}
                        </button>
                    {/if}
                </div>
            {/if}

            <div class="mt-2 flex justify-end">
                <Button onclick={submit} disabled={busy || !ready}>
                    {t(parentId ? 'SITE_FEED_PUBLISH_COMMENT' : 'SITE_FEED_PUBLISH')}
                </Button>
            </div>
        </div>
    </div>
</Panel>
