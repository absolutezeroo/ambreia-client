// What the shop's numbers mean on screen.
//
// The API answers a product as a KIND and an AMOUNT — `{kind: 0, amount: 100}` — and never a label,
// because a label is a language and the hotel has several. The wording is assembled here, from
// habbo.com's own keys where one exists (`SHOP_CREDITS_TITLE`, `SHOP_OFFERINGS_HABBO_CLUB_TITLE`),
// so a second language is a translation and not a second copy of this logic.
//
// Prices are integer MINOR units with an ISO currency beside them — 450 EUR-minor is 4,50 € — which
// is the only representation of money that does not eventually lose a cent. `Intl.NumberFormat`
// turns that into the visitor's own notation, so nothing here formats a currency by hand.
import {SHOP_KIND, SHOP_ORDER} from './api.js';
import type {IShopProduct, IShopOrder} from './api.js';
import {isSpriteName} from './sprite.js';
import type {ISpriteName} from './sprite.js';
import {t, intlLocale} from './i18n.js';

/**
 * The unit a kind is counted in: "crédits" for currency, "mois" for the two club kinds — an amount
 * of 3 on a club product is three MONTHS, not three of anything spendable.
 */
export function productName(product: IShopProduct | IShopOrder): string
{
    // The purse's own keys, which already say "<n> crédits" / "<n> diamants" / "<n> Silver" in every
    // language — `components/Purse.svelte` has used them since it was fixed, and this function was
    // the half that stayed behind with "duckets" and "diamants" typed in French.
    //
    // Habbo calls duckets SILVER on the website; `SHOP_PURSE_SILVER` is the wording, not a rename.
    //
    // `SHOP_CREDITS_TITLE.toLowerCase()` is gone with them: lowercasing a translated noun is only
    // ever right in some languages — German capitalises every noun, so it produced "100 credits"
    // where the language wants "100 Credits".
    switch(product.kind)
    {
        case SHOP_KIND.CREDITS:
            return t('SHOP_PURSE_CREDITS', {creditBalance: product.amount});
        case SHOP_KIND.DUCKETS:
            return t('SHOP_PURSE_SILVER', {silverBalance: product.amount});
        case SHOP_KIND.DIAMONDS:
            return t('SHOP_PURSE_DIAMONDS', {diamondBalance: product.amount});
        case SHOP_KIND.CLUB:
        case SHOP_KIND.CLUB_VIP:
            // habbo.com counts a subscription in days (`SHOP_PURSE_HC_DAYS`) and prices it per month
            // (`SHOP_SUBSCRIPTION_PER_MONTH`), but never names a NUMBER of months — so this one
            // sentence is the port's own.
            return t('SITE_SHOP_CLUB_MONTHS', {
                count: product.amount,
                club: t('SHOP_OFFERINGS_HABBO_CLUB_TITLE'),
            });
        default:
            // A kind this build has no wording for. The code is the honest fallback: it says a
            // product exists and that the site is behind the hotel, where a blank tile says nothing.
            // A product calls it `code` and an order — which snapshots it — calls it `productCode`.
            return 'code' in product ? product.code : product.productCode;
    }
}

/** Which shop sprite a product's tile draws. The API carries the number; club has no sprite of its own. */
export function productIcon(product: IShopProduct): ISpriteName
{
    const name = `credit${product.icon}`;

    // `icon` is an integer an operator typed into a product row, so it can be anything. The sheet
    // has six credit icons; a seventh used to render a 0x0 span — an invisible tile the visitor
    // could still click, with no error anywhere. Falling back to the first one keeps the tile
    // visible and wrong, which is the failure an operator can actually see and fix.
    return isSpriteName(name) ? name : 'credit1';
}

// The section headings, off `store/inventory/*.html`. Each `<section>` there leads with an
// `<h3 class="inventory__section__title">` carrying a fixed key:
//
//   credits.html      SHOP_CURRENCIES_TITLE          "Monnaies"
//   memberships.html  SHOP_OFFERINGS_MEMBERSHIP_TITLE "Adhésions", then an <h5> sub-heading per
//                     family — SHOP_OFFERINGS_HABBO_CLUB_TITLE for the club one
//   bundles.html      SHOP_OFFERINGS_BUNDLE_TITLE     "Packs"
//
// Not "Crédits": `SHOP_CREDITS_TITLE` is the shop's own tab wording, and the section is "Monnaies"
// because it sells diamonds and duckets under the same heading.
//
// `code` is whatever the operator typed in the product row, so an unknown one shows as itself rather
// than being dropped — a section with no heading looks like a rendering bug, and a section that
// vanishes looks like nothing at all.
const SECTION_TITLES: Record<string, string> = {
    credits: 'SHOP_CURRENCIES_TITLE',
    club: 'SHOP_OFFERINGS_MEMBERSHIP_TITLE',
    bundles: 'SHOP_OFFERINGS_BUNDLE_TITLE',
};

