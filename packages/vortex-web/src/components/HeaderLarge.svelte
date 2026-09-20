<script lang="ts">
    // `common/header/header-large.html` + `home/register-banner/register-banner.html`. The
    // signed-out front page, and it is a REGISTER pitch over the hotel:
    //
    //   .header__top              logo, one line of title, one big REGISTER button
    //   habbo-register-banner     { height: 412px; display:flex; justify-content:right; max-width:1200px }
    //     .register-banner__hotel::after  the artwork — background `backgrounds/hotel.png`, 849x512,
    //                                     `left:-100px; top:-100px`, so it bleeds off two edges
    //     .register-banner__register      the sign-in column, on the right of it
    //   habbo-navigation
    //
    // The artwork is the piece that was missing: this port was drawing the CLIENT's two reception
    // plates (`c_images/reception/*`) instead, which is a different picture entirely — habbo.com has
    // one 849px hotel with its own sky, not two cut-outs on flat navy.
    //
    // The form is OPEN here, not behind a toggle: on a laptop habbo.com shows the social column and
    // the email column side by side, and asks for no click to get to them.
    import Sprite from './Sprite.svelte';
    import Button from './Button.svelte';
    import LoginForm from './LoginForm.svelte';
    import {t} from '../lib/i18n.js';

    const HOTEL = new URL('../assets/hotel.png', import.meta.url).href;

    // Declared, and that matters more than it looks: an undeclared `open` in the markup resolves to
    // `window.open` — a function, so permanently truthy. The drawer then rendered as already-open at
    // every width and its "Se connecter" button, guarded by `{#if !open}`, never appeared at all.
    // Nothing warns: it compiles, it runs, and the only symptom is a phone with no way to sign in.
    let open = $state(false);
</script>

<!-- `.header__top`: solid below 767, translucent black and 100px tall from 767. -->
<div class="w-full bg-topbar md:bg-black/50">
    <div class="mx-auto max-w-[1200px] px-3">
        <div class="min-h-[41px] py-12 text-center md:flex md:max-h-[122px] md:items-center md:justify-between md:gap-6 md:py-1.5">
            <Sprite name="bigLogo" label="Vortex Hotel" className="mx-auto block md:mx-0" />

            <!-- `.register-banner__title`: 400px max, centred. -->
            <h2 class="mx-auto max-w-[400px] md:my-0">{t('HEADER_TITLE')}</h2>

            <!-- `.register-banner__button` is the site's one 20px button. -->
            <Button variant="green" href="/registration" className="text-xl">{t('REGISTER_PROMPT_2')}</Button>
        </div>
    </div>
</div>

<!-- `habbo-register-banner`: 412px tall, 1200 wide, content pushed right. -->
<div class="w-full overflow-hidden bg-[#1f9fd4]">
    <div class="relative mx-auto flex w-full max-w-[1200px] justify-end md:h-[412px]">
        <!-- `.register-banner__hotel::after`: 849px of artwork hanging 100px off the top and left. -->
        <div class="pointer-events-none absolute -top-[100px] -left-[100px] hidden h-[512px] w-[849px] bg-no-repeat [image-rendering:pixelated] md:block"
             style="background-image:url({HOTEL});background-position-y:center"></div>

        <!-- `.register-banner__register`: the sign-in column, over the art.
             It starts as a BUTTON and reveals the form on click —
             `<button ng-click="toggle = true" ng-hide="toggle" class="header__top__toggle">` over
             `<habbo-login-form ng-show="toggle">` — and the stylesheet then hides that toggle from
             767px and forces the form open (`.header__top__toggle { display: none }`,
             `.header__login-form.ng-hide { display: block !important; max-height: none }`).
             A phone gets a button, a laptop gets the open form. Showing the bare form at every width
             left a phone with no "Se connecter" to press at all. -->
        <div class="relative z-10 w-full bg-topbar/90 p-3 text-center md:my-6 md:mr-3 md:w-[540px] md:rounded-[3px] md:text-left">
            {#if !open}
                <button type="button" onclick={() => (open = true)}
                        class="rounded-[3px] border-2 border-pill-line bg-pill px-3 py-[5px] font-condensed text-base uppercase text-white shadow-pill md:hidden">
                    {t('LOGIN')}
                </button>
            {/if}

            <div class="{open ? 'block' : 'hidden'} md:block">
                <LoginForm banner />
            </div>
        </div>
    </div>
</div>
