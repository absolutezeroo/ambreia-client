# Vortex RPG client

TypeScript + PixiJS v8 client of the Habbo RPG fork. It started as a full port of the Habbo Flash
client and is being restructured into standalone packages: read
`docs/superpowers/specs/2026-10-07-client-architecture-design.md` before structural work, and the
plan of the current milestone in `docs/superpowers/plans/`. The server is `../vortex-rpg-emulator`.

## Commands

```bash
pnpm install                 # dependencies (pnpm 11, Node >= 22)
pnpm dev                     # client dev server on :5173 (also starts the imager on :8081)
pnpm check                   # typecheck, lint, then every test (~80 s): the gate (CI runs it on every push)
pnpm typecheck               # just the typecheck
pnpm test                    # node:test over packages/*/tools and .claude/scripts, then packages/*/test/*.test.ts via tsx
node --test <file.test.mjs>  # one test file
node node_modules/eslint/bin/eslint.js <file>   # lint one file
pnpm build                   # production build: needs a release revision (AMBREIA_RELEASE=<json>, else the newest in ../vortex-rpg-emulator/Vortex.Revisions/Releases)
pnpm gen:headers             # regenerate message ids from the emulator's Headers.cs
pnpm sync:agents             # regenerate AGENTS.md / copilot-instructions.md from this file + rules
node install.mjs             # unpack assets (vortex-client-assets.zip); --pack to rebuild the zip
pnpm --filter vortex-client build:ambreia <dir of .nitro> <out dir>   # lossless .ambreia pieces (rules/assets.md)
```

## Done means verified

1. `pnpm check` is green, and you show its last lines. A Stop hook runs it anyway when the session
   changed a source it covers (`.ts`, `.mjs`, `.json`, `.xml` under `packages/`), and blocks while it is red.
2. A visible change is looked at: use the `run-vortex-client` skill and compare screenshots.
3. A wire change matches the emulator's serializer/parser for that message.
4. Say what you did not verify. "Should work" is not a result.

## Map

| Package | What it is |
|---|---|
| `packages/ambreia-common` | `@ambreia/common`: Logger, utilities, asset loading (incl. `.ambreia` pieces: `assets/pack/`), reactive — imports no other Ambreia package |
| `packages/ambreia-net` | `@ambreia/net`: WebSocket transport, encryption, wire format, registry, packet tap, the new message style (`style/MessageMap`) — imports `@ambreia/common` only |
| `packages/ambreia-avatar` | `@ambreia/avatar`: avatar renderer (not the editor), built from typed options; runs in Node (`tools/render-avatar.mjs`) — imports `@ambreia/common` only |
| `packages/ambreia-ui` | `@ambreia/ui`: window system (`src/`), generic kit (`src/kit/`: plain `WindowManager`, `WidgetRegistry`, dialogs, generic widgets), XML parsers (`src/assets/`); `pnpm --filter @ambreia/ui sandbox` shows it alone — imports `@ambreia/common` only |
| `packages/ambreia-kernel` | `@ambreia/kernel`: DI (`runtime/`), typed config (`config/`: Zod, `app` + `legacy` + one section per feature, `config.json`), features (`feature/`: `defineFeature`, `bootFeatures`) — imports `@ambreia/common` only |
| `packages/ambreia-iso` | `@ambreia/iso`: room engine — core (`src/`), `scene/`, `furniture/`, `avatar/`, `effects/`, each with its `register*` module; `IsoStage` loads a room out of session (zone format); `pnpm --filter @ambreia/iso sandbox` — imports `@ambreia/common` and `@ambreia/avatar` only |
| `packages/ambreia-protocol` | `@ambreia/protocol`: `Headers.generated.ts` (from the emulator), `HabboMessages.ts`, the inherited messages, parsers and composers — imports `@ambreia/common`, `net`, `iso` only |
| `packages/ambreia-game` | `@ambreia/game`: the game over the engines — `features/` (`GAME_FEATURES`, `IGameFeature`: images, room widgets; one folder per feature, e.g. `loading-bar/`), `core/` (DI wrappers), `avatar` incl. the editor, `communication`, `configuration`, `localization`, `room` (RoomEngine, the message handler: the glue over `iso`), `session`, `ui` (room desktop, `RoomWidgetRegistry`; `ui/kit/` is what two features share: a feature imports another only through its `I*.ts`/`events.ts`, ESLint checks it), `window` (`HabboWindowManager extends WindowManager`), `iid/` — never imports the host packages |
| `packages/vortex-engine` | The host shell: `Vortex`, `VortexMain` (boots `GAME_FEATURES` through the kernel), their interfaces |
| `packages/vortex-client` | App shell: boot (`src/App.ts`), display classes, assets, `src/vortex-layouts/` (new window XML) |
| `packages/vortex-glaze` | Live window-layout editor — imports `@ambreia/ui` and `@ambreia/common` only (ESLint wall) |
| `packages/vortex-imager` | Server-side avatar/furni/room renderer reusing the engine |

