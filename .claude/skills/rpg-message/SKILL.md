---
name: rpg-message
description: Use when the client must receive or send a message of the RPG server (vortex-rpg-emulator) - a new header in Headers.generated.ts, an UNPAIRED row from wire-diff, an incoming-registered or outgoing-registered test listing a header served by neither style, a field the server added to an existing message, or a feature that needs to talk to the server.
---

# RPG message (new style)

A message the client exchanges with the emulator is two or three small files in `@ambreia/protocol`,
one line in a feature's `MessageMap`, and one line in `NewStyleHeaders`. Not the
MessageComposer/MessageParser/MessageEvent templates of `docs/PATTERNS.md`: those are the inherited
style, kept for the old messages only.

## 1. Start from the server

```bash
node .claude/scripts/wire-diff.mjs     # UNPAIRED rows = messages not handled yet, with the server's field sequence
git -C ../vortex-rpg-emulator show --stat <commit that added it>   # do every header of that commit in one pass:
                                                                   # the gate checks them all at once
```

In `../vortex-rpg-emulator/`:

| Direction | The order (`Vortex.Revisions/Revision20260701/`) | The meaning (`Vortex.Protocol/Messages/`) | Client header |
|---|---|---|---|
| server → client | `Serializers/Rpg/<Domain>/<X>MessageComposerSerializer.cs` | `Outgoing/Rpg/<Domain>/<X>MessageComposer.cs` | `Incoming.<X>MessageComposer` |
| client → server | `Parsers/Rpg/<Domain>/<X>MessageParser.cs` | `Incoming/Rpg/<Domain>/<X>Message.cs` | `Outgoing.<X>MessageEvent` |

**`Maps/Rpg<Domain>Map.cs` decides the client session**, not the spec's milestone: telegraphs come
from the monsters spec but are in `RpgSkillsMap`, so they go to the skills session. The server's
`Vortex.Revisions.Tests/Rpg/*WireTests.cs` has values to reuse. Header missing in
`Headers.generated.ts`? `pnpm gen:headers` (never type an id).

## 2. Files (`packages/ambreia-protocol/src/`, `<d>` = the domain in lower case)

| Incoming `<X>` | Outgoing `<X>` |
|---|---|
| `incoming/rpg/<d>/<X>Message.ts`: class, `readonly` constructor fields, a doc comment per field | `outgoing/rpg/<d>/<X>Message.ts` (named `<X>SendMessage` when `<X>Message` is already the incoming one: `RpgEmoteSendMessage`) |
| `parser/rpg/<d>/<X>MessageParser.ts` implements `IIncomingParser` | `serializer/rpg/<d>/<X>MessageSerializer.ts` implements `IOutgoingSerializer`, returns `[message.a, message.b]` |

The parser/serializer doc comment is exactly
`/** Reads <X>Message in the order of the server's <ServerFile>. */` (or `Writes … <ServerParser>`):
`wire-diff` pairs files by that sentence and reads calls in **source order**, so write the reads in
wire order (a nested list: the item's fields into locals, then the inner loop). Copy a sibling:
`parser/rpg/emote/RpgEmoteMessageParser.ts`, a list in `parser/rpg/combat/RpgCombatEventsMessageParser.ts`,
a shared block in `parser/rpg/characters/RpgStatBlockReader.ts`. `WriteInteger`→`readInt`,
`WriteString`→`readString`, `WriteBoolean`→`readBoolean`; an outgoing `number` goes out as an int.

Then:
- `NewStyleHeaders.ts`: the header in `incoming` or `outgoing`, under its domain's comment.
- The session's map (`features/<feature>/Rpg<Domain>Session.ts`, function `rpg<Domain>Map`):
  `.incoming(Incoming.X, new XParser(), {handle: m => announce('event', m)})` plus the event in its
  `I…Events` interface, or `.outgoing(XMessage, Outgoing.X, new XSerializer())` plus a method that
  `this._map.send(...)`. **No test checks this line**: grep that `Incoming.X` appears in a map.
  A domain with no session yet: `new-game-feature`.
- What the client does with it (the spec's client section) is a `session.events.on('event', …)` in
  that feature's `feature.ts`. Announced with no listener yet is fine; say so in the report.

## 3. Test and check

`packages/ambreia-protocol/test/rpg-<d>.test.ts` (append when it exists): the strict `wire()` helper of
`rpg-emote.test.ts` throws on a wrong type or a read past the end, but **not on values left unread**:
feed exactly the server test's values and assert every field, so a forgotten trailing field fails.

```bash
npx tsx --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-protocol/test/rpg-<d>.test.ts
node .claude/scripts/wire-diff.mjs     # your row OK
pnpm check                             # green only once every header of the server commit is served
```

## Common mistakes

| Mistake | Result |
|---|---|
| Field order from the TS message or the spec, not the `.cs` serializer | reads garbage after the first swapped field |
| Header in `NewStyleHeaders` but no `.incoming()` in a map | tests green, message dropped at run time |
| Header kept in `HabboMessages` too | `map.install()` throws "already served" |
| Doc comment reworded | `wire-diff` lists the server file as UNPAIRED |
| Session picked from the spec instead of the server's Map | the message lands in the wrong feature |
| Server added a trailing field, client not updated | works today, the next field added after it is read wrong |
