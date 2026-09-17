<script lang="ts">
    // `/community/leaderboard` — the coin contest, and this hotel's own page: habbo.com has no
    // equivalent, so there is no template to port and none of the markup below claims to be theirs.
    // It borrows the community shell and the table shape the rest of the site uses.
    //
    // The standings come from `/api/public/leaderboard/coins`, which serves a SNAPSHOT the hotel
    // re-reads on a timer — one `eth_call` per player, so it cannot be done per request. The page
    // therefore prints when it was taken. A leaderboard that hides its age invites the reader to
    // treat it as live, and this one can be minutes behind.
    //
    // Shaped like the Apparts gallery beside it, because habbo.com HAS NO LEADERBOARD — no `.rank`,
    // no `.leaderboard`, no `score` anywhere in its stylesheet or its 210 templates, and `.room-item`
    // is the only list idiom the whole site owns. So there is nothing to port here, and the rule
    // becomes: invent as little as possible. `PageHeader` for the band, `.room-item`'s geometry for
    // the rows, the circular avatar well for the picture, the site's own type scale for the rest.
    //
    // Two versions of this page got that wrong before this one. The first put a bare `h2` and a
    // `<table>` in the content column, when every section on the site leads with the band. The
    // second kept the band but filled `.room-item`'s picture slot with the rank in a coloured
    // square — a slot that holds a picture, holding a number.
    import {link} from 'svelte-spa-router';
    import CommunityShell from './CommunityShell.svelte';
    import Avatar from '../../components/Avatar.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import PageHeader from '../../components/PageHeader.svelte';
    import * as api from '../../lib/api.js';
    import {t} from '../../lib/i18n.js';

    let board = $state<api.ILeaderboard | null>(null);
    let loaded = $state(false);

    async function load(): Promise<void>
    {
        try
        {
            board = await api.getLeaderboard();
        }
        catch
        {
            // Left null: the page says nothing rather than claiming an empty contest, which is a
            // different statement from "this did not load".
        }
        finally
        {
            loaded = true;
        }
    }

    load();

    // The API hands back an instant; the reader wants their own clock.
    function taken(at: string): string
    {
        return new Date(at).toLocaleString();
    }
</script>

<CommunityShell>
<PageHeader title={t('LEADERBOARD_OWN_TITLE')} description={t('LEADERBOARD_OWN_DESCRIPTION')} />

<section class="mx-auto max-w-[1200px] px-3 py-6">
    {#if loaded && board}
        {#if !board.enabled}
            <p class="text-sm">{t('LEADERBOARD_OWN_DISABLED')}</p>
        {:else if board.standings.length === 0}
            <EmptyResults className="py-12" />
        {:else}
            <!-- `.room-item`'s geometry, unchanged: min-height 110, padding-left 122, margin-bottom
                 24, the picture pinned at 0,0. What goes in the picture slot is a PICTURE — the
                 player's avatar in the same circular well the site uses everywhere else. An earlier
                 version put the rank number in that square, which is the one thing the slot is not
                 for, and it read as a widget from another site. -->
            {#each board.standings as entry (entry.address)}
                <div class="relative mb-6 min-h-[110px] pl-[122px]">
                    <a href="/profile/{entry.playerName}" use:link class="absolute top-0 left-0 block hover:border-b-0">
                        <Avatar user={entry.playerName} well={110} />
                    </a>

                    <a href="/profile/{entry.playerName}" use:link class="block hover:border-b-0">
                        <h2 class="m-0 text-2xl normal-case">{entry.playerName}</h2>
                    </a>

                    <!-- The rank rides with the balance rather than taking a slot of its own: the
                         order of the list already says it, and the number is only there to be read
                         out loud. The balance is printed exactly as the server formatted it —
                         reformatting would mean parsing, and a wei figure does not survive a
                         JavaScript number. -->
                    <p class="my-1.5 text-sm">
                        {t('LEADERBOARD_OWN_RANK')} {entry.rank} — {entry.balance}
                        {t('LEADERBOARD_OWN_BALANCE')}
                    </p>
                </div>
            {/each}

            {#if board.takenAtUtc}
                <p class="text-sm">{t('LEADERBOARD_OWN_TAKEN_AT')} {taken(board.takenAtUtc)}</p>
            {/if}
        {/if}
    {/if}
</section>
</CommunityShell>
