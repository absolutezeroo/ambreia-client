<script lang="ts">
    // `common/empty-results/empty-results.html` — habbo.com's "nothing here", and it is not a line
    // of centred text:
    //
    //   habbo-empty-results        { display:flex; align-items:center; justify-content:center;
    //                                min-height:89px }
    //   habbo-empty-results::after { content:url(teaser_frank_unsure.png); width:64px;
    //                                padding-left:12px }
    //
    // Frank shrugging beside the sentence IS the state. The sentence on its own reads as a page
    // that failed to load rather than one that is legitimately empty, which is what this port was
    // rendering everywhere it had no data.
    import {t} from '../lib/i18n.js';

    // The template's own default: `EmptyResultsController.translationKey || 'EMPTY_RESULTS_TEXT'`.
    let {key = 'EMPTY_RESULTS_TEXT', className = ''}: {key?: string; className?: string} = $props();

    const FRANK = new URL('../assets/teaser_frank_unsure.png', import.meta.url).href;
</script>

<div class="flex min-h-[89px] items-center justify-center {className}">
    <span>{t(key)}</span>
    <img src={FRANK} alt="" class="ml-3 w-16" />
</div>
