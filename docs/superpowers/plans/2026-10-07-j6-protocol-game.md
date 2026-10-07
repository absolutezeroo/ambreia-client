# J6 — `@ambreia/protocol` + `@ambreia/game` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** les messages existants dans `@ambreia/protocol` avec le nouveau style réseau disponible ; le reste du jeu dans `@ambreia/game` ; les features déclarent leurs images et leurs widgets de room. Ajouter ou retirer une feature tient alors en un dossier et une ligne.

**Architecture:** deux déplacements par `move-modules`, sur le modèle de J1 à J4 :
- `habbo/communication/messages` et ses en-têtes vers `protocol` ;
- le reste de `habbo/`, les IID, les enveloppes de `core/` et les features vers `game`.

`vortex-engine` ne garde que la coquille d'hôte (`Vortex.ts`, `VortexMain.ts`), renommée plus tard comme les autres `vortex-*`. Le nouveau style réseau (§6) s'ajoute à `net` sans toucher l'ancien : un message pur, un parser ou un serializer, un handler, une table par domaine. Les `switch` qui restent deviennent des registres que les features remplissent.

**Tech Stack :** TypeScript, pnpm workspace, `move-modules.mjs`, `node:test` + `tsx`.

**Spec :** `docs/superpowers/specs/2026-10-07-client-architecture-design.md` (§3, §4, §6, §9 J6, §11).

## Global Constraints

- Moteurs (`common`, `net`, `avatar`, `iso`, `ui`) → jamais `kernel`, `protocol`, `game` (§3 règle 1).
- `protocol` dépend de `common`, `net` et des types d'`iso` que ses messages portent (données d'état des mobis, vecteurs). Il n'importe ni `kernel` ni `game`.
- Les en-têtes viennent du serveur (`pnpm gen:headers`) ; le hook de pré-commit les vérifie (§6).
- Une feature est un dossier de `game` et une ligne dans la liste. Une feature n'importe pas une autre feature, sauf par une interface ou un événement déclaré (§3 règle 3).
- Preuve J6 (§9, §11) : retirer une feature de démonstration (dossier + ligne) laisse le build vert.
- Démarrage identique (empreinte de J5).
- Commits par chemin.

## Décisions

- **D1 — `protocol`.**
  - `habbo/communication/messages/**`, `Headers.generated.ts` et `HabboMessages.ts` vont dans `packages/ambreia-protocol/src/`.
  - `gen-headers.mjs` écrit désormais dans `packages/ambreia-protocol/src/Headers.generated.ts`.
  - Les quatre imports qui sortent encore du dossier (`IMessageDataWrapper` par le barrel `@core/communication`) visent `@ambreia/net` directement.
- **D2 — Nouveau style réseau, dans `@ambreia/net`** (`src/style/`) :

  ```ts
  export interface IMessageParser<M> { parse(wrapper: IMessageDataWrapper): M }
  export interface IMessageSerializer<M> { serialize(message: M): unknown[] }
  export interface IMessageHandler<M> { handle(message: M): void }
  export class MessageMap
  {
      incoming<M>(header: number, parser: IMessageParser<M>, handler: IMessageHandler<M>): this;
      outgoing<M extends object>(type: abstract new (...args: never[]) => M, header: number, serializer: IMessageSerializer<M>): this;
  }
  // une connexion qui sert les deux styles :
  export function installMessageMap(connection: IConnection, map: MessageMap): () => void;   // abonne les incoming, rend la désinscription
  export function sendMessage(connection: IConnection, map: MessageMap, message: object): boolean;   // serializer retrouvé par la classe
  ```

  Les noms exacts des points d'accroche de la connexion (comment `net` livre un paquet entrant, comment il envoie un tableau sérialisé) se relèvent dans `@ambreia/net` au début de la tâche 2. Ils sont consignés si la forme ci-dessus doit s'y adapter.
