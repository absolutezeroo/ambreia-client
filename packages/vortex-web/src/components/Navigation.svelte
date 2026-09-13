<script lang="ts">
    // `.navigation`: the white band under the header, 70px tall, its five links spread with
    // `justify-content: space-around`, each an icon above a 12px condensed uppercase label. The
    // icon has three states (idle / hover / active) and swapping it is the point of the sheet —
    // a bar whose icons never change on hover is the usual sign the states were dropped.
    //
    // The bar is centred only on narrow screens. From 767px habbo.com switches
    // `justify-content: space-around` to `flex-start`, left-aligns each label and puts 48px of gap
    // after it (`.navigation__item { text-align: left; padding-right: 48px }`), then pushes the green
    // hotel button to the far right with `margin-left: auto` — and that button does not exist at all
    // below 767 (`.navigation__item--hotel { display: none }`).
    import {link, location} from 'svelte-spa-router';
    import Sprite from './Sprite.svelte';
    import {signedIn} from '../lib/session.js';
    import type {ISpriteName} from '../lib/sprite.js';
    import {t} from '../lib/i18n.js';

    // Order, membership AND labels are `common/header/navigation/navigation.html`'s, not a guess:
    // home, community, SHOP, playing-habbo, NFT — the shop sits third, before "Les clés du jeu" —
    // and each label is the translate key that template names.
    // Each icon is really THREE cuts — idle, hover, active — named by suffix in the sheet, which is
    // what `iconFor` builds. Typing the base against the sheet's own names is what makes a missing
    // `…Hover` or `…Active` cut a compile error here rather than an icon that silently disappears
    // on hover.
    interface INavigationItem
    {
        href: string;
        icon: 'navHome' | 'navCommunity' | 'navShop' | 'navPlaying';
        label: string;
        strict?: boolean;
    }

    const ITEMS: INavigationItem[] = [
        {href: '/', icon: 'navHome', label: t('NAVIGATION_HOME'), strict: true},
        {href: '/community', icon: 'navCommunity', label: t('NAVIGATION_COMMUNITY')},
        {href: '/shop', icon: 'navShop', label: t('NAVIGATION_SHOP')},
        {href: '/playing-habbo', icon: 'navPlaying', label: t('NAVIGATION_PLAYING_HABBO')},
        {href: '/habbo-nft', icon: 'navShop', label: t('NAVIGATION_HABBO_NFT')},
    ];

    function isActive(item: INavigationItem): boolean
    {
        return item.strict ? $location === item.href : $location.startsWith(item.href);
    }

    let hovered = $state('');

    function iconFor(item: INavigationItem): ISpriteName
    {
        if(isActive(item))
        {
            return `${item.icon}Active`;
        }

        return hovered === item.href ? `${item.icon}Hover` : item.icon;
    }
</script>

<nav class="relative z-[100] bg-nav after:absolute after:-bottom-[2px] after:left-0 after:block after:h-[2px] after:w-full after:bg-gradient-to-b after:from-black/30 after:to-transparent after:content-['']">
    <ul class="mx-auto flex h-[70px] w-full max-w-[1200px] items-center justify-around px-3 md:justify-start">
        {#each ITEMS as item (item.href)}
            <li class="px-1.5 text-center md:pr-12 md:pl-0 md:text-left">
                <a href={item.href} use:link
                   onmouseenter={() => (hovered = item.href)}
                   onmouseleave={() => (hovered = '')}
                   class="block font-condensed text-xs uppercase hover:border-b-0 xl:whitespace-nowrap xl:text-2xl {isActive(item) ? 'text-nav-link-active' : 'text-nav-link hover:text-nav-link-hover'}">
                    <!-- Below 1199 the icon sits ABOVE a 12px label, centred; from 1199 the whole
                         bar doubles to 24px and the icon moves BESIDE the label
                         (`display:inline-block; margin-right:6px; vertical-align:middle`). Keeping
                         the small form at every width is why this bar read as undersized. -->
                    <Sprite name={iconFor(item)} className="mx-auto mb-[3px] block xl:mr-1.5 xl:mb-0 xl:inline-block xl:align-middle" />
                    {item.label}
                </a>
            </li>
        {/each}

        <!-- `habbo-require-session`: the way into the hotel only exists once you are signed in. -->
        <li class="{$signedIn ? 'hidden md:ml-auto md:block' : 'hidden'} pr-0">
            <!-- The green arrow-headed button: a rectangle with a triangle pinned to its right
                 edge, built out of two borders exactly as `.hotel-button-native::before/::after`
                 are. Both triangles must recolour with the button or the head desyncs on hover. -->
            <a href="/hotel" use:link
               class="group relative mt-[7px] mr-[19px] mb-3 inline-block rounded-l-[5px] rounded-r-none border-2 border-r border-play-line bg-play px-3 py-1.5 text-center font-condensed text-base leading-[1.2] uppercase text-white drop-shadow-[-1px_4px_0_rgba(0,0,0,0.3)] hover:border-b-2 hover:border-play-line-hover hover:bg-play-hover active:translate-y-[2px] active:border-play-line-active active:bg-play-active active:drop-shadow-[-1px_2px_0_rgba(0,0,0,0.3)]">
                <span class="absolute -top-[2px] -right-[41px] block border-[20px] border-transparent border-l-play-line group-hover:border-l-play-line-hover group-active:border-l-play-line-active"></span>
                <span class="absolute top-0 -right-[36px] block border-[18px] border-transparent border-l-play group-hover:border-l-play-hover group-active:border-l-play-active"></span>
                <span class="relative block pr-[22px] text-right leading-6">
                    <Sprite name="habbo" className="absolute right-0 top-1/2 -translate-y-1/2" />
                    {t('NAVIGATION_NATIVE_HOTEL')}
                </span>
            </a>
        </li>
    </ul>
</nav>
