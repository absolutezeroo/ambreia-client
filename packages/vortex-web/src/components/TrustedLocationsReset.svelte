<script lang="ts">
    // `settings/account-security/trusted-locations-reset.html` — one button, and habbo.com declares
    // it as its own component precisely because TWO pages place it:
    //
    //   account-security.html      <div class="account-security__trusted-locations"> … it
    //   two-factor-auth-edit.html  <p …_TRUSTED_LOCATIONS> <div class="two-factor-auth__status"> … it
    //
    //   <button class="account-security__reset" ng-disabled="inProgress"
    //           translate="ACCOUNT_SECURITY_RESET_TRUSTED_LOGINS_BUTTON">
    //
    // The port had it written out inside the security page only, and the 2FA page left it out on
    // the claim that "the emulator keeps no trusted-login record". That claim was false when it was
    // written: `IAccountTrustedLocationService` is what `POST /api/user/trustedlocations/reset`
    // calls, the security page has been calling it since it was ported, and the answer says how
    // many places were forgotten.
    //
    // It owns its own challenge dialog rather than reporting the refusal upward. An untrusted
    // session is refused here ON PURPOSE — forgetting every place is how a thief would make sure
    // the owner is challenged from their own home — so the refusal is an invitation to answer the
    // questions, not an error. Both hosts then behave the same way without either having to know.
    import Button from './Button.svelte';
    import SafetyChallengeModal from './SafetyChallengeModal.svelte';
    import * as api from '../lib/api.js';
    import * as notifier from '../lib/notifier.js';
    import {t} from '../lib/i18n.js';

    let {className = ''}: {className?: string} = $props();

    let busy = $state(false);
    let challenging = $state(false);

    async function reset(): Promise<void>
    {
        if(busy || !window.confirm(t('ACCOUNT_SECURITY_RESET_LOCATIONS_CONFIRMATION')))
        {
            return;
        }

        busy = true;

        try
        {
            await api.resetTrustedLocations();
            notifier.success('ACCOUNT_SECURITY_TRUSTED_LOGINS_RESET_OK');
        }
        catch(failure)
        {
            if(api.needsSafetyUnlock(failure))
            {
                challenging = true;
            }
            else
            {
                notifier.error('ERROR_SERVER');
            }
        }
        finally
        {
            busy = false;
        }
    }
</script>

<Button className={className} disabled={busy} onclick={reset}>
    {t('ACCOUNT_SECURITY_RESET_TRUSTED_LOGINS_BUTTON')}
</Button>

{#if challenging}
    <!-- Answering does not re-run the reset: habbo.com's own dialog resolves to nothing and the
         visitor presses the button again, now on a trusted session. -->
    <SafetyChallengeModal onClose={() => (challenging = false)} onDone={() => (challenging = false)} />
{/if}
