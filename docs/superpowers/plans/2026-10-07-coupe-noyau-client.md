# Coupe au noyau du client — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** réduire le client à ce que le serveur coupé au noyau sait encore servir — connexion classique (ticket SSO), entrée dans la zone de développement sur `RoomForward`, rendu de la zone, marche et regard — et retirer tout le reste de l'hôtel.

**Architecture :** retrait par blocs entiers, du plus périphérique au plus central, chacun suivi d'un `pnpm typecheck` qui désigne exactement le code gardé à adapter. Puis le registre réseau est réduit aux 60 messages du contrat serveur, un outil de balayage (testé) supprime les fichiers devenus orphelins, et le tout est validé en réel.

**Tech Stack :** TypeScript 5, PixiJS v8, pnpm 11, Node 24 (`node:test`), ESLint 10.

**Spec :** `vortex-rpg-emulator/docs/superpowers/audits/2026-10-07-coupe-noyau.md` (liste et « Décisions ») et `vortex-rpg-emulator/docs/superpowers/plans/2026-10-07-coupe-noyau.bilan.md` → « Checklist du propriétaire — côté client » ; architecture cible : `docs/superpowers/specs/2026-10-07-client-architecture-design.md`.

## Liste validée (2026-10-07)

**Gardé :** `core/` entier ; `room/` ; `habbo/room` ; `habbo/session` (session, room) ; `habbo/window` ;
`habbo/avatar` **rendu ET éditeur** (décision du propriétaire : l'édition d'avatar reste) ; `habbo/configuration`,
`localization`, `utils`, `util`, `perf` ; `habbo/communication` = transport + les **60 messages** du contrat
(46 entrants, 14 sortants, liste en Task 6) ; dans `habbo/ui`, le cadre (`RoomDesktop`, `RoomUI`,
`RoomWidgetFactory`, `RoomDesktopLayoutManager`, interfaces) et **seulement** la bulle de nom au-dessus des
avatars (`AvatarInfoWidget` + son handler), la barre de chargement et `ObjectLocationRequestHandler` ; les
158 maquettes `src/vortex-layouts/` ; Glaze, l'imager, le débogueur.

**Retiré :** `habbo/{catalog, inventory, navigator, friendbar, friendlist, messenger, freeflowchat, groups,
quest, moderation, help, notifications, sound, tracking, campaign, advertisement, nux, phonenumber,
userclassification, discord, vortex (pêche, éditeur de meubles), toolbar}`, `src/discord/` du moteur, tous les
autres widgets et handlers de `habbo/ui`, l'onboarding Habbo Club du client (`onBoardingHc*`), ~810 classes de
messages. Les layouts Habbo du dump (`src/assets/window-layouts`, ignorés par git) ne bougent pas.

## Global Constraints

- Branche locale `coupe-noyau` depuis `master`, tag `pre-noyau-client` sur le point de départ ; rien n'est poussé.
- Une tâche = au moins un commit `noyau: …`, **par chemins explicites** (`git commit -m … -- <chemins>`) ; message terminé par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Suppressions par `git rm -r -q <dossier>` ; jamais de suppression récursive hors du dépôt.
- **Avant de retirer un appel dans du code gardé, lire le corps de la méthode appelée** (CLAUDE.md → « Before you change inherited code »).
- Retirer une dépendance DI d'un composant gardé : enlever l'entrée `ComponentDependency`, le champ et chaque usage ; jamais laisser une dépendance `required` vers un IID supprimé.
- Le registre réseau ne garde que des en-têtes présents dans `Headers.generated.ts`.
- Vérification de fin de tâche : `pnpm check` vert (typecheck client+moteur+glaze+imager, tests) et `node node_modules/eslint/bin/eslint.js "packages/*/src/**/*.ts"` sans erreur.

## Review Focus

