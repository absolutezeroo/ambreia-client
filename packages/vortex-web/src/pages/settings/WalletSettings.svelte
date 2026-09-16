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
    import Sprite from '../../components/Sprite.svelte';
    import * as api from '../../lib/api.js';
    import * as notifier from '../../lib/notifier.js';
    import {t} from '../../lib/i18n.js';

    let wallets = $state<api.IWallets | null>(null);
    let chain = $state<api.IChainDescriptor | null>(null);
    let busy = $state(false);
    let loaded = $state(false);

    // `habbo-text-copy`'s `status`: 0 is the copy icon, 1 the tick it flips to. habbo.com never
    // flips it back — the component is created with status 0 and the click sets 1 — and neither does
    // this, for the same reason it reads well: the tick is a receipt, not a state to leave.
    let copied = $state('');

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

            copied = address;
        }
        catch
        {
            // Clipboard access is refused outside a secure context and in some embedded browsers.
            // The address is on screen and selectable either way, and the icon stays as it was
            // rather than claiming a copy that did not happen.
        }
    }

    // `ellipsis:8` in habbo.com's own template: an address is 42 characters and a row is not.
    function shorten(address: string): string
    {
        return `${address.slice(0, 8)}…${address.slice(-6)}`;
    }

    // `.wallet-setting`, `-begin` and `-end`, verbatim. The card is #0e3955 — the panel-head token,
    // NOT --color-card, which is the lighter #0b6395 every other boxed thing on the site uses.
    //
    // `self-start` / `self-end` rather than `items-center` is habbo.com's own choice and it is what
    // makes the row survive a perk mark stacking two lines beside the button: the address stays at
    // the top of the card and the button at the bottom, instead of both drifting to a moving middle.
    const ROW = 'my-[15px] flex w-full flex-row justify-between rounded-[3px] bg-panel-head px-2.5 py-5';
    const BEGIN = 'flex min-w-0 flex-row self-start';
    const END = 'flex flex-row items-center justify-end self-end';

    // `.wallet-setting-end-texts`: the perk column is drawn at 80%, and habbo.com scales the mark
    // inside it AGAIN by 80% — so the tick ends up at 64% of the cut. Both are kept, because
    // flattening them to one factor is how a "pixel-identical" port stops being one.
    const TEXTS = 'flex origin-right scale-80 flex-col pr-[5px]';
    const PERK = 'relative text-right leading-[27px]';

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
            <div class={ROW}>
                <div class={BEGIN}>
                    <Sprite name="walletStardust" className="mr-1.5" />
                    <span class="leading-[45px]">{shorten(wallets.stardustAddress)}</span>
                    {@render copyIcon(wallets.stardustAddress)}
                </div>

                <div class={END}>
                    {@render perk(wallets.stardustAddress)}
                </div>
            </div>
        {/if}

        {#each wallets.linkedAddresses as address (address)}
            <div class={ROW}>
                <div class={BEGIN}>
                    <Sprite name="walletMetamask" className="mr-1.5" />
                    <span class="leading-[42px]">{shorten(address)}</span>
                </div>

                <div class={END}>
                    {@render perk(address)}

                    <Button disabled={busy} onclick={() => disconnect(address)}>
                        {t('WALLET_SETTINGS_DISCONNECT')}
                    </Button>
                </div>
            </div>
        {/each}

        {#if injected}
            <!-- `.wallet-setting-add`: the same card at HALF width, with the add icon where the
                 other rows have their wallet's. -->
            <div class="{ROW} md:w-1/2">
                <div class={BEGIN}>
                    <Sprite name="walletAdd" />
                </div>

                <div class="{END} flex-wrap gap-2">
                    <!-- Only with a chain to add. A button that tells a wallet about a network the
                         hotel does not run would fail inside the extension, where the error is
                         somebody else's to explain. -->
                    {#if chain}
                        <Button onclick={addNetwork}>{t('WALLET_SETTINGS_OWN_NETWORK')}</Button>
                    {/if}

                    <Button onclick={connect} disabled={busy}>
                        {t('WALLET_SETTINGS_CONNECT')}
                    </Button>
                </div>
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
        <h3 class="mt-8">{t('WALLET_SETTINGS_OWN_TREASURY')}</h3>

        <div class={ROW}>
            <div class={BEGIN}>
                <span class="leading-[45px]">{shorten(chain.treasuryAddress)}</span>
            </div>

            <div class={END}>
                {@render copyIcon(chain.treasuryAddress)}
            </div>
        </div>

        <p class="text-sm opacity-70">{t('WALLET_SETTINGS_OWN_TREASURY_DESCRIPTION')}</p>
    {/if}
</SettingsShell>

<!-- `habbo-nft-perk`, and it means here what it means there: whether this wallet holds one of the
     hotel's own NFTs. habbo.com asks it about a Habbo Avatar, which buys free HC and the Immutable
     wardrobe; this hotel asks it about a Relic, which is the thing its collection is made of. The
     question is the same one, so the mark is not decoration — an address that shows no tick is an
     address the Transfer tab has not sent anything to yet.

     Both cuts are habbo.com's: `.wallet-setting-perk-active::before` is `statusCheck` at 22x27 with
     28px of clearance, `-inactive::before` is `statusCross` at 25x27 with 31px. -->
{#snippet perk(address: string)}
    {@const held = wallets?.relicHolders.includes(address) ?? false}

    <div class={TEXTS}>
        <div class="{PERK} {held ? 'pr-[28px]' : 'pr-[31px]'}">
            {t(held ? 'WALLET_SETTINGS_PERKS_ACTIVE' : 'WALLET_SETTINGS_PERKS_INACTIVE')}

            <Sprite
                name={held ? 'statusCheck' : 'statusCross'}
                className="absolute right-0 top-1/2 -translate-y-1/2 scale-80"
            />
        </div>
    </div>
{/snippet}

<!-- `habbo-text-copy`: an icon, not a labelled button, and it flips to a tick once the address is on
     the clipboard. `.text-copy` carries the 20px/10px offset that sets it beside the address. -->
{#snippet copyIcon(address: string)}
    <button type="button" class="ml-5 mt-2.5 self-start" onclick={() => copy(address)}
            aria-label={t('NATIVE_HOTEL_LAUNCH_COPY_CODE')}>
        {#if copied === address}
            <Sprite name="statusCheck" className="scale-60" />
        {:else}
            <Sprite name="textCopy" />
        {/if}
    </button>
{/snippet}
