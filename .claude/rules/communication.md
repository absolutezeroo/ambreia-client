---
paths:
  - "**/communication/**"
---

# Wire protocol / communication rules

You are editing wire-protocol code (`core/communication/`, `habbo/communication/`).

The server is **`../vortex-rpg-emulator`** (C#, Orleans). Its wire contract is
`Vortex.Revisions/Revision20260701/`: `Headers.cs` (ids), `Parsers/` (what it reads from us),
`Serializers/` (what it sends us), `Maps/` (which header goes with which). That repo is the
authority on every message; `sources/HABBO-ARCTURUS-DAYBREAK/` is not this project's server.

1. Read `docs/CLIENT-SERVER-ARCHITECTURE.md` for the flow you are touching (handshake/encryption, or the request-response of that message) before changing anything here.
2. Code that looks wrong (odd byte order, a seemingly redundant field) may compensate for a documented server behaviour: check that document's "known server bugs and protocol mismatches" list, then the emulator's serializer, before "fixing" it.
3. `Parser.parse()` read order and `Composer.getMessageArray()` field order MUST match the emulator's serializer/parser for that message (`vortex-rpg-emulator/Vortex.Revisions/Revision20260701/{Serializers,Parsers}/`); reordering silently breaks the wire format.
4. See `docs/PATTERNS.md` → MessageComposer / MessageParser / MessageEvent templates before adding a new message type. Quick shape reminder:
   - **Composer**: `extends MessageComposer<TupleType>` with `_data` and `getMessageArray()`
   - **Parser**: `implements IMessageParser` with `flush()` + `parse(wrapper)`
   - **Event**: `extends MessageEvent implements IMessageEvent` with `callback` parameter in constructor
5. **Message ids come from `Headers.generated.ts`**, written by `pnpm gen:headers` from the emulator's `Headers.cs` and checked by the pre-commit hook. New registrations use `Incoming.X` / `Outgoing.X`; never type an id by hand, never take one from the AS3 registry.
