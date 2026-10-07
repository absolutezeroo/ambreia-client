# Vortex RPG client

TypeScript + PixiJS v8 client of the Habbo RPG fork. It started as a full port of the Habbo Flash
client and is being restructured into standalone packages: read
`docs/superpowers/specs/2026-10-07-client-architecture-design.md` before structural work, and the
plan of the current milestone in `docs/superpowers/plans/`. The server is `../vortex-rpg-emulator`.

## Commands

```bash
pnpm install                 # dependencies (pnpm 11, Node >= 22)
pnpm dev                     # client dev server on :5173 (also starts the imager on :8081)
pnpm check                   # typecheck client+engine+glaze+imager, then all tool tests (~45 s): the gate
pnpm typecheck               # just the typecheck
pnpm test                    # node:test over packages/*/tools and .claude/scripts, then packages/*/test/*.test.ts via tsx
node --test <file.test.mjs>  # one test file
node node_modules/eslint/bin/eslint.js <file>   # lint one file
pnpm build                   # production build of the client (tsc + vite)
pnpm gen:headers             # regenerate message ids from the emulator's Headers.cs
pnpm sync:agents             # regenerate AGENTS.md / copilot-instructions.md from this file + rules
node install.mjs             # unpack assets (vortex-client-assets.zip); --pack to rebuild the zip
```

## Done means verified

1. `pnpm check` is green, and you show its last lines. A Stop hook runs it anyway when the session
   changed `.ts` files, and blocks while it is red.
2. A visible change is looked at: use the `run-vortex-client` skill and compare screenshots.
3. A wire change matches the emulator's serializer/parser for that message.
4. Say what you did not verify. "Should work" is not a result.

## Map

| Package | What it is |
|---|---|
| `packages/ambreia-common` | `@ambreia/common`: Logger, utilities, asset loading, reactive — imports no other Ambreia package |
| `packages/ambreia-net` | `@ambreia/net`: WebSocket transport, encryption, wire format, registry, packet tap — imports `@ambreia/common` only |
| `packages/vortex-engine` | Engine: `core/` (runtime/DI, window engine, the DI wrappers `AssetLibrary` and `CoreCommunicationManager`), `room/` (generic room engine), `habbo/` (game core: `avatar` incl. the editor, `communication`, `configuration`, `localization`, `room`, `session`, `ui` (room desktop, name bubble), `window`), `iid/` (DI symbols) |
| `packages/vortex-client` | App shell: boot (`src/App.ts`), display classes, assets, `src/vortex-layouts/` (new window XML) |
| `packages/vortex-glaze` | Live window-layout editor built on the client's own widgets |
| `packages/vortex-imager` | Server-side avatar/furni/room renderer reusing the engine |

The project is named **Ambreia** (the MMORPG); new packages take the `@ambreia/` scope, the older
`vortex-*` names are renamed in a later pass. `@ambreia/common/*` and `@ambreia/net/*` are workspace
packages imported by deep path (`@ambreia/common/utils/Logger`; a folder barrel is `…/utils/index`);
`packages/vortex-engine/tools/move-modules.mjs` moves files into a package and rewrites their imports.
Aliases: `@core/` `@habbo/` `@room/` `@iid/` → engine `src/`; in the client also `@ui/` and `@/` → client
`src/`. Target: engines become packages `@vortex/common`, `net`, `avatar`, `iso`, `ui`, then `kernel`,
`protocol`, `game` (spec §3, milestones J1–J6).

## Never

- **Edit `sources/**`, `*.generated.ts`, built `src/assets/window-*` or `.vortex-dev/`.** A hook refuses
  and names what to run instead.
- **Cross a layer wall**: the engine never imports the client; `core/` never imports `habbo/` or
  `room/`; `room/` never imports `habbo/`. ESLint enforces it (`wall()` in `eslint.config.mjs`); an
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
- Managers are DI `Component`s registered under an IID, with one `I<Manager>` interface
  (`docs/PATTERNS.md` → Manager template).
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
hands the client a session with `?sso=<ticket>`, read in `packages/vortex-client/index.html`.

## Keeping this file useful

Keep it under ~150 lines: it loads in every session. Add a line only after the same mistake happens
twice, and prefer a lint rule, hook or test when the rule can be checked. Anything that applies to
part of the repo goes in a path-scoped `.claude/rules/*.md`. `AGENTS.md` is generated: run
`pnpm sync:agents` after editing this file or a rule (the pre-commit hook checks it).
