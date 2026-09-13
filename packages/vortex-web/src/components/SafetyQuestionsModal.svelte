<script lang="ts">
    // `settings/account-security/safety-questions/safety-questions-modal.html` and the
    // `safety-questions-form.html` + `safety-question-form-inputs.html` it wraps. This is what both
    // "Activer le verrouillage de sécurité" and "Editer les questions de sécurité" open:
    //
    //   <h3 class="modal__title" translate="ACCOUNT_SECURITY_TITLE">
    //   <div class="modal__content"><form class="form">
    //     <p translate="ACCOUNT_SECURITY_FORM_DESCRIPTION">
    //     <fieldset class="form__fieldset--box form__fieldset--box-top">
    //       <label …_QUESTION1_LABEL>  <select class="form__select">
    //       <label …_ANSWER1_LABEL>    <input type="password" habbo-password-toggle-mask maxlength=255>
    //     <fieldset class="form__fieldset--box form__fieldset--box-bottom">   … the same for 2 …
    //     <habbo-password-current>
    //     <div class="form__footer"><a class="form__cancel">  <button class="form__submit">SAVE
    //
    // Two boxed fieldsets, `--box-top` and `--box-bottom`, so the pair reads as one panel split by a
    // rule rather than as two panels.
    //
    // The ANSWERS are password fields with the eye, not text fields. That is not decoration: an
    // answer is a secret, and habbo.com treats it as one everywhere — `type="password"` here, in
    // the challenge dialog, and a BCrypt hash on the server.
    //
    // Each select drops the question the OTHER one is showing (habbo.com's `question:` filter), so
    // the pair can never be the same question twice.
    import Modal from './Modal.svelte';
    import Fieldset from './Fieldset.svelte';
    import PasswordField from './PasswordField.svelte';
    import Field from './Field.svelte';
    import FormError from './FormError.svelte';
    import * as api from '../lib/api.js';
    import * as notifier from '../lib/notifier.js';
    import {questionsExcept} from '../lib/safety.js';
    import {t} from '../lib/i18n.js';

    let {question1 = 1, question2 = 2, onClose, onDone}:
    {
        /** The pair already stored, so "Editer" opens on it. Defaults are habbo.com's own first two. */
        question1?: number;
        question2?: number;
        onClose: () => void;
        onDone: () => void;
    } = $props();

    // The initial value on purpose: the dialog opens on the pair the account already has, and from
    // then on the two selects own it. Tracking the props would fight the visitor's own choice.
    // svelte-ignore state_referenced_locally
    let first = $state(question1);
    // svelte-ignore state_referenced_locally
    let second = $state(question2);
    let answer1 = $state('');
    let answer2 = $state('');
    let password = $state('');
    let code = $state('');
    let needsCode = $state(false);
    let error = $state('');
    let busy = $state(false);

    const ready = $derived(answer1.trim() !== '' && answer2.trim() !== '' && password !== '');

    async function save(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();

        if(busy || !ready)
        {
            return;
        }

        busy = true;
        error = '';

        try
        {
            await api.saveSafetyQuestions(first, answer1, second, answer2, password, code.trim() || undefined);

            onDone();
            notifier.success('ACCOUNT_SECURITY_SAVED_OK');
        }
        catch(failure)
        {
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

<Modal title={t('ACCOUNT_SECURITY_TITLE')} {onClose}>
    <!-- `.modal__content` is a 280px column, which is what this form is drawn for. -->
    <form class="mx-auto mt-6 mb-12 w-full max-w-[280px] px-3" onsubmit={save}>
        <p class="mt-0">{t('ACCOUNT_SECURITY_FORM_DESCRIPTION')}</p>

        <!-- `--box-top` and `--box-bottom`: one panel, split. -->
        <Fieldset box>
            <label class="block text-white" for="safety-question-1">{t('ACCOUNT_SECURITY_QUESTION1_LABEL')}</label>
            <select id="safety-question-1" bind:value={first}
                    class="h-[35.2px] w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field focus:border-field-line-focus focus:bg-white focus:outline-none">
                {#each questionsExcept(second) as question (question.id)}
                    <option value={question.id}>{question.label}</option>
                {/each}
            </select>

            <label class="mt-3 block text-white" for="safety-answer-1">{t('ACCOUNT_SECURITY_ANSWER1_LABEL')}</label>
            <PasswordField name="safety-answer-1" bind:value={answer1} autocomplete="off" />
        </Fieldset>

        <Fieldset box>
            <label class="block text-white" for="safety-question-2">{t('ACCOUNT_SECURITY_QUESTION2_LABEL')}</label>
            <select id="safety-question-2" bind:value={second}
                    class="h-[35.2px] w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-base leading-[1.2] text-field-ink shadow-field focus:border-field-line-focus focus:bg-white focus:outline-none">
                {#each questionsExcept(first) as question (question.id)}
                    <option value={question.id}>{question.label}</option>
                {/each}
            </select>

            <label class="mt-3 block text-white" for="safety-answer-2">{t('ACCOUNT_SECURITY_ANSWER2_LABEL')}</label>
            <PasswordField name="safety-answer-2" bind:value={answer2} autocomplete="off" />
        </Fieldset>

        <!-- `<habbo-password-current>`, the same fieldset every page that re-proves the account
             uses. It is what stops a stolen session installing questions of its own. -->
        <Fieldset>
            <PasswordField name="safety-password" label={t('CURRENT_PASSWORD_LABEL')} bind:value={password} />
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

        <div class="relative mt-6 after:table after:clear-both after:content-['']">
            <a href={'#'} onclick={(event) => { event.preventDefault(); onClose(); }}
               class="absolute top-1/2 left-0 -mt-[0.5em] block leading-none text-white hover:border-b hover:border-solid">
                {t('FORM_CANCEL_LABEL')}
            </a>

            <button type="submit" disabled={busy || !ready}
                    class="float-right mb-3 rounded-[5px] border-2 border-btn-line bg-btn px-6 py-3 text-center font-condensed text-base leading-[1.2] uppercase text-white shadow-btn hover:border-b-2 hover:border-btn-line-hover hover:bg-btn-hover active:translate-y-[2px] active:border-btn-line-active active:bg-btn-active active:shadow-btn-active disabled:opacity-40">
                {t('FORM_BUTTON_SAVE')}
            </button>
        </div>
    </form>
</Modal>