- **D3 — `game`.** Vont dans `packages/ambreia-game/src/` :
  - `habbo/**` → `src/` (mêmes sous-dossiers) ;
  - `iid/**` → `src/iid/` ;
  - `core/communication`, `core/localization`, `core/assets` → `src/core/` ;
  - `features/**` → `src/features/`.

  `vortex-engine` garde `Vortex.ts`, `VortexMain.ts`, `IVortexMain.ts`, `IVortexLoadingScreen.ts` et son `index.ts`, qui réexporte ce que le client prend. Les alias `@habbo`, `@core` et `@iid` disparaissent avec leurs dossiers.
- **D4 — Points d'extension des features.**
  - `IGameFeature` (`game/src/features/GameFeature.ts`) étend la feature du kernel :
    - `images?: readonly string[]` : les images de la bibliothèque qu'elle lit par nom. Elles remplacent `LIBRARY_IMAGE_NAMES`, que l'on supprime : relevé du 2026-10-07, aucun des 85 noms n'est encore lu, tous servaient des modules retirés à la coupe.
    - `roomWidgets?: Readonly<Record<string, RoomWidgetCreator>>` : il remplace le `switch` de `RoomWidgetFactory`.
  - Les deux widgets qui restent deviennent des features en dossier, `features/avatar-info/` et `features/loading-bar/` (la feature de démonstration).
  - Les commandes de chat n'ont plus de `switch` depuis la coupe (`ChatInputWidgetHandler` retiré) : pas de point d'extension sans usage.
  - Les logiques de room ont déjà leurs registres et leurs modules (J4).
- **D5 — Preuve de retrait.** Étape de validation, scriptée :
  1. déplacer `features/loading-bar/` hors de l'arbre et retirer sa ligne ;
  2. `pnpm typecheck` et `pnpm build` verts, démarrage sans le widget ;
  3. tout remettre.

## Review Focus

