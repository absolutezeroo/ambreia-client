# Vortex

Full TypeScript/PixiJS v8 port of the Habbo Hotel Flash client. pnpm monorepo: `vortex-engine` (engine) + `vortex-client` (display, UI). The entire Flash client is ported — both logic and display — and the original Flash window layouts/skins ship as XML, verbatim from the dump (see Assets below).

## Commands

```bash
pnpm install      # Install dependencies
pnpm dev          # Dev server (Vite)
pnpm build        # Production build (TSC + Vite)
pnpm lint         # ESLint over both packages
pnpm web          # The CMS (packages/vortex-web) on :5174 — see its README
```

### `pnpm dev` pre-bundles the engine

Vite serves one HTTP request per source module, and the client statically reaches ~3,970 of the
engine's ~4,480 files at boot, so dev used to cost ~4,000 requests per page load — 15.2s cold, and
5.9s on *every* reload, since the port defines no `import.meta.hot` anywhere and therefore always
does a full page reload. `packages/vortex-client/tools/vite-plugin-engine-bundle.mjs` hands the
engine to esbuild in watch mode instead (~185 requests: 1.3s cold, ~0.45s reload, ~1.5-4.5s when an
engine file changes and the bundle is rebuilt). It is serve-only — `pnpm build` is untouched.

Two consequences worth knowing before editing `vite.config.ts`:

- **`@core`/`@habbo`/`@room`/`@iid` are deliberately absent from `resolve.alias` in dev.**
  `vite:alias` runs before user `enforce: 'pre'` plugins, so declaring them there would rewrite the
  specifier to the engine source before the plugin ever sees it, and the ~3,970 requests come back.
  They are restored for `command === 'build'`.
- **Only `pixi.js` and `eventemitter3` are external to the bundle**, because the client imports them
  too and there must be exactly one instance. `pako` is engine-only and pnpm does not expose it to
  resolution from the client package — externalising it yields "Failed to resolve import" and a
  blank page.

## Rules

Enforcement rules live in `.claude/rules/` and are auto-loaded into every session (some are path-scoped and only load when you read a matching file). Start with `.claude/rules/00-mandate.md` — nothing may be implemented before it is followed. See also `.claude/rules/10-conventions.md`, `20-architecture.md`, `30-as3-traceability.md`, and the path-scoped `communication.md` / `window-ui.md` / `room.md`.

## Path aliases

**Engine** (`vortex-engine`): `@core/` → `src/core/` | `@habbo/` → `src/habbo/` | `@room/` → `src/room/` | `@iid/` → `src/iid/`

**Client** (`vortex-client`): `@core/` `@habbo/` `@room/` `@iid/` → engine src | `@ui/` `@/` → `src/`

## AS3 sources

| Directory                                    | Priority    | Package roots                           | Files | Obfuscated |
|----------------------------------------------|-------------|-----------------------------------------|-------|------------|
| `sources/WIN63-202607011411-782849652/`      | **PRIMARY** | `src/com/sulake/{habbo,room,core,iid}/` | 3,305 | 25%        |
| `sources/win63_version/`                     | Secondary   | `habbo/`, `room/`, `core/`              | 4,694 | 18%        |
| `sources/PRODUCTION-201601012205-226667486/` | Tertiary    | `src/com/sulake/habbo/`                 | 3,526 | 0%         |
| `sources/AIR-1.0.31/`                        | Features only — **never headers** | `scripts/com/sulake/{habbo,room,core,iid}/` | 3,432 | 26% |

`WIN63-202607011411-782849652` is a later, partly-obfuscated client build and is the primary
day-to-day reference.

### `AIR-1.0.31` is newer than the primary, and is still not a header source

It is a strict superset in readable-class terms (nothing was removed; 84 new readable classes,
76 of them one feature) and it carries three things no other tree has: **VariableFx** (wired
variables rendered over avatars/furni — health bars, level badges, progress bars, counters:
`habbo/room/object/variablefx/`, `.../visualization/variablefx/`, `.../visualization/stacked/`,
`habbo/roomevents/wired_setup/addons/variablefx/`), **raid protection**
(`habbo/navigator/raidprotection/`), and the wired **`VariablesWebApiAddon`**.

