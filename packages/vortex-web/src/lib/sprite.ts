// habbo.com draws every piece of site chrome — the logo, the five navigation icons, the purse
// currencies, the user menu, the social links — out of one 473 KB sheet. The coordinates below are
// the `background-position` / `width` / `height` triples read straight off `mockup/habbo.css`, so
// this table IS the sheet's index; nothing here was measured by eye.
//
// Sprite.svelte turns an entry into an element. Positions are stored POSITIVE and negated there,
// which is the only cosmetic change from the source (`-552px -359px` -> `[552, 359]`).
//
// Three-state entries (idle / hover / active) are the navigation and user-menu links: habbo.com
// swaps the icon on :hover and .active, and an icon that stays put on hover is the tell that a state
// was dropped.

export const SPRITE_URL = new URL('../assets/sprite.png', import.meta.url).href;

// [x, y, width, height]
export const SPRITE = {
    logo: [620, 830, 116, 46],
    // The landing screen's logo is a second, larger cut of the same wordmark
    // (`.register-banner__logo`), not the header's scaled up.
    bigLogo: [396, 242, 197, 73],
    sulake: [212, 310, 87, 75],

    // Navigation. `nft` genuinely shares `shop`'s coordinates in habbo.css — not a copy/paste slip
    // here; the sheet has no separate NFT icon.
    navHome: [552, 359, 22, 22],
    navHomeHover: [576, 359, 22, 22],
    navHomeActive: [354, 286, 22, 22],
    navCommunity: [434, 588, 22, 22],
    navCommunityHover: [458, 588, 22, 22],
    navCommunityActive: [482, 588, 22, 22],
    navPlaying: [506, 588, 22, 22],
    navPlayingHover: [530, 588, 22, 22],
    navPlayingActive: [554, 588, 22, 22],
    navShop: [602, 588, 22, 22],
    navShopHover: [626, 588, 22, 22],
    navShopActive: [650, 588, 22, 22],

    // User menu.
    caret: [212, 612, 18, 18],
    profile: [375, 334, 18, 20],
    profileHover: [376, 192, 18, 20],
    profileActive: [376, 214, 18, 20],
    settings: [392, 612, 18, 18],
    settingsActive: [372, 612, 18, 18],
    help: [272, 612, 18, 18],
    logout: [332, 612, 18, 18],

    // Purse. Note `builders` is 18 tall where the other four are 20 — habbo.css compensates with
    // its own margin-top, and Purse.svelte does the same.
    credits: [674, 588, 20, 20],
    diamonds: [696, 588, 20, 20],
    habboClub: [718, 588, 20, 20],
    silver: [740, 588, 20, 20],
    buildersClub: [784, 588, 20, 18],

    // The default appart thumbnail (`.room-item__thumbnail::before`) — habbo.com draws it for every
    // room, and the real photo, when there is one, is layered over it.
    roomThumbnail: [110, 1084, 110, 110],

    // The status marks a `habbo-message-container` puts in its white 50px disc: the exclamation
    // (a bare bar+dot, hence 10x45), the tick, the cross, and the two 2FA padlocks. The tick and
    // the cross are also what a toast puts in ITS disc — `.toast.toast-success::after` and
    // `.toast.toast-error::after` point at these same two cuts.
    statusExclamation: [1200, 594, 10, 45],
    statusCheck: [1191, 1016, 22, 27],
    statusCross: [990, 786, 25, 27],
    status2faOff: [532, 1016, 52, 56],
    status2faOn: [586, 1016, 52, 56],

    // Avatar selection: the create block's box-and-plus (two cuts, the plus laid over the box at
    // left 32 / top 25), the green tick on the active avatar, and the search field's two icons.
    avatarCreateBox: [812, 1084, 54, 61],
    avatarCreatePlus: [996, 1208, 34, 36],
    avatarSelected: [914, 1084, 44, 50],
    searchGlass: [375, 356, 18, 20],
    searchClear: [412, 612, 18, 18],

    // The show/hide eye inside a password field (`.password-toggle-mask__icon`, at right 12 / top 12).
    eye: [1237, 1192, 19, 11],
    eyeActive: [1216, 1192, 19, 11],

    // The little door on the appart page's enter button (`.room__enter-button__text::before`).
    enterRoom: [1188, 1084, 21, 26],

    // Buttons and controls.
    habbo: [489, 612, 16, 16],
    login: [451, 612, 17, 17],
    close: [762, 588, 20, 20],
    fullscreen: [507, 612, 15, 14],
    fullscreenBack: [524, 612, 15, 14],
    heart: [844, 878, 26, 24],
    like: [872, 878, 22, 24],
    report: [812, 1147, 21, 24],
    arrowPrev: [990, 632, 21, 38],
    arrowNext: [578, 317, 21, 38],
    // The double chevron after "Plus de news" (`.news__more::before`), pinned to the link's right
    // with 29px of padding reserved for it.
    more: [527, 359, 23, 22],

    // The single arrow after a profile card's "Tout voir" (`.profile-modal__link::before`, right 0,
    // 22px of padding reserved). Same band of the sheet as `heart`, a different cut.
    profileMore: [920, 878, 16, 22],

    // The chevron on an offer's bottom banner (`.inventory-thumbnail__banner::after`, right 12,
    // vertically centred by `margin-top:-9px`). It is the accordion's whole affordance: habbo.com
    // spins it 540 degrees — one and a half turns, not a flip — when the offer expands.
    shopChevron: [212, 612, 18, 18],

    // The shop's six credit-bundle icons (98px squares). The last two sit in a different band of
    // the sheet than the first four — not a typo.
    credit1: [1216, 738, 98, 98],
    credit2: [1216, 838, 98, 98],
    credit3: [1216, 938, 98, 98],
    credit4: [1216, 1038, 98, 98],
    credit5: [222, 1084, 98, 98],
    credit6: [322, 1084, 98, 98],

    // Footer socials.
    facebook: [620, 878, 30, 30],
    instagram: [652, 878, 30, 30],
    rss: [684, 878, 30, 30],
    twitter: [716, 878, 30, 30],
    youtube: [748, 878, 30, 30],
};

/**
 * Every icon the sheet actually has.
 *
 * `Sprite` takes this rather than a string, and that is not decoration: an unknown name used to
 * render a `<span>` of 0x0 — nothing on screen, nothing in the console, nothing in the network tab.
 * The one place a name is computed rather than written (`productIcon`, off a number an operator
 * typed into a product row) has to say what it does when the answer is not one of these.
 */
export type ISpriteName = keyof typeof SPRITE;

/** Whether a computed name is one the sheet can draw. */
export function isSpriteName(name: string): name is ISpriteName
{
    return Object.hasOwn(SPRITE, name);
}