1. **Le démarrage attend un message que le serveur n'envoie plus** (un composant gardé qui n'initialise qu'après le navigateur, le catalogue ou les réglages) → le client doit atteindre la zone. Pin : Task 8, parcours réel + `describeLockedComponents` vide.
2. **Un message gardé n'a plus d'écouteur** parce que son handler vivait dans un module retiré (`NotificationDialogMessageEvent`, `MaintenanceStatusMessageEvent`…) → chaque événement du contrat a un écouteur ou est listé comme ignoré volontairement. Pin : Task 6, step 5.
3. **Un clic sur un avatar ou un meuble envoie un message de widget à un handler retiré** → rien ne casse, pas d'erreur console. Pin : Task 8, step 4.
4. **Un layout gardé déclare un widget dont le code est parti** → la fenêtre se construit quand même. Pin : Task 8, step 4 (`errors`).
5. **Le balayage supprime un fichier atteint seulement par un nom ré-exporté à travers un baril** → l'outil suit les noms, et le typecheck le prouve. Pin : Task 7, test `a barrel does not keep its whole folder alive` + `pnpm check`.

---

### Task 0 : Branche, tag, ligne de base

- [ ] `git switch -c coupe-noyau master && git tag pre-noyau-client master`
- [ ] Ligne de base : `pnpm check` → vert, 31 tests ; `pnpm build` → vert. Noter les deux dans le ledger.
- [ ] Mesure : `find packages/vortex-engine/src -name '*.ts' | wc -l` (≈ 4 480) et le noter.

### Méthode commune aux Tasks 1 à 5

Pour chaque bloc : 1) `git rm -r -q` des dossiers listés et de leurs IID ; 2) `pnpm typecheck 2>&1 | grep "error TS" > /tmp/tsc.txt` ; 3) corriger chaque erreur **dans le code gardé** en retirant la dépendance (champ, `ComponentDependency`, import, appels), après avoir lu le corps de chaque appel retiré ; 4) recommencer jusqu'à zéro erreur ; 5) eslint sur les fichiers touchés ; 6) commit. Les points d'adaptation déjà connus (relevés le 2026-10-07 par analyse des imports) sont listés par tâche ; le typecheck fait foi pour le reste.

### Task 1 : Social et messagerie

