// How a wallet balance is written on the site.
//
// THIS IS A VORTEX CHOICE, NOT A PORT. habbo.com prints the raw integer — its purse template passes
// `PurseController.purse.creditBalance` straight into `translate-values` with no filter — and the
// Flash client has no abbreviation helper either. So the site and the in-game toolbar will read
// differently for the same balance, deliberately: "12,5 k" here, "12500" there.
//
// Two rules make that safe to do with somebody's money.
//
// 1. IT ROUNDS DOWN. `Intl`'s default rounds to NEAREST, so 9 999 comes out "10 k" — telling a
//    player they hold ten thousand when they hold nine thousand nine hundred and ninety-nine, and
//    then letting a 10 000 purchase fail in front of them. That is the whole reason this file
//    exists rather than one inline `Intl` call.
//
//    `roundingMode: 'floor'` would say it in one option, and every current runtime honours it — but
//    it is not in this project's lib target, so using it would mean a cast that hides the
//    requirement from the type system. Truncating to the digit the notation will show gets there
//    with no cast and no runtime question: by the time `Intl` sees the number there is nothing left
//    for it to round up.
//
// 2. THE EXACT FIGURE IS NEVER LOST. Every abbreviated balance carries the full number in its
//    `title`, so it is one hover away. A balance you cannot read exactly is a balance you cannot
//    budget against.

/** Below this, the exact number is short enough to read and is printed in full. */
const COMPACT_FROM = 10_000;

const COMPACT = new Intl.NumberFormat('fr-FR', {notation: 'compact', maximumFractionDigits: 1});

const EXACT = new Intl.NumberFormat('fr-FR');

/**
 * Drops whatever the one displayed decimal cannot show, towards zero.
 *
 * `Intl` picks its unit at a thousand, a million, a billion; one decimal at that unit means the
 * smallest step it can print is a tenth of it. Truncating to that step is what makes the rounding
 * a floor: 9 999 becomes 9 900 and prints "9,9 k" instead of "10 k".
 */
function truncateToDisplayedDigit(amount: number): number
{
    const magnitude = Math.abs(amount);

    const unit =
        magnitude >= 1_000_000_000 ? 1_000_000_000
            : magnitude >= 1_000_000 ? 1_000_000
                : 1_000;

    const step = unit / 10;

    return Math.trunc(amount / step) * step;
}

/**
 * The balance as it is shown: grouped under ten thousand ("9 999"), abbreviated above it
 * ("12,5 k", "2,4 M").
 */
export function balance(amount: number): string
{
    if(!Number.isFinite(amount))
    {
        return EXACT.format(0);
    }

    // Negative balances are not a thing the wallet produces, but a sign is the one piece of
    // information it would be unforgivable to drop, so it is formatted rather than clamped.
    const magnitude = Math.abs(amount);

    return magnitude < COMPACT_FROM
        ? EXACT.format(amount)
        : COMPACT.format(truncateToDisplayedDigit(amount));
}

/** The full number, for the `title` of anything `balance()` has abbreviated. */
export function balanceExact(amount: number): string
{
    return Number.isFinite(amount) ? EXACT.format(amount) : EXACT.format(0);
}

/** Whether `balance()` shortened this one — i.e. whether a `title` is worth attaching. */
export function isAbbreviated(amount: number): boolean
{
    return Number.isFinite(amount) && Math.abs(amount) >= COMPACT_FROM;
}