Read it for *behaviour* of those features. Never take a packet id from it. Habbo re-randomises
the whole registry every build: against the primary, **only 16 of 586 composers keep their
header** — 421 composers and 523 events move, and 78 composers / 85 events change shape at the
same number (`.claude/skills/compare-as3-revisions/` produces the remap tables). The emulator is
pinned to `Revision20260701`, which *is* the primary's numbering, so a header lifted from AIR is
wrong on this wire even when the message is right.

New messages ported out of AIR therefore get a free header chosen in the 20260701 numbering and
assigned on **both** sides — the same way the room-effect message (2624) and the habbicons
messages were done. Mixing numbering from two revisions on one wire is never valid.

**The AIR dump's assets are in `scripts/binaryData/`, not in an `_assets/`.** It is laid out
differently from the WIN63 trees: no `_assets/`, no `layouts/`, no `images/` — just `scripts/` plus
`scripts/binaryData/`, holding **1,092 `.bin` blobs** named `<charId>_<class>`, where `<class>` is
either the real linkage name (`3329_room_settings_xml$771e3819...`) or the obfuscated
`<charId>__SafeCls_N`. `_SafeCls_N` is exactly the class the dump's own `*Com.as` assigns to the
asset field, so the join described in "Assets" below works unchanged:
`HabboNavigatorCom.as` says `raid_protection_settings_xml:Class = _SafeCls_1412`, and the layout is
`binaryData/3129__SafeCls_1412.bin`. **Do not reconstruct an AIR layout by hand** — look there
first; it went unnoticed once and cost an invented window.

The blobs are XML/TXT/PBJ only. **Images are not in the dump**, and nothing here covers them: they
have to be cut out of the client the launcher downloaded, with JPEXS
(`C:\Program Files (x86)\FFDec\ffdec-cli.exe`), which is also how `binaryData/` itself was produced
and how to re-cut it for a newer build:

```bash
ffdec-cli -export binaryData,symbolClass,image <outdir> \
  "%APPDATA%/Habbo Launcher/downloads/air/<build>/HabboAir.swf"
```

`packages/vortex-client/tools/import-air-images.mjs` takes that image export and ships what AIR
adds under its real asset names — `AIR_IMAGE_EXPORT=<dir> node …/import-air-images.mjs`, or
`--images <dir>`; with neither it says so and does nothing, which is what a normal
`node install.mjs` does. It reads AIR's `*Com.as` **and `*Lib.as`** (the VariableFx artwork is
declared in `HabboRoomObjectVisualizationLib.as`, which no `*Com.as`-only scan sees), joins on the
whole linkage name, and adds only names the shipped set lacks: **142 today, 121 of them
`variablefx_*`**. Two things bite here — an image field name often carries a redundant `_png`
(`user_typing_png` **is** the shipped `user_typing.png`, and not stripping it invents 474 new
images), and `src/assets/images/` is gitignored, so a new image reaches anyone else only through
`vortex-client-assets.zip` (`node install.mjs --pack`).

**Class names are obfuscated; member names are not.** In an obfuscated file the class is
`_SafeCls_N` and some *types* it references are too, but its methods, getters and constants keep
their real names. `habbo/room/_SafeCls_90.as` declares
`public class _SafeCls_90 extends _SafeCls_50 implements IRoomEngine, ...` and all 255 of its
methods are readable — that file is RoomEngine. The best way to identify an obfuscated class is
therefore the interface it implements (`implements IRoomEngine` → RoomEngine), not a name lookup
elsewhere.

**But do not expect an interface to be readable either.** 222 of the 848 obfuscated files
*are* interfaces (`public interface _SafeCls_N`) — against 329 named `I*.as`, so roughly 40% of
all interfaces are obfuscated too. `implements IRoomEngine` identifies a class; `implements
_SafeCls_1783` identifies nothing until you resolve that interface in turn. It is the same
problem one level down, and it has no general answer: match the members against a named
interface in `PRODUCTION-201601012205-226667486` (only for classes that existed in 2016), or
against this port's own `I*.ts` — `_SafeCls_1783` is `ICatalogNavigator`, recoverable because
`CatalogNavigator.as` is unobfuscated and takes it.

