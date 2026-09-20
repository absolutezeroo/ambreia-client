<script lang="ts">
    // `common/columns/columns-channel/columns-channel.html` and `.../columns-profile/…`, which are
    // the same grid of `<habbo-card>` differing in ONE thing: the channel version transcludes a
    // `<habbo-avatar class="card__creator">` into each card and the profile version does not — on a
    // profile every photo has the same owner, so a head on each card says nothing.
    //
    //   .columns__column   100% → 50% at 532 → 33% at 767 → 25% at 1199
    //   .card              max-width 282px, border 3px #2685bc, background #0b6395,
    //                      box-shadow 0 1px 2px rgba(0,0,0,.3), centred in its column
    //   .card__content     height 276px, position:relative — the frame the image is cropped to
    //   .card__meta        absolute at the bottom, rgba(0,0,0,.5), 14px, 6px of padding
    //
    // The image is 320x320 and the frame is 282x276, so it is CROPPED rather than scaled, and
    // `.card__image--photo` lifts it 22px so the crop favours the middle of a room shot over its
    // floor. habbo.com centres it with the float/right:50% + left:50% pair that predates transforms;
    // this does the same thing with one translate, which is the only place here that is not the
    // sheet's own declaration.
    //
    // `habbo-like` sits at bottom-right of the meta on habbo.com. There is no like anywhere in this
    // hotel — no table, no endpoint, no packet — so the corner is left empty rather than filled with
    // a control that would count nothing.
    import {link} from 'svelte-spa-router';
    import Avatar from './Avatar.svelte';
    import {photoUrl} from '../lib/api.js';
    import type {IPhotoSummary} from '../lib/api.js';
    import {intlLocale} from '../lib/i18n.js';

    let {photos = [], creator = false}: {photos?: IPhotoSummary[]; creator?: boolean} = $props();

    // `{{:: item.time | date: 'shortDate'}}` — the short one, not the long one the news feed uses.
    function taken(iso: string): string
    {
        return new Date(iso).toLocaleDateString(intlLocale(), {day: 'numeric', month: 'numeric', year: 'numeric'});
    }
</script>

<div class="flex flex-wrap">
    {#each photos as photo (photo.key)}
        <div class="w-full xs:w-1/2 md:w-1/3 xl:w-1/4 p-3">
            <div class="mx-auto block max-w-[282px] border-[3px] border-[#2685bc] bg-[#0b6395] shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                <div class="relative h-[276px] overflow-hidden">
                    <!-- No link on the image: habbo.com's `habbo-creation-href` opens the photo's
                         own page, which carries the like, the report and the delete — none of which
                         this hotel has anything behind. A link to a page that cannot exist yet is
                         worse than no link. -->
                    <img src={photoUrl(photo.key)} width="320" height="320" loading="lazy"
                         alt={photo.roomName ?? ''}
                         class="absolute left-1/2 max-w-none -translate-x-1/2 -translate-y-[22px]" />

                    {#if creator}
                        <!-- `.card__creator`: the head over the top-left of the card, on its own
                             dark disc. It links to the profile, which is the one navigation a card
                             here can honour. -->
                        <a href="/profile/{photo.ownerName}" use:link
                           class="absolute top-0 left-0 block hover:border-b-0">
                            <Avatar user={photo.ownerName} well={46} />
                        </a>
                    {/if}

                    <div class="absolute bottom-0 left-0 w-full bg-black/50 p-1.5 text-sm text-white [text-shadow:0_1px_rgba(0,0,0,0.3)]">
                        {#if photo.roomName}
                            <h5 class="m-0 mb-1.5 truncate">{photo.roomName}</h5>
                        {/if}
                        <time class="leading-6">{taken(photo.takenAt)}</time>
                    </div>
                </div>
            </div>
        </div>
    {/each}
</div>
