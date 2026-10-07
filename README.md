# Vortex

A full TypeScript / PixiJS v8 port of the Habbo Hotel Flash client — engine and display both, with
the original Flash window layouts and skins shipped as XML rather than reimplemented.

---

## Setup

```bash
node install.mjs
```

That is the whole thing. It asks nothing: it finds the assets, installs dependencies, generates
all 4,386 asset files, writes a working configuration if there is not one already, then probes the
three services and names the one that is not answering. Re-running it is safe — every step is
idempotent and reports what was already current.

```
1/6  Prerequisites      Node 24.14.1 · pnpm 11.8.0
2/6  Asset source       Flash dump: sources/WIN63-202607011411-782849652 (27 component manifests)
3/6  Dependencies       already installed
4/6  Assets             window layouts and skins · images · sound effects ·
                        avatar configurations · chat styles · localization texts
5/6  Configuration      common_configuration_txt.txt already exists, left alone
6/6  Verification       788 layouts · 133 skins · 3343 images · 21 sounds · 100 configurations
                        asset host, web API and game socket all answer

Ready.  pnpm dev  then open http://localhost:5173/client/
```

Flags, none of them usually needed: `--dump <path>`, `--assets <zip>`, `--force-config`,
`--skip-install`, `--skip-checks`.

---

## What has to exist outside this repository

The client's own assets ship with it, so a clone draws correctly out of the box. Two things it
talks to at runtime do not, and cannot: they are a hotel's own infrastructure.

| What | Why | Where |
|---|---|---|
| Client assets | everything the client itself draws | **included** — `vortex-client-assets.zip`, or a Flash dump in `sources/` |
| An asset host | serves `/gordon`, `/c_images`, `/gamedata`, `/dcr` | `http://vortex-assets.local` — **you provide this** |
| The server | game socket + web API | `vortex-emulator`, a sibling checkout — **you provide this** |

Without the last two the client still starts and reaches its login screen; it cannot sign in or
open a room. The installer's final step says which of the two is silent.

Plus **Node ≥ 22** and **pnpm ≥ 11** — this is a pnpm workspace, npm and yarn cannot resolve it at
all. The installer checks both first and stops if either is short.

### The client's own assets: the zip ships with the repo

**`vortex-client-assets.zip` is committed** — 4,384 files, 8.9 MB, the generated tree in one file.
It is the only piece of dump-derived content in this repository, and it is here so that
`git clone && node install.mjs` is enough on its own. You need no dump to run the client.

A dump is still what *produces* that tree, and it always wins when both are present: it is the only
source that can generate a **new** one, where an archive is a copy and stale by definition. A dump
is any directory under `sources/` holding `src/binaryData/*Com.as` and `src/_assets/` — the
installer does not look for a hardcoded name, it measures every candidate and takes the richest, so
a newer dump dropped in beside the old one is picked up with no edit anywhere.

After regenerating against a new dump, re-pack and commit the archive so clones get the new assets:

```bash
node install.mjs --pack          # rewrites vortex-client-assets.zip
```

Note this covers the client's own assets only. The furni, avatar figures and gamedata served at
`vortex-assets.local` are a separate, far larger tree in Nitro's formats; nothing here generates or
packages it.

### The asset host

Any web server (Laragon, nginx, anything) answering on `http://vortex-assets.local` and serving
four directories: `gamedata/`, `gordon/`, `c_images/`, `dcr/`. The dev server proxies to it, so the
client never sees the origin.

The one file that matters is **`gamedata/hashes.json`**, because everything else is found through
it — it maps a logical name to the file serving it, with a hash for cache-busting:

```json
{"hashes": [
  {"name": "external_variables", "url": "http://vortex-assets.local/gamedata/external_variables", "hash": "8f14e4…"},
  {"name": "furnidata_json",     "url": "http://vortex-assets.local/gamedata/furnidata_json",     "hash": "3c59dc…"},
  {"name": "figuredata",         "url": "http://vortex-assets.local/gamedata/figuredata",         "hash": "b6d767…"}
]}
```

If the client boots to a blank room, this is the first URL to `curl`.

---

## Configuration

Two files under `packages/vortex-client/src/assets/configurations/` decide where the client's hotel
is, and they are the one thing that cannot be imported: `HabboConfigurationCom.as` embeds them, but
the dump's copies are habbo.com's own — they name `game-us.habbo.com:30000` and
`https://www.habbo.com`, so a client built from them dials Sulake rather than your hotel.

The installer writes both if they are absent and **never touches them again**, so edits survive
every re-run. `--force-config` puts the defaults back.

`common_configuration_txt.txt` is a flat key/value file. The chain that boots the client runs
through four of its keys:

