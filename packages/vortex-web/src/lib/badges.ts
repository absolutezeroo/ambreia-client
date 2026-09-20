// Badge labels.
//
// The hotel's badge texts are in no database and no API answers them: they live in
// `gamedata/<lang>/external_flash_texts.json` on the asset host, which is where the CLIENT reads
// them from too — `badge_<code>_name` and `badge_<code>_desc`, with a handful of older badges
// spelling it `badge_name_<code>` / `badge_desc_<code>` instead. Both are tried, and an unknown code
// falls back to the code itself rather than to an empty label, which would read as a broken badge.
//
// It is a ~1MB file, fetched at most once per page load and shared by every caller (the promise is
// the cache, so ten badges rendering at once are one request). It is only ever loaded by a page that
// actually shows a badge.
import {ASSET_BASE} from './config.js';
import {locale} from './i18n.js';

let pending: Promise<IBadgeTexts> | null = null;

export function loadBadgeTexts(): Promise<IBadgeTexts>
{
    // `<lang>` is the site's ACTIVE language, not a fixed `fr` — the asset host carries one of these
    // per language exactly as the client does, so a badge reads in the same language as the page
    // around it. It was hardcoded, which made every badge French on a site that is not.
    const texts = `${ASSET_BASE}/gamedata/${locale()}/external_flash_texts.json`;

    // A failed or missing texts file is not a page failure: every badge then shows its code, which
    // is exactly what an unknown code does, so nothing special has to handle it.
    pending ??= fetch(texts)
        .then((response) => (response.ok ? response.json() : {}))
        .catch(() => ({}));

    return pending;
}

/** The fetched file, or `{}` when it could not be read. */
export type IBadgeTexts = Record<string, string>;

export function badgeName(texts: IBadgeTexts, code: string): string
{
    return texts?.[`badge_${code}_name`] ?? texts?.[`badge_name_${code}`] ?? code;
}

export function badgeDescription(texts: IBadgeTexts, code: string): string
{
    return texts?.[`badge_${code}_desc`] ?? texts?.[`badge_desc_${code}`] ?? '';
}
