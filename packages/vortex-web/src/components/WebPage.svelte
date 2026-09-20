<script lang="ts">
    // `common/…` and `playing_habbo/…` — habbo.com's `<habbo-web-pages key="…">`, which fetches an
    // HTML fragment from its CMS and injects it. Same job here, except the fragments are mirrored
    // into src/webpages/ by tools/fetch-web-pages.mjs, so the hotel serves its own copy.
    //
    // The markup that arrives is habbo.com's own — <h1>/<h3>/<p>/<hr> and <img class="align-right">
    // — and it carries no Tailwind classes, because it was never written for this port. That is why
    // `.static-content` is REAL CSS in styles.css rather than utilities: injected HTML cannot be
    // given utility classes without rewriting the CMS's markup, which would defeat mirroring it.
    //
    // The mirror is `src/webpages/<lang>/<key>.html`, one directory per language, because habbo.com
    // serves these per language too (`<key>.<lang>.html`). The active language is tried first and
    // the site's fallback behind it — habbo.com does not publish every page in every language, and
    // an untranslated side box should read in the fallback rather than vanish.
    import {locale, LOCALE_CODES} from '../lib/i18n.js';

    const PAGES = import.meta.glob('../webpages/**/*.html', {query: '?raw', import: 'default', eager: true});

    let {key, className = ''} = $props();

    // Not `LOCALE_CODES[0]`: the fallback is the language whose file `i18n` loaded behind the active
    // one, and the only mirrored directory that is guaranteed to exist is one of the shipped codes.
    const html = $derived(
        PAGES[`../webpages/${locale()}/${key}.html`]
        ?? LOCALE_CODES.map(code => PAGES[`../webpages/${code}/${key}.html`]).find(Boolean)
        ?? ''
    );
</script>

{#if html}
    <div class="static-content {className}">{@html html}</div>
{/if}
