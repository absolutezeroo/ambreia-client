# AS3 traceability

**Since 2026-10-07 the trace is provenance, not a fidelity contract**
(`docs/superpowers/specs/2026-10-07-client-architecture-design.md` §10). It records where inherited
code came from. Three consequences:

- **Keep the `AS3:` line when you move, rename or restructure a member.** Losing it loses the only
  pointer to the code that explains the behaviour.
- **A member that now behaves differently from its origin keeps its `AS3:` line.** A
  `// DEVIATION:` note is recommended when the difference would surprise someone reading the AS3,
  and no longer required.
- **New code needs no marker.** RPG features and new packages carry neither `AS3:` nor `TS-only:`;
  `TS-only:` is only for a member added to a class that was ported from the AS3.

The rest of this file describes how the traces were written during the port; it still applies to
reading and keeping them.

Every TypeScript class, method, accessor, property, interface member, handler, parser, composer, or event ported from AS3 MUST include an `AS3:` source trace comment immediately above the declaration.

Required format:

```ts
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/<path>/<Class>.as::<memberName>()
```

For AS3 accessors and properties:

```ts
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/<path>/<Class>.as::get propertyName()
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/<path>/<Class>.as::propertyName
```

Always trace to the primary (`WIN63-202607011411-782849652`) path even if the member's identifier had to be recovered by cross-referencing `sources/win63_version/<path>/<Class>.as` — the trace comment must still use a real, human-readable member name, never an obfuscated `_SafeStr_N`/`_SafeCls_N` placeholder.

If the primary source does not contain the member, fall back to `sources/win63_version/...`, then `sources/PRODUCTION-201601012205-226667486/...`, and point the trace at whichever tree actually has it.

Members with **no AS3 counterpart at all** — a port-specific event bus, a convenience accessor kept for ported callers — take `// TS-only:` instead, with a short reason:

```ts
// TS-only: no AS3 counterpart; kept for the ported consumers of `IHabboFriendList`.
getFriendByName(name: string): IFriend | null
```

This rule covers members *ported from* AS3, and `scripts/check-as3-trace.mjs` cannot tell those apart from ones that were never in the source, so it asked for a trace that could not honestly be written. The marker makes the exemption explicit and greppable rather than silent. It is not a way to quiet the check: if the member exists in any tree, it needs the real trace. Confirm it does not before reaching for `TS-only` — several friend-list methods read like AS3 (`acceptFriend`, `removeFriend`) where the source has `acceptFriendRequest`/`declineAllFriendRequests` and no such member.

## Deliberate deviations take `// DEVIATION:`, and keep their `AS3:` line

A member that the port implements **differently on purpose** — a modernisation, not a gap — takes a
`// DEVIATION:` line *in addition to* the `AS3:` trace of the member it deviates from:

```ts
// DEVIATION: AS3 polls this per frame through IUpdateReceiver; the port pushes instead, so the
//   widget only recomputes when the friend list actually changes.
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/HabboFriendBar.as::update()
```

The `AS3:` line is mandatory and `scripts/check-as3-trace.mjs` enforces it — a `DEVIATION:` marker
on its own is reported exactly like a missing trace. That pairing is the entire point:
`audit-as3-traces.mjs` and `as3-member-coverage.mjs` both work off `AS3:` citations and neither
knows deviations exist, so keeping the citation is what stops "deliberately replaced" from reading
as "never ported" in the coverage numbers once a modernisation pass starts.

Pick the marker by what the AS3 side says, not by how new the code feels:

| Situation                                             | Marker                       |
|-------------------------------------------------------|------------------------------|
| Ported faithfully                                     | `AS3:`                       |
| Ported partially, rest still owed                     | `TODO(AS3)`                  |
| No AS3 counterpart in any tree                        | `TS-only:`                   |
| AS3 counterpart exists, port does something else      | `DEVIATION:` **+** `AS3:`    |

`DEVIATION:` is not a quieter `TODO(AS3)`. A gap you intend to close is a TODO; a deviation is a
decision you have already made, and the comment must say what the AS3 did and why the port does
not. If you cannot write that sentence, it is a TODO.

### A deviation must cite a check, not an impression

The failure mode is writing `DEVIATION:` because implementing the member looked awkward, and
then never revisiting it — the marker reads as settled and nobody asks again. A 2026-09-03 audit
of all 58 deviations in the port found **six that were nothing of the sort**, each closed in
minutes once someone actually looked:

