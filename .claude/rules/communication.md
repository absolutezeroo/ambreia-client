---
paths:
  - "**/communication/**"
---

# Wire protocol / communication rules

You are editing wire-protocol code (`core/communication/`, `habbo/communication/`).

1. Read `docs/CLIENT-SERVER-ARCHITECTURE.md` in full for the system you are touching (handshake/encryption, or the specific composer/parser's request-response flow) before changing anything here.
2. Check that document's "known real-server bugs and protocol mismatches" list first. AS3 code that looks wrong (odd byte order, a seemingly redundant field, a workaround-looking branch) may be a deliberate compensation for a real Arcturus-Community server bug — verify before "fixing" it.
3. `Parser.parse()` read order and `Composer.getMessageArray()` field order MUST match the emulator's serializer/parser for that message (`vortex-rpg-emulator/Vortex.Revisions/Revision20260701/{Serializers,Parsers}/`); reordering silently breaks the wire format.
4. See `docs/PATTERNS.md` → MessageComposer / MessageParser / MessageEvent templates before adding a new message type. Quick shape reminder:
   - **Composer**: `extends MessageComposer<TupleType>` with `_data` and `getMessageArray()`
   - **Parser**: `implements IMessageParser` with `flush()` + `parse(wrapper)`
   - **Event**: `extends MessageEvent implements IMessageEvent` with `callback` parameter in constructor
5. **Message ids come from `Headers.generated.ts`**, written by `pnpm gen:headers` from the emulator's `Headers.cs` and checked by the pre-commit hook. New registrations use `Incoming.X` / `Outgoing.X`; never type an id by hand, never take one from the AS3 registry.