When a name exists in no tree at all, **derive it and say so at the declaration** — never pass a
derived name off as recovered (see `CatalogWindowState.requestedPage`).

**Do not expect `win63_version` to recover names.** It is obfuscated too — 868 `class_N.as` files —
just with a different scheme, so the same class has a different meaningless name in each tree and
the two do **not** line up file-for-file (in `habbo/room`, 9 of 20 filenames match). RoomEngine is
`_SafeCls_90.as` here, `class_34.as` there, and `RoomEngine.as` only in
`PRODUCTION-201601012205-226667486`, the one tree with no obfuscation at all. Use PRODUCTION to
*identify* a class or recover a member name — never as a behaviour reference: it is a 2016 build and
the API has moved. Some identifiers are obfuscated in every available tree (e.g.
`RoomObjectVariableEnum`'s `furniture_extra`, `RoomObjectLogicEnum`'s `furniture_nft_reward_box`,
which postdate the 2016 build); when a name has to be derived from its value, say so at the
declaration rather than passing it off as recovered.

**`win63_version` is a worse *decompile*, not just a differently obfuscated one — never read a
body from it.** Two of its method bodies were caught in a single day producing code that would
have shipped: `SpinnerCatalogWidget.refresh()` reads `visible = 0 > 0` with the computed local
discarded (a permanently hidden container), and `GiftWrappingConfigurationEventParser.parse()`
reads `while(0 < _loc2_)` in all four list loops, with the counter incremented and never tested (a
browser hang on any non-empty list). The primary tree has the correct code in both. Together with
the dropped E4X `@` below, the rule is unconditional: **when a `win63_version` body reads as dead,
absurd, or impossible code, it is the decompiler, and the primary tree settles it.**

Cite it for a *name* — it is the only tree where messages have readable filenames, where the
primary has `unknowns/_SafePkg_2102/_SafeCls_3475.as` — and point every `AS3:` trace at the
primary path, as `.claude/rules/30-as3-traceability.md` already requires. The port had drifted from
that at scale: 3,684 traces cited `win63_version` for a file that exists under the same name in the
primary tree, repointed on 2026-08-09. When repointing, check that the *member* exists in the
primary file too, not just the file — the 2026 build is later and the API has moved, so matching on
the filename alone turns a stale citation into a confidently wrong one. That check held back 200
traces naming members the primary tree does not have at all (e.g. `scrollStepH`/`scrollStepV` on
four window classes); they are still open and must not be guessed at.

**`src/unknowns/` (`_SafePkg_N/`) is part of the client** — 556 files under `src/com/sulake/` import
from it, e.g. `habbo/inventory/items/FurnitureItem.as` imports `_SafePkg_2405._SafeCls_2649`, the
interface declaring `get stuffData():IStuffData`. It holds real parser DTOs and composers
(`_SafePkg_3364` carries the unseen-item reset composers). Treating it as an unrelated module means
failing to find definitions that exist.

**The flat `_SafeCls_N.as` files directly under `src/` are the embedded-asset classes, and they
carry the name mapping.** Each is a one-line `[Embed(source="/_assets/<seq>__SafeCls_N.<ext>")]`
wrapper, but the decompiler appends the original identifier as a footer comment —
`@identifier _SafeCls_894 = "header_png$e4f111fb..."`. That footer is the only thing tying an
obfuscated ref to its real embed, and `tools/lib/cryptedManifest.mjs` reads all of them. Do not
skip these files.

**The 2026 decompiler drops the `@` from E4X computed-attribute access.** `_loc3_.@["order-before"]`
comes back as `_loc3_["order-before"]`, which reads as child-element access and makes live code look
dead — `.@id` in the same method keeps its `@`, so the inconsistency is the tell. Check the XML: if
the name is an attribute there, the source had `.@[...]`. This is how the `order-before` bodypart
ordering was missed (`AvatarModelGeometry.as`).

Path mapping: `sources/WIN63-202607011411-782849652/src/com/sulake/<module>/` ↔
`sources/win63_version/<module>/` ↔ `sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/<module>/`

