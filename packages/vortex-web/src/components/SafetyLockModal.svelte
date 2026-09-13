<script lang="ts">
    // `settings/account-security/safety-lock-disable-modal/…` — turning the protection OFF:
    //
    //   <h3 class="modal__title" translate="ACCOUNT_SECURITY_DISABLE">
    //   <div class="modal__content"><form class="form">
    //     <p translate="ACCOUNT_SECURITY_DISABLE_CONFIRMATION">
    //     <habbo-password-current>     the CURRENT_PASSWORD_LABEL fieldset with the eye
    //     <habbo-captcha>
    //     <div class="form__footer">
    //       <a class="form__cancel" translate="FORM_CANCEL_LABEL">
    //       <button class="form__submit" translate="OK_BUTTON">
    //
    // It asks for the password and NOT for the questions, which is the right way round: a player who
    // has forgotten their answers must still be able to switch the thing off, and a thief who has
    // the password already owns the account. The answers guard the challenge; the password guards
    // the recovery path itself.
    //
    // The captcha is deliberately absent: this hotel configures no provider, and the endpoint is
    // rate-limited on sign-in's own policy. The MFA field is an ADDITION — `ClearAsync` verifies the
    // second factor as well, and it appears only when the server asks for it.
    import Modal from './Modal.svelte';
    import Fieldset from './Fieldset.svelte';
    import PasswordField from './PasswordField.svelte';
    import Field from './Field.svelte';
    import FormError from './FormError.svelte';
    import * as api from '../lib/api.js';
    import * as notifier from '../lib/notifier.js';
    import {t} from '../lib/i18n.js';

    let {onClose, onDone}: {onClose: () => void; onDone: () => void} = $props();

    let password = $state('');
    let code = $state('');
    let needsCode = $state(false);
    let error = $state('');
    let busy = $state(false);

    async function disable(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();

        if(busy || !password)
        {
            return;
        }

        busy = true;
        error = '';

        try
        {
            await api.disableSafetyQuestions(password, code.trim() || undefined);

            onDone();
            notifier.success('ACCOUNT_SECURITY_DISABLED_OK');
        }
        catch(failure)
        {
            if(api.needsMfa(failure))
            {
                needsCode = true;
                error = '';
            }
            else
            {
                error = (failure as Error)?.message ?? '';
            }
        }
        finally
        {
            busy = false;
        }
    }
</script>

<Modal title={t('ACCOUNT_SECURITY_DISABLE')} {onClose}>
    <!-- `.modal__content`: the 280px column, 24px down from the band and 110px clear of the bottom. -->
    <form class="mx-auto mt-6 mb-12 w-full max-w-[280px] px-3" onsubmit={disable}>
        <p class="mt-0">{t('ACCOUNT_SECURITY_DISABLE_CONFIRMATION')}</p>

        <Fieldset>
            <PasswordField name="safety-password" label={t('CURRENT_PASSWORD_LABEL')} bind:value={password} />
        </Fieldset>

        {#if needsCode}
            <Fieldset>
                <Field name="safety-code" label={t('TWO_FACTOR_AUTHENTICATION_ENTER_AUTH_CODE')}
                       bind:value={code} autocomplete="one-time-code" maxlength={6} />
            </Fieldset>
        {/if}

        {#if error}
            <FormError inline>{error}</FormError>
        {/if}

        <!-- `.form__footer` is `position:relative` and holds two things: `.form__cancel`, an <a>
             pinned to its left edge and vertically centred, and `.form__submit`, floated right. -->
        <div class="relative mt-6 after:table after:clear-both after:content-['']">
            <a href={'#'} onclick={(event) => { event.preventDefault(); onClose(); }}
               class="absolute top-1/2 left-0 -mt-[0.5em] block leading-none text-white hover:border-b hover:border-solid">
                {t('FORM_CANCEL_LABEL')}
            </a>

            <button type="submit" disabled={busy || !password}
                    class="float-right mb-3 rounded-[5px] border-2 border-btn-line bg-btn px-6 py-3 text-center font-condensed text-base leading-[1.2] uppercase text-white shadow-btn hover:border-b-2 hover:border-btn-line-hover hover:bg-btn-hover active:translate-y-[2px] active:border-btn-line-active active:bg-btn-active active:shadow-btn-active disabled:opacity-40">
                {t('OK_BUTTON')}
            </button>
        </div>
    </form>
</Modal>
