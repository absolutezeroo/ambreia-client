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

    // Loaded when the tab is first opened rather than on mount: most posts are statuses, and a
    // player with three hundred photos should not pay for them to write one line.
    //
    // getMyPhotos(), not getPlayerPhotos($me.uniqueId): the picker needs the caller's OWN photos,
    // and this hotel's profiles are private by default — the public per-player route would answer
    // an empty list for exactly the player it exists to help. See `GET /api/user/photos`.
    $effect(() =>
    {
        if(kind !== FEED_KIND.PHOTO || mine.length || !$me?.uniqueId)
        {
            return;
        }

        let cancelled = false;

        void getMyPhotos()
            .then((answer) => !cancelled && (mine = answer))
            .catch(() => undefined);

        return () => (cancelled = true);
    });

    // The groups come off my own profile rather than a route of their own: the profile read
    // already returns them, and the server re-checks membership on publish anyway — this list is
    // display, not authorisation. Skipped entirely for a comment: `POST AS` is a root post's own
    // identity, and a reply's title never shows the select.
    $effect(() =>
    {
        if(parentId || !$me?.uniqueId)
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

    async function submit()
    {
        if(busy || (kind === FEED_KIND.PHOTO ? !chosen.length : !body.trim()))
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
                groupId,
            }));
            body = '';
            chosen = [];
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

{#snippet identityTitle()}
    {#if groups.length}
        <select bind:value={groupId} class="bg-transparent text-sm">
            <option value={undefined}>{t('SITE_FEED_POST_AS_ME', {name: $me?.name ?? ''})}</option>
            {#each groups as group (group.id)}
                <option value={group.id}>{group.name}</option>
            {/each}
        </select>
    {:else}
        {t('SITE_FEED_POST_AS')}
    {/if}
{/snippet}

<Panel title={parentId ? t('SITE_FEED_WRITE_AS') : ''} titleSnippet={parentId ? undefined : identityTitle}>
    <div class="flex gap-3">
        <Avatar user={$me?.name ?? ''} figure={$me?.figureString ?? ''} headOnly className="hidden shrink-0 xs:block" />

        <div class="min-w-0 flex-1">
            <div class="mb-2 flex gap-4 text-sm">
                <button type="button" class:font-bold={kind === FEED_KIND.STATUS} onclick={() => (kind = FEED_KIND.STATUS)}>{t('SITE_FEED_TAB_STATUS')}</button>
                <button type="button" class:font-bold={kind === FEED_KIND.PHOTO} onclick={() => (kind = FEED_KIND.PHOTO)}>{t('SITE_FEED_TAB_PHOTOS')}</button>
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

                    {#if !mine.length}
                        <p class="col-span-4 text-sm">{t('SITE_FEED_NO_PHOTOS')}</p>
                    {/if}
                </div>
            {/if}

            <div class="mt-2 flex justify-end">
                <Button onclick={submit} disabled={busy || (kind === FEED_KIND.PHOTO ? !chosen.length : !body.trim())}>
                    {t(parentId ? 'SITE_FEED_PUBLISH_COMMENT' : 'SITE_FEED_PUBLISH')}
                </Button>
            </div>
        </div>
    </div>
</Panel>
