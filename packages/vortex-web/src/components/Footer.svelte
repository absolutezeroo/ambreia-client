<script lang="ts">
    // `common/footer/footer.html`, labels and all. Two layouts:
    //
    //  - below 767: everything centred, socials in a row above the links, Sulake mark centred.
    //  - from 767: the socials float LEFT beside the links (12px/6px padding), the text goes
    //    left-aligned with 87px of right padding, and the Sulake mark is pinned to the top right of
    //    that padding — which is what the 87px is reserving.
    //
    // The separator between the links is habbo.com's own U+2044 FRACTION SLASH, dropped after the
    // last item.
    //
    // THE LIST IS NOT A CHOICE. `angular.module("footer").constant("FOOTER_LINKS", [...])` names
    // eight keys in this order, and the template appends a ninth for the cookie preferences. This
    // port had five, two of which (`FOOTER_TERMS`, `FOOTER_HABBO_WAY`) are not habbo.com keys at
    // all — so the footer advertised pages habbo.com does not link here and omitted the support,
    // advertising, cookie and DSA entries it does.
    //
    // Every entry's URL is its own `_LINK` twin in fr.json, which is why there is no map of paths
    // here: `FOOTER_SAFETY_LINK` is `/playing-habbo/safety` and `FOOTER_ADVERTISERS_LINK` is a
    // `mailto:`, and the difference is data, not code. A path that starts with `/` routes inside the
    // SPA; anything else opens a tab.
    import {link} from 'svelte-spa-router';
    import Sprite from './Sprite.svelte';
    import {t} from '../lib/i18n.js';

    // `as const` so each name narrows to the sheet's own union rather than widening to `string`:
    // `Sprite` refuses a name the sheet cannot draw, and a bare array would hide a typo here behind
    // a 0x0 span.
    const SOCIALS = ['facebook', 'twitter', 'youtube', 'instagram', 'rss'] as const;

    const LINKS = [
        'FOOTER_SUPPORT',
        'FOOTER_SAFETY',
        'FOOTER_PARENTS',
        'FOOTER_TOS',
        'FOOTER_PRIVACY',
        'FOOTER_ADVERTISERS',
        'FOOTER_COOKIES',
        'FOOTER_DSA',
    ];

    const year = new Date().getFullYear();

    function href(key: string): string
    {
        return t(`${key}_LINK`);
    }

    function internal(url: string): boolean
    {
        return url.startsWith('/');
    }
</script>

<!-- `habbo-footer{background:#001726; padding:12px 0}` — its own near-black band, NOT the top bar's
     `#00334c`, which is what this port was painting it. -->
<footer class="w-full shrink-0 bg-[#001726] py-3">
    <div class="mx-auto max-w-[1200px] px-3">
        <div class="relative py-6">
            <div class="py-3 text-center md:float-left md:pr-3 md:text-left">
                <!-- `.footer__media__label{margin:0}` and nothing else: no condensed face, no
                     uppercase. It reads "Suivre Habbo", not "SUIVRE HABBO". -->
                <p class="m-0">{t('FOLLOW_HABBO')}</p>
                {#each SOCIALS as social (social)}
                    <span class="inline-block p-3 md:px-1.5 md:py-3">
                        <a href="#/community" class="block hover:border-b-0"><Sprite name={social} label={social} /></a>
                    </span>
                {/each}
            </div>

            <div class="relative text-center md:pt-3 md:pr-[87px] md:pl-3 md:text-left">
                <p>
                    {#each LINKS as key, index (key)}
                        <span class="inline text-sm leading-[1.4] text-footer-link">
                            {#if internal(href(key))}
                                <a href={href(key)} use:link class="whitespace-nowrap text-inherit">{t(key)}</a>
                            {:else}
                                <a href={href(key)} target="_blank" rel="noopener noreferrer" class="whitespace-nowrap text-inherit">{t(key)}</a>
                            {/if}
                            <span class="mx-3 inline-block">&#8260;</span>
                        </span>
                    {/each}

                    <!-- The ninth entry is in the template rather than the constant, because it
                         opens the consent manager instead of navigating. Nothing here has one, so it
                         is the one link with no `_LINK` twin and it points at the cookie policy. -->
                    <span class="inline text-sm leading-[1.4] text-footer-link">
                        <a href={t('FOOTER_COOKIES_LINK')} target="_blank" rel="noopener noreferrer" class="whitespace-nowrap text-inherit">{t('FOOTER_COOKIE_PREFERENCES')}</a>
                    </span>
                </p>

                <Sprite name="sulake" label="Sulake" className="mx-auto my-3 block md:absolute md:top-0 md:right-0 md:my-0" />

                <p class="text-xs text-footer-copy">{t('FOOTER_COPYRIGHT', {year})}</p>
            </div>
        </div>
    </div>
</footer>
