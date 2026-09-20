<script lang="ts">
    // `common/columns/columns-channel/columns-channel.html` and `.../columns-profile/…`, which are
    // the same grid of `<habbo-card>` differing in ONE thing: the channel version transcludes a
    // `<habbo-avatar class="card__creator">` into each card and the profile version does not — on a
    // profile every photo has the same owner, so a head on each card says nothing.
    //
    // THE CREATOR STRIP IS BELOW THE PHOTO, not over it. `card.html` is
    //
    //   <div class="card">
    //     <div class="card__content">   the photo, cropped, with .card__meta over its bottom
    //     <div ng-transclude>           ← the creator, OUTSIDE card__content
    //
    // and this port had the head floating inside the frame. `.card__creator` is its own band:
    // `background:#0d73ad; border-top:1px solid #2685bc; padding:6px 12px`, with a 46px disc at
    // `left:12px; top:12px` and the name beside it.
    //
    //   .columns__column   100% → 50% at 532 → 33% at 767 → 25% at 1199
    //   .card              max-width 282px, border 3px #2685bc, background #0b6395,
    //                      box-shadow 0 1px 2px rgba(0,0,0,.3), centred in its column
    //   .card__content     height 276px, position:relative — the frame the image is cropped to
    //   .card__meta        absolute at the bottom, rgba(0,0,0,.5), 14px, 6px of padding
    //   .card__date        line-height 24px, on the left
    //   .card__like        absolute at bottom:6px; right:6px
    //
    // The image is 320x320 and the frame is 282x276, so it is CROPPED rather than scaled, and
    // `.card__image--photo` lifts it 22px so the crop favours the middle of a room shot over its
    // floor. habbo.com centres it with the float/right:50% + left:50% pair that predates transforms;
    // this does the same thing with one translate, which is the only place here that is not the
    // sheet's own declaration.
    //
    // The card LINKS to the photo's own page — `habbo-creation-href`, whose state is
    // `/profile/:name/photo/:creationId`. Its `?pool` says which feed the arrows walk; this port
    // carries it too, because a photo opened from the gallery must page through the gallery and one
    // opened from a profile through that profile.
    import {link} from 'svelte-spa-router';
    import Avatar from './Avatar.svelte';
    import PhotoLike from './PhotoLike.svelte';
    import {photoUrl} from '../lib/api.js';
    import type {IPhotoSummary} from '../lib/api.js';
    import {intlLocale} from '../lib/i18n.js';

    let {photos = $bindable([]), creator = false, pool = ''}:
    {
        photos?: IPhotoSummary[];
        creator?: boolean;
        /** Which feed the photo page's arrows walk — habbo.com's own `?pool`. */
        pool?: string;
    } = $props();

    // `{{:: item.time | date: 'shortDate'}}` — the short one, not the long one the news feed uses.
    function taken(iso: string): string
    {
        return new Date(iso).toLocaleDateString(intlLocale(), {day: '2-digit', month: '2-digit', year: 'numeric'});
    }

    function href(photo: IPhotoSummary): string
    {
        return `/profile/${encodeURIComponent(photo.ownerName)}/photo/${encodeURIComponent(photo.key)}`
            + (pool ? `?pool=${encodeURIComponent(pool)}` : '');
    }

    /** The server answers the whole photo, so the card re-renders off it rather than counting. */
    function liked(updated: IPhotoSummary): void
    {
        photos = photos.map((photo) => (photo.key === updated.key ? updated : photo));
    }
</script>

<div class="flex flex-wrap">
    {#each photos as photo (photo.key)}
        <div class="w-full p-3 xs:w-1/2 md:w-1/3 xl:w-1/4">
            <div class="mx-auto block max-w-[282px] border-[3px] border-[#2685bc] bg-[#0b6395] shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                <div class="relative h-[276px] overflow-hidden">
                    <a href={href(photo)} use:link class="block h-full hover:border-b-0">
                        <img src={photoUrl(photo.key)} width="320" height="320" loading="lazy"
                             alt={photo.roomName ?? ''}
                             class="absolute left-1/2 max-w-none -translate-x-1/2 -translate-y-[22px]" />
                    </a>

                    <div class="absolute bottom-0 left-0 w-full bg-black/50 p-1.5 text-sm text-white [text-shadow:0_1px_rgba(0,0,0,0.3)]">
                        <time class="leading-6">{taken(photo.takenAt)}</time>

                        <span class="absolute right-1.5 bottom-1.5">
                            <PhotoLike {photo} onChange={liked} />
                        </span>
                    </div>
                </div>

                {#if creator}
                    <!-- `.card__creator`: its own band under the frame, with the 46px disc at
                         left 12 / top 12 and `.avatar__title` beside it. -->
                    <a href="/profile/{photo.ownerName}" use:link
                       class="flex items-center gap-3 border-t border-[#2685bc] bg-[#0d73ad] px-3 py-3 hover:border-b-0">
                        <Avatar user={photo.ownerName} well={46} />
                        <h6 class="m-0 truncate">{photo.ownerName}</h6>
                    </a>
                {/if}
            </div>
        </div>
    {/each}
</div>
