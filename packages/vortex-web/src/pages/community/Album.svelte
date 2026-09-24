<script lang="ts">
    // `/community/albums/:id` — one photo album. Ours, not habbo.com's: the social feed's screenshot
    // shows a "create an album" control and nothing of what it leads to, so the page is the site's
    // own pieces — the photo grid the profile and the gallery use, and for the owner the composer's
    // picker, a rename form and the feed's own delete.
    //
    // No delete of its own: an album lives and dies with its feed card, so deleting it is
    // `remove(album.feedPostId)`, the second factor included.
    import {link, push} from 'svelte-spa-router';
    import CommunityShell from './CommunityShell.svelte';
    import PageHeader from '../../components/PageHeader.svelte';
    import PhotoColumns from '../../components/PhotoColumns.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import Button from '../../components/Button.svelte';
    import ConfirmModal from '../../components/ConfirmModal.svelte';
    import {
        getAlbum,
        editAlbum,
        addAlbumPhotos,
        removeAlbumPhoto,
        remove,
        type IAlbum,
    } from '../../lib/feed.js';
    import {getMyPhotos, photoUrl, type IPhotoSummary} from '../../lib/api.js';
    import * as notifier from '../../lib/notifier.js';
    import {t} from '../../lib/i18n.js';

    let {params = {}}: {params?: {id?: string}} = $props();

    let album = $state<IAlbum | null>(null);
    let photos = $state<IPhotoSummary[]>([]);
    let loading = $state(true);

    // The owner's controls, folded until asked for: most visitors only look.
    let managing = $state(false);
    let title = $state('');
    let description = $state('');
    let mine = $state<IPhotoSummary[]>([]);
    let chosen = $state<string[]>([]);
    let busy = $state(false);
    let confirming = $state(false);

    // My photos that are not in the album yet — what "add" can offer.
    let addable = $derived(mine.filter((p) => !photos.some((q) => q.key === p.key)));

    $effect(() =>
    {
        const id = Number(params.id);
        let cancelled = false;

        loading = true;

        void getAlbum(id)
            .then((answer) => !cancelled && show(answer))
            .catch(() => !cancelled && (album = null))
            .finally(() => !cancelled && (loading = false));

        return () => (cancelled = true);
    });

    function show(answer: IAlbum)
    {
        album = answer;
        photos = answer.photos ?? [];
        title = answer.title;
        description = answer.description;
    }

    async function manage()
    {
        managing = !managing;

        if(managing && !mine.length)
        {
            mine = await getMyPhotos().catch(() => []);
        }
    }

    /** Runs one owner write and shows the album it answers with. */
    async function write(action: () => Promise<IAlbum>)
    {
        if(busy)
        {
            return;
        }

        busy = true;

        try
        {
            show(await action());
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

    function toggle(key: string)
    {
        chosen = chosen.includes(key) ? chosen.filter((k) => k !== key) : [...chosen, key];
    }
</script>

<CommunityShell>
    {#if album}
        <PageHeader title={album.title} description={album.description}>
            <p class="mt-3 mb-0 text-sm">
                <a href="/profile/{album.ownerName}" use:link>{album.ownerName}</a>
                · {t('SITE_ALBUM_PHOTO_COUNT', {count: String(photos.length)})}
            </p>

            {#if album.mine}
                <div class="mt-3 flex gap-2">
                    <Button onclick={manage}>{t('SITE_ALBUM_MANAGE')}</Button>
                    <Button variant="red" onclick={() => (confirming = true)}>{t('SITE_FEED_DELETE')}</Button>
                </div>
            {/if}
        </PageHeader>

        <main class="mx-auto max-w-[1200px] px-3 py-6">
            {#if managing}
                <section class="mb-6 flex flex-col gap-3">
                    <input
                        bind:value={title}
                        maxlength="60"
                        aria-label={t('SITE_ALBUM_TITLE_PLACEHOLDER')}
                        class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field focus:border-field-line-focus focus:bg-white focus:outline-none"
                    />
                    <textarea
                        bind:value={description}
                        maxlength="500"
                        rows="2"
                        placeholder={t('SITE_ALBUM_DESCRIPTION_PLACEHOLDER')}
                        class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field placeholder:text-[#888] focus:border-field-line-focus focus:bg-white focus:outline-none"
                    ></textarea>
                    <div>
                        <Button
                            disabled={busy || !title.trim()}
                            onclick={() => write(() => editAlbum(album!.id, {title, description}))}
                        >
                            {t('SITE_ALBUM_SAVE')}
                        </Button>
                    </div>

                    <!-- Remove: the album's photos, each with its own button. -->
                    <h3 class="mb-0">{t('SITE_ALBUM_REMOVE_TITLE')}</h3>
                    <div class="grid grid-cols-4 gap-1 sm:grid-cols-8">
                        {#each photos as photo (photo.key)}
                            <button
                                type="button"
                                disabled={busy}
                                onclick={() => write(() => removeAlbumPhoto(album!.id, photo.key))}
                                aria-label={t('SITE_ALBUM_REMOVE')}
                                title={t('SITE_ALBUM_REMOVE')}
                                class="relative border-2 border-transparent hover:border-danger-line"
                            >
                                <img src={photoUrl(photo.key)} alt="" class="w-full" loading="lazy" />
                                <span class="absolute top-0 right-1 font-bold text-white">×</span>
                            </button>
                        {/each}
                    </div>

                    <!-- Add: my photos that are not in it yet, picked like the composer picks. -->
                    <h3 class="mb-0">{t('SITE_ALBUM_ADD_TITLE')}</h3>
                    {#if addable.length}
                        <div class="grid grid-cols-4 gap-1 sm:grid-cols-8">
                            {#each addable as photo (photo.key)}
                                <button
                                    type="button"
                                    onclick={() => toggle(photo.key)}
                                    class="border-2 {chosen.includes(photo.key) ? 'border-ink' : 'border-transparent'}"
                                >
                                    <img src={photoUrl(photo.key)} alt="" class="w-full" loading="lazy" />
                                </button>
                            {/each}
                        </div>
                        <div>
                            <Button
                                disabled={busy || !chosen.length}
                                onclick={() => write(() => addAlbumPhotos(album!.id, chosen))}
                            >
                                {t('SITE_ALBUM_ADD')}
                            </Button>
                        </div>
                    {:else}
                        <p class="m-0 text-sm">{t('SITE_FEED_NO_PHOTOS')}</p>
                    {/if}
                </section>
            {/if}

            <PhotoColumns bind:photos />
        </main>
    {:else if !loading}
        <EmptyResults className="py-12" />
    {/if}
</CommunityShell>

{#if confirming && album}
    <ConfirmModal
        title={t('SITE_FEED_DELETE')}
        confirm={(code) => remove(album!.feedPostId, code)}
        onClose={() => (confirming = false)}
        onDone={() => push('/community/chats')}
    >
        {t('SITE_ALBUM_DELETE_CONFIRM')}
    </ConfirmModal>
{/if}
