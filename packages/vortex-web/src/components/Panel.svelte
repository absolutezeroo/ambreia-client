<script lang="ts">
    import type {Snippet} from 'svelte';

    // `.aside--box`: the rounded blue block every sidebar widget and most page sections sit in.
    //
    // Its first heading is not plain text — habbo.com bleeds it into a darker band across the top of
    // the panel (`.aside--box h1:first-child`: background #0e3955, `margin: -24px -12px 12px`, so it
    // eats the panel's own padding and runs edge to edge, with a hard black text-shadow). A panel
    // whose title is just bold text is the most visible way to miss the site's look, because every
    // sidebar on it has one.
    //
    // Padding widens from 12px to 24px at 532px, and the band's negative margins follow it.
    //
    // `titleSnippet` is the escape hatch for the one caller that needs more than text in the band —
    // the feed composer's `POST AS ▾` menu is a `<select>`, not a string, and `title` only ever
    // renders as one.
    let {title = '', className = '', titleSnippet, children}:
    {
        title?: string;
        className?: string;
        titleSnippet?: Snippet;
        children: Snippet;
    } = $props();
</script>

<section class="overflow-hidden rounded-[3px] bg-card px-3 py-6 xs:px-6 {className}">
    {#if titleSnippet}
        <h2 class="-mx-3 -mt-6 mb-3 bg-panel-head px-3 py-1.5 [text-shadow:0_1px_#000] xs:-mx-6 xs:px-6">{@render titleSnippet()}</h2>
    {:else if title}
        <h2 class="-mx-3 -mt-6 mb-3 bg-panel-head px-3 py-1.5 [text-shadow:0_1px_#000] xs:-mx-6 xs:px-6">{title}</h2>
    {/if}
    {@render children()}
</section>
