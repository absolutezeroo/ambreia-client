---
name: emulator-sync
description: Use when checking that the client still matches the server's wire contract - after pulling or switching branches in ../vortex-rpg-emulator, after `pnpm gen:headers`, when incoming-registered or outgoing-registered tests fail, before committing a change under packages/ambreia-protocol, or when an RPG message reads garbage, reads past the end, silently drops a field, or shows a value the client does not know.
---

# Emulator sync

The emulator is the authority on every message: `Vortex.Revisions/Revision20260701/` holds the wire
(`Headers.cs`, `Serializers/`, `Parsers/`, `Maps/`), and `Vortex.Protocol/Messages/{Incoming,Outgoing}/Rpg/<Domain>/`
holds what the fields mean (doc comments, defaults, string constants such as outcomes and ranks).
Four things drift on their own when the server moves:

| Drift | Check | Caught by |
|---|---|---|
| Ids (`Headers.cs`) | `gen-headers.mjs --check`; on failure `pnpm gen:headers` (never edit `*.generated.ts`) | pre-commit hook |
| A header neither style serves | `incoming-registered` / `outgoing-registered` tests (`--check` passing says nothing about this) | the gate |
| **Field order or type** of a new-style message | `node .claude/scripts/wire-diff.mjs` | nothing else |
| **A new value** of a string the client switches on (`"immune"` outcome, `"boss"` rank) | reading the commits, step 2 | nothing |

## 1. Run

```bash
node packages/vortex-engine/tools/gen-headers.mjs --check
npx tsx --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-protocol/test/incoming-registered.test.ts packages/ambreia-protocol/test/outgoing-registered.test.ts
node .claude/scripts/wire-diff.mjs      # exit 1 on DIFF or MISSING
```

`wire-diff` pairs each client parser/serializer with the emulator file its doc comment names
(`in the order of the server's X`):

| Row | Means | Do |
|---|---|---|
| `OK` | same types (incoming) or same `name:type` list (outgoing) | nothing |
| `DIFF` | the sequences differ | read both files (a write inside an `if`, or a helper written differently, shows as a DIFF too) |
| `MISSING` | the comment names a file the emulator no longer has | find its new name in the emulator's `git log` |
| `UNPAIRED` | an emulator RPG serializer/parser no client file names; the row prints the server's sequence | a message the client does not handle yet: `rpg-message` |
| `?name` in a list | a helper the script could not inline | read that helper by hand |

## 2. Read what the pull brought

```bash
git -C ../vortex-rpg-emulator log --oneline ORIG_HEAD..HEAD -- Vortex.Protocol Vortex.Revisions/Revision20260701
git -C ../vortex-rpg-emulator show --stat <commit>      # for each one listed
```

(No `ORIG_HEAD`, or the pull is not the question: start from the commit that last touched a DIFF or
UNPAIRED file, `git log --oneline -3 -- <file>`.) In each commit, look under
`Vortex.Protocol/Messages/Outgoing/Rpg/` for a new constant or allowed value, then grep the client for
where it switches on that field (`grep -rn "'dodge'" packages/ambreia-game/src`): a value it does not
know falls into the default branch, and the tools above stay green.

A field added **at the end** is ignored by today's client, but its parser and message class still
have to take it: the next field added after it would be read wrong. A field inserted or reordered
breaks everything after it.

## 3. Report

For each `DIFF`, `MISSING`, `UNPAIRED` and new value: the message or constant, the client file, the
emulator file with the commit that changed it, and what the client must change. Say whether the gate
is red. Fix only what the user asked for; a wire fix goes through `rpg-message`.
