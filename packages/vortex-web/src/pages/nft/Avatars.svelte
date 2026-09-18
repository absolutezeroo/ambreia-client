<script lang="ts">
    // `/habbo-nft/habbo-avatars` — the section's first tab, against habbo.com's own
    // (`habbo_nft/habbo_avatars`).
    //
    // Their page is about a PFP collection that is "la pièce maîtresse de l'écosystème Habbo
    // Collectionnables", and its five bullets are MetaMask, buying ETH, OpenSea, using the avatar
    // in-game, and Emeralds. This hotel has no avatar collection at all, so the tab keeps their
    // place and says so — and then answers the question their page actually answers, which is what
    // holding one of the hotel's NFTs gives you in the game.
    //
    // Both perks below are real and checkable. What is NOT here, deliberately: the twenty-five
    // unlockable chat bubbles. `PlayerGrain.GrantChatStyleAsync` takes any id in 1000..9999 from
    // whoever grants it — it is not gated on owning anything on the chain, and writing that it was
    // would be a promise the server does not keep.
    import {link} from 'svelte-spa-router';
    import NftShell from './NftShell.svelte';
    import {t} from '../../lib/i18n.js';
</script>

<NftShell>
    <h2>{t('HABBO_NFT_HABBO_AVATARS')}</h2>

    <p>{t('HABBO_NFT_OWN_AVATARS_LEAD')}</p>
    <p>{t('HABBO_NFT_OWN_AVATARS_PERKS_LEAD')}</p>

    <ul>
        <li>
            <strong><a href="/settings/wallet" use:link>{t('HABBO_NFT_OWN_PERK_MARK_TITLE')}</a></strong>
            – {t('HABBO_NFT_OWN_PERK_MARK')}
        </li>
        <li>
            <strong>{t('HABBO_NFT_OWN_PERK_COLLECTION_TITLE')}</strong>
            – {t('HABBO_NFT_OWN_PERK_COLLECTION')}
        </li>
    </ul>

    <p>
        <a href="/habbo-nft/nft-furni-and-clothing" use:link>{t('HABBO_NFT_FURNI_AND_CLOTHING')}</a>
    </p>
</NftShell>
