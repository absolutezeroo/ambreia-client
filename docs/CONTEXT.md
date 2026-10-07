# Vortex Project Context

> Fork RPG : les features retirées volontairement sont listées dans la spec du fork (`vortex-rpg-emulator/docs/superpowers/specs/2026-10-05-habbo-rpg-design.md`, section 7) ; voir aussi `CLAUDE.md` → Never.

This document provides the architecture and project context. Read it before implementation work, then use `docs/IMPLEMENTATION_STATUS.md` for the current project state.

## Overview

**Vortex** is an in-progress full TypeScript/PixiJS v8 port of the Habbo Hotel Flash client, organized as a pnpm monorepo. The target is a lighter client than Nitro while staying faithful to the original AS3 architecture.

The port must reuse the lifecycle system and display/window architecture from the original AS3 source: class hierarchy, dispose patterns, flush/parse cycles, object management, message wiring, and UI window behavior should match AS3 unless a JS-specific performance divergence is explicitly documented.

### Tech stack

| Technology      | Role                                                        |
|-----------------|-------------------------------------------------------------|
| TypeScript      | Primary language                                            |
| PixiJS v8       | 2D rendering for rooms, avatars, furniture, and UI surfaces |
| EventEmitter3   | Component/event communication                               |
| pnpm workspaces | Monorepo management                                         |
| Vite            | Client bundler/dev server                                   |

### Monorepo

```
vortex/
├── packages/
│   ├── vortex-engine/     Engine, protocol, room engine, Habbo logic, ported Flash window/UI framework
│   ├── vortex-client/     Vite shell, login/bootstrap, asset bundling, shipped layout/skin assets
│   └── vortex-glaze/      Live Habbo window-layout editor (Glaze clone), built on the ported widgets
├── sources/
│   ├── WIN63-202607011411-782849652/  PRIMARY AS3 source (2026 build, 25% obfuscated)
│   │                                  3,345 .as under src/com/sulake/ + 1,839 under src/unknowns/
│   ├── win63_version/                 Secondary AS3 source, 4,783 .as — also obfuscated, different scheme
│   ├── PRODUCTION-201601012205-226667486/  Tertiary, 4,029 .as — the only unobfuscated tree (2016 build)
│   ├── WIN63-202601121721-391685409/  Earlier 2026 dump (8,323 .as + raw binaryData/images/shapes);
│   │                                  kept for history (message ids now come from the emulator)
│   ├── HABBO-ARCTURUS-DAYBREAK/       Unrelated Java reference dump — NOT this project's server
│   ├── NITRO/                         Unrelated TS client, reference only
│   └── gamedata/                      external_texts / variables / effect_map
├── docs/
│   ├── CONTEXT.md                     This file
│   ├── IMPLEMENTATION_STATUS.md       Current module/file status — the live number
│   ├── MESSAGES_PORT_BACKLOG.md       Per-category message gaps
│   ├── CLIENT-SERVER-ARCHITECTURE.md  Wire protocol + known server-side bugs
│   ├── PATTERNS.md, STYLEGUIDE.md
│   ├── architectures/                 Per-module AS3 deep-dives, created on demand
│   └── audits/
├── .claude/rules/                     Path-scoped rules for Claude Code — start with CLAUDE.md
├── AGENTS.md                          Generated from .claude/rules/ for non-Claude tools
└── package.json
```

## Current Status Rule

Do not infer completion from this context file. The current state lives in:

- `docs/IMPLEMENTATION_STATUS.md` for module/file-count status.
- `docs/MESSAGES_PORT_BACKLOG.md` for communication message gaps.
- `docs/audits/` for deeper audit notes.

Raw file counts are useful for orientation, but they do not prove AS3 parity. A module is complete only after its AS3 public API, constructor behavior, listeners, lifecycle, parser/composer behavior, and dispose contract have been checked.

## Engine Architecture

