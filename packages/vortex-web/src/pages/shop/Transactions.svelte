<script lang="ts">
    // `/shop/history` — `shop/transactions/transactions.html` -> `transactions-list.html` ->
    // `transactions-history.html`:
    //
    //   <header class="shop__header"><h1 class="shop__header__title--single" translate="SHOP_TRANSACTIONS_TITLE">
    //   <section>
    //     <habbo-transactions-list class="main">
    //       <table class="transactions-history">  Date | Achat | Valeur
    //       <p class="transactions__notice" translate="TRANSACTIONS_NOTICE">
    //       <button class="transactions__button" translate="TRANSACTIONS_SHOW_ALL">
    //     <habbo-purse class="aside aside--box">
    //
    // It is a TABLE, not a list — three columns with their own headings, newest first — and this
    // port had rendered a stack of rows with invented labels. Each cell also carries its heading in
    // `data-th`, which is what lets the table become stacked cards on a phone without losing which
    // number is which; `.transactions-history` does that with a media query and this does it with
    // the same attribute read by `src/styles.css`.
    //
    // Empty is `<habbo-empty-results translation-key="TRANSACTIONS_EMPTY">` — Frank shrugging beside
    // habbo.com's own sentence, which carries its own link back to the shop.
    //
    // Real since 2026-09-12: `GET /api/user/shop/orders`, the SELECTED avatar's orders, newest
    // first. Signed out it is a 401 and the page says so rather than showing an empty table, which
    // would read as "you have never bought anything".
    import {link} from 'svelte-spa-router';
    import ShopShell from './ShopShell.svelte';
    import Purse from '../../components/Purse.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import WebPage from '../../components/WebPage.svelte';
    import * as api from '../../lib/api.js';
    import type {IShopOrder} from '../../lib/api.js';
    import {formatPrice, orderLabel, productName} from '../../lib/shop.js';
    import {signedIn} from '../../lib/session.js';
    import {t, intlLocale} from '../../lib/i18n.js';

    // `limitTo` on habbo.com's own list, with "Tout montrer" below it.
    const FIRST_PAGE = 10;

    let orders = $state<IShopOrder[]>([]);
    let loaded = $state(false);
    let all = $state(false);
    let error = $state('');

    $effect(() =>
    {
        // Read so the list refetches on sign-in rather than staying on whatever it had.
        const isIn = $signedIn;
        let cancelled = false;

        if(!isIn)
        {
            orders = [];
            loaded = true;

            return;
        }

        void api.getShopOrders()
            .then((answer) => !cancelled && (orders = answer))
            .catch((failure) => !cancelled && (error = (failure as Error).message))
            .finally(() => !cancelled && (loaded = true));

        return () => (cancelled = true);
    });

    const shown = $derived(all ? orders : orders.slice(0, FIRST_PAGE));

    // `amDateFormat: 'D MMM YYYY'` — the day, the month abbreviated, the year.
    function shortDate(iso: string): string
    {
        return new Intl.DateTimeFormat(intlLocale(), {day: 'numeric', month: 'short', year: 'numeric'})
            .format(new Date(iso));
    }
</script>

<ShopShell>
    <header class="mb-6">
        <h1 class="mt-0">{t('SHOP_TRANSACTIONS_TITLE')}</h1>
    </header>

    <section class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div class="min-w-0 flex-1">
            {#if error}
                <p>{error}</p>
            {:else if !$signedIn}
                <p>{t('SUBSCRIPTION-LOGINNEEDED')}</p>
            {:else if loaded && !orders.length}
                <EmptyResults key="TRANSACTIONS_EMPTY" />
            {:else}
                <!-- Each cell repeats its column heading in `data-th`, which is what the stacked
                     phone layout reads — see `.transactions-history` in styles.css. -->
                <table class="transactions-history w-full text-left">
                    <thead>
                        <tr>
                            <th>{t('TRANSACTIONS_TABLE_DATE')}</th>
                            <th>{t('TRANSACTIONS_TABLE_PURCHASE')}</th>
                            <th>{t('TRANSACTIONS_TABLE_VALUE')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each shown as order (order.id)}
                            <tr>
                                <td data-th={t('TRANSACTIONS_TABLE_DATE')}>{shortDate(order.createdAt)}</td>
                                <td data-th={t('TRANSACTIONS_TABLE_PURCHASE')}>
                                    <a href="/shop/order/{order.id}" use:link>{productName(order)}</a>
                                    <span class="block text-sm">{orderLabel(order)}</span>
                                </td>
                                <td data-th={t('TRANSACTIONS_TABLE_VALUE')}>{formatPrice(order.priceMinor, order.currency)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>

                <!-- `.transactions__footer`: the notice, then "Tout montrer" only while something is
                     still hidden. -->
                <div class="mt-6">
                    <p class="text-sm">{t('TRANSACTIONS_NOTICE')}</p>

                    {#if !all && orders.length > FIRST_PAGE}
                        <button type="button" onclick={() => (all = true)}
                                class="mt-3 rounded-[5px] border-2 border-btn-line bg-btn px-6 py-3 text-center font-condensed text-base uppercase leading-[1.2] text-white shadow-btn hover:border-btn-line-hover hover:bg-btn-hover active:translate-y-[2px] active:border-btn-line-active active:bg-btn-active active:shadow-btn-active">
                            {t('TRANSACTIONS_SHOW_ALL')}
                        </button>
                    {/if}
                </div>
            {/if}
        </div>

        <aside class="w-full shrink-0 lg:w-[300px]">
            <div class="mb-6"><Purse /></div>

            <!-- `transactions.html`'s second aside:
                 `<habbo-web-pages key="common/box_account_issues" class="aside aside--box">`. -->
            <WebPage key="common/box_account_issues" className="static-content--box overflow-hidden rounded-[3px] bg-card px-3 py-6 xs:px-6" />
        </aside>
    </section>
</ShopShell>
