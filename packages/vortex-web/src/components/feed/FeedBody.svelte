<script lang="ts">
    // A post's text, with its hashtags turned into links onto the feed filtered by that tag, and
    // its @names into links onto that player's profile.
    //
    // Split on the patterns and render the pieces, never `{@html}`: the body is a player's own
    // text and this is the one place on the site where a player's text reaches the page. An
    // interpolated `<script>` would be theirs, not ours.
    import {link} from 'svelte-spa-router';

    let {body = ''}: {body?: string} = $props();

    // The same shapes the server extracts with — FeedTags.Pattern and FeedMentions.Pattern in the
    // emulator — kept in sync by hand. A mismatch shows rather than hides: a tag or a name that
    // renders plain, or a link leading nowhere.
    //
    // ONE alternation rather than two passes, because a second `split` over the pieces of the
    // first would have to skip the links already made. The two halves differ by the hyphen, which
    // a Habbo name allows (`-Prodiigy-`) and a tag does not — so they cannot be collapsed into a
    // single character class without one of them silently diverging from the server.
    const MARKUP = /(#[\p{L}\p{N}_]+|@[\p{L}\p{N}_-]+)/gu;

    let pieces = $derived(body.split(MARKUP));
</script>

<!-- Every `@word` is a link, including one that names nobody — the page does not know who exists
     and asking would be a request per post. A name that is not a player lands on the profile
     page, which shows its own empty result. The server resolves them only to decide who to
     notify, which is the half that has to be right. -->
{#each pieces as piece, index (index)}{#if index % 2 && piece[0] === '#'}<a
            href="/community/chats?tag={encodeURIComponent(piece.slice(1))}"
            use:link
            class="text-ink hover:underline">{piece}</a>{:else if index % 2}<a
            href="/profile/{encodeURIComponent(piece.slice(1))}"
            use:link
            class="text-ink hover:underline">{piece}</a>{:else}{piece}{/if}{/each}
