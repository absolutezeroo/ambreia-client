<script lang="ts">
    // `shop/shop.html` — the shell, and only the shell:
    //
    //   <habbo-header-small active="shop">
    //   <habbo-tabs> Acheter | Offres prépayées | Mes achats
    //   <main class="wrapper wrapper--content" ui-view></main>
    //   <habbo-shop-footer class="wrapper wrapper--content">
    //
    // Each tab is its own `$state` with its own template — `shop/store/store.html`,
    // `shop/prepaid/prepaid.html`, `shop/transactions/transactions.html` — and they are genuinely
    // different pages: the store has a country picker over a grid, prepaid has the voucher form,
    // transactions has a list beside the purse. One file branching on the URL flattened all three.
    import Tabs from '../../components/Tabs.svelte';
    import ShopFooter from './ShopFooter.svelte';
    import {SHOP_TABS} from '../../lib/tabs.js';

    let {children} = $props();
</script>

<Tabs tabs={SHOP_TABS} />

<main class="mx-auto max-w-[1200px] px-3 py-6">
    {@render children()}
</main>

<!-- `<habbo-shop-footer class="wrapper wrapper--content">` sits in the SHELL, so it shows under all
     three tabs — the consumer notice is not a property of the store page. -->
<ShopFooter />
