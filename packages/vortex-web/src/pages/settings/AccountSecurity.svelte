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
    // Every button opens a MODAL — `openEditModal()` / `openDisableModal()` — and this page had the
    // form folded into the message box, the same defect the 2FA page had.
    //
    // "Enabled" here means the account HAS security questions, which is what arms the lock. The
    // lock itself is a separate flag the server throws when a sign-in arrives from a place the
    // account has never answered from; `status.locked` is it, and the challenge box below is what
    // lifts it.
    //
    // Only `identity_verification_required` is left out, and by capability: it is the state of an
    // account whose e-mail is not verified, and `AccountEmailResponse.Verified` is hardcoded false
    // here because nothing can send a verification mail — so every account would sit in it forever.
    import SettingsShell from './SettingsShell.svelte';
    import MessageBox from '../../components/MessageBox.svelte';
    import Button from '../../components/Button.svelte';
    import SafetyQuestionsModal from '../../components/SafetyQuestionsModal.svelte';
    import SafetyLockModal from '../../components/SafetyLockModal.svelte';
    import SafetyChallengeModal from '../../components/SafetyChallengeModal.svelte';
    import * as api from '../../lib/api.js';
    import type {ISafetyQuestions} from '../../lib/api.js';
    import * as notifier from '../../lib/notifier.js';
    import {t} from '../../lib/i18n.js';

    let status = $state<ISafetyQuestions | null>(null);
    let dialog = $state<'edit' | 'disable' | 'challenge' | null>(null);
    let resetting = $state(false);

    async function refresh(): Promise<void>
    {
        try
        {
            status = await api.getSafetyQuestions();
        }
        catch
        {
            status = null;
        }
    }

    $effect(() =>
    {
        void refresh();
    });

    function done(): void
    {
        dialog = null;
        void refresh();
    }

    async function resetLocations(): Promise<void>
    {
        if(resetting || !window.confirm(t('ACCOUNT_SECURITY_RESET_LOCATIONS_CONFIRMATION')))
        {
            return;
        }

        resetting = true;

        try
        {
            await api.resetTrustedLocations();
            notifier.success('ACCOUNT_SECURITY_TRUSTED_LOGINS_RESET_OK');
        }
        catch(failure)
        {
            // An untrusted session is refused here on purpose — forgetting every place is how a
            // thief would make sure the owner is challenged next time — so it opens the challenge
            // rather than reporting a failure.
            if(api.needsSafetyUnlock(failure))
            {
                dialog = 'challenge';
            }
            else
            {
                notifier.error('ERROR_SERVER');
            }
        }
        finally
        {
            resetting = false;
        }
    }
</script>

<SettingsShell>
    <!-- `<h2>`, not `<h1>`: the tabs above already carry the page's `<h1>`. -->
    <h2 class="mt-0">{t('ACCOUNT_SECURITY_TITLE')}</h2>
    <!-- habbo.com's own description, and it carries its own <b> and <br>. It is usable verbatim
         now that the questions and the trusted locations behind it are both real. -->
    <p>{@html t('ACCOUNT_SECURITY_DESCRIPTION')}</p>

    {#if status !== null}
        {#if status.configured}
            <MessageBox type="check">
                <h3 class="mt-0">{t('ACCOUNT_SECURITY_STATUS_ENABLED_TITLE')}</h3>

                <!-- `.account-security__status` is a flex row: the blue edit button with its 12px
                     right margin, then the crimson one. -->
                <div class="mt-3 xs:flex">
                    <Button className="mr-3" onclick={() => (dialog = 'edit')}>
                        {t('ACCOUNT_SECURITY_EDIT_BUTTON')}
                    </Button>
                    <Button variant="red" onclick={() => (dialog = 'disable')}>
                        {t('ACCOUNT_SECURITY_DISABLE')}
                    </Button>
                </div>
            </MessageBox>

            {#if status.locked}
                <!-- Not on habbo.com's page, because its lock is lifted wherever you happen to hit
                     it: the dialog is opened by the ACTION that was refused. A player who is locked
                     and browsing settings would otherwise have to go and fail at something before
                     being offered the way out, so the offer is repeated here. -->
                <MessageBox type="exclamation">
                    <h3 class="mt-0">{t('SAFETY_LOCK_TITLE')}</h3>
                    <p>{t('SAFETY_LOCK_ANSWER')}</p>

                    <Button className="mt-3" onclick={() => (dialog = 'challenge')}>
                        {t('FORM_BUTTON_UNLOCK')}
                    </Button>
                </MessageBox>
            {/if}

            <!-- `.account-security__trusted-locations { margin-top: 24px }`, shown only while the
                 protection is on — there is nothing to remember a place for otherwise. -->
            <section class="mt-6">
                <h2>{t('ACCOUNT_SECURITY_TRUSTED_LOCATIONS_TITLE')}</h2>
                <p>{@html t('ACCOUNT_SECURITY_TRUSTED_LOCATIONS_DESCRIPTION')}</p>

                <Button className="mt-3" disabled={resetting} onclick={resetLocations}>
                    {t('ACCOUNT_SECURITY_RESET_TRUSTED_LOGINS_BUTTON')}
                </Button>
            </section>
        {:else}
            <MessageBox type="exclamation">
                <h3 class="mt-0">{t('ACCOUNT_SECURITY_STATUS_DISABLED_TITLE')}</h3>

                <!-- `.account-security__enable` is BLUE, not green — the same ramp as `__edit` and
                     `__reset`. Only `__disable` is crimson. -->
                <Button className="mt-3" onclick={() => (dialog = 'edit')}>
                    {t('ACCOUNT_SECURITY_ENABLE_BUTTON')}
                </Button>
            </MessageBox>
        {/if}
    {/if}
</SettingsShell>

{#if dialog === 'edit'}
    <SafetyQuestionsModal question1={status?.question1 || 1}
                          question2={status?.question2 || 2}
                          onClose={() => (dialog = null)} onDone={done} />
{:else if dialog === 'disable'}
    <SafetyLockModal onClose={() => (dialog = null)} onDone={done} />
{:else if dialog === 'challenge'}
    <SafetyChallengeModal onClose={() => (dialog = null)} onDone={done} />
{/if}
