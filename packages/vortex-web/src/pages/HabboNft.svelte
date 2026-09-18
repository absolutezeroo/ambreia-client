<script lang="ts">
    // `/habbo-nft` — the nav's fifth entry, "COLLECTIBLES".
    //
    // habbo.com's shell is `habbo-nft/habbo-nft.html`: a small header, a two-tab bar, and
    // `<article class="main main--fixed static-content">` holding an HTML fragment its CMS serves
    // (`habbo_nft/nft_furni_and_clothing`). The SHAPE is ported here and the TEXT is not, because
    // their page describes a different product: Habbo Avatars as a PFP collection, Collectibles on
    // Immutable, buying ETH, a TokenTrove account, Emeralds. This hotel has none of that — it runs
    // its own chain, hands every player a wallet they never install, and its collectible is a piece
    // of furniture the player already owned. So every string below is ours, marked `_OWN_`.
    //
    // It is `.static-content` all the same, and deliberately: that stylesheet IS this kind of
    // editorial page — the floated illustration, the dotted `<hr>`, the disc list — and habbo.com's
    // own habbo-nft article carries the class too. Writing the same look in utilities would be a
    // second copy of rules that are already here.
    //
    // ONE tab, so no bar. habbo.com's second tab is a product (Habbo Avatars), not a rubric, and a
    // bar with a single tab is noise — `Tabs` keeps the dark band and the title either way, which is
    // the chrome the page actually needs.
    import {link} from 'svelte-spa-router';
    import Tabs from '../components/Tabs.svelte';
    import * as api from '../lib/api.js';
    import {t} from '../lib/i18n.js';

    // The stack of convertible furni, floated right exactly as habbo.com floats it. It is the only
    // thing this page takes from theirs — see tools/fetch-assets.mjs.
    const FURNI = new URL('../assets/nft_furni.png', import.meta.url).href;

    let chain = $state<api.IChainDescriptor | null>(null);

    async function loadChain(): Promise<void>
    {
        try
        {
            const descriptor = await api.getChain();

            chain = descriptor.enabled ? descriptor : null;
        }
        catch
        {
            // A hotel with no chain is a supported way to run this: the steps below still describe
            // what a Relic is, and only the addresses at the end have nothing to say.
        }
    }

    loadChain();
</script>

<Tabs title={t('HABBO_NFT_OWN_TITLE')} />

<main class="mx-auto w-full max-w-[1200px] px-3 py-6">
    <article class="static-content">
        <img src={FURNI} alt="" class="align-right" width="300" />

        <p>{t('HABBO_NFT_OWN_DESCRIPTION')}</p>
        <p>{t('HABBO_NFT_OWN_INTRO_CHAIN')}</p>
        <p>{t('HABBO_NFT_OWN_STEPS_LEAD')}</p>

        <!-- habbo.com's own bullet shape: a bold label — a link when there is somewhere to go —
             then an en dash and the sentence that explains it. -->
        <ul>
            <li>
                <strong>{t('HABBO_NFT_OWN_MINT_TITLE')}</strong> – {t('HABBO_NFT_OWN_MINT')}
            </li>
            <li>
                <strong><a href="/settings/wallet" use:link>{t('HABBO_NFT_OWN_WALLET_LINK')}</a></strong>
                – {t('HABBO_NFT_OWN_WALLET')}
            </li>
            <li>
                <strong>{t('HABBO_NFT_OWN_OUT_TITLE')}</strong> – {t('HABBO_NFT_OWN_OUT')}
            </li>
            <li>
                <strong>{t('HABBO_NFT_OWN_IN_TITLE')}</strong> – {t('HABBO_NFT_OWN_IN')}
            </li>
        </ul>

        <!-- Only with a chain, and only the two addresses that mean something to a reader: the
             collection a Relic belongs to, and where to send one home. The treasury is repeated from
             /settings/wallet on purpose — this is the page a visitor with no account reads. -->
        {#if chain?.collectibleAddress}
            <hr />

            <h2>{t('HABBO_NFT_OWN_CHAIN_TITLE')}</h2>

            <ul>
                <!-- Whole, never shortened: an address a reader is expected to paste into an
                     explorer is not the same object as one that only has to be recognised in a
                     list, which is what /settings/wallet's ellipsis is for. `break-all` because 42
                     characters do not wrap on their own. -->
                <li>
                    <strong>{t('HABBO_NFT_OWN_CONTRACT')}</strong>
                    – <span class="break-all">{chain.collectibleAddress}</span>
                </li>

                {#if chain.treasuryAddress}
                    <li>
                        <strong>{t('WALLET_SETTINGS_OWN_TREASURY')}</strong>
                        – <span class="break-all">{chain.treasuryAddress}</span>
                    </li>
                {/if}
            </ul>
        {/if}
    </article>
</main>
