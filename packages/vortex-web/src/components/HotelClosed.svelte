<script lang="ts">
    // `common/hotel-closed/hotel-closed.html`, styled off `habbo-hotel-closed` / `.hotel-closed`.
    //
    // habbo.com has NO site-wide error strip. When the hotel is not open it renders this box, and
    // only in the two places that actually need the hotel: the client
    // (`hotel/client-common/client-closed/client-closed.html` is literally nothing but
    // `<habbo-hotel-closed>`) and the registration form (`registration.html`,
    // `ng-if="!RegistrationController.isOpen"`). Everything else — news, shop, the CMS pages — has
    // nothing to ask the server for and is left alone.
    //
    //   habbo-hotel-closed    { border-radius:10px; padding:24px 12px; background-color:#151124;
    //                           color:#b996ee; display:block }   (padding-x 24 from 532px)
    //   .hotel-closed::before   Frank asleep, 118x88, centred above the text — and from 767px
    //                           absolutely positioned in the top RIGHT corner instead
    //   .hotel-closed__list   { list-style-type:disc; margin:12px 0; padding-left:26px }
    import {link} from 'svelte-spa-router';
    import {t} from '../lib/i18n.js';

    // The reason the server gave, when there is one. habbo.com has no slot for it — its hotel is
    // closed on a schedule, not by a fault — so it goes under the box's own copy rather than in it.
    let {reason = '', className = ''} = $props();

    const FRANK = new URL('../assets/teaser_frank_closed.png', import.meta.url).href;
</script>

<div class="block rounded-[10px] bg-[#151124] px-3 py-6 text-[#b996ee] xs:px-6 {className}">
    <div class="md:relative">
        <img src={FRANK} alt="" class="mx-auto mb-6 block h-[88px] w-[118px] md:absolute md:top-0 md:right-0 md:mb-0" />

        <h1>{t('HOTEL_CLOSED_TITLE')}</h1>
        <h3>{t('HOTEL_CLOSED_HOURS')}</h3>
        <p>{t('HOTEL_CLOSED_DESCRIPTION')}</p>

        <ul class="my-3 list-disc pl-[26px]">
            <li><a href="/community/photos" use:link>{t('COMMUNITY_PHOTOS_TAB')}</a></li>
            <li><a href="/community/category/all" use:link>{t('COMMUNITY_NEWS_TAB')}</a></li>
            <li><a href="/shop" use:link>{t('NAVIGATION_SHOP')}</a></li>
        </ul>

        {#if reason}
            <p class="mt-6 text-sm opacity-60">{reason}</p>
        {/if}
    </div>
</div>
