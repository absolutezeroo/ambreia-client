<script lang="ts">
    // `/habbo-nft` — the nav's fifth entry, "COLLECTIBLES".
    //
    // habbo.com serves this section as two editorial pages (`habbo-nft/habbo-avatars.html` and
    // `nft-furni-and-clothing.html`, both a bare `<habbo-compile data="HabboNFTController.page">`),
    // so there is no markup to port: the content is fetched at runtime from their CMS and describes
    // a different product — Habbo Avatars on Immutable, an NFT wardrobe, none of which exists here.
    // This page is therefore ours, and every string on it is marked `_OWN_` in fr.json.
    //
    // It used to be a StaticPage saying "rien n'est branché derrière : cet hôtel n'a pas de
    // portefeuille". That stopped being true the day the hotel deployed its own chain, and it was
    // the most visible wrong sentence on the site — the nav points every visitor straight at it.
    //
    // Two tabs are deliberately NOT reproduced. habbo.com's pair splits avatars from furni; this
    // hotel has one kind of collectible, and a tab bar with a single tab is noise.
    import {link} from 'svelte-spa-router';
    import PageHeader from '../components/PageHeader.svelte';
    import Panel from '../components/Panel.svelte';
    import * as api from '../lib/api.js';
    import {t} from '../lib/i18n.js';

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
            // A hotel with no chain is a supported way to run this: the three panels below still
            // describe what a Relic is, and only the contract line has nothing to say.
        }
    }

    loadChain();
</script>

<PageHeader title={t('HABBO_NFT_OWN_TITLE')} description={t('HABBO_NFT_OWN_DESCRIPTION')} illustration />

<main class="mx-auto max-w-[1200px] px-3 py-6">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div class="flex min-w-0 flex-1 flex-col gap-6">
            <Panel title={t('HABBO_NFT_OWN_MINT_TITLE')}>
                <p class="m-0 leading-relaxed">{t('HABBO_NFT_OWN_MINT')}</p>
            </Panel>

            <Panel title={t('HABBO_NFT_OWN_OUT_TITLE')}>
                <p class="m-0 leading-relaxed">{t('HABBO_NFT_OWN_OUT')}</p>

                <p class="mt-3 mb-0">
                    <a href="/settings/wallet" use:link>{t('HABBO_NFT_OWN_WALLET_LINK')}</a>
                </p>
            </Panel>

            <Panel title={t('HABBO_NFT_OWN_IN_TITLE')}>
                <p class="m-0 leading-relaxed">{t('HABBO_NFT_OWN_IN')}</p>
            </Panel>
        </div>

        <!-- Only with a chain, and only the two addresses that mean something to a reader: the
             collection a Relic belongs to, and where to send one home. The treasury is repeated from
             /settings/wallet on purpose — this is the page a visitor with no account reads. -->
        {#if chain?.collectibleAddress}
            <div class="w-full shrink-0 lg:w-[340px]">
                <Panel title={t('HABBO_NFT_OWN_CHAIN_TITLE')}>
                    <dl class="m-0">
                        <div class="py-0.5">
                            <dt class="font-bold">{t('HABBO_NFT_OWN_CONTRACT')}</dt>
                            <!-- Whole, never shortened: an address a reader is expected to paste
                                 into an explorer is not the same object as one that only has to be
                                 recognised in a list, which is what /settings/wallet's ellipsis is
                                 for. `break-all` because 42 characters do not wrap on their own. -->
                            <dd class="break-all text-sm">{chain.collectibleAddress}</dd>
                        </div>

                        {#if chain.treasuryAddress}
                            <div class="mt-3 py-0.5">
                                <dt class="font-bold">{t('WALLET_SETTINGS_OWN_TREASURY')}</dt>
                                <dd class="break-all text-sm">{chain.treasuryAddress}</dd>
                            </div>
                        {/if}
                    </dl>
                </Panel>
            </div>
        {/if}
    </div>
</main>
