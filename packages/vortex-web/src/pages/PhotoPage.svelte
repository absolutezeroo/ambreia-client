<script lang="ts">
    // `/profile/:name/photo/:key` — habbo.com's own state, url and all:
    //
    //   e.statePublic("photo", { url: "/profile/:name/photo/:creationId?pool", … })
    //
    // rendering `profile/creation/creation.html` over `creation-content.html`:
    //
    //   .creation-content__view    a flex row: prev arrow, the picture, next arrow
    //   .creation-content__link    69px wide; #103960 from 532px; opacity 0 when there is nowhere
    //                              to go (.2 from 532, so the arrow stays as a hint)
    //   .creation-content__meta    the date, and the like pushed right by `margin-left:auto`
    //   .creation-content__actions the link back to the channel
    //
    // `?pool` is what the arrows walk, and it is not decoration: a photo opened from the gallery
    // must page through the gallery, and one opened from a profile through that profile. habbo.com
    // resolves it the same way — `Creations.photos({pool, name})` — before it knows which index the
    // photo is at.
    //
    // Two things on habbo.com's meta row are NOT here, and neither is an oversight:
    //
    //   <habbo-report>        `/private/creation/:id/report` on its side. This hotel's only report
    //                         route is `/api/user/reports`, which is a BUG report — a message, a
    //                         page and a console tail — and reporting a photo through it would file
    //                         a defect against the site.
    //   <habbo-photo-delete>  no route deletes a photo here. The owner deletes from the camera in
    //                         game, which is where the photo was taken.
    import {link, push} from 'svelte-spa-router';
    import Sprite from '../components/Sprite.svelte';
    import PhotoLike from '../components/PhotoLike.svelte';
    import EmptyResults from '../components/EmptyResults.svelte';
    import ProfileHeader from '../components/ProfileHeader.svelte';
    import * as api from '../lib/api.js';
    import type {IPhotoSummary} from '../lib/api.js';
    import {t, formatLongDate} from '../lib/i18n.js';

    let {params = {name: '', key: ''}} = $props();

    let photo = $state<IPhotoSummary | null>(null);
    let pool = $state<IPhotoSummary[]>([]);
    let loading = $state(true);

    /** habbo.com's `?pool`: `channel` walks the gallery, anything else walks the owner's photos. */
    const wantedPool = $derived(new URLSearchParams(window.location.search).get('pool') ?? '');

    const index = $derived(pool.findIndex((item) => item.key === params.key));
    const previous = $derived(index > 0 ? pool[index - 1] : null);
    const next = $derived(index >= 0 && index < pool.length - 1 ? pool[index + 1] : null);

    $effect(() =>
    {
        const key = params.key;
        const name = params.name;
        const channel = wantedPool === 'channel';
        let cancelled = false;

        loading = true;

        (async () =>
        {
            try
            {
                const found = await api.getPhoto(key);

                if(cancelled)
                {
                    return;
                }

                photo = found;

                // The pool is a SECOND read and the page does not wait on it: the picture is what
                // the visitor came for, and the arrows can appear a moment later. A pool that fails
                // leaves both arrows disabled, which is what a single-photo pool looks like anyway.
                const list = channel
                    ? (await api.getPhotos({pageSize: 60})).items ?? []
                    : await api.getPlayerPhotos(found.ownerUniqueId);

                if(!cancelled)
                {
                    pool = list;
                }
            }
            catch
            {
                if(!cancelled)
                {
                    photo = null;
                }
            }
            finally
            {
                if(!cancelled)
                {
                    loading = false;
                }
            }

            // `name` is in the url for habbo.com's own title and is not read otherwise; the photo
            // carries its owner.
            void name;
        })();

        return () => (cancelled = true);
    });

    function href(item: IPhotoSummary): string
    {
        return `/profile/${encodeURIComponent(item.ownerName)}/photo/${encodeURIComponent(item.key)}`
            + (wantedPool ? `?pool=${encodeURIComponent(wantedPool)}` : '');
    }

    function taken(iso: string): string
    {
        return formatLongDate(iso);
    }

    /** The server answers the whole photo, so the page re-renders off it rather than counting. */
    function liked(updated: IPhotoSummary): void
    {
        photo = updated;
        pool = pool.map((item) => (item.key === updated.key ? updated : item));
    }

    // `habbo-navigate-to-on-key`: the arrows are also the left and right keys.
    function onKey(event: KeyboardEvent): void
    {
        if(event.key === 'ArrowLeft' && previous)
        {
            void push(href(previous));
        }
        else if(event.key === 'ArrowRight' && next)
        {
            void push(href(next));
        }
    }
