// Where the three services the CMS talks to live. `/api` and `/habbo-imaging` are relative on
// purpose — vite.config.js proxies them in dev and a reverse proxy is expected to in production —
// so the only absolute host here is the asset host, which serves habbo.com's c_images tree
// (promo art, badge icons, room thumbnails) and has no session to keep same-origin.

// c_images is PROXIED like /api and /habbo-imaging, not addressed absolutely. It used to point
// straight at `http://vortex-assets.local`, which only works on the machine whose hosts file knows
// that name: open the site from a phone on the same network and every promo image, badge and room
// shot 404s, because the phone resolves the URL, not the dev server. Going through the proxy makes
// the page work from any device, and in production a reverse proxy answers the same path.
//
// VITE_ASSET_BASE still overrides it, for a deployment that serves c_images from a CDN.
export const ASSET_BASE = import.meta.env.VITE_ASSET_BASE ?? '';

// The hotel's name. NOT a translation — it is the same word in all nine languages, which is exactly
// why it does not belong in a locale file: `tools/fetch-l10n.mjs` substitutes it into habbo.com's
// own strings at fetch time (283 of them say "Habbo"), and this is the same value for the handful of
// places the site names the hotel itself.
export const HOTEL_NAME = import.meta.env.VITE_HOTEL_NAME ?? 'Vortex';

export const IMAGES = `${ASSET_BASE}/c_images`;

// The client itself. /hotel drops it in an iframe with the SSO ticket on the query string, which is
// how habbo.com mounts the Flash/Nitro client too (`.client__frame`).
//
// Same origin as this site, under /client — the dev server proxies it (see vite.config.js), so the
// hotel needs ONE port open, not two. A second absolute host would also have to be a name the
// VIEWER can resolve, which `localhost:5173` is not from a phone.
export const CLIENT_URL = import.meta.env.VITE_CLIENT_URL ?? '/client';

// packages/vortex-imager answers the same routes a real hotel points at, so an avatar URL built
// here is the same string the client builds.
/**
 * What the imager takes. `size` is a token and not a pixel count — the zoom is fixed per token
 * (s .5 / m 1 / l 2 / b 3) — which is why `Avatar.svelte` reaches its head size in CSS.
 */
export interface IAvatarOptions
{
    size?: string;
    direction?: number;
    headDirection?: number;
    figure?: string;
    user?: string;
    headOnly?: boolean;
    action?: string;
    gesture?: string;
}

export function avatarUrl(options: IAvatarOptions = {}): string
{
    // Every value is stringified on the way in: URLSearchParams takes strings, and handing it a
    // number is a TypeScript error that JavaScript used to paper over.
    const query = new URLSearchParams({
        size: options.size ?? 'm',
        direction: String(options.direction ?? 2),
        head_direction: String(options.headDirection ?? options.direction ?? 2),
        ...(options.figure ? {figure: options.figure} : {}),
        ...(options.user ? {user: options.user} : {}),
        ...(options.headOnly ? {headonly: '1'} : {}),
        ...(options.action ? {action: options.action} : {}),
        ...(options.gesture ? {gesture: options.gesture} : {}),
    });

    return `/habbo-imaging/avatarimage?${query}`;
}

export function badgeUrl(code: string): string
{
    return `${IMAGES}/album1584/${code}.gif`;
}

export function groupBadgeUrl(code: string): string
{
    return `/habbo-imaging/badge/${code}.png`;
}

// The appart render, and WHERE it goes is the whole of what this comment is for, because the port
// got it wrong in both directions before settling here.
//
// habbo.com has three appart pictures and they are not the same picture:
//
//   .room-item__thumbnail__image   the gallery card's 110px plate
//   .room__thumbnail__image        the room page's 114px plate
//   <habbo-room-picture>           the full-width band UNDER the room page
//
// All three read a field on the room — `room.thumbnailUrl` / `room.imageUrl` — which is a PHOTO,
// taken in-game with the camera and chosen by the owner. Nothing here answers that field, and the
// camera is not ported, so the two THUMBNAILS keep the default plate the sprite sheet already
// carries (`::before` on both classes — what habbo.com shows underneath when a room has no photo).
//
// The full-width band is the one that gets the render. packages/vortex-imager draws the appart's
// actual furniture through the client's own renderer at `GET /habbo-imaging/room/:id`, and that band
// is a big empty rectangle without it. A render is not the photo habbo.com puts there, but it is the
// same subject at the same size in the same slot — where on a 110px plate it was a different kind of
// picture standing in for one nobody took.
export function roomUrl(roomId: number | string): string
{
    return `/habbo-imaging/room/${roomId}`;
}

// The imager is a separate process and is routinely not running while the site is worked on. A
// broken-image glyph in its place reads as a bug in the page; an empty slot reads as what it is.
export function hideOnError(event: Event): void
{
    (event.currentTarget as HTMLElement).style.visibility = 'hidden';
}
