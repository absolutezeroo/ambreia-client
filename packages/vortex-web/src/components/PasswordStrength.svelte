<script lang="ts">
    // `common/form/password-new/password-strength/password-strength.html`:
    //
    //   <div class="password-strength__label"><span>PASSWORD_STRENGTH_LABEL</span>
    //                                         <span>{{ score | strengthRating | ratingTranslation }}</span>
    //   <div class="password-strength__field">
    //     <div habbo-password-strength-indicator class="password-strength__indicator
    //                                                   password-strength__indicator--<rating>">
    //   <p ng-transclude class="password-strength__error">
    //
    //   .password-strength__field     { background:#fff; border:3px solid #fff; border-radius:5px }
    //   .password-strength__indicator { height:4px; border-radius:2px; width:0;
    //                                   transition: background-color .25s, width .5s }
    //   --fail #b00049  --poor #ff4086  --fair #ffde00  --ok #0efd00  --good #56af37
    //
    // The bar animates its WIDTH as well as its colour, which is what makes it read as a meter
    // rather than as a status light. The `<p>` below it is the transclusion slot habbo.com puts the
    // field's own error into, so the message and the meter share one block.
    import type {Snippet} from 'svelte';
    import {strengthRating, passwordScore} from '../lib/password.js';
    import {t} from '../lib/i18n.js';

    let {password = '', children}: {password?: string; children?: Snippet} = $props();

    const score = $derived(passwordScore(password));
    const rating = $derived(strengthRating(score));

    // The five ramps, in the sheet's own order. Width follows the score so the bar fills as the
    // password improves — 0 leaves it empty, which is why an untouched field shows nothing.
    const COLOURS: Record<string, string> = {
        FAIL: '#b00049',
        POOR: '#ff4086',
        FAIR: '#ffde00',
        OK: '#0efd00',
        GOOD: '#56af37',
    };
</script>

<div class="mt-3">
    <div class="mb-3 flex justify-between">
        <span>{t('PASSWORD_STRENGTH_LABEL')}</span>
        <span>{password ? t(`PASSWORD_STRENGTH_RATING_${rating}`) : ''}</span>
    </div>

    <div class="rounded-[5px] border-[3px] border-white bg-white">
        <div class="h-1 rounded-[2px] transition-[background-color,width] duration-500 ease-out"
             style="width:{password ? (score + 1) * 20 : 0}%;background-color:{COLOURS[rating]}"></div>
    </div>

    {#if children}
        <p class="mt-1.5">{@render children()}</p>
    {/if}
</div>
