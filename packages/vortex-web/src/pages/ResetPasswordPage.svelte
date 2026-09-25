<script lang="ts">
    // `/reset-password/:token` — `password-reset/password-reset.html` + `password-reset-form.html`:
    // the title, then `<habbo-password-new is-new="true">` and a "Changer" button in a
    // `.form.form--left`. The token is the one the forgotten-password mail carried.
    //
    // `PasswordResetFormController`: success is `notifier.success("PASSWORD_RESET_SUCCESS")` and the
    // home page; a 404 is `notifier.error("ERROR_PASSWORD_RESET_EXPIRED")`, whose wording carries
    // markup — which is why it is a toast (the notifier renders a key as HTML) and not the inline
    // error line.
    import {push} from 'svelte-spa-router';
    import Button from '../components/Button.svelte';
    import FormError from '../components/FormError.svelte';
    import PasswordNew from '../components/PasswordNew.svelte';
    import * as api from '../lib/api.js';
    import * as notifier from '../lib/notifier.js';
    import {passwordProblem, PASSWORD_MIN_LENGTH} from '../lib/password.js';
    import {refresh} from '../lib/session.js';
    import {t} from '../lib/i18n.js';

    let {params = {}}: {params?: {token?: string}} = $props();

    let password = $state('');
    let repeat = $state('');
    let busy = $state(false);
    let error = $state('');

    const problem = $derived(password.length > 0 ? passwordProblem(password) : null);
    const mismatch = $derived(repeat.length > 0 && password !== repeat);

    async function submit(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();

        if(busy || mismatch || problem !== null || !password)
        {
            return;
        }

        busy = true;
        error = '';

        try
        {
            await api.forgotPasswordChange(params.token ?? '', password);

            // The reset ended every session the account had, this browser's included if it was
            // signed in; the session store has to hear that before the home page renders.
            await refresh();
            notifier.success('PASSWORD_RESET_SUCCESS');
            push('/');
        }
        catch(failure)
        {
            if((failure as api.ApiError)?.status === 404)
            {
                notifier.error('ERROR_PASSWORD_RESET_EXPIRED');
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

<main class="mx-auto max-w-[1200px] px-3 py-6">
    <h1 class="mt-0">{t('PASSWORD_RESET_TITLE')}</h1>

    <!-- `.form.form--left`: 100% → 66% at 532 → 50% from 767. -->
    <form class="relative min-w-0 xs:w-[66%] md:w-1/2" onsubmit={submit}>
        {#if error}
            <FormError inline>{error}</FormError>
        {/if}

        <PasswordNew bind:password bind:repeat {problem} {mismatch}
                     help={t('SITE_PASSWORD_HELP', {min: PASSWORD_MIN_LENGTH})} />

        <!-- `.form__footer`. -->
        <div class="mt-3">
            <Button type="submit" disabled={busy || mismatch || problem !== null || !password}>
                {busy ? '...' : t('FORM_BUTTON_CHANGE')}
            </Button>
        </div>
    </form>
</main>
