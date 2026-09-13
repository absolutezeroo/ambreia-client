<script lang="ts">
    // One toast. toastr builds this markup and habbo.css styles it:
    //
    //   .toast          display:table; margin:0 auto 12px; max-width:620px; padding:12px 12px 16px;
    //                   border-radius:5px; cursor:pointer; pointer-events:all
    //   .toast::before  the white 50px disc, left:12 top:0 (+ the shared `margin-top:12px`)
    //   .toast::after   the mark inside it — the tick at margin-left:14, the cross at 12
    //   .toast-message  display:table-cell; height:50px; vertical-align:middle; padding:0 24 0 74
    //   .toast-progress a 4px bar along the bottom edge, animated from full width down to nothing
    //
    //   .toast-sticky .toast          display:block; cursor:initial   (and no tap-to-dismiss)
    //   .toast-sticky .toast-message  display:block; height:100%
    //   .toast-title                  32px, uppercase — ONLY ever on a sticky toast
    //
    // The 50px disc is the same device as `habbo-message-container`'s, and the same two sprite cuts
    // go in it. That is not a coincidence to collapse: a toast draws its own, because the disc is
    // pinned to the toast's top-left and the container's to the section's.
    //
    // The clock and the bar are one thing, which is what toastr's `stickAround` / `delayedHideToast`
    // pair does: hovering stops both, and leaving restarts both with `extendedTimeOut` — one second,
    // not the twenty that were left. Keeping the bar in CSS and the timer in JS would drift.
    import {onMount} from 'svelte';
    import {fade} from 'svelte/transition';
    import Sprite from './Sprite.svelte';
    import {dismiss, FADE_DURATION} from '../lib/notifier.js';
    import type {IToast} from '../lib/notifier.js';
    import {t} from '../lib/i18n.js';

    let {toast}: {toast: IToast} = $props();

    /** Set by `start()` below, which the mount effect calls with the toast's own `timeOut`. */
    let duration = $state(0);
    /** Bumped to restart the bar: an `animation-duration` change alone does not replay it. */
    let run = $state(0);
    let timer: ReturnType<typeof setTimeout> | null = null;

    function stop(): void
    {
        if(timer)
        {
            clearTimeout(timer);
            timer = null;
        }
    }

    function start(ms: number): void
    {
        stop();

        // A sticky toast has `timeOut: 0` AND `extendedTimeOut: 0`, so it never gets a clock from
        // either end.
        if(!ms)
        {
            duration = 0;

            return;
        }

        duration = ms;
        run++;
        timer = setTimeout(() => dismiss(toast.id), ms);
    }

    // `onMount`, not `$effect`. The clock is started ONCE, and `start()` does `run++` — an effect
    // that reads and writes the same state re-runs itself, which is exactly what happened: the
    // first toast raised took the whole page down with `effect_update_depth_exceeded`. Nothing here
    // is derived from anything: a toast's `timeOut` is fixed the moment it is created.
    onMount(() =>
    {
        start(toast.timeOut);

        return stop;
    });
</script>

<!-- `tapToDismiss` is toastr's default and habbo.com only turns it off for the sticky variant, so
     an ordinary toast is dismissed by clicking anywhere on it. `role="alert"` is what makes a
     screen reader announce a card that appeared with no interaction; toastr sets it too.

     The three listeners below are on a non-interactive element on purpose, and it costs a keyboard
     user nothing: the click is a SHORTCUT past a card that clears itself in twenty seconds, and the
     strip is `pointer-events: none`, so nothing behind it is blocked for the keyboard in the first
     place. The sticky variant, which never clears itself, is the one that has a real button. A
     `tabindex` here would put every passing notification into the tab order to buy that shortcut
     back, which is the worse trade. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div role="alert"
     class="group pointer-events-auto relative mx-auto mb-3 max-w-[620px] overflow-hidden rounded-[5px] px-3 pt-3 pb-4 shadow-card hover:shadow-toast-hover
            {toast.type === 'success' ? 'bg-success' : 'bg-error'}
            {toast.sticky ? 'block cursor-auto' : 'table cursor-pointer'}"
     onmouseenter={stop}
     onmouseleave={() => start(toast.extendedTimeOut)}
     onclick={() => !toast.sticky && dismiss(toast.id)}
     transition:fade={{duration: FADE_DURATION}}>
    <!-- `::before`: `top:0` plus the `.toast::after,.toast::before{margin-top:12px}` both share. -->
    <span class="absolute top-3 left-3 h-[50px] w-[50px] rounded-full bg-white shadow-btn"></span>
    <!-- `::after`: `top:11.5px` + the same 12, and a `margin-left` that centres each cut in the
         disc — 14 for the 22px tick, 12 for the 25px cross. -->
    <span class="absolute block" style="top:23.5px;left:{toast.type === 'success' ? 26 : 24}px">
        <Sprite name={toast.type === 'success' ? 'statusCheck' : 'statusCross'} />
    </span>

    {#if toast.title}
        <h3 class="mt-0 mb-[0.6em] pr-6 pl-[74px] text-[32px] leading-[1.2]">{toast.title}</h3>
    {/if}

    <!-- `{@html}` for a translated key, plain text for a raw server message — the same split
         habbo.com makes by escaping only the latter. `EMAIL_CHANGE_SUCCESS` carries a `<b>` and
         would otherwise print its own tags. -->
    <div class="pr-6 pl-[74px] text-white {toast.sticky ? 'block h-full' : 'table-cell h-[50px] align-middle'}">
        {#if toast.html}{@html toast.message}{:else}{toast.message}{/if}
    </div>

    {#if toast.sticky}
        <!-- `.toast-button`: the site's one LIGHT button — #efefef on #999 with dark text — because
             it sits on crimson and a blue one would disappear into it. habbo.com appends it to the
             message as an HTML string and delegates the click; here it is an element. -->
        <button type="button" onclick={() => dismiss(toast.id)}
                class="mx-auto my-3 block rounded-[5px] border-2 border-[#999] bg-[#efefef] px-6 py-3 text-center font-condensed text-base leading-[1.2] uppercase text-[#333] shadow-btn hover:border-b-2 hover:border-[#ccc] hover:bg-white active:translate-y-[2px] active:border-[#666] active:bg-[#999] active:shadow-btn-active">
            {t('OK_BUTTON')}
        </button>
    {/if}

    {#if duration}
        {#key run}
            <div class="absolute bottom-0 left-0 w-0 rounded-bl-[4px] border-t-4 border-b-4 border-t-transparent border-b-black/30 group-hover:[animation-play-state:paused]"
                 style="animation:toast-progress {duration}ms linear forwards"></div>
        {/key}
    {/if}
</div>
