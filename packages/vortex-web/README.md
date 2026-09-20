# vortex-web

The hotel's website — a port of **habbo-web**, the modern habbo.com site, on the emulator's own
web API.

```bash
cp .env.example .env             # first: the fallback language and the hotel's name
node tools/fetch-assets.mjs      # the sprite sheet and the site's bitmaps
node tools/fetch-web-pages.mjs   # habbo.com's editorial pages + their images, per language
node tools/fetch-l10n.mjs        # its translations, one file per language
pnpm web                         # dev server on http://localhost:5174
pnpm web:build                   # bundle to dist/
node tools/check-l10n.mjs        # any key the code asks for that a language cannot answer
```

`fetch-assets.mjs` is **required on a fresh checkout**: `*.png` is gitignored repo-wide, like every
other dump-derived asset here, so without it the sprite sheet is missing and every icon — the logo
included — is a blank box. The other two ship their output, so they are only needed to refresh it or
to add a language.

`cp .env.example .env` matters more than it looks: `.env` is gitignored, and `VITE_SITE_LOCALE` is
the only place in the whole package where a language is named. Without it the site falls back to the
first file in `src/locales/` alphabetically — `br`, which is nobody's decision, and which shows up
as Portuguese filling the gaps in an English page.

## Languages

Nine: `fr en de es it nl fi br tr`, each a file in `src/locales/`, each fetched from
`images.habbo.com/habbo-web-l10n/<lang>.json` — habbo.com's own. **The set is the contents of that
directory**; `src/lib/i18n.ts` holds no list and names no language. Adding one is
`node tools/fetch-l10n.mjs <code>` plus, for the editorial pages,
`node tools/fetch-web-pages.mjs <code>`.

Each file becomes its own chunk, so a visitor downloads one of them and never the other eight.

Which one a visitor gets, in order of how deliberate the signal is: `?lang=` (remembered), what was
remembered before, `navigator.languages`, then `VITE_SITE_LOCALE`. **habbo.com has no language
switcher anywhere** — each of its languages is its own domain, and the choice is made by which one
you opened — so this port does not invent one.

Two things are not translations and do not live in a locale file:

- **the hotel's name.** `VITE_HOTEL_NAME`, substituted into habbo.com's strings by the fetchers on
  the way in (`\bHabbo`, case-sensitive: `HABBO` in the SMS keywords and the Sulake trademark line,
  `habboClubDays`, `www.habbo.fr` and `/playing-habbo/` are all spared by the case alone). It used
  to be a hand-edit of `fr.json`, which is why the first refresh of that file silently undid it.
- **this hotel's own strings**, in `src/locales/site/<lang>.json`, merged over habbo.com's and all
  prefixed `SITE_`. They are the screens habbo.com has no counterpart for — the order page above
  all, and the chain/Relic/leaderboard pages. A language with no overlay falls back for those keys
  only; `fr` and `en` are written today.

`node tools/check-l10n.mjs` prints, per language, how many of the keys the code asks for it can
answer, and fails on one no language answers at all.

Same stack as the emulator's dashboard (`../../../vortex-emulator/Vortex.Dashboard.Web`): Svelte 5
runes, Vite, Tailwind 4, `svelte-spa-router`. No SvelteKit — this is a static SPA, and the emulator
serves it the same way it serves the dashboard.

### The router is on the History API, not the hash

`svelte-spa-router` is hash-only by design, and habbo.com's URLs have no `#` in them. It is patched
— `patches/svelte-spa-router@4.0.2.patch` at the repository root, applied by pnpm on install — so
that the location comes from `window.location.pathname`, `push`/`replace`/`use:link` go through
`history.pushState`, and the store is woken by `popstate` plus a `pushstate` event of our own.
Nothing in `src/` imports differently; a destination may still be written `#/foo` and is normalised.

Two things hold it up and neither is optional:

- **the server must fall back to `index.html`** for any path that is not a file — `try_files {path}
  /index.html` in `Caddyfile.web`, and Vite's own SPA fallback in dev. Without it every deep link,
  reload and shared URL is a 404.
