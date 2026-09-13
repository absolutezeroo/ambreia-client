<script>
    // The site shell. habbo.com has TWO headers and picks between them per page
    // (`home.html`: `ng-if="HomeController.hasHeaderLarge()"`): the large one is the signed-out
    // front page — a register pitch over the hotel art — and the small one is every other page.
    //
    // The router is not mounted until the identity probe has answered. That is not a nicety: the
    // route guards in lib/routes.js read the session store synchronously, so mounting first would
    // bounce a signed-in visitor off a guarded page for as long as the probe was in flight.
    import {onMount} from 'svelte';
    import Router, {location, querystring, replace} from 'svelte-spa-router';
    import HeaderSmall from './components/HeaderSmall.svelte';
    import HeaderLarge from './components/HeaderLarge.svelte';
    import LoginModal from './components/LoginModal.svelte';
    import Navigation from './components/Navigation.svelte';
    import Footer from './components/Footer.svelte';
    import Client from './components/Client.svelte';
    import Toasts from './components/Toasts.svelte';
    import {routes} from './lib/routes.js';
    import {refresh, signedIn} from './lib/session.js';

    let status = $state('loading');
    let loginOpen = $state(false);

    // /hotel is the client, full-bleed: habbo.com drops the site chrome around it and so does this.
    const bare = $derived($location === '/hotel');

    // `/hotel?link=navigator/goto/42` — habbo.com's own handover, read here because the client is
    // mounted by the SHELL and not by the route (see below), so the /hotel page never sees its own
    // query string. `querystring` is svelte-spa-router's store for the part after `?` in the hash.
    const startLink = $derived(new URLSearchParams($querystring ?? '').get('link') ?? '');

    // The client is mounted HERE, once, and never by the router — `.client` is parked at
    // `left:-9999px` when hidden and its iframe outlives every navigation, which is why habbo.com's
    // hotel does not have to be relaunched after closing it. Mounting it inside the /hotel route
    // would destroy it on each exit. It is only created once the visitor has actually gone there.
    let clientOpened = $state(false);

    $effect(() =>
    {
        if(bare)
        {
            clientOpened = true;
        }
    });

    const large = $derived($location === '/' && !$signedIn);

    onMount(async () =>
    {
        await refresh();
        status = 'ready';
    });
</script>

{#if status === 'loading'}
    <div class="flex min-h-screen items-center justify-center bg-page">
        <p class="font-condensed uppercase text-ink">Chargement de l'hotel...</p>
    </div>
{:else}
    <!-- Outside every branch below, so navigating away cannot take it down with the page: closing
         the hotel routes back to `/`, the client goes off-screen, and its socket stays up. -->
    {#if clientOpened}
        <Client visible={bare} link={startLink} onClose={() => replace('/')} />
    {/if}

    {#if bare}
        <!-- On /hotel the site's chrome is not rendered at all, exactly as habbo.com's own hotel
             state has nothing but the client. It is not merely covered: `.client` is
             `position: absolute`, so it is anchored to the DOCUMENT, not the viewport — leave a
             header, a navigation and a footer in the page and the document grows past one screen,
             the page scrolls, and the site reappears from under an overlay that stayed at the top.
             The client itself is rendered ABOVE this branch, so hiding the chrome never unmounts it. -->
        <Router {routes} on:conditionsFailed={() => replace('/')} />
    {:else}
    <!-- No outage strip. habbo.com never puts one across the top of the site: when the hotel is
         not open it renders `habbo-hotel-closed` in the two places that need the hotel — the client
         and the registration form (components/HotelClosed.svelte). Everything else keeps working,
         so a crimson band over every page said nothing the visitor could act on. -->
    <!-- `habbo-header-small { background:#069; display:block }` — and `habbo-header-large` has the
         same one. The navigation is INSIDE that element in both templates, which is why the band
         wraps it here too: `.navigation` is `rgba(255,255,255,.9)`, so the 10% it lets through is
         this blue and not the page's navy. Without the wrapper the whole strip sat on
         `--color-page` (#0c3a65) and read a shade too dark and too grey the whole way down. -->
    <div class="w-full bg-[#069]">
        {#if large}
            <HeaderLarge />
        {:else}
            <HeaderSmall onLogin={() => (loginOpen = true)} />
        {/if}

        <Navigation />
    </div>

    <div class="w-full flex-[1_0_auto] overflow-hidden bg-gradient-to-br from-page-top to-page">
        <Router {routes} on:conditionsFailed={() => replace('/')} />
    </div>

    <Footer />

    {#if loginOpen}
        <LoginModal onClose={() => (loginOpen = false)} />
    {/if}
    {/if}
{/if}

<!-- toastr appends `#toast-container` to the BODY, so it is outside every branch above — including
     /hotel, where the site's own chrome is not rendered. A toast raised by the client handover, or
     by a call still in flight when the visitor navigated, still has somewhere to land. -->
<Toasts />
