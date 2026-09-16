<script lang="ts">
    // `/settings/wallet` — `settings/wallet-settings/wallet-settings.html` + `wallet-settings-form`:
    // a title, a paragraph, then one row per wallet with its address and a Disconnect button, and a
    // last row that is the Connect button. Below that habbo.com has an avatar-perk picker, which
    // this hotel has nothing to fill.
    //
    // The labels are habbo.com's own keys. The DESCRIPTION is not: `WALLET_SETTINGS_DESCRIPTION`
    // promises free Habbo Club, clothing from an Immutable collection and badges tied to Habbo
    // Avatars NFTs — a different product's terms, and printing them here would be promising things
    // this hotel does not do.
    //
    // THE HOTEL'S OWN WALLET IS NOT A ROW. It is derived from the hotel's master seed rather than
    // stored, it cannot be disconnected, and habbo.com draws it differently for exactly that
    // reason — a copy button where the others have Disconnect.
    import SettingsShell from './SettingsShell.svelte';
    import Button from '../../components/Button.svelte';
    import * as api from '../../lib/api.js';
    import * as notifier from '../../lib/notifier.js';
    import {t} from '../../lib/i18n.js';

    let wallets = $state<api.IWallets | null>(null);
    let chain = $state<api.IChainDescriptor | null>(null);
    let busy = $state(false);
    let loaded = $state(false);

    // Whether a browser wallet is present at all. `window.ethereum` is what every extension injects,
    // and its absence is the ordinary case rather than an error — most visitors have no wallet.
    const injected = $derived.by(() => typeof window !== 'undefined' && 'ethereum' in window);

    async function load(): Promise<void>
    {
        try
        {
            wallets = await api.getWallets();
        }
        catch
        {
            // Left null: the page shows nothing rather than claiming the player has no wallets,
            // which is a different statement from "this did not load".
        }
        finally
        {
            loaded = true;
        }
    }

    // Separately, and never in the way: the chain is what the network button and the hotel's
    // treasury address come from, and a hotel running without one is the ordinary case. A failure
    // here hides those two rows and nothing else.
    async function loadChain(): Promise<void>
    {
        try
        {
            const descriptor = await api.getChain();

            chain = descriptor.enabled ? descriptor : null;
        }
        catch
        {
            // Nothing to say: no chain means no network to add and nowhere to send a Relic back to.
        }
    }

    load();
    loadChain();

    // `wallet_addEthereumChain` is how a wallet learns a network it has never seen. It is idempotent
    // — a wallet that already has this chain id simply switches to it — so the button stays useful
    // rather than being something to press exactly once.
    async function addNetwork(): Promise<void>
    {
        const ethereum = (window as unknown as {ethereum?: IEthereum}).ethereum;

        if(!ethereum || !chain)
        {
            return;
        }

        try
        {
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: chain.chainIdHex,
                    chainName: chain.currencyName,
                    rpcUrls: [chain.rpcUrl],
                    nativeCurrency: {
                        name: chain.currencyName,
                        symbol: chain.currencySymbol,
                        decimals: chain.currencyDecimals,
                    },
                }],
            });
        }
        catch(failure)
        {
            if((failure as {code?: number})?.code === 4001)
            {
                return;
            }

            notifier.errorStickyRawMessage(
                (failure as Error)?.message ?? '',
                'WALLET_SETTINGS_TITLE'
            );
        }
    }

    async function connect(): Promise<void>
    {
        const ethereum = (window as unknown as {ethereum?: IEthereum}).ethereum;

        if(!ethereum)
        {
            return;
        }

        busy = true;

        try
        {
            const accounts = await ethereum.request({method: 'eth_requestAccounts'}) as string[];
            const address = accounts?.[0];

            if(!address)
            {
                return;
            }

            // The challenge is asked for AFTER the account is known, not before: a visitor who
            // opens the wallet and then closes it without choosing would otherwise have burnt a
            // nonce, and the next attempt would be refused as expired.
            const challenge = await api.getWalletChallenge();

            // `personal_sign` takes the message first and the address second — the opposite of
            // `eth_sign`, which takes them the other way round and which wallets refuse anyway. The
            // message is the server's own string, passed through untouched.
            const signature = await ethereum.request({
                method: 'personal_sign',
                params: [challenge.message, address],
            }) as string;

            wallets = await api.linkWallet(address, signature);

            notifier.success('WALLET_SETTINGS_CONNECT');
        }
        catch(failure)
        {
            // A wallet reports a refused prompt as an error, and a visitor changing their mind is
            // not a failure to shout about — 4001 is the code every wallet uses for it.
            if((failure as {code?: number})?.code === 4001)
            {
                return;
            }

            notifier.errorStickyRawMessage(
                (failure as Error)?.message ?? '',
                'WALLET_SETTINGS_TITLE'
            );
        }
        finally
        {
            busy = false;
        }
    }

    async function disconnect(address: string): Promise<void>
    {
        busy = true;

        try
        {
            wallets = await api.unlinkWallet(address);

            notifier.success('WALLET_SETTINGS_DISCONNECT');
        }
        catch(failure)
        {
            notifier.errorStickyRawMessage(
                (failure as Error)?.message ?? '',
                'WALLET_SETTINGS_TITLE'
            );
        }
        finally
        {
            busy = false;
        }
    }

    async function copy(address: string): Promise<void>
    {
        try
        {
            await navigator.clipboard.writeText(address);

            notifier.success('NATIVE_HOTEL_LAUNCH_COPIED_CODE');
        }
        catch
        {
            // Clipboard access is refused outside a secure context and in some embedded browsers.
            // The address is on screen and selectable either way.
        }
    }

    // `ellipsis:8` in habbo.com's own template: an address is 42 characters and a row is not.
    function shorten(address: string): string
    {
        return `${address.slice(0, 8)}…${address.slice(-6)}`;
    }

    interface IEthereum
    {
        request(args: {method: string; params?: unknown[]}): Promise<unknown>;
    }