The project is named **Ambreia** (the MMORPG); new packages take the `@ambreia/` scope, the older
`vortex-*` names are renamed in a later pass. `@ambreia/common/*` and `@ambreia/net/*` are workspace
packages imported by deep path (`@ambreia/common/utils/Logger`; a folder barrel is `…/utils/index`);
`packages/vortex-engine/tools/move-modules.mjs` moves files into a package and rewrites their imports.
Browser globals (canvas, image decode, XML) go through `platform()` of `@ambreia/common/platform/Platform`;
a Node tool calls `setPlatform()` first (see `packages/ambreia-avatar/tools/node-platform.mjs`). Engine
packages are plain classes; the DI registers them with `context.attachInstance(iid, instance, {dependencies, ready, update})`.
`@ambreia/ui` (the package) is not `@ui/` (the client's alias for its own `src/`).
Aliases: in the client `@ui/` and `@/` → client `src/` (the engine's `@core/` `@habbo/` `@iid/` went with J6:
import `@ambreia/game/…`). Target: engines become packages `@vortex/common`, `net`, `avatar`, `iso`, `ui`, then `kernel`,
`protocol`, `game` (spec §3, milestones J1–J6).

## Never

- **Edit `sources/**`, `*.generated.ts`, built `src/assets/window-*` or `.vortex-dev/`.** A hook refuses
  and names what to run instead.
- **Cross a layer wall**: engines (`common`, `net`, `avatar`, `iso`, `ui`) never import `kernel`,
  `protocol` or `game`; nothing under `packages/ambreia-*` imports a `vortex-*` package; the game's
  `core/` never reaches out of `core/`. ESLint enforces it (`wall()` in `eslint.config.mjs`); an
  error there means the design is wrong, not the rule.
- **Type a message id**: use `Incoming.X` / `Outgoing.X` from `Headers.generated.ts`.
- **Run a bare `git commit`**: the owner keeps staged work in progress. Commit by path:
  `git commit -m "…" -- <paths>`.
- **Override `get events()` in a `Component` subclass**: it breaks DI events (use another name, e.g.
  `sessionEvents`).
- **Re-port a removed feature** (RPG spec §7: wired, Builders Club, NFT, …), nor a hotel module the
  core cut removed (catalog, inventory, navigator, messenger, friends, groups, help, moderation,
  quests, toolbar, notifications, sound, the fishing derby…). A new feature is written for the RPG; the old code is under
  the git tag `pre-noyau-client` for reading. The network contract is the 60 messages in
  `HabboMessages.ts`, aligned on the server.

## Conventions ESLint does not check

- `dispose()` is the last method of a class and returns early when `_disposed` is already set.
- Log with `Logger.getLogger('habbo.room.RoomEngine')`: `trace` per frame/packet/item, `debug` for a
  subsystem's own commentary, `info` for milestones, `warn` for data or paths the client does not
  handle (they render nothing, so `debug` would hide them), `error` when the user will notice.
- A manager is a feature (`@ambreia/game/features/`, one line in `GAME_FEATURES`; a new feature gets its own folder):
  a DI `Component` or a plain instance under an IID, with one `I<Manager>` interface (`docs/PATTERNS.md`).
  Config: a feature reads its own section; old keys go through `legacy` / `getProperty` until migrated.
- Render loops allocate nothing per frame and use `Set`/`Map` for lookups (`docs/STYLEGUIDE.md` →
  Performance).
- Comments are in English and say why. Inherited code keeps its `// AS3:` trace when moved
  (`.claude/rules/30-as3-traceability.md`).

## Before you change inherited code

- **Read the body of every call you remove, replace or stop making**, not its name. Names come from
  the AS3 and the TS behind them often does something else: `createMainWindow()` ended with
  `hideMainWindow()`, which detaches the window rather than hiding it; replacing it with
  `visible = false` stopped the catalog from opening at all.
- **"This change is inert" is a claim, not an observation.** Verify it before writing it.
- **A finding from an audit or an agent is a claim.** In one audit, 3 of 26 "criticals" were wrong
  and one fix would have broken the client. Re-check against the code before acting.
- **When a correct change misbehaves, suspect the structure under it** before reverting the change.

## Where things are documented

| Need | Read |
|---|---|
| Target architecture and milestones | `docs/superpowers/specs/2026-10-07-client-architecture-design.md` |
| Wire protocol, flows, known server bugs | `docs/CLIENT-SERVER-ARCHITECTURE.md` (rules load for `**/communication/**`) |
| Class templates (Composer, Parser, Manager, window) | `docs/PATTERNS.md` |
| Style and performance details | `docs/STYLEGUIDE.md` |
| Reading the AS3 dumps | `.claude/rules/as3-sources.md` (loads when you open `sources/`) |
| Assets, layouts, image naming | `.claude/rules/assets.md` (loads in client tools/assets) |
| Dev bundling of the engine | `.claude/rules/vite-dev.md` (loads in vite config/plugins) |
| Port history (frozen, not updated any more) | `docs/IMPLEMENTATION_STATUS.md` |

The website (`vortex-web`) lives in its own repository; comments naming it describe that site. It
hands the client a session with `?sso=<ticket>`, read by the kernel's config (`browserSources`, App.ts).

## Keeping this file useful

Keep it under ~150 lines: it loads in every session. Add a line only after the same mistake happens
twice, and prefer a lint rule, hook or test when the rule can be checked. Anything that applies to
part of the repo goes in a path-scoped `.claude/rules/*.md`. `AGENTS.md` is generated: run
`pnpm sync:agents` after editing this file or a rule (the pre-commit hook checks it).
