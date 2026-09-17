<script lang="ts">
    // `/community/leaderboard` — the coin contest, and this hotel's own page: habbo.com has no
    // equivalent, so there is no template to port and none of the markup below claims to be theirs.
    //
    // The standings come from `/api/public/leaderboard/coins`, which serves a SNAPSHOT the hotel
    // re-reads on a timer — one `eth_call` per player, so it cannot be done per request. The page
    // therefore prints when it was taken. A leaderboard that hides its age invites the reader to
    // treat it as live, and this one can be minutes behind.
    //
    // habbo.com HAS NO LEADERBOARD — no `.rank`, no `.leaderboard`, no `score` anywhere in its
    // stylesheet or its 210 templates — so the rule here is not "port it", it is "assemble it out of
    // parts the site already owns", and every piece below names the one it came from:
    //
    //   - `PageHeader`     the `.photos__header` band every section leads with
    //   - `Panel`          `.aside--box`, the rounded card with a dark title band across the top
    //   - the row divider  the purse's engraved rule: #0c3a65 with a #2a9cde line a pixel below
    //   - `Avatar well`    `.item__icon` / `.user-menu__avatar`, the 46px circular head badge
    //   - the balance line `.purse__column p` — `pl-[26px] leading-[22px]`, icon pinned left
    //   - the pager        `.news-category__previous` / `__next` + the sheet's 21x38 arrows
    //
    // Three versions got this wrong before. The first had no band at all, when every section on the
    // site leads with one. The second put the rank number inside `.room-item`'s PICTURE slot. The
    // third kept the picture but also kept `.room-item`'s geometry — 110px tall rows built for a
    // thumbnail plus a description plus a tag list, carrying one line of text, so five players
    // filled a screen and a half with empty blue. A leaderboard is a dense list; the Apparts gallery
    // is not one.
    import {link} from 'svelte-spa-router';
    import CommunityShell from './CommunityShell.svelte';
    import Avatar from '../../components/Avatar.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import PageHeader from '../../components/PageHeader.svelte';
    import Panel from '../../components/Panel.svelte';
    import Sprite from '../../components/Sprite.svelte';
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

    // `/api/public/leaderboard/coins` has no cap of its own — it returns EVERY non-zero holder among
    // the players the snapshot scanned, which is up to 500 — so the paging is this page's job. The
    // first page spends three of its eighteen on the podium and lists the other fifteen; every page
    // after it is eighteen rows, because the podium is the overall top three and there is only one.
    const PAGE_SIZE = 18;
    const PODIUM_SIZE = 3;

    let page = $state(0);

    const standings = $derived(board?.standings ?? []);
    const pages = $derived(Math.max(1, Math.ceil(standings.length / PAGE_SIZE)));
    const shown = $derived(standings.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE));

    const podium = $derived(page === 0 ? shown.slice(0, PODIUM_SIZE) : []);
    const rows = $derived(page === 0 ? shown.slice(PODIUM_SIZE) : shown);

    // Second place stands on the LEFT of the winner and third on the right, which is how a podium
    // reads. It is a `sm:` order and the cards are written in rank order, because below that
    // breakpoint they do not stand side by side — they STACK, and a stack that goes 2, 1, 3 reads
    // as a mistake. The DOM order is the one that is right on a phone; the desktop one is the
    // override.
    const PODIUM_ORDER = ['sm:order-2', 'sm:order-1', 'sm:order-3'];

    // The trophy is Habbo's own: `highscore_cup.png`, the cup the CLIENT draws on a highscore furni,
    // lifted out of packages/vortex-client/src/assets/images. That tree is gitignored, so the file is
    // COPIED in here rather than imported across the packages.
    //
    // It only exists in gold, and a CSS filter over pixel art flattens it — the sprite is five gold
    // tones plus a black outline and a white glint, and `grayscale()` eats the last two along with
    // the metal. So silver and bronze are palette remaps of those five tones and nothing else:
    //
    //   gold    ffff78  f9d83e  e0b932  be9225  9b6717   (the original)
    //   silver  f2f6fa  dfe6ec  bcc7d1  8f9aa6  5f6b77
    //   bronze  ffd9a0  e0913c  c2762c  9a5a1f  6d3e14
    //
    // Each card's band takes its colour from its own ramp, so the band and the cup on it are the
    // same metal rather than two guesses at one.
    const MEDALS = [
        {cup: new URL('../../assets/cup_gold.png', import.meta.url).href, band: '#f9d83e', ink: '#4a3600', line: '#be9225'},
        {cup: new URL('../../assets/cup_silver.png', import.meta.url).href, band: '#dfe6ec', ink: '#31414f', line: '#8f9aa6'},
        {cup: new URL('../../assets/cup_bronze.png', import.meta.url).href, band: '#e0913c', ink: '#3d1f00', line: '#9a5a1f'},
    ];
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
            <!-- The podium: the top three get a card and a WHOLE avatar, because the page is a
                 contest and the three names on it are the answer. Everything below is a list. -->
            {#if podium.length}
            <div class="mb-6 flex flex-wrap items-end justify-center gap-3">
                {#each podium as entry, slot (entry.address)}
                    {@const medal = MEDALS[slot]}
                        <div class="w-[200px] max-w-full overflow-hidden rounded-[3px] border-b-[3px] bg-card text-center
                                    {PODIUM_ORDER[slot]} {entry.rank === 1 ? 'pb-6' : 'pb-3'}"
                             style="border-color:{medal.line}">
                            <!-- The band carries the metal and the rank. Its ink is dark and has no
                                 text-shadow: the site's `0 1px #000` is for light type on a dark
                                 panel, and on gold it reads as a smudge. -->
                            <p class="m-0 py-1.5 text-lg" style="background:{medal.band};color:{medal.ink}">
                                {t('LEADERBOARD_OWN_RANK')} {entry.rank}
                            </p>

                            <a href="/profile/{entry.playerName}" use:link class="block hover:border-b-0">
                                <!-- The cup stands BESIDE the avatar at its native 40x70 and is never
                                     scaled. It is pixel art under a global `image-rendering:
                                     pixelated`, and the first version drew it at 23x40 — a 0.575
                                     downscale, which with nearest-neighbour drops four pixel rows in
                                     seven and turned a cup into a blob.
                                     `m` and not `l` for the avatar: the imager only answers zoom 2
                                     for a HEAD, and a full body at that size comes back 502. The
                                     winner is made bigger in CSS instead. -->
                                <span class="flex items-end justify-center gap-1 px-3">
                                    <img src={medal.cup} alt="" width="40" height="70" />
                                    <Avatar user={entry.playerName} size="m" direction={2}
                                            className="block origin-bottom {entry.rank === 1 ? 'scale-125' : ''}" />
                                </span>
                                <span class="block truncate px-3 text-lg">{entry.playerName}</span>
                            </a>

                            <p class="m-0 px-3 text-lg" style="color:{medal.band}">{entry.balance}
                                <span class="text-sm text-ink">{t('LEADERBOARD_OWN_BALANCE')}</span>
                            </p>
                        </div>
                {/each}
            </div>
            {/if}

            <Panel title={t('COMMUNITY_LEADERBOARD_TAB')}>
                {#each rows as entry, index (entry.address)}
                    <!-- The engraved rule between rows is the purse divider, and it is deliberately
                         absent under the last one: habbo.com's lists close on the panel's own edge,
                         never on a trailing line. -->
                    <div class="relative flex items-center gap-3 py-2 {index < rows.length - 1
                        ? "border-b border-page after:absolute after:-bottom-[2px] after:left-0 after:h-px after:w-full after:bg-rule after:content-['']"
                        : ''}">
                        <!-- The rank has a gutter of its own rather than riding in the detail line:
                             it is the one number the page exists to publish, and `title` carries the
                             word so a bare "3" still reads as a rank out of context. -->
                        <span class="w-9 shrink-0 text-right text-2xl leading-none text-ink"
                              title="{t('LEADERBOARD_OWN_RANK')} {entry.rank}">{entry.rank}</span>

                        <a href="/profile/{entry.playerName}" use:link class="shrink-0 hover:border-b-0">
                            <Avatar user={entry.playerName} well={46} />
                        </a>

                        <a href="/profile/{entry.playerName}" use:link
                           class="min-w-0 flex-1 truncate text-lg hover:border-b-0">{entry.playerName}</a>

                        <!-- Printed exactly as the server formatted it — reformatting would mean
                             parsing, and a wei figure does not survive a JavaScript number. -->
                        <span class="shrink-0 whitespace-nowrap text-lg">{entry.balance}
                            <span class="text-sm text-ink">{t('LEADERBOARD_OWN_BALANCE')}</span>
                        </span>
                    </div>
                {/each}

                {#if board.takenAtUtc}
                    <p class="mt-3 mb-0 text-sm text-ink">{t('LEADERBOARD_OWN_TAKEN_AT')} {taken(board.takenAtUtc)}</p>
                {/if}
            </Panel>

            <!-- habbo.com's own pager look — `.news-category__previous` / `.news-category__next`:
                 uppercase, `line-height: 28px`, `text-shadow: 0 1px rgba(0,0,0,.3)`, and the 21x38
                 arrow out of the sheet on the outside of each label. The WORDS are its generic pair
                 ("Précédent" / "Suivant"), not the news bar's "Plus récentes" / "Plus anciennes",
                 which say something about time that a standings page does not mean.
                 Hidden outright on a single page rather than shown disabled twice over. -->
            {#if pages > 1}
                <div class="mt-6 flex items-center justify-center gap-6 uppercase leading-7 [text-shadow:0_1px_rgba(0,0,0,0.3)]">
                    <button type="button" class="flex items-center gap-1.5 disabled:invisible"
                            disabled={page === 0} onclick={() => (page -= 1)}>
                        <Sprite name="arrowPrev" />
                        {t('HABBOCLUB_CATALOG_PREVIOUS')}
                    </button>

                    <span class="text-sm normal-case text-ink">{page + 1} / {pages}</span>

                    <button type="button" class="flex items-center gap-1.5 disabled:invisible"
                            disabled={page >= pages - 1} onclick={() => (page += 1)}>
                        {t('HABBOCLUB_CATALOG_NEXT')}
                        <Sprite name="arrowNext" />
                    </button>
                </div>
            {/if}
        {/if}
    {/if}
</section>
</CommunityShell>
