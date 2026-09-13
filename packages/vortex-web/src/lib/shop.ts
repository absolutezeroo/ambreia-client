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
import {t} from './i18n.js';

/**
 * The unit a kind is counted in: "crédits" for currency, "mois" for the two club kinds — an amount
 * of 3 on a club product is three MONTHS, not three of anything spendable.
 */
export function productName(product: IShopProduct | IShopOrder): string
{
    switch(product.kind)
    {
        case SHOP_KIND.CREDITS:
            return `${product.amount} ${t('SHOP_CREDITS_TITLE').toLowerCase()}`;
        case SHOP_KIND.DUCKETS:
            return `${product.amount} duckets`;
        case SHOP_KIND.DIAMONDS:
            return `${product.amount} diamants`;
        case SHOP_KIND.CLUB:
        case SHOP_KIND.CLUB_VIP:
            return `${product.amount} mois de ${t('SHOP_OFFERINGS_HABBO_CLUB_TITLE')}`;
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
    const amount = new Intl.NumberFormat('fr-FR', {
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
    const parts = new Intl.NumberFormat('fr-FR', {style: 'currency', currency})
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
    return new Intl.NumberFormat('fr-FR', {style: 'currency', currency}).format(priceMinor / 100);
}

export function formatDate(iso: string): string
{
    return new Intl.DateTimeFormat('fr-FR', {dateStyle: 'long', timeStyle: 'short'}).format(new Date(iso));
}

/** What an order's state is called, and whether it is still going anywhere. */
export const ORDER_LABELS: Record<number, string> = {
    [SHOP_ORDER.PENDING]: 'En attente de paiement',
    [SHOP_ORDER.PAID]: 'Payee, livraison en cours',
    [SHOP_ORDER.FULFILLED]: 'Livree',
    [SHOP_ORDER.CANCELLED]: 'Annulee',
    // Deliberately not "échouée": the money WAS taken, and the hotel owes the goods. Telling a
    // player their payment failed when it did not is how a support ticket becomes a chargeback.
    [SHOP_ORDER.NEEDS_INTERVENTION]: 'Payee — en cours de verification',
};

export function orderLabel(order: IShopOrder): string
{
    return ORDER_LABELS[order.state] ?? 'Inconnue';
}

/** True while an order can still change on its own, which is what the order page polls on. */
export function orderIsOpen(order: IShopOrder): boolean
{
    return order.state === SHOP_ORDER.PENDING || order.state === SHOP_ORDER.PAID;
}
