<script lang="ts">
    // A post's text, with its hashtags turned into links onto the feed filtered by that tag.
    //
    // Split on the tag pattern and render the pieces, never `{@html}`: the body is a player's own
    // text and this is the one place on the site where a player's text reaches the page. An
    // interpolated `<script>` would be theirs, not ours.
    import {link} from 'svelte-spa-router';

    let {body = ''}: {body?: string} = $props();

    // The same shape the server extracts with — a `#` then letters, digits or underscore. Kept in
    // sync by hand with FeedTags.Pattern in the emulator; a mismatch shows as a tag that renders
    // plain or a link that finds nothing.
    const TAG = /(#[\p{L}\p{N}_]+)/gu;

    let pieces = $derived(body.split(TAG));
</script>

{#each pieces as piece, index (index)}{#if index % 2}<a
            href="/community/chats?tag={encodeURIComponent(piece.slice(1))}"
            use:link
            class="text-ink hover:underline">{piece}</a>{:else}{piece}{/if}{/each}
