<script lang="ts">
    // `/registration` — `registration/registration-form.html`. An `<h1>`, then a NARROW form with
    // the social block parked beside it:
    //
    //   .form--left        100% → 66% (532) → 50% (767) → 33% (959)
    //   the social block   the form's own first child, absolute at right:-100% from 959px, so it
    //                      sits exactly one form-width over; in flow with margin-top:24px below
    //
    // The fieldsets alternate plain and boxed (`.form__fieldset--box`, #103960): e-mail plain,
    // password boxed, birthdate plain, profile visibility boxed. Each carries a LABEL and a
    // paragraph of help above the field — habbo.com explains every box, which is most of why its
    // registration page looks the way it does.
    //
    // What the emulator takes is `{email, password, passwordRepeated}` and nothing else — so the
    // birthdate, the profile visibility and the newsletter box are rendered (they are habbo.com's
    // form) but NOT sent, and the comment on each says so rather than implying they save.
    import {push} from 'svelte-spa-router';
    import Button from '../components/Button.svelte';
    import HotelClosed from '../components/HotelClosed.svelte';
    import PasswordNew from '../components/PasswordNew.svelte';
    import * as api from '../lib/api.js';
    import {passwordProblem, emailProblem, PASSWORD_MIN_LENGTH} from '../lib/password.js';
    import {refresh, outage} from '../lib/session.js';
    import {t, tSite} from '../lib/i18n.js';

    const TEASER = new URL('../assets/teaser_registration.png', import.meta.url).href;

    let email = $state('');
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

    const mismatch = $derived(repeat.length > 0 && password !== repeat);

    // Six messages, not one boolean — and calibrated on the SERVER's floor of eight rather than
    // habbo.com's six, which is what `RegisterAsync` actually refuses under. The address is passed
    // in so "contains your e-mail" can be answered here rather than after the round trip.
    const problem = $derived(password.length > 0 ? passwordProblem(password, {email}) : null);
    const emailError = $derived(email ? emailProblem(email) : null);

    const DAYS = Array.from({length: 31}, (unused, index) => index + 1);
    // `birthdate.html` renders `<option ng-value="{{month.value}}" translate="{{month.translationKey}}">`
    // — the month's NAME, not its number. fr.json carries all twelve (`MONTH_JANUARY` … ), and the
    // value posted stays 1-12, so only the label changes.
    const MONTHS = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
    ].map((name, index) => ({value: index + 1, label: `MONTH_${name}`}));
    const YEARS = Array.from({length: 90}, (unused, index) => new Date().getFullYear() - 16 - index);

    const SOCIALS = [
        {key: 'FACEBOOK', class: 'bg-[#4267b2] border-[#5b7bd5] text-white'},
        {key: 'GOOGLE', class: 'bg-[#4285f4] border-[#7baaf7] text-white'},
        {key: 'APPLE_SIGN_IN', class: 'bg-white border-[#d0d0d0] text-black'},
    ];

    async function submit(event: SubmitEvent): Promise<void>
    {
        event.preventDefault();

        if(busy || mismatch || problem !== null || emailError !== null || !password || !terms || !email)
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
    <div class="relative">
        <!-- The `<h1>` is OUTSIDE the form on habbo.com, above it and full width. -->
        <h1 class="mt-0">{t('REGISTRATION_TITLE')}</h1>

        <!-- `.form.form--left.registration-form`. The whole ladder, not just its first rung:
             100% → 66% at 532 → 50% at 767 → 33% at 959. (`.main .form--left` is 50% at 959, but
             `registration.html` puts the form straight into `<main class="wrapper wrapper--content">`
             without the `.main` section, so 33% is the one that applies.) This was a flat 62%,
             which made the form nearly twice habbo.com's width on any desktop and left the social
             block nowhere to go but on top of it. -->
        <form class="relative min-w-0 xs:w-[66%] md:w-1/2 lg:w-[33%]" onsubmit={submit}>
            <!-- `.registration-form__social__wrapper` is the FORM'S first child, and from 959px it
                 is `position:absolute; right:-100%; width:100%` against `.registration-form`'s own
                 `position:relative` — so it lands exactly one form-width to the right, never over
                 it. Below 959 it is in flow with `margin-top:24px`. This was an `<aside>` beside
                 the form in a flex row, which is what put it on top of the fields. -->
            <div class="relative z-10 mt-6 lg:absolute lg:top-0 lg:right-[-100%] lg:mt-0 lg:w-full">
                <!-- `.registration-form__social{background:rgba(0,0,0,.5); border-radius:3px;
                     display:inline-block; padding:12px}` + `margin-left:48px` from 959. It was
                     `bg-topbar/90` at a fixed 320px with a 96px right margin — none of which is a
                     rule on the sheet. -->
                <div class="inline-block rounded-[3px] bg-black/50 p-3 lg:ml-12">
                    <!-- `.registration-form__connect{padding-left:12px}` -->
                    <h3 class="mt-0 pl-3">{t('REGISTRATION_SOCIAL')}</h3>

                    <div class="space-y-1.5">
                        {#each SOCIALS as entry (entry.key)}
                            <button type="button" disabled
                                    class="block w-full rounded-[5px] border-2 px-6 py-3 text-center font-condensed text-sm uppercase opacity-70 shadow-btn {entry.class}"
                                    title={t('SITE_SOCIAL_UNAVAILABLE')}>
                                {t(entry.key)}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            {#if error}
                <p class="my-3 rounded-[3px] bg-error px-3 py-3 text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]">{error}</p>
            {/if}

            <!-- e-mail: plain fieldset, ONE `type="email"` input — `<habbo-email-address>`, which
                 is what `registration-form.html` renders by default.

                 This was a split local-part/@/domain pair, which is a different branch of the same
                 template: `ng-if="RegistrationFormController.useDomainRestrictedEmailInput"`, the
                 shape habbo.com gives a hotel that only accepts addresses on a fixed domain. It is
                 off unless an email-domain policy says otherwise, and this emulator has no such
                 setting at all — so the port was rendering the exceptional form as the normal one. -->
            <fieldset class="my-3 px-3">
                <label class="block text-white" for="email-address">{t('FORM_EMAIL_LABEL')}</label>
                <p class="mt-3">{t('EMAIL_NEW_HELP')}</p>

                <input id="email-address" type="email" bind:value={email} autocomplete="off" autocapitalize="none" spellcheck="false"
                       class="mt-3 w-full rounded-[5px] border-[3px] border-field-line bg-field px-3 py-[5px] text-field-ink shadow-field focus:border-field-line-focus focus:bg-white focus:outline-none" />

                <!-- `email-address.html` names three messages for this field: invalid, already used
                     at registration, already used at change. Only the first can be answered here —
                     the other two are the SERVER's to know, and lib/api.ts words them off the
                     refusal it sends back. -->
                {#if emailError}
                    <p class="mt-1.5 text-sm text-error">{emailError}</p>
                {/if}
            </fieldset>

            <!-- `<habbo-password-new>`: two joined boxes, the eye on both fields, and the strength
                 meter in a popover that leaves the flow at 767px. This page and the password-change
                 page each had their own copy of it, which is how they drifted. -->
            <PasswordNew bind:password bind:repeat {problem} {mismatch}
                         help={t('SITE_PASSWORD_HELP', {min: PASSWORD_MIN_LENGTH})} />

            <!-- birthdate: three selects. NOT sent — the web API takes no birthdate. -->
            <fieldset class="my-3 px-3">
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
                        {#each MONTHS as entry (entry.value)}<option value={entry.value}>{t(entry.label)}</option>{/each}
                    </select>
                    <select bind:value={year}
                            class="h-[35px] rounded-[5px] border-[3px] border-field-line bg-field px-3 text-field-ink shadow-field">
                        <option value="">{t('BIRTHDATE_YEAR')}</option>
                        {#each YEARS as value}<option {value}>{value}</option>{/each}
                    </select>
                </div>
            </fieldset>

            <!-- profile visibility: boxed. Also not sent; the client's own settings own it. -->
            <fieldset class="my-3 rounded-[3px] bg-box p-3">
                <label class="block text-white" for="profile-public">{t('SETTINGS_PROFILE_VISIBILITY_TITLE')}</label>
                <p class="mt-3">{t('PROFILE_VISIBILITY_INFO')}</p>

                <label class="mt-3 flex items-start gap-3" for="profile-public">
                    <input id="profile-public" type="checkbox" bind:checked={publicProfile} class="mt-1" />
                    <span>{t('PROFILE_VISIBILITY_PUBLIC_OPTION')}</span>
                </label>
            </fieldset>

            <fieldset class="my-3 space-y-3 px-3">
                <!-- `policies.html`'s required checkbox. The sentence, its three links and their
                     destinations are all inside `POLICIES_TERMS_OF_SERVICE` — this had the French
                     hand-written around two invented routes (`/terms`, `/privacy`), where the key
                     points at `/playing-habbo/terms-of-service` and `/playing-habbo/privacy-notice`,
                     which is where the footer sends people too. `tSite` is what drops habbo.fr's
                     origin off them; the cookie policy has no page here and stays external. -->
                <label class="flex items-start gap-3" for="terms">
                    <input id="terms" type="checkbox" bind:checked={terms} class="mt-1" required />
                    <span>{@html tSite('POLICIES_TERMS_OF_SERVICE')}</span>
                </label>

                <label class="flex items-start gap-3" for="marketing">
                    <input id="marketing" type="checkbox" bind:checked={marketing} class="mt-1" />
                    <span>{t('POLICIES_MARKETING')}</span>
                </label>
            </fieldset>

            <!-- `.registration-form__safety`, and habbo.com's own key carries its own <a> to the
                 safety page — which is why this had been hand-written around a link instead. The
                 hotel's name comes from fr.json with the rest of it. -->
            <p class="px-3">{@html t('REGISTRATION_SAFETY')}</p>

            <div class="mt-6 px-3">
                <Button type="submit" disabled={busy || mismatch || problem !== null || emailError !== null || !password || !terms || !email} className="w-full">
                    {busy ? '...' : t('REGISTRATION_BUTTON')}
                </Button>
                <p class="mt-3 text-sm">{t('REGISTRATION_PURCHASES')}</p>
            </div>
        </form>

        <!-- habbo.com's registration illustration. It is in none of the templates and in no rule on
             the sheet — it is served as page art beside the form — so it is placed here rather than
             cited: pinned to the right third, behind everything, and gone below 959 where the form
             takes the full width. -->
        <img src={TEASER} alt="" class="pointer-events-none absolute top-0 right-0 z-0 hidden max-w-none lg:block" />
    </div>
    {/if}
</main>
