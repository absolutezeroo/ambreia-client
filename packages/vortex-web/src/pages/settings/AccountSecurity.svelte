<script lang="ts">
    // `/settings/security` — `settings/account-security/account-security.html`, which is four
    // elements and a second section:
    //
    //   <h2 translate="ACCOUNT_SECURITY_TITLE">
    //   <p translate="ACCOUNT_SECURITY_DESCRIPTION">
    //   <habbo-account-security-edit>            ← account-security-edit.html, three states
    //   <div ng-if="enabled" class="account-security__trusted-locations">
    //     <h2 …_TRUSTED_LOCATIONS_TITLE>  <p …_DESCRIPTION>  <habbo-trusted-locations-reset>
    //
    // and `account-security-edit.html` is:
    //
    //   enabled  → message-container type="check"
    //              <h3 …_STATUS_ENABLED_TITLE>
    //              <div class="account-security__status">      a FLEX row of two buttons
    //                <button class="account-security__edit">   …_EDIT_BUTTON   (blue, margin-right 12)
    //                <button class="account-security__disable">…_DISABLE       (crimson)
    //   disabled → message-container type="exclamation"
    //              <h3 …_STATUS_DISABLED_TITLE>
    //              <button class="account-security__enable">   …_ENABLE_BUTTON (blue)
    //   identity_verification_required → type="exclamation", a heading and a link to /settings/email
    //
    // Both buttons OPEN A MODAL (`openEditModal()` / `openDisableModal()`). This page had the form
    // folded into the message box, the same defect the 2FA page had.
    //
    // Real since 2026-09-12, and it is the account SAFETY LOCK: while it is on, the account cannot
    // spend — no catalog purchase, no marketplace — and the server enforces that on every spending
    // handler, not just the client. The client already hides both screens when the user object says
    // locked (`PurchaseCatalogWidget`, `MarketPlaceCatalogWidget`).
    //
    // THREE things habbo.com has here are absent, and each is absent for the same reason — the
    // feature behind it does not exist on this hotel, so the control would do nothing:
    //
    //  - The two SECURITY QUESTIONS. habbo.com's lock is a pair of questions asked when you sign in
    //    from a new device; `IAccountSafetyLockService` gates on the password and the second factor
    //    instead. Storing two answers that nothing ever asks for would be a form, not a defence —
    //    which is why `ACCOUNT_SECURITY_EDIT_BUTTON` ("Editer les questions de sécurité") has no
    //    counterpart below.
    //  - TRUSTED LOCATIONS, for the same reason one step on: there is no sign-in challenge, so
    //    there is nothing to remember a device for and nothing for the reset button to clear.
    //  - `identity_verification_required`, which is the state of an account whose e-mail is not
    //    verified. `AccountEmailResponse.Verified` is hardcoded false here because no verification
    //    mail exists, so every account would sit in that state permanently.
    //
    // `ACCOUNT_SECURITY_DESCRIPTION` goes with them: it is three sentences about the security
    // questions and the login challenge, so quoting it would promise all three.
    import SettingsShell from './SettingsShell.svelte';
    import MessageBox from '../../components/MessageBox.svelte';
    import Button from '../../components/Button.svelte';
    import SafetyLockModal from '../../components/SafetyLockModal.svelte';
    import * as api from '../../lib/api.js';
    import {t} from '../../lib/i18n.js';

    let locked = $state<boolean | null>(null);
    let asking = $state(false);

    $effect(() =>
    {
        let cancelled = false;

        void api.getSafetyLock()
            .then((status) => !cancelled && (locked = status.locked))
            .catch(() => {});

        return () => (cancelled = true);
    });
</script>

<SettingsShell>
    <!-- `<h2>`, not `<h1>`: this page's own heading is 32px, where /settings/password leads with an
         `<h2>` too. The tabs above already carry the site's `<h1>`. -->
    <h2 class="mt-0">{t('ACCOUNT_SECURITY_TITLE')}</h2>
    <p>
        Le verrouillage de sécurité empêche toute dépense sur ton compte — catalogue et place de
        marché — jusqu'à ce que tu le retires avec ton mot de passe.
    </p>

    {#if locked !== null}
        <MessageBox type={locked ? 'check' : 'exclamation'}>
            <h3 class="mt-0">
                {locked
                    ? t('ACCOUNT_SECURITY_STATUS_ENABLED_TITLE')
                    : t('ACCOUNT_SECURITY_STATUS_DISABLED_TITLE')}
            </h3>

            {#if locked}
                <!-- `.account-security__status` is a flex row, and it holds two buttons on
                     habbo.com. Only the crimson one has a counterpart here — the blue "Editer les
                     questions de sécurité" beside it edits questions this hotel does not keep. -->
                <div class="flex">
                    <Button variant="red" className="mt-3" onclick={() => (asking = true)}>
                        {t('ACCOUNT_SECURITY_DISABLE')}
                    </Button>
                </div>
            {:else}
                <!-- `.account-security__enable` is BLUE, not green — the same ramp as
                     `.account-security__edit` and `.account-security__reset`. -->
                <Button className="mt-3" onclick={() => (asking = true)}>
                    {t('ACCOUNT_SECURITY_ENABLE_BUTTON')}
                </Button>
            {/if}
        </MessageBox>
    {/if}
</SettingsShell>

{#if asking && locked !== null}
    <SafetyLockModal {locked}
                     onClose={() => (asking = false)}
                     onDone={(now) => { locked = now; asking = false; }} />
{/if}
