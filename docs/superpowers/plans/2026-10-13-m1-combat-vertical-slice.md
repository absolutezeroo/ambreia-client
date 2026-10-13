# M1 Combat vertical slice, côté client : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** la boucle de combat complète se joue sans commande dev (sélection sans attaque, attaque auto, cible de la cible, menace, KO avec offre de résurrection, level-up, combat log), sur un modèle de combat à un seul écrivain qui survit au resync, et les AvatarEffects Habbo disparaissent.

**Architecture :**
- **`features/combat/CombatModel.ts`** est le seul état de combat ; `ICombat.ts` l'expose. Les quatre sessions réseau écrivent dedans, les vues lisent ses événements.
- **`features/hud`** gagne le bouton Attaque, le cadre cible de la cible, la jauge de menace, le kit de toasts ; `features/combat` gagne le panneau KO, le panneau level-up, le canal `combat` du chat, les auras.
- **`@ambreia/protocol`** gagne sept messages new-style ; **`@ambreia/common`** gagne `platform().now()`.
- **Retrait** : la chaîne 2624 et les 237 effets Habbo ; `EffectAssetDownloadManager` devient `AvatarAnimationAssets`.

**Tech Stack :** TypeScript, PixiJS v8, `node:test` via tsx, `MessageMap`, layouts XML Habbo (skill design-habbo-window, rendu Glaze).

**Spec :** `docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md`. **Prérequis :** le plan serveur `../vortex-rpg-emulator/docs/superpowers/plans/2026-10-13-rpg-combat-m1d.md` au moins jusqu'à sa tâche 1 (headers), puis `pnpm gen:headers`.

## Global Constraints

- **Headers** (après `pnpm gen:headers`) : `Incoming.RpgTargetsMessageComposer` 9027, `RpgThreatMessageComposer` 9028, `RpgResurrectOfferMessageComposer` 9029, `RpgLevelUpMessageComposer` 9030, `RpgAutoAttackStateMessageComposer` 9031 ; `Outgoing.RpgAutoAttackMessageEvent` 9016, `RpgDeathChoiceMessageEvent` 9017. Jamais un id en dur : `Headers.generated.ts`.
- **Ordre des champs** : celui du plan serveur, Global Constraints. 9030 porte `fromLevel`, `toLevel`, deux blocs de stats (`readRpgStatBlock`), puis la liste des skills appris.
- **Quatre fichiers par message** : `incoming|outgoing/rpg/<domaine>/X.ts`, `parser|serializer/rpg/<domaine>/XParser|XSerializer.ts` ; les listes lisent `readCount`.
- **Une feature n'importe une autre que par son `I*.ts`** (ESLint) ; `host.made.combat` reste typé `RpgCombatSession` dans `EngineHost`, qui expose `model: ICombatModel`.
- **Horloge** : `platform().now()` partout dans le modèle ; jamais `Date.now()` pour un timer.
- **Textes** : `packages/vortex-client/src/locales/{fr,en}/hud.json`, clés `vortex.combat.*` ; les noms de contenu par `WindowBits.contentName`.
- **Layouts** : `packages/vortex-client/src/vortex-layouts/*.xml`, repris automatiquement par `App.ts` ; auteur : skill design-habbo-window, thème sombre, rendu Glaze avant le branchement.
- **Commits** par chemins explicites, avec `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- **Porte** : `pnpm check` vert ; une tâche visible se vérifie avec run-vortex-client (compte mage de test).

## Décisions de ce plan (écarts assumés à la spec)

1. **`RpgLevelUp` est un message par gain d'XP** (`fromLevel`, `toLevel`) : la fusion côté client disparaît (décision 1 du plan serveur).
2. **Les auras passent par `CombatVfx.loop()`**, qui joue déjà une sheet en boucle sur le corps, les pieds ou le sol (`SheetAddition`) : pas de classe `AuraAddition`, la spec §5 nommait un mécanisme qui existe.
3. **La rafale se termine sur `RpgSelfVitals`** : le modèle ouvre `resyncing` à `reset(epoch)` et le ferme sur ce message.
4. **Le panneau KO et le panneau level-up vivent dans `features/combat`** (ils lisent le modèle) ; le cadre cible de la cible et la menace dans `features/hud` (ce sont des panneaux du HUD, nourris par `IHudPanels`).

## Review Focus

1. **Un `RpgVitals` du joueur arrive pendant `resyncing` avec de la vie alors qu'il était KO** (il a été relâché pendant un changement de zone) : l'état de mort redevient `alive` sans ligne de log. Test : Tâche 3, `a burst that stands the player up closes ko quietly`.
2. **`RpgTargets` nomme un objet que le modèle ne connaît pas encore** (le `Users` du spawn arrive après ses vitals) : le cadre cible de la cible attend son nom, pas de `undefined` affiché. Test : Tâche 6, `an unknown target of target shows nothing until named`.
3. **Deux clics rapides sur Relâcher** : un seul `RpgDeathChoice`, le bouton se grise après le premier. Test : Tâche 7, `release sends once`.
4. **Un `RpgThreat` d'une cible déjà remplacée** (course entre le changement de cible et le tick serveur) : ignoré si `monsterObjectId` n'est pas la cible courante. Test : Tâche 3, `threat of another monster is ignored`.
5. **Le statut qui disparaît d'un 9023 vide** (`[]` après la mort d'un monstre) : une ligne « expiré » par statut, pas une exception. Test : Tâche 3, `an empty status list expires everything`.

---

### Task 1 : Protocole — sept messages new-style

**Files :**
- Create : `packages/ambreia-protocol/src/incoming/rpg/combat/{RpgTargetsMessage,RpgThreatMessage,RpgResurrectOfferMessage,RpgAutoAttackStateMessage}.ts`, `incoming/rpg/characters/RpgLevelUpMessage.ts`, `outgoing/rpg/combat/{RpgAutoAttackMessage,RpgDeathChoiceMessage}.ts`
- Create : `parser/rpg/combat/{RpgTargets,RpgThreat,RpgResurrectOffer,RpgAutoAttackState}MessageParser.ts`, `parser/rpg/characters/RpgLevelUpMessageParser.ts`, `serializer/rpg/combat/{RpgAutoAttack,RpgDeathChoice}MessageSerializer.ts`
- Modify : `packages/ambreia-protocol/src/NewStyleHeaders.ts`
- Test : `packages/ambreia-protocol/test/rpg-combat.test.ts`, `rpg-characters.test.ts`

**Interfaces :**
- Produces : `RpgTargetsMessage.entries: readonly IRpgTargetEntry[]` (`objectId`, `targetObjectId`), `RpgThreatMessage {monsterObjectId, percent, hasAggro}`, `RpgResurrectOfferMessage {casterObjectId, healthPercent, expiresMs}`, `RpgAutoAttackStateMessage {active}`, `RpgLevelUpMessage {fromLevel, toLevel, statsBefore: IRpgStatBlock, statsAfter: IRpgStatBlock, skillsLearned: readonly string[]}`, `RpgAutoAttackMessage(active)`, `RpgDeathChoiceMessage(choice)` avec `DeathChoice = 'wait' | 'release' | 'accept' | 'decline'`.

- [ ] **Step 1 : `pnpm gen:headers`** puis `git diff packages/ambreia-protocol/src/Headers.generated.ts` montre les sept constantes.

- [ ] **Step 2 : Tests**

Dans `rpg-combat.test.ts` (avec `wire()` du fichier) :

```ts
test('RpgTargets, RpgThreat, RpgResurrectOffer and RpgAutoAttackState read in the server order', () =>
{
    assert.deepEqual(new RpgTargetsMessageParser().parse(wire(2, 4, 0, 9, 1)).entries, [{objectId: 4, targetObjectId: 0}, {objectId: 9, targetObjectId: 1}]);
    assert.deepEqual({...new RpgThreatMessageParser().parse(wire(9, 80, false))}, {monsterObjectId: 9, percent: 80, hasAggro: false});
    assert.deepEqual({...new RpgResurrectOfferMessageParser().parse(wire(2, 35, 30000))}, {casterObjectId: 2, healthPercent: 35, expiresMs: 30000});
    assert.equal(new RpgAutoAttackStateMessageParser().parse(wire(true)).active, true);
    assert.throws(() => new RpgThreatMessageParser().parse(wire(9, 80)), /past the end/);
});

test('RpgAutoAttack and RpgDeathChoice write their one field', () =>
{
    assert.deepEqual(new RpgAutoAttackMessageSerializer().serialize(new RpgAutoAttackMessage(true)), [true]);
    assert.deepEqual(new RpgDeathChoiceMessageSerializer().serialize(new RpgDeathChoiceMessage('release')), ['release']);
});
```

Dans `rpg-characters.test.ts` (le fichier a son propre `wire()` et un bloc de dix entiers pour les stats ; `stats(n)` = dix entiers dont `maxHealth` = n) :

```ts
test('RpgLevelUp reads both stat blocks then the skills learned', () =>
{
    const message = new RpgLevelUpMessageParser().parse(wire(3, 4, ...stats(100), ...stats(112), 1, 'skill.mage.frost_nova'));

    assert.equal(message.fromLevel, 3);
    assert.equal(message.toLevel, 4);
    assert.equal(message.statsBefore.maxHealth, 100);
    assert.equal(message.statsAfter.maxHealth, 112);
    assert.deepEqual(message.skillsLearned, ['skill.mage.frost_nova']);
});
```

- [ ] **Step 3 : Vérifier l'échec** — `pnpm exec tsx --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-protocol/test/rpg-combat.test.ts` → import introuvable.

- [ ] **Step 4 : Les messages**

`RpgTargetsMessage.ts` :

```ts
/** Who aims at whom (M1d §2.1): full in the zone's entry burst, then the tick's changes. */
export interface IRpgTargetEntry
{
    readonly objectId: number;
    /** 0: none. */
    readonly targetObjectId: number;
}