</script>

<svelte:window onkeydown={onKey} />

<!-- `creation.html`: `<habbo-profile-header user="creator_name">` — the profile page's band, in its
     large-head form, carrying `<h1><small class="creation__header-by" translate="BY"> <span>name`.
     The whole band links to the owner's profile, which is what the head and the plate do there.
     `.creation__header-by{font-size:20px}`, and the h1 keeps its case like the profile's. -->
{#if photo}
    <ProfileHeader name={photo.ownerName} figure={photo.ownerFigureString}>
        <h1 class="m-0 normal-case">
            <small class="text-xl">{t('BY')}</small>
            <span>{photo.ownerName}</span>
        </h1>
    </ProfileHeader>
{/if}

<main class="mx-auto max-w-[1200px] px-3 pb-6 text-center">
    {#if photo}

        <!-- `.creation-content { display:inline-block; margin: 0 69px from 532 }` — the margin is
             what the two 69px arrow columns hang in, via the expander's matching -69px. -->
        <section class="inline-block xs:mx-[69px]">
            <div class="text-left xs:-mx-[69px]">
                <div class="flex">
                    <!-- A dead arrow points at this photo, never at '#': the History-mode router
                         strips the '#', finds an empty path and throws, which is what every photo
                         page did while its pool loaded. The arrow is click-proof anyway. -->
                    <a href={href(previous ?? photo)} use:link
                       class="flex w-[69px] items-center justify-center hover:border-b-0 xs:bg-box xs:hover:bg-[#0d2f4f]
                              {previous ? '' : 'pointer-events-none opacity-0 xs:opacity-20'}"
                       aria-label={t('SITE_PHOTO_PREVIOUS')}>
                        <Sprite name="arrowPrev" />
                    </a>

                    <img src={api.photoUrl(photo.key)} alt={photo.roomName ?? ''}
                         width="320" height="320" class="block max-w-full" />

                    <a href={href(next ?? photo)} use:link
                       class="flex w-[69px] items-center justify-center hover:border-b-0 xs:bg-box xs:hover:bg-[#0d2f4f]
                              {next ? '' : 'pointer-events-none opacity-0 xs:opacity-20'}"
                       aria-label={t('SITE_PHOTO_NEXT')}>
                        <Sprite name="arrowNext" />
                    </a>
                </div>

                <!-- `.creation-content__meta`: a flex row with a 1px #0c3a65 rule under it and a
                     #2a9cde hairline 2px below that — the site's own two-tone separator. -->
                <div class="relative my-3 flex items-center border-b border-[#0c3a65] pb-3
                            after:absolute after:-bottom-[2px] after:left-0 after:block after:h-px after:w-full after:bg-[#2a9cde] after:content-['']">
                    <time>{taken(photo.takenAt)}</time>

                    <!-- `.creation-content__like { margin-left: auto }` -->
                    <span class="ml-auto"><PhotoLike {photo} onChange={liked} /></span>
                </div>

                <div class="flex">
                    <!-- `.creation-content__channel-link`: 20px condensed uppercase with the sheet's
                         own chevron pinned to its right by 29px of padding. -->
                    <a href="/community/photos" use:link
                       class="relative m-0 inline-block pr-[29px] font-condensed text-xl text-white uppercase hover:border-b-0">
                        {t('PHOTOS_TITLE')}
                        <Sprite name="more" className="absolute top-1/2 right-0 -translate-y-1/2" />
                    </a>
                </div>
            </div>
        </section>
    {:else if !loading}
        <EmptyResults className="py-12" />
    {/if}
</main>