- **`src/lib/links.ts`** intercepts clicks on plain `<a href="/…">`, because the markup injected by
  `components/WebPage.svelte` and an article's own href come from the CMS and cannot carry
  `use:link`. Letting one through reloads the document, which would tear down the game client that
  `App.svelte` deliberately keeps mounted across navigations.

## Where it comes from

Three reference files, all under `sources/` (gitignored, like the AS3 dumps — fetch them per
checkout):

| File | What it settles |
|---|---|
| `sources/app.5ac3d2f8.css` | habbo.com's compiled stylesheet. Every colour, radius, shadow, font stack, breakpoint and sprite offset. (`mockup/habbo.css` is the same stylesheet, beautified — 2299 rules either way.) |
| `sources/habbo.js` | habbo.com's AngularJS bundle. Its route table, its module tree, and — inline, in the minified `templates` module — **every one of its 210 HTML templates**. `node tools/extract-templates.mjs` writes them to `sources/templates/`. |
| `sources/fr.json` | habbo.com's French localisation, 1688 keys, from `images.habbo.com/habbo-web-l10n/fr.json`. Copied to `src/lib/fr.json` so it ships. |
| `src/webpages/` + `public/webpages/` | habbo.com's **editorial pages**, which are in none of the above: `habbo-web-pages` fetches them at runtime from `images.habbo.com/habbo-web-pages/production/<key>.fr.html`. `node tools/fetch-web-pages.mjs` mirrors them and every image they reference. |

Use them in that order for any question: the CSS says how a thing looks, the templates say what is
inside it and in what order, and fr.json says what it is called. A template names its own key in a
`translate="…"` attribute, so a label is never a guess.

What the port keeps is habbo-web's **values and structure**; what it drops is its **delivery**: the
site is written in Tailwind utilities against the tokens in `src/styles.css`, not in
`.navigation__link--home` classes.

Things the templates settled that guesswork had got wrong here: there is no `/me` (the home is `/`,
and being signed out changes the HEADER, not the route); every section is **tabbed**, and its tabs
are real routes; the sign-in is a **modal**, not a header form, except on the front page where it is
the register banner's drawer; the home has no purse/friends/badges sidebar (the purse is a shop
component); the navigation is Accueil / Communauté / **Habbo Shopping** / Les clés du jeu /
Collectibles, in that order; and habbo.com has no group page at all — a group links into the client.

Two things stay real CSS because a utility cannot express them:

- **The sprite sheet.** `src/assets/sprite.png` is habbo.com's own 473 KB sheet, and
  `src/lib/sprite.js` is its index — one `[x, y, w, h]` per icon, straight out of habbo.css.
  `components/Sprite.svelte` turns an entry into an element. Navigation and user-menu icons have
  three states (idle / hover / active); an icon that does not change on hover means a state was
  dropped.
- **`src/assets/price_tag.png`**, the shop's price ribbon.

Everything else pictorial is the hotel's own: `c_images` (promo art, badges, room art) off the asset
host, avatars and group badges off `vortex-imager`.

## What is real and what is mocked

Real, against `Vortex.WebApi` (see `src/lib/api.js`, which mirrors
`Vortex.WebApi/Hosting/WebApiEndpoints.cs`):

| Flow | Route |
|---|---|
| Sign in, incl. the 2FA second step | `POST /api/public/authentication/login` |
| Registration (signs in in the same call) | `POST /api/public/registration/new` |
| Password change (revokes every session) | `POST /api/public/authentication/password` |
| Sign out | `POST /api/public/authentication/logout` |
| Avatar list — also the identity probe | `GET /api/user/avatars` |
| Avatar creation | `POST /api/user/avatars` |
| Avatar selection | `POST /api/user/avatars/select` |
| Name availability | `POST /api/newuser/name/check` |
| The ticket `/hotel` enters with | `GET /api/ssotoken` |
| The news feed and one article | `GET /api/public/articles`, `…/{slug}` |
| A name → its profile header | `GET /api/public/users?name=` |
| A profile: badges, friends, apparts, groups | `GET /api/public/users/{uniqueId}/profile` |
| The appart gallery, and one appart | `GET /api/public/rooms`, `…/{id}` |
| The sidebar counters | `GET /api/user/purse` |
| What the shop sells | `GET /api/public/shop/products` |
| Opening an order, and reading one | `POST /api/user/shop/orders`, `GET …/{id}` |
| The purchase history | `GET /api/user/shop/orders` |
| A prepaid code | `POST /api/user/shop/voucher` |

