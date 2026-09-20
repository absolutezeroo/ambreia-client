<script lang="ts">
    // `/settings/2fa` — `settings/two-factor-auth/two-factor-auth.html`, which is one element
    // (`<habbo-two-factor-auth-edit>`), so this page is `two-factor-auth-edit.html` and nothing
    // else:
    //
    //   <h3 translate="TWO_FACTOR_AUTHENTICATION_TITLE">  <p translate="…_DESCRIPTION">
    //   <habbo-message-container type="2fa-off">          when there is no second factor
    //     <h3 …_OFF>  <p …_METHODS>
    //     <div class="two-factor-auth__status"><button class="two-factor-auth__edit">  APP
    //     <div class="two-factor-auth__status"><button class="two-factor-auth__edit">  E-MAIL
    //   <habbo-message-container type="2fa-on">           when there is
    //     <h3 …_ON>  <p …_ENABLED_DESCRIPTION>
    //     <div class="account-security__status"><button class="two-factor-auth__disable-button">
    //     <p …_TRUSTED_LOCATIONS>  <habbo-trusted-locations-reset>
    //
    // Every button here OPENS A MODAL — `openRegisterAuthenticator()`, `openRegisterEmail()`,
    // `openDisable()`. The page itself never grows a form, never shows a secret and never asks for
    // a code; the QR, the six code boxes and the confirmation all live in the two dialogs beside
    // this file. This port had the whole flow folded into the page, which is why it looked nothing
    // like habbo.com's.
    //
    // Real since 2026-09-12. `IAccountMfaService` has had the feature since the dashboard needed it
    // (begin / confirm / verify / disable, with `TotpSecret` on the account) and sign-in has always
    // answered `pocket.auth.mfa_required` against it.
    import SettingsShell from './SettingsShell.svelte';
    import MessageBox from '../../components/MessageBox.svelte';
    import Button from '../../components/Button.svelte';
    import TwoFactorRegisterModal from '../../components/TwoFactorRegisterModal.svelte';
    import TwoFactorDisableModal from '../../components/TwoFactorDisableModal.svelte';
    import TrustedLocationsReset from '../../components/TrustedLocationsReset.svelte';
    import * as api from '../../lib/api.js';
    import {t} from '../../lib/i18n.js';

    let enabled = $state<boolean | null>(null);
    let dialog = $state<'register' | 'disable' | null>(null);

    $effect(() =>
    {
        let cancelled = false;

        void api.getTwoFactor()
            .then((status) => !cancelled && (enabled = status.enabled))
            .catch(() => !cancelled && (enabled = null));

        return () => (cancelled = true);
    });

    /** Both dialogs close by saying what they changed, the way `on-success="$close()"` does. */
    function done(now: boolean): void
    {
        enabled = now;
        dialog = null;
    }
</script>

<SettingsShell>
    <h3 class="mt-0">{t('TWO_FACTOR_AUTHENTICATION_TITLE')}</h3>
    <p>{t('TWO_FACTOR_AUTHENTICATION_DESCRIPTION')}</p>

    {#if enabled === null}
        <!-- The status has not answered yet, or the visitor is signed out. Nothing is claimed
             either way: a box saying "disabled" before the answer arrives is a lie half the time. -->
    {:else if enabled}
        <!-- `two-factor-auth-edit.html` pairs `_ON` with `_ENABLED_DESCRIPTION`.

             habbo.com has a THIRD state between these two — `twoFactorAuthStatus.disabled`, a
             factor that is registered but switched off, which shows `_DISABLED` / `_ENABLE` and
             offers to turn it back on. There is no such state here: `DisableAsync` clears
             `TotpSecret`, so an account either has a factor or has none. -->
        <MessageBox type="2fa-on">
            <h3 class="mt-0">{t('TWO_FACTOR_AUTHENTICATION_ON')}</h3>
            <p>{t('TWO_FACTOR_AUTHENTICATION_ENABLED_DESCRIPTION')}</p>

            <!-- `.account-security__status` + `.two-factor-auth__disable-button`: the site's one
                 crimson button, full width, and all it does is open the dialog. -->
            <div class="xs:flex">
                <Button variant="red" className="mt-3 min-w-full" onclick={() => (dialog = 'disable')}>
                    {t('TWO_FACTOR_AUTHENTICATION_DISABLE')}
                </Button>
            </div>

            <!-- `<p …_TRUSTED_LOCATIONS>` then `<div class="two-factor-auth__status">` holding
                 `<habbo-trusted-locations-reset>`. Both were left out here on the claim that the
                 emulator keeps no trusted-login record — which was never true:
                 `IAccountTrustedLocationService` backs `POST /api/user/trustedlocations/reset`, and
                 the security page has been calling it all along. -->
            <p class="mt-3">{t('TWO_FACTOR_AUTHENTICATION_TRUSTED_LOCATIONS')}</p>

            <div class="xs:flex">
                <TrustedLocationsReset className="mt-3" />
            </div>
        </MessageBox>
    {:else}
        <MessageBox type="2fa-off">
            <h3 class="mt-0">{t('TWO_FACTOR_AUTHENTICATION_OFF')}</h3>
            <p>{t('TWO_FACTOR_AUTHENTICATION_METHODS')}</p>

            <!-- `.two-factor-auth__edit { min-width: 75% }`, and 50% from 767px. -->
            <div class="xs:flex">
                <Button className="mt-3 min-w-[75%] md:min-w-[50%]" onclick={() => (dialog = 'register')}>
                    {t('TWO_FACTOR_AUTHENTICATION_AUTHENTICATOR_APP')}
                </Button>
            </div>
            <!-- Disabled, and honestly: `AccountMfaService` is TOTP only — there is no e-mail
                 second factor to enrol into, and no `openRegisterEmail()` to reach. -->
            <div class="xs:flex">
                <Button disabled className="mt-3 min-w-[75%] md:min-w-[50%]">
                    {t('TWO_FACTOR_AUTHENTICATION_EMAIL')}
                </Button>
            </div>
        </MessageBox>
    {/if}
</SettingsShell>

{#if dialog === 'register'}
    <TwoFactorRegisterModal onClose={() => (dialog = null)} onDone={() => done(true)} />
{:else if dialog === 'disable'}
    <TwoFactorDisableModal onClose={() => (dialog = null)} onDone={() => done(false)} />
{/if}
