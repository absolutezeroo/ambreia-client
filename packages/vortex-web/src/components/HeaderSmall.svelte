<script lang="ts">
    // `common/header/header-small.html`, verbatim in structure:
    //
    //   <header class="header__wrapper wrapper">
    //     <a href="/" class="header__habbo__logo"><h1 class="header__habbo__name">Habbo</h1></a>
    //     <habbo-user-menu habbo-require-session class="header__aside header__aside--user-menu">
    //     <div habbo-require-no-session class="header__aside">
    //       <button class="header__login__button"><span class="header__login__icon">LOGIN</span>
    //   </header>
    //   <habbo-navigation>
    //
    // The signed-out state is a BUTTON that opens a login modal — habbo.com has no sign-in fields in
    // this header at any width. The drawer belongs to the landing page's register banner instead.
    //
    // The logo is visible at every width here (`habbo-header-small .header__habbo__logo` forces
    // `display: block` over the base rule's `none`): the small 116x46 cut below 767, the big 197x73
    // one from 767.
    import {link} from 'svelte-spa-router';
    import Sprite from './Sprite.svelte';
    import UserMenu from './UserMenu.svelte';
    import {signedIn} from '../lib/session.js';
    import {t} from '../lib/i18n.js';

    let {onLogin} = $props();
</script>

<!-- `w-full` is load-bearing next to `mx-auto`: this element is a direct child of #app, which is the
     page's flex column, and `margin-inline: auto` on a flex item overrides `align-self: stretch` —
     without it the header shrinks to its own content and floats in the middle of the page. -->
<!-- `.header__wrapper{position:relative; z-index:200}` against `.navigation{z-index:100}`, and that
     pair is the whole reason the logo works: it is 73px tall with `margin-bottom:-12px`, so it hangs
     BELOW a 70px header and has to paint OVER the navigation it hangs into. Without the stacking the
     navigation wins — it comes later in the document and carries a z-index of its own — and the
     bottom of the wordmark is sliced off by the white bar. -->
<header class="relative z-[200] mx-auto flex h-[70px] w-full max-w-[1200px] items-center px-3">
    <a href="/" use:link class="block hover:border-b-0 md:-mb-3">
        <span class="md:hidden"><Sprite name="logo" label="Vortex Hotel" /></span>
        <span class="hidden md:block"><Sprite name="bigLogo" label="Vortex Hotel" /></span>
    </a>

    <div class="ml-auto {$signedIn ? '-mr-3 self-start' : ''}">
        {#if $signedIn}
            <UserMenu />
        {:else}
            <button type="button" onclick={onLogin}
                    class="rounded-[3px] border-2 border-pill-line bg-pill px-3 py-[5px] font-condensed text-base uppercase text-white shadow-pill">
                <span class="relative block pl-[23px] leading-[22px]">
                    <Sprite name="login" className="absolute left-0 top-1/2 -translate-y-1/2" />
                    {t('LOGIN')}
                </span>
            </button>
        {/if}
    </div>
</header>
