<script lang="ts">
    // `/settings/security` — `settings/account-security/…`: the title, the status in a
    // `habbo-message-container`, and the button that moves it.
    //
    // Real since 2026-09-12, and it is the account SAFETY LOCK: while it is on, the account cannot
    // spend — no catalog purchase, no marketplace — and the server enforces that on every spending
    // handler, not just the client. The client already hides both screens when the user object says
    // locked (`PurchaseCatalogWidget`, `MarketPlaceCatalogWidget`), so the server-side half is what
    // protects the account from the person who stole it and is not using our client.
    //
    // habbo.com gates this with two SECURITY QUESTIONS. They are deliberately not reproduced: a
    // question is a second secret to store, weaker than a password, and typically guessable by
    // whoever knew the player well enough to be in their account. The password gates it here — which
    // is habbo.com's own second gate on this very page, hence
    // `ACCOUNT_SECURITY_PASSWORD_DESCRIPTION` below — plus the second factor when there is one.
    //
    // Every label is habbo.com's own key except the one sentence describing what OUR lock does:
    // `ACCOUNT_SECURITY_DESCRIPTION` describes the security questions, so quoting it would promise a
    // feature this hotel does not have.
    import SettingsShell from './SettingsShell.svelte';
    import MessageBox from '../../components/MessageBox.svelte';
    import Button from '../../components/Button.svelte';
    import Fieldset from '../../components/Fieldset.svelte';
    import PasswordField from '../../components/PasswordField.svelte';
    import Field from '../../components/Field.svelte';
    import FormError from '../../components/FormError.svelte';
    import * as api from '../../lib/api.js';
    import * as notifier from '../../lib/notifier.js';
    import {t} from '../../lib/i18n.js';

    let locked = $state<boolean | null>(null);
    let asking = $state(false);
    let password = $state('');
    let code = $state('');
    let needsCode = $state(false);
    let error = $state('');
    let busy = $state(false);

    $effect(() =>
    {
        let cancelled = false;

        void api.getSafetyLock()
            .then((status) => !cancelled && (locked = status.locked))
            .catch(() => {});

        return () => (cancelled = true);
    });

    function reset(): void
    {
        asking = false;
        password = '';
        code = '';
        needsCode = false;
        error = '';
    }

    async function apply(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();
        busy = true;
        error = '';

        try
        {
            const status = await api.setSafetyLock(!locked, password, code.trim() || undefined);

            locked = status.locked;
            reset();

            // habbo.com has a key per direction and they are written for this exact feature: "Le
            // verrouillage de sécurité de ton compte est maintenant activé / désactivé". Both are
            // said through the notifier — `enableSafetyLock` and `disableSafetyLock` each end in
            // `notifier.success(...)`, and neither page grows a line under the form.
            notifier.success(locked ? 'ACCOUNT_SECURITY_SAVED_OK' : 'ACCOUNT_SECURITY_DISABLED_OK');
        }
        catch(failure)
        {
            if(api.needsMfa(failure))
            {
                needsCode = true;
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

<SettingsShell>
    <h1 class="mt-0">{t('ACCOUNT_SECURITY_TITLE')}</h1>
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

            {#if !asking}
                <Button className="mt-3" onclick={() => { reset(); asking = true; }}>
                    {locked ? t('ACCOUNT_SECURITY_DISABLE') : t('ACCOUNT_SECURITY_ENABLE_BUTTON')}
                </Button>
            {:else}
                <form onsubmit={apply}>
                    <p class="mt-3">{t('ACCOUNT_SECURITY_PASSWORD_DESCRIPTION')}</p>

                    <Fieldset>
                        <PasswordField name="safety-password" label={t('CURRENT_PASSWORD_LABEL')}
                                       bind:value={password} />
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

                    <div class="mt-3 flex gap-3">
                        <Button type="submit" disabled={busy || !password}>
                            {locked ? t('ACCOUNT_SECURITY_DISABLE') : t('ACCOUNT_SECURITY_ENABLE_BUTTON')}
                        </Button>
                        <Button onclick={reset}>{t('TWO_FACTOR_AUTHENTICATION_CANCEL_BUTTON')}</Button>
                    </div>
                </form>
            {/if}
        </MessageBox>
    {/if}
</SettingsShell>
