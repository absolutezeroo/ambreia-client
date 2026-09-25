<script lang="ts">
    // `security/login/claim-password/claim-password-modal.html` + `claim-password-form.html`: the
    // "Mot de passe oublié" link under the login form opens this, `size: "sm"` (400px). One email
    // field, "Annuler" and "Envoyer"; once sent, the form is replaced by CLAIM_PASSWORD_SUCCESS, the
    // address it went to, and the bold spam-folder note.
    //
    // POST /api/public/forgotPassword/send — habbo.com's own route. It answers the same for an
    // address with no account, so "sent" here means "sent if there is one", exactly as habbo.com's.
    // Any failure is `notifier.error("ERROR_SERVER")`, which is what `ClaimPasswordFormController`
    // does.
    import Modal from './Modal.svelte';
    import Field from './Field.svelte';
    import Button from './Button.svelte';
    import * as api from '../lib/api.js';
    import * as notifier from '../lib/notifier.js';
    import {t} from '../lib/i18n.js';

    let {onClose}: {onClose: () => void} = $props();

    let email = $state('');
    let sent = $state('');
    let busy = $state(false);

    async function send(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();

        if(busy || !email.trim())
        {
            return;
        }

        busy = true;

        try
        {
            sent = (await api.forgotPasswordSend(email.trim())).email;
        }
        catch
        {
            notifier.error('ERROR_SERVER');
        }
        finally
        {
            busy = false;
        }
    }
</script>

<Modal title={t('CLAIM_PASSWORD_TITLE')} width={400} {onClose}>
    <form class="mx-auto mt-6 mb-12 w-full max-w-[280px] px-3" onsubmit={send}>
        {#if !sent}
            <Field name="email-address" type="email" label={t('FORM_ACCOUNT_EMAIL_LABEL')} bind:value={email}
                   autocomplete="email" required />

            <div class="mt-6 flex items-center justify-between">
                <!-- `.form__cancel`: an <a> on habbo.com — see AvatarCreateModal for why a button
                     has to ask for the white and the hover rule itself. -->
                <button type="button" onclick={onClose} class="text-white hover:border-b hover:border-solid">{t('FORM_CANCEL_LABEL')}</button>
                <Button type="submit" disabled={busy || !email.trim()}>
                    {busy ? '...' : t('FORM_BUTTON_SEND')}
                </Button>
            </div>
        {:else}
            <p>{t('CLAIM_PASSWORD_SUCCESS')}</p>
            <!-- `.claim-password__email`: the address, as a heading of its own. -->
            <h4 class="my-3 break-all">{sent}</h4>
            <p><b>{t('CLAIM_PASSWORD_SUCCESS_NOTE')}</b></p>
        {/if}
    </form>
</Modal>
