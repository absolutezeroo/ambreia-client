<script lang="ts">
    // `not-found/not-found.html`, which is four elements:
    //
    //   <main class="wrapper wrapper--content not-found">
    //     <section class="not-found__content">
    //       <h3 translate="NOT_FOUND_PAGE_TITLE"></h3>
    //       <div translate="NOT_FOUND_PAGE_TEXT"></div>
    //
    //   .not-found                  { margin-bottom:0; padding:12px 0 24px }
    //   .not-found__content         { text-align:center }
    //   .not-found__content::before { content:url(teaser_frank_looking.png); width:132px;
    //                                 height:115px; margin:0 auto 12px }
    //
    // Frank with the magnifying glass is the page. The copy is habbo.fr's own — typo included
    // ("Page introuvale!") — and `NOT_FOUND_PAGE_TEXT` is HTML: it carries the link home INSIDE the
    // sentence, so it is rendered rather than printed, and there is no button. The invented version
    // this replaces had a heading, a button and a second link, none of which habbo.com has.
    import {t} from '../lib/i18n.js';

    const FRANK = new URL('../assets/teaser_frank_looking.png', import.meta.url).href;

    // The key's own link is `href="/"`, which under a hash router would reload the whole app to get
    // to the same place. `#/` is the same destination through the router.
    const text = t('NOT_FOUND_PAGE_TEXT').replace('href="/"', 'href="#/"');
</script>

<main class="mx-auto mb-0 max-w-[1200px] px-3 pt-3 pb-6">
    <section class="text-center">
        <img src={FRANK} alt="" class="mx-auto mb-3 block h-[115px] w-[132px]" />

        <h3>{t('NOT_FOUND_PAGE_TITLE')}</h3>
        <div>{@html text}</div>
    </section>
</main>
