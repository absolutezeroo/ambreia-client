<script lang="ts">
    // `/settings/email` — `settings/email-change/…`: the address the account uses, then the change
    // form — the current password, then a BOXED "Nouvel Email" carrying habbo.com's own help line.
    //
    // Real since 2026-09-12. The address is the LOGIN identifier, so moving it is how an account is
    // taken for good: the current password is required from a caller who already holds a session
    // cookie, and an account with a second factor is asked for a code as well. Both refusals come
    // back as their own error code and are shown rather than collapsed into "something went wrong".
    //
    // habbo.com's unverified-address warning and its "send a verification email" button are gone
    // instead of disabled: this hotel has no SMTP path, no queue and no verification token anywhere,
    // so an address here is simply never confirmed. A warning that can never be cleared is worse
    // than none — it tells every player they have a problem they cannot fix.
    import SettingsShell from './SettingsShell.svelte';
    import Fieldset from '../../components/Fieldset.svelte';
    import PasswordField from '../../components/PasswordField.svelte';
    import Field from '../../components/Field.svelte';
    import Button from '../../components/Button.svelte';
    import FormError from '../../components/FormError.svelte';
    import * as api from '../../lib/api.js';
    import {emailProblem} from '../../lib/password.js';
    import * as notifier from '../../lib/notifier.js';
    import {t} from '../../lib/i18n.js';

    let current = $state('');
    let email = $state('');
    let code = $state('');
    let needsCode = $state(false);
    let currentEmail = $state('');
    let error = $state('');
    let busy = $state(false);

    const emailError = $derived(email ? emailProblem(email) : null);

    $effect(() =>
    {
        let cancelled = false;

        void api.getEmail()
            .then((account) => !cancelled && (currentEmail = account.email))
            .catch(() => {});

        return () => (cancelled = true);
    });

    async function submit(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();
        busy = true;
        error = '';

        try
        {
            const account = await api.changeEmail(current, email.trim(), code.trim() || undefined);

            currentEmail = account.email;
            current = '';
            email = '';
            code = '';
            needsCode = false;

            // habbo.com says `EMAIL_CHANGE_SUCCESS` here, and that key is NOT usable on this hotel:
            // it promises "un message de vérification a été envoyé à ta nouvelle adresse … ton
            // adresse ne sera pas changée jusqu'à ce que tu cliques sur le lien". There is no
            // verification mail behind this endpoint — the address is changed on the spot, which is
            // the same reason `AccountEmailResponse.Verified` is hardcoded false. So the toast is
            // habbo.com's mechanism with the honest key.
            notifier.success('SETTINGS_SAVED_OK');
        }
        catch(failure)
        {
            // Not a refusal: the server is asking for the second factor, so the field appears and
            // the visitor posts again. Same shape as the sign-in form's own MFA step.
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

<SettingsShell>
    <h1 class="mt-0">{t('EMAIL_CHANGE_TITLE')}</h1>

    {#if currentEmail}
        <p>{currentEmail}</p>
    {/if}

    <form onsubmit={submit}>
        <Fieldset>
            <PasswordField name="email-password" label={t('CURRENT_PASSWORD_LABEL')} bind:value={current} />
        </Fieldset>

        <!-- `FORM_NEW_EMAIL_LABEL` is habbo.com's own wording for this box; it was hand-written
             French ("Nouvel Email") before. -->
        <Fieldset box title={t('FORM_NEW_EMAIL_LABEL')} help={t('EMAIL_NEW_HELP')}>
            <Field name="email-new" type="email" bind:value={email} autocomplete="email" />

            <!-- `email-address.html`'s own message. "Already used" is the server's to know and
                 lib/api.ts words it off `email_taken`. -->
            {#if emailError}
                <p class="mt-1.5 text-sm text-error">{emailError}</p>
            {/if}
        </Fieldset>

        {#if needsCode}
            <Fieldset>
                <Field name="email-code" label={t('TWO_FACTOR_AUTHENTICATION_ENTER_AUTH_CODE')}
                       bind:value={code} autocomplete="one-time-code" maxlength={6} />
            </Fieldset>
        {/if}

        {#if error}
            <FormError inline>{error}</FormError>
        {/if}

        <Fieldset>
            <Button type="submit" disabled={busy || !current || !email.trim() || emailError !== null}>
                <!-- `email-change-form.html`'s own button: "Changer", not the page's title. -->
                {t('FORM_BUTTON_CHANGE')}
            </Button>
        </Fieldset>
    </form>
</SettingsShell>
