// The tab bars, in habbo.com's own order and membership — read off `community/community.html`,
// `shop/shop.html`, `settings/settings.html` and `home/home.html` — with each label resolved
// through the translate key those templates name. "Apparts", "Offres prépayées", "Protection du
// compte" are habbo.com's words, not a translation of mine.
//
// They live here rather than in each page because several pages share a bar: every /community/*
// screen renders the same four tabs, and a bar that differs between two of its own tabs is the bug
// this avoids.
import {t} from './i18n.js';

/**
 * One tab in a bar.
 *
 * `strict` is habbo.com's own `strict-path`: `/` and `/shop` must match exactly, or they stay
 * highlighted on every child route under them.
 */
export interface ITab
{
    path: string;
    label: string;
    strict?: boolean;
}

export const HOME_TABS: ITab[] = [
    {path: '/', label: t('HOME_NEWS_TAB'), strict: true},
    {path: '/messaging', label: t('HOME_MESSAGING_TAB')},
];

export const COMMUNITY_TABS: ITab[] = [
    {path: '/community/photos', label: t('COMMUNITY_PHOTOS_TAB')},
    {path: '/community/rooms', label: t('COMMUNITY_ROOMS_TAB')},
    {path: '/community/fansites', label: t('COMMUNITY_FANSITES_TAB')},
    // DEVIATION: habbo.com has no such tab, and this bar is otherwise their own membership. This
    // hotel runs its own chain and its own coin, so the standings are a thing it has and they had
    // no reason to. Its label and every string on its page are ours, marked `_OWN_` in fr.json so
    // nobody later mistakes them for habbo.com's.
    {path: '/community/leaderboard', label: t('COMMUNITY_LEADERBOARD_TAB')},
    // habbo.com's news tab matches /community/category AND /community/article — the article page
    // keeps the tab lit.
    {path: '/community', label: t('COMMUNITY_NEWS_TAB')},
];

export const SHOP_TABS: ITab[] = [
    {path: '/shop', label: t('SHOP_BUY_TAB'), strict: true},
    {path: '/shop/prepaid', label: t('SHOP_PREPAID_TAB')},
    {path: '/shop/history', label: t('SHOP_HISTORY_TAB')},
];

export const SETTINGS_TABS: ITab[] = [
    {path: '/settings/privacy', label: t('SETTINGS_PRIVACY_TAB')},
    {path: '/settings/security', label: t('SETTINGS_ACCOUNT_SECURITY_TAB')},
    {path: '/settings/2fa', label: t('SETTINGS_TWO_FACTOR_AUTH_TAB')},
    {path: '/settings/password', label: t('SETTINGS_PASSWORD_TAB')},
    {path: '/settings/email', label: t('SETTINGS_EMAIL_TAB')},
    {path: '/settings/avatars', label: t('SETTINGS_AVATAR_TAB')},
    // habbo.com's eighth tab, and it used to be dropped here on the grounds that this hotel had no
    // wallet to connect — a tab whose only content is "nothing is connected" being worse than no
    // tab. That stopped being true: the hotel runs its own chain, mints its own coin and its Relics
    // are real ERC-721s, so connecting a wallet now does something.
    {path: '/settings/wallet', label: t('SETTINGS_WALLET_TAB')},
];

export const PLAYING_HABBO_TABS: ITab[] = [
    {path: '/playing-habbo', label: t('PLAYING_HABBO_WHAT_IS_HABBO_TAB'), strict: true},
    {path: '/playing-habbo/how-to-play', label: t('PLAYING_HABBO_HOW_TO_PLAY_TAB')},
    {path: '/playing-habbo/habbo-way', label: t('PLAYING_HABBO_HABBO_WAY_TAB')},
    {path: '/playing-habbo/safety', label: t('PLAYING_HABBO_SAFETY_TAB')},
    {path: '/playing-habbo/help', label: t('PLAYING_HABBO_HELP_TAB')},
];