- `Component.requiredDependencyIids` — "would need re-architecting". The names were already in
  `_pendingDependencies`; the getter is four lines.
- `Component.toXMLString()` / `ComponentContext.toXMLString()` — "reads internals this port does
  not have". Both read `_interfaces`, which holds exactly the iid/refs pairs AS3 dumps.
- `AvatarStructure.renderManager` — "would require changing the constructor signature". It is a
  constructor parameter and a getter; the one caller passes `this`.
- `RoomEngine`'s thumbnail ids — "the port counts up instead and never runs out, so the give-up
  branch has no counterpart". `NumberBank` is fifty readable lines, and its absence meant ids
  were never recycled and the exhaustion guard could never fire.
- `IRoomEngineServices.getActiveRoomActiveCanvas()` — "the port has no caller for it". Three
  call sites were spelling the same lookup out inline, each with its own apologetic comment.

So: before writing `DEVIATION:`, open the AS3 member and count its lines. If the answer is "this
is fifty lines of readable code and the port has the pieces", it is not a deviation, it is
unfinished work. The comment must name the specific thing that makes the port's shape different —
a Flash type with no counterpart, a field AS3 never increments, an architecture the port
deliberately replaced — and that claim must be one a reader can check. "There is no caller" is
not such a claim; callers arrive. "`_SafeCls_1711` has no entry in the registry, which maps 581
composers" is.

An inherited member left half-done keeps a compatible TypeScript signature and a `TODO(AS3)` comment with source path, class/member name, and exact remaining behavior. A member deliberately removed during the refactor simply goes, with the reason in the commit message.

## A faithful line is not a faithful port

This section was written during the port, when the AS3 was the contract. Its lesson outlives that
contract and applies to every change of inherited code: during the port, every *accidental*
departure from the AS3 made things worse (`AvatarInfoWidget.positionView()`
reimplemented what `RWGOI_MESSAGE_GET_OBJECT_LOCATION` already answered and stranded the bubble at
(0,0); `OwnAvatarMenuView` walked its grid with `numChildren` instead of the grid's own iterator and
made every panel unclickable). The point is narrower and harder: **transcribing the instruction is
not the same as reproducing the behaviour**, and when a literal port misbehaves the fault is in the
port, not in the AS3.

Four shapes account for every such failure found so far. Recognise them before writing the line.

**1. The line is identical; the data it reads is not.** `-offset.x` was right when `offset` came
from a Flash library `<offset>`. Here `GraphicAssetCollection.createFromSpritesheet` already stores
`offsetX = -assetDef.x` off the Nitro bundle. Same instruction, opposite result — the AS3 did not
change, the data's convention did. Check what feeds the value before copying the arithmetic on it.

**2. The language does not tolerate the same thing.** `_frames[index % length]` with a negative
index yields `undefined` in both languages. AS3's `for each` over `undefined` iterates nothing and
the body simply has no data; TypeScript's `for...of` throws — in the render loop, every frame. Also
in this family: `getString()` never returns null in the port, so an AS3 `!= null` key-presence test
becomes permanently true and must be ported as `hasString()`; `x || 1` destroys a legitimate `0`
where AS3 defaults on attribute *absence*; and AS3 runs a derived class's field initialisers before
`super()` where TypeScript runs them after.

**3. The line is faithful but rests on a half-ported contract.** The worst of the four, because
nothing is visibly wrong. `sprite.assetName = name` is exactly what the AS3 does — and the AS3 also
assigns `.asset` on the next line, which the port had dropped. Copying one instruction of two looks
like fidelity. Likewise `WindowToolTipAgent` reads `inputEventQueue.mouseX` exactly as the AS3 does,
but the port dispatches events straight to windows instead of through the queue, so `enqueue()` is
never called and that field has read zero since it was written. A perfect line reading a field
nobody fills. **Read the whole AS3 method, and check that what it depends on is ported too.**

**4. The AS3 has bugs Flash happened to mask.** `ContextInfoView` calls `show()` *outside* the
branch that sets the position; Flash's ordering meant it never surfaced, and here it does. `userData.roomObjectId`
of 0 is passed by the AS3 too, but its engine resolved nothing for object 0 where ours resolves it
happily and returns a valid rectangle at the room origin. Port the behaviour, note the discrepancy
at the declaration, and say which one you kept.

The recipe that catches all four is the same: **read further than the line you are porting** — the
rest of the method, the callee it assigns through, and whoever is supposed to be feeding it.
