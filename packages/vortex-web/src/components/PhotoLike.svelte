<script lang="ts">
    // `common/like/like.html` — the "J'aime <n>" line and the thumb beside it:
    //
    //   <div class="like__action"><a ng-click="myLike ? unlike() : like()">
    //       <span translate="{{ myLike ? 'UNLIKE' : 'LIKE' }}"></span>
    //       <span class="like__count">{{data.likes.length}}</span></a>
    //   <div class="like__thumb"><i class="like__icon icon icon--like">
    //
    //   .like__action { line-height: 24px }   .like__thumb { padding-left: 6px }
    //
    // The two keys are habbo.com's own, and they SWAP: a photo you have liked reads "Je n'aime
    // plus". That is the only state the control shows, which is why the server answers `likedByMe`
    // beside the count rather than leaving the page to remember.
    //
    // The THUMB opens the list of who liked it — `like__users`, which habbo.com shows on hover and
    // on a tap (`ng-mouseenter` and `ng-click` both), and closes on a click outside:
    //
    //   .like__users { position:absolute; bottom:100%; right:-9px; min-width:240px; z-index:400;
    //                  padding-bottom:14px; white-space:nowrap; color:#666; cursor:auto }
    //   its ul       { border:1px solid #acacac; box-shadow:0 1px 2px rgba(0,0,0,.3) }
    //   its li       { background:#fff; padding:0 6px; a 1px #acacac rule between rows }
    //   ::before/::after  a 14px/13px downward triangle at right:6px — the grey outline and the
    //                     white fill, which is how the bubble gets a bordered point
    //
    // The order is habbo.com's: MY like first when I am one of them, then the others, five rows in
    // all, then `MORE_LIKES` for the rest. The server names at most six and counts all of them, so
    // "…and N more" is computed from the count and not from the list — a photo with four hundred
    // likes is still one small answer.
    //
    // A signed-out visitor sees the count and no control: the server refuses the write anyway, and
    // a button that always fails is worse than none. The list is still theirs to open.
    import Sprite from './Sprite.svelte';
    import Avatar from './Avatar.svelte';
    import {link} from 'svelte-spa-router';
    import * as api from '../lib/api.js';
    import type {IPhotoSummary} from '../lib/api.js';
    import {signedIn, me} from '../lib/session.js';
    import * as notifier from '../lib/notifier.js';
    import {t} from '../lib/i18n.js';

    let {photo, onChange}: {photo: IPhotoSummary; onChange?: (updated: IPhotoSummary) => void} = $props();

    let busy = $state(false);
    let showing = $state(false);

    /** `myLike` first, then `othersLikes | limitTo: (myLike ? 4 : 5)` — five rows either way. */
    const ROWS = 5;

    const listed = $derived.by(() =>
    {
        const others = photo.likers.filter((name) => !photo.likedByMe || name !== $me?.name);

        return photo.likedByMe && $me?.name
            ? [$me.name, ...others].slice(0, ROWS)
            : others.slice(0, ROWS);
    });

    /** From the COUNT, not from the list: the server names at most six and counts them all. */
    const more = $derived(Math.max(0, photo.likes - listed.length));

    async function toggle(event: MouseEvent): Promise<void>
    {
        // The card is a link; the like sits inside its meta bar and must not navigate.
        event.preventDefault();
        event.stopPropagation();

        if(busy)
        {
            return;
        }

        busy = true;

        try
        {
            // The WANTED state, not a toggle the server has to interpret — so a retry after a
            // timeout lands where the visitor pressed rather than on the opposite.
            onChange?.(await api.setPhotoLike(photo.key, !photo.likedByMe));
        }
        catch
        {
            notifier.error('ERROR_SERVER');
        }
        finally
        {
            busy = false;
        }
    }
</script>

<!-- `habbo-false-on-outside-click`: the list closes on a click anywhere else. Registered on the
     window rather than on the thumb, because the click that must close it is by definition not on
     it. `defaultPrevented` is what lets the thumb's own click toggle instead of closing. -->
<svelte:window onclick={(event) =>
{
    const target = event.target instanceof Element ? event.target : null;

    if(showing && !target?.closest('[data-photo-like]'))
    {
        showing = false;
    }
}} />

<span class="relative flex items-center" data-photo-like>
    {#if $signedIn}
        <!-- `.like__action { line-height: 24px }` -->
        <a href="#like" onclick={toggle} class="leading-6 hover:border-b-0" aria-busy={busy}>
            {t(photo.likedByMe ? 'UNLIKE' : 'LIKE')}
            <span>{photo.likes}</span>
        </a>
    {:else}
        <span class="leading-6">{t('LIKE')} <span>{photo.likes}</span></span>
    {/if}

    <!-- `.like__thumb { padding-left: 6px }`. It opens the list on hover AND on click — a phone has
         no hover, and habbo.com binds both for that reason. -->
    <span class="relative block pl-1.5"
          role="button" tabindex="0"
          onmouseenter={() => (showing = photo.likes > 0)}
          onmouseleave={() => (showing = false)}
          onclick={(event) => { event.preventDefault(); showing = photo.likes > 0 && !showing; }}
          onkeydown={(event) => { if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showing = photo.likes > 0 && !showing; } }}>
        <Sprite name="like" />

        {#if showing && listed.length}
            <!-- `.like__users`: the bubble sits ABOVE the thumb (`bottom:100%`), overhangs it by 9px
                 on the right, and reserves 14px at its foot for the triangle that points down at it.
                 `cursor:auto` because it is a panel, not a control — see styles.css, where `a` and
                 `button` are pointers site-wide. -->
            <span class="absolute right-[-9px] bottom-full z-[400] block min-w-[240px] cursor-auto pb-[14px] text-base whitespace-nowrap text-[#666]
                         before:absolute before:top-full before:right-1.5 before:-mt-[15px] before:border-[14px] before:border-b-0 before:border-transparent before:border-t-[#acacac] before:content-['']
                         after:absolute after:top-full after:right-1.5 after:-mt-[15px] after:mr-px after:border-[13px] after:border-b-0 after:border-transparent after:border-t-white after:content-['']">
                <ul class="border border-[#acacac] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] [text-shadow:none]">
                    {#each listed as name (name)}
                        <li class="block bg-white px-1.5">
                            <a href="/profile/{name}" use:link
                               class="flex items-center gap-1.5 border-b border-[#acacac] py-1.5 text-[#666] last:border-b-0 hover:border-b hover:bg-[#f4f4f4]">
                                <Avatar user={name} well={46} />
                                <span>{name}</span>
                            </a>
                        </li>
                    {/each}
                </ul>

                {#if more}
                    <!-- `.like__more` is a <small> under the list, outside it. -->
                    <small class="block pt-1.5 text-white">{t('MORE_LIKES', {count: more})}</small>
                {/if}
            </span>
        {/if}
    </span>
</span>
