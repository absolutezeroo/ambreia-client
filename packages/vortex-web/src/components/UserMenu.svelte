<script lang="ts">
    // habbo.com's `.user-menu`: a 190px block holding the name pill, the round avatar well that
    // overlaps the header, and a dropdown that opens BEHIND the header (the list's first item is
    // padded 70px down so it clears it) against a black 90% panel.
    import {link, location, push} from 'svelte-spa-router';
    import Sprite from './Sprite.svelte';
    import Avatar from './Avatar.svelte';
    import {me, signOut} from '../lib/session.js';
    import * as notifier from '../lib/notifier.js';
    import type {ISpriteName} from '../lib/sprite.js';
    import {t} from '../lib/i18n.js';

    let open = $state(false);

    // `user-menu.html`: profile, settings, help, logout — in that order, with those keys.
    //
    // The hotel entry is an ADDITION, not a port: habbo.com's menu has no such item because its way
    // in is the green button in the navigation — and that button is `display: none` below 767px
    // (`.navigation__item--hotel`), which leaves a phone with no way into the hotel at all. So this
    // menu carries one. The label is still habbo.com's own word for the action
    // (`NAVIGATION_NATIVE_HOTEL`), and the icon the same sprite cut its green button uses.
    //
    // It is hidden from 767px, the exact width at which the green button appears, so the menu a
    // laptop opens is habbo.com's own four rows and the addition only exists where it is the only
    // way in. Shown at every width it was a second door next to a visible first one.
    const ITEMS: {href: string; icon: ISpriteName; label: string; added?: boolean}[] = [
        {href: '/hotel', icon: 'habbo', label: t('NAVIGATION_NATIVE_HOTEL'), added: true},
        {href: '/profile', icon: 'profile', label: t('NAVIGATION_PROFILE')},
        {href: '/settings', icon: 'settings', label: t('NAVIGATION_SETTINGS')},
        {href: '/help', icon: 'help', label: t('NAVIGATION_HELP')},
    ];

    async function handleSignOut()
    {
        open = false;

        // `UserMenuController.logout()` is one line and a catch:
        //   security.logout().catch(function () {
        //       notifier.errorSticky("ERROR_LOGOUT_TITLE", "ERROR_LOGOUT_TEXT") })
        //
        // A failed sign-out is the one message on the site that must not clear itself, which is why
        // habbo.com reaches for the sticky variant here: `signOut()` empties the stores either way,
        // so the header says "signed out" while the server's cookie may still be alive — and
        // ERROR_LOGOUT_TEXT is what tells the visitor to clear it themselves. A toast that faded
        // after twenty seconds would leave them looking signed out and not being.
        try
        {
            await signOut();
        }
        catch
        {
            notifier.errorSticky('ERROR_LOGOUT_TITLE', 'ERROR_LOGOUT_TEXT');
        }

        push('/');
    }
</script>

<!-- `event.target` is an EventTarget, not an Element: a click delivered to the document itself, or
     to a text node, has no `closest` and this threw. It never surfaced because the menu is usually
     closed, so the branch is only reached while it is open — but a `TypeError` in a window listener
     takes the whole handler down, and this one is the only thing that closes the menu. -->
<svelte:window onclick={(event) =>
{
    const target = event.target instanceof Element ? event.target : null;

    if(open && !target?.closest('[data-user-menu]'))
    {
        open = false;
    }
}} />

<div class="relative w-[190px]" data-user-menu>
    <!-- The list is a sibling of the toggle and sits under it: z-200 against the header's z-500.

         habbo.com's `.user-menu__list` caps at 240px, which fits ITS four rows under the 70px of top
         padding that clears the header. The hotel entry makes five, so the cap follows — left at 240
         it silently clipped "Se déconnecter" off the bottom. -->
    <div class="absolute top-0 left-0 z-[200] w-full overflow-hidden rounded-[10px] bg-black/90 transition-[max-height,opacity] duration-200 ease-out"
         style="max-height:{open ? '280px' : '0'};opacity:{open ? 1 : 0}">
        <!-- The 70px that clears the header is habbo.com's `.user-menu__item:first-child`, moved
             onto the list: `:first-child` is structural and does not care that the hotel row is
             `display:none` from 767px, so left on the row it would have gone on being applied to a
             hidden one and dropped the clearance for every width that shows four items. -->
        <ul class="pt-[69px] pb-3">
            {#each ITEMS as item (item.href)}
                <li class="px-3 pt-[1px] {item.added ? 'md:hidden' : ''}">
                    <a href={item.href} use:link onclick={() => (open = false)}
                       class="relative block py-1.5 pl-6 font-condensed leading-[22px] uppercase hover:border-b-0 {$location === item.href ? 'text-nav-link-active' : 'text-white hover:text-nav-link-hover'}">
                        <Sprite name={item.icon} className="absolute left-0 top-1/2 -translate-y-1/2" />
                        {item.label}
                    </a>
                </li>
            {/each}
            <li class="px-3 pt-[1px]">
                <button type="button" onclick={handleSignOut}
                        class="relative block w-full py-1.5 pl-6 text-left font-condensed leading-[22px] text-white uppercase hover:text-nav-link-hover">
                    <Sprite name="logout" className="absolute left-0 top-1/2 -translate-y-1/2" />
                    {t('NAVIGATION_LOGOUT')}
                </button>
            </li>
        </ul>
    </div>

    <!-- `.user-menu__toggle` is ONE control, and the head is INSIDE it:
         `<a ng-click="toggle = !toggle" class="user-menu__toggle"><div class="user-menu__name__wrapper">
         …</div><habbo-imager class="user-menu__avatar">`. Clicking the head opens the menu — it
         links nowhere, and the profile is a row in the menu that opens. This port hung an
         `<a href="/profile">` on the head instead, so every click that landed a few pixels off the
         pill navigated away rather than opening anything. -->
    <button type="button" onclick={() => (open = !open)}
            class="relative z-[201] flex h-[70px] items-center">
        <span class="block w-[145px] shrink-0 rounded-[3px] border-2 border-pill-line bg-pill py-[5px] pr-[39px] pl-3 font-condensed text-white uppercase shadow-pill xs:w-[171px]">
            <span class="relative block truncate pl-6 text-right leading-[22px] normal-case">
                <Sprite name="caret" className="absolute left-0 top-1/2 -translate-y-1/2 transition-transform duration-300 {open ? 'rotate-180' : ''}" />
                {$me?.name ?? 'Habbo'}
            </span>
        </span>

        <!-- The head OVERLAPS the pill — that is what the pill's 39px of right padding is reserving
             (`.user-menu__name__wrapper { padding: 5px 39px 5px 12px }`), and it is why the name is
             right-aligned inside it. Pulling the well back over that padding is the whole trick: sat
             beside the pill instead, the two read as two separate controls. -->
        <Avatar user={$me?.name ?? ''} figure={$me?.figureString ?? ''} well={46} className="-ml-[33px] shadow-pill" />
    </button>
</div>
