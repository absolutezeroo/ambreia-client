<script lang="ts">
    // The composer, and the comment form: the screenshot shows the same control in both places,
    // with the same three tabs, so it is one component with a `parentId`.
    //
    // The poll tab arrives in Task 7; the tab strip already has both of its siblings because moving
    // a working form into a tab later is how a working form stops working.
    import Panel from '../Panel.svelte';
    import Avatar from '../Avatar.svelte';
    import Button from '../Button.svelte';
    import {publish, FEED_KIND, type IFeedPost} from '../../lib/feed.js';
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

    // Loaded when the tab is first opened rather than on mount: most posts are statuses, and a
    // player with three hundred photos should not pay for them to write one line.
    //
    // getMyPhotos(), not getPlayerPhotos($me.uniqueId): the picker needs the caller's OWN photos,
    // and this hotel's profiles are private by default — the public per-player route would answer
    // an empty list for exactly the player it exists to help. See `GET /api/user/photos`.
    $effect(() =>
    {
        if(kind !== FEED_KIND.PHOTO || photosLoaded || !$me?.uniqueId)
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
            // Four is the server's cap; refusing the fifth here rather than letting the request
            // fail is the difference between a disabled thumbnail and a red toast.
            : chosen.length < 4
              ? [...chosen, key]
              : chosen;
    }

    // What the server will accept, computed once so the button's disabled state and the submit
    // guard can never disagree — two copies of this rule drifting is how a form ends up with a
    // live button that always fails.
    let filledChoices = $derived(choices.map((c) => c.trim()).filter((c) => c.length > 0));

    let ready = $derived(
        kind === FEED_KIND.PHOTO
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
            onpublished(await publish({
                kind,
                body,
                parentId,
                photoKeys: kind === FEED_KIND.PHOTO ? chosen : undefined,
                pollChoices: kind === FEED_KIND.POLL ? filledChoices : undefined,
                groupId,
            }));
            body = '';
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

<!-- `POST AS PRODIIGY ▾` on a post, `WRITE AS PRODIIGY ▾` on a comment — the screenshot's own two
     captions, over the same control. A player in no group has nothing to choose between, so the
     band falls back to the plain caption rather than showing a menu of one. -->
{#snippet identityTitle()}
    {#if groups.length}
        <select bind:value={groupId} class="bg-transparent text-sm">
            <option value={undefined}>
                {t(parentId ? 'SITE_FEED_WRITE_AS_ME' : 'SITE_FEED_POST_AS_ME', {name: $me?.name ?? ''})}
            </option>
            {#each groups as group (group.id)}
                <option value={group.id}>{group.name}</option>
            {/each}
        </select>
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
            <div class="mb-2 flex gap-4 text-sm">
                <button type="button" class:font-bold={kind === FEED_KIND.STATUS} onclick={() => (kind = FEED_KIND.STATUS)}>{t('SITE_FEED_TAB_STATUS')}</button>
                <button type="button" class:font-bold={kind === FEED_KIND.PHOTO} onclick={() => (kind = FEED_KIND.PHOTO)}>{t('SITE_FEED_TAB_PHOTOS')}</button>
                <button type="button" class:font-bold={kind === FEED_KIND.POLL} onclick={() => (kind = FEED_KIND.POLL)}>{t('SITE_FEED_TAB_POLL')}</button>
            </div>

            <textarea
                bind:value={body}
                maxlength="500"
                rows="3"
                placeholder={t(parentId ? 'SITE_FEED_COMMENT_PLACEHOLDER' : 'SITE_FEED_POST_PLACEHOLDER')}
                class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field placeholder:text-[#888] focus:border-field-line-focus focus:bg-white focus:outline-none"
            ></textarea>

            {#if kind === FEED_KIND.PHOTO}
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
