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

    /**
     * The token's picture, handed to the wallet by `wallet_watchAsset` — see its call below.
     *
     * `?no-inline` is load-bearing. The file is 2 KB, under Vite's 4 KB inlining limit, so without
     * it the build turns this into a `data:image/png;base64,…` URI. That is fine for an `<img>`
     * and wrong here: this string leaves the page and goes to MetaMask, which fetches and caches
     * the image itself. It was an http url while the file lived in `public/`, and moving it into
     * `assets/` is what silently changed its KIND — the sort of break a build does not report.
     */
    const COIN_IMAGE = new URL(
        '../../assets/vortexcoin-256.png?no-inline',
        import.meta.url,
    ).href;

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

    // The chain the wallet is on RIGHT NOW, as `eth_chainId` reports it. It is the only thing a
    // wallet will tell us about its networks: there is no "do you know chain X" call, so the step
    // below says "you are on the Vortex network" — which is observable — and never "you have added
    // it", which is not.
    let chainId = $state<string | null>(null);

    // Whether VortexCoin was added FROM THIS BROWSER. `wallet_watchAsset` answers at the moment of
    // the call and nowhere else: a reload cannot ask the wallet what tokens it lists. So this is
    // remembered locally and the step says as much rather than implying the wallet was asked.
    let coinAdded = $state(false);

    const COIN_ADDED_KEY = 'vortex.wallet.coin';

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

            // Keyed by the chain, because a hotel that redeploys onto a new chain id has a new
            // token at a new address and the old tick would be about something else.
            if(chain)
            {
                coinAdded = read(`${COIN_ADDED_KEY}.${chain.chainIdHex}`) === '1';
            }
        }
        catch
        {
            // Nothing to say: no chain means no network to add and nowhere to send a Relic back to.
        }
    }

    // Storage is refused outright in a private window and in some embedded browsers, and it throws
    // on ACCESS rather than returning null. An unticked optional step is the right answer there.
    function read(key: string): string | null
    {
        try
        {
            return localStorage.getItem(key);
        }
        catch
        {
            return null;
        }
    }

    function write(key: string, value: string): void
    {
        try
        {
            localStorage.setItem(key, value);
        }
        catch
        {
            // As above. The tick simply does not survive the reload.
        }
    }

    async function readNetwork(): Promise<void>
    {
        const ethereum = (window as unknown as {ethereum?: IEthereum}).ethereum;

        if(!ethereum)
        {
            return;
        }

        try
        {
            chainId = await ethereum.request({method: 'eth_chainId'}) as string;
        }
        catch
        {
            // A locked wallet answers this one anyway, but an extension that is still starting up
            // may not. Left null: the step reads as not-yet-done, and its button still works.
        }
    }

    load();
    loadChain();
    readNetwork();

    // The network step is the one piece of this page that changes without anybody touching it — a
    // player switching networks in the extension. Without this the tick would only ever be right
    // until the first switch, which is worse than no tick.
    $effect(() =>
    {
        const ethereum = (window as unknown as {ethereum?: IEthereum}).ethereum;

        if(!ethereum?.on)
        {
            return;
        }

        const changed = (id: string): void =>
        {
            chainId = id;
        };

        ethereum.on('chainChanged', changed);

        return () => ethereum.removeListener?.('chainChanged', changed);
    });

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

            // It also SWITCHES to the chain, so the step below is done the moment this returns —
            // but a wallet that was already on it emits no `chainChanged`, and one that emits none
            // at all would leave the tick behind forever. Asking costs one call.
            await readNetwork();
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

    // VortexCoin is an ERC-20 (VortexCoin.sol), so a wallet does not show it until it is imported,
    // and `wallet_watchAsset` is the only way to hand it an icon: MetaMask's own import form has no
    // image field, and its token API only indexes public chains. Idempotent like addNetwork().
    //
    // The image URL is absolute because the extension fetches it itself, and versioned because
    // MetaMask stores the URL and the browser caches the file — overwriting the PNG in place would
    // leave part of the players on the old icon forever. Bump the name to change the art.
    async function addCoin(): Promise<void>
    {
        const ethereum = (window as unknown as {ethereum?: IEthereum}).ethereum;

        if(!ethereum || !chain?.coinAddress)
        {
            return;
        }

        try
        {
            // EIP-747 answers with a boolean, and it is the only readback this action ever gets.
            // MetaMask resolves `false` on a refusal where other wallets throw 4001, so both are
            // handled: anything that is not an explicit `false` counts as added.
            const added = await ethereum.request({
                method: 'wallet_watchAsset',
                // Alone among the wallet methods, this one takes an object rather than an array —
                // passing it wrapped in one is rejected as an invalid request.
                params: {
                    type: 'ERC20',
                    options: {
                        address: chain.coinAddress,
                        // NOT `chain.currencySymbol`/`currencyDecimals`: those describe the chain's
                        // NATIVE coin, the one that pays for gas, and the endpoint hardcodes 18
                        // because that is how the node counts wei. They agree with the token today
                        // only because both were called VTX — which is also why a wallet lists two
                        // VTX rows. These come from the token itself: VortexCoin.sol declares
                        // `ERC20("VortexCoin", "VTX")` and does not override `decimals()`, so
                        // OpenZeppelin's 18 stands.
                        symbol: 'VTX',
                        decimals: 18,
                        // Imported, not `${location.origin}/vortexcoin-256.png`. The file left
                        // `public/`, where it was the only thing not served by a route, and a
                        // hand-built path would now point at nothing — Vite hashes an imported
                        // asset into `/assets/`. `new URL(…, import.meta.url).href` still gives
                        // the ABSOLUTE url this needs: MetaMask fetches the image itself, from
                        // outside the page, so a relative path would not reach it.
                        image: COIN_IMAGE,
                    },
                },
            });

            if(added !== false && chain)
            {
                coinAdded = true;
                write(`${COIN_ADDED_KEY}.${chain.chainIdHex}`, '1');
            }
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
        // `params` is an array for every method here but `wallet_watchAsset`, which EIP-747
        // defines as a bare object.
        request(args: {method: string; params?: unknown[] | Record<string, unknown>}): Promise<unknown>;
        // EIP-1193's event half. Optional because it is not what makes this page work — a wallet
        // without it simply never re-reports its network on its own.
        on?(event: string, handler: (payload: never) => void): void;
        removeListener?(event: string, handler: (payload: never) => void): void;
    }

    /** One line of the setup list: what it is, why, whether it is done, and the button that does it. */
    interface IStep
    {
        label: string;
        hint: string;
        done: boolean;
        action: string;
        run: () => void;
    }

    // DEVIATION from habbo.com, which puts three unordered buttons in the add row. They are not
    // unordered here: connecting is the only one the hotel needs, and the other two configure the
    // wallet so that what it now holds is visible and can be sent back. Numbering them says that
    // once, where a row of buttons asks every player to guess it.
    //
    // Every step's button stays clickable after its tick, because all three actions are idempotent
    // and the second one is often the point: connecting a SECOND wallet, switching back to the
    // Vortex network, re-adding the token in another browser. A tick is the current state, not a
    // door that closes.
    const linked = $derived((wallets?.linkedAddresses.length ?? 0) > 0);

    // Case-insensitively, because `eth_chainId` is minimal hex (`0x7a69`) and nothing promises the
    // two sides spell the same digits the same way.
    const onNetwork = $derived(
        !!chain && !!chainId && chainId.toLowerCase() === chain.chainIdHex.toLowerCase()
    );

    const steps = $derived.by(() =>
    {
        const list: IStep[] = [{
            label: t('WALLET_SETTINGS_OWN_STEP_CONNECT'),
            hint: t('WALLET_SETTINGS_OWN_STEP_CONNECT_HINT'),
            done: linked,
            action: t('WALLET_SETTINGS_CONNECT'),
            run: connect,
        }];

        // Gated exactly as the buttons were: no chain means no network to add, and a chain with no
        // coin deployed on it yet means there is nothing for a wallet to watch.
        if(chain)
        {
            list.push({
                label: t('WALLET_SETTINGS_OWN_STEP_NETWORK'),
                hint: t('WALLET_SETTINGS_OWN_STEP_NETWORK_HINT'),
                done: onNetwork,
                action: t('WALLET_SETTINGS_OWN_NETWORK'),
                run: addNetwork,
            });
        }

        if(chain?.coinAddress)
        {
            list.push({
                label: t('WALLET_SETTINGS_OWN_STEP_COIN'),
                hint: t('WALLET_SETTINGS_OWN_STEP_COIN_HINT'),
                done: coinAdded,
                action: t('WALLET_SETTINGS_OWN_COIN'),
                run: addCoin,
            });
        }

        return list;
    });
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
            <!-- `.wallet-setting-add`, with the add icon where the other rows have their wallet's —
                 but at full width rather than habbo.com's `md:w-1/2`, because what sits beside the
                 icon is now three labelled lines instead of one button. -->
            <div class="{ROW} flex-col gap-5 md:flex-row">
                <div class={BEGIN}>
                    <Sprite name="walletAdd" />
                </div>

                <div class="flex w-full min-w-0 flex-col gap-5 md:pl-5">
                    {#each steps as step, index (step.label)}
                        <div class="flex flex-row flex-wrap items-center gap-x-4 gap-y-3">
                            <!-- The number turns into habbo.com's own tick, the same one the perk
                                 mark and the copy button use. -->
                            <div class="flex size-7 shrink-0 self-start items-center justify-center
                                        rounded-full font-condensed text-sm
                                        {step.done ? 'bg-play' : 'bg-btn'}">
                                {#if step.done}
                                    <Sprite name="statusCheck" className="scale-60" />
                                {:else}
                                    {index + 1}
                                {/if}
                            </div>

                            <div class="min-w-0 flex-1">
                                <div class="font-condensed uppercase">{step.label}</div>
                                <p class="text-sm opacity-70">{step.hint}</p>
                            </div>

                            <!-- One width for the three, or a column of buttons sized by their own
                                 labels reads as three unrelated actions rather than a list. Only
                                 from `md`: at phone width the button is the full row. -->
                            <Button
                                variant={index === 0 && !step.done ? 'green' : 'blue'}
                                className="w-full md:w-auto md:min-w-[230px]"
                                disabled={busy}
                                onclick={step.run}
                            >
                                {step.action}
                            </Button>
                        </div>
                    {/each}
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
    <!-- `?.` on a field the type says is always there, because the site and the web API deploy as
         two separate containers: a page shipped ahead of its API reads `undefined` here, and
         `undefined.includes` is a crash that takes the whole settings screen with it. An unmarked
         row is the right answer to "this API does not report that yet". -->
    {@const held = wallets?.relicHolders?.includes(address) ?? false}

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
