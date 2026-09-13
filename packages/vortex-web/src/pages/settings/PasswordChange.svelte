<script lang="ts">
    // `/settings/password` — `settings/password-change/…` + `common/form/password-current` +
    // `common/form/password-new`: a plain fieldset for the current password, then a BOXED one
    // holding the new password, its help paragraph and the repeat field. Every password input
    // carries the show/hide eye.
    //
    // This one is REAL: POST /api/public/authentication/password. It has one consequence worth
    // being loud about — the endpoint revokes every session of the account, its own included, and
    // clears the cookie. So a successful change is a sign-out, and this page treats it as one
    // rather than leaving the visitor on a screen whose next request would 401.
    import {push} from 'svelte-spa-router';
    import SettingsShell from './SettingsShell.svelte';
    import Fieldset from '../../components/Fieldset.svelte';
    import PasswordField from '../../components/PasswordField.svelte';
    import Field from '../../components/Field.svelte';
    import FormError from '../../components/FormError.svelte';
    import Button from '../../components/Button.svelte';
    import PasswordStrength from '../../components/PasswordStrength.svelte';
    import * as api from '../../lib/api.js';
    import {passwordProblem, PASSWORD_MIN_LENGTH} from '../../lib/password.js';
    import * as notifier from '../../lib/notifier.js';
    import {avatars, selectedId, me} from '../../lib/session.js';
    import {t} from '../../lib/i18n.js';

    let current = $state('');
    let next = $state('');
    let repeat = $state('');
    let code = $state('');
    let busy = $state(false);
    let error = $state('');

    // `password-new.html` lists SIX messages for this one field and each says what is wrong. This
    // page had a single boolean — "weak" — and, worse, it was calibrated on habbo.com's floor of
    // SIX characters where this hotel's server refuses anything under EIGHT
    // (`PasswordChangeResult.MINIMUM_LENGTH`). A visitor typing seven got a green field and then a
    // refusal they could not explain. See lib/password.ts.
    const problem = $derived(next.length > 0 ? passwordProblem(next, {name: $me?.name}) : null);
    const mismatch = $derived(repeat.length > 0 && next !== repeat);

    async function submit(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();

        if(busy || mismatch || problem !== null || !next)
        {
            return;
        }

        busy = true;
        error = '';

        try
        {
            await api.changePassword(current, next, code || undefined);

            avatars.set([]);
            selectedId.set('');

            // `PasswordChangeFormController.update()`'s own `notifier.success(...)`, and the toast
            // is what makes the redirect below legible: habbo.com clears the form and stays put,
            // this endpoint revokes the session, so the page is gone a tick later. The container is
            // mounted outside the router (App.svelte), so the message survives the navigation —
            // where a line inside the form would leave with it and nothing would be said at all.
            notifier.success('PASSWORD_CHANGE_SUCCESS');
            push('/');
        }
        catch(failure)
        {
            error = (failure as Error)?.message ?? '';
        }
        finally
        {
            busy = false;
        }
    }
</script>

<SettingsShell>
    <h1 class="mt-0">{t('PASSWORD_CHANGE_TITLE')}</h1>

    <form onsubmit={submit}>
        {#if error}
            <FormError inline>{error}</FormError>
        {/if}

        <Fieldset>
            <PasswordField name="password-current" label={t('CURRENT_PASSWORD_LABEL')} bind:value={current} />
        </Fieldset>

        <!-- NOT `PASSWORD_CHANGE_HELP`: habbo.com's sentence is "Utilise au moins 6 caractères",
             and six is not this hotel's floor. The rest of it is habbo's, word for word. -->
        <Fieldset box title={t('NEW_PASSWORD_LABEL')}
                  help="Utilise au moins {PASSWORD_MIN_LENGTH} caracteres. Inclue au moins une lettre et au moins un chiffre ou un caractere special.">
            <PasswordField name="password-new" bind:value={next} autocomplete="new-password" invalid={problem !== null} />

            <!-- `habbo-password-strength` wraps the field's own messages, so the meter and the
                 reason it is red are one block rather than two. -->
            <PasswordStrength password={next}>
                {#if problem}
                    <span class="text-error">{problem}</span>
                {/if}
            </PasswordStrength>

            <label class="mt-3 block text-white" for="password-repeat">{t('PASSWORD_REPEAT_LABEL')}</label>
            <PasswordField name="password-repeat" bind:value={repeat} autocomplete="new-password" invalid={mismatch} />

            {#if mismatch}
                <FormError inline>{t('ERROR_PASSWORDS_NOT_MATCHING')}</FormError>
            {/if}
        </Fieldset>

        <!-- habbo.com puts a captcha in this slot. This hotel has no captcha provider, and the web
             API takes the second factor here instead, so the code field stands in its place. -->
        <Fieldset>
            <Field name="mfa" label={t('TWO_FACTOR_AUTHENTICATION_ENTER_AUTH_CODE')} bind:value={code} maxlength={6} autocomplete="one-time-code" />
        </Fieldset>

        <Fieldset>
            <p class="text-sm">Changer ton mot de passe déconnecte toutes tes sessions, y compris celle-ci.</p>
            <Button type="submit" disabled={busy || mismatch || problem !== null || !next} className="mt-3">
                {busy ? '...' : t('PASSWORD_CHANGE_TITLE')}
            </Button>
        </Fieldset>
    </form>
</SettingsShell>
