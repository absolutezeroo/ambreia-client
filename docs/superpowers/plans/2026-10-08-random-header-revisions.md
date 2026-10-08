# Révisions de production (headers aléatoires) — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** chaque mise en production tire de nouveaux identifiants de messages au hasard sous une révision `AMBREIA-YYYYMMDDHHMM` ; l'émulateur la charge, le client de prod l'embarque sans aucun nom de message, et un client périmé est prié de se mettre à jour.

**Architecture:** l'émulateur garde sa révision de dev (`Revision20260701`, rebaptisée `AMBREIA-DEV` par son id) et construit au démarrage une `ReleaseRevision` qui ré-indexe les parsers et réécrit l'identifiant des paquets sortants d'après un JSON embarqué. Le client inline les numéros de ce JSON au build (plugin Vite), sans source map, et envoie `REVISION` dans `ClientHello`.

**Tech Stack:** C# / .NET 10, xUnit + FluentAssertions (émulateur) ; TypeScript, Vite 6, node:test, tsx (client) ; Node 22 pour les scripts.

**Spec:** `docs/superpowers/specs/2026-10-08-random-header-revisions-design.md`

**Écarts assumés par rapport à la spec** (constatés en lisant le code, à valider à la relecture) :
1. La raison « client périmé » est **122** (`${disconnected.incompatible_client_version}`), déjà connue du client — c'est le code Habbo de cette situation ; inutile d'en inventer un.
2. `revision:new` est un **script Node** (`scripts/revision-new.mjs` dans l'émulateur) qui lit `Headers.cs`, pas une commande C# : l'émulateur n'a pas de CLI (seulement une console stdin). Le contrôle « la table couvre tout ce que le serveur mappe » est fait au démarrage par réflexion (`DevHeaders`, Tâche 3).
3. Les clés du JSON sont **`events`** et **`composers`** (les classes de `Headers.cs`), pas `incoming`/`outgoing` : le client et le serveur n'appellent pas le même sens « incoming ».
4. Un nom présent dans la table mais inconnu du serveur est **ignoré** (pas d'avertissement) : il est sans effet.
5. L'écran « mise à jour » garde le bouton OK de `alert()` (pas de libellé « Recharger ») ; le clic recharge.

## Global Constraints

- Deux dépôts frères : `D:\Developpment\Habbo\vortex-rpg-client` (ici) et `D:\Developpment\Habbo\vortex-rpg-emulator`.
- **Jamais de `git commit` nu** dans aucun des deux : le propriétaire garde du travail en cours indexé. Toujours `git commit -m "…" -- <chemins>`. Avant de commiter un fichier déjà modifié par le propriétaire (`git status` le montre avant ta première modification : `HabboMessages.ts`, `Dockerfile`, …), montre-lui le diff et demande.
- Format de révision : `AMBREIA-` + date et heure **UTC** à la minute, `/^AMBREIA-\d{12}$/`. Dev : `AMBREIA-DEV`.
- Identifiants tirés dans `1..3999`, uniques par classe ; **4000 réservé** à `ClientHelloMessageEvent` (events) et `DisconnectReasonComposer` (composers), fixes dans toutes les révisions.
- Client : `pnpm check` vert avant chaque commit, dernières lignes montrées. Ne jamais taper un id de message (`Incoming.X` / `Outgoing.X`). `dispose()` dernier, commentaires en anglais qui disent pourquoi.
- Émulateur : xUnit + FluentAssertions + `FakeProxy` ; test qui échoue d'abord ; tests nommés d'après le comportement. Rediriger la sortie de build/test vers un fichier et le lire avec Read (règle du CLAUDE.md de l'émulateur) : `dotnet test <proj> --filter "FullyQualifiedName~X" > "$TEMP/vtx.log" 2>&1; echo exit=$?`.
- Messages de commit en français, terminés par :
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq
  ```

## Review Focus

1. **Client resté sur une ancienne révision (ou `AMBREIA-DEV`) contre un émulateur de prod** → il doit lire la raison 122 et proposer de recharger, pas voir une déconnexion muette. Testé : Tâche 5 (serveur), Tâche 10 (bout en bout).
2. **Table de révision incomplète** (un message mappé par le serveur absent du JSON, ou les ids fixes déplacés) → l'émulateur refuse de démarrer en nommant le message. Testé : Tâche 3.
3. **Paquet renuméroté** → seul l'identifiant change ; longueur et corps identiques octet pour octet. Testé : Tâche 3.
4. **Deux tirages dans la même minute** → le script refuse d'écraser la révision existante. Testé : Tâche 6.
5. **Nom de message absent de la table au build du client, ou nom resté en clair dans le bundle** → le build échoue en le nommant. Testé : Tâches 7 et 8.

---

### Task 1: `HabboMessages.ts` n'écrit plus aucun id en dur

**Files:**
- Modify: `packages/ambreia-protocol/src/HabboMessages.ts` (lignes 121, 201–389, 616, 716–779, 920–927)
- Test: `packages/ambreia-protocol/test/no-literal-ids.test.ts`

**Interfaces:**
- Consumes: `Incoming`, `Outgoing` de `packages/ambreia-protocol/src/Headers.generated.ts`.
- Produces: `HabboMessages` dont chaque clé d'`events` est une valeur d'`Incoming` et chaque clé de `composers` une valeur d'`Outgoing`.

`HabboMessages.ts` a peut-être des modifications non commitées du propriétaire : lance `git diff -- packages/ambreia-protocol/src/HabboMessages.ts` avant de commencer et travaille par-dessus.

- [ ] **Step 1: Write the failing test**

```ts
// packages/ambreia-protocol/test/no-literal-ids.test.ts
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {HabboMessages} from '../src/HabboMessages';
import {Incoming, Outgoing} from '../src/Headers.generated';

// A release revision re-draws every id (spec 2026-10-08-random-header-revisions §4.1): a number
// typed here would keep the old one while the table moved.
test('HabboMessages types no message id: every one comes from Headers.generated', () =>
{
    const source = readFileSync(fileURLToPath(new URL('../src/HabboMessages.ts', import.meta.url)), 'utf8');

    assert.deepEqual(source.match(/\.set\(\s*\d+/g) ?? [], []);
});

test('every registered id is one the emulator declares', () =>
{
    const messages = new HabboMessages();
    const incoming = new Set<number>(Object.values(Incoming));
    const outgoing = new Set<number>(Object.values(Outgoing));

    assert.deepEqual([...messages.events.keys()].filter(id => !incoming.has(id)), []);
    assert.deepEqual([...messages.composers.keys()].filter(id => !outgoing.has(id)), []);
});
```

If `HabboMessages` exposes `events` under another name, read lines 170–195 of `HabboMessages.ts` and use the getter that `outgoing-registered.test.ts` uses for composers (`.composers`) and its events twin.

- [ ] **Step 2: Run test to verify it fails**

Run: `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-protocol/test/no-literal-ids.test.ts`
Expected: FAIL — the first test lists ~59 `.set(<number>` matches; the second lists `2217` (`DanceMessageEvent`, which the emulator removed in `65832c348`).

- [ ] **Step 3: Replace every literal**

1. Line 121: `import {Outgoing} from './Headers.generated';` → `import {Incoming, Outgoing} from './Headers.generated';`
2. Delete the `DanceMessageEvent` registration (line ~375, id 2217) and its now-unused import: the server no longer sends it (CLAUDE.md: never re-port a removed feature). Keep the comment block above only if it still describes a remaining line.
3. Replace each `this._events.set(<id>, X)` with the `Incoming` key and each `this._composers.set(<id>, X)` with the `Outgoing` key:

| id | event class | key |
|---|---|---|
| 3309 | InitDiffieHandshakeMessageEvent | `Incoming.InitDiffieHandshakeComposer` |
| 3401 | CompleteDiffieHandshakeMessageEvent | `Incoming.CompleteDiffieHandshakeComposer` |
| 230 | AuthenticationOKMessageEvent | `Incoming.AuthenticationOKMessageComposer` |
| 4000 | DisconnectReasonMessageEvent | `Incoming.DisconnectReasonComposer` |
| 1407 | PingMessageEvent | `Incoming.PingMessageComposer` |
| 3599 | UserRightsMessageEvent | `Incoming.UserRightsMessageComposer` |
| 3985 | UserObjectMessageEvent | `Incoming.UserObjectComposer` |
| 1737 | MaintenanceStatusMessageEvent | `Incoming.MaintenanceStatusMessageComposer` |
| 132 | FigureUpdateMessageEvent | `Incoming.FigureUpdateComposer` |
| 2349 | RoomReadyMessageEvent | `Incoming.RoomReadyMessageComposer` |
| 611 | OpenConnectionMessageEvent | `Incoming.OpenConnectionMessageComposer` |
| 3404 | CloseConnectionMessageEvent | `Incoming.CloseConnectionMessageComposer` |
| 2942 | HanditemConfigurationMessageEvent | `Incoming.HanditemConfigurationMessageComposer` |
| 3339 | RoomForwardMessageEvent | `Incoming.RoomForwardMessageComposer` |
| 2430 | CantConnectMessageEvent | `Incoming.CantConnectMessageComposer` |
| 934 | YouAreControllerMessageEvent | `Incoming.YouAreControllerMessageComposer` |
| 456 | YouAreNotControllerMessageEvent | `Incoming.YouAreNotControllerMessageComposer` |
| 1986 | YouAreOwnerMessageEvent | `Incoming.YouAreOwnerMessageComposer` |
| 2885 | FloorHeightMapMessageEvent | `Incoming.FloorHeightMapMessageComposer` |
| 154 | FurnitureAliasesMessageEvent | `Incoming.FurnitureAliasesMessageComposer` |
| 2260 | HeightMapMessageEvent | `Incoming.HeightMapMessageComposer` |
| 3279 | HeightMapUpdateMessageEvent | `Incoming.HeightMapUpdateMessageComposer` |
| 2792 | RoomEntryTileMessageEvent | `Incoming.RoomEntryTileMessageComposer` |
| 2914 | RoomEntryInfoMessageEvent | `Incoming.RoomEntryInfoMessageComposer` |
| 2104 | ObjectsMessageEvent | `Incoming.ObjectsMessageComposer` |
| 368 | ObjectAddMessageEvent | `Incoming.ObjectAddMessageComposer` |
| 114 | ObjectUpdateMessageEvent | `Incoming.ObjectUpdateMessageComposer` |
| 1916 | ObjectRemoveMessageEvent | `Incoming.ObjectRemoveMessageComposer` |
| 2329 | ObjectDataUpdateMessageEvent | `Incoming.ObjectDataUpdateMessageComposer` |
| 3379 | ItemsMessageEvent | `Incoming.ItemsMessageComposer` |
| 3733 | ItemAddMessageEvent | `Incoming.ItemAddMessageComposer` |
| 1198 | ItemUpdateMessageEvent | `Incoming.ItemUpdateMessageComposer` |
| 2859 | ItemRemoveMessageEvent | `Incoming.ItemRemoveMessageComposer` |
| 834 | ItemStateUpdateMessageEvent | `Incoming.ItemStateUpdateMessageComposer` |
| 540 | ItemDataUpdateMessageEvent | `Incoming.ItemDataUpdateMessageComposer` |
| 996 | UsersMessageEvent | `Incoming.UsersMessageComposer` |
| 2613 | UserUpdateMessageEvent | `Incoming.UserUpdateMessageComposer` |
| 3693 | UserRemoveMessageEvent | `Incoming.UserRemoveMessageComposer` |
| 1956 | RoomPropertyMessageEvent | `Incoming.RoomPropertyMessageComposer` |
| 2986 | RoomVisualizationSettingsEvent | `Incoming.RoomVisualizationSettingsComposer` |
| 2624 | AvatarEffectMessageEvent | `Incoming.AvatarEffectMessageComposer` |
| 2850 | CarryObjectMessageEvent | `Incoming.CarryObjectMessageComposer` |
| 3798 | UserChangeMessageEvent | `Incoming.UserChangeMessageComposer` |
| 2243 | NotificationDialogMessageEvent | `Incoming.NotificationDialogMessageComposer` |

| id | composer class | key |
|---|---|---|
| 4000 | ClientHelloMessageComposer | `Outgoing.ClientHelloMessageEvent` |
| 2022 | InitDiffieHandshakeMessageComposer | `Outgoing.InitDiffieHandshakeMessageEvent` |
| 2526 | CompleteDiffieHandshakeMessageComposer | `Outgoing.CompleteDiffieHandshakeMessageEvent` |
| 3584 | VersionCheckMessageComposer | `Outgoing.VersionCheckMessageEvent` |
| 882 | SSOTicketMessageComposer | `Outgoing.SSOTicketMessageEvent` |
| 2309 | UniqueIDMessageComposer | `Outgoing.UniqueIDMessageEvent` |
| 362 | PongMessageComposer | `Outgoing.PongMessageEvent` |
| 2864 | DisconnectMessageComposer | `Outgoing.DisconnectMessageEvent` |
| 756 | InfoRetrieveMessageComposer | `Outgoing.InfoRetrieveMessageEvent` |
| 3234 | OpenFlatConnectionMessageComposer | `Outgoing.OpenFlatConnectionMessageEvent` |
| 3061 | QuitMessageComposer | `Outgoing.QuitMessageEvent` |
| 2508 | LookToMessageComposer | `Outgoing.LookToMessageEvent` |
| 1901 | GetFurnitureAliasesMessageComposer | `Outgoing.GetFurnitureAliasesMessageEvent` |
| 2364 | MoveAvatarMessageComposer | `Outgoing.MoveAvatarMessageEvent` |

Example of the shape (line 725 today):
```ts
        this._composers.set(Outgoing.SSOTicketMessageEvent, SSOTicketMessageComposer);
```
Keep every comment that sits next to a line; drop only comments whose whole point was the literal number (e.g. "Message ID: 4000").

- [ ] **Step 4: Run tests to verify they pass**

Run: `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-protocol/test/no-literal-ids.test.ts packages/ambreia-protocol/test/incoming-registered.test.ts packages/ambreia-protocol/test/outgoing-registered.test.ts`
Expected: PASS (all three).

- [ ] **Step 5: Full gate**

Run: `pnpm check` — expected green; show the last lines. A red caused by files this task did not touch is reported, not fixed.

- [ ] **Step 6: Commit**

```bash
git commit -m "protocole : HabboMessages lit ses ids dans Headers.generated, plus aucun en dur

Préalable des révisions de production : un id tapé garderait l'ancien numéro quand la table bouge.
DanceMessageEvent (2217) part, l'émulateur ne l'envoie plus (65832c348).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- packages/ambreia-protocol/src/HabboMessages.ts packages/ambreia-protocol/test/no-literal-ids.test.ts
```

---

### Task 2: la révision de dev s'appelle `AMBREIA-DEV`, et le client l'annonce

Both repos change together: from now on the client announces `AMBREIA-DEV`, and the emulator only accepts that.

**Files:**
- Modify (emulator): `Vortex.Revisions/Revision20260701/Revision20260701.cs:19`, `Vortex.PacketHandlers/Handshake/ClientHelloMessageHandler.cs:20-23` (comment), every test that hard-codes `WIN63-202607011411-782849652` (find with `git -C ../vortex-rpg-emulator grep -n "WIN63-202607011411-782849652" -- "*.cs"`; known: `Vortex.Revisions.Tests/EmittedComposerRegistrationTests.cs:117`).
- Modify (client): `packages/vortex-engine/tools/lib/headers.mjs` (`renderHeadersTs`), `packages/vortex-engine/tools/lib/headers.test.mjs`, `packages/ambreia-protocol/src/Headers.generated.ts` (regenerated), `packages/ambreia-protocol/src/outgoing/handshake/ClientHelloMessageComposer.ts:13-22`.
- Test (client): `packages/ambreia-protocol/test/client-hello-revision.test.ts`

**Interfaces:**
- Produces: `export const REVISION: string` in `Headers.generated.ts` (`'AMBREIA-DEV'` in dev); `renderHeadersTs(parsed, revision = 'AMBREIA-DEV')`; the emulator's dev revision id `"AMBREIA-DEV"`.

- [ ] **Step 1: Write the failing client tests**

Append to `packages/vortex-engine/tools/lib/headers.test.mjs`:
```js
test('announces the dev revision unless told another one', () =>
{
    assert.match(renderHeadersTs(parseHeadersCs(FIXTURE)), /\nexport const REVISION = 'AMBREIA-DEV';\n/);
    assert.match(renderHeadersTs(parseHeadersCs(FIXTURE), 'AMBREIA-202610081530'), /\nexport const REVISION = 'AMBREIA-202610081530';\n/);
});
```

Create `packages/ambreia-protocol/test/client-hello-revision.test.ts`:
```ts
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ClientHelloMessageComposer} from '../src/outgoing/handshake/ClientHelloMessageComposer';
import {REVISION} from '../src/Headers.generated';

// The server picks its id table from this string (spec 2026-10-08-random-header-revisions §4.3).
test('ClientHello announces the revision the client was built for', () =>
{
    assert.equal(new ClientHelloMessageComposer().getMessageArray()[0], REVISION);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test packages/vortex-engine/tools/lib/headers.test.mjs` → FAIL (no `REVISION` line).
Run: `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-protocol/test/client-hello-revision.test.ts` → FAIL (`REVISION` is not exported).

- [ ] **Step 3: Implement the client side**

In `headers.mjs`, replace `renderHeadersTs`:
```js
export function renderHeadersTs(parsed, revision = 'AMBREIA-DEV')
{
    return [
        HEADER_COMMENT,
        `/** The protocol revision this client speaks, announced in ClientHello. */\nexport const REVISION = '${revision}';\n`,
        renderBlock('Incoming', 'Server to client: the emulator\'s MessageComposer constants.', parsed.incoming),
        renderBlock('Outgoing', 'Client to server: the emulator\'s MessageEvent constants.', parsed.outgoing)
    ].join('\n');
}
```
Then run `pnpm gen:headers` (it rewrites `Headers.generated.ts` with the `REVISION` line).

In `ClientHelloMessageComposer.ts`, add `import {REVISION} from '../../Headers.generated';` and change the default:
```ts
    constructor(
        releaseVersion: string = REVISION,
        type: string = 'FLASH20',
        platform: number = 6,
        category: number = 4
    )
```
Also update the class doc's "Message ID: 4000" line to say the id stays 4000 in every revision because the server reads this message before it knows which table the client speaks.

- [ ] **Step 4: Implement the emulator side**

`Vortex.Revisions/Revision20260701/Revision20260701.cs`:
```csharp
    // The dev revision: the ids of Headers.cs as typed. A production server refuses it (its ids are
    // in this repository) and speaks a ReleaseRevision drawn from them instead.
    public override string Revision => "AMBREIA-DEV";
```
In `ClientHelloMessageHandler.cs` lines 20-23, change the comment's example from `"WIN63-202607011411-782849652"` to `"AMBREIA-DEV"`. Replace the hard-coded WIN63 string in each test found by the grep with `"AMBREIA-DEV"` (or with `new Rev().Revision` where the test already has a `Rev`).

- [ ] **Step 5: Run both sides**

Client: `pnpm check` → green; show last lines.
Emulator (from `../vortex-rpg-emulator`): `dotnet test Vortex.Revisions.Tests > "$TEMP/vtx.log" 2>&1; echo exit=$?` and `dotnet test Vortex.Hosting.Tests --filter "FullyQualifiedName~UnknownHeader" > "$TEMP/vtx2.log" 2>&1; echo exit=$?` → `exit=0` for both (read the logs with Read if not).

- [ ] **Step 6: Commit both repos**

```bash
git -C ../vortex-rpg-emulator commit -m "révisions : la révision de dev s'appelle AMBREIA-DEV

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- Vortex.Revisions/Revision20260701/Revision20260701.cs Vortex.PacketHandlers/Handshake/ClientHelloMessageHandler.cs Vortex.Revisions.Tests/EmittedComposerRegistrationTests.cs
# plus every other test file the Step 4 grep turned up, listed by path
git commit -m "protocole : ClientHello annonce REVISION (AMBREIA-DEV en dev)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- packages/vortex-engine/tools/lib/headers.mjs packages/vortex-engine/tools/lib/headers.test.mjs packages/ambreia-protocol/src/Headers.generated.ts packages/ambreia-protocol/src/outgoing/handshake/ClientHelloMessageComposer.ts packages/ambreia-protocol/test/client-hello-revision.test.ts
```

---

### Task 3: `ReleaseRevision` — la révision de dev sous d'autres numéros

All paths in this task are under `../vortex-rpg-emulator/`.

**Files:**
- Create: `Vortex.Revisions/DevHeaders.cs`, `Vortex.Revisions/ReleaseTable.cs`, `Vortex.Revisions/RenumberedSerializer.cs`, `Vortex.Revisions/ReleaseRevision.cs`
- Test: `Vortex.Revisions.Tests/Releases/ReleaseRevisionTests.cs`

**Interfaces:**
- Consumes: `Revision20260701` (id `AMBREIA-DEV`, Task 2); `ISerializer`, `IServerPacket`, `VortexPacket` (`Vortex.Primitives.Packets`); `IRevision`, `IParser` (`Vortex.Primitives.Networking.Revisions`, `Vortex.Primitives.Packets`).
- Produces:
  - `public static class DevHeaders { IReadOnlyDictionary<string,int> Events; IReadOnlyDictionary<string,int> Composers; }`
  - `public sealed record ReleaseTable(string Revision, IReadOnlyDictionary<string,int> Events, IReadOnlyDictionary<string,int> Composers)` with `public const int FixedHeader = 4000;` and `public static ReleaseTable Parse(string json)`
  - `public sealed class ReleaseRevision : IRevision` with `public ReleaseRevision(ReleaseTable table)` (throws `InvalidOperationException` naming the problem)

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Revisions.Tests/Releases/ReleaseRevisionTests.cs
using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Vortex.Primitives.Packets;
using Vortex.Protocol.Messages.Outgoing.Handshake;
using Vortex.Revisions;
using Xunit;
using Rev = Vortex.Revisions.Revision20260701.Revision20260701;

namespace Vortex.Revisions.Tests.Releases;

public sealed class ReleaseRevisionTests
{
    private static readonly Rev Dev = new();

    // Every name renumbered 1, 2, 3... in name order, the two fixed ones kept on 4000: a valid table
    // whose ids all differ from the dev ones' positions.
    private static ReleaseTable Table(Func<Dictionary<string, int>, Dictionary<string, int>>? edit = null)
    {
        Dictionary<string, int> Renumber(IReadOnlyDictionary<string, int> dev, string fixedName) =>
            dev.Keys.Order(StringComparer.Ordinal)
                .Select((name, i) => (name, id: name == fixedName ? ReleaseTable.FixedHeader : i + 1))
                .ToDictionary(e => e.name, e => e.id);

        Dictionary<string, int> events = Renumber(DevHeaders.Events, "ClientHelloMessageEvent");
        Dictionary<string, int> composers = Renumber(DevHeaders.Composers, "DisconnectReasonComposer");

        return new ReleaseTable("AMBREIA-202610081530", edit?.Invoke(events) ?? events, composers);
    }

    [Fact]
    public void Revision_IsTheTablesName()
    {
        new ReleaseRevision(Table()).Revision.Should().Be("AMBREIA-202610081530");
    }

    [Fact]
    public void EveryDevParser_AnswersUnderItsReleaseNumber()
    {
        ReleaseTable table = Table();
        ReleaseRevision release = new(table);

        foreach ((string name, int devId) in DevHeaders.Events.Where(e => Dev.Parsers.ContainsKey(e.Value)))
        {
            release.Parsers[table.Events[name]].Should().BeSameAs(Dev.Parsers[devId], name);
        }

        release.Parsers.Should().HaveCount(Dev.Parsers.Count);
    }

    [Fact]
    public void ARenumberedPacket_ChangesOnlyItsHeader()
    {
        ReleaseTable table = Table();
        DisconnectReasonEventMessageComposer composer = new() { Reason = 122 };
        Type type = typeof(DisconnectReasonEventMessageComposer);

        // DisconnectReason is fixed on 4000, so pick a renumbered composer for the header check.
        Type moved = Dev.Serializers.Keys.First(t => Dev.Serializers[t].Header != ReleaseTable.FixedHeader);
        ISerializer devSerializer = Dev.Serializers[moved];
        ISerializer releaseSerializer = new ReleaseRevision(table).Serializers[moved];
        string name = DevHeaders.Composers.Single(e => e.Value == devSerializer.Header).Key;

        releaseSerializer.Header.Should().Be(table.Composers[name]);

        byte[] devBytes = Dev.Serializers[type].Serialize(composer).ToArray();
        byte[] releaseBytes = new ReleaseRevision(table).Serializers[type].Serialize(composer).ToArray();

        releaseBytes.Should().Equal(devBytes, "DisconnectReason keeps 4000 in every revision");
    }

    [Fact]
    public void ARenumberedSerializer_RewritesBytesFourAndFive_AndNothingElse()
    {
        ReleaseTable table = Table();
        ReleaseRevision release = new(table);

        foreach ((Type type, ISerializer devSerializer) in Dev.Serializers)
        {
            ISerializer releaseSerializer = release.Serializers[type];

            releaseSerializer.Header.Should().Be(table.Composers[DevHeaders.Composers.Single(e => e.Value == devSerializer.Header).Key]);
        }

        // Byte-level check on one message whose payload is easy to build.
        Type statusType = typeof(Vortex.Protocol.Messages.Outgoing.Availability.MaintenanceStatusMessageComposer);
        var status = new Vortex.Protocol.Messages.Outgoing.Availability.MaintenanceStatusMessageComposer
        {
            IsInMaintenance = true, MinutesUntilMaintenance = 5, DurationMinutes = 30,
        };
        byte[] devBytes = Dev.Serializers[statusType].Serialize(status).ToArray();
        byte[] releaseBytes = release.Serializers[statusType].Serialize(status).ToArray();
        int releaseHeader = release.Serializers[statusType].Header;

        releaseBytes.Length.Should().Be(devBytes.Length);
        releaseBytes.Take(4).Should().Equal(devBytes.Take(4), "the length prefix is unchanged");
        ((releaseBytes[4] << 8) | releaseBytes[5]).Should().Be(releaseHeader);
        releaseBytes.Skip(6).Should().Equal(devBytes.Skip(6), "the payload is unchanged");
    }

    [Fact]
    public void AMissingMessage_IsNamed()
    {
        Action build = () => new ReleaseRevision(Table(events => { events.Remove("SSOTicketMessageEvent"); return events; }));

        build.Should().Throw<InvalidOperationException>().WithMessage("*SSOTicketMessageEvent*");
    }

    [Fact]
    public void AMovedFixedHeader_IsRefused()
    {
        Action build = () => new ReleaseRevision(Table(events => { events["ClientHelloMessageEvent"] = 17; return events; }));

        build.Should().Throw<InvalidOperationException>().WithMessage("*ClientHelloMessageEvent*4000*");
    }

    [Fact]
    public void ASharedNumber_IsRefused()
    {
        Action build = () => new ReleaseRevision(Table(events =>
        {
            events["SSOTicketMessageEvent"] = events["PongMessageEvent"];
            return events;
        }));

        build.Should().Throw<InvalidOperationException>().WithMessage("*share*");
    }

    [Fact]
    public void ANumberOutsideTheRange_IsRefused()
    {
        Action build = () => new ReleaseRevision(Table(events => { events["SSOTicketMessageEvent"] = 4001; return events; }));

        build.Should().Throw<InvalidOperationException>().WithMessage("*SSOTicketMessageEvent*1..3999*");
    }

    [Fact]
    public void Parse_ReadsTheJsonFormat()
    {
        ReleaseTable table = ReleaseTable.Parse("""
            {"revision":"AMBREIA-202610081530","events":{"A":1},"composers":{"B":2}}
            """);

        table.Revision.Should().Be("AMBREIA-202610081530");
        table.Events.Should().Equal(new Dictionary<string, int> { ["A"] = 1 });
        table.Composers.Should().Equal(new Dictionary<string, int> { ["B"] = 2 });
    }
}
```

Check the property names of `MaintenanceStatusMessageComposer` against `Vortex.Protocol/Messages/Outgoing/Availability/MaintenanceStatusMessageComposer.cs` (the serializer writes `IsInMaintenance`, `MinutesUntilMaintenance`, `DurationMinutes`); add any other `required` member it declares.

- [ ] **Step 2: Run to verify they fail**

Run: `dotnet test Vortex.Revisions.Tests --filter "FullyQualifiedName~ReleaseRevisionTests" > "$TEMP/vtx.log" 2>&1; echo exit=$?`
Expected: build error — `DevHeaders`, `ReleaseTable`, `ReleaseRevision` do not exist.

- [ ] **Step 3: Implement**

```csharp
// Vortex.Revisions/DevHeaders.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Vortex.Revisions.Revision20260701;

namespace Vortex.Revisions;

/// <summary>
/// The dev revision's header ids by name, read from <c>Headers.cs</c> itself, so a release table is
/// checked against exactly what this server maps rather than against a copy of the list.
/// </summary>
public static class DevHeaders
{
    public static IReadOnlyDictionary<string, int> Events { get; } = Read(typeof(MessageEvent));

    public static IReadOnlyDictionary<string, int> Composers { get; } = Read(typeof(MessageComposer));

    private static Dictionary<string, int> Read(Type headers) =>
        headers
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .Where(field => field.IsLiteral && field.FieldType == typeof(int))
            .ToDictionary(field => field.Name, field => (int)field.GetRawConstantValue()!);
}
```

```csharp
// Vortex.Revisions/ReleaseTable.cs
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace Vortex.Revisions;

/// <summary>
/// One production revision's header ids, as <c>scripts/revision-new.mjs</c> drew them:
/// <c>{"revision": "AMBREIA-…", "events": {name: id}, "composers": {name: id}}</c>.
/// Spec: vortex-rpg-client docs/superpowers/specs/2026-10-08-random-header-revisions-design.md.
/// </summary>
public sealed record ReleaseTable(
    string Revision,
    IReadOnlyDictionary<string, int> Events,
    IReadOnlyDictionary<string, int> Composers
)
{
    /// <summary>
    /// ClientHello and DisconnectReason keep this id in every revision: the first is read before the
    /// server knows the client's table, the second must reach a client on any table.
    /// </summary>
    public const int FixedHeader = 4000;

    public static ReleaseTable Parse(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;

        return new ReleaseTable(
            root.GetProperty("revision").GetString()
                ?? throw new InvalidDataException("release table: \"revision\" is null"),
            Read(root, "events"),
            Read(root, "composers")
        );
    }

    private static Dictionary<string, int> Read(JsonElement root, string key) =>
        root.GetProperty(key).EnumerateObject().ToDictionary(entry => entry.Name, entry => entry.Value.GetInt32());
}
```

```csharp
// Vortex.Revisions/RenumberedSerializer.cs
using Vortex.Primitives.Networking;
using Vortex.Primitives.Packets;

namespace Vortex.Revisions;

/// <summary>
/// A dev serializer under a release revision's id. AbstractSerializer frames a packet as
/// [int32 length][int16 header][payload]; only bytes 4..5 differ between revisions, so they are
/// rewritten after the dev serializer has run and the rest is left as it wrote it.
/// </summary>
internal sealed class RenumberedSerializer(ISerializer inner, int header) : ISerializer
{
    private const int HeaderOffset = 4;

    public int Header { get; } = header;

    public IServerPacket Serialize(IComposer message)
    {
        IServerPacket packet = inner.Serialize(message);
        int end = packet.Length;

        packet.SetWriterPosition(HeaderOffset);
        packet.WriteShort((short)Header);
        packet.SetWriterPosition(end);

        if (packet is VortexPacket vortex)
        {
            vortex.Header = Header;
        }

        return packet;
    }
}
```
(Check the namespace of `IComposer` in `AbstractSerializer.cs`'s usings — it is `Vortex.Primitives.Networking` there.)

```csharp
// Vortex.Revisions/ReleaseRevision.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Vortex.Primitives.Networking.Revisions;
using Vortex.Primitives.Packets;
using DevRevision = Vortex.Revisions.Revision20260701.Revision20260701;

namespace Vortex.Revisions;

/// <summary>
/// The dev revision under a production table's ids. Nothing is re-mapped by hand: each dev parser is
/// re-keyed and each dev serializer renumbered through the message's name, so a release speaks
/// exactly the messages the dev revision speaks. A table that does not cover them, moves a fixed id,
/// shares an id or leaves the 1..3999 range is refused here, which stops the server from starting.
/// </summary>
public sealed class ReleaseRevision : IRevision
{
    private const int MaxDrawnHeader = 3999;

    public ReleaseRevision(ReleaseTable table)
    {
        Revision = table.Revision;

        Check(table.Revision, "event", table.Events, DevHeaders.Events, "ClientHelloMessageEvent");
        Check(table.Revision, "composer", table.Composers, DevHeaders.Composers, "DisconnectReasonComposer");

        DevRevision dev = new();
        Dictionary<int, string> eventNames = DevHeaders.Events.ToDictionary(e => e.Value, e => e.Key);
        Dictionary<int, string> composerNames = DevHeaders.Composers.ToDictionary(e => e.Value, e => e.Key);

        Parsers = dev.Parsers.ToDictionary(entry => table.Events[eventNames[entry.Key]], entry => entry.Value);
        Serializers = dev.Serializers.ToDictionary(
            entry => entry.Key,
            entry => (ISerializer)new RenumberedSerializer(entry.Value, table.Composers[composerNames[entry.Value.Header]])
        );
    }

    public string Revision { get; }

    public IReadOnlyDictionary<int, IParser> Parsers { get; }

    public IReadOnlyDictionary<Type, ISerializer> Serializers { get; }

    private static void Check(
        string revision,
        string kind,
        IReadOnlyDictionary<string, int> table,
        IReadOnlyDictionary<string, int> dev,
        string fixedName
    )
    {
        foreach (string name in dev.Keys)
        {
            if (!table.TryGetValue(name, out int id))
            {
                throw new InvalidOperationException($"Release {revision}: {kind} {name} has no id. Draw the revision again with scripts/revision-new.mjs.");
            }

            if (name == fixedName && id != ReleaseTable.FixedHeader)
            {
                throw new InvalidOperationException($"Release {revision}: {name} must stay on {ReleaseTable.FixedHeader}, the table has {id}.");
            }

            if (name != fixedName && (id < 1 || id > MaxDrawnHeader))
            {
                throw new InvalidOperationException($"Release {revision}: {kind} {name} is {id}, outside 1..{MaxDrawnHeader}.");
            }
        }

        string? shared = table
            .Where(entry => dev.ContainsKey(entry.Key))
            .GroupBy(entry => entry.Value)
            .Where(group => group.Count() > 1)
            .Select(group => string.Join(" and ", group.Select(entry => entry.Key)) + $" share {kind} id {group.Key}")
            .FirstOrDefault();

        if (shared is not null)
        {
            throw new InvalidOperationException($"Release {revision}: {shared}.");
        }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test Vortex.Revisions.Tests --filter "FullyQualifiedName~ReleaseRevisionTests" > "$TEMP/vtx.log" 2>&1; echo exit=$?`
Expected: `exit=0`, 9 tests passed (read the log to confirm the count).

- [ ] **Step 5: Emulator gates**

Run: `node scripts/hooks/check-inert-declarations.mjs` → 0 gaps. Run: `dotnet build Vortex.Main/Vortex.Main.csproj -t:VortexCloudFastCheck > "$TEMP/vtx-gate.log" 2>&1; echo exit=$?` → `exit=0`.

- [ ] **Step 6: Commit (emulator)**

```bash
git -C ../vortex-rpg-emulator commit -m "révisions : ReleaseRevision, la révision de dev sous les numéros d'une table de production

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- Vortex.Revisions/DevHeaders.cs Vortex.Revisions/ReleaseTable.cs Vortex.Revisions/RenumberedSerializer.cs Vortex.Revisions/ReleaseRevision.cs Vortex.Revisions.Tests/Releases/ReleaseRevisionTests.cs
```

---

### Task 4: l'émulateur charge la dernière révision en production

All paths under `../vortex-rpg-emulator/`.

**Files:**
- Modify: `Vortex.Revisions/Vortex.Revisions.csproj` (embedded resources), `Vortex.Revisions/ReleaseRevision.cs` (`LoadLatest`, `LatestReleaseName`), `Vortex.Revisions/Configuration/RevisionConfig.cs` (`Release`), `Vortex.Revisions/Extensions/ServiceCollectionExtensions.cs:22`
- Test: `Vortex.Revisions.Tests/Releases/LatestReleaseTests.cs`

**Interfaces:**
- Consumes: `ReleaseRevision(ReleaseTable)`, `ReleaseTable.Parse` (Task 3).
- Produces: `public static ReleaseRevision ReleaseRevision.LoadLatest()`; `public static string? ReleaseRevision.LatestReleaseName(IEnumerable<string> resourceNames)`; config key `Vortex:Revisions:Release` (bool?, default = not Development; env `VORTEX__Vortex__Revisions__Release`).

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Revisions.Tests/Releases/LatestReleaseTests.cs
using System;
using FluentAssertions;
using Vortex.Revisions;
using Xunit;

namespace Vortex.Revisions.Tests.Releases;

public sealed class LatestReleaseTests
{
    [Fact]
    public void TheLatestRevision_IsTheLastByName()
    {
        ReleaseRevision.LatestReleaseName(new[]
        {
            "Releases/AMBREIA-202610081530.json",
            "Vortex.Revisions.Something.txt",
            "Releases/AMBREIA-202612010900.json",
            "Releases/AMBREIA-202611150000.json",
        }).Should().Be("Releases/AMBREIA-202612010900.json");
    }

    [Fact]
    public void NoRelease_IsNull()
    {
        ReleaseRevision.LatestReleaseName(new[] { "Vortex.Revisions.Something.txt" }).Should().BeNull();
    }
}
```

- [ ] **Step 2: Run to verify they fail**

Run: `dotnet test Vortex.Revisions.Tests --filter "FullyQualifiedName~LatestReleaseTests" > "$TEMP/vtx.log" 2>&1; echo exit=$?` → build error (`LatestReleaseName` missing).

- [ ] **Step 3: Implement**

`Vortex.Revisions.csproj`, inside `<Project>`:
```xml
  <ItemGroup>
    <!-- Production revisions drawn by scripts/revision-new.mjs, shipped inside the assembly so a
         deploy cannot run a server without the table its clients were built against. -->
    <EmbeddedResource Include="Releases\*.json" LogicalName="Releases/%(Filename)%(Extension)" />
  </ItemGroup>
```

Add to `ReleaseRevision` (with `using System.IO; using System.Reflection;`):
```csharp
    private const string ResourcePrefix = "Releases/";

    /// <summary>The newest embedded release; the AMBREIA-yyyyMMddHHmm name sorts chronologically.</summary>
    public static ReleaseRevision LoadLatest()
    {
        Assembly assembly = typeof(ReleaseRevision).Assembly;
        string name = LatestReleaseName(assembly.GetManifestResourceNames())
            ?? throw new InvalidOperationException(
                "No release revision: Vortex.Revisions/Releases/ is empty. Draw one with "
                    + "`node scripts/revision-new.mjs`, or run with Vortex:Revisions:Release=false for the dev revision."
            );

        using Stream stream = assembly.GetManifestResourceStream(name)!;
        using StreamReader reader = new(stream);

        return new ReleaseRevision(ReleaseTable.Parse(reader.ReadToEnd()));
    }

    public static string? LatestReleaseName(IEnumerable<string> resourceNames) =>
        resourceNames
            .Where(name => name.StartsWith(ResourcePrefix, StringComparison.Ordinal) && name.EndsWith(".json", StringComparison.Ordinal))
            .Order(StringComparer.Ordinal)
            .LastOrDefault();
```

`RevisionConfig.cs`, add:
```csharp
    /// <summary>
    /// Speak the newest drawn release revision instead of the dev one. Unset: release everywhere but
    /// Development. Set it to true to try a production client against a local server.
    /// </summary>
    public bool? Release { get; init; }
```

`ServiceCollectionExtensions.cs`, replace line 22 (`services.AddSingleton<IRevision, RevisionType>();`):
```csharp
        RevisionConfig revisions =
            builder.Configuration.GetSection(RevisionConfig.SECTION_NAME).Get<RevisionConfig>() ?? new RevisionConfig();

        // One revision only, so it is also the default every new session starts on. A production
        // server never speaks AMBREIA-DEV: its ids are in this repository.
        if (revisions.Release ?? !builder.Environment.IsDevelopment())
        {
            services.AddSingleton<IRevision>(_ => ReleaseRevision.LoadLatest());
        }
        else
        {
            services.AddSingleton<IRevision, RevisionType>();
        }
```
If `Get<T>` does not compile, add `using Microsoft.Extensions.Configuration;` (the binder extension lives there).

- [ ] **Step 4: Run tests, then check the refusal by hand**

Run: `dotnet test Vortex.Revisions.Tests --filter "FullyQualifiedName~LatestReleaseTests" > "$TEMP/vtx.log" 2>&1; echo exit=$?` → `exit=0`.
Then start the emulator once with `VORTEX__Vortex__Revisions__Release=true` (Releases/ is still empty) and confirm it stops with the "No release revision" message. Stop it.

- [ ] **Step 5: Gate and commit (emulator)**

`dotnet build Vortex.Main/Vortex.Main.csproj -t:VortexCloudFastCheck > "$TEMP/vtx-gate.log" 2>&1; echo exit=$?` → `exit=0`.
```bash
git -C ../vortex-rpg-emulator commit -m "révisions : en production, l'émulateur parle la dernière révision tirée

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- Vortex.Revisions/Vortex.Revisions.csproj Vortex.Revisions/ReleaseRevision.cs Vortex.Revisions/Configuration/RevisionConfig.cs Vortex.Revisions/Extensions/ServiceCollectionExtensions.cs Vortex.Revisions.Tests/Releases/LatestReleaseTests.cs
```

---

### Task 5: un client sur une révision inconnue reçoit la raison 122

All paths under `../vortex-rpg-emulator/`.

**Files:**
- Modify: `Vortex.Protocol/Messages/Outgoing/Handshake/DisconnectReasonEventMessageComposer.cs`, `Vortex.PacketHandlers/Handshake/ClientHelloMessageHandler.cs:24-29`
- Test: `Vortex.PacketHandlers.Tests/Handshake/ClientHelloMessageHandlerTests.cs`

**Interfaces:**
- Produces: `public const int DisconnectReasonEventMessageComposer.IncompatibleClientVersion = 122;`

- [ ] **Step 1: Write the failing test**

Read `Vortex.Tests.Support`'s `FakeProxy` and `Vortex.PacketHandlers.Tests/SsoTicketMessageHandlerTests.cs` (lines 90–120) first: use the same way of reading a call's method name and arguments, and the same return value for `Task` methods.

```csharp
// Vortex.PacketHandlers.Tests/Handshake/ClientHelloMessageHandlerTests.cs
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Vortex.Messages.Registry;
using Vortex.PacketHandlers.Handshake;
using Vortex.Primitives.Networking;
using Vortex.Primitives.Networking.Revisions;
using Vortex.Protocol.Messages.Incoming.Handshake;
using Vortex.Protocol.Messages.Outgoing.Handshake;
using Vortex.Tests.Support;
using Xunit;

namespace Vortex.PacketHandlers.Tests.Handshake;

public sealed class ClientHelloMessageHandlerTests
{
    private readonly List<object> _calls = new();

    [Fact]
    public async Task AnUnknownRevision_IsToldItsClientIsOutdated_ThenClosed()
    {
        ClientHelloMessageHandler handler = new(FakeProxy.Create<IRevisionManager>(_ => null));

        await handler.HandleAsync(
            new ClientHelloMessage { Production = "AMBREIA-201901010000", Platform = "FLASH20", ClientPlatform = 6, DeviceCategory = 4 },
            Context(),
            CancellationToken.None
        );

        _calls.Should().HaveCount(2);
        _calls[0].Should().BeEquivalentTo(new DisconnectReasonEventMessageComposer
        {
            Reason = DisconnectReasonEventMessageComposer.IncompatibleClientVersion,
        });
        _calls[1].Should().Be("close");
    }

    private MessageContext Context() =>
        new(
            FakeProxy.Create<ISessionContext>(call =>
            {
                if (call.Method.Name == nameof(ISessionContext.SendComposerAsync))
                {
                    _calls.Add(call.Arguments[0]!);
                }

                if (call.Method.Name == nameof(ISessionContext.CloseSessionAsync))
                {
                    _calls.Add("close");
                }

                return null;
            }),
            default,
            default
        );
}
```
(If `FakeProxy`'s call object names its arguments differently than `Arguments`, use its name; if it needs `Task.CompletedTask` rather than `null` for `Task` methods, return that — mirror `SsoTicketMessageHandlerTests`.)

- [ ] **Step 2: Run to verify it fails**

Run: `dotnet test Vortex.PacketHandlers.Tests --filter "FullyQualifiedName~ClientHelloMessageHandlerTests" > "$TEMP/vtx.log" 2>&1; echo exit=$?` → build error (`IncompatibleClientVersion` missing).

- [ ] **Step 3: Implement**

In `DisconnectReasonEventMessageComposer`, next to `ConcurrentLogin`:
```csharp
    /// <summary>
    /// The client announced a revision this server does not speak: <c>${disconnected.incompatible_client_version}</c>.
    /// Habbo's own code for it, already known to the client.
    /// </summary>
    public const int IncompatibleClientVersion = 122;
```

In `ClientHelloMessageHandler.HandleAsync`, replace the rejection block:
```csharp
        if (message.Production is null || _revisions.GetRevision(message.Production) is null)
        {
            // DisconnectReason keeps id 4000 in every revision, so even a client on a table this
            // server no longer speaks can read why it is dropped and offer to reload.
            await ctx
                .SendComposerAsync(
                    new DisconnectReasonEventMessageComposer
                    {
                        Reason = DisconnectReasonEventMessageComposer.IncompatibleClientVersion,
                    },
                    ct
                )
                .ConfigureAwait(false);
            await ctx.CloseSessionAsync().ConfigureAwait(false);

            return;
        }
```
Keep the existing comment above it (updated in Task 2).

- [ ] **Step 4: Run test to verify it passes**

Run the Step 2 command → `exit=0`.

- [ ] **Step 5: Gate and commit (emulator)**

`dotnet build Vortex.Main/Vortex.Main.csproj -t:VortexCloudFastCheck > "$TEMP/vtx-gate.log" 2>&1; echo exit=$?` → `exit=0`.
```bash
git -C ../vortex-rpg-emulator commit -m "poignée de main : un client sur une révision inconnue apprend qu'il est périmé (122)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- Vortex.Protocol/Messages/Outgoing/Handshake/DisconnectReasonEventMessageComposer.cs Vortex.PacketHandlers/Handshake/ClientHelloMessageHandler.cs Vortex.PacketHandlers.Tests/Handshake/ClientHelloMessageHandlerTests.cs
```

---

### Task 6: `scripts/revision-new.mjs` tire une révision

All paths under `../vortex-rpg-emulator/`.

**Files:**
- Create: `scripts/revision-new.mjs`, `scripts/revision-new.test.mjs`
- Modify: `Vortex.Revisions/README.md` (new section)

**Interfaces:**
- Produces: `Vortex.Revisions/Releases/AMBREIA-yyyyMMddHHmm.json` in the Task 3 format; exports `readHeaderNames(text)`, `revisionId(date)`, `drawRelease(names, date, draw)` for the test.

- [ ] **Step 1: Write the failing test**

```js
// scripts/revision-new.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawRelease, readHeaderNames, revisionId} from './revision-new.mjs';

const HEADERS = `
namespace X;
internal static class MessageEvent
{
    public const int ClientHelloMessageEvent = 4000;
    public const int PongMessageEvent = 362; // comment
    public const int SSOTicketMessageEvent = 882;
}
internal static class MessageComposer
{
    public const int DisconnectReasonComposer = 4000;
    public const int PingMessageComposer = 1407;
}
`;

test('reads every constant name of both classes', () =>
{
    assert.deepEqual(readHeaderNames(HEADERS), {
        events: ['ClientHelloMessageEvent', 'PongMessageEvent', 'SSOTicketMessageEvent'],
        composers: ['DisconnectReasonComposer', 'PingMessageComposer']
    });
});

test('the revision is named after the UTC minute it was drawn', () =>
{
    assert.equal(revisionId(new Date(Date.UTC(2026, 9, 8, 15, 30, 59))), 'AMBREIA-202610081530');
});

test('draws distinct ids in 1..3999 and keeps the two fixed ones on 4000', () =>
{
    const release = drawRelease(readHeaderNames(HEADERS), new Date(Date.UTC(2026, 9, 8, 15, 30)));

    assert.equal(release.revision, 'AMBREIA-202610081530');
    assert.equal(release.events.ClientHelloMessageEvent, 4000);
    assert.equal(release.composers.DisconnectReasonComposer, 4000);

    for(const [side, fixed] of [['events', 'ClientHelloMessageEvent'], ['composers', 'DisconnectReasonComposer']])
    {
        const drawn = Object.entries(release[side]).filter(([name]) => name !== fixed).map(([, id]) => id);

        assert.equal(new Set(drawn).size, drawn.length);
        assert.ok(drawn.every(id => Number.isInteger(id) && id >= 1 && id <= 3999));
    }
});

test('the draw comes from the given source, so two draws differ', () =>
{
    const names = readHeaderNames(HEADERS);
    const date = new Date(Date.UTC(2026, 9, 8, 15, 30));
    let n = 0;
    const counting = (min, max) => min + (n++ % (max - min));

    assert.notDeepEqual(drawRelease(names, date, counting).events, drawRelease(names, date, () => 1).events);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test scripts/revision-new.test.mjs` → FAIL (module not found).

- [ ] **Step 3: Implement**

```js
#!/usr/bin/env node
// Draws a production revision: every id of Vortex.Revisions/Revision20260701/Headers.cs re-drawn at
// random, written to Vortex.Revisions/Releases/AMBREIA-<UTC yyyyMMddHHmm>.json, which the server
// embeds and loads in production (ReleaseRevision) and the client's production build inlines.
// Spec: vortex-rpg-client docs/superpowers/specs/2026-10-08-random-header-revisions-design.md.
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {randomInt} from 'node:crypto';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEADERS = join(ROOT, 'Vortex.Revisions', 'Revision20260701', 'Headers.cs');
const RELEASES = join(ROOT, 'Vortex.Revisions', 'Releases');

// Read before the server knows the client's table / must reach a client on any table.
const FIXED = {events: 'ClientHelloMessageEvent', composers: 'DisconnectReasonComposer'};
const FIXED_ID = 4000;
const MAX_ID = 3999;

const CLASS_RE = /^\s*(?:internal|public)\s+static\s+class\s+(MessageEvent|MessageComposer)\b/;
const CONST_RE = /^\s*public\s+const\s+int\s+(\w+)\s*=/;

export function readHeaderNames(text)
{
    const names = {events: [], composers: []};
    let side = null;

    for(const line of text.split(/\r?\n/))
    {
        const cls = CLASS_RE.exec(line);

        if(cls) side = cls[1] === 'MessageEvent' ? 'events' : 'composers';

        const constant = CONST_RE.exec(line);

        if(constant && side) names[side].push(constant[1]);
    }

    return names;
}

export function revisionId(date)
{
    const pad = (value) => String(value).padStart(2, '0');

    return `AMBREIA-${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`;
}

/** `draw(min, max)` returns an integer in [min, max): crypto.randomInt by default. */
export function drawRelease(names, date = new Date(), draw = randomInt)
{
    const release = {revision: revisionId(date), events: {}, composers: {}};

    for(const side of ['events', 'composers'])
    {
        // Fisher–Yates over 1..3999, then one id per name: distinct by construction.
        const pool = Array.from({length: MAX_ID}, (_, i) => i + 1);

        for(let i = pool.length - 1; i > 0; i--)
        {
            const j = draw(0, i + 1);

            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        let next = 0;

        for(const name of names[side])
        {
            release[side][name] = name === FIXED[side] ? FIXED_ID : pool[next++];
        }
    }

    return release;
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const release = drawRelease(readHeaderNames(readFileSync(HEADERS, 'utf8')));
    const target = join(RELEASES, `${release.revision}.json`);

    // Two draws in one minute would share a name; the first may already be deployed.
    if(existsSync(target))
    {
        console.error(`revision-new: ${target} already exists. Wait a minute and draw again.`);
        process.exit(1);
    }

    mkdirSync(RELEASES, {recursive: true});
    writeFileSync(target, `${JSON.stringify(release, null, 2)}\n`);
    console.log(`revision-new: wrote ${target} (${Object.keys(release.events).length} events, ${Object.keys(release.composers).length} composers).`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/revision-new.test.mjs` → PASS (4 tests).

- [ ] **Step 5: Document**

Append to `Vortex.Revisions/README.md`:
```markdown
## Production revisions

A production server speaks a `ReleaseRevision`, never `AMBREIA-DEV` (its ids are in this repository).

1. `node scripts/revision-new.mjs` draws every id of `Revision20260701/Headers.cs` again into
   `Releases/AMBREIA-<UTC yyyyMMddHHmm>.json`; `ClientHelloMessageEvent` and `DisconnectReasonComposer`
   stay on 4000. Commit the file.
2. The file is embedded in `Vortex.Revisions.dll`; outside Development (or with
   `Vortex:Revisions:Release=true`) the server loads the newest one and refuses to start if it does not
   cover every message the dev revision maps.
3. Build the client against the same file (`AMBREIA_RELEASE=<path> pnpm build` in vortex-rpg-client),
   deploy both. A client on another revision is sent DisconnectReason 122 and offered a reload.

Spec: `vortex-rpg-client/docs/superpowers/specs/2026-10-08-random-header-revisions-design.md`.
```

- [ ] **Step 6: Commit (emulator)**

```bash
git -C ../vortex-rpg-emulator commit -m "révisions : scripts/revision-new.mjs tire une révision de production

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- scripts/revision-new.mjs scripts/revision-new.test.mjs Vortex.Revisions/README.md
```

---

### Task 7: le build du client inline les numéros d'une révision

**Files:**
- Modify: `packages/vortex-engine/tools/lib/headers.mjs` (add `parseRelease`, `latestReleaseFile`), `packages/vortex-engine/tools/lib/headers.test.mjs`
- Create: `packages/vortex-client/tools/vite-plugin-release.mjs`, `packages/vortex-client/tools/vite-plugin-release.test.mjs`

**Interfaces:**
- Consumes: `emulatorCandidates(repoDir, dotGitText)` from `headers.mjs`; the release JSON of Task 6.
- Produces:
  - `parseRelease(text) → {revision: string, incoming: Map<string,number>, outgoing: Map<string,number>}` (client sense: `incoming` = the JSON's `composers`, `outgoing` = its `events`); throws on a malformed file.
  - `latestReleaseFile(dir) → string | null` (full path of the newest `AMBREIA-<12 digits>.json`).
  - `inlineHeaders(code, release, file) → string`; `releaseModule(release) → string`; `findReleaseFile({env, repoRoot}) → string`; `release({repoRoot}) → Plugin[]`.

- [ ] **Step 1: Write the failing tests**

Append to `packages/vortex-engine/tools/lib/headers.test.mjs` (add `parseRelease, latestReleaseFile` to its import, plus `import {mkdtempSync, writeFileSync} from 'node:fs'; import {tmpdir} from 'node:os'; import {join} from 'node:path';` if not already there):
```js
const RELEASE = JSON.stringify({revision: 'AMBREIA-202610081530', events: {PongMessageEvent: 17}, composers: {PingMessageComposer: 42}});

test('a release table reads in the client\'s sense: composers come in, events go out', () =>
{
    const release = parseRelease(RELEASE);

    assert.equal(release.revision, 'AMBREIA-202610081530');
    assert.deepEqual([...release.incoming], [['PingMessageComposer', 42]]);
    assert.deepEqual([...release.outgoing], [['PongMessageEvent', 17]]);
});

test('a malformed release table is refused', () =>
{
    assert.throws(() => parseRelease(JSON.stringify({revision: 'v1', events: {}, composers: {}})), /revision/);
    assert.throws(() => parseRelease(JSON.stringify({revision: 'AMBREIA-202610081530', events: {A: 'x'}, composers: {}})), /A/);
});

test('the newest release is the last by name', () =>
{
    const dir = mkdtempSync(join(tmpdir(), 'releases-'));

    for(const name of ['AMBREIA-202610081530.json', 'AMBREIA-202612010900.json', 'notes.txt']) writeFileSync(join(dir, name), '{}');

    assert.equal(latestReleaseFile(dir), join(dir, 'AMBREIA-202612010900.json'));
    assert.equal(latestReleaseFile(join(dir, 'missing')), null);
});
```

```js
// packages/vortex-client/tools/vite-plugin-release.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inlineHeaders, releaseModule} from './vite-plugin-release.mjs';

const release = {
    revision: 'AMBREIA-202610081530',
    incoming: new Map([['AuthenticationOKMessageComposer', 412]]),
    outgoing: new Map([['SSOTicketMessageEvent', 1873]])
};

test('header names become numbers', () =>
{
    assert.equal(
        inlineHeaders('a.set(Outgoing.SSOTicketMessageEvent, X); b(Incoming.AuthenticationOKMessageComposer);', release, 'f.ts'),
        'a.set(1873, X); b(412);'
    );
});

test('a name the release does not have fails the build, naming file and message', () =>
{
    assert.throws(() => inlineHeaders('x(Outgoing.GoneMessageEvent)', release, 'src/f.ts'), /src\/f\.ts.*Outgoing\.GoneMessageEvent.*AMBREIA-202610081530/);
});

test('the headers module of a release build carries the revision and no name', () =>
{
    const module = releaseModule(release);

    assert.match(module, /export const REVISION = "AMBREIA-202610081530";/);
    assert.doesNotMatch(module, /SSOTicketMessageEvent|AuthenticationOKMessageComposer/);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test packages/vortex-engine/tools/lib/headers.test.mjs packages/vortex-client/tools/vite-plugin-release.test.mjs` → FAIL (exports missing / module not found).

- [ ] **Step 3: Implement**

In `headers.mjs` (add `readdirSync`, `existsSync` from `node:fs` to the imports):
```js
const RELEASE_RE = /^AMBREIA-\d{12}$/;
const RELEASE_FILE_RE = /^AMBREIA-\d{12}\.json$/;

function releaseSide(table, key)
{
    if(!table || typeof table !== 'object') throw new Error(`release: "${key}" is not an object`);

    return new Map(Object.entries(table).map(([name, id]) =>
    {
        if(!Number.isInteger(id)) throw new Error(`release: ${key}.${name} is not an integer`);

        return [name, id];
    }));
}

/** A production revision (vortex-rpg-emulator scripts/revision-new.mjs), in the client's sense. */
export function parseRelease(text)
{
    const json = JSON.parse(text);

    if(!RELEASE_RE.test(json.revision ?? '')) throw new Error(`release: revision "${json.revision}" is not AMBREIA-yyyyMMddHHmm`);

    return {revision: json.revision, incoming: releaseSide(json.composers, 'composers'), outgoing: releaseSide(json.events, 'events')};
}

export function latestReleaseFile(dir)
{
    if(!existsSync(dir)) return null;

    const newest = readdirSync(dir).filter(name => RELEASE_FILE_RE.test(name)).sort().pop();

    return newest ? join(dir, newest) : null;
}
```

```js
// packages/vortex-client/tools/vite-plugin-release.mjs
// No shebang: Vite inlines this module into the compiled vite.config (see vite-plugin-engine-bundle.mjs).
//
// Production build only. Replaces every `Incoming.X` / `Outgoing.X` with the id of a release revision
// and serves Headers.generated as just its REVISION, so the bundle carries numbers and no message
// name: a bot has to recognise each message by its shape, as with Habbo's obfuscated client.
// Spec: docs/superpowers/specs/2026-10-08-random-header-revisions-design.md §4.4.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {emulatorCandidates, latestReleaseFile, parseRelease} from '../../vortex-engine/tools/lib/headers.mjs';

const MEMBER_RE = /\b(Incoming|Outgoing)\.([A-Za-z_]\w*)/g;
const HEADERS_IMPORT_RE = /(^|[\\/])Headers\.generated(\.ts)?$/;
const VIRTUAL_ID = '\0ambreia-release-headers';

export function inlineHeaders(code, release, file)
{
    return code.replace(MEMBER_RE, (match, side, name) =>
    {
        const id = (side === 'Incoming' ? release.incoming : release.outgoing).get(name);

        if(id === undefined) throw new Error(`${file}: ${side}.${name} is not in release ${release.revision}`);

        return String(id);
    });
}

/** Incoming/Outgoing stay exported (their imports must resolve) but empty: every use was inlined. */
export function releaseModule(release)
{
    return `export const REVISION = ${JSON.stringify(release.revision)};\nexport const Incoming = {};\nexport const Outgoing = {};\n`;
}

export function findReleaseFile({env, repoRoot})
{
    if(env.AMBREIA_RELEASE) return env.AMBREIA_RELEASE;

    for(const emulator of emulatorCandidates(repoRoot, null))
    {
        const file = latestReleaseFile(join(emulator, 'Vortex.Revisions', 'Releases'));

        if(file) return file;
    }

    throw new Error('No release revision: set AMBREIA_RELEASE to its JSON, or draw one with '
        + '`node scripts/revision-new.mjs` in ../vortex-rpg-emulator.');
}

export function release({repoRoot})
{
    let table = null;

    return [
        {
            name: 'ambreia:release-headers',
            apply: 'build',
            enforce: 'pre',
            buildStart()
            {
                const file = findReleaseFile({env: process.env, repoRoot});

                table = parseRelease(readFileSync(file, 'utf8'));
                this.info(`release ${table.revision} (${file})`);
            },
            resolveId(source)
            {
                return HEADERS_IMPORT_RE.test(source) ? VIRTUAL_ID : null;
            },
            load(id)
            {
                return id === VIRTUAL_ID ? releaseModule(table) : null;
            }
        },
        {
            // After esbuild: TypeScript is gone and so are comments, which name `Incoming.X` in prose.
            name: 'ambreia:release-inline',
            apply: 'build',
            enforce: 'post',
            transform(code, id)
            {
                if(id.includes('node_modules') || !/\b(?:Incoming|Outgoing)\./.test(code)) return null;

                return {code: inlineHeaders(code, table, id), map: null};
            }
        }
    ];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test packages/vortex-engine/tools/lib/headers.test.mjs packages/vortex-client/tools/vite-plugin-release.test.mjs` → PASS.

- [ ] **Step 5: Gate and commit**

`pnpm check` → green; show the last lines.
```bash
git commit -m "build : le plugin release inline les numéros d'une révision de production

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- packages/vortex-engine/tools/lib/headers.mjs packages/vortex-engine/tools/lib/headers.test.mjs packages/vortex-client/tools/vite-plugin-release.mjs packages/vortex-client/tools/vite-plugin-release.test.mjs
```

---

### Task 8: le build de prod ne laisse aucun nom ni source map

**Files:**
- Modify: `packages/vortex-client/vite.config.ts` (plugins, `build.sourcemap`), `packages/vortex-client/package.json` (`build` script), `Dockerfile` (around line 61–64), `CLAUDE.md` (Commands: `pnpm build` line), then `pnpm sync:agents`
- Create: `packages/vortex-client/tools/check-release-bundle.mjs`, `packages/vortex-client/tools/check-release-bundle.test.mjs`

**Interfaces:**
- Consumes: `release`, `findReleaseFile` (Task 7); `parseRelease` (Task 7).
- Produces: `findLeaks(files: {name, text}[], names: string[]) → {file, name}[]`; `pnpm build` fails if a name or a `.map` reaches `dist/`.

- [ ] **Step 1: Write the failing test**

```js
// packages/vortex-client/tools/check-release-bundle.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findLeaks} from './check-release-bundle.mjs';

test('a message name in a script of the bundle is a leak', () =>
{
    assert.deepEqual(
        findLeaks([{name: 'index.js', text: 'x.set(1873,a);"SSOTicketMessageEvent"'}, {name: 'other.js', text: 'y(412)'}], ['SSOTicketMessageEvent', 'PingMessageComposer']),
        [{file: 'index.js', name: 'SSOTicketMessageEvent'}]
    );
});

test('a source map is a leak whatever it holds', () =>
{
    assert.deepEqual(findLeaks([{name: 'index.js.map', text: '{}'}], []), [{file: 'index.js.map', name: '(source map)'}]);
});

test('a name inside a longer identifier is not a leak', () =>
{
    assert.deepEqual(findLeaks([{name: 'a.js', text: 'MySSOTicketMessageEventX'}], ['SSOTicketMessageEvent']), []);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test packages/vortex-client/tools/check-release-bundle.test.mjs` → FAIL (module not found).

- [ ] **Step 3: Implement the check**

```js
#!/usr/bin/env node
// Runs after `vite build`: the production bundle must hold no message name and no source map,
// or the release revision's random ids can be read back in seconds (spec 2026-10-08 §4.4).
import {readdirSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseRelease} from '../../vortex-engine/tools/lib/headers.mjs';
import {findReleaseFile} from './vite-plugin-release.mjs';

export function findLeaks(files, names)
{
    const leaks = [];

    for(const {name: file, text} of files)
    {
        if(file.endsWith('.map'))
        {
            leaks.push({file, name: '(source map)'});
            continue;
        }

        for(const name of names)
        {
            if(new RegExp(`(?<![\\w$])${name}(?![\\w$])`).test(text)) leaks.push({file, name});
        }
    }

    return leaks;
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const client = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const dist = join(client, 'dist', 'assets');
    const release = parseRelease(readFileSync(findReleaseFile({env: process.env, repoRoot: resolve(client, '..', '..')}), 'utf8'));
    const names = [...release.incoming.keys(), ...release.outgoing.keys()];
    const files = readdirSync(dist).filter(file => file.endsWith('.js') || file.endsWith('.map'))
        .map(file => ({name: file, text: file.endsWith('.map') ? '' : readFileSync(join(dist, file), 'utf8')}));
    const leaks = findLeaks(files, names);

    if(leaks.length > 0)
    {
        for(const leak of leaks) console.error(`check-release-bundle: ${leak.file} leaks ${leak.name}`);
        process.exit(1);
    }

    console.log(`check-release-bundle: ${files.length} scripts, no message name (${release.revision}).`);
}
```

- [ ] **Step 4: Wire the build**

`vite.config.ts`: add `import {release} from './tools/vite-plugin-release.mjs';`, add to `plugins` (after `imagerServer()`):
```ts
        // build-only; inlines the ids of the newest release revision and strips the message names
        // (AMBREIA_RELEASE=<json> to pick another). Spec 2026-10-08-random-header-revisions §4.4.
        release({repoRoot: resolve(__dirname, '../..')}),
```
and in `build`:
```ts
    build: {
        target: 'ES2022',
        // Off: a source map is the original source, message names included (spec 2026-10-08 §4.4).
        sourcemap: false,
    },
```
`packages/vortex-client/package.json`: `"build": "tsc && vite build && node ./tools/check-release-bundle.mjs"`.

`Dockerfile` (show the owner the diff first: it has uncommitted changes): before the `RUN pnpm --filter vortex-client build` line add
```dockerfile
# The release revision the client is built for (vortex-rpg-emulator Vortex.Revisions/Releases/*.json),
# copied into the build context by the deploy: docker build --build-arg AMBREIA_RELEASE=release.json .
ARG AMBREIA_RELEASE
ENV AMBREIA_RELEASE=${AMBREIA_RELEASE:+/app/${AMBREIA_RELEASE}}
```
(Adjust `/app/` to the Dockerfile's `WORKDIR` at that stage.)

`CLAUDE.md`, Commands block: replace the `pnpm build` line with
```
pnpm build                   # production build: needs a release revision (AMBREIA_RELEASE=<json>, else the newest in ../vortex-rpg-emulator/Vortex.Revisions/Releases)
```
then run `pnpm sync:agents`.

- [ ] **Step 5: Verify against a real release**

1. `node ../vortex-rpg-emulator/scripts/revision-new.mjs` → note the written path (do not commit this draw unless Task 10 deploys it; delete it afterwards otherwise).
2. `pnpm build > "$TEMP/client-build.log" 2>&1; echo exit=$?` → `exit=0`; the log ends with `check-release-bundle: … no message name (AMBREIA-…)`.
3. `ls packages/vortex-client/dist/assets/*.map` → no such file.
4. Negative check: temporarily add `console.log('SSOTicketMessageEvent');` to `packages/vortex-client/src/App.ts`, run `pnpm build` → it must fail with `leaks SSOTicketMessageEvent`; revert the line.

If step 2 reports leaks that are real code (a class or string named like a message), report them rather than silencing the check.

- [ ] **Step 6: Gate and commit**

`node --test packages/vortex-client/tools/check-release-bundle.test.mjs` → PASS; `pnpm check` → green.
```bash
git commit -m "build : le client de prod n'emporte ni nom de message ni source map

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- packages/vortex-client/vite.config.ts packages/vortex-client/package.json packages/vortex-client/tools/check-release-bundle.mjs packages/vortex-client/tools/check-release-bundle.test.mjs CLAUDE.md AGENTS.md .github/copilot-instructions.md
```
Commit `Dockerfile` separately once the owner has approved its diff.

---

### Task 9: « Une mise à jour est disponible »

**Files:**
- Modify: `packages/ambreia-protocol/src/incoming/handshake/DisconnectReasonMessageEvent.ts:35-65` (named constant), `packages/ambreia-game/src/communication/demo/HabboCommunicationDemo.ts` (`disconnected()`, ~lines 455–490; new `alertUpdateRequired()`)

**Interfaces:**
- Consumes: reason 122 from the server (Task 5); `IHabboWindowManager.alert(title, message, flags, callback)`; localization keys `disconnect.updaterequired.title` / `.description` (present in every language file).
- Produces: `static readonly INCOMPATIBLE_CLIENT_VERSION = 122` on `DisconnectReasonMessageEvent`.

- [ ] **Step 1: Name the reason**

In `DisconnectReasonMessageEvent`, add
```ts
    /** The server does not speak this client's revision: a newer client has been deployed. */
    static readonly INCOMPATIBLE_CLIENT_VERSION = 122;
```
and use it in the `resolveDisconnectedReasonLocalizationKey` switch in place of `case 122:`.

- [ ] **Step 2: Show the update dialog**

In `HabboCommunicationDemo.disconnected(reason, reasonText)`, right after the `DISCONNECTED` event is emitted and before the reason key is computed:
```ts
        if(reason === DisconnectReasonMessageEvent.INCOMPATIBLE_CLIENT_VERSION)
        {
            this.alertUpdateRequired();

            return;
        }
```
and add, before `dispose()` (which stays last):
```ts
    /**
     * The server moved to a newer revision. Reloading fetches the new bundle; the query is dropped
     * because its ?sso= ticket is spent (see alert(): a plain reload re-boots against a dead ticket).
     */
    private alertUpdateRequired(): void
    {
        const reload = (): void => window.location.replace(window.location.pathname);

        if(!this._windowManager)
        {
            reload();

            return;
        }

        this._windowManager.alert('${disconnect.updaterequired.title}', '${disconnect.updaterequired.description}', 0, (dialog) =>
        {
            dialog.dispose();
            reload();
        });
    }
```

- [ ] **Step 3: Gate**

`pnpm check` → green; show the last lines. (The behaviour is verified end to end in Task 10.)

- [ ] **Step 4: Commit**

```bash
git commit -m "connexion : un client périmé propose de recharger (raison 122)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NcoyBrcEymYLnsjyMucYaq" -- packages/ambreia-protocol/src/incoming/handshake/DisconnectReasonMessageEvent.ts packages/ambreia-game/src/communication/demo/HabboCommunicationDemo.ts
```

---

### Task 10: vérification de bout en bout

Needs a test account with a character; ask the owner for one before Step 3.

- [ ] **Step 1: Draw a release and start the emulator on it**

`node ../vortex-rpg-emulator/scripts/revision-new.mjs`, rebuild the emulator (the JSON is embedded), start it in Development with `VORTEX__Vortex__Revisions__Release=true`. Its log must show the session default revision `AMBREIA-…` (not `AMBREIA-DEV`).

- [ ] **Step 2: Production client against it**

`pnpm build`, then `pnpm --filter vortex-client preview` (it reuses the dev server's proxies). With the `run-vortex-client` driver: `node .claude/skills/run-vortex-client/driver.mjs "goto http://localhost:4173/" "wait 6000" "ss release-boot" errors net`.

- [ ] **Step 3: Log in and enter the game**

Log in with the owner's test account through the login screen, choose the character, enter the world: `ss release-ingame`. Read both screenshots; `errors` and `net` must be clean.

- [ ] **Step 4: Outdated client**

Against the same emulator, open the dev client (`http://localhost:5173/client/`, announces `AMBREIA-DEV`), log in: the "Update required" dialog must appear (`ss outdated`); clicking OK reloads the page without its query.

- [ ] **Step 5: Report and clean up**

Report each screenshot and what it shows. Delete the drawn JSON from `Vortex.Revisions/Releases/` unless the owner wants to deploy it, and restart the emulator without `Release=true`.