export class RpgTargetsMessage
{
    constructor(readonly entries: readonly IRpgTargetEntry[]) {}
}
```

`RpgThreatMessage.ts`, `RpgResurrectOfferMessage.ts`, `RpgAutoAttackStateMessage.ts`, `RpgLevelUpMessage.ts` : une classe à constructeur `readonly` par champ, dans l'ordre du fil, avec le docblock `(M1d §2.1)`. `RpgLevelUpMessage` importe `IRpgStatBlock` de `incoming/rpg/characters/IRpgStatBlock`.

Parseurs (modèle `RpgVitalsMessageParser` pour la liste, `RpgSelfVitalsMessageParser` pour les plats) :

```ts
// RpgTargetsMessageParser
const count = readCount(wrapper);
const entries: IRpgTargetEntry[] = [];
for(let i = 0; i < count; i++) entries.push({objectId: wrapper.readInt(), targetObjectId: wrapper.readInt()});
return new RpgTargetsMessage(entries);
// RpgThreatMessageParser
return new RpgThreatMessage(wrapper.readInt(), wrapper.readInt(), wrapper.readBoolean());
// RpgResurrectOfferMessageParser
return new RpgResurrectOfferMessage(wrapper.readInt(), wrapper.readInt(), wrapper.readInt());
// RpgAutoAttackStateMessageParser
return new RpgAutoAttackStateMessage(wrapper.readBoolean());
// RpgLevelUpMessageParser
const fromLevel = wrapper.readInt();
const toLevel = wrapper.readInt();
const statsBefore = readRpgStatBlock(wrapper);
const statsAfter = readRpgStatBlock(wrapper);
const count = readCount(wrapper, 2);
const skillsLearned: string[] = [];
for(let i = 0; i < count; i++) skillsLearned.push(wrapper.readString());
return new RpgLevelUpMessage(fromLevel, toLevel, statsBefore, statsAfter, skillsLearned);
```

Sortants :

```ts
/** Starts or stops the auto-attack on the current target (M1d §2.2). */
export class RpgAutoAttackMessage
{
    constructor(readonly active: boolean) {}
}

export type DeathChoice = 'wait' | 'release' | 'accept' | 'decline';

/** What the KO player chose (M1d §2.3). */
export class RpgDeathChoiceMessage
{
    constructor(readonly choice: DeathChoice) {}
}
```

Sérialiseurs : `return [message.active];` et `return [message.choice];`.

`NewStyleHeaders.ts` : les cinq `Incoming.*` sous un commentaire `// M1d Combat vertical slice (features/combat, interaction, character).`, les deux `Outgoing.*` en fin de liste.

- [ ] **Step 5 : Vérifier le vert** — `pnpm test` : les deux fichiers passent, `incoming-registered` et `outgoing-registered` aussi (plus aucun header non servi).

- [ ] **Step 6 : Commit** — `git commit -m "protocol: the seven M1d combat messages (targets, threat, resurrect offer, level-up, auto-attack, death choice)" -- packages/ambreia-protocol`

---

### Task 2 : `platform().now()`

**Files :**
- Modify : `packages/ambreia-common/src/platform/Platform.ts`, `packages/ambreia-avatar/tools/node-platform.mjs` (et tout autre `setPlatform({...})` : `grep -rn "setPlatform(" packages --include=*.ts --include=*.mjs`)
- Test : `packages/ambreia-common/test/platform.test.ts` (créer si absent)

- [ ] **Step 1 : Test**

```ts
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {platform, setPlatform, BROWSER_PLATFORM} from '../src/platform/Platform';

test('now() is monotonic and substitutable', () =>
{
    setPlatform({...BROWSER_PLATFORM, now: () => 42});
    assert.equal(platform().now(), 42);
    setPlatform(BROWSER_PLATFORM);
    const a = platform().now();
    assert.ok(platform().now() >= a);
});
```

- [ ] **Step 2 : Vérifier l'échec** — `pnpm exec tsx --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-common/test/platform.test.ts`.

- [ ] **Step 3 : Implémenter** — `IPlatform` gagne `/** A monotonic clock in ms, never the wall clock (a system clock change must not move a timer). */ now(): number;` ; `BROWSER_PLATFORM`: `now: () => performance.now()` ; `node-platform.mjs` : `now: () => performance.now()`.

- [ ] **Step 4 : Vérifier le vert** — même commande, puis `pnpm typecheck`.

- [ ] **Step 5 : Commit** — `git commit -m "common: platform().now(), the monotonic clock of the engines" -- packages/ambreia-common packages/ambreia-avatar/tools`

---

### Task 3 : `CombatModel`

**Files :**
- Create : `packages/ambreia-game/src/features/combat/ICombat.ts`, `features/combat/CombatModel.ts`
- Test : `packages/ambreia-game/test/combat-model.test.ts`

**Interfaces :**
- Produces (`ICombat.ts`) :

```ts
import type {EventEmitter} from 'eventemitter3';
import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';

export interface IVitals { health: number; maxHealth: number; mana: number | null; maxMana: number | null; }
export interface ITargetInfo { objectId: number; kind: string; name: string; level: number; classId: string; rank: string; }
export interface IThreat { percent: number; hasAggro: boolean; }
export interface IStatusEntry { statusId: string; /** Monotonic deadline, null for no end. */ endsAt: number | null; stacks: number; }
export interface ICastEntry { skillId: string; startedAt: number; durationMs: number; channel: boolean; targetObjectId: number; }
export interface IOffer { casterObjectId: number; healthPercent: number; expiresAt: number; }
export type DeathState = {kind: 'alive'} | {kind: 'ko'; autoReleaseAt: number | null; waiting: boolean; offer: IOffer | null};
export interface ISelf { inCombat: boolean; autoAttacking: boolean; death: DeathState; }
export type LogKind = 'dealt' | 'taken' | 'miss' | 'heal' | 'status' | 'cast' | 'death' | 'resurrect' | 'levelup' | 'refused';
export interface ILogEntry { at: number; kind: LogKind; key: string; params: Readonly<Record<string, string>>; }
export interface ILevelUp { fromLevel: number; toLevel: number; statsBefore: IRpgStatBlock; statsAfter: IRpgStatBlock; skillsLearned: readonly string[]; }

export interface ICombatModelEvents
{
    vitals: [objectId: number, vitals: IVitals];
    self: [ISelf];
    target: [ITargetInfo | null];
    /** The target's target (and every other aim) changed. */
    targets: [];
    threat: [IThreat | null];
    statuses: [objectId: number, statuses: readonly IStatusEntry[]];
    cast: [objectId: number, cast: ICastEntry | null];
    cooldowns: [globalEndsAt: number, byskill: ReadonlyMap<string, number>];
    log: [ILogEntry];
    levelUp: [ILevelUp];
    resynced: [];
}

export interface ICombatModel
{
    readonly events: EventEmitter<ICombatModelEvents>;
    readonly resyncing: boolean;
    readonly self: ISelf;
    readonly target: ITargetInfo | null;
    readonly threat: IThreat | null;
    readonly ownObjectId: number;
    vitalsOf(objectId: number): IVitals | null;
    targetOf(objectId: number): number;
    statusesOf(objectId: number): readonly IStatusEntry[];
    castOf(objectId: number): ICastEntry | null;
    readyAt(skillId: string): number;
    readonly globalReadyAt: number;
    readonly log: readonly ILogEntry[];
}
```

`CombatModel implements ICombatModel` a en plus les écritures : `reset(epoch: number)`, `setOwn(objectId)`, `setVitals(objectId, health, maxHealth)`, `setSelfVitals(health, maxHealth, mana, maxMana, inCombat)`, `setTarget(info | null)`, `setTargets(entries)`, `setThreat(monsterObjectId, percent, hasAggro)`, `setStatuses(objectId, entries: {statusId, remainingMs, stacks}[])`, `setCast(objectId, {skillId, durationMs, channel, targetObjectId})`, `endCast(objectId, reason, skillId)`, `setCooldowns(globalRemainingMs, skills)`, `setAutoAttacking(active)`, `setKo(respawnSeconds)`, `setOffer(casterObjectId, healthPercent, expiresMs)`, `declineOffer()`, `setWaiting()`, `reportHits(hits)`, `reportOutcomes(outcomes)`, `levelUp(message)`, `refused(code, skillId?)`.

- [ ] **Step 1 : Tests** (`combat-model.test.ts`, horloge substituée)