export function sectionTitle(code: string): string
{
    const key = SECTION_TITLES[code];

    return key ? t(key) : code;
}

// `store/inventory/inventory.html` renders its three sections in a fixed order — bundles,
// memberships, credits — and swaps credits to the front while a double-credits promotion is on.
// The API answers sections in the operator's own order, so this is what puts them in habbo.com's.
const SECTION_ORDER = ['bundles', 'club', 'credits'];

export function orderSections<T extends {code: string}>(sections: readonly T[]): T[]
{
    // A section habbo.com has no slot for sorts last rather than vanishing, and ties keep the
    // server's order because `toSorted` is stable.
    const rank = (code: string) =>
        SECTION_ORDER.indexOf(code) < 0 ? SECTION_ORDER.length : SECTION_ORDER.indexOf(code);

    return [...sections].sort((left, right) => rank(left.code) - rank(right.code));
}

/**
 * What the price tag shows: the amount on one line and the currency on the other.
 *
 * `.inventory-thumbnail__price` is `#a95219` at 24px, `.inventory-thumbnail__currency` is black at
 * 18px, and they are two separate `<p>`s inside the tag — not one formatted string. The `condensed`
 * class drops the amount to 18px past five characters, which is what keeps "1 250,00" inside the
 * 104px ribbon.
 */
export function priceTag(priceMinor: number, currency: string): {amount: string; currency: string; condensed: boolean}
{
    const amount = new Intl.NumberFormat(intlLocale(), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(priceMinor / 100);

    return {amount, currency: currencySymbol(currency), condensed: amount.length > 5};
}

/**
 * The SYMBOL, not the ISO code: habbo.com's ribbon reads "11,49" over "€", and this port was
 * printing "EUR" under the amount.
 *
 * `formatToParts` is asked rather than a table of symbols, because the answer is a property of the
 * locale and the currency together — the same EUR is "€" in French and "€" after the number in
 * English — and a table would be a second, drifting copy of data the platform already has. A
 * currency the runtime does not know comes back as its own code, which is exactly the right
 * fallback.
 */
function currencySymbol(currency: string): string
{
    const parts = new Intl.NumberFormat(intlLocale(), {style: 'currency', currency})
        .formatToParts(0);

    return parts.find((part) => part.type === 'currency')?.value ?? currency;
}

/**
 * The paragraph under an expanded offer.
 *
 * habbo.com's `credit-payment-details` interpolates `SHOP_CREDITS_DESCRIPTION` with the amount, and
 * its `product-payment-details` prints `item.desc` — a string that travels with the offer and which
 * this API does not carry. So a currency offer gets habbo.com's own sentence and a club one gets
 * none, rather than a sentence invented here.
 */
export function productDescription(product: IShopProduct): string
{
    return product.kind === SHOP_KIND.CREDITS
        ? t('SHOP_CREDITS_DESCRIPTION', {value: product.amount})
        : '';
}

export function formatPrice(priceMinor: number, currency: string): string
{
    // `minimumFractionDigits` is deliberately left to the currency: a yen price has none, and
    // dividing by 100 for every currency is the bug that produces "¥ 4.50".
    return new Intl.NumberFormat(intlLocale(), {style: 'currency', currency}).format(priceMinor / 100);
}

export function formatDate(iso: string): string
{
    return new Intl.DateTimeFormat(intlLocale(), {dateStyle: 'long', timeStyle: 'short'}).format(new Date(iso));
}

/** What an order's state is called, and whether it is still going anywhere. */
// Keys, not French. habbo.com has no order-status screen to take wording from — its shop is
// server-rendered — so these five are the port's own, in `src/locales/site/<lang>.json`.
//
// `…_NEEDS_INTERVENTION` is deliberately not "failed": the money WAS taken and the hotel owes the
// goods. Telling a player their payment failed when it did not is how a support ticket becomes a
// chargeback — and that has to hold in every language, which is why it is a key with a note rather
// than a sentence someone retranslates freely.
export const ORDER_LABELS: Record<number, string> = {
    [SHOP_ORDER.PENDING]: 'SITE_ORDER_STATE_PENDING',
    [SHOP_ORDER.PAID]: 'SITE_ORDER_STATE_PAID',
    [SHOP_ORDER.FULFILLED]: 'SITE_ORDER_STATE_FULFILLED',
    [SHOP_ORDER.CANCELLED]: 'SITE_ORDER_STATE_CANCELLED',
    [SHOP_ORDER.NEEDS_INTERVENTION]: 'SITE_ORDER_STATE_NEEDS_INTERVENTION',
};

export function orderLabel(order: IShopOrder): string
{
    return t(ORDER_LABELS[order.state] ?? 'SITE_ORDER_STATE_UNKNOWN');
}

/** True while an order can still change on its own, which is what the order page polls on. */
export function orderIsOpen(order: IShopOrder): boolean
{
    return order.state === SHOP_ORDER.PENDING || order.state === SHOP_ORDER.PAID;
}
