<script lang="ts">
    // `common/form/password-new/password-new.html` — habbo.com's "choose a password" block, which
    // is ONE component used by its registration page and its password-change page. This port had it
    // written out twice, and the two copies had already drifted apart.
    //
    // It is TWO fieldsets, not one, and they are joined into what reads as a single box:
    //
    //   .form__fieldset--box                   { background:#103960; border-radius:3px; padding:12px }
    //   .form__fieldset--box-top               { border-bottom-*-radius: 0 }
    //   .form__fieldset--box-bottom            { border-top-*-radius: 0 }
    //   .form__fieldset--box + .form__fieldset--box { margin-top: -23px }
    //
    // The base `.form__fieldset` carries `margin: 12px 0`, so -23px against that bottom margin
    // leaves an 11px OVERLAP: the two halves close over each other, the flattened corners meet, and
    // with the same background it is one box with a seam. That is not decoration — it is what puts
    // the repeat field inside the same panel as the new one while keeping them separate fieldsets,
    // each with its own field and its own message.
    //
    // THE STRENGTH METER IS IN A POPOVER, and that is the whole height difference against this
    // port. `.form__popover`:
    //
    //   below 767   position:relative; margin-top:12px; padding:12px      (in flow, under the field)
    //   from 767    position:absolute; left:100%; margin-left:24px;
    //               top:-6px; width:calc(100% + 12px)                     (out to the RIGHT of it)
    //
    // and it is rendered only once the field has been touched — `ng-if="(invalid && (!pristine ||
    // submitted)) || (!pristine && valid)"`. So on a desktop it costs the form NO height at all,
    // where this port had the meter permanently in the flow of the box. It takes the crimson
    // `--error` background only when the field is actually invalid; a valid password shows the meter
    // on nothing, which is why `FormError` (which is always `--error`) is used for the repeat
    // field's mismatch but not here.
    import PasswordField from './PasswordField.svelte';
    import PasswordStrength from './PasswordStrength.svelte';
    import FormError from './FormError.svelte';
    import {t} from '../lib/i18n.js';

    let {
        password = $bindable(''),
        repeat = $bindable(''),
        problem = null,
        mismatch = false,
        help = '',
        isNew = true,
    }: {
        password?: string;
        repeat?: string;
        /** The field's own message, already worded — `null` while the password is acceptable. */
        problem?: string | null;
        mismatch?: boolean;
        help?: string;
        /** habbo.com's own switch: `NEW_PASSWORD_LABEL` when true, `PASSWORD_LABEL` when not. */
        isNew?: boolean;
    } = $props();

    // `$pristine` in habbo.com's terms: a field nobody has typed in shows nothing at all.
    const touched = $derived(password.length > 0);

    // `.form__popover`, without the `--error` half. The `md:` set is the sheet's 767px branch.
    const POPOVER = 'relative mt-3 p-3 text-white'
        + ' md:absolute md:top-[-6px] md:left-full md:z-[3] md:mt-0 md:ml-6 md:w-[calc(100%+12px)]';

    // `.form__popover--error` and its upward triangle, which the 767px branch hides — the same
    // rules `FormError` already carries, minus its own positioning, because this popover is the
    // plain one when the password is merely weak rather than refused.
    const POPOVER_ERROR = 'rounded-[3px] bg-error drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]'
        + ' before:absolute before:top-[-8px] before:left-3 before:block before:border-x-8'
        + ' before:border-b-8 before:border-x-transparent before:border-b-error'
        + ' before:content-[\'\'] md:before:hidden';
</script>

<!-- `.form__fieldset .form__fieldset--box .form__fieldset--box-top` -->
<fieldset class="my-3 rounded-[3px] rounded-b-none bg-box p-3">
    <label class="block text-white" for="password-new">
        {t(isNew ? 'NEW_PASSWORD_LABEL' : 'PASSWORD_LABEL')}
    </label>

    <!-- habbo.com's own line here is `PASSWORD_CHANGE_HELP`, and it is unusable on this hotel in
         every language: it names SIX characters and the server refuses under eight. The caller
         passes `SITE_PASSWORD_HELP` instead, which takes the floor as a value rather than spelling
         a number into prose. -->
    {#if help}
        <p class="mt-3">{help}</p>
    {/if}

    <!-- `.form__field { position: relative }` — what the popover is positioned against. -->
    <div class="relative mt-3">
        <PasswordField name="password-new" bind:value={password} autocomplete="new-password"
                       invalid={problem !== null} />

        {#if touched}
            <div class="{POPOVER} {problem !== null ? POPOVER_ERROR : ''}">
                <PasswordStrength password={password}>
                    {#if problem !== null}{problem}{/if}
                </PasswordStrength>
            </div>
        {/if}
    </div>
</fieldset>

<!-- `.form__fieldset--box-bottom`, pulled up by the sheet's own -23px so the two close over each
     other. Its top corners are square where the box above has square bottom ones. -->
<fieldset class="my-3 -mt-[23px] rounded-[3px] rounded-t-none bg-box p-3">
    <label class="block text-white" for="password-repeat">{t('PASSWORD_REPEAT_LABEL')}</label>

    <div class="relative mt-3">
        <PasswordField name="password-repeat" bind:value={repeat} autocomplete="new-password"
                       invalid={mismatch} />

        {#if mismatch}
            <FormError>{t('ERROR_PASSWORDS_NOT_MATCHING')}</FormError>
        {/if}
    </div>
</fieldset>