```ts
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setPlatform, BROWSER_PLATFORM} from '@ambreia/common/platform/Platform';
import {CombatModel} from '../src/features/combat/CombatModel';

let now = 1000;
setPlatform({...BROWSER_PLATFORM, now: () => now});

function fresh(): CombatModel
{
    const model = new CombatModel();
    model.reset(1);
    model.setOwn(1);
    model.setSelfVitals(100, 100, 50, 50, false); // closes the burst
    return model;
}

test('a status deadline is computed from remainingMs on the monotonic clock', () =>
{
    const model = fresh();
    model.setStatuses(1, [{statusId: 'status.focused', remainingMs: 4000, stacks: 1}, {statusId: 'status.shield', remainingMs: -1, stacks: 2}]);
    assert.deepEqual(model.statusesOf(1), [{statusId: 'status.focused', endsAt: 5000, stacks: 1}, {statusId: 'status.shield', endsAt: null, stacks: 2}]);
});

test('health has one writer: a stats maximum never lowers the current health', () =>
{
    const model = fresh();
    model.setVitals(1, 80, 120);
    assert.deepEqual(model.vitalsOf(1), {health: 80, maxHealth: 120, mana: 50, maxMana: 50});
});

test('the death machine: ko, wait, offer, accept', () =>
{
    const model = fresh();
    const seen: string[] = [];
    model.events.on('self', self => seen.push(self.death.kind));

    model.setKo(60);
    assert.deepEqual(model.self.death, {kind: 'ko', autoReleaseAt: 61000, waiting: false, offer: null});
    model.setWaiting();
    assert.equal((model.self.death as {autoReleaseAt: number | null}).autoReleaseAt, null);
    model.setOffer(2, 35, 30000);
    assert.deepEqual((model.self.death as {offer: unknown}).offer, {casterObjectId: 2, healthPercent: 35, expiresAt: 31000});
    model.declineOffer();
    assert.equal((model.self.death as {offer: unknown}).offer, null);
    // The server answers an accept with the player's vitals: that is what stands him up.
    model.setVitals(1, 35, 100);
    assert.equal(model.self.death.kind, 'alive');
    assert.deepEqual(seen, ['ko', 'ko', 'ko', 'ko', 'alive']);
});

test('a burst that stands the player up closes ko quietly', () =>
{
    const model = fresh();
    model.setKo(60);
    const logged: string[] = [];
    model.events.on('log', entry => logged.push(entry.kind));

    model.reset(2);
    assert.equal(model.resyncing, true);
    model.setOwn(1);
    model.setVitals(1, 50, 100);
    model.setSelfVitals(50, 100, 10, 50, false);

    assert.equal(model.resyncing, false);
    assert.equal(model.self.death.kind, 'alive');
    assert.deepEqual(logged, []);
});

test('reset then the burst rebuilds the same model as live', () =>
{
    const live = fresh();
    live.setVitals(9, 40, 40);
    live.setStatuses(9, [{statusId: 'status.burn', remainingMs: 3000, stacks: 1}]);
    live.setTargets([{objectId: 9, targetObjectId: 1}]);
    live.setTarget({objectId: 9, kind: 'monster', name: 'monster.wolf', level: 2, classId: '', rank: 'normal'});
    live.setThreat(9, 100, true);
    live.setCooldowns(500, [{skillId: 'skill.mage.bolt', remainingMs: 2000}]);

    const resynced = new CombatModel();
    resynced.reset(5);
    resynced.setOwn(1);
    resynced.setVitals(9, 40, 40);
    resynced.setStatuses(9, [{statusId: 'status.burn', remainingMs: 3000, stacks: 1}]);
    resynced.setTargets([{objectId: 9, targetObjectId: 1}]);
    resynced.setTarget({objectId: 9, kind: 'monster', name: 'monster.wolf', level: 2, classId: '', rank: 'normal'});
    resynced.setThreat(9, 100, true);
    resynced.setCooldowns(500, [{skillId: 'skill.mage.bolt', remainingMs: 2000}]);
    resynced.setSelfVitals(100, 100, 50, 50, false);

    for(const id of [1, 9]) assert.deepEqual(resynced.vitalsOf(id), live.vitalsOf(id));
    assert.deepEqual(resynced.statusesOf(9), live.statusesOf(9));
    assert.equal(resynced.targetOf(9), live.targetOf(9));
    assert.deepEqual(resynced.target, live.target);
    assert.deepEqual(resynced.threat, live.threat);
    assert.equal(resynced.readyAt('skill.mage.bolt'), live.readyAt('skill.mage.bolt'));
    assert.equal(resynced.globalReadyAt, live.globalReadyAt);
});

test('threat of another monster is ignored', () =>
{
    const model = fresh();
    model.setTarget({objectId: 9, kind: 'monster', name: 'w', level: 1, classId: '', rank: 'normal'});
    model.setThreat(4, 50, false);
    assert.equal(model.threat, null);
    model.setThreat(9, 50, false);
    assert.deepEqual(model.threat, {percent: 50, hasAggro: false});
    model.setTarget(null);
    assert.equal(model.threat, null);
});

test('the log derives dealt, taken, miss, heal and status expiry, bounded at 200', () =>
{
    const model = fresh();
    model.setStatuses(9, [{statusId: 'status.burn', remainingMs: 3000, stacks: 1}]);
    model.reportHits([{attackerId: 1, targetId: 9, amount: 12, outcome: 'crit', health: 28, maxHealth: 40, killed: false}]);
    model.reportHits([{attackerId: 9, targetId: 1, amount: 0, outcome: 'miss', health: 100, maxHealth: 100, killed: false}]);
    model.reportOutcomes([{sourceObjectId: 2, sourceId: 'skill.cleric.heal', targetObjectId: 1, amount: 15, absorbed: 0, outcome: 'heal', health: 100, maxHealth: 100, killed: false}]);
    model.setStatuses(9, []);

    assert.deepEqual(model.log.map(entry => entry.kind), ['dealt', 'taken', 'heal', 'status']);
    assert.equal(model.log[3].key, 'vortex.combat.log.status.expired');
    for(let i = 0; i < 250; i++) model.refused('cooldown');
    assert.equal(model.log.length, 200);
});

test('an empty status list expires everything', () =>
{
    const model = fresh();
    model.setStatuses(9, [{statusId: 'a', remainingMs: 1000, stacks: 1}, {statusId: 'b', remainingMs: -1, stacks: 1}]);
    model.setStatuses(9, []);
    assert.deepEqual(model.statusesOf(9), []);
    assert.equal(model.log.filter(entry => entry.kind === 'status').length, 2);
});

test('auto-attack follows the server state only', () =>
{
    const model = fresh();
    model.setAutoAttacking(true);
    assert.equal(model.self.autoAttacking, true);
    model.reset(3);
    assert.equal(model.self.autoAttacking, false);
});
```

- [ ] **Step 2 : Vérifier l'échec** — `pnpm exec tsx --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-game/test/combat-model.test.ts`.

- [ ] **Step 3 : Implémenter `CombatModel.ts`**

