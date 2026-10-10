---
name: new-game-feature
description: Use when adding a new game system to the Ambreia client (a window opened by a key, a HUD part, a session that talks to the server, a manager other features read), or when moving code into packages/ambreia-game/src/features/ - anything that would add a line to GAME_FEATURES or a slot to host.made.
---

# New game feature

A feature is one folder `packages/ambreia-game/src/features/<id>/` and one line in `GAME_FEATURES`
(`features/index.ts`). Models to copy: `chat/` (small, talks to the server), `skills/` (key, window,
zone events, system lines), `asset-packs/` (config section), `inventory/` (an interface other
features read).

## Files

| File | What |
|---|---|
| `<id>/feature.ts` | `export const <Name>Feature: IGameFeature = {id: '<id>', config?, create, afterAttach?}` |
| `<id>/<Name>.ts` (`Rpg<Name>Session.ts` when it talks to the server) | the state; `readonly events = new EventEmitter<I…Events>()` |
| `<id>/I<Name>.ts` | when another feature reads it: `readonly` members + `events` (`inventory/IRpgInventorySession.ts`); the `host.made` slot is typed with it |
| `features/index.ts` | import, a slot in `IEngineManagers` (doc comment names the folder), `<slot>: null` in `emptyManagers()`, the line in `GAME_FEATURES` after every feature whose `host.made.*` `create` reads **synchronously** (reads inside callbacks do not constrain the order) |
| `test/<id>.test.ts` | node:test over the state class (`test/chat.test.ts`); calling `create` with a fake host and config: `test/asset-packs-feature.test.ts` |
| `vortex-client/src/locales/{fr,en}/<id>.json` | both languages, loaded by glob; check the file does not exist already. Keys `vortex.<word>.*` without a hyphen (none exists; `${…}` with one is untested) |

`dispose()` (last method, early return on `_disposed`) is called only on what `create` returns; a
feature returning `null` writes it on classes that hold listeners anyway, for tests and later use.

## In `create({config, host})`

- Other features: `host.made.<slot>`, may be null (optional chaining, a `log.warn` when it matters).
- Config: `config: z.object({warnAfter: z.number().int().positive().default(30)})`, read as
  `config as z.infer<typeof Schema>`. The section is the `id` in `config.json`, strict, `enabled` added
  by the kernel; an absent section gives the defaults, so **no `config.json` edit**.
- The server: install the session's `MessageMap` in `afterAttach`, after `await Promise.resolve()`
  (the connection is built a microtask after its attach); copy `chat/feature.ts`. Messages: `rpg-message`.
- The zone: `host.made.roomSession?.sessionEvents`, `RSE_STARTED` (`event.session`) / `RSE_ENDED`
  (forget, hide windows). A zone change ends the old session before the new one starts.
- A key: `globalThis.addEventListener?.('keydown', …)`; ignore outside a zone, `event.repeat`,
  Ctrl/Alt/Meta and a target `INPUT`/`TEXTAREA` (copy `typing()` of `skills/feature.ts`). Letters by
  `event.key.toLowerCase()`, digits by `event.code` (`Digit1`, AZERTY).
- Texts: `new WindowBits(host.made.localization).text('vortex.x.y', 'param', value)` (`%param%` in
  the JSON), `.textOr(key, fallback)`, `.contentName('<id>.name', id)` for content names.
- A system line in the chat: `host.made.hud?.addChatLine({time: chatClock(Date.now() / 1000), channel: 'system', author: '', message})`.
- A window: the layout in `vortex-client/src/vortex-layouts/` (loaded by folder; check it does not
  exist; design it with `design-habbo-window`, `${key}` for texts). In code:
  `buildFrame(windows, 'vortex_x_xml', (event, window) => …)` from `inventory/InventoryView`, null when
  it fails; set `visible` yourself and `activate()`; the frame skin supplies `header_button_close`
  (`event.type === 'WME_CLICK'`). Model: `skills/SkillsWindow.ts`.
- Library images read by name: `images: [...]`. Room widgets: `roomWidgets`.
- Dev hook: `root.__ambreia = {...root.__ambreia, <id>: {state, open}}`.

Never import `vortex-*`, never reach into `core/` from outside it; logger `habbo.features.<id>`.

## Verify

```bash
node node_modules/eslint/bin/eslint.js packages/ambreia-game/src/features/<id> packages/ambreia-game/src/features/index.ts
npx tsx --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-game/test/<id>.test.ts
pnpm check
```

Then `run-vortex-client`: enter a zone, trigger it (key or dev hook), screenshot; a config option can
be tried by setting it in `public/config.json` for the check only, then reverted.
