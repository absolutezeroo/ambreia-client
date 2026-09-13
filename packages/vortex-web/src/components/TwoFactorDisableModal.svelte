<script lang="ts">
    // `settings/two-factor-auth/disable/two-factor-auth-disable-modal.html` and the
    // `two-factor-auth-disable.html` it wraps. Turning the second factor off is a MODAL too:
    //
    //   <h3 class="modal__title" translate="TWO_FACTOR_AUTHENTICATION_DISABLE_TITLE">
    //   <div class="two-factor-auth__description"><p translate="…_DISABLE_DESCRIPTION">
    //   [EMAIL method: the address, and a SEND CODE button]
    //   <form><div class="form__footer">
    //     <p translate="…_ENTER_AUTH_CODE">   <habbo-two-factor-code>
    //     <button class="…__auth-button">DISABLE   <button class="…__cancel-button">CANCEL
    //
    // The DISABLE button in here is the GREEN `two-factor-auth__auth-button`, not the red
    // `two-factor-auth__disable-button` — the red one is on the settings page, and it is the one
    // that opens this dialog. The confirmation is an ordinary submit.
    //
    // The e-mail branch is absent by capability, not by omission: `AccountMfaService` stores one
    // TOTP secret and has no second method, so `twoFactorMethod` is always AUTHENTICATOR here and
    // habbo.com's own `ng-if` would hide every e-mail element anyway.
    import Modal from './Modal.svelte';
    import TwoFactorCode from './TwoFactorCode.svelte';
    import * as api from '../lib/api.js';
    import {ApiError} from '../lib/api.js';
    import * as notifier from '../lib/notifier.js';
    import {t} from '../lib/i18n.js';

    let {onClose, onDone}: {onClose: () => void; onDone: () => void} = $props();

    let code = $state('');
    let busy = $state(false);

    async function disable(event: Event): Promise<void>
    {
        event.preventDefault();

        if(busy || code.length !== 6)
        {
            return;
        }

        busy = true;

        try
        {
            await api.disableTwoFactor(code);

            // `disableTwoFactorAuth()`'s own pair: close, then say it through the notifier. The
            // success key is `TWO_FACTOR_AUTHENTICATION_DISABLED`, the same string the ON/OFF box
            // uses as a heading — habbo.com reuses it here rather than wording a second one.
            onDone();
            notifier.success('TWO_FACTOR_AUTHENTICATION_DISABLED');
        }
        catch(failure)
        {
            notifier.error(failure instanceof ApiError && failure.code === 'pocket.auth.invalid_code'
                ? 'TWO_FACTOR_AUTHENTICATION_INCORRECT_CODE'
                : 'TWO_FACTOR_AUTH_REGISTRATION_ERROR');
        }
        finally
        {
            busy = false;
        }
    }
</script>

<Modal title={t('TWO_FACTOR_AUTHENTICATION_DISABLE_TITLE')} {onClose}>
    <div class="px-3 pt-3 pb-6">
        <div class="m-[10px]">
            <p class="m-0">{t('TWO_FACTOR_AUTHENTICATION_DISABLE_DESCRIPTION')}</p>
        </div>

        <form onsubmit={disable}>
            <div class="relative mt-6 after:table after:clear-both after:content-['']">
                <div class="flex justify-center">
                    <p class="m-0">{t('TWO_FACTOR_AUTHENTICATION_ENTER_AUTH_CODE')}</p>
                </div>
                <div class="flex justify-center">
                    <TwoFactorCode bind:value={code} />
                </div>

                <div class="relative mt-6 after:table after:clear-both after:content-['']">
                    <button type="submit" disabled={busy || code.length !== 6}
                            class="float-right m-1.5 w-1/4 rounded-[5px] border-2 border-play-line bg-play px-0 py-3 text-center font-condensed text-base leading-[1.2] uppercase text-white shadow-btn hover:border-b-2 hover:border-play-line-hover hover:bg-play-hover active:translate-y-[2px] active:border-play-line-active active:bg-play-active active:shadow-btn-active disabled:border-play-line-active disabled:bg-play-active disabled:opacity-40 md:px-6">
                        {t('TWO_FACTOR_AUTHENTICATION_DISABLE')}
                    </button>
                    <button type="button" onclick={onClose}
                            class="float-right m-1.5 w-1/4 rounded-[5px] border-2 border-btn-line bg-btn px-0 py-3 text-center font-condensed text-base leading-[1.2] uppercase text-white shadow-btn hover:border-b-2 hover:border-btn-line-hover hover:bg-btn-hover active:translate-y-[2px] active:border-btn-line-active active:bg-btn-active active:shadow-btn-active md:px-6">
                        {t('TWO_FACTOR_AUTHENTICATION_CANCEL_BUTTON')}
                    </button>
                </div>
            </div>
        </form>
    </div>
</Modal>
