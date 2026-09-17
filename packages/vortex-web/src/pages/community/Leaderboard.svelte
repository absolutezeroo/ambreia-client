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
    // Shaped like the Apparts gallery beside it, not like a table: `PageHeader` for the band, then
    // rows built the way `.room-item` is — a square pinned left, the name and a line of detail
    // beside it. The first version of this page put a bare `h2` and a `<table>` into the content
    // column, which is nothing the rest of the site does; every section here leads with the band.
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
            <!-- Built like `.room-item` next door rather than as a table: the same 110px-tall row
                 with the picture pinned left and the text beside it, so the two community lists read
                 as one section. The rank takes the thumbnail's place — it is what the picture is on
                 a gallery card, the thing the eye lands on first. -->
            {#each board.standings as entry (entry.address)}
                <div class="relative mb-6 min-h-[64px] pl-[80px]">
                    <span class="absolute top-0 left-0 flex h-[64px] w-[64px] items-center justify-center bg-[#6796b1] text-2xl font-bold shadow-[3px_3px_rgba(0,0,0,0.3)]">
                        {entry.rank}
                    </span>

                    <a href="/profile/{entry.playerName}" use:link class="flex items-center gap-[3px] hover:border-b-0">
                        <Avatar user={entry.playerName} well={46} />
                        <h2 class="m-0 text-2xl normal-case">{entry.playerName}</h2>
                    </a>

                    <!-- Printed exactly as the server formatted it. Reformatting here would mean
                         parsing it, and a wei balance does not survive a JavaScript number. -->
                    <p class="my-1.5 text-sm">
                        {entry.balance} {t('LEADERBOARD_OWN_BALANCE')}
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