```ts
import {EventEmitter} from 'eventemitter3';
import {platform} from '@ambreia/common/platform/Platform';
import type {IRpgCombatHit} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatEventsMessage';
import type {IRpgSkillOutcome} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillEventsMessage';
import type {IRpgTargetEntry} from '@ambreia/protocol/incoming/rpg/combat/RpgTargetsMessage';
import type {RpgLevelUpMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgLevelUpMessage';
import type {ICastEntry, ICombatModel, ICombatModelEvents, ILogEntry, ISelf, IStatusEntry, ITargetInfo, IThreat, IVitals, LogKind} from './ICombat';

const LOG_LINES = 200;

/**
 * The zone's fight as the client knows it (spec §3): one writer per field, the network sessions;
 * every view reads it. `reset(epoch)` opens `resyncing` and the first self vitals closes it: the
 * entry burst restores state, it is not news (no log, no floating number while it lasts).
 */
export class CombatModel implements ICombatModel
{
    readonly events = new EventEmitter<ICombatModelEvents>();
    private _epoch = 0;
    private _resyncing = false;
    private _own = 0;
    private readonly _vitals = new Map<number, IVitals>();
    private readonly _targets = new Map<number, number>();
    private readonly _statuses = new Map<number, IStatusEntry[]>();
    private readonly _casts = new Map<number, ICastEntry>();
    private readonly _cooldowns = new Map<string, number>();
    private _globalReadyAt = 0;
    private _self: ISelf = {inCombat: false, autoAttacking: false, death: {kind: 'alive'}};
    private _target: ITargetInfo | null = null;
    private _threat: IThreat | null = null;
    private readonly _log: ILogEntry[] = [];

    get resyncing(): boolean { return this._resyncing; }
    get self(): ISelf { return this._self; }
    get target(): ITargetInfo | null { return this._target; }
    get threat(): IThreat | null { return this._threat; }
    get ownObjectId(): number { return this._own; }
    get globalReadyAt(): number { return this._globalReadyAt; }
    get log(): readonly ILogEntry[] { return this._log; }

    vitalsOf(objectId: number): IVitals | null { return this._vitals.get(objectId) ?? null; }
    targetOf(objectId: number): number { return this._targets.get(objectId) ?? 0; }
    statusesOf(objectId: number): readonly IStatusEntry[] { return this._statuses.get(objectId) ?? []; }
    castOf(objectId: number): ICastEntry | null { return this._casts.get(objectId) ?? null; }
    readyAt(skillId: string): number { return this._cooldowns.get(skillId) ?? 0; }

    /** A new zone, or a reconnect: everything of the previous one goes; the burst rebuilds it. */
    reset(epoch: number): void
    {
        this._epoch = epoch;
        this._resyncing = true;
        this._vitals.clear();
        this._targets.clear();
        this._statuses.clear();
        this._casts.clear();
        this._cooldowns.clear();
        this._globalReadyAt = 0;
        this._target = null;
        this._threat = null;
        this._log.length = 0;
        this.emitSelf({inCombat: false, autoAttacking: false, death: {kind: 'alive'}});
    }

    setOwn(objectId: number): void { this._own = objectId; }

    setVitals(objectId: number, health: number, maxHealth: number): void
    {
        const known = this._vitals.get(objectId);
        const vitals: IVitals = {health, maxHealth, mana: known?.mana ?? null, maxMana: known?.maxMana ?? null};

        this._vitals.set(objectId, vitals);
        this.events.emit('vitals', objectId, vitals);
        if(objectId === this._own && health > 0 && this._self.death.kind === 'ko') this.standUp();
    }

    /** The burst's last message (spec §2.3): closes `resyncing`. */
    setSelfVitals(health: number, maxHealth: number, mana: number, maxMana: number, inCombat: boolean): void
    {
        this._vitals.set(this._own, {health, maxHealth, mana, maxMana});
        this.events.emit('vitals', this._own, this._vitals.get(this._own)!);
        if(health > 0 && this._self.death.kind === 'ko') this.standUp();
        if(this._self.inCombat !== inCombat) this.emitSelf({...this._self, inCombat});

        if(this._resyncing)
        {
            this._resyncing = false;
            this.events.emit('resynced');
        }
    }

    setTarget(info: ITargetInfo | null): void
    {
        this._target = info;
        this._threat = null;
        this.events.emit('target', info);
        this.events.emit('threat', null);
    }

    setTargets(entries: readonly IRpgTargetEntry[]): void
    {
        for(const entry of entries)
        {
            if(entry.targetObjectId === 0) this._targets.delete(entry.objectId);
            else this._targets.set(entry.objectId, entry.targetObjectId);
        }

        this.events.emit('targets');
    }

    /** Ignored unless it is about the current target: a tick can outrun a target change. */
    setThreat(monsterObjectId: number, percent: number, hasAggro: boolean): void
    {
        if(this._target?.objectId !== monsterObjectId) return;

        this._threat = {percent, hasAggro};
        this.events.emit('threat', this._threat);
    }

    setStatuses(objectId: number, entries: readonly {statusId: string; remainingMs: number; stacks: number}[]): void
    {
        const now = platform().now();
        const before = this._statuses.get(objectId) ?? [];
        const after = entries.map(entry => ({statusId: entry.statusId, endsAt: entry.remainingMs < 0 ? null : now + entry.remainingMs, stacks: entry.stacks}));

        this._statuses.set(objectId, after);
        // 9023 is a full list: appearing, stacking and disappearing are the only signals (spec §4).
        for(const entry of after)
        {
            const old = before.find(status => status.statusId === entry.statusId);

            if(!old) this.logLine('status', 'vortex.combat.log.status.applied', {status: entry.statusId, target: String(objectId)});
            else if(old.stacks < entry.stacks) this.logLine('status', 'vortex.combat.log.status.stacked', {status: entry.statusId, stacks: String(entry.stacks)});
        }
        for(const old of before)
        {
            if(!after.some(status => status.statusId === old.statusId)) this.logLine('status', 'vortex.combat.log.status.expired', {status: old.statusId, target: String(objectId)});
        }

        this.events.emit('statuses', objectId, after);
    }

    setCast(objectId: number, cast: {skillId: string; durationMs: number; channel: boolean; targetObjectId: number}): void
    {
        const entry: ICastEntry = {...cast, startedAt: platform().now()};

        this._casts.set(objectId, entry);
        this.events.emit('cast', objectId, entry);
    }

    endCast(objectId: number, reason: string, skillId: string): void
    {
        this._casts.delete(objectId);
        if(objectId === this._own && (reason === 'interrupted' || reason === 'failed')) this.logLine('cast', `vortex.combat.log.cast.${reason}`, {skill: skillId});
        this.events.emit('cast', objectId, null);
    }

    /** The list is complete (M1b): a skill missing from it is ready. */
    setCooldowns(globalRemainingMs: number, skills: readonly {skillId: string; remainingMs: number}[]): void
    {
        const now = platform().now();

        this._cooldowns.clear();
        for(const skill of skills) this._cooldowns.set(skill.skillId, now + skill.remainingMs);
        this._globalReadyAt = now + globalRemainingMs;
        this.events.emit('cooldowns', this._globalReadyAt, this._cooldowns);
    }

    setAutoAttacking(active: boolean): void
    {
        if(this._self.autoAttacking !== active) this.emitSelf({...this._self, autoAttacking: active});
    }

    setKo(respawnSeconds: number): void
    {
        this.emitSelf({...this._self, autoAttacking: false, death: {kind: 'ko', autoReleaseAt: respawnSeconds > 0 ? platform().now() + respawnSeconds * 1000 : null, waiting: respawnSeconds === 0, offer: null}});
        this.logLine('death', 'vortex.combat.log.death.self', {});
    }

    setOffer(casterObjectId: number, healthPercent: number, expiresMs: number): void
    {
        if(this._self.death.kind !== 'ko') return;

        this.emitSelf({...this._self, death: {...this._self.death, offer: {casterObjectId, healthPercent, expiresAt: platform().now() + expiresMs}}});
        this.logLine('resurrect', 'vortex.combat.log.resurrect.offered', {caster: String(casterObjectId)});
    }

    declineOffer(): void
    {
        if(this._self.death.kind === 'ko') this.emitSelf({...this._self, death: {...this._self.death, offer: null}});
    }

    setWaiting(): void
    {
        if(this._self.death.kind === 'ko') this.emitSelf({...this._self, death: {...this._self.death, waiting: true, autoReleaseAt: null}});
    }

    reportHits(hits: readonly IRpgCombatHit[]): void
    {
        for(const hit of hits)
        {
            this.setVitals(hit.targetId, hit.health, hit.maxHealth);
            this.logBlow(hit.attackerId, hit.targetId, hit.amount, 0, hit.outcome, hit.killed, null);
        }
    }

    reportOutcomes(outcomes: readonly IRpgSkillOutcome[]): void
    {
        for(const outcome of outcomes)
        {
            this.setVitals(outcome.targetObjectId, outcome.health, outcome.maxHealth);
            this.logBlow(outcome.sourceObjectId, outcome.targetObjectId, outcome.amount, outcome.absorbed, outcome.outcome, outcome.killed, outcome.sourceId);
        }
    }

    levelUp(message: RpgLevelUpMessage): void
    {
        this.logLine('levelup', 'vortex.combat.log.levelup', {level: String(message.toLevel)});
        this.events.emit('levelUp', {fromLevel: message.fromLevel, toLevel: message.toLevel, statsBefore: message.statsBefore, statsAfter: message.statsAfter, skillsLearned: message.skillsLearned});
    }

    refused(code: string, skillId: string | null = null): void
    {
        this.logLine('refused', skillId === null ? `vortex.combat.error.${code}` : `vortex.skill.error.${code}`, skillId === null ? {} : {skill: skillId});
    }

    private standUp(): void
    {
        this.emitSelf({...this._self, death: {kind: 'alive'}});
        this.logLine('resurrect', 'vortex.combat.log.resurrect.up', {});
    }

    private logBlow(source: number, target: number, amount: number, absorbed: number, outcome: string, killed: boolean, sourceId: string | null): void
    {
        const params = {amount: String(amount), absorbed: String(absorbed), source: String(source), target: String(target), skill: sourceId ?? ''};

        if(outcome === 'heal') this.logLine('heal', 'vortex.combat.log.heal', params);
        else if(outcome === 'miss' || outcome === 'dodge' || outcome === 'immune') this.logLine('miss', `vortex.combat.log.${outcome}`, params);
        else if(source === this._own) this.logLine('dealt', `vortex.combat.log.dealt.${outcome}`, params);
        else if(target === this._own) this.logLine('taken', `vortex.combat.log.taken.${outcome}`, params);

        if(killed && target !== this._own) this.logLine('death', 'vortex.combat.log.death.other', {target: String(target)});
    }

    private logLine(kind: LogKind, key: string, params: Record<string, string>): void
    {
        if(this._resyncing) return;

        const entry: ILogEntry = {at: platform().now(), kind, key, params};

        this._log.push(entry);
        if(this._log.length > LOG_LINES) this._log.shift();
        this.events.emit('log', entry);
    }

    private emitSelf(self: ISelf): void
    {
        this._self = self;
        this.events.emit('self', self);
    }

    dispose(): void
    {
        this.events.removeAllListeners();
    }
}
```

