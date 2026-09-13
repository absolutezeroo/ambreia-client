<script lang="ts">
    // `security/safety-lock/safety-lock-modal.html` + `safety-lock-form.html` — the dialog habbo.com
    // puts in front of a risky action when the session has not answered yet:
    //
    //   <h3 class="modal__title" translate="SAFETY_LOCK_TITLE">        "Compte sécurisé"
    //   <div class="modal__content"><form class="form">
    //     <p translate="SAFETY_LOCK_ANSWER">
    //     <div class="form__message form__message--error" translate="ERROR_SAFETY_LOCK_ANSWER">
    //     <fieldset><label translate="{{questions[0].questionKey}}">  <input type="password" …>
    //     <fieldset><label translate="{{questions[1].questionKey}}">  <input type="password" …>
    //     <fieldset class="form__fieldset--box">
    //       <label class="form__label--radiobutton"><input type="radio" ng-value="false">
    //                                               SAFETY_LOCK_SET_TRUSTED_ONCE
    //       <label class="form__label--radiobutton"><input type="radio" ng-value="true">
    //                                               SAFETY_LOCK_SET_TRUSTED_SAVE
    //     <div class="form__footer"><a class="form__cancel">  <button>FORM_BUTTON_UNLOCK
    //
    // The labels ARE the account's two questions — the dialog asks the server which pair it has and
    // renders their keys. Both answers are password fields with the eye, like everywhere else an
    // answer is typed.
    //
    // It is DISMISSIBLE, and that is not an oversight: habbo.com opens it as an offer, not a gate
    // (`Session.isTrusted() ? act() : safetyLockModal.open().then(act)`), so cancelling simply
    // leaves the action undone. The lock stays on until the questions are answered.
    //
    // The error is a `form__message--error` — a full-width crimson bar above the fields, NOT the
    // popover the field-level messages use, because it belongs to the form and not to one input.
    import Modal from './Modal.svelte';
    import Fieldset from './Fieldset.svelte';
    import PasswordField from './PasswordField.svelte';
    import * as api from '../lib/api.js';
    import type {ISafetyQuestions} from '../lib/api.js';
    import {ApiError} from '../lib/api.js';
    import * as notifier from '../lib/notifier.js';
    import {questionLabel} from '../lib/safety.js';
    import {t} from '../lib/i18n.js';

    let {onClose, onDone}: {onClose: () => void; onDone: () => void} = $props();

    let status = $state<ISafetyQuestions | null>(null);
    let answer1 = $state('');
    let answer2 = $state('');
    /** habbo.com's radio pair, and false is the one it starts on. */
    let trust = $state(false);
    let wrong = $state(false);
    let busy = $state(false);

    $effect(() =>
    {
        let cancelled = false;

        void api.getSafetyQuestions()
            .then((answer) => !cancelled && (status = answer))
            .catch(() => !cancelled && onClose());

        return () => (cancelled = true);
    });

    async function unlock(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();

        if(busy || !answer1.trim() || !answer2.trim())
        {
            return;
        }

        busy = true;
        wrong = false;

        try
        {
            await api.unlockSafetyQuestions(answer1, answer2, trust);

            onDone();
            notifier.success('ACCOUNT_SECURITY_DISABLED_OK');
        }
        catch(failure)
        {
            // Only a refused answer gets the in-form bar; anything else is a server problem and
            // belongs in a toast, which is the split habbo.com's own controller makes.
            if(failure instanceof ApiError && failure.code === 'safetylock.invalid_answer')
            {
                wrong = true;
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

<Modal title={t('SAFETY_LOCK_TITLE')} {onClose}>
    <form class="mx-auto mt-6 mb-12 w-full max-w-[280px] px-3" onsubmit={unlock}>
        <p class="mt-0">{t('SAFETY_LOCK_ANSWER')}</p>

        {#if wrong}
            <!-- `.form__message--error`: the crimson bar, full width, with the same 4px drop the
                 popover has. It belongs to the FORM, so it sits above the fields and not under one. -->
            <div class="mb-3 rounded-[3px] bg-error p-3 text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]">
                {t('ERROR_SAFETY_LOCK_ANSWER')}
            </div>
        {/if}

        {#if status?.configured}
            <Fieldset>
                <PasswordField name="safety-lock-answer1" label={questionLabel(status.question1)}
                               bind:value={answer1} autocomplete="off" />
            </Fieldset>

            <Fieldset>
                <PasswordField name="safety-lock-answer2" label={questionLabel(status.question2)}
                               bind:value={answer2} autocomplete="off" />
            </Fieldset>

            <!-- `form__fieldset--box` with two radios. "Juste pour cette fois" trusts the SESSION;
                 "enregistrer cette connexion" also remembers the device, which is the row the
                 settings page can clear. -->
            <Fieldset box>
                <label class="block py-0.5 pl-1" for="trust-once">
                    <input id="trust-once" type="radio" bind:group={trust} value={false} class="mr-1.5 accent-btn" />
                    <span>{t('SAFETY_LOCK_SET_TRUSTED_ONCE')}</span>
                </label>
                <label class="block py-0.5 pl-1" for="trust-save">
                    <input id="trust-save" type="radio" bind:group={trust} value={true} class="mr-1.5 accent-btn" />
                    <span>{t('SAFETY_LOCK_SET_TRUSTED_SAVE')}</span>
                </label>
            </Fieldset>
        {/if}

        <div class="relative mt-6 after:table after:clear-both after:content-['']">
            <a href={'#'} onclick={(event) => { event.preventDefault(); onClose(); }}
               class="absolute top-1/2 left-0 -mt-[0.5em] block leading-none text-white hover:border-b hover:border-solid">
                {t('FORM_CANCEL_LABEL')}
            </a>

            <button type="submit" disabled={busy || !answer1.trim() || !answer2.trim()}
                    class="float-right mb-3 rounded-[5px] border-2 border-btn-line bg-btn px-6 py-3 text-center font-condensed text-base leading-[1.2] uppercase text-white shadow-btn hover:border-b-2 hover:border-btn-line-hover hover:bg-btn-hover active:translate-y-[2px] active:border-btn-line-active active:bg-btn-active active:shadow-btn-active disabled:opacity-40">
                {t('FORM_BUTTON_UNLOCK')}
            </button>
        </div>
    </form>
</Modal>
