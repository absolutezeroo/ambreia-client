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
    // habbo.com's thumb also opens a list of who liked it on hover. That is not ported: the API
    // answers a COUNT, deliberately — a list of names under every photo is a different privacy
    // question from a number, and nobody has asked it.
    //
    // A signed-out visitor sees the count and no control: the server refuses the write anyway, and
    // a button that always fails is worse than none.
    import Sprite from './Sprite.svelte';
    import * as api from '../lib/api.js';
    import type {IPhotoSummary} from '../lib/api.js';
    import {signedIn} from '../lib/session.js';
    import * as notifier from '../lib/notifier.js';
    import {t} from '../lib/i18n.js';

    let {photo, onChange}: {photo: IPhotoSummary; onChange?: (updated: IPhotoSummary) => void} = $props();

    let busy = $state(false);

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

<span class="flex items-center">
    {#if $signedIn}
        <a href="#like" onclick={toggle} class="leading-6 hover:border-b-0" aria-busy={busy}>
            {t(photo.likedByMe ? 'UNLIKE' : 'LIKE')}
            <span>{photo.likes}</span>
        </a>
    {:else}
        <span class="leading-6">{t('LIKE')} <span>{photo.likes}</span></span>
    {/if}

    <span class="block pl-1.5"><Sprite name="like" /></span>
</span>