(Le test `fresh()` appelle `setSelfVitals` juste après `reset`, ce qui ferme la rafale avant toute ligne de log ; le test `a burst…` vérifie l'inverse.)

- [ ] **Step 4 : Vérifier le vert** — même commande ; `node node_modules/eslint/bin/eslint.js packages/ambreia-game/src/features/combat`.

- [ ] **Step 5 : Commit** — `git commit -m "combat: CombatModel, the one owner of the fight's state (spec §3)" -- packages/ambreia-game/src/features/combat/ICombat.ts packages/ambreia-game/src/features/combat/CombatModel.ts packages/ambreia-game/test/combat-model.test.ts`

---

### Task 4 : Les sessions écrivent le modèle, les vues le lisent

**Files :**
- Modify : `features/combat/RpgCombatSession.ts` (le modèle, les quatre messages, `send`), `features/combat/feature.ts` (`health`/`self`/`death` depuis le modèle, epoch → `reset`), `features/interaction/RpgInteractionSession.ts` (`RpgTargets`, `RpgThreat` → modèle), `features/interaction/feature.ts` (`target` → `model.setTarget`), `features/skills/RpgSkillSession.ts` et `feature.ts` (`statuses`, `castStart`/`castEnd`, `cooldowns`, `events`, `result` → modèle ; `readyAt` lu du modèle), `features/character/RpgCharacterSession.ts` (`RpgLevelUp` → `model.levelUp`), `features/hud/CharacterHudBridge.ts` (plus de `hp`/`mana`), `features/EngineHost.ts` (doc du slot), `features/index.ts` (ordre : `CombatFeature` avant `InteractionFeature`, `CharacterFeature` garde sa place et reçoit le modèle en `afterAttach`)
- Test : `packages/ambreia-game/test/combat-session.test.ts` (créer)

**Interfaces :**
- Produces : `RpgCombatSession.model: CombatModel` (construit par la session, un par client) ; `RpgCombatSession.setAutoAttack(active)`, `RpgCombatSession.deathChoice(choice)` ; `RpgInteractionSession` et `RpgSkillSession` reçoivent `ICombatModel` dans leur constructeur ; `RpgCharacterSession.attachCombat(model)`.
- Consumes : `CombatModel` (Tâche 3).

- [ ] **Step 1 : Test de câblage** (sans réseau : on appelle les `announce` des maps par leurs handlers)

```ts
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RpgCombatSession} from '../src/features/combat/RpgCombatSession';
import {RpgSelfVitalsMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgSelfVitalsMessage';
import {RpgDeathMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgDeathMessage';
import {RpgAutoAttackStateMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgAutoAttackStateMessage';

test('the combat session writes the model and announces nothing itself', () =>
{
    const session = new RpgCombatSession();
    session.model.reset(1);
    session.model.setOwn(1);

    session.handle('self', new RpgSelfVitalsMessage(80, 100, 30, 64, true));
    assert.deepEqual(session.model.vitalsOf(1), {health: 80, maxHealth: 100, mana: 30, maxMana: 64});
    assert.equal(session.model.self.inCombat, true);

    session.handle('death', new RpgDeathMessage(60));
    assert.equal(session.model.self.death.kind, 'ko');

    session.handle('autoAttack', new RpgAutoAttackStateMessage(true));
    assert.equal(session.model.self.autoAttacking, true);
});
```

(`handle(event, message)` est la méthode interne que la map appelle, rendue publique pour les tests ; elle remplace le `announce` typé.)

- [ ] **Step 2 : Vérifier l'échec** — `pnpm exec tsx --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-game/test/combat-session.test.ts`.

- [ ] **Step 3 : `RpgCombatSession`**

Remplacer `_health`, `healthOf()`, `setHealth()` et `report()`/`cast()`/`mark()` par le modèle :

```ts
    readonly model = new CombatModel();

    handle<E extends keyof IRpgCombatSessionEvents>(event: E, ...args: IRpgCombatSessionEvents[E]): void
    {
        (this.events as unknown as EventEmitter).emit(event, ...args);

        switch(event)
        {
            case 'hits': this.model.reportHits((args[0] as RpgCombatEventsMessage).hits); break;
            case 'vitals': for(const line of (args[0] as RpgVitalsMessage).combatants) this.model.setVitals(line.objectId, line.health, line.maxHealth); break;
            case 'self': { const v = args[0] as RpgSelfVitalsMessage; this.model.setSelfVitals(v.health, v.maxHealth, v.mana, v.maxMana, v.inCombat); break; }
            case 'death': this.model.setKo((args[0] as RpgDeathMessage).respawnSeconds); break;
            case 'result': this.model.refused((args[0] as RpgCombatResultMessage).code); break;
            case 'offer': { const o = args[0] as RpgResurrectOfferMessage; this.model.setOffer(o.casterObjectId, o.healthPercent, o.expiresMs); break; }
            case 'autoAttack': this.model.setAutoAttacking((args[0] as RpgAutoAttackStateMessage).active); break;
        }
    }

    setAutoAttack(active: boolean): void
    {
        if(this._connection) this._map.send(this._connection, new RpgAutoAttackMessage(active));
    }

    deathChoice(choice: DeathChoice): void
    {
        if(this._connection) this._map.send(this._connection, new RpgDeathChoiceMessage(choice));
        if(choice === 'wait') this.model.setWaiting();
        if(choice === 'decline') this.model.declineOffer();
    }
```

`IRpgCombatSessionEvents` gagne `offer: [RpgResurrectOfferMessage]` et `autoAttack: [RpgAutoAttackStateMessage]` ; la map gagne ces deux entrants (9029, 9031) et les deux sortants. Dans `combat/feature.ts`, `const modelOn = scope.bind(session.model.events);` sert à toutes les tâches suivantes, et `ko()` / `levelUp()` sont des constructeurs paresseux sur le modèle de `overlayOf()`. `mark()` reste (l'overlay y tient) ; `report()` et `cast()` sont retirés : skills écrit le modèle. `forget()` devient `model.reset(epoch)` appelé par la feature.

- [ ] **Step 4 : Les autres sessions**

`RpgInteractionSession(model)` : la map ajoute `RpgTargets` → `model.setTargets(message.entries)` et `RpgThreat` → `model.setThreat(...)` ; sur `target`, `model.setTarget(objectId === 0 ? null : {objectId, kind, name, level, classId, rank})`. `targetId`/`target` lisent `model.target`.

`RpgSkillSession(model)` : `statuses` → `model.setStatuses` par combattant ; `castStart` → `model.setCast` ; `castEnd` → `model.endCast` ; `cooldowns` → `model.setCooldowns` ; `events` → `model.reportOutcomes(message.outcomes)` (les impacts restent un événement de session pour les VFX) ; `result` → `model.refused(code, skillId)`. `readyAt(skillId)` et `statusesOf(id)` délèguent au modèle. Dans `skills/feature.ts`, `renderOwn` lit `model.statusesOf(self())` avec `endsAt`, et `Date.now()` devient `platform().now()`.

`RpgCharacterSession.attachCombat(model: ICombatModel & {levelUp(message): void})` : la map ajoute `RpgLevelUp` → `model.levelUp(message)`. `CombatFeature` précède désormais `InteractionFeature` et `SkillsFeature` dans `GAME_FEATURES` ; ces deux-là passent `host.made.combat!.model` à leur session ; `CharacterFeature` reçoit le modèle dans `afterAttach` de `CombatFeature` (`host.made.character?.attachCombat(session.model)`).

`combat/feature.ts` : `on('health', …)` devient `scope.bind(session.model.events)('vitals', (objectId, vitals) => overlayOf()?.setHealth(objectId, vitals.health, vitals.maxHealth, isMonster(objectId)))`, gardé muet pendant `model.resyncing` pour les nombres flottants ; `on('self', …)` lit le modèle (`hudPlayer.update({hp, hpMax, mana, manaMax, inCombat})`) ; le bloc `on('death', …)` avec son `alert` disparaît (le panneau KO de la tâche 7 le remplace) ; `RSE_STARTED` appelle `session.model.setOwn(event.session.ownUserRoomId)` ; `RSE_ENDED` appelle `session.model.reset(++epoch)`. Le reconnect : `scope.bind(host.made.communication?.events)` sur l'événement de reset de cycle de vie (celui que `disposeAllSessions` suit, §2 de `docs/CLIENT-SERVER-ARCHITECTURE.md`) → `session.model.reset(++epoch)`.

`CharacterHudBridge.vitals()` ne renvoie plus que `{hpMax, manaMax}` ; le combat feature pousse `hp`/`mana` depuis le modèle. Le mock `simulate()` du dev hook écrit `model.reportHits`.

- [ ] **Step 5 : Vérifier le vert** — `pnpm check` (le typecheck trouve chaque ancien appel `healthOf`, `report`, `cast` à migrer).

- [ ] **Step 6 : Commit** — `git commit -m "combat: the sessions write CombatModel, the HUD reads it; health has one writer" -- packages/ambreia-game/src/features packages/ambreia-game/test/combat-session.test.ts`

---

### Task 5 : Bouton Attaque

**Files :**
- Modify : `packages/vortex-client/src/vortex-layouts/vortex_hud_action_bar_xml.xml` (un `itemlist_horizontal` `attack_slot`, 66 px de large, à gauche de `skill_slots` ; `skill_slots` et les suivants décalés de 70 px), `features/hud/IHud.ts` (`IPlayerHud.autoAttack?: 'idle' | 'active' | 'disabled'`), `features/hud/HudView.ts` (le slot, son rendu, son clic → `events.emit('attack')`), `features/hud/PlayerHudState.ts` (événement `attack: []`), `features/combat/feature.ts` (touche `t`, double-clic, état depuis le modèle)
- Test : `packages/ambreia-game/test/hud-state.test.ts`, `packages/ambreia-game/test/hud-rules.test.ts`

- [ ] **Step 1 : Tests**

```ts
test('the attack slot state is the auto-attack state', () =>
{
    assert.equal(attackSlotState({autoAttacking: false, hasMonsterTarget: true}), 'idle');
    assert.equal(attackSlotState({autoAttacking: true, hasMonsterTarget: true}), 'active');
    assert.equal(attackSlotState({autoAttacking: false, hasMonsterTarget: false}), 'disabled');
});
```

(`attackSlotState` dans `ui/kit/hudRules.ts`.)

- [ ] **Step 2 : Vérifier l'échec** — `… --test packages/ambreia-game/test/hud-rules.test.ts`.

- [ ] **Step 3 : Implémenter**

`hudRules.ts` :

```ts
/** The attack button (spec §4): it reflects the server's auto-attack state, never the click. */
export function attackSlotState(input: {autoAttacking: boolean; hasMonsterTarget: boolean}): 'idle' | 'active' | 'disabled'
{
    if(input.autoAttacking) return 'active';

    return input.hasMonsterTarget ? 'idle' : 'disabled';
}
```

`HudView.buildBar()` : après les deux barres, un slot de `vortex_hud_action_slot_xml` dans `attack_slot`, icône `rpg/ui-icons/boardgames_sword_weapon_attack_icon` (ou l'icône épée disponible dans `rpg/ui-icons/`, nommée dans `images` de la feature), clé `T`, `procedure` : `WME_CLICK` → `this._state.events.emit('attack')` ; `renderAttack(state)` : `active` → `slot.color = SELECTED_COLOR` et `pulse` par `scope.interval` 500 ms sur l'alpha du cadre, `disabled` → `alpha 0.4`.

`combat/feature.ts` :

```ts
        const attack = (): void =>
        {
            const model = session.model;

            if(model.self.death.kind !== 'alive' || model.target?.kind !== 'monster') return;

            session.setAutoAttack(!model.self.autoAttacking);
        };

        scope.add(host.made.input!.bind('combat', 't', attack, {when: () => room !== null}));
        scope.bind(host.made.hudPlayer?.events)('attack', attack);
        engineOn(RoomEngineObjectEvent.REOE_DOUBLE_CLICKED, (event: RoomEngineObjectEvent) =>
        {
            if(event.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER && isMonster(event.objectId)) session.setAutoAttack(true);
        });
        const renderAttack = (): void => host.made.hudPlayer?.update({autoAttack: attackSlotState({autoAttacking: session.model.self.autoAttacking, hasMonsterTarget: session.model.target?.kind === 'monster'})});

        modelOn('self', renderAttack);
        modelOn('target', renderAttack);
```

(`REOE_DOUBLE_CLICKED` : si `RoomEngineObjectEvent` ne le déclare pas — `grep -n DOUBLE packages/ambreia-game/src/room/events/RoomEngineObjectEvent.ts` — l'ajouter et l'émettre dans `RoomEngine` là où `REOE_SELECTED` part, sur `event.type === 'dblclick'` de l'événement de salle.)

- [ ] **Step 4 : Vérifier** — `pnpm check` ; run-vortex-client : trois captures du bouton (grisé sans cible, idle sur un monstre, actif après `T`), comparées à la planche « États – Combat ».

- [ ] **Step 5 : Commit** — `git commit -m "hud: the Attack button, keyed T, double-click; select is no longer attack" -- packages/vortex-client/src/vortex-layouts/vortex_hud_action_bar_xml.xml packages/ambreia-game/src packages/ambreia-game/test`

---

### Task 6 : Cible de la cible et jauge de menace

**Files :**
- Modify : `features/hud/IHud.ts` (`IHudPanels.targetOfTarget: IHudUnit | null`, `IHudPanels.threat: IThreat | null`), `features/hud/HudPanelsView.ts` (panneau `targetOfTarget` sur `vortex_hud_target_compact_xml`, jauge dans `vortex_hud_target_xml`), `features/hud/HudPanelsState.ts` (défauts), `packages/vortex-client/src/vortex-layouts/vortex_hud_target_xml.xml` (un `container` `threat_bar` 4 px sous `target_hp_bar`, avec `bg`, `fill`, `value`), `features/interaction/feature.ts` (nourrit les deux)
- Test : `packages/ambreia-game/test/hud-rules.test.ts`

- [ ] **Step 1 : Tests**

```ts
test('the threat gauge colour', () =>
{
    assert.equal(threatColor({percent: 30, hasAggro: false}), THREAT_GREEN);
    assert.equal(threatColor({percent: 80, hasAggro: false}), THREAT_ORANGE);
    assert.equal(threatColor({percent: 100, hasAggro: true}), THREAT_RED);
});

test('an unknown target of target shows nothing until named', () =>
{
    assert.equal(targetOfTargetUnit(9, () => null, () => null), null);
    assert.deepEqual(targetOfTargetUnit(9, () => ({name: 'Léa', figure: 'hr-…', level: 20}), () => ({health: 40, maxHealth: 100, mana: null, maxMana: null}))?.hp, 40);
});
```

- [ ] **Step 2 : Vérifier l'échec**.

- [ ] **Step 3 : Implémenter**

`hudRules.ts` : `THREAT_GREEN = 0x5ad04a`, `THREAT_ORANGE = 0xf0a030`, `THREAT_RED = 0xd83a2a`, `threatColor()` ; `targetOfTargetUnit(objectId, who: (id) => {name, figure, level} | null, vitals: (id) => IVitals | null): IHudUnit | null` renvoie null tant que `who()` est null.

`HudPanelsView` : `Panel` gagne `targetOfTarget`, `LAYOUTS.targetOfTarget = 'vortex_hud_target_compact_xml'`, positionné à droite du cadre cible dans `relayout()` ; `render()` : `if(show('targetOfTarget', value.targetOfTarget !== null)) this.renderUnit(panel('targetOfTarget'), 'target', value.targetOfTarget!)` (la layout compacte porte les mêmes noms `target_portrait`, `target_info`, `target_hp_bar`) ; la jauge : `this._bits.setVisible(target, value.threat !== null, 'threat_bar')` puis `setBar(target, 'threat_bar', percent, 100, `${percent} %`)` et `fill.color = threatColor(threat)`.

Le cadre cible gagne aussi deux états transitoires (spec §4) : sur une entrée `log` de kind `refused` au code `unreachable`, `target_frame.color` passe rouge 600 ms ; sur `endCast` du joueur en `interrupted`, la cast bar passe rouge 600 ms avant de disparaître (dans `skills/feature.ts`, `renderTarget`).

`interaction/feature.ts` : sur `modelOn('target')`, `modelOn('targets')`, `modelOn('vitals')` → `hud.update({targetOfTarget: targetOfTargetUnit(model.targetOf(model.target?.objectId ?? 0), who, id => model.vitalsOf(id))})` où `who` lit `room.userDataManager.getUserDataByIndex(id)` (`name`, `figure`) et le niveau du `RpgTarget` si c'est la cible, sinon null de niveau ; `modelOn('threat', threat => hud.update({threat}))`.

- [ ] **Step 4 : Vérifier** — `pnpm check` ; run-vortex-client : un monstre qui vise le joueur montre le cadre compact et la jauge rouge.

- [ ] **Step 5 : Commit** — `git commit -m "hud: target of target and the threat gauge" -- packages/ambreia-game/src packages/ambreia-game/test packages/vortex-client/src/vortex-layouts/vortex_hud_target_xml.xml`

---

### Task 7 : Panneau KO et offre de résurrection

**Files :**
- Create : `packages/vortex-client/src/vortex-layouts/vortex_combat_ko_xml.xml` (skill design-habbo-window, planche panneaux 1 et 2 : `ko_title`, `ko_avatar` (bitmap wrapper, avatar couché), `ko_info`, `ko_countdown`, boutons `ko_release`, `ko_wait`, `ko_wait_help`, `ko_leave` (caché), bloc `offer` : `offer_head`, `offer_name`, `offer_info`, `offer_text`, `offer_bar`, `offer_accept`, `offer_decline`), `features/combat/KoPanel.ts`
- Modify : `features/combat/feature.ts`, `packages/vortex-client/src/locales/{fr,en}/hud.json`
- Test : `packages/ambreia-game/test/ko-panel.test.ts`

**Interfaces :**
- Produces : `KoPanel(windows, bits, choose: (choice: DeathChoice) => void)` avec `render(self: ISelf, now: number, caster: {name, figure, level, classId} | null)`, `dispose()`.

- [ ] **Step 1 : Tests** (la logique pure dans `koPanelModel(self, now)` → `{countdown: string | null, waiting: boolean, offer: {...} | null, releaseEnabled: boolean}`)

```ts
test('release sends once', () =>
{
    let sent = 0;
    const panel = new KoPanelLogic(() => sent++);
    panel.release();
    panel.release();
    assert.equal(sent, 1);
    panel.reset();
    panel.release();
    assert.equal(sent, 2);
});

test('the countdown follows the auto-release, and disappears on wait', () =>
{
    assert.equal(koPanelModel({kind: 'ko', autoReleaseAt: 61000, waiting: false, offer: null}, 1000).countdown, '1:00');
    assert.equal(koPanelModel({kind: 'ko', autoReleaseAt: null, waiting: true, offer: null}, 1000).countdown, null);
});
```

- [ ] **Step 2 : Vérifier l'échec**.

- [ ] **Step 3 : Implémenter**

`KoPanel.ts` : construit la layout sur `getDesktop(2)` centrée, `visible = false` ; `render()` : titre `vortex.combat.ko.title`, `ko_info` = niveau et classe (`WindowBits.contentName`), compte à rebours `vortex.combat.ko.countdown` avec `mm:ss`, `ko_wait` grisé si `waiting`, `offer` visible si `offer`, `offer_bar` = `(expiresAt − now) / 30000`, avatar couché via `this._bits.avatar(window, 'ko_avatar', figure, 2, true)` + posture `lay` si `avatar()` l'accepte, sinon la tête seule ; un `scope.interval` 250 ms tant que visible. `KoPanelLogic` garde `_sent` par état. Le filtre gris : `host.made.roomEngine?.setRpgDimmed(true)` (nouvelle méthode qui pose un `ColorMatrixFilter` désaturé sur le conteneur de la salle — `grep -n "filters" packages/ambreia-game/src/room/RoomEngine.ts` pour l'endroit).

`combat/feature.ts` : `modelOn('self', self => { if(self.death.kind === 'ko') ko().show(self) else ko().hide(); })`, `choose = choice => session.deathChoice(choice)`. Résolution du lanceur : `room.userDataManager.getUserDataByIndex(offer.casterObjectId)` pour `name`/`figure`, niveau et classe par `host.made.interaction` si c'est la cible, sinon vides.

Textes fr (`hud.json`) : `vortex.combat.ko.title` « Vous êtes K.O. », `vortex.combat.ko.subtitle` « Votre aventure n'est pas terminée… », `vortex.combat.ko.countdown` « Réapparition dans %time% », `vortex.combat.ko.release` « Réapparaître au sanctuaire », `vortex.combat.ko.wait` « Attendre une résurrection », `vortex.combat.ko.wait.help` « Vous restez au sol jusqu'à ce qu'un allié vous ranime. », `vortex.combat.ko.leave` « Quitter l'instance », `vortex.combat.resurrect.title` « %name% souhaite vous ressusciter ! », `vortex.combat.resurrect.text` « %name% veut utiliser un sort de résurrection pour vous ramener à la vie ici (%percent% % de vie). Acceptez-vous ? », `vortex.combat.resurrect.expires` « Cette proposition expire dans %seconds% s », `vortex.combat.resurrect.accept` « Accepter », `vortex.combat.resurrect.decline` « Refuser », et leurs équivalents en.

- [ ] **Step 4 : Vérifier** — `pnpm check` ; run-vortex-client avec deux comptes (le mage meurt, un clerc lance `skill.cleric.resurrect`) : captures KO, offre, après accept.

- [ ] **Step 5 : Commit** — `git commit -m "combat: the KO panel with wait, release and the resurrection offer" -- packages/vortex-client/src/vortex-layouts/vortex_combat_ko_xml.xml packages/vortex-client/src/locales packages/ambreia-game/src/features/combat packages/ambreia-game/src/room packages/ambreia-game/test/ko-panel.test.ts`

---

### Task 8 : Panneau level-up

**Files :**
- Create : `packages/vortex-client/src/vortex-layouts/vortex_combat_levelup_xml.xml` (planche panneau 4 : `levelup_title`, `levelup_avatar`, `stats_list` (itemlist vertical de `vortex_character_stat_row_xml`), `unlocked_list` (itemlist de `vortex_hud_action_slot_xml` + texte), `levelup_continue`), `features/combat/LevelUpPanel.ts`
- Modify : `features/combat/feature.ts`, locales
- Test : `packages/ambreia-game/test/level-up-panel.test.ts`

- [ ] **Step 1 : Test** (`statRows(before, after, bits)` → lignes non nulles seulement)

```ts
test('only the stats that rose are listed', () =>
{
    const before = {strength: 10, intelligence: 12, agility: 5, maxHealth: 100, maxMana: 50, armor: 2, critBp: 500, dodgeBp: 300, speedPercent: 100, power: 20};
    const rows = statRows(before, {...before, maxHealth: 130, power: 22}, key => key);

    assert.deepEqual(rows, [{label: 'vortex.stat.maxHealth', delta: '+30'}, {label: 'vortex.stat.power', delta: '+2'}]);
});
```

- [ ] **Step 2 : Vérifier l'échec**.

- [ ] **Step 3 : Implémenter** — `statRows()` parcourt les dix clés de `IRpgStatBlock` dans l'ordre du bloc, `critBp`/`dodgeBp` en `+x,y %` ; `LevelUpPanel.show(levelUp, skills: (id) => {icon, name})` sur `getDesktop(2)`, `levelup_continue` ferme, le flash doré : `hudPlayer.update({flash: true})` 600 ms (nouveau champ optionnel de `IPlayerHud`, cadre coloré par `HudView`). Dans `feature.ts` : `modelOn('levelUp', up => levelUp().show(up, id => ({icon: host.made.skills?.definition(id)?.icon ?? null, name: bits().contentName(`${id}.name`, id)})))`. Textes : `vortex.combat.levelup.title` « Niveau %level% ! », `vortex.combat.levelup.stats` « Vos caractéristiques ont augmenté : », `vortex.combat.levelup.unlocked` « Nouveaux éléments débloqués : », `vortex.combat.levelup.continue` « Continuer », `vortex.stat.*` pour les dix stats (s'ils n'existent pas déjà : `grep -n "vortex.stat" packages/vortex-client/src/locales/fr/*.json`).

- [ ] **Step 4 : Vérifier** — `pnpm check` ; run-vortex-client : un `GrantXp` admin (ou un monstre tué près du seuil) montre le panneau.

- [ ] **Step 5 : Commit** — `git commit -m "combat: the level-up panel" -- packages/vortex-client/src/vortex-layouts/vortex_combat_levelup_xml.xml packages/vortex-client/src/locales packages/ambreia-game/src packages/ambreia-game/test/level-up-panel.test.ts`

---

### Task 9 : Canal `combat` du chat

**Files :**
- Modify : `ui/kit/chatModel.ts` (`ChatChannel` + `'combat'`, `CHAT_CHANNELS.combat`, `chatLinesOf` : l'onglet `all` n'affiche pas `combat`), `features/hud/ChatPanel.ts` (`tabMenu` ajoute `combat` ; filtres par `LogKind` dans l'en-tête de l'onglet, mémorisés dans `IChatSettings.combatFilters`), `features/combat/feature.ts` (le modèle → `hud.addChatLine`), `skills/feature.ts` et `combat/feature.ts` (les refus ne passent plus par `system`)
- Test : `packages/ambreia-game/test/chat-model.test.ts` (existant ou à créer)

- [ ] **Step 1 : Test**

```ts
test('the combat channel is its own tab, hidden from « all »', () =>
{
    const lines = [{time: '1', channel: 'combat' as const, author: '', message: 'x'}, {time: '1', channel: 'world' as const, author: 'a', message: 'y'}];

    assert.equal(chatLinesOf(lines, ALL_TAB).length, 1);
    assert.equal(chatLinesOf(lines, channelTab('combat')).length, 1);
});
```

- [ ] **Step 2 : Vérifier l'échec**.

- [ ] **Step 3 : Implémenter** — `combat: {key: 'vortex.combat.title', color: 0xd83a2a, icon: `${ICONS}boardgames_sword_weapon_attack_icon`, live: true}` ; `chatLinesOf` : `tab.channel === null` filtre aussi `combat` ; dans `combat/feature.ts` :

```ts
        modelOn('log', entry => host.made.hud?.addChatLine({
            time: chatClock(Date.now() / 1000), channel: 'combat', author: '',
            message: bits().text(entry.key, ...Object.entries(entry.params).flat()), kind: entry.kind
        }));
```

(`IChatLine.kind?: string` pour le filtre et la couleur par type dans `ChatPanel`.) Les textes `vortex.combat.log.*` : `dealt.hit` « Vous infligez %amount% à %target%. », `dealt.crit` « Critique ! %amount% à %target%. », `taken.hit` « %source% vous inflige %amount%. », `taken.crit`, `miss` « %source% rate %target%. », `dodge` « %target% esquive. », `immune` « %target% est immunisé. », `heal` « %source% soigne %target% de %amount%. », `status.applied` « %status% sur %target%. », `status.stacked` « %status% ×%stacks%. », `status.expired` « %status% se dissipe sur %target%. », `cast.interrupted` « %skill% interrompu. », `cast.failed` « %skill% a échoué. », `death.self` « Vous êtes K.O. », `death.other` « %target% meurt. », `resurrect.offered` « %caster% propose de vous ranimer. », `resurrect.up` « Vous vous relevez. », `levelup` « Niveau %level% ! ». Les noms d'objets (`%target%`, `%source%`) sont résolus par la feature avant `text()` : `room.userDataManager.getUserDataByIndex(id)?.name ?? bits().contentName(…)`.

- [ ] **Step 4 : Vérifier** — `pnpm check` ; run-vortex-client : l'onglet Combat se remplit pendant un combat, `system` ne reçoit plus les refus.

- [ ] **Step 5 : Commit** — `git commit -m "chat: the combat channel, derived from the model's log" -- packages/ambreia-game/src packages/ambreia-game/test packages/vortex-client/src/locales`

---

### Task 10 : Kit de toasts

**Files :**
- Create : `packages/ambreia-game/src/ui/kit/Toasts.ts`
- Modify : `features/hud/HudPanelsState.ts` (`toast(kind, title, text, ms)` qui émet `toast: [IToast]`), `features/hud/HudPanelsView.ts` (écoute `toast` et nourrit `Toasts`), `features/hud/IHud.ts` (`IToast {kind: 'info' | 'success' | 'error'; title: string; text: string; ms: number}`), `features/combat/feature.ts` (« Résurrection en cours… » à l'accept, le refus `invalid_target` de l'attaque)
- Test : `packages/ambreia-game/test/toasts.test.ts`

- [ ] **Step 1 : Test** (`ToastQueue` pure : au plus trois visibles, les suivantes attendent, `tick(now)` retire les expirées)

```ts
test('three toasts at most, the rest queue', () =>
{
    const queue = new ToastQueue(3);
    for(let i = 0; i < 5; i++) queue.push({kind: 'info', title: String(i), text: '', until: 1000 + i});
    assert.equal(queue.visible.length, 3);
    queue.tick(1001);
    assert.deepEqual(queue.visible.map(t => t.title), ['1', '2', '3']);
});
```

- [ ] **Step 2 : Vérifier l'échec**.

- [ ] **Step 3 : Implémenter** — `Toasts` construit jusqu'à trois `vortex_hud_toast_xml` empilées en haut au centre du desktop, `toast_frame.color` par kind (`info` 0x2a6fd6, `success` 0x2f7a2f, `error` 0xb02a2a), `toast_icon` par kind, `toast_title`, `toast_txt` ; un `scope.interval` 250 ms appelle `queue.tick`.

- [ ] **Step 4 : Vérifier** — `pnpm check` ; capture d'un toast.

- [ ] **Step 5 : Commit** — `git commit -m "ui: the toast kit (info, success, error)" -- packages/ambreia-game/src packages/ambreia-game/test/toasts.test.ts`

---

### Task 11 : Auras de statut

**Files :**
- Modify : `features/combat/feature.ts` (les auras), `features/skills/feature.ts` (plus rien à faire : le modèle porte les statuts)
- Test : `packages/ambreia-game/test/status-aura.test.ts`

- [ ] **Step 1 : Test** (`auraDiff(before: Set<string>, after: readonly IStatusEntry[], aura: (id) => IVfxPhase | null)` → `{start: string[], stop: string[]}`)

```ts
test('an aura starts when its status appears and stops when it goes', () =>
{
    const aura = (id: string) => id === 'status.focused' ? {sheet: 'mage/power-aura', attach: 'feet' as const, delayMs: 0} : null;
    assert.deepEqual(auraDiff(new Set(), [{statusId: 'status.focused', endsAt: null, stacks: 1}], aura), {start: ['status.focused'], stop: []});
    assert.deepEqual(auraDiff(new Set(['status.focused']), [], aura), {start: [], stop: ['status.focused']});
    assert.deepEqual(auraDiff(new Set(), [{statusId: 'status.burn', endsAt: null, stacks: 1}], aura), {start: [], stop: []});
});
```

- [ ] **Step 2 : Vérifier l'échec**.

- [ ] **Step 3 : Implémenter** — dans `combat/feature.ts`, `const auras = new Map<number, Map<string, () => void>>()` ; `modelOn('statuses', (objectId, statuses) => { const diff = auraDiff(new Set(auras.get(objectId)?.keys() ?? []), statuses, id => host.made.skills?.statusDefinition(id)?.vfx?.aura ?? null); … })` : pour `start`, `vfx.loop(sheet, objectId, phase.attach)` avec `vfxSheet(phase.sheet)` ; pour `stop`, appeler la fonction retournée ; sur `reset`/`RSE_ENDED`, tout arrêter. Les sheets d'aura entrent dans `images` par `VFX_IMAGES` déjà.

- [ ] **Step 4 : Vérifier** — `pnpm check` ; run-vortex-client : un archer sous `status.focused` montre l'aura aux pieds (contenu de la tâche 10 serveur poussé).

- [ ] **Step 5 : Commit** — `git commit -m "combat: status auras from content, looped on the avatar" -- packages/ambreia-game/src/features/combat packages/ambreia-game/test/status-aura.test.ts`

---

### Task 12 : Icônes depuis le contenu

**Files :**
- Modify : `features/skills/RpgSkillSession.ts` (`ISkillDefinition.icon`, `IStatusDefinition.icon`), `features/skills/feature.ts`, `features/skills/SkillsWindow.ts` (`skillIcon(id)` → `session.definition(id)?.icon ?? FALLBACK_SKILL`), `features/skills/feature.ts` (`images` : les icônes ne sont plus connues à l'avance → les 65 `rpg/status-effects/icon_NN` et le dossier `rpg/skills/` restent listés par un glob dans `images`, ou la feature charge à la demande via `host.assets.getAssetByName` ; retenir la liste complète du dossier, générée par `tools/bundle-assets.mjs` déjà)
- Delete : `features/skills/skillArt.ts`
- Test : `packages/ambreia-game/test/skill-icons.test.ts`

- [ ] **Step 1 : Test** — `iconOf(definition | null, fallback)` renvoie `definition.icon` si non vide, sinon `fallback`.
- [ ] **Step 2 : Vérifier l'échec**.
- [ ] **Step 3 : Implémenter** et supprimer `skillArt.ts` ; `grep -rn skillArt packages` = 0.
- [ ] **Step 4 : Vérifier** — `pnpm check` ; capture de la barre d'action avec les icônes servies.
- [ ] **Step 5 : Commit** — `git commit -m "skills: icons come from content; skillArt.ts is gone" -- packages/ambreia-game/src/features/skills packages/ambreia-game/test/skill-icons.test.ts`

---

### Task 13 : Retrait des AvatarEffects, `AvatarAnimationAssets`

**Files :**
- Delete : `packages/ambreia-protocol/src/incoming/room/action/AvatarEffectMessageEvent.ts`, `parser/room/action/AvatarEffectMessageEventParser.ts`, `packages/ambreia-iso/src/scene/messages/RoomObjectAvatarEffectUpdateMessage.ts`, `packages/ambreia-game/src/window/utils/EffectPreviewer.ts`, les layouts `effect_selector*`, `effectbox_xml`, `effects_widget*`, `memenu_effect*`, `inventory_effects_xml`, `avatar_editor_effect_griditem_xml`
- Modify : `HabboMessages.ts` (la ligne 2624 et son registre), `RoomMessageHandler.ts` (`onAvatarEffect` et l'enregistrement), `IRoomCreator.ts`/`RoomEngine.ts` (`updateObjectUserEffect`, `setAvatarEffect`, `updateRoomObjectUserEffect`), `AvatarLogic.ts:250`, `AvatarVisualization.ts:991` (`figure_effect`), `AvatarVisualizationData.ts`, `AvatarFurnitureVisualizationData.ts`, `FigureData.ts:94-146`, `ProductImageWidget.ts:270,464-502`, `RoomPreviewer.ts:628`, `vortex-imager/src/avatar/AvatarRenderService.ts:112`
- Rename : `packages/ambreia-avatar/src/EffectAssetDownloadManager.ts` → `AvatarAnimationAssets.ts` (classe `AvatarAnimationAssets`), `EffectAssetDownloadLibrary.ts` → `AvatarAnimationLibrary.ts`, `IAvatarEffectListener.ts` → `IAvatarAnimationListener.ts` ; `packages/vortex-client/src/assets/configurations/AmbreiaEffectMap.xml` → `AmbreiaAnimationMap.xml`, réduit aux entrées `dance.1` à `dance.4` ; `AvatarData.ts:34` suit
- Modify : `node install.mjs --pack` (le zip ne porte plus les 237 bibliothèques d'effets : retirer leurs fichiers de `packages/vortex-client/src/assets/…/effects/` sauf les quatre `dance`)
- Test : `packages/ambreia-protocol/test/incoming-registered.test.ts` (reste vert après `pnpm gen:headers` du serveur sans 2624), `packages/ambreia-avatar/test/*` existants

- [ ] **Step 1 : Inventaire** — `grep -rin "AvatarEffect\|figure_effect\|EffectAssetDownload\|AmbreiaEffectMap" packages --include=*.ts --include=*.xml --include=*.json --include=*.mjs | grep -v node_modules > effects.txt` ; chaque ligne doit être dans la liste ci-dessus ou être un commentaire qui documente le retrait.
- [ ] **Step 2 : Retirer et renommer** — `packages/vortex-engine/tools/move-modules.mjs` pour les renommages (il réécrit les imports) ; `git rm --pathspec-from-file` pour les suppressions, depuis une liste relue.
- [ ] **Step 3 : Vérifier** — `pnpm check` ; `grep -rin AvatarEffect packages --include=*.ts --include=*.xml --include=*.json | grep -v "^.*//" | wc -l` = 0 ; run-vortex-client : l'emote `/dance` joue encore ; `node install.mjs --pack` puis `unzip -l vortex-client-assets.zip | grep -c effect` = 4.
- [ ] **Step 4 : Commit** — `git commit -m "refactor(legacy): remove the Habbo avatar effects; the dance emote keeps its assets as AvatarAnimationAssets" -- $(cut -d: -f1 effects.txt | sort -u) packages/ambreia-avatar/src packages/vortex-client/src/assets/configurations`

---

### Task 14 : Roadmap, registre, porte finale

- [ ] **Step 1 :** `AMBREIA_PRO_ROADMAP_2026.md` : §9.1 ligne « AvatarEffect lifecycle » → `fait` ; §11 : la ligne AvatarEffect passe dans « Supprimé », la ligne « Chat bubbles » note que le combat log existe ; §18 : M1 fait, prochain M2.
- [ ] **Step 2 :** `docs/CLIENT-SERVER-ARCHITECTURE.md` §24 : retirer « Avatar effects — Deferred » ; ajouter un §25 « RPG combat » qui renvoie aux specs M1a–M1d et à la spec client.
- [ ] **Step 3 :** `pnpm check` vert, `node .claude/scripts/find-orphans.mjs` sans nouvel orphelin dans `features/`.
- [ ] **Step 4 :** Golden path live (spec §7 critère 1), deux comptes, captures dans `mockup/glaze/m1/` : sélection sans attaque, `T`, cible de la cible et menace, interruption, KO, offre, accept, kill, level-up, onglet Combat, aura ; puis la même boucle avec Relâcher ; puis un changement de zone en plein combat et le retour (critère 2).
- [ ] **Step 5 : Commit** — `git commit -m "docs: M1 combat vertical slice delivered; roadmap and register updated" -- AMBREIA_PRO_ROADMAP_2026.md docs/CLIENT-SERVER-ARCHITECTURE.md`
