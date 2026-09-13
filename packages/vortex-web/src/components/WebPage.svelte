<script lang="ts">
    // `common/…` and `playing_habbo/…` — habbo.com's `<habbo-web-pages key="…">`, which fetches an
    // HTML fragment from its CMS and injects it. Same job here, except the fragments are mirrored
    // into src/webpages/ by tools/fetch-web-pages.mjs, so the hotel serves its own copy.
    //
    // The markup that arrives is habbo.com's own — <h1>/<h3>/<p>/<hr> and <img class="align-right">
    // — and it carries no Tailwind classes, because it was never written for this port. That is why
    // `.static-content` is REAL CSS in styles.css rather than utilities: injected HTML cannot be
    // given utility classes without rewriting the CMS's markup, which would defeat mirroring it.
    const PAGES = import.meta.glob('../webpages/**/*.html', {query: '?raw', import: 'default', eager: true});

    let {key, className = ''} = $props();

    const html = $derived(PAGES[`../webpages/${key}.html`] ?? '');
</script>

{#if html}
    <div class="static-content {className}">{@html html}</div>
{/if}
