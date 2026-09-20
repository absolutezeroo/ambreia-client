# Deploying the hotel

One Coolify resource per service, the same way the database and phpMyAdmin already are. Five of
them here, three with a public name:

```
                           ┌────────────────────────────────────────┐
   vortex-hotel.online ───▶│ vortex-web            Caddy :80        │
        (the site)         │   /                   the habbo-web    │
                           │   /api/*         ──┐      port         │
                           │   /habbo-imaging ──┼─┐                 │
                           └────────────────────┼─┼─────────────────┘
                                                │ │
   client.vortex-         ┌─────────────────────┼─┼───────────────┐
     hotel.online   ─────▶│ vortex-client       │ │  Caddy :80    │
        (the game)        │   /            the built client       │
                          │   /webapi/*  /api/* ─┤ │              │
                          │   /ws               ─┤ │              │
                          │   /habbo-imaging    ─┼─┤              │
                          └─────────────────────┼─┼──────────────┘
                                                │ │
   assets.vortex-         ┌──────────────────┐  │ │   coolify
     hotel.online   ─────▶│ vortex-assets    │  │ │   network
                          │ the Nitro tree,  │  │ │
                          │ baked in         │  │ │
                          └──────────────────┘  │ │
                                                │ │
                          ┌─────────────────────▼┐│
                          │ vortex-emulator      ││
                          │ :8080 web API        ││
                          │ :30001 game socket   ││
                          └──────────────────────┘│
                          ┌───────────────────────▼──┐
                          │ vortex-imager :8081      │
                          └──────────────────────────┘
```

The emulator and the imager have no public address: the two front containers reach them over the
Docker network by their **network alias**.

The site and the client are separate resources on separate hosts because they are separate
packages on separate rhythms — a copy fix on the front page has no business waiting on
`tsc && vite build` over the whole game client. `/hotel` on the site mounts the client in an
iframe with the SSO ticket on the query string, which is also what makes the split work: the
ticket travels in the URL, so the client needs nothing of the site's session cookie.

## Why each front shares its own origin

Not tidiness. The client resolves its services against the origin it was served from, and it does
that on its own:

- `install.mjs` writes `url.prefix` and `pocket.api` **empty on purpose**, and
  `App.ts::fillOriginPrefixes()` fills them at boot with the origin actually serving the page.
- `packages/vortex-client/index.html` dials `wss://<that same origin>/ws` for anything that is not
  localhost.
- The shipped configuration says `web.api.en=/webapi`, an origin-root path.

So the API, the socket and the imager need **no source change to deploy**, no CORS policy and no
cross-site cookie — on whichever host serves the client. That is why moving it to
`client.vortex-hotel.online` cost nothing: it asks its own host, and its Caddy answers.

The site works the same way for `/api` and `/habbo-imaging`. The only two things it cannot derive
are the other hosts — the client and the assets — and both already have a seam for it in
`packages/vortex-web/src/lib/config.js`.

## Why the assets do not

The asset tree is the deliberate exception. It is the one part with a plausible future somewhere
else — behind a CDN, or on a box chosen for bandwidth rather than CPU — and the client already
follows URLs for it rather than assuming a path: everything it loads is a URL found inside
`gamedata/hashes.json`. Moving the tree means editing that one file, and nothing else.

The price is real and paid once: cross-origin fetches need `Access-Control-Allow-Origin` on that
host, which the Caddyfile sets. Without it the login screen works perfectly and no room ever draws.

---

## 0. DNS

At the registrar for `vortex-hotel.online`:

| Type | Name | Value |
|---|---|---|
| A | `@` | the Coolify server's IP |
| A | `www` | the same IP |
| A | `client` | the same IP |
| A | `assets` | the same IP |
| A | `*` | the same IP |

Nothing for the emulator or the imager: neither is ever addressed from outside. `assets` is its own
name so the tree can move behind a CDN or onto another server later without the client learning a
new shape — only `hashes.json` would change. The wildcard makes the next subdomain free.

Do this first — Let's Encrypt validates over HTTP against each name, so Coolify cannot issue a
certificate before the record resolves.

