<script lang="ts">
    // `/registration` — `registration/registration-form.html`. Two columns, not a centred card:
    //
    //   left  (.form--left, 66% from 532px)   h1, then the fieldsets, then the big blue submit
    //   right                                 the social block over `teaser_registration`
    //
    // The fieldsets alternate plain and boxed (`.form__fieldset--box`, #103960): e-mail plain,
    // password boxed, birthdate plain, profile visibility boxed. Each carries a LABEL and a
    // paragraph of help above the field — habbo.com explains every box, which is most of why its
    // registration page looks the way it does.
    //
    // The e-mail is split in two inputs either side of an `@`
    // (`.registration-form__email-local-part` / `__email-domain`), reassembled before posting.
    //
    // What the emulator takes is `{email, password, passwordRepeated}` and nothing else — so the
    // birthdate, the profile visibility and the newsletter box are rendered (they are habbo.com's
    // form) but NOT sent, and the comment on each says so rather than implying they save.
    import {push, link} from 'svelte-spa-router';
    import Button from '../components/Button.svelte';
    import HotelClosed from '../components/HotelClosed.svelte';
    import * as api from '../lib/api.js';
    import {refresh, outage} from '../lib/session.js';
    import {t} from '../lib/i18n.js';

    const TEASER = new URL('../assets/teaser_registration.png', import.meta.url).href;

    let local = $state('');
    let domain = $state('');
    let password = $state('');
    let repeat = $state('');
    let day = $state('');
    let month = $state('');
    let year = $state('');
    let publicProfile = $state(false);
    let terms = $state(false);
    let marketing = $state(false);
    let busy = $state(false);
    let error = $state('');

    const email = $derived(local && domain ? `${local}@${domain}` : '');
    const mismatch = $derived(repeat.length > 0 && password !== repeat);

    // habbo.com's own rule, from `habbo-password-pattern`: at least 6 characters, at least one
    // letter, and at least one digit or special character.
    const weak = $derived(password.length > 0
        && (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9\W]/.test(password)));

    const DAYS = Array.from({length: 31}, (unused, index) => index + 1);
    const MONTHS = Array.from({length: 12}, (unused, index) => index + 1);
    const YEARS = Array.from({length: 90}, (unused, index) => new Date().getFullYear() - 16 - index);

    const SOCIALS = [
        {key: 'FACEBOOK', class: 'bg-[#4267b2] border-[#5b7bd5] text-white'},
        {key: 'GOOGLE', class: 'bg-[#4285f4] border-[#7baaf7] text-white'},
        {key: 'APPLE_SIGN_IN', class: 'bg-white border-[#d0d0d0] text-black'},
    ];

    async function submit(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();

        if(busy || mismatch || weak || !terms || !email)
        {
            return;
        }

        busy = true;
        error = '';

        try
        {
            await api.register(email, password, repeat);
            await refresh();

            // A new account owns no avatar; habbo.com's avatar creation is the settings avatars tab.
            push('/settings/avatars');
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

<main class="mx-auto max-w-[1200px] px-3 py-6">
    {#if $outage}
        <!-- `registration.html`: `<habbo-hotel-closed ng-if="!RegistrationController.isOpen"
             class="main">` — the form is not rendered at all while the hotel is shut, because an
             account cannot be created without the server that would hold it. -->
        <HotelClosed reason={$outage} />
    {:else}
    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <!-- `.form--left` -->
        <form class="min-w-0 lg:w-[62%]" onsubmit={submit}>
            <h1 class="mt-0">{t('REGISTRATION_TITLE')}</h1>

            {#if error}
                <p class="my-3 rounded-[3px] bg-error px-3 py-3 text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]">{error}</p>
            {/if}

            <!-- e-mail: plain fieldset, split input. -->
            <fieldset class="my-6 px-3">
                <label class="block text-white" for="email-local-part">{t('FORM_EMAIL_LABEL')}</label>
                <p class="mt-3">{t('EMAIL_NEW_HELP')}</p>

                <div class="mt-3 flex items-center gap-1.5">
                    <input id="email-local-part" bind:value={local} autocomplete="off" autocapitalize="none" spellcheck="false"
                           class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-field-ink shadow-field focus:border-field-line-focus focus:bg-white focus:outline-none" />
                    <span class="shrink-0 text-white">@</span>
                    <input id="email-domain" bind:value={domain} autocomplete="off" autocapitalize="none" spellcheck="false"
                           class="w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-field-ink shadow-field focus:border-field-line-focus focus:bg-white focus:outline-none" />
                </div>
            </fieldset>

            <!-- password: `.form__fieldset--box` (#103960). -->
            <fieldset class="my-6 rounded-[3px] bg-box p-3">
                <label class="block text-white" for="password-new">{t('NEW_PASSWORD_LABEL')}</label>
                <p class="mt-3">{t('PASSWORD_CHANGE_HELP')}</p>

                <input id="password-new" type="password" bind:value={password} autocomplete="new-password"
                       class="mt-3 w-full rounded-[5px] border-[3px] bg-field px-3 py-[5px] text-field-ink shadow-field focus:bg-white focus:outline-none {weak ? 'border-error' : 'border-field-line focus:border-field-line-focus'}" />

                {#if weak}
                    <p class="mt-1.5 text-sm text-white">
                        Trop facile, le mot de passe doit utiliser au moins une lettre et un caractère spécial ou chiffre.
                    </p>
                {/if}

                <label class="mt-3 block text-white" for="password-repeat">{t('PASSWORD_REPEAT_LABEL')}</label>
                <input id="password-repeat" type="password" bind:value={repeat} autocomplete="new-password"
                       class="mt-1.5 w-full rounded-[5px] border-[3px] bg-field px-3 py-[5px] text-field-ink shadow-field focus:bg-white focus:outline-none {mismatch ? 'border-error' : 'border-field-line focus:border-field-line-focus'}" />

                {#if mismatch}
                    <p class="mt-1.5 text-sm text-white">Les deux mots de passe ne sont pas identiques.</p>
                {/if}
            </fieldset>

            <!-- birthdate: three selects. NOT sent — the web API takes no birthdate. -->
            <fieldset class="my-6 px-3">
                <label class="block text-white" for="birthdate-day">{t('FORM_BIRTHDATE_LABEL')}</label>
                <p class="mt-3">{t('BIRTHDATE_HELP')}</p>

                <div class="mt-3 flex flex-wrap gap-3">
                    <select id="birthdate-day" bind:value={day}
                            class="h-[35px] rounded-[5px] border-[3px] border-field-line bg-field px-3 text-field-ink shadow-field">
                        <option value="">{t('BIRTHDATE_DAY')}</option>
                        {#each DAYS as value}<option {value}>{value}</option>{/each}
                    </select>
                    <select bind:value={month}
                            class="h-[35px] rounded-[5px] border-[3px] border-field-line bg-field px-3 text-field-ink shadow-field">
                        <option value="">{t('BIRTHDATE_MONTH')}</option>
                        {#each MONTHS as value}<option {value}>{value}</option>{/each}
                    </select>
                    <select bind:value={year}
                            class="h-[35px] rounded-[5px] border-[3px] border-field-line bg-field px-3 text-field-ink shadow-field">
                        <option value="">{t('BIRTHDATE_YEAR')}</option>
                        {#each YEARS as value}<option {value}>{value}</option>{/each}
                    </select>
                </div>
            </fieldset>

            <!-- profile visibility: boxed. Also not sent; the client's own settings own it. -->
            <fieldset class="my-6 rounded-[3px] bg-box p-3">
                <label class="block text-white" for="profile-public">Confidentialité du Profil</label>
                <p class="mt-3">{t('PROFILE_VISIBILITY_INFO')}</p>

                <label class="mt-3 flex items-start gap-3" for="profile-public">
                    <input id="profile-public" type="checkbox" bind:checked={publicProfile} class="mt-1" />
                    <span>{t('PROFILE_VISIBILITY_PUBLIC_OPTION')}</span>
                </label>
            </fieldset>

            <fieldset class="my-6 space-y-3 px-3">
                <label class="flex items-start gap-3" for="terms">
                    <input id="terms" type="checkbox" bind:checked={terms} class="mt-1" required />
                    <span>
                        J'accepte
                        <a href="/terms" use:link>Conditions d'utilisation</a>,
                        <a href="/privacy" use:link>Politique de confidentialité</a>.
                    </span>
                </label>

                <label class="flex items-start gap-3" for="marketing">
                    <input id="marketing" type="checkbox" bind:checked={marketing} class="mt-1" />
                    <span>{t('POLICIES_MARKETING')}</span>
                </label>
            </fieldset>

            <p class="px-3">
                Bienvenue sur Habbo! Amuse toi bien
                <a href="/playing-habbo/safety" use:link>et fais attention à toi</a> !
            </p>

            <div class="mt-6 px-3">
                <Button type="submit" disabled={busy || mismatch || weak || !terms || !email} className="w-full">
                    {busy ? '...' : t('REGISTRATION_BUTTON')}
                </Button>
                <p class="mt-3 text-sm">{t('REGISTRATION_PURCHASES')}</p>
            </div>
        </form>

        <!-- The social column, over habbo.com's own registration illustration. -->
        <aside class="relative min-w-0 lg:w-[38%]">
            <img src={TEASER} alt="" class="pointer-events-none absolute top-0 right-0 hidden max-w-none lg:block" />

            <div class="relative z-10 rounded-[3px] bg-topbar/90 p-3 lg:mt-6 lg:mr-24 lg:w-[320px]">
                <h3 class="mt-0">{t('REGISTRATION_SOCIAL')}</h3>

                <div class="space-y-1.5">
                    {#each SOCIALS as entry (entry.key)}
                        <button type="button" disabled
                                class="block w-full rounded-[5px] border-2 px-6 py-3 text-center font-condensed text-sm uppercase opacity-70 shadow-btn {entry.class}"
                                title="Aucun fournisseur externe sur cet hotel">
                            {t(entry.key)}
                        </button>
                    {/each}
                </div>
            </div>
        </aside>
    </div>
    {/if}
</main>
