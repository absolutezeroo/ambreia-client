<script lang="ts">
    // `/shop/order/:id` — where the browser lands after paying, and where it waits when the hotel's
    // provider hosts no payment page.
    //
    // DEVIATION: habbo.com has no such route; its shop is server-rendered and the provider returns
    // to a page the server had already updated. A SPA needs somewhere to come back TO, and the whole
    // point of this one is what it does NOT do:
    //
    //   it READS the order's state. It cannot change it.
    //
    // Arriving here is a navigation, and a navigation is something anybody can perform — typing the
    // URL, pressing back, a provider redirecting on a payment that was refused. If landing on this
    // page granted anything, the credits would be free. The grant happens on a signed webhook the
    // browser has no part in, so this polls `GET /api/user/shop/orders/{id}` and shows whatever the
    // server says, which is the only honest thing a return page can do.
    //
    // Polling rather than a socket: an order settles in seconds and then never changes again, so a
    // second connection for the two or three answers it needs would cost more than it saves. The
    // loop stops the moment the order reaches a state it cannot leave.
    import {link} from 'svelte-spa-router';
    import ShopShell from './ShopShell.svelte';
    import Sprite from '../../components/Sprite.svelte';
    import {t} from '../../lib/i18n.js';
    import Purse from '../../components/Purse.svelte';
    import MessageBox from '../../components/MessageBox.svelte';
    import * as api from '../../lib/api.js';
    import {SHOP_ORDER} from '../../lib/api.js';
    import type {IShopOrder} from '../../lib/api.js';
    import {formatDate, formatPrice, orderIsOpen, orderLabel, productName} from '../../lib/shop.js';

    let {params = {id: ''}} = $props();

    let order = $state<IShopOrder | null>(null);
    let error = $state('');

    // Long enough that a settled order is not being asked about every second, short enough that the
    // page does not feel stuck while the provider's notification is on its way.
    const POLL_MS = 3000;

    $effect(() =>
    {
        const id = params.id;
        let cancelled = false;
        let timer = 0;

        async function read()
        {
            try
            {
                const answer = await api.getShopOrder(id);

                if(cancelled)
                {
                    return;
                }

                order = answer;

                // Paid-and-delivered, cancelled, or parked for an operator: nothing more will happen
                // on its own, so stop asking.
                if(orderIsOpen(answer))
                {
                    timer = window.setTimeout(read, POLL_MS);
                }
            }
            catch (failure)
            {
                if(!cancelled)
                {
                    error = (failure as Error).message;
                }
            }
        }

        void read();

        return () =>
        {
            cancelled = true;
            window.clearTimeout(timer);
        };
    });
</script>

<ShopShell>
    <header>
        <h1 class="mt-0">{t('SITE_ORDER_TITLE')}</h1>
    </header>

    <section class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div class="min-w-0 flex-1">
            {#if error}
                <MessageBox type="exclamation">
                    <h2 class="mt-0">{error}</h2>
                    <p><a href="/shop" use:link>{t('NAVIGATION_SHOP')}</a></p>
                </MessageBox>
            {:else if !order}
                <!-- `router/spinner/inline-spinner.html` — a turning sprite and no words. -->
                <p><Sprite name="spinnerIndicator" className="[animation:rotating_1s_linear_infinite]" /></p>
            {:else}
                <MessageBox type={order.state === SHOP_ORDER.FULFILLED ? 'check' : 'exclamation'}>
                    <h2 class="mt-0">{orderLabel(order)}</h2>

                    <!-- Two of the five states have habbo.com wording of their own and take it:
                         `CREDITS_PENDING_MESSAGE` is exactly "your transaction is still going, come
                         back later", and `CREDITS_FAILURE_INSTRUCTIONS` is its refusal notice. The
                         other three describe a hand-over habbo.com's shop does not have, so they are
                         the port's own `SITE_ORDER_*` keys. All five were typed in French here. -->
                    {#if order.state === SHOP_ORDER.PENDING}
                        <p>{t('CREDITS_PENDING_MESSAGE')}</p>
                    {:else if order.state === SHOP_ORDER.PAID}
                        <p>{t('SITE_ORDER_PAID_TEXT')}</p>
                    {:else if order.state === SHOP_ORDER.FULFILLED}
                        <p>{t('SITE_ORDER_FULFILLED_TEXT', {product: productName(order)})}</p>
                    {:else if order.state === SHOP_ORDER.CANCELLED}
                        <p>{t('CREDITS_FAILURE_INSTRUCTIONS')}</p>
                    {:else}
                        <!-- NOT "échec". The money was taken and the hotel owes the goods; saying it
                             failed is how a support ticket turns into a chargeback — which is why
                             the note travels with the key, in locales/site/. -->
                        <p>{t('SITE_ORDER_INTERVENTION_TEXT')}</p>
                    {/if}
                </MessageBox>

                <!-- The three column headings of `transactions-list.html` — habbo.com's own words
                     for exactly these three facts — and the transaction line from
                     `payment-details`, which already carries the reference inside the sentence. -->
                <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 px-3 text-sm">
                    <dt>{t('TRANSACTIONS_TABLE_PURCHASE')}</dt>
                    <dd class="m-0 text-white">{productName(order)}</dd>

                    <dt>{t('TRANSACTIONS_TABLE_VALUE')}</dt>
                    <dd class="m-0 text-white">{formatPrice(order.priceMinor, order.currency)}</dd>

                    <dt>{t('TRANSACTIONS_TABLE_DATE')}</dt>
                    <dd class="m-0 text-white">{formatDate(order.createdAt)}</dd>
                </dl>

                <p class="px-3 font-mono text-xs break-all">
                    {t('SHOP_PAYMENT_TRANSACTION_DETAILS', {transactionId: order.id})}
                </p>

                <p class="px-3 text-sm">
                    <a href="/shop/history" use:link>{t('SHOP_TRANSACTIONS_TITLE')}</a>
                </p>
            {/if}
        </div>

        <aside class="w-full shrink-0 lg:w-[300px]">
            <Purse />
        </aside>
    </section>
</ShopShell>