## 1. Stable names on the network

Coolify names a container `<uuid>-<timestamp>`, and the timestamp changes on every deploy — an
internal hostname copied out of the Access panel today is wrong after the next redeploy.

For the **emulator** and the **imager**, open Access → *Edit Networking* and set a **Network
alias**:

| App | Network alias |
|---|---|
| the emulator | `vortex-emulator` |
| the imager | `vortex-imager` |
| the assets | `vortex-assets` |

Those three names are what the front container dials, and they survive redeploys.

The assets alias is needed even though the tree has a public hostname of its own. The client asks
its **own** origin for every asset path — `external_variables` is written in terms of
`${url.prefix}`, filled at boot with the origin the client was served from — so the front proxies
`/gamedata`, `/c_images`, `/dcr`, `/gordon` and `/gamecenter` to this alias. `assets.vortex-hotel.online`
stays public anyway: the imager and the website reach it by URL.

## 2. The emulator app

It no longer needs to be reachable from outside. In Coolify:

- **Domains** — remove both. Nothing public points here any more.
- **Ports Exposes** — `8080,30001` (Traefik no longer routes to them, but Coolify still uses this
  list to publish them on the internal network).
- **Ports Mappings** — empty. A host-published port is what caused
  `Bind for 0.0.0.0:8080 failed: port is already allocated`, and it also disables rolling updates.