### Assets

Window layouts and skins ship **as XML**, verbatim from the dump, built by
`packages/vortex-client/tools/build-window-assets.mjs` out of `src/layouts/` + `src/_assets/` +
`src/binaryData/*Com.as`. There is no JSON compile step and no intermediate sorted tree:
`binaryDataXml_organized/` is a leftover whose filenames come from each XML's internal
`<layout name="...">` — a Flash-authoring label AS3 never reads — so nothing should be named from
it. `src/layouts/` and `src/images/` hold the raw XML/PNG resources flat, named by embed
(`<seq>_<name>_<type>$<hash>` or `<seq>__SafeCls_N`).

**The builder reads a second source, `AIR-1.0.31`, as a supplement.** Same join, different tree
shape — AIR keeps its `*Com.as` at `scripts/` and its embeds in `scripts/binaryData/`, where WIN63
keeps the manifests in `src/binaryData/` and the embeds in `src/layouts/` + `src/_assets/`; both
have a `binaryData/` and it means the opposite thing in each, which `resolveTree()` sorts out. The
merge rule is deliberate and narrow: **AIR adds names WIN63 does not have, and never replaces one**
— except the names in `AIR_PREFERRED`, each of which is a checked decision written down at the set.
Today that is the whole of it: **1 layout added** (`raid_protection_settings_xml`) and **1
overridden** (`iro_room_details_framed_xml`, for its one extra button). `--no-air` builds without
it.

Beware of measuring the gap between the two trees by filename: AIR's blobs carry the embed's
*linkage* name (`border_12_xml$…`) and the shipped assets carry the `*Com.as` *field* name
(`habbo_skin_border_12_xml`), so a flat comparison invents hundreds of AIR-only assets that are the
same file under the other name. The builder's own report is the measurement.

**An asset's real name is its `*Com.as` field name**, the exact string passed to
`assets.getAssetByName()` — e.g. `HabboWindowManagerCom.as` declares
`public static var habbo_window_layout_bubble_xml:Class = bubble_xml$44e3d739...;`. Asset libraries
are per-component, so the same field name in two components can mean two different embeds
(`avatar_image_xml` exists in both HabboFriendBar and HabboWindowManager); join declarations to
files on the embed's **whole** linkage name, hash included. Collapsing to the short name merges
distinct assets — that is how a layout once got shipped under an image's name.

Shipped assets are not always current with the primary tree — check before assuming a code gap.
`packages/vortex-client/src/assets/configurations/HabboAvatarGeometry.xml` has 9 bodyparts and no
`order-*` attributes, where the WIN63 dump's has 11 and 8; the two extra are `petl`/`petr`, the only
bodyparts `order-before` applies to.

## Documentation

**`scripts/` is local-only and is not in this repository.** The measurement probes and one-off
checks the docs below refer to by name — `wire-coverage.mjs`, `todo-inventory.mjs`,
`as3-member-coverage.mjs`, `check-as3-trace.mjs`, the `origins/` Director extractors and the rest —
are personal working tools. Their *results* are what the docs record; the tools themselves are not
shipped. The pre-commit hook and the Claude `PostToolUse` hook both guard on each script's presence,
so a clone without them commits and edits normally.

| File                                 | Content                                                                                                              |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `.claude/rules/`                     | Auto-loaded enforcement rules for Claude Code                                                                        |
| `AGENTS.md`                          | Universal AI agent instructions (generated from `.claude/rules/`, for non-Claude tools)                              |
| `docs/CONTEXT.md`                    | Full architecture and project context                                                                                |
| `docs/PATTERNS.md`                   | Implementation templates with code examples                                                                          |
| `docs/STYLEGUIDE.md`                 | Complete code style reference + performance                                                                          |
| `docs/IMPLEMENTATION_STATUS.md`      | Progress tracking — remaining gaps, priorities, and the narrative behind them. Never state a global % from it       |
| `docs/architectures/`                | Per-module AS3 architecture deep-dives, created on demand — see `docs/architectures/README.md`                       |
| `docs/CLIENT-SERVER-ARCHITECTURE.md` | Real client↔server protocol, message flows, and known server-side bugs — the server is `vortex-emulator` (see below) |