```
packages/vortex-engine/src/
├── core/          Low-level runtime, assets, communication, localization, window framework
├── habbo/         Habbo managers, session, navigator, inventory, toolbar, window/UI, messages
├── room/          Low-level room manager/renderer/object support
├── iid/           Dependency injection symbols
├── Vortex.ts      Application-level engine shell
└── VortexMain.ts  Engine manager registration/orchestration
```

### Layer boundaries

- `vortex-engine` must not import from `vortex-client`.
- The client may import from the engine.
- UI/display state should flow from engine events into client/window classes, not from engine code reaching into client-specific UI.

### Dependency injection

The project uses a custom Component/IID system:

```typescript
export const IID_IRoomEngine = Symbol('IRoomEngine');

export class RoomEngine extends Component implements IRoomEngine
{
    // Dependencies are resolved through ComponentContext.
}
```

Critical rule: never override `get events()` in a `Component` subclass. The DI/event system depends on that getter.

### Communication protocol

```
SocketConnection
    -> CoreCommunicationManager
    -> HabboCommunicationManager
    -> HabboMessages registry
    -> MessageEvent / IMessageParser / MessageComposer
```

- Incoming messages: server ID maps to an event class and parser.
- Outgoing messages: composer `getMessageArray()` serializes payloads.
- Protocol coverage is partial; check `docs/MESSAGES_PORT_BACKLOG.md` before adding message work.

### Path aliases

| Alias     | Engine resolves to | Client resolves to            |
|-----------|--------------------|-------------------------------|
| `@core/`  | `src/core/`        | `../vortex-engine/src/core/`  |
| `@habbo/` | `src/habbo/`       | `../vortex-engine/src/habbo/` |
| `@room/`  | `src/room/`        | `../vortex-engine/src/room/`  |
| `@iid/`   | `src/iid/`         | `../vortex-engine/src/iid/`   |
| `@/`      | N/A                | `src/`                        |

## Client Architecture

```
packages/vortex-client/src/
├── App.ts                         Browser/Pixi app shell
├── index.ts                       Client entry
├── AssetBundle.ts                 Bundled asset access
├── VortexLoadingScreen.ts         Loading screen implementation
├── login/                         Login flow and SSO views
├── window/WindowXmlAssetParser.ts Window layout parser bridge
├── changelog/                     In-client changelog window
├── debugger/                      WindowDebuggerOverlay
├── vortex-layouts/                Vortex-authored layout XML (4) — NOT ported, restyles only
├── vortex-skins/                  Vortex-authored skin XML — same rule
└── assets/                        gitignored, rebuilt by tools/build-window-assets.mjs
    ├── window-layouts/            783 Flash XML layouts, verbatim from the dump
    ├── window-skins/              133 skin definitions
    ├── configurations/
    ├── images/
    └── webfonts/
```

`src/assets/` is gitignored and regenerated from the dump, which is why hand-authored files live in
`src/vortex-layouts/` and `src/vortex-skins/` instead — anything placed under `assets/` is wiped on
the next asset build. Files there carry no `AS3:` traces and must say so at the top: they are
restyles, not ports.

Most ported Flash window/controller code currently lives in `packages/vortex-engine/src/core/window`, `packages/vortex-engine/src/habbo/window`, and `packages/vortex-engine/src/habbo/ui`. The client package is mainly the browser shell plus converted assets.

## AS3 Sources

| Directory                                    | Count        | Package roots                             | Usage                                                                   |
|----------------------------------------------|--------------|-------------------------------------------|-------------------------------------------------------------------------|
| `sources/WIN63-202607011411-782849652/`      | 3,345 `.as`  | `src/com/sulake/{core,habbo,room,iid}/`   | **Primary**; read first. Plus 1,839 `.as` under `src/unknowns/`.        |
| `sources/win63_version/`                     | 4,783 `.as`  | `core/`, `habbo/`, `room/`, `iid/`        | Secondary. Also obfuscated — see the warning below.                     |
| `sources/PRODUCTION-201601012205-226667486/` | 4,029 `.as`  | `src/com/sulake/...` plus embedded assets | Tertiary; the **only** unobfuscated tree, but a 2016 build.             |
| `sources/WIN63-202601121721-391685409/`      | 8,323 `.as`  | raw dump (`binaryData/`, `images/`, …)    | Earlier 2026 revision; history only.      |

