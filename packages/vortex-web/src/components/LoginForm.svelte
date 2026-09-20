<script lang="ts">
    // `security/login/login-form.html`. Three shapes of the same form:
    //
    //   modal   — the full one habbo.com shows in its login modal: a "connect with one of these"
    //             block, then "or use your email & password", two PLACEHOLDER-only inputs, the
    //             "C'est parti!" button, the forgotten-password line and the register line.
    //   compact — the header/banner drawer: the two inputs and the button, nothing else.
    //   plain   — the same as modal without the social block (used on /registration's sibling page).
    //
    // The inputs carry no <label> on habbo.com; the placeholder IS the label (FORM_EMAIL_LABEL /
    // FORM_PASSWORD_LABEL), which is why a label above them reads as a different site.
    //
    // The real sign-in behind it: POST /api/public/authentication/login. Three outcomes, and they
    // are NOT all failures — a 401 whose body says `pocket.auth.mfa_required` is the server asking
    // for the second factor, so the code box appears and the same credentials are posted again.
    // Collapsing that into "wrong password" is how an account with 2FA becomes impossible to open.
    //
    // The social buttons are habbo.com's and this hotel has no provider behind any of them, so they
    // are shown disabled rather than dropped: the block is what makes the modal read as Habbo's, and
    // a button that silently does nothing would be worse than one that says it cannot.
    import {push, link} from 'svelte-spa-router';
    import Button from './Button.svelte';
    import Field from './Field.svelte';
    import * as api from '../lib/api.js';
    import {refresh} from '../lib/session.js';
    import {t} from '../lib/i18n.js';

    let {compact = false, modal = false, banner = false, onDone = undefined} = $props();

    // `banner` is the front page: habbo.com lays the social column and the email column SIDE BY SIDE
    // there, both open, no toggle.
    const social = $derived(modal || banner);

    let email = $state('');
    let password = $state('');
    let code = $state('');
    let mfa = $state(false);
    let busy = $state(false);
    let error = $state('');

    async function submit(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();

        if(busy)
        {
            return;
        }

        busy = true;
        error = '';

        try
        {
            const result = await api.login(email, password, mfa ? code : undefined);

            await refresh();
            onDone?.();

            // An account with no avatar yet: habbo.com's avatar creation is the settings avatars
            // tab, so that is where it has to land.
            push(result?.requiresOnboarding ? '/settings/avatars' : '/');
        }
        catch(failure)
        {
            if(api.needsMfa(failure))
            {
                mfa = true;
            }

            error = (failure as Error)?.message ?? '';
        }
        finally
        {
            busy = false;
        }
    }

    // Each entry carries its OWN text colour: putting `text-white` in a shared base and `text-black`
    // in the Apple entry left Tailwind to decide which won, and it picked white on white.
    const SOCIALS = [
        {key: 'FACEBOOK', class: 'bg-[#4267b2] border-[#5b7bd5] text-white'},
        {key: 'GOOGLE', class: 'bg-[#4285f4] border-[#7baaf7] text-white'},
        {key: 'APPLE_SIGN_IN', class: 'bg-white border-[#d0d0d0] text-black'},
    ];
</script>

<div class="w-full {banner ? 'md:flex md:gap-6' : ''}">
    {#if social}
        <div class="text-center {banner ? 'md:flex-1' : ''}">
            <p class="mt-2.5">{t('LOGIN_HEADER_TEXT')}</p>

            <!-- `.login-form__social`, with the 1px #2a9cde rule habbo.com draws under it. In the
                 banner the two columns sit next to each other, so the rule is not needed there. -->
            <div class="relative mt-3 space-y-1.5 {banner ? '' : 'border-b border-btn-line pb-6'}">
                {#each SOCIALS as entry (entry.key)}
                    <button type="button" disabled
                            class="block w-full rounded-[5px] border-2 px-6 py-3 text-center font-condensed text-sm uppercase opacity-70 shadow-btn {entry.class}"
                            title={t('SITE_SOCIAL_UNAVAILABLE')}>
                        {t(entry.key)}
                    </button>
                {/each}
            </div>
        </div>
    {/if}

    <form class="w-full {banner ? 'md:flex-1' : ''}" onsubmit={submit}>
        {#if social}
            <p class="text-center">{t('LOGIN_USE_EMAIL_PASSWORD')}</p>
        {/if}

        {#if error}
            <p class="my-3 rounded-[3px] bg-error px-3 py-3 text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]">{error}</p>
        {/if}

        <div class="mt-3 w-full {compact ? 'space-y-1.5' : 'space-y-3'}">
            <Field name="login-email" placeholder={t('FORM_EMAIL_LABEL')} bind:value={email}
                   autocomplete="username" className={compact ? '[&_input]:py-0.5' : ''} />
            <Field name="login-password" type="password" placeholder={t('FORM_PASSWORD_LABEL')} bind:value={password}
                   autocomplete="current-password" className={compact ? '[&_input]:py-0.5' : ''} />

            {#if mfa}
                <Field name="login-code" placeholder="000000" bind:value={code} maxlength={6} autocomplete="one-time-code" />
            {/if}

            <Button type="submit" disabled={busy} className="w-full {compact ? 'py-1.5 text-sm' : ''}">
                {busy ? '...' : t('LOGIN_BUTTON')}
            </Button>
        </div>

        {#if !compact}
            <p class="mt-3 text-center">
                <a href="/forgot" use:link onclick={() => onDone?.()}>{t('LOGIN_FORGOT_LABEL')}</a>
            </p>

            <!-- `.login-form__register`: a <small>, not a heading. -->
            <p class="mt-3 text-center">
                <small><a href="/registration" use:link onclick={() => onDone?.()}>{t('LOGIN_REGISTER')}</a></small>
            </p>
        {/if}
    </form>
</div>