### The server is `vortex-emulator`, and `sources/HABBO-ARCTURUS-DAYBREAK/` is not it

The server this client talks to is **Turbo Cloud / `vortex-emulator`** (C#), a sibling checkout at
`../vortex-emulator`. Packet headers live in one file there:
`Vortex.Revisions/Revision20260701/Headers.cs` — `MessageComposer` constants are server→client (the
client's `_events`), `MessageEvent` constants are client→server (the client's `_composers`).

`sources/HABBO-ARCTURUS-DAYBREAK/` is an unrelated **Java** reference dump, useful only for reading
how someone else serialized a message. It is **not** this project's server and its
`messages/outgoing/Outgoing.java` headers are a 2016 build's — 221 of the 229 that share a name with
a client event disagree on the id, `ChatMessageComposer` included. Editing it changes nothing and
its numbers must never be treated as authority. `docs/CLIENT-SERVER-ARCHITECTURE.md` says this too
(its opening note discards an earlier Arcturus-based draft), but the table row above used to imply
the opposite, which is how an entire round of "fixes" once landed in the wrong repository.

Header source-of-truth order stays: WIN63's own registry
(`.../habbo/communication/_SafeCls_2046.as`) first, then the emulator as corroboration — never the
emulator alone.

### The website is `packages/vortex-web`, and habbo.com's own files are its source of truth

`vortex-web` is the hotel's CMS — a port of **habbo-web** (the modern habbo.com) in Svelte 5 + Vite +
Tailwind 4 + `svelte-spa-router`, the same stack as the emulator's dashboard. `pnpm web` serves it on
:5174. Its README has the full map; three things matter from outside it:

- **A page that looks empty next to habbo.com is usually a CMS page, not a porting gap.** Its
  editorial content is in none of the files below: `habbo-web-pages` fetches it at runtime from
  `images.habbo.com/habbo-web-pages/production/<key>.fr.html` (the whole "Les clés du jeu" section,
  and the small side boxes on settings/community/home). `tools/fetch-web-pages.mjs` mirrors those
  fragments and their images into `src/webpages/` + `public/webpages/`; `components/WebPage.svelte`
  injects them, and `.static-content` in `src/styles.css` is real CSS for exactly that reason —
  the markup is habbo.com's and carries none of our classes.
- **Three reference files settle everything else, and they are not optional.** `sources/app.5ac3d2f8.css`
  (habbo.com's stylesheet — `mockup/habbo.css` is the same 2299 rules, beautified) says how a thing
  looks; `sources/habbo.js` (its AngularJS bundle) carries the route table AND all 210 HTML
  templates inline, extracted by `tools/extract-templates.mjs`, which say what is inside a page and
  in what order; `sources/fr.json` (its localisation, 1688 keys, shipped as `src/lib/fr.json`) says
  what everything is called — a template names its own key in `translate="…"`, so a label is never a
  guess. Building from the CSS alone produced a site that looked right and was structurally wrong:
  no tabs anywhere, a `/me` route habbo.com does not have, a sign-in form where habbo.com has a
  modal, and invented French for every label. The port keeps habbo-web's values and structure and
  drops its delivery: Tailwind utilities against tokens in `src/styles.css`, not
  `.navigation__link--home` classes.
- **The web API is `Vortex.WebApi` in the emulator**, not the dashboard's API — `/api/public/authentication/*`,
  `/api/user/avatars`, `/api/ssotoken`, `/api/newuser/name/*`, on :8080, authenticated by an HttpOnly
  cookie (so `/api` must stay same-origin — the dev server proxies it). It has **no identity route**:
  `GET /api/user/avatars` is the probe, 401 = signed out. Everything else the site shows — articles,
  badges, friends, groups, rooms, the purse, the shop — is mocked in `src/lib/mock.js` and labelled as
  such, because no endpoint serves it yet.
- **`?sso=<ticket>` on the client's URL** is how the CMS hands over a session it already
  authenticated; `packages/vortex-client/index.html` reads it into
  `VortexConfig.connection.ssoTicket`. With no ticket the client runs its own login flow exactly as
  before.