> **Three corrections to earlier revisions of this file.** They were repeated for months and each one
> cost real work; CLAUDE.md is the authority and says the same:
>
> 1. **`win63_version` does not recover names.** It is obfuscated too — 868 `class_N.as` files, a
>    *different* scheme — so the same class carries a different meaningless name in each tree.
>    RoomEngine is `_SafeCls_90.as` in the primary, `class_34.as` there, and `RoomEngine.as` only in
>    PRODUCTION. Identify an obfuscated class by the interface it implements, not by a name lookup.
> 2. **The two trees do not line up 1:1 file-for-file.** In `habbo/room`, 9 filenames of 20 match.
> 3. **`src/unknowns/` (`_SafePkg_N/`) is part of the client, not a bundled stranger** — 556 files
>    under `src/com/sulake/` import from it (parser DTOs, composers). Likewise the flat
>    `_SafeCls_N.as` files under `src/`: they are the embedded-asset classes and carry the
>    obfuscated-ref → real-embed name mapping in their `@identifier` footer comment, which
>    `tools/lib/cryptedManifest.mjs` reads. Skipping either means failing to find definitions that
>    exist.

Window layouts and skins ship **as XML, verbatim from the dump** — there is no JSON compile step and
no `win63_2023_version` tree any more. `packages/vortex-client/tools/build-window-assets.mjs` builds
them from `WIN63-202607011411-782849652/src/layouts/` + `src/_assets/` + `src/binaryData/*Com.as`. An
asset's real name is its `*Com.as` field name; join declarations to files on the embed's **whole**
linkage name, hash included, since asset libraries are per-component and the same short name can mean
two different embeds. See CLAUDE.md → Assets.

Path mapping examples:

```
sources/WIN63-202607011411-782849652/src/com/sulake/habbo/<module>/<Class>.as
sources/win63_version/habbo/<module>/<Class>.as
sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/<module>/<Class>.as

sources/WIN63-202607011411-782849652/src/com/sulake/room/<Class>.as
sources/win63_version/room/<Class>.as
sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/<Class>.as
```

## Porting Protocol

For implementation tasks:

1. Read `docs/STYLEGUIDE.md` and `docs/PATTERNS.md` for local conventions.
2. Read the relevant AS3 file in full before writing TypeScript.
3. Preserve AS3 public API, constructor contract, inheritance intent, listener lifecycle, and dispose behavior.
4. Add the required `// AS3: ...` trace comments for ported declarations.
5. Update `docs/IMPLEMENTATION_STATUS.md` and any relevant backlog/audit doc when the implementation changes project status.
6. Validate code changes with the appropriate build/test command.

## Key Entry Points

| File                                                                          | Role                        |
|-------------------------------------------------------------------------------|-----------------------------|
| `packages/vortex-client/index.html`                                           | Browser entry HTML          |
| `packages/vortex-client/src/index.ts`                                         | Client bootstrap            |
| `packages/vortex-client/src/App.ts`                                           | Browser/Pixi app shell      |
| `packages/vortex-engine/src/Vortex.ts`                                        | Engine application shell    |
| `packages/vortex-engine/src/VortexMain.ts`                                    | Engine manager registration |
| `packages/vortex-engine/src/habbo/communication/HabboMessages.ts`             | Message registry            |
| `packages/vortex-engine/src/habbo/communication/HabboCommunicationManager.ts` | Habbo protocol layer        |
| `packages/vortex-engine/src/habbo/room/RoomEngine.ts`                         | Habbo room engine facade    |
| `packages/vortex-engine/src/room/RoomManager.ts`                              | Low-level room manager      |
| `packages/vortex-engine/src/iid/index.ts`                                     | DI symbol exports           |