**Supprimer :** `packages/vortex-engine/src/habbo/{friendbar,friendlist,messenger,groups,help,moderation,userclassification,phonenumber,discord}`, `packages/vortex-engine/src/discord/`, et les IID correspondants dans `packages/vortex-engine/src/iid/` (`IIDHabboFriendBar`, `IIDHabboFriendList`, `IIDHabboMessenger`, `IIDHabboGroupsManager`, `IIDHabboHelp`, `IIDHabboModeration`, `IIDNewModerationTool`, `IIDHabboTalent`, `IIDHabboDiscordManager`, `IIDHabboLandingView` (seul `HabboFriendBar` l'implémente)) + leurs lignes dans `iid/index.ts`.

**Points d'adaptation connus :** `habbo/ui/RoomUI.ts` (dépendance optionnelle `IID_HabboLandingView`), `VortexMain.ts` (imports, champs, construction/attache, `initFriendList()`), `Vortex.ts`, `IVortex.ts`, `IVortexMain.ts` (getters et passthroughs), `packages/vortex-client/src/App.ts` (appel `initFriendList`), `habbo/util/VisitUserUtil.ts` (`ModerationManager`), `habbo/session/BlockedUsersManager.ts`.

- [ ] Supprimer, typecheck, adapter (méthode commune).
- [ ] `pnpm check` vert ; eslint sans erreur.
- [ ] Commit `noyau: social, messagerie, groupes, aide et modération partent`.

### Task 2 : Économie, monde et services

**Supprimer :** `habbo/{catalog,inventory,navigator,quest,nux,campaign,advertisement,tracking,sound,notifications}` et leurs IID (`IIDHabboCatalog`, `IIDHabboClubCenter`, `IIDHabboInventory`, `IIDHabboNavigator`, `IIDHabboNewNavigator`, `IIDHabboQuestEngine`, `IIDDailyTasks`, `IIDHabboAdManager`, `IIDHabboTracking`, `IIDHabboSoundManager`, `IIDHabboNotifications`).

**Points d'adaptation connus :**
- `habbo/room/RoomEngine.ts` (`IAdManager`, `AdEvent`, `IHabboCatalog`) ;
- `habbo/session/{SessionDataManager,ISessionDataManager,BlockedUsersManager,RoomSession,RoomSessionManager}.ts` (`IHabboNotifications`, `IHabboTracking`) ;
- `habbo/window/{HabboWindowManager,IHabboWindowManager}.ts` (`IHabboCatalog`) ;
- `habbo/window/widgets/ProductIconWidget.ts` (`ActivityPointTypeEnum`) : le widget sert le catalogue ; le retirer et retirer son enregistrement dans la fabrique de widgets ;
- `habbo/avatar/HabboAvatarEditorManager.ts` (`IHabboCatalog`, `IHabboInventory`) : retirer `openCatalogPage()` et `openClubCenter()` et leurs appelants dans l'éditeur ; l'éditeur reste ;
- `App.ts` (`SoundContext`) ; `VortexMain.ts`, `Vortex.ts`, `IVortex.ts`, `IVortexMain.ts`.

- [ ] Supprimer, typecheck, adapter (méthode commune).
- [ ] `pnpm check` vert ; eslint sans erreur.
- [ ] Commit `noyau: catalogue, inventaire, navigateur, quêtes, notifications, son et services partent`.

### Task 3 : Chat et fonctions Vortex

**Supprimer :** `habbo/freeflowchat`, `habbo/vortex` (pêche et éditeur de meubles), IID `IIDHabboFreeFlowChat`, `IIDHabboFishing`, `IIDHabboFurniEditor`.

**Points d'adaptation connus :** `habbo/room/RoomObjectFactory.ts` (logiques `FurnitureFishingSignLogic`/`FurnitureFishingSpotLogic` et leurs cas), `habbo/room/RoomObjectLogicEnum.ts` (valeurs de pêche), `habbo/session/RoomSessionManager.ts` (`IHabboFreeFlowChat`), `habbo/window/{HabboWindowManager,IHabboWindowManager}.ts` (`IHabboFreeFlowChat`), `VortexMain.ts`, `Vortex.ts` (`IHabboFurniEditor`), `packages/vortex-client/src/App.ts` (images de pêche dans `LIBRARY_IMAGE_NAMES`/préfixe `fish`).

- [ ] Supprimer, typecheck, adapter (méthode commune).
- [ ] `pnpm check` vert ; eslint sans erreur.
- [ ] Commit `noyau: chat, pêche et éditeur de meubles partent`.

### Task 4 : Barre d'outils et interface de room

**Supprimer :** `habbo/toolbar`, IID `IIDHabboToolbar` ; dans `habbo/ui/handler/`, **tout sauf** `AvatarInfoWidgetHandler.ts`, `LoadingBarWidgetHandler.ts`, `ObjectLocationRequestHandler.ts` ; dans `habbo/ui/widget/`, **tout sauf** `IRoomWidget.ts`, `RoomWidgetBase.ts`, `avatarinfo/`, `loadingbar/`, `enums/`, `events/`, `messages/` (les deux derniers seront élagués par le balayage de la Task 7).

**Dans `avatarinfo/`, ne garder que la bulle de nom :** retirer les menus (`OwnAvatarMenuView`, `OwnPetMenuView`, `AvatarMenuView`, `PetMenuView` et apparentés), `AvatarContextInfoButtonView.ts` et toute branche de `AvatarInfoWidget.ts` qui ouvre un menu, l'éditeur, un profil ou une action sociale ; garder l'affichage du nom au survol/clic et son positionnement par `RWGOI_MESSAGE_GET_OBJECT_LOCATION` (ne pas réimplémenter le positionnement — CLAUDE.md : `positionView()` l'a déjà payé).

**Points d'adaptation connus :** `habbo/ui/{RoomDesktop,RoomUI,RoomWidgetFactory,IRoomWidgetHandlerContainer}.ts` (cas `switch` et dépendances optionnelles des widgets retirés), `habbo/room/{RoomEngine,IRoomEngineServices}.ts` (`IHabboToolbar`, `HabboToolbarIconEnum`), `App.ts` (`HabboToolbarEnum`), `VortexMain.ts`, `Vortex.ts`, `IVortex.ts`, `IVortexMain.ts`.

**Point d'entrée de l'éditeur d'avatar** (plus aucun bouton ne l'ouvre) :

`packages/vortex-engine/src/VortexMain.ts`, à côté des autres getters :

```ts
// TS-only: the toolbar and the own-avatar menu that opened the editor are gone (core cut,
//   2026-10-07); this getter is the editor's entry point until the RPG HUD exists.
get avatarEditor(): HabboAvatarEditorManager | null
{
    return this._avatarEditor;
}
```

`packages/vortex-engine/src/IVortexMain.ts` : `readonly avatarEditor: HabboAvatarEditorManager | null;` (import de type).

`packages/vortex-engine/src/Vortex.ts` :

```ts
// TS-only: dev entry point for the avatar editor while no HUD opens it — `Vortex.instance.openAvatarEditor()`
//   from the console (App.ts exposes `window.Vortex`).
openAvatarEditor(): void
{
    this._habboMain?.avatarEditor?.openEditor(AvatarEditorIdEnum.MAIN_EDITOR, null, null, true);
}
```

(`Vortex.instance` est le singleton existant de `Vortex.ts:253`, exposé en dev par `App.ts` sous `window.Vortex` ; `IVortex.ts` déclare `openAvatarEditor(): void`.)

- [ ] Supprimer, typecheck, adapter (méthode commune), ajouter le point d'entrée.
- [ ] `pnpm check` vert ; eslint sans erreur.
- [ ] Commit `noyau: barre d'outils et widgets de room partent ; seule la bulle de nom reste`.

### Task 5 : Application client

**Supprimer :** `packages/vortex-client/src/{onBoardingHc,onBoardingHcSteps,onBoardingHcUi}`.

**Points d'adaptation connus :** `packages/vortex-client/src/App.ts` (`OnBoardingHcFlow`, `Stage`, `LoginAssets` ; images et préfixes de `LIBRARY_IMAGE_NAMES` qui ne servaient que des fonctions retirées : ne retirer une entrée qu'après `grep -rn "<nom>" packages/*/src` sans autre résultat).

- [ ] Supprimer, typecheck, adapter.
- [ ] `pnpm check` vert ; `pnpm build` vert ; eslint sans erreur.
- [ ] Commit `noyau: onboarding Habbo Club parti du client`.

### Task 6 : Registre réseau réduit au contrat

**Files :** Modify `packages/vortex-engine/src/habbo/communication/HabboMessages.ts`.

Le contrat (relevé le 2026-10-07, correspondance 1:1 vérifiée avec `Headers.generated.ts`) :

- **Événements gardés (46)** : `InitDiffieHandshakeMessageEvent`, `CompleteDiffieHandshakeMessageEvent`, `AuthenticationOKMessageEvent`, `DisconnectReasonMessageEvent`, `PingMessageEvent`, `UserRightsMessageEvent`, `UserObjectMessageEvent`, `MaintenanceStatusMessageEvent`, `FigureUpdateMessageEvent`, `RoomRatingMessageEvent`, `RoomReadyMessageEvent`, `OpenConnectionMessageEvent`, `CloseConnectionMessageEvent`, `HanditemConfigurationMessageEvent`, `RoomForwardMessageEvent`, `CantConnectMessageEvent`, `YouAreControllerMessageEvent`, `YouAreNotControllerMessageEvent`, `YouAreOwnerMessageEvent`, `FloorHeightMapMessageEvent`, `FurnitureAliasesMessageEvent`, `HeightMapMessageEvent`, `HeightMapUpdateMessageEvent`, `RoomEntryTileMessageEvent`, `RoomEntryInfoMessageEvent`, `ObjectsMessageEvent`, `ObjectAddMessageEvent`, `ObjectUpdateMessageEvent`, `ObjectRemoveMessageEvent`, `ObjectDataUpdateMessageEvent`, `ItemsMessageEvent`, `ItemAddMessageEvent`, `ItemUpdateMessageEvent`, `ItemRemoveMessageEvent`, `ItemStateUpdateMessageEvent`, `ItemDataUpdateMessageEvent`, `UsersMessageEvent`, `UserUpdateMessageEvent`, `UserRemoveMessageEvent`, `RoomPropertyMessageEvent`, `RoomVisualizationSettingsEvent`, `DanceMessageEvent`, `AvatarEffectMessageEvent`, `CarryObjectMessageEvent`, `UserChangeMessageEvent`, `NotificationDialogMessageEvent`.
- **Composers gardés (14)** : `ClientHelloMessageComposer`, `InitDiffieHandshakeMessageComposer`, `CompleteDiffieHandshakeMessageComposer`, `VersionCheckMessageComposer`, `SSOTicketMessageComposer`, `UniqueIDMessageComposer`, `PongMessageComposer`, `DisconnectMessageComposer`, `InfoRetrieveMessageComposer`, `OpenFlatConnectionMessageComposer`, `QuitMessageComposer`, `LookToMessageComposer`, `GetFurnitureAliasesMessageComposer`, `MoveAvatarMessageComposer`.

- [ ] **Step 1 : réduire les enregistrements.** Un script ponctuel (non commité) garde les `_events.set(N, X)` dont `N` est un id de `Incoming` et les `_composers.set(N, X)` dont `N` est un id de `Outgoing`, supprime les autres lignes `set`, puis retire des blocs `import {…}` chaque nom qui n'apparaît plus ailleurs dans le fichier :

```js
// tools/trim-habbo-messages.mjs (tools/ est ignoré par git à la racine)
import fs from 'node:fs';

const file = 'packages/vortex-engine/src/habbo/communication/HabboMessages.ts';
const gen = fs.readFileSync('packages/vortex-engine/src/habbo/communication/Headers.generated.ts', 'utf8');
const ids = name => new Set([...gen.slice(gen.indexOf(`export const ${name}`)).split('} as const;')[0]
    .matchAll(/: (\d+),/g)].map(m => Number(m[1])));
const incoming = ids('Incoming');
const outgoing = ids('Outgoing');
let text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

text = text.split('\n').filter(line =>
{
    const ev = line.match(/_events\.set\((\d+),/);
    const co = line.match(/_composers\.set\((\d+),/);
    if(ev) return incoming.has(Number(ev[1]));
    if(co) return outgoing.has(Number(co[1]));
    return true;
}).join('\n');

const body = text.replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g, '');
text = text.replace(/import\s*(type\s*)?\{([^}]*)\}\s*from\s*(['"][^'"]+['"]);\n?/g, (whole, type, names, from) =>
{
    const kept = names.split(',').map(n => n.trim()).filter(Boolean)
        .filter(n => new RegExp(`\\b${n.split(/\s+as\s+/).pop()}\\b`).test(body));
    return kept.length ? `import ${type ?? ''}{\n    ${kept.join(',\n    ')},\n} from ${from};\n` : '';
});

fs.writeFileSync(file, text);
console.log(`events kept: ${(text.match(/_events\.set\(/g) ?? []).length}, composers kept: ${(text.match(/_composers\.set\(/g) ?? []).length}`);
```

Run : `node tools/trim-habbo-messages.mjs`
Expected : `events kept: 46, composers kept: 14`.

- [ ] **Step 2 :** `pnpm typecheck` → zéro erreur (le fichier n'importe plus que ce qu'il enregistre).
- [ ] **Step 3 :** `node node_modules/eslint/bin/eslint.js --fix packages/vortex-engine/src/habbo/communication/HabboMessages.ts` → zéro erreur.
- [ ] **Step 4 :** relire le diff : 60 lignes `set`, aucun numéro modifié.
- [ ] **Step 5 : chaque événement gardé a un écouteur.**

```bash
for c in $(grep -oE "_events\.set\([0-9]+, *\w+" packages/vortex-engine/src/habbo/communication/HabboMessages.ts | sed 's/.*, *//'); do
  n=$(grep -rln "new $c(" packages/vortex-engine/src packages/vortex-client/src | grep -v HabboMessages.ts | wc -l); [ "$n" = 0 ] && echo "SANS ÉCOUTEUR: $c"; done; echo fin
```

Expected : une liste (éventuellement vide) suivie de `fin`. Pour chaque événement listé : s'il porte une information que la zone affiche (ex. `NotificationDialogMessageEvent` → message à l'utilisateur), brancher un écouteur minimal dans le composant gardé le plus proche (`HabboWindowManager.alert(...)` pour un dialogue) ; sinon, l'écrire dans le ledger comme « ignoré volontairement, raison ». Aucun événement ne reste sans décision.

- [ ] **Step 6 :** `pnpm check` vert ; commit `noyau: registre réseau réduit aux 60 messages du contrat serveur`.

### Task 7 : Balayage des fichiers orphelins (outil testé)

**Files :**
- Create : `.claude/scripts/find-orphans.mjs`, `.claude/scripts/find-orphans.test.mjs`

L'outil liste les fichiers `.ts` du moteur et du client qu'aucun point d'entrée n'atteint, en suivant les **noms** importés à travers les barils `export * from` jusqu'au fichier qui les déclare (sans quoi un `index.ts` garderait son dossier entier en vie). Points d'entrée : `packages/vortex-engine/src/index.ts`, `packages/vortex-client/src/index.ts`, `packages/vortex-glaze/src/main.ts`, `packages/vortex-imager/src/index.ts`.

- [ ] **Step 1 : test d'abord.**

```js
// .claude/scripts/find-orphans.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findOrphans } from './find-orphans.mjs';

function project(files)
{
    const root = mkdtempSync(join(tmpdir(), 'orphans-'));
    for(const [path, text] of Object.entries(files))
    {
        mkdirSync(join(root, path, '..'), { recursive: true });
        writeFileSync(join(root, path), text);
    }
    return root;
}

test('a barrel does not keep its whole folder alive', () =>
{
    const root = project({
        'src/main.ts': "import {A} from './lib';\nexport const x = A;\n",
        'src/lib/index.ts': "export * from './a';\nexport * from './b';\n",
        'src/lib/a.ts': 'export class A {}\n',
        'src/lib/b.ts': 'export class B {}\n'
    });

    assert.deepEqual(findOrphans({ root, entries: ['src/main.ts'], scan: ['src'], aliases: {} }), ['src/lib/b.ts']);
});

test('aliases, type imports, re-exported names and dynamic imports are followed', () =>
{
    const root = project({
        'src/main.ts': "import type {T} from '@x/t';\nexport {R} from './r';\nvoid import('./lazy');\n",
        'src/x/t.ts': 'export interface T {}\n',
        'src/r.ts': "import {Dep} from './dep';\nexport const R = Dep;\n",
        'src/dep.ts': 'export const Dep = 1;\n',
        'src/lazy.ts': 'export const L = 1;\n',
        'src/dead.ts': 'export const D = 1;\n'
    });

    assert.deepEqual(findOrphans({ root, entries: ['src/main.ts'], scan: ['src'], aliases: { '@x': 'src/x' } }), ['src/dead.ts']);
});
```

Run : `node --test .claude/scripts/find-orphans.test.mjs` → FAIL (`Cannot find module`).

- [ ] **Step 2 : l'outil.**

```js
#!/usr/bin/env node
// Lists source files that no entry point reaches. Named imports are followed through `export *`
// barrels to the file that declares the name, so a barrel does not keep its whole folder alive.
// Usage: node .claude/scripts/find-orphans.mjs [--delete]   (from the repo root)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const posix = p => p.split(path.sep).join('/');

function resolveSpec(root, fromFile, spec, aliases)
{
    let base = null;
    const alias = Object.keys(aliases).find(a => spec === a || spec.startsWith(a + '/'));
    if(alias) base = path.join(root, aliases[alias] + spec.slice(alias.length));
    else if(spec.startsWith('.')) base = path.resolve(path.dirname(path.join(root, fromFile)), spec);
    if(!base) return null;
    for(const candidate of [base + '.ts', path.join(base, 'index.ts'), base])
    {
        if(fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return posix(path.relative(root, candidate));
    }
    return null;
}

function parse(text)
{
    const imports = [];
    const reexports = [];
    const names = list => list.split(',').map(n => n.trim().replace(/^type\s+/, '')).filter(Boolean).map(n => n.split(/\s+as\s+/)[0]);
    for(const m of text.matchAll(/import\s+(?:type\s+)?(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*(?:\*\s+as\s+\w+\s*)?from\s+['"]([^'"]+)['"]/g))
    {
        const star = /import\s+(?:type\s+)?\*\s+as/.test(m[0]);
        imports.push({ spec: m[3], names: star ? '*' : [...(m[1] ? ['default'] : []), ...(m[2] ? names(m[2]) : [])] });
    }
    for(const m of text.matchAll(/import\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) imports.push({ spec: m[1] ?? m[2], names: '*' });
    for(const m of text.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) reexports.push({ spec: m[1], names: '*' });
    for(const m of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*from\s+['"]([^'"]+)['"]/g)) reexports.push({ spec: m[2], names: names(m[1]) });
    const declares = new Set([...text.matchAll(/export\s+(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|const|let|var|function|enum)\s+(\w+)/g)].map(m => m[1]));
    for(const m of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g)) for(const n of m[1].split(',')) declares.add(n.trim().split(/\s+as\s+/).pop());
    if(/export\s+default/.test(text)) declares.add('default');
    return { imports, reexports, declares };
}

export function findOrphans({ root, entries, scan, aliases })
{
    const cache = new Map();
    const info = file =>
    {
        if(!cache.has(file)) cache.set(file, parse(fs.readFileSync(path.join(root, file), 'utf8')));
        return cache.get(file);
    };
    const provides = (file, name, seen = new Set()) =>
    {
        if(seen.has(file)) return false;
        seen.add(file);
        const { declares, reexports } = info(file);
        if(declares.has(name)) return true;
        return reexports.some(r => (r.names === '*' || r.names.includes(name)) && (() =>
        {
            const target = resolveSpec(root, file, r.spec, aliases);
            return target !== null && provides(target, name, seen);
        })());
    };
    const reached = new Set();
    const visited = new Set();
    const queue = entries.map(file => [file, '*']);
    while(queue.length)
    {
        const [file, wanted] = queue.pop();
        const key = `${file}|${wanted === '*' ? '*' : wanted.join(',')}`;
        if(visited.has(key)) continue;
        visited.add(key);
        reached.add(file);
        const { imports, reexports } = info(file);
        for(const imp of imports)
        {
            const target = resolveSpec(root, file, imp.spec, aliases);
            if(target) queue.push([target, imp.names]);
        }
        for(const r of reexports)
        {
            const target = resolveSpec(root, file, r.spec, aliases);
            if(!target) continue;
            if(wanted === '*') queue.push([target, r.names]);
            else
            {
                const needed = wanted.filter(n => (r.names === '*' || r.names.includes(n)) && provides(target, n));
                if(needed.length) queue.push([target, needed]);
            }
        }
    }
    const all = [];
    const walk = dir =>
    {
        for(const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true }))
        {
            const rel = posix(path.join(dir, e.name));
            if(e.isDirectory()) { if(e.name !== 'node_modules' && e.name !== 'assets') walk(rel); }
            else if(rel.endsWith('.ts') && !rel.endsWith('.d.ts')) all.push(rel);
        }
    };
    scan.forEach(walk);
    return all.filter(f => !reached.has(f)).sort();
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const root = process.cwd();
    const E = 'packages/vortex-engine/src';
    const C = 'packages/vortex-client/src';
    const orphans = findOrphans({
        root,
        entries: [`${E}/index.ts`, `${C}/index.ts`, 'packages/vortex-glaze/src/main.ts', 'packages/vortex-imager/src/index.ts'],
        scan: [E, C],
        aliases: { '@core': `${E}/core`, '@habbo': `${E}/habbo`, '@room': `${E}/room`, '@iid': `${E}/iid`, '@ui': C, '@': C }
    });
    for(const f of orphans) console.log(f);
    console.error(`${orphans.length} orphan file(s)`);
    if(process.argv.includes('--delete')) for(const f of orphans) fs.rmSync(path.join(root, f));
}
```

Note : les alias valent pour tout le code du dépôt ; `@`/`@ui` n'apparaissent que dans le client, et le moteur n'importe jamais le client (mur ESLint).

- [ ] **Step 3 :** `node --test .claude/scripts/find-orphans.test.mjs` → PASS 2/2.
- [ ] **Step 4 : lecture d'abord.** `node .claude/scripts/find-orphans.mjs > /tmp/orphans.txt` ; relire la liste. Toute entrée hors de `habbo/communication/messages/`, `habbo/ui/widget/{events,messages}/` ou d'un module déjà vidé se vérifie à la main (`grep -rn "<NomDeClasse>" packages/*/src`) avant suppression : un fichier chargé par un mécanisme que l'outil ne voit pas (chaîne de caractères, `import.meta.glob`) se garde et se note.
- [ ] **Step 5 :** `node .claude/scripts/find-orphans.mjs --delete`, puis retirer des barils les lignes `export * from './X'` dont la cible n'existe plus : `pnpm typecheck 2>&1 | grep "Cannot find module"` les désigne ; recommencer Steps 4-5 jusqu'à zéro orphelin et zéro erreur.
- [ ] **Step 6 :** `pnpm check` vert ; `pnpm build` vert ; eslint sans erreur ; noter le nouveau nombre de fichiers du moteur.
- [ ] **Step 7 :** commit `noyau: fichiers orphelins balayés (outil find-orphans testé)` en nommant `.claude/scripts/find-orphans.mjs`, `.claude/scripts/find-orphans.test.mjs` et `packages/vortex-engine/src packages/vortex-client/src`.

### Task 8 : Validation réelle et documentation

- [ ] **Step 1 :** démarrer l'émulateur (`../vortex-rpg-emulator`, skill `run-vortex-emulator` de ce dépôt), le serveur d'assets et `pnpm dev`. Si l'un manque sur la machine, s'arrêter à ce step, l'écrire dans le ledger et dans le message final : la validation réelle reste due au propriétaire.
- [ ] **Step 2 :** obtenir un ticket : inscription ou connexion sur la WebApi de l'émulateur, puis `GET /api/ssotoken` (cookie de session).
- [ ] **Step 3 :** `node .claude/skills/run-vortex-client/driver.mjs "goto http://localhost:5173/client/?sso=<ticket>" "wait 8000" "ss zone" errors net` → la capture montre la zone de développement et l'avatar ; `errors` vide.
- [ ] **Step 4 :** `"click <case du sol>" "wait 1500" "ss marche"` (l'avatar s'est déplacé) ; clic sur l'avatar → `"ss nom"` (la bulle de nom s'affiche, rien d'autre) ; `errors` vide ; `"eval Vortex.instance.openAvatarEditor()" "wait 1000" "ss editeur"` (l'éditeur s'ouvre).
- [ ] **Step 5 :** `"eval __packets.unhandled()"` → seuls les événements notés « ignorés volontairement » en Task 6 peuvent y figurer.
- [ ] **Step 6 :** documentation : `CLAUDE.md` (carte : ce qui reste dans `habbo/` ; « Never » : ne pas re-porter les fonctions retirées par la coupe, carrière = tag `pre-noyau-client`), `docs/superpowers/specs/2026-10-07-client-architecture-design.md` (§2 constat et §9 : J6 réduit d'autant), puis `pnpm sync:agents`. Écrire `docs/superpowers/plans/2026-10-07-coupe-noyau-client.bilan.md` : avant/après (fichiers, lignes), décisions de la Task 6, événements ignorés, ce qui n'a pas pu être validé.
- [ ] **Step 7 :** `pnpm check` vert ; commit `noyau: validation réelle, documentation et bilan`.
