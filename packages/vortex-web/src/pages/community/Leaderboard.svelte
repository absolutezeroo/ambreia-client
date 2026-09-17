<script lang="ts">
    // `/community/leaderboard` — the coin contest, and this hotel's own page: habbo.com has no
    // equivalent, so there is no template to port and none of the markup below claims to be theirs.
    // It borrows the community shell and the table shape the rest of the site uses.
    //
    // The standings come from `/api/public/leaderboard/coins`, which serves a SNAPSHOT the hotel
    // re-reads on a timer — one `eth_call` per player, so it cannot be done per request. The page
    // therefore prints when it was taken. A leaderboard that hides its age invites the reader to
    // treat it as live, and this one can be minutes behind.
    import {link} from 'svelte-spa-router';
    import CommunityShell from './CommunityShell.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
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
    <section class="mx-auto flex max-w-[1200px] flex-col gap-6 px-3 py-6">
        <div>
            <h2 class="mb-3">{t('LEADERBOARD_OWN_TITLE')}</h2>
            <p class="text-sm">{t('LEADERBOARD_OWN_DESCRIPTION')}</p>
        </div>

        {#if loaded && board}
            {#if !board.enabled}
                <p class="text-sm opacity-70">{t('LEADERBOARD_OWN_DISABLED')}</p>
            {:else if board.standings.length === 0}
                <EmptyResults className="py-12" />
                <p class="text-sm opacity-70">{t('LEADERBOARD_OWN_EMPTY')}</p>
            {:else}
                <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr class="text-left">
                            <th class="py-2 pr-3">{t('LEADERBOARD_OWN_RANK')}</th>
                            <th class="py-2 pr-3">{t('LEADERBOARD_OWN_PLAYER')}</th>
                            <th class="py-2 text-right">{t('LEADERBOARD_OWN_BALANCE')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each board.standings as entry (entry.address)}
                            <tr class="border-t border-card-line">
                                <td class="py-2 pr-3 tabular-nums">{entry.rank}</td>
                                <td class="py-2 pr-3">
                                    <a href="/profile/{entry.playerName}" use:link>
                                        {entry.playerName}
                                    </a>
                                </td>
                                <!-- Printed as the server formatted it. Reformatting here would mean
                                     parsing it, and a wei balance does not survive a JS number. -->
                                <td class="py-2 text-right tabular-nums">{entry.balance}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>

                {#if board.takenAtUtc}
                    <p class="text-sm opacity-70">
                        {t('LEADERBOARD_OWN_TAKEN_AT')} {taken(board.takenAtUtc)}
                    </p>
                {/if}
            {/if}
        {/if}
    </section>
</CommunityShell>
