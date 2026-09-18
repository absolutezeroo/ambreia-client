<script lang="ts">
    // `/habbo-nft/relic/:id` — one Relic's own page, and the thing the whole system was missing: a
    // Relic is a real ERC-721 and had no address on the web at all. `VortexCollectible`'s `tokenURI`
    // answers a JSON document, which is what a wallet reads; nothing answered a person. The token's
    // `external_url` points here, so a marketplace listing has somewhere to send a reader back to.
    //
    // OPEN, never guarded: whoever holds a Relic may have no account on this hotel — that is the
    // point of taking one out — and a marketplace rendering it has no session by definition.
    //
    // It reads `/api/public/collectibles/{id}`, the SAME document the wallet reads, rather than a
    // friendlier endpoint of its own. A second source is a second thing to keep in step, and this
    // way the page is also the check that the metadata document is right.
    import {link} from 'svelte-spa-router';
    import EmptyResults from '../components/EmptyResults.svelte';
    import Panel from '../components/Panel.svelte';
    import * as api from '../lib/api.js';
    import {t} from '../lib/i18n.js';

    let {params = {}}: {params?: {id?: string}} = $props();

    let relic = $state<api.ITokenMetadata | null>(null);
    let chain = $state<api.IChainDescriptor | null>(null);
    let loading = $state(true);

    // Keyed on the route parameter the same way RoomPage is: the router reuses the component
    // between two ids, so a fetch that is not re-run on the parameter leaves the previous Relic on
    // screen under the new URL.
    $effect(() =>
    {
        const id = params.id ?? '';
        let cancelled = false;

        loading = true;

        void api.getCollectible(id)
            .then((answer) => !cancelled && (relic = answer))
            .catch(() => !cancelled && (relic = null))
            .finally(() => !cancelled && (loading = false));

        return () => (cancelled = true);
    });

    async function loadChain(): Promise<void>
    {
        try
        {
            const descriptor = await api.getChain();

            chain = descriptor.enabled ? descriptor : null;
        }
        catch
        {
            // The Relic is described without it. Only the contract line goes.
        }
    }

    loadChain();
</script>

{#if loading}
    <main class="mx-auto max-w-[1200px] px-3 py-6"></main>
{:else if !relic}
    <main class="mx-auto max-w-[1200px] px-3 py-6">
        <EmptyResults key="RELIC_OWN_NOT_FOUND" />

        <p class="mt-6 text-center"><a href="/habbo-nft" use:link>{t('HABBO_NFT_OWN_TITLE')}</a></p>
    </main>
{:else}
    <main class="mx-auto max-w-[1200px] px-3 py-6">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div class="min-w-0 flex-1">
                <div class="flex gap-3">
                    <!-- `.room__thumbnail`'s plate, which is the site's one "a picture goes here"
                         frame. The icon is the furni's catalogue icon off the asset host and is
                         small pixel art, so it is centred in the plate at its own size rather than
                         stretched — and the plate stands empty when the hotel serves no asset host,
                         which is what a null `image` means. -->
                    <div class="flex size-[114px] shrink-0 items-center justify-center self-start
                                rounded-[3px] border-2 border-pill-line bg-[#01353c] shadow-pill">
                        {#if relic.image}
                            <img src={relic.image} alt="" class="max-h-full max-w-full [image-rendering:pixelated]" />
                        {/if}
                    </div>

                    <div class="min-w-0 flex-1">
                        <!-- `normal-case`: the name is the furni's classname and its edition
                             ("club_sofa #3 of 50"), and the site's uppercase h1 turns a classname
                             into something that is not it. -->
                        <h1 class="mt-0 normal-case break-words">{relic.name}</h1>
                        <p class="leading-relaxed">{relic.description}</p>
                    </div>
                </div>

                {#if relic.attributes.length}
                    <!-- The attribute names are the TOKEN's, in the schema's own English, and they
                         are not translated here: this list is what the document says, and a reader
                         comparing it against a marketplace has to find the same words. -->
                    <ul class="mt-6">
                        {#each relic.attributes as attribute (attribute.trait_type)}
                            <li class="flex gap-6 py-1.5">
                                <h3 class="m-0 w-[140px] shrink-0">{attribute.trait_type}</h3>
                                <span class="min-w-0 break-words">{attribute.value}</span>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>

            <div class="w-full shrink-0 lg:w-[340px]">
                <Panel title={t('HABBO_NFT_OWN_CHAIN_TITLE')}>
                    <dl class="m-0">
                        <!-- The hotel's asset id IS the ERC-721 token id — one numbering for one
                             object, which is the decision that lets this page be reached by
                             concatenating the id onto a base URL in the first place. -->
                        <div class="py-0.5">
                            <dt class="font-bold">{t('RELIC_OWN_TOKEN')}</dt>
                            <dd class="text-sm">{params.id}</dd>
                        </div>

                        {#if chain?.collectibleAddress}
                            <div class="mt-3 py-0.5">
                                <dt class="font-bold">{t('HABBO_NFT_OWN_CONTRACT')}</dt>
                                <dd class="break-all text-sm">{chain.collectibleAddress}</dd>
                            </div>
                        {/if}
                    </dl>

                    <p class="mt-6 mb-0 text-sm">
                        <a href="/habbo-nft" use:link>{t('HABBO_NFT_OWN_TITLE')}</a>
                    </p>
                </Panel>
            </div>
        </div>
    </main>
{/if}
