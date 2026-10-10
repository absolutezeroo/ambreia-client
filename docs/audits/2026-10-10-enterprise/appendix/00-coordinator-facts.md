# Coordinator facts (verified directly, 2026-10-10)

## Revision
- Repo: absolutezeroo/ambreia-client. Working branch `claude/determined-ritchie-omy2dy` == `origin/rpg-character` @ `aeb88bab6f2f6260556d1fc75568a037a083ca88` (2026-10-10 18:41 +0200, "hud, personnage : la barre du bas remplace la barre du haut…"). No other remote branch exists (no main/master on the remote); no tags (the `pre-noyau-client` tag named in CLAUDE.md is NOT in this clone).
- History: 62 commits, first dated 2026-10-09 (squashed/re-created history); single author.
- Working tree clean before and after `pnpm build` (prebuild regenerated `vfxSheets.generated.ts` byte-identically).
- Node v22.22.0, pnpm 11.8.0, Linux 6.18 x86_64 (cloud container). No `../vortex-rpg-emulator` → no server, no header regeneration, no release revision.
- 14 packages; 2,165 .ts files under packages/; 85 test files.

## Gates (exact)
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | OK (9.1 s) |
| `pnpm check` (typecheck 13 packages + tests) | GREEN. node:test 122 tests/120 pass/2 skipped; tsx 254 tests/249 pass/5 skipped. 0 fail. |
| `pnpm lint` | RED: 652 problems (427 errors, 225 warnings). 414 `no-undef` in `.claude/skills/design-habbo-window/previews/**/*.js` (sandbox DSL scripts), 8 `no-useless-escape` + 5 `no-unused-vars` in `packages/*/tools/*.mjs`. **0 errors in any `packages/*/src`**; 225 `@typescript-eslint/no-explicit-any` warnings (avatar 42 files). `lint` is not part of `check`, not in the Stop hook, not in pre-commit beyond lint-staged on `packages/*/src/**/*.ts`. |
| `pnpm build` | RED (expected): `[ambreia:release-headers] No release revision: set AMBREIA_RELEASE…` — needs emulator's `scripts/revision-new.mjs`. prebuild (vfx sheets, bundle-assets) ran OK. |
| `pnpm audit` | 0 critical / 59 high / 16 moderate across 495 deps (mostly devDeps: sharp, sass→source-map-js…). |
| `pnpm outdated` | pixi.js 8.16→8.22; inversify 6.2.2 & reflect-metadata in vortex-engine (usage to verify); pako 2→3; @types/node 22→26. |
| CI | NONE: `.github/` contains only `copilot-instructions.md`. Pre-commit (husky): lint-staged, `gen-headers.mjs --check`, `sync-agent-docs.mjs`. |

## Package sizes (src .ts files / lines)
common 57/9,787 · net 32/3,349 · avatar 86/15,443 · ui 355/60,456 · iso 379/57,688 · kernel 32/4,421 · protocol 535/18,235 · game 403/73,589 · map-editor-core 57/1,933 · map-editor 80/7,504 · vortex-engine 6/1,914 · vortex-client 7/5,680 (+ tools) · vortex-glaze 35/9,339 · vortex-imager 20/6,043.

## Measured import graph (src → package, edge counts)
avatar→common 43 · net→common 9 · ui→common 44 · kernel→common 15 · iso→common 79, iso→avatar 24 · protocol→net 704, →iso 12, →common 2 · game→iso 531, →protocol 462, →ui 448, →common 128, →net 97, →kernel 60, →avatar 50 · vortex-engine→game 54, →common 13, →kernel 11, →avatar 5, →ui 4, →iso 3, →net 1 · vortex-client→ui 20, →game 7, →common 7, →kernel 5, →vortex-engine 5, →iso 1 · glaze→ui 98, →common 22 (tests → game 1, kernel 1) · imager→iso 30, →common 15, →avatar 12, →game 7, →kernel 5 · map-editor→core 99, →ui 98, →iso 7, →common 7.
No cycle at package level. No upward import engine→kernel/protocol/game. Anomalies to confirm: `ambreia-ui/sandbox/main.ts` imports `vortex-client` (1); imager depends on game+kernel+vortex-engine (spec wanted avatar+iso).

## Every package exports `"./*": "./src/*.ts"`
→ the whole source tree of every package is public API; no `sideEffects` field anywhere.