Environment (the ones that decide whether anything answers at all — every listener defaults to the
container's own loopback):

```
serverOptions__WebSocketServer__listeners__0__ip=0.0.0.0
serverOptions__TcpServer__listeners__0__ip=0.0.0.0
VORTEX__Vortex__WebApi__Host=0.0.0.0
VORTEX__Vortex__WebApi__AllowInsecureRemoteHttp=true
```

The first two carry **no `VORTEX__` prefix** — they are read by the SuperSocket child hosts, not by
the main host, and a prefixed copy is ignored in silence.

`AllowInsecureRemoteHttp` stays on: the hop from Caddy to the emulator is plain HTTP inside the
Docker network. TLS is terminated at the edge, which is where it belongs, but the emulator has to
be told that it is deliberate rather than refuse to start.

**The shop is off until you turn it on**, and that is the design rather than an oversight — a hotel
that took money with no signing key would accept any webhook body anyone posted at it, and the
failure would look exactly like the feature working:

```
VORTEX__Vortex__Shop__Enabled=true
VORTEX__Vortex__Shop__ProviderSecrets__manual=<32 characters or more, generated>
```

With no secret no order opens and the webhook answers 404, so leaving these out is a safe state and
not a broken one. `manual` is the provider that ships: it hosts no payment page, so an order waits
until an operator posts a signed notification for it. A real PSP is one more `ProviderSecrets__<key>`
and `Vortex__Shop__Provider` pointed at it. The nine bundles on sale are rows seeded by the
migration — reprice them in the database, not here.

**Persistent Storage** — one named volume on `/app/logs`. The emulator logs to the console only,
so `docker logs` is the live view and Coolify shows it; what this volume is actually for is
`logs/audit-dead-letter.jsonl`, where `AuditWriterService` writes the audit records whose database
write failed. Those are the events you most want after an incident, and without the volume they
die with the container that could not persist them.

## 3. The asset tree, as an image

The Nitro tree (`gamedata/`, `gordon/`, `c_images/`, `dcr/`) is a hotel's own data — the README is
explicit that this repository does not ship or generate it. On the tree this was written against it
is **2.9 GB across 218 000 files**, so how it reaches the server is a real decision and not a
detail.

It ships as a Docker image, built **on the machine where the files already live** and pushed to a
registry. Coolify then pulls an image instead of cloning gigabytes of binaries it would re-clone on
every deploy — and a registry pull moves only the layers that actually changed.

**The recipe lives with the tree, not in this repository**: `Dockerfile` and `.dockerignore` sit
inside the asset directory itself (`C:/Laragon/www/vortex-assets` on the machine this was set up
from). Nothing about the assets belongs in the client's source — and the build context has to be
that directory anyway.

### Publishing assets

```bash
cd C:/Laragon/www/vortex-assets
docker build -t ghcr.io/<you>/vortex-assets:latest .
docker push  ghcr.io/<you>/vortex-assets:latest
```

Then Redeploy the assets resource in Coolify, which pulls the new layers.

**What "incremental" actually means here**, because it is not automatic:

- A layer is content-addressed. One that has not changed is not rebuilt, not re-pushed and not
  re-pulled — locally, over the wire, and on the server.
- That `Dockerfile` therefore splits the tree into eleven `COPY` layers rather than one. A single
  `COPY . /assets` would make every edit cost 2.9 GB.
- **Docker invalidates a changed layer and every layer after it**, so the file orders from most
  stable to most edited. `gamedata` is last: republishing furnidata or external_variables moves
  64 MB. Put it first and every edit would rebuild the whole tree.
- The 75 000 furni bundles are split six ways by first letter, which puts a new furni at roughly
  300 MB instead of 1.8 GB. Split further if that becomes the thing you do daily.

### Nothing mounts it

No Persistent Storage on the assets resource: the files are *in* the image. And the imager does not
need the tree on disk either — `packages/vortex-imager/src/shim/globals.ts:45` only installs its
file-backed fetch when `IMAGER_ASSETS_ROOT` is set, and falls back to fetching over HTTP from
`IMAGER_ASSETS_BASE_URL` otherwise. Leave it unset and both the client and the imager read the same
served copy, which is also what stops them drifting.

### The manifest, and what Apache used to do for it

`gamedata/hashes.json` maps a logical name to **the URL that serves it**, and everything the client
loads afterwards is a URL found inside it. Get its host wrong and the login screen still works
while no room ever draws.

Under Laragon it was not a file at all. Two Apache-only pieces produced it:

| | did |
|---|---|
| `gamedata/hashes.php` | generated the manifest per request, `md5_file()` per entry, base URL hardcoded |
| `gamedata/.htaccess` | rewrote `<name>/<hash>` to the real file, seven times over |

Neither survives in a static container, so **the image generates the manifest at build time** and
the seven rewrites became Caddy matchers. Both live in that `Dockerfile`.

That is better than editing a checked-in file, not just different:

- the hashes are recomputed from the files actually being shipped, so they cannot go stale against
  the content the way a hand-edited manifest can;
- the base URL is `ARG ASSETS_BASE_URL`, so the source tree keeps naming `vortex-assets.local` and
  local development goes on working untouched;
- the build **fails** if the manifest still names the development host, rather than shipping a
  hotel where nothing draws;
- `md5sum` is what `md5_file()` produced, so a browser holding a cached copy from the Apache days
  does not re-download the world on the first boot after the move.

To point the tree somewhere else — a CDN, another host — rebuild with
`--build-arg ASSETS_BASE_URL=https://…`. Nothing else changes anywhere.

### Keep the recipe

That directory now holds `Dockerfile`, `.dockerignore`, `.gitattributes` and
`.github/workflows/publish.yml` — the layer split, the ordering that makes an edit cost 64 MB
instead of 2.9 GB, and the manifest generator. Worth version control on its own; whether the
2.9 GB goes in with it is the separate decision above.

## 4. The assets resource

In Coolify this is a **Docker Image** resource, not an application: there is no repository to clone
and nothing to build on the server — the image was built where the files are and pushed to a
registry.

- **Image** — `ghcr.io/<you>/vortex-assets:latest` (add the registry credentials in Coolify if the
  package is private).
- **Domains** — `https://assets.vortex-hotel.online`.
- **Ports Exposes** — `80`.
- **Persistent Storage** — none. The files are in the image.
- **Environment** — none. What it serves is the image, where it answers is the domain.

## 5. The imager app

New Coolify application, same Git repository:

- **Build Pack** — `Dockerfile`, not the auto-detected one. Anything else builds the repository its
  own way and never reads `Dockerfile` or `Caddyfile` at all — a build that succeeds and ships
  nothing you wrote.
- **Dockerfile Location** — `/Dockerfile.imager`, **Base Directory** `/`. The file sits at the root
  rather than beside the package on purpose: given a Dockerfile deeper in the tree, the builder
  took that directory as the build context, and every `COPY` from the root failed with
  `"/pnpm-workspace.yaml": not found`. The imager cannot be installed from its own directory — the
  `workspace:` protocol needs the lockfile and every manifest in the tree.
- **Domains** — none.
- **Ports Exposes** — `8081`.
- **Persistent Storage** — one Volume mount on `/cache`. Nothing else: it reads the asset tree over
  HTTP from the assets resource, not from disk.

Environment:

```
IMAGER_PORT=8081
IMAGER_ASSETS_BASE_URL=https://assets.vortex-hotel.online
IMAGER_CACHE_DIR=/cache
IMAGER_DB_HOST=<the hotel's MySQL host>
IMAGER_DB_PORT=3306
IMAGER_DB_USER=<user>
IMAGER_DB_PASSWORD=<password>
IMAGER_DB_DATABASE=<database>
```

**Do not set `IMAGER_HOST` here.** It is the imager's own bind address (`0.0.0.0` by default), not
where anything else finds it — the front reaches it through `IMAGER_UPSTREAM`, which is a variable
on the *front's* app.

**Never set `IMAGER_ASSETS_ROOT` here.** It does not mean "where the assets are". When it is set,
`src/shim/globals.ts` replaces `globalThis.fetch` with one that serves every URL under
`IMAGER_ASSETS_BASE_URL` off that directory instead of over the network — and returns a `404 Not
Found` of its own making when the file is not there. It does not fall back to HTTP. A stale value
shadows the asset host completely and produces a 404 indistinguishable from the server's, against a
host that is answering 200 the whole time.

`IMAGER_ASSETS_BASE_URL` is where it downloads the hotel's configuration at boot. Its default
(`http://vortex-assets.local`) resolves nowhere in a container, and the imager exits rather than
start without it.

That makes the assets resource a startup dependency: until it serves `/gamedata`, the imager
crashloops. Deploy it first, or expect this container to restart until it is up.

It reads the same database the emulator does — group badges and furni definitions live there.
Read-only in practice, but give it its own MySQL user if you want that guaranteed rather than
assumed.

## 6. The client app

New Coolify application, same repository.

- **Build Pack** — `Dockerfile`. Same warning as above: the auto-detected pack ignores this file.
- **Dockerfile Location** — `/Dockerfile`, **Base Directory** `/`.
- **Domains** — `https://client.vortex-hotel.online`. Its own host, which is what the built client
  expects: `vite.config.ts` keeps `base: '/'` for a build, so it serves from a root, not a path.
- **Ports Exposes** — `80`, and **Port** `80` in the build configuration — not the 3000 the form
  offers by default. Caddy listens on 80.
- **Persistent Storage** — none. This container never reads the asset tree from disk; it proxies
  it from the assets container.

Environment:

```
EMULATOR_UPSTREAM=vortex-emulator
IMAGER_UPSTREAM=vortex-imager
ASSETS_UPSTREAM=vortex-assets
```

Those are the network aliases from step 1, and Caddy reads them out of the environment at load
time. Named `*_UPSTREAM` and not `*_HOST` on purpose: `IMAGER_HOST` is the imager's own bind
address, so the same name across two resources would mean opposite things.

This is the heaviest build in the deployment — `tsc && vite build` over the whole client. See
[If the client build dies](#if-the-client-build-dies).

## 7. The website app

New Coolify application, same repository. Builds in seconds — it is Svelte and Tailwind, none of
the game engine.

- **Build Pack** — `Dockerfile`.
- **Dockerfile Location** — `/Dockerfile.web`, **Base Directory** `/`.
- **Domains** — `https://vortex-hotel.online`. The apex: this is what a visitor lands on.
- **Ports Exposes** — `80`, and **Port** `80`.
- **Persistent Storage** — none.

Environment:

```
EMULATOR_UPSTREAM=vortex-emulator
IMAGER_UPSTREAM=vortex-imager
```

The site proxies less than the client does — only `/api/*` (unrewritten: unlike the client's
`/webapi`, these are already the paths the emulator serves) and `/habbo-imaging/*`.

**The two hosts it cannot derive** are build arguments, not runtime variables, because a browser
has no environment and the values are baked into the bundle:
`VITE_CLIENT_URL=https://client.vortex-hotel.online` and
`VITE_ASSET_BASE=https://assets.vortex-hotel.online`. Both are defaulted in `Dockerfile.web`;
override them with Coolify's **Build Variables** if the hostnames change. The seam already existed
in `packages/vortex-web/src/lib/config.js` — nothing in the site's source changes to deploy it.

Leave `VITE_ASSET_BASE` empty and the site asks *this* origin for promo art and badges, which
nothing here serves: the pages render with every image missing and no error anywhere.

## 8. Watch Paths, so one push does not rebuild all three

Three applications share one repository, so by default every push fires all three webhooks: a
one-line change in the client rebuilds the imager and the website too. **Configuration → General →
Watch Paths**, one glob per line, is the whole fix — Coolify matches the push's changed files
against them and skips the deploy when nothing matches. It gates the *webhook* only; **Redeploy**
by hand always builds.

Each list is the app's `COPY` surface, not its directory. The three roots are shared on purpose:
`pnpm install --frozen-lockfile` runs in every build, so the lockfile and the workspace manifest
invalidate all three.

The client app (`/Dockerfile`):

```
packages/vortex-client/**
packages/vortex-engine/**
Dockerfile
Caddyfile
install.mjs
vortex-client-assets.zip
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
```

The imager app (`/Dockerfile.imager`):

```
packages/vortex-imager/**
packages/vortex-engine/**
Dockerfile.imager
install.mjs
vortex-client-assets.zip
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
```

**`packages/vortex-client/**` is deliberately absent from the imager's list**, even though its
Dockerfile runs `install.mjs` and reads `packages/vortex-client/src/assets/configurations`. That
directory is gitignored: it comes out of `vortex-client-assets.zip`, which *is* watched. The only
line in the imager pointing at the client is `src/config.ts`'s `avatarConfigDir`, and it resolves
into the unpacked assets, never into the client's source. So client source is genuinely not an
input here — which is the case the list exists for.

The website app (`/Dockerfile.web`):

```
packages/vortex-web/**
Dockerfile.web
Caddyfile.web
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
```

`vortex-engine` is in nobody's list by accident: the client and the imager both depend on it
through `workspace:*`, the website does not depend on it at all.

---

## Migrations

**A redeploy does not touch the schema.** The emulator never applies migrations at startup — its
README is explicit that when to migrate is an operations decision, and the only `Database.Migrate()`
in the repository belongs to the plugin loader. So a deploy that carries a new migration gives you a
new binary against an old database, and the first query for a column that does not exist yet.

**The runtime image has no SDK.** It is `aspnet:10.0`, so there is no `dotnet ef` inside the emulator
container and Coolify's terminal on it is no help here. The tooling has to come from somewhere else.

**Migrate before you redeploy, not after.** Every migration so far has been additive — new columns,
new tables — and EF selects named columns, so the binary already running ignores what it has never
heard of. The other order is the one that breaks: new code reading a column the database does not
have yet.

Take a backup first. Coolify → the MySQL resource → **Backups**, and run one by hand rather than
trusting the schedule to have fired since your last change.

### Where you are

In phpMyAdmin, against the hotel's database:

```sql
SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId DESC LIMIT 5;
```

The top row is the last migration applied. Compare it with the newest file in
`Vortex.Database/Migrations/` — if they match, there is nothing to do.

### Applying them: a throwaway SDK container

Over SSH on the Coolify server. The repository is not persistently on it — Coolify clones into a
build directory it owns — so clone it somewhere of your own:

```bash
git clone <the emulator repository> /tmp/vortex

docker run --rm \
  --network <the network your MySQL resource is on> \
  -v /tmp/vortex:/src -w /src/Vortex.Database \
  -e Vortex__Database__ConnectionString="Server=<internal mysql host>;Port=3306;Database=<db>;User Id=<user>;Password=<pass>;" \
  -e Vortex__Database__ServerVersion="8.0-mysql" \
  mcr.microsoft.com/dotnet/sdk:10.0 \
  sh -c 'dotnet tool install --global dotnet-ef && export PATH="$PATH:/root/.dotnet/tools" && dotnet ef database update'
```

`docker network ls` names the network; the internal host and the credentials are on the MySQL
resource's page in Coolify, under its internal connection URL.

Four details, each of which fails quietly rather than loudly:

- **Both variables are UNPREFIXED.** `VortexDbContextFactory` builds its own configuration root with
  a plain `AddEnvironmentVariables()`, so a `VORTEX__…` copy is ignored in silence and you get the
  connection string from `appsettings.json` instead.
- **It reads `Vortex:Database:ServerVersion`**, not the runtime host's `MySqlServerVersion`. Pinning
  it is what skips `ServerVersion.AutoDetect`, which opens a real connection while the DI container
  is still being configured — before anything that could retry it.
- **The working directory must be `Vortex.Database`.** That factory reads `appsettings.json` from
  `Directory.GetCurrentDirectory()/..`, i.e. the repository root.
- **`dotnet ef` is not in `.config/dotnet-tools.json`**, hence the `dotnet tool install`.

### Applying them without SSH

Generate the SQL on your own machine and import it through the phpMyAdmin that is already deployed:

```bash
cd Vortex.Database
Vortex__Database__ServerVersion="8.0-mysql" dotnet ef migrations script --idempotent -o migrate.sql
```

`--idempotent` guards every migration with an `IF NOT EXISTS(… __EFMigrationsHistory …)`, so the
script applies only what is missing whatever state the database is in — and no connection is needed
to *generate* it, which is why the server version is pinned here too. Add a `<from>` migration id
before `--idempotent` to narrow it to the ones you actually added.

The script uses `DELIMITER //`, which is a client directive rather than SQL: paste it into
phpMyAdmin's **SQL** tab rather than the Import tab if the import chokes on it.

---

## Order, and how to know each step worked

Do them in this order — each one is only checkable once the previous is up.

1. **The asset image** built and pushed, `hashes.json` generated into it — everything below reads
   it.
2. **Migrations**, before the emulator's first start and before any redeploy that carries a new one
   — see [Migrations](#migrations). On a fresh database this is what creates the schema at all: it is
   not created for you, and an emulator started against an empty database fails on its first query.
3. **Emulator**, with the four listener variables. Nothing to check from outside; the container log
   reaching `Starting Vortex Emulator` without an `OptionsValidationException` is the signal.
4. **Assets resource.** A pull, no build. Then, from your own machine:

```bash
curl -sI https://assets.vortex-hotel.online/gamedata/hashes.json | head -1              # 200
curl -sI https://assets.vortex-hotel.online/gamedata/hashes.json | grep -i access-contr # the header
```

5. **Imager** — after the assets resource, whose host it downloads its configuration from at boot;
   it crashloops until that answers. Its log should reach a listening line on 8081 with no
   `Missing embedded avatar asset` warnings.
6. **Client app.** Then:

```bash
curl -sS https://client.vortex-hotel.online/webapi/api/public/info/hello   # JSON, not HTML
npx wscat -c wss://client.vortex-hotel.online/ws                           # opens and stays open
```

7. **Website app.** Then:

```bash
curl -sS https://vortex-hotel.online/api/public/info/hello                 # JSON, not HTML
```

Note the difference, and it is the one worth remembering: the client asks through **`/webapi`**,
which Caddy strips; the site asks **`/api`** directly, which it does not. Same emulator, two paths,
two directives — `handle_path` for one and `handle` for the other.

If either answers HTML with a 200, the request fell through to the SPA fallback instead of being
proxied. That is the single most confusing failure here, because a 200 does not look like one.

If the asset host answers 200 but `access-control-allow-origin` is missing, the client will still
show its login screen and no room will ever draw: the browser fetches the tree cross-origin, and
without that header it refuses the reads without anything obvious in the network tab.

Then open `https://vortex-hotel.online` in a browser. The front page proves the site and its API;
`/hotel` mounts the client in its iframe; a room that draws proves the assets; an avatar on the
selection screen proves the imager.

---

## Before opening it to testers

### Back up the database

Not optional for a beta, and not something any file here can do for you. On the MySQL resource in
Coolify: **Backups → add a scheduled backup**, daily, with a retention you can live with, and an
S3 destination if you have one — a backup on the same disk as the database survives a mistake but
not a dead disk. Then **restore one into a scratch database once**, before you need to. An untested
backup is a belief, not a backup.

### Know where the bug reports land

`POST /api/user/reports` records what a player tells you, as an audit record with category
**`PlayerReport`** and action `player.bug_report`. In the dashboard, that is the investigation /
audit view, filtered on that category.

They arrive with the page, the browser, and the tail of the browser console alongside the player's
own words — enough to tell a rendering bug from a connection one without a second exchange. The
button is in the client itself (`packages/vortex-client/src/BugReporter.ts`), plain DOM rather than
the client's window manager, so it still works when the canvas is what is broken.

The route is authenticated, so a report is always attached to an account, and rate-limited to 10
per five minutes per address (`Vortex:WebApi:ReportRateLimit`) — loose enough not to swallow honest
reports, tight enough that a stuck retry loop cannot fill the audit table.

## If the client build dies

Two failures look alike and are not:

| Exit | Meaning | Fix |
|---|---|---|
| **134**, trace ending in `Heap::CollectGarbage`, `Aborted (core dumped)` | V8's JavaScript heap filled up | `NODE_OPTIONS=--max-old-space-size` in the Dockerfile — already set to 4096 |
| **137**, killed with no trace | the *kernel* or the container limit took the process | raise Coolify's Resource Limits for the app, add swap on the server, or build elsewhere |

`tsc && vite build` over the game client is the heaviest thing in the whole deployment. Check what the
server actually has before assuming a setting will fix it:

```bash
free -h            # total memory and swap
nproc              # cores; the build is mostly single-threaded, so this matters less
```

Under about 4 GB with no swap, no flag will make that step fit. The way out is to build the image
somewhere with more memory and push it to a registry, rather than building on the deployment
server.

## What this does not cover

Honest list, so nothing here reads as more finished than it is.

- **A bug report does not carry the room id.** Reading it would mean coupling the reporter to the
  room engine, and the endpoint already accepts the field: `RoomId` on the audit record is there,
  and wiring it is one line the day the reports say it is worth it.
- **The site and the client keep separate sessions.** Each holds its own `habbo-web-session` cookie
  on its own host, so signing in on one does not sign you in on the other. `/hotel` works anyway —
  it passes an SSO ticket on the query string rather than relying on a shared cookie — but a player
  who opens `client.vortex-hotel.online` directly logs in again. Sharing one cookie would mean
  issuing it for `.vortex-hotel.online` and is a deliberate decision, not a fix to apply blindly.
- **The imager's font rendering is unverified in a slim image.** `@napi-rs/canvas` ships its own
  Skia, but text drawn without fontconfig can fall back oddly. If badges come out with the wrong
  glyphs, `apt-get install -y fontconfig` in its runtime stage is the fix.
- **One silo, `AllowUnclusteredOutsideDevelopment`.** Fine for a beta; it is a deliberate
  single-node deployment, and `MultiSiloReady` refuses a second silo anyway.
- **Migrating is a manual step, every time.** Nothing here reminds you that a deploy carries a new
  migration, and the emulator will not tell you either — it starts fine and fails on the first query
  that needs the missing column. Reading `Vortex.Database/Migrations/` against
  `__EFMigrationsHistory` before a deploy is the whole of the process. An opt-in
  `MigrateOnStartup` would remove the step, and would also mean a rolling deploy migrating from two
  containers at once; that is why the emulator does not have one.
- **The shop has no real payment provider.** `manual` means an operator settles each order by hand,
  which is honest for a beta and does not scale past one. A PSP is one `IShopPaymentProvider`
  implementation — nothing in the endpoints, the service or the site knows a provider by name.
