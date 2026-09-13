<script lang="ts">
    // `settings/two-factor-auth/register-authenticator/register-authenticator-modal.html` and the
    // `register-authenticator.html` it wraps. Enrolment on habbo.com is a MODAL — the settings page
    // never grows a form of its own — and the modal is the QR:
    //
    //   <button class="modal__close">  <h3 class="modal__title" translate="TWO_FACTOR_AUTHENTICATION_REGISTER">
    //   <div class="two-factor-auth__description"><p translate="…_APP_DESCRIPTION">
    //   <div class="two-factor-auth__register">        flex row, #103960, radius 3, padding 24/12
    //     <div>  STEP1 STEP2 STEP3 STEP4
    //     <img class="two-factor-auth__register__qr" ng-src="{{…qrCode}}">   150x150, margin 10
    //   <form><div class="form__footer">
    //     <p translate="…_ENTER_AUTH_CODE">  <habbo-two-factor-code>
    //     <button class="…__auth-button">REGISTER   <button class="…__cancel-button">CANCEL
    //
    // The root element is `class="modal__content.modal-lg"` — a literal class with a dot in it,
    // which matches nothing. That typo is load-bearing: `.modal__content` would clamp the body to
    // 280px, and the QR plus four steps side by side do not fit in 280px. So the body is full
    // width, as it renders on habbo.com.
    //
    // `startRegistration()` runs when the controller is constructed, so the secret is asked for as
    // the dialog opens rather than behind another click.
    import QRCode from 'qrcode';
    import Modal from './Modal.svelte';
    import TwoFactorCode from './TwoFactorCode.svelte';
    import * as api from '../lib/api.js';
    import type {ITwoFactorEnrolment} from '../lib/api.js';
    import {ApiError} from '../lib/api.js';
    import * as notifier from '../lib/notifier.js';
    import {t} from '../lib/i18n.js';

    let {onClose, onDone}: {onClose: () => void; onDone: () => void} = $props();

    let enrolment = $state<ITwoFactorEnrolment | null>(null);
    let qr = $state('');
    let code = $state('');
    let busy = $state(false);

    $effect(() =>
    {
        let cancelled = false;

        void api.startTwoFactor()
            .then(async (answer) =>
            {
                if(cancelled) return;

                enrolment = answer;

                // habbo.com's server renders the QR and sends it down as `qrCode`. This one sends
                // the otpauth URI the QR would encode, so it is drawn here — which is also the
                // safer half of the trade: a picture of an authenticator secret never has to exist
                // on the hotel's side.
                qr = await QRCode.toDataURL(answer.uri, {margin: 1, width: 150});
            })
            // `startRegistration()`'s own catch, and the same key:
            //   .catch(function (e) { … notifier.error("TWO_FACTOR_AUTH_REGISTRATION_ERROR") })
            .catch(() => !cancelled && notifier.error('TWO_FACTOR_AUTH_REGISTRATION_ERROR'));

        return () => (cancelled = true);
    });

    async function register(event: Event): Promise<void>
    {
        event.preventDefault();

        if(busy || !enrolment || code.length !== 6)
        {
            return;
        }

        busy = true;

        try
        {
            await api.enableTwoFactor(enrolment.secret, code);

            // `completeRegistration()` closes the dialog and says so through the notifier — the
            // page behind it never grows a confirmation of its own.
            onDone();
            notifier.success('TWO_FACTOR_AUTH_REGISTERED_OK');
        }
        catch(failure)
        {
            // habbo.com's own split, `isInvalidAuthCode() ? … : …`: a rejected code says so,
            // anything else is "registration failed".
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

<Modal title={t('TWO_FACTOR_AUTHENTICATION_REGISTER')} {onClose}>
    <div class="px-3 pt-3 pb-6">
        <!-- `.two-factor-auth__description { margin: 10px }`. -->
        <div class="m-[10px]">
            <p class="m-0">{t('TWO_FACTOR_AUTHENTICATION_APP_DESCRIPTION')}</p>
        </div>

        <!-- `.two-factor-auth__register`: the steps and the QR in one #103960 box, side by side. -->
        <div class="m-[10px] flex flex-row overflow-hidden rounded-[3px] bg-box px-3 py-6 xs:px-6">
            <div class="min-w-0 flex-1">
                <!-- STEP2 and STEP3 describe a second code sent by e-mail, which habbo.com's
                     enrolment also asks for. This hotel's does not: AccountMfaService stores one
                     TOTP secret and sends nothing, and `register-authenticator.html` hides its own
                     e-mail field the same way when the server sends no address. Quoting the two
                     steps would be instructions for a message that never arrives. -->
                <p class="m-0">{t('TWO_FACTOR_AUTHENTICATION_APP_STEP1')}</p>
                <p class="mt-3 mb-0">{t('TWO_FACTOR_AUTHENTICATION_APP_STEP4')}</p>
            </div>

            {#if qr}
                <!-- `.two-factor-auth__register__qr { width:150px; height:150px; margin:10px }`.
                     `image-rendering: pixelated` is the site-wide `img` rule and it is right here
                     too: a QR is a pixel grid, and smoothing it is what makes one hard to scan. -->
                <img src={qr} alt={t('TWO_FACTOR_AUTHENTICATION_APP_STEP1')}
                     width="150" height="150"
                     class="m-[10px] h-[150px] w-[150px] shrink-0 self-start bg-white" />
            {/if}
        </div>

        <form onsubmit={register}>
            <!-- `.form__footer` is a clearfix, and both buttons float right inside it — which is
                 why REGISTER, first in the markup, ends up rightmost. -->
            <div class="relative mt-6 after:table after:clear-both after:content-['']">
                <div class="flex justify-center">
                    <p class="m-0">{t('TWO_FACTOR_AUTHENTICATION_ENTER_AUTH_CODE')}</p>
                </div>
                <div class="flex justify-center">
                    <TwoFactorCode bind:value={code} />
                </div>

                <div class="relative mt-6 after:table after:clear-both after:content-['']">
                    <!-- `.two-factor-auth__auth-button`: the green ramp at `width:25%`, floated
                         right, with no side padding below 767px because 25% of a 500px dialog is
                         125px and "S'INSCRIRE" has to fit in it. -->
                    <button type="submit" disabled={busy || code.length !== 6}
                            class="float-right m-1.5 w-1/4 rounded-[5px] border-2 border-play-line bg-play px-0 py-3 text-center font-condensed text-base leading-[1.2] uppercase text-white shadow-btn hover:border-b-2 hover:border-play-line-hover hover:bg-play-hover active:translate-y-[2px] active:border-play-line-active active:bg-play-active active:shadow-btn-active disabled:border-play-line-active disabled:bg-play-active disabled:opacity-40 md:px-6">
                        {t('TWO_FACTOR_AUTHENTICATION_REGISTER_BUTTON')}
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
