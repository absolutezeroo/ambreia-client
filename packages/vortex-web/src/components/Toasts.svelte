<script lang="ts">
    // `#toast-container.toast-top-center`, mounted once for the whole site:
    //
    //   .toast-top-center { position:fixed; left:12px; right:12px; top:12px;
    //                       width:calc(100% - 24px); z-index:1200; pointer-events:none }
    //
    // `pointer-events: none` on the strip and `all` on each card is the detail that makes it usable:
    // the container spans the full width across the top of every page, and without it the site's own
    // navigation would be unclickable under an invisible band.
    //
    // z-index 1200 puts it OVER the modals (1040/1050), which is deliberate — a dialog is where most
    // of these messages come from, and one that appeared behind it would never be read.
    import {toasts} from '../lib/notifier.js';
    import Toast from './Toast.svelte';
</script>

<div class="pointer-events-none fixed top-3 right-3 left-3 z-[1200]">
    {#each $toasts as toast (toast.id)}
        <Toast {toast} />
    {/each}
</div>