## Feature list (GAME_FEATURES, in boot order)
configuration, asset-packs, communication, communication-demo, localization, room-manager, room-renderer-factory, room-session, session-data, room-engine, avatar-renderer, window-manager, room-ui, avatar-info, loading-bar, character, hud, inventory, interaction, chat, combat, skills. (`features/login/` exists but is not a feature in the list.)
IGameFeature = kernel IFeature + `images?` + `roomWidgets?`. Spec §4 also promised `map`, `roomLogics`, `chatCommands` → absent.
`IEngineManagers` (`host.made`) has 20 nullable slots; every new feature that others read adds a slot + `emptyManagers()` line (the `new-game-feature` skill says so explicitly).
host.made reads per feature: skills 32, combat 20, inventory 17, hud 9, interaction 8, chat 7, character 7.
Cross-feature imports (file-level): hud→character 5, skills→hud 5, inventory→character 4, chat→hud 2, skills→character 2, combat→character 1, combat→hud 1, interaction→character 1, interaction→hud 1, skills→combat 1, skills→inventory 1, chat→character 1. No ESLint rule forbids feature→feature imports (spec §3 rule 3 says one should).
`await Promise.resolve()` ordering hacks: 6 feature afterAttach + VortexMain.ts:606 + App.ts:1032.
`Core.instance` 12 uses, `Vortex.instance` 46 uses in packages/*/src. `globalThis.__ambreia` dev hooks in 7 feature files + VortexMain (production code).

## Protocol
Headers.generated.ts: 71 Incoming + 32 Outgoing = 103 headers (CLAUDE.md says "60 messages"); REVISION = 'AMBREIA-DEV' in the generated file. HabboMessages.ts 1,094 lines (inherited style). NewStyleHeaders.ts lists 27 incoming + ≥13 outgoing RPG headers served by 6 MessageMaps (character, inventory, interaction, chat, combat, skills). Every feature installs its map in afterAttach after `await Promise.resolve()` and `log.warn`s if no connection.

## Config (kernel)
loadConfig: merge defaults→config.json→url; per-section Zod `.strict()` + `enabled` default true; unknown section = warning; all issues → one ConfigError; deepFreeze. AppSection strict (server.host/ports/rsaModulus, sso, startLink, language). `DEV_SERVER_HOST = 'ws://ourvjasausgxlxmrunm7ys1w.72.60.91.223.sslip.io'` hard-coded in kernel/config/browserSources.ts, plaintext ws:// to a public IP for localhost pages (SSO ticket travels in clear) — spec §7.4 wants wss in production; dev exception, but a public endpoint.
Legacy: 132 `getProperty/getBoolean/...` reads remain in game/engine/client.

## Lint/TS quality counts (src)
any: avatar 110, ui 83, game 15, iso 10, kernel 4, net 2, common 1. Casts (`as X`): game ~765, ui ~567, iso ~195, glaze ~148. Empty catch: 1 (Vortex.ts:688, AS3-traced).

## Spec §3/§4/§5/§6/§8/§9 vs reality (coordinator rows; agents refine)
| Decision | Spec | Code | Status |
|---|---|---|---|
| Package split common/net/avatar/iso/ui/kernel/protocol/game | §3 | 8 packages exist + map-editor(-core), engine shell `vortex-engine` not renamed | IMPLEMENTED (naming pass pending) |
| Engines import no kernel/protocol/game | §3 r1 | measured graph: holds; ESLint walls + boundaries.test (23 cases) | IMPLEMENTED + ENFORCED |
| Engines use no DI, typed options | §3 r1 | iso RoomManager takes `property/flag` string callbacks (legacy key reads through engine); avatar typed options OK; ui WindowManager plain | PARTIAL |
| iso may depend on avatar, never reverse | §3 r2 | holds | IMPLEMENTED |
| Features = folders; feature imports feature only via interface/event; ESLint rule inside game | §3 r3, §4 | 25 cross-feature import edges; no ESLint rule | DIVERGED / NOT ENFORCED |
| Boundaries via package.json (undeclared import doesn't resolve) | §3 r4 | pnpm workspace deps declared; but `exports: ./*` exposes all; relative `../ambreia-x/src` blocked by ESLint only in src | PARTIAL |
| Sandbox per engine | §3 r5 | iso + ui sandboxes exist; avatar has Node tool (render-avatar); net/kernel none (tests) | PARTIAL |
| defineFeature with map/roomLogics/roomWidgets/chatCommands/images/config | §4 | images + roomWidgets only; messages via per-feature `install` in afterAttach; roomLogics via iso register* modules (game side?) ; chatCommands absent | PARTIAL |
| Add feature = folder + 1 line | §4 | folder + GAME_FEATURES line + host.made slot (+ emptyManagers) + layouts registration? (agent) | DIVERGED (2–4 touch points) |
| Missing dependency fails boot loudly | §4 | bootFeatures FeatureDependencyError for IID deps; invisible for host.made deps (features return null) | PARTIAL |
| Features talk through typed events | §4 | eventemitter3 typed events on sessions + direct host.made reads + cross imports | PARTIAL |
| Config typed, one parse, frozen, enabled per section, unknown-section warning, invalid = stop with field list | §5 | loadConfig does all; error screen? (agent) | IMPLEMENTED (UX to confirm) |
| Legacy section shrinks per feature migration | §5 | 132 reads remain; LEGACY_DEFAULTS still loaded | PARTIAL |
| New messages in new style per feature folder | §6 | 6 MessageMaps in features; parsers/serializers live in protocol/src/{incoming,outgoing,parser,serializer}/rpg, not in the feature folder as §6 drew | PARTIAL (location diverged) |
| Headers generated from emulator, pre-commit regenerates | §6 | gen-headers --check in husky; emulator absent here → behaviour to confirm | IMPLEMENTED (CI absent) |
| Handlers/views never see MessageDataWrapper | §6 | agent B | ? |
| Security: wss mandatory in prod | §7 | dev default `ws://` public host; prod derives from page protocol | PARTIAL |
| Dev tools not in prod build | §7.6 | `__ambreia` hooks, WindowDebuggerOverlay (2.7k lines) in client src; gated? (agent) | ? |
| Packet inspector (J1), DevTools panel (J5), avatar studio (J2), World editor (J4) | §8 | packet tap exists (net), kernelReport exposed via `__ambreia.kernel`? (VortexMain:396), map editor exists (Tauri), no avatar studio UI | PARTIAL |
| Milestone proofs: remove demo feature keeps build green | §9/§11 | J6 bilan: scripted proof (loading-bar) | IMPLEMENTED for a leaf feature |
