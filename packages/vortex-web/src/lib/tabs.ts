// The tab bars, in habbo.com's own order and membership — read off `community/community.html`,
// `shop/shop.html`, `settings/settings.html` and `home/home.html` — with each label named by the
// translate key those templates carry. "Apparts", "Offres prépayées", "Protection du compte" are
// habbo.com's words, not a translation of mine.
//
// They live here rather than in each page because several pages share a bar: every /community/*
// screen renders the same four tabs, and a bar that differs between two of its own tabs is the bug
// this avoids.
//
// EACH ENTRY HOLDS A KEY, NOT A TRANSLATION, and that is load-bearing: these arrays are built when
// the module is evaluated, which happens while `main.ts` is still awaiting `initLocale()`. Calling
// `t()` here froze whatever the dictionary held at that moment — nothing — so every bar on the site
// rendered its key names. `common/tabs/tab.html` does the same thing for the same reason:
// `<a … translate="{{:: TabController.translationKey}}">` resolves at render, and the field is
// called `translationKey` there too.

/**
 * One tab in a bar.
 *
 * `strict` is habbo.com's own `strict-path`: `/` and `/shop` must match exactly, or they stay
 * highlighted on every child route under them.
 */
export interface ITab
{
    path: string;
    // habbo.com's `alternative-path`: a second prefix that also lights the tab.
    alternativePath?: string;
    translationKey: string;
    strict?: boolean;
}

export const HOME_TABS: ITab[] = [
    {path: '/', translationKey: 'HOME_NEWS_TAB', strict: true},
    {path: '/messaging', translationKey: 'HOME_MESSAGING_TAB'},
];

export const COMMUNITY_TABS: ITab[] = [
    {path: '/community/photos', translationKey: 'COMMUNITY_PHOTOS_TAB'},
    {path: '/community/rooms', translationKey: 'COMMUNITY_ROOMS_TAB'},
    {path: '/community/fansites', translationKey: 'COMMUNITY_FANSITES_TAB'},
    // DEVIATION: habbo.com has no such tab, and this bar is otherwise their own membership. This
    // hotel runs its own chain and its own coin, so the standings are a thing it has and they had
    // no reason to. Its label and every string on its page are ours, marked `_OWN_` in fr.json so
    // nobody later mistakes them for habbo.com's.
    {path: '/community/leaderboard', translationKey: 'COMMUNITY_LEADERBOARD_TAB'},
    // DEVIATION: habbo.com has no such tab. The feed is this hotel's, built from a screenshot of a
    // 2015-era dashboard; habbo.com's own community section has no social feed at all. Its label
    // and every string on its page are ours, in src/locales/site/.
    {path: '/community/chats', translationKey: 'SITE_FEED_TAB'},
    // `<habbo-tab path="/community/category" alternative-path="/community/article">`. It used to be
    // `/community`, which every other tab's path starts with — so news stayed lit on all of them.
    // The alternative is `/article` here because that is the article state's own url.
    {path: '/community/category', alternativePath: '/article', translationKey: 'COMMUNITY_NEWS_TAB'},
];

export const SHOP_TABS: ITab[] = [
    {path: '/shop', translationKey: 'SHOP_BUY_TAB', strict: true},
    {path: '/shop/prepaid', translationKey: 'SHOP_PREPAID_TAB'},
    {path: '/shop/history', translationKey: 'SHOP_HISTORY_TAB'},
];

export const SETTINGS_TABS: ITab[] = [
    {path: '/settings/privacy', translationKey: 'SETTINGS_PRIVACY_TAB'},
    {path: '/settings/security', translationKey: 'SETTINGS_ACCOUNT_SECURITY_TAB'},
    {path: '/settings/2fa', translationKey: 'SETTINGS_TWO_FACTOR_AUTH_TAB'},
    {path: '/settings/password', translationKey: 'SETTINGS_PASSWORD_TAB'},
    {path: '/settings/email', translationKey: 'SETTINGS_EMAIL_TAB'},
    {path: '/settings/avatars', translationKey: 'SETTINGS_AVATAR_TAB'},
    // habbo.com's eighth tab, and it used to be dropped here on the grounds that this hotel had no
    // wallet to connect — a tab whose only content is "nothing is connected" being worse than no
    // tab. That stopped being true: the hotel runs its own chain, mints its own coin and its Relics
    // are real ERC-721s, so connecting a wallet now does something.
    {path: '/settings/wallet', translationKey: 'SETTINGS_WALLET_TAB'},
];

// `habbo-nft/habbo-nft.html`'s own bar, membership and all: two tabs at habbo.com's own paths, with
// the two `translation-key` values its `<habbo-tab>` elements name. What each page SAYS is this
// hotel's — see pages/nft/ — but the section is theirs.
export const HABBO_NFT_TABS: ITab[] = [
    {path: '/habbo-nft/habbo-avatars', translationKey: 'HABBO_NFT_HABBO_AVATARS'},
    {path: '/habbo-nft/nft-furni-and-clothing', translationKey: 'HABBO_NFT_FURNI_AND_CLOTHING'},
];

export const PLAYING_HABBO_TABS: ITab[] = [
    {path: '/playing-habbo', translationKey: 'PLAYING_HABBO_WHAT_IS_HABBO_TAB', strict: true},
    {path: '/playing-habbo/how-to-play', translationKey: 'PLAYING_HABBO_HOW_TO_PLAY_TAB'},
    {path: '/playing-habbo/habbo-way', translationKey: 'PLAYING_HABBO_HABBO_WAY_TAB'},
    {path: '/playing-habbo/safety', translationKey: 'PLAYING_HABBO_SAFETY_TAB'},
    {path: '/playing-habbo/help', translationKey: 'PLAYING_HABBO_HELP_TAB'},
];