```properties
url.prefix.en=                                              # left EMPTY on purpose — see below
web.api.en=/webapi
gamedata.hashes.url=${url.prefix}/gamedata/hashes.json      # → the manifest above
external.variables.txt=${url.prefix}/gamedata/external_variables/1
```

`url.prefix` and `pocket.api` are deliberately empty. `App.ts::fillOriginPrefixes()` fills them at
boot with the origin the client is actually served from, and they have to be computed: the client
runs at its own root, under vortex-web's `/client`, and through a tunnel, and each needs a
different value — including a different *scheme*, since an absolute `http://` URL is blocked on an
https page. Writing one down breaks two of the three.

One trap worth knowing: `connection.info.host` / `.port` in that file are read by
`HabboCommunicationManager.updateHostParameters()` but are **not** what the socket dials.
`packages/vortex-client/index.html`'s `VortexConfig.connection` is — `127.0.0.1:40001` when served
locally, the page's own origin through `/ws` otherwise. Change the emulator's port there.

`localization_configuration_txt.txt` lists the languages, one hotel per entry:

```properties
localization.1=en
localization.1.code=en_US.iso-8859-1
localization.1.name=English (COM)
localization.1.url=/gamedata/hashes.json
```

---

## Regenerating assets by hand

The installer runs these for you; they are here for when you want one of them on its own. Each
reads the dump and writes into `packages/vortex-client/src/assets/`, gitignored and safe to re-run:

```bash
pnpm --filter vortex-client build:window-data              # 788 layouts + 133 skins
pnpm --filter vortex-client import:crypted-images          # PNGs, named as AS3 names them
pnpm --filter vortex-client import:crypted-sounds          # 21 sound effects
pnpm --filter vortex-client import:avatar-configurations   # 7 avatar XML configurations
pnpm --filter vortex-client import:chatstyles              # the 89-style chat catalogue
pnpm --filter vortex-client import:localizations           # 13 embedded localization texts
```

They are idempotent: run them again after a new dump and they report what changed and what was
already current.

---

## Running

```bash
pnpm dev
```

Then open **`http://localhost:5173/client/`**. The dev server serves the client under that base path
so the same build can also be reached through the CMS proxy — `/` redirects there, so either works.

The dev server proxies to the two services for you:

| Path | Goes to | Serving |
|---|---|---|
| `/gordon`, `/c_images`, `/gamedata`, `/dcr` | `vortex-assets.local` | furni, avatars, gamedata |
| `/webapi` | `localhost:8080` | the emulator's web API |
| `/habbo-imaging` | `localhost:8081` | the imager, started for you |

The game socket is dialled directly at `127.0.0.1:40001`.

Other packages:

```bash
pnpm imager:dev   # the standalone avatar/furni imager
pnpm build        # production build of the client
pnpm lint         # eslint over the workspace
```

---

## Packages

| Package | What it is |
|---|---|
| `vortex-engine` | the port itself — core, communication, room engine, Habbo game logic |
| `vortex-client` | the shell: display classes, window system, assets, boot |
| `vortex-imager` | avatar and furni image rendering as a service |
| `vortex-glaze` | a window-layout editor built out of the client's own widgets |

The engine never imports from the client. Data flows one way: the engine raises an event, a client
display class listens and draws.

---

## When it does not work

Run `node install.mjs` first — its last two steps count what was generated and probe all three
services, which answers most of what follows before you have to read it.

**Blank canvas, no windows.** The asset generation has not run, or ran against a missing dump.
Check `packages/vortex-client/src/assets/window-layouts/` — it should hold 788 files.

**Every caption reads as a raw `${key}`.** The embedded localization texts are missing —
`pnpm --filter vortex-client import:localizations`. They are the only texts the login flow has, so
this shows up before you can sign in.

**The room opens but has no walls, no furni.** The asset host is not answering. Test it directly:
`curl -I http://vortex-assets.local/gordon/`, then `curl http://vortex-assets.local/gamedata/hashes.json`.

**Stuck on the loading screen, or the login goes nowhere.** The emulator is not running, or not on
`40001`. The client dials the socket before it can do anything else.

**`pnpm install` refuses, or the build fails in odd ways.** Check `node -v` and `pnpm -v` against
the requirements above. npm and yarn cannot resolve this workspace at all.

**On Windows, `git clone` fails with `Filename too long`.** The deepest path in the repository is
157 characters and Windows stops at 260, so the directory you clone into has to be shorter than
about 100. Clone to `C:\vortex` rather than somewhere under `Documents`, or lift the limit with
`git config --global core.longpaths true`.

---

## Contributing

The port has rules, and they are not optional — read `CLAUDE.md` first. The short
version: the AS3 source is the truth, it is read before anything is written, and every ported member
carries a comment naming the file and member it came from. `CLAUDE.md` explains why, and documents
the traps in the decompiled sources that have cost real time.

## Licence

GPL-3.0