1. **Un message perd son en-tête ou son parser** au déplacement (le registre `HabboMessages` ne se construit plus, ou un import circulaire ramène `undefined`) → le client n'entend plus rien. Pin : test `outgoing-registered` (J4) et `pnpm check` ; un nouveau test vérifie que chaque `Incoming.*` généré a un événement enregistré.
2. **Le démarrage change** (ordre d'attache, propriétés) après le déplacement de `game`. Pin : empreinte de J5, avant/après la tâche 3.
3. **Le bundle de dev** perd un alias (`@habbo`, `@iid`) que le client importe encore → page blanche. Pin : `grep` des alias dans le client vide, puis démarrage.
4. **Un widget de room disparaît** (registre rempli après la création de `RoomUI`, ou mauvais nom d'événement). Pin : tâche 4, test des types de widget et démarrage.
5. **Le nouveau style intercepte un en-tête** que l'ancien style traite aussi : double traitement. Pin : tâche 2, test « un en-tête déjà enregistré dans l'ancien style est refusé par la table ».

---

### Task 0 : Paquets `@ambreia/protocol` et `@ambreia/game`, leurs murs

- [ ] Branche `j6-protocol-game` depuis `master` (après le merge de J5).
- [ ] Les deux `package.json` :
  - `protocol` dépend de `common`, `net`, `iso` ;
  - `game` dépend de tous les paquets `@ambreia/*`, de `pixi.js` et d'`eventemitter3`.
- [ ] Tests de frontières d'abord (rouges) :
  - `protocol` → `@ambreia/kernel` refusé, `@ambreia/net` admis ;
  - un moteur → `@ambreia/protocol` et `@ambreia/game` refusés ;
  - le kernel → `@ambreia/game` refusé ;
  - `game` → tout `@ambreia/*` admis, `vortex-client` refusé.
- [ ] Murs ESLint, ligne de typecheck, scan de `move-modules`. `pnpm check` ; commit.

### Task 1 : `protocol`

- [ ] Repointer les 4 imports `@core/communication` → `@ambreia/net/messages/IMessageDataWrapper`.
- [ ] `move-modules` (messages, `Headers.generated.ts`, `HabboMessages.ts`) ; 0 violation ; `--apply`.
- [ ] `gen-headers.mjs` et son test visent le nouveau chemin ; le hook de pré-commit aussi.
- [ ] Test (rouge, puis vert) : chaque `Incoming.*` a un événement enregistré dans `HabboMessages`. C'est le pendant du test sortant de J4.
- [ ] `pnpm check`, build, démarrage ; commit `j6: les messages existants sortent dans @ambreia/protocol`.

### Task 2 : Le nouveau style réseau

- [ ] Relever dans `@ambreia/net` le point où un paquet entrant est livré aux événements, et l'envoi d'un composer.
- [ ] Tests (rouges) avec une connexion factice :
  - (a) un paquet entrant de l'en-tête de la table → parser puis handler appelés, avec le message pur ;
  - (b) `sendMessage` d'une instance → le serializer de sa classe produit le tableau envoyé sous le bon en-tête ;
  - (c) un message sans entrée dans la table → `false` et un avertissement ;
  - (d) un en-tête déjà servi par un événement de l'ancien style → `MessageMap` refuse à l'installation (erreur nommée) ;
  - (e) la désinscription rendue par `installMessageMap` coupe la livraison.
- [ ] Implémenter (vert). `pnpm check` ; commit `j6: nouveau style réseau (messages purs, parsers, serializers, handlers, tables)`.

### Task 3 : `game`

- [ ] Empreinte de démarrage avant (D6 de J5).
- [ ] `move-modules` : `habbo/**`, `iid/**`, `core/{communication,localization,assets}` et `features/**` vers `packages/ambreia-game/src/` ; les barrels suivent. Point fixe : ce qui resterait dans `vortex-engine` doit être la coquille seule.
- [ ] Les alias `@habbo`, `@core` et `@iid` sont retirés des tsconfig, de vite, du plugin de bundle et de `move-modules`. Les tests de frontières qui citent `@habbo/…` comme import interdit restent : la regex les refuse toujours.
- [ ] Imager et Glaze : leurs imports suivent (codemod) ; leurs builds.
- [ ] Empreinte après = avant ; `pnpm check`, builds, démarrage, Glaze ; commit `j6: le jeu sort dans @ambreia/game ; vortex-engine devient la coquille d'hôte`.

### Task 4 : Images et widgets déclarés par les features

**Produces :**

```ts
export interface IGameFeature<S extends z.ZodObject = z.ZodObject> extends IFeature<S, IEngineHost>
{
    readonly images?: readonly string[];
    readonly roomWidgets?: Readonly<Record<string, RoomWidgetCreator>>;
}
export type RoomWidgetCreator = (handler: IRoomWidgetHandler, ui: IRoomUI) => unknown;
export function featureImages(features: readonly IGameFeature[]): ReadonlySet<string>;
export class RoomWidgetRegistry { register(type: string, create: RoomWidgetCreator): void; create(type: string, handler: IRoomWidgetHandler, ui: IRoomUI): unknown | null; types(): string[] }
```

- [ ] Tests (rouges) :
  - le registre rend le widget de `RWE_AVATAR_INFO` et de `RWE_LOADINGBAR` quand leurs features sont dans la liste ;
  - sans `loading-bar`, `RWE_LOADINGBAR` donne `null` avec un avertissement unique ;
  - `featureImages` réunit les `images` des features.
- [ ] `features/avatar-info/feature.ts` et `features/loading-bar/feature.ts` (widget, handler, `roomWidgets`) ; `RoomWidgetFactory` lit le registre, que le démarrage remplit avant `room-ui`.
- [ ] Client : la règle des images décodées prend `featureImages(GAME_FEATURES)` à la place de `LIBRARY_IMAGE_NAMES`, que l'on supprime.
- [ ] `pnpm check`, démarrage, empreinte ; commit `j6: les features déclarent leurs images et leurs widgets de room`.

### Task 5 : Preuve de retrait, validation, documentation

- [ ] D5, scripté et consigné, puis tout remis.
- [ ] Entrée en room si un émulateur tourne et que le ticket est autorisé ; sinon, consigné.
- [ ] Docs :
  - `CLAUDE.md` : cartes des paquets, alias, chemin des en-têtes ;
  - règle `communication` : le nouveau style ;
  - spec §9 J6 fait ;
  - `pnpm sync:agents` ;
  - bilan `docs/superpowers/plans/2026-10-07-j6-protocol-game.bilan.md`.

  Commit.