</script>

<SettingsShell>
    <h2 class="mb-3">{t('WALLET_SETTINGS_TITLE')}</h2>

    <p class="mb-6 text-sm">{t('WALLET_SETTINGS_OWN_DESCRIPTION')}</p>

    {#if loaded && wallets}
        <!-- The hotel's own wallet, first and shaped differently: it has a copy button where the
             others have Disconnect, because nobody disconnects the one the hotel holds for them. -->
        {#if wallets.stardustAddress}
            <div class="mb-1.5 flex items-center justify-between gap-3 rounded-[3px] bg-card px-3 py-3">
                <code class="min-w-0 truncate text-sm">{shorten(wallets.stardustAddress)}</code>
                <!-- DEVIATION: habbo.com's `habbo-text-copy` is an ICON with two sprite states and
                     no text at all (`text-copy-button.html`), and that cut is not in this port's
                     sprite index. A labelled button says the same thing; the label is habbo.com's
                     own word for this action, from the one other place it copies something. -->
                <button type="button" class="shrink-0 underline"
                        onclick={() => copy(wallets!.stardustAddress!)}>
                    {t('NATIVE_HOTEL_LAUNCH_COPY_CODE')}
                </button>
            </div>
        {/if}

        {#each wallets.linkedAddresses as address (address)}
            <div class="mb-1.5 flex items-center justify-between gap-3 rounded-[3px] bg-card px-3 py-3">
                <code class="min-w-0 truncate text-sm">{shorten(address)}</code>
                <button type="button" class="shrink-0 underline" disabled={busy}
                        onclick={() => disconnect(address)}>
                    {t('WALLET_SETTINGS_DISCONNECT')}
                </button>
            </div>
        {/each}

        {#if injected}
            <div class="mt-3 flex flex-wrap gap-2">
                <Button variant="green" onclick={connect} disabled={busy}>
                    {t('WALLET_SETTINGS_CONNECT')}
                </Button>

                <!-- Only with a chain to add. A button that tells a wallet about a network the
                     hotel does not run would fail in the extension, where the error is somebody
                     else's to explain. -->
                {#if chain}
                    <Button onclick={addNetwork}>{t('WALLET_SETTINGS_OWN_NETWORK')}</Button>
                {/if}
            </div>
        {:else}
            <!-- habbo.com's own line for this, and the ordinary case: most visitors have no wallet
                 extension, which is not an error and gets no red box. -->
            <p class="mt-3 text-sm opacity-70">{t('WALLET_SETTINGS_NOT_INSTALLED')}</p>
        {/if}
    {/if}

    <!-- The way back in, which has no button anywhere because it is not an action the hotel takes:
         the player sends the token themselves, from their own wallet, and the hotel notices. So the
         only thing this page owes them is the address and what happens when they use it. -->
    {#if chain?.treasuryAddress}
        <h3 class="mt-8 mb-2">{t('WALLET_SETTINGS_OWN_TREASURY')}</h3>

        <div class="mb-1.5 flex items-center justify-between gap-3 rounded-[3px] bg-card px-3 py-3">
            <code class="min-w-0 truncate text-sm">{shorten(chain.treasuryAddress)}</code>
            <button type="button" class="shrink-0 underline"
                    onclick={() => copy(chain!.treasuryAddress!)}>
                {t('NATIVE_HOTEL_LAUNCH_COPY_CODE')}
            </button>
        </div>

        <p class="text-sm opacity-70">{t('WALLET_SETTINGS_OWN_TREASURY_DESCRIPTION')}</p>
    {/if}
</SettingsShell>