The profile and appart reads are **anonymous** — a profile is a page a signed-out visitor opens — and
an appart whose door is invisible is in neither of them, the read by id included.

Three things no route can answer, and where they come from instead:

- **A badge's label.** The hotel's badge texts are in no database: they are `badge_<code>_name` in
  `gamedata/<lang>/external_flash_texts.json` on the asset host, which is where the CLIENT reads them
  from. `src/lib/badges.js` fetches that once, shared, and falls back to the code.
- **A product's name.** The shop answers a KIND and an AMOUNT — `{kind: 0, amount: 100}` — never a
  label, because a label is a language. `src/lib/shop.ts` assembles the wording from habbo.com's own
  keys, so a second language is a translation and not a second copy of the logic.
- **An appart's picture.** habbo.com's three of them — the gallery card, the room page's thumbnail,
  and `<habbo-room-picture>` under it — all read `room.thumbnailUrl` / `room.imageUrl`, which is a
  PHOTO taken in-game with the camera and set by the owner. Not a render of the room, and no hotel
  renders one. This port filled all three with `vortex-imager`'s `GET /habbo-imaging/room/:id` for a
  while: it draws the actual furniture, looks plausible beside habbo.com, and is a different thing.
  They are back to the default plate the sprite sheet carries (`.room-item__thumbnail::before`,
  `.room__thumbnail::before` — what habbo.com shows underneath when a room has no photo), and the
  full-width picture section is absent rather than empty. The imager's route still works; nothing on
  the site calls it. The real picture needs the camera feature and a column to hold it.

Mocked, in `src/lib/mock.js`: the private messages, and only those. The shape matches a habbo.com
response, so wiring a real endpoint later is a swap in one page.

### The shop, and the one rule it rests on

**Nothing reachable from a browser grants anything.** `POST /api/user/shop/orders` takes a *product
code* and no price: the amount and the price are read server-side off the product row and snapshot
onto the order. The payment happens at the provider, on the provider's own page — the hotel never
sees a card number. The credits arrive on a *signed webhook*, and `/shop/order/:id` (the page a
provider sends the browser back to) only READS the order's state, because arriving at a URL is
something anybody can do.

That makes the payment the pivot, and it happens outside the hotel: an order that is paid and could
not be handed over is **owed**, never refunded, and sits past its pivot in the commerce journal where
the emulator's existing "stuck past its pivot" alert finds it. `Vortex.Shop` is where all of that
lives; the site's half is `src/lib/shop.ts` and `src/pages/shop/`.

Prepaid codes go to the same `VoucherGrain` the game client's own redeem packet calls, so the two
say the same thing about the same code.

The API has **no identity route**. `GET /api/user/avatars` is it: 401 means signed out, a list means
signed in. `src/lib/session.js` is built on that.

## /hotel

The page asks for a fresh SSO ticket on every mount — it is single use, the emulator burns it on the
handshake — and hands it to the client on the frame's query string:

```
http://localhost:5173/?sso=<ticket>
```

`packages/vortex-client/index.html` reads `?sso=` into `VortexConfig.connection.ssoTicket`. That is
the same mechanism the real hotel uses (FlashVars there, a query string here), and with no ticket the
client still runs its own login flow exactly as before.

## Services it expects

| Service | Where | Proxied in dev |
|---|---|---|
| `Vortex.WebApi` | `http://localhost:8080` | yes, `/api` — the session cookie must stay same-origin |
| `vortex-imager` | `http://localhost:8081` | yes, `/habbo-imaging` |
| asset host (`c_images`) | `http://vortex-assets.local` | no — override with `VITE_ASSET_BASE` |
| the client | `http://localhost:5173` | no — override with `VITE_CLIENT_URL` |

With the API down the site still runs: the editorial half needs nothing from the emulator, so the
failed probe becomes a strip across the top rather than a wall.
