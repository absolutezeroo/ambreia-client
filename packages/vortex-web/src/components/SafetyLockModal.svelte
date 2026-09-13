<script lang="ts">
    // `settings/account-security/safety-lock-disable-modal/…`. Both of habbo.com's account-security
    // actions are MODALS — the page itself never grows a form:
    //
    //   <button class="modal__close">  <h3 class="modal__title" translate="ACCOUNT_SECURITY_DISABLE">
    //   <div class="modal__content">
    //     <form class="form">
    //       <p translate="ACCOUNT_SECURITY_DISABLE_CONFIRMATION">
    //       <habbo-password-current>   the CURRENT_PASSWORD_LABEL fieldset with the eye
    //       <habbo-captcha>
    //       <div class="form__footer">
    //         <a class="form__cancel" translate="FORM_CANCEL_LABEL">
    //         <button class="form__submit" translate="OK_BUTTON">
    //
    // One component for both directions, and the reason is worth stating: habbo.com's TWO modals
    // are `safety-questions-modal` (turning it on) and `safety-lock-disable-modal` (turning it off),
    // and they differ only because the first one asks for two security questions. This hotel's lock
    // is gated on the password in both directions — see `IAccountSafetyLockService` — so the two
    // collapse into the shell habbo.com uses for the second, which asks for the current password and
    // nothing else. Its title and its first paragraph still come from whichever direction is being
    // taken.
    //
    // The captcha is deliberately absent: this hotel configures no provider, and the endpoint is
    // rate-limited. The MFA field is an ADDITION — `SetAsync` verifies the second factor as well as
    // the password, and it appears only when the server asks for it.
    import Modal from './Modal.svelte';
    import Fieldset from './Fieldset.svelte';
    import PasswordField from './PasswordField.svelte';
    import Field from './Field.svelte';
    import FormError from './FormError.svelte';
    import * as api from '../lib/api.js';
    import * as notifier from '../lib/notifier.js';
    import {t} from '../lib/i18n.js';

    let {locked, onClose, onDone}:
    {
        /** The state the account is in NOW, so this dialog is the one that turns it around. */
        locked: boolean;
        onClose: () => void;
        onDone: (now: boolean) => void;
    } = $props();

    let password = $state('');
    let code = $state('');
    let needsCode = $state(false);
    let error = $state('');
    let busy = $state(false);

    async function apply(event: SubmitEvent): Promise<void>
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
            const status = await api.setSafetyLock(!locked, password, code.trim() || undefined);

            onDone(status.locked);

            // habbo.com's own pair, one key per direction: "Le verrouillage de sécurité de ton
            // compte est maintenant activé / désactivé".
            notifier.success(status.locked ? 'ACCOUNT_SECURITY_SAVED_OK' : 'ACCOUNT_SECURITY_DISABLED_OK');
        }
        catch(failure)
        {
            // Not a refusal: the server is asking for the second factor, so the field appears and
            // the visitor posts again.
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

<!-- Turning it off is `ACCOUNT_SECURITY_DISABLE`; turning it on is the page's own title, which is
     what `safety-questions-modal` carries. -->
<Modal title={locked ? t('ACCOUNT_SECURITY_DISABLE') : t('ACCOUNT_SECURITY_TITLE')} {onClose}>
    <!-- `.modal__content`: the 280px column, 24px down from the band and 110px clear of the bottom. -->
    <form class="mx-auto mt-6 mb-12 w-full max-w-[280px] px-3" onsubmit={apply}>
        <p class="mt-0">
            {locked
                ? t('ACCOUNT_SECURITY_DISABLE_CONFIRMATION')
                : t('ACCOUNT_SECURITY_PASSWORD_DESCRIPTION')}
        </p>

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
