<script lang="ts">
    // `shop/purse/purse.html`, and it is a whole aside of its own — not five counters someone else
    // wraps:
    //
    //   <aside><h3 translate="SHOP_PURSE_TITLE">        "Porte-monnaie"
    //     <div class="purse"><div class="purse__columns">
    //       <div class="purse__column">  credits, diamonds, silver
    //       <div class="purse__column">  habbo club, builders club
    //     <div class="purse__footer"><a href="/hotel?link=habboUI/open/hccenter"
    //                                   translate="SHOP_PURSE_HC_LINK">
    //
    // Every label is one of habbo.com's own interpolated keys — "{{creditBalance}} crédits",
    // "{{habboClubDays}} jours de HC" — and each membership has a SECOND key for zero: "Non HC",
    // "Non BC". This port had hand-written French in their place ("diamants", "duckets", "Habbo
    // Club") and printed a bare number with no unit at all, which is the shape of thing a copy is
    // not: the wording is not ours to choose.
    //
    // `.purse` carries the same TWO-line rule as the profile's cards — a dark #0c3a65 border with a
    // #2a9cde line a pixel below it — which is what gives the divider its engraved edge.
    //
    // Real since 2026-09-11: GET /api/user/purse, the wallet of the SELECTED avatar, refetched when
    // that selection changes. The five counters belong to one avatar, not to the account, and
    // switching avatars without refetching would show one player another's credits.
    import {link} from 'svelte-spa-router';
    import Sprite from './Sprite.svelte';
    import * as api from '../lib/api.js';
    import type {IPlayerPurse} from '../lib/api.js';
    import type {ISpriteName} from '../lib/sprite.js';
    import {balance, balanceExact, isAbbreviated} from '../lib/balance.js';
    import {selectedId, signedIn} from '../lib/session.js';
    import {t} from '../lib/i18n.js';

    let purse = $state<IPlayerPurse | null>(null);

    $effect(() =>
    {
        // Both are read so the effect re-runs on either: a sign-in, or a change of avatar.
        const who = $selectedId;
        const isIn = $signedIn;
        let cancelled = false;

        if(!isIn)
        {
            purse = null;

            return;
        }

        void api.getPurse()
            .then((answer) => !cancelled && (purse = answer))
            // Signed out mid-flight, or no avatar yet: the counters simply do not show.
            .catch(() => !cancelled && (purse = null));

        return () => (cancelled = true);
    });

    // Two columns of items, in habbo.com's own order. A membership at zero says so rather than
    // printing "0 jours".
    //
    // Typed against the sheet's own names so a renamed icon is a compile error here rather than a
    // 0x0 span in the panel.
    const COLUMNS = $derived<{icon: ISpriteName; label: string; exact: string}[][]>(purse === null ? [] : [
        [
            {
                icon: 'credits',
                label: t('SHOP_PURSE_CREDITS', {creditBalance: balance(purse.credits)}),
                exact: isAbbreviated(purse.credits) ? balanceExact(purse.credits) : '',
            },
            {
                icon: 'diamonds',
                label: t('SHOP_PURSE_DIAMONDS', {diamondBalance: balance(purse.diamonds)}),
                exact: isAbbreviated(purse.diamonds) ? balanceExact(purse.diamonds) : '',
            },
            {
                icon: 'silver',
                label: t('SHOP_PURSE_SILVER', {silverBalance: balance(purse.duckets)}),
                exact: isAbbreviated(purse.duckets) ? balanceExact(purse.duckets) : '',
            },
        ],
        [
            // The two memberships stay EXACT and unabbreviated: they are a countdown in days, and
            // "1,2 k jours" answers a question nobody asked while hiding the one they did.
            {
                icon: 'habboClub',
                label: purse.habboClubDays
                    ? t('SHOP_PURSE_HC_DAYS', {habboClubDays: purse.habboClubDays})
                    : t('SHOP_PURSE_NO_HC'),
                exact: '',
            },
            {
                icon: 'buildersClub',
                label: purse.buildersClubDays
                    ? t('SHOP_PURSE_BC_DAYS', {buildersClubDays: purse.buildersClubDays})
                    : t('SHOP_PURSE_NO_BC'),
                exact: '',
            },
        ],
    ]);
</script>

{#if COLUMNS.length}
    <aside class="overflow-hidden rounded-[3px] bg-card px-3 py-6 xs:px-6">
        <!-- The panel's own title band, the same one `Panel` draws: habbo.com's purse carries its
             heading itself, so the pages that show it no longer invent one ("Mon compte"). -->
        <h2 class="-mx-3 -mt-6 mb-3 bg-panel-head px-3 py-1.5 [text-shadow:0_1px_#000] xs:-mx-6 xs:px-6">
            {t('SHOP_PURSE_TITLE')}
        </h2>

        <div class="relative mb-3 border-b border-page after:absolute after:-bottom-[2px] after:left-0 after:h-px after:w-full after:overflow-hidden after:bg-rule after:content-['']">
            <div class="-mx-3 mb-3 flex flex-wrap">
                {#each COLUMNS as column, index (index)}
                    <div class="w-1/2 px-3">
                        {#each column as item (item.icon)}
                            <!-- `title` carries the full number whenever the balance was
                                 abbreviated, so the exact figure is one hover away and nothing is
                                 lost — see lib/balance.ts. The dotted underline is the browser's
                                 own convention for "there is more here"; without it an abbreviated
                                 balance looks like the whole answer. -->
                            <p class="relative whitespace-nowrap py-1.5 pl-[26px] leading-[22px] {item.exact ? 'decoration-dotted underline-offset-4 hover:underline' : ''}"
                               title={item.exact || null}>
                                <Sprite name={item.icon} className="absolute left-0 top-1/2 -translate-y-1/2" />
                                {item.label}
                            </p>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>

        <!-- `.purse__footer`, and habbo.com's own href verbatim: `/hotel?link=habboUI/open/hccenter`
             opens the CLIENT's HC centre. The client reads that `link` on its way in — see
             App.svelte, which hands it to the iframe, and vortex-client's App.ts, which fires it the
             moment the session is authenticated. -->
        <p class="m-0">
            <a href="/hotel?link={encodeURIComponent('habboUI/open/hccenter')}" use:link>{t('SHOP_PURSE_HC_LINK')}</a>
        </p>
    </aside>
{/if}
