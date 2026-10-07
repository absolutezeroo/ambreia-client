# Architecture du client — moteurs séparés, features branchables, config typée

> **Statut :** à relire par le propriétaire · **Date :** 2026-10-07 · **Langue :** français
> **Dépôt :** `vortex-rpg-client`. Pendant client du F0 (« M0 bis ») de la spec unifiée
> `vortex-rpg-emulator/docs/superpowers/specs/2026-10-06-vortex-rpg-design.md` (§3.4 bis, §21.2).
> Remplace la §16.1 de cette spec pour l'organisation du code client.
> Les chemins sont relatifs à `packages/` sauf mention contraire ; `E` = `vortex-engine/src`,
> `C` = `vortex-client`.

---

## 1. Intention

Le client est un port complet du client Flash de Habbo. Le fork RPG n'a plus à rester fidèle à
Habbo : on garde le fonctionnement, on le range comme une architecture moderne.

**Objectifs, dans l'ordre :**

1. **Générer des avatars sans embarquer tout le client** (navigateur et Node).
2. **Ajouter ou retirer une feature facilement**, sans effet de bord ailleurs.
3. **Refaire la configuration**, typée et prévisible.
4. **Pouvoir travailler chaque partie seule**, et construire de **vrais outils** au-dessus (World
   editor, inspecteur de paquets, studio d'avatar…).

**Moyen :** trois moteurs autonomes — **isométrique**, **avatar**, **fenêtres** — plus le réseau,
sous un noyau et une couche de jeu. Les trois moteurs sont **extraits**, pas réécrits : ils
marchent, le problème est leur emballage.

**Hors périmètre :** réécrire le rendu, le système de fenêtres ou les ~870 messages existants ;
changer le format des layouts XML ; le gameplay RPG (specs filles de la spec unifiée).

---

## 2. Constat (mesuré le 2026-10-07)

| Zone | Fait | Preuve |
|---|---|---|
| Bas du moteur | `core/`, `room/` et `iid/` n'importent jamais `habbo/` | graphe d'imports, 0 arête montante |
| Fenêtres | `core/window` (262 fichiers) est autonome ; `habbo/window` porte le branchement et les widgets de jeu | `E/habbo/window/HabboWindowManager.ts`, `IHabboWindowManager.ts` importent room, avatar, catalog, communication, session, config, chat ; widgets `AvatarImageWidget`, `FurnitureImageWidget`, `PetImageWidget`, `BadgeImageWidget`, `RoomPreviewerWidget`, `ProductIconWidget` |
| Avatar | Le rendu n'importe ni UI, ni réseau, ni session, ni room ; ces liens viennent de l'**éditeur** | closure de `AvatarRenderManager.ts` : 139 fichiers ; aucun vers `core/window`, `habbo/window`, `communication`, `session`, `catalog`, `inventory`, `habbo/room` |
| Avatar → client | Hérite de `Component`, reçoit config et assets par DI, ne lit que 5 clés | `E/habbo/avatar/AvatarRenderManager.ts:2-5`, clés `:653,677,694,772-779,791` |
| Avatar → barre de chargement | `Core.instance?.updateLoadingProcess(...)` | `E/habbo/avatar/AvatarAssetDownloadManager.ts:478` |
| Imager | Doit simuler un DOM et un faux `Vortex.ts` | `vortex-imager/src/shim/{globals,pixi,vortex}.ts` ; le faux `Vortex.ts` est dû au rendu de room : `E/habbo/room/RoomEngine.ts:15`, `E/room/object/visualization/RoomObjectSpriteVisualization.ts`, `E/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.ts:21` |
| Réseau | Transport sain ; un registre géant de 436 events + 434 composers à numéros en dur | `E/core/communication/` ; `E/habbo/communication/HabboMessages.ts` (3 015 lignes) |
| Features | Deux registres centraux obligatoires + pièges silencieux | `E/VortexMain.ts` (`prepareCore`, ex. `:910-911`) ; `HabboMessages.ts` ; `C/src/App.ts:683` `LIBRARY_IMAGE_NAMES` (oubli = image absente sans erreur) ; `switch` dans `E/habbo/room/RoomObjectFactory.ts`, `E/habbo/ui/RoomDesktop.ts`, `E/habbo/ui/RoomWidgetFactory.ts`, `E/habbo/ui/handler/ChatInputWidgetHandler.ts` |
| Config | Un `Map<string,string>`, ~270 clés en chaînes brutes, défauts éparpillés, ordre fragile | `E/habbo/configuration/HabboConfigurationManager.ts:37` ; `E/VortexMain.ts:694-741` (dont `await Promise.resolve()`) ; hôte en dur dans `C/index.html` ; doublons dans `HabboProperty.ts` |

**Après la coupe au noyau (2026-10-07, `docs/superpowers/plans/2026-10-07-coupe-noyau-client.bilan.md`).**
Le moteur passe de 4 086 à 1 743 fichiers `.ts` (538 753 → 233 953 lignes). `habbo/` ne garde que
`avatar` (rendu + éditeur), `communication`, `configuration`, `localization`, `room`, `session`, `ui`
(bureau de room, bulle de nom), `window`, `utils`, `perf`. `HabboMessages.ts` n'enregistre plus que
46 events et 14 composers, alignés 1:1 sur le serveur coupé. Les chiffres et preuves du tableau
ci-dessus décrivent l'état d'avant la coupe (tag `pre-noyau-client`).

---

## 3. Les paquets et leurs règles — APPROUVÉ

```
            vortex-client        vortex-imager        vortex-glaze       outils (§8)
                 │                    │                    │
             @vortex/game        (avatar, iso)            (ui)
          features + RPG
          ┌──────┼──────────┐
   @vortex/kernel   @vortex/protocol
   DI, config,      messages existants
   features         + en-têtes générés
          │                 │
   ── moteurs : aucune connaissance du jeu ───────────────────────
   @vortex/iso ──► @vortex/avatar     @vortex/ui        @vortex/net
          └───────────────┴───────────────┴─────────────────┘
                               @vortex/common
```

| Paquet | Vient de | Rôle |
|---|---|---|
| `@vortex/common` | `core/utils`, `core/assets`, `core/reactive` | Logger, utilitaires, chargement d'assets |
| `@vortex/net` | `core/communication` | Transport WebSocket, chiffrement, format filaire, registre |
| `@vortex/avatar` | `habbo/avatar` **sans l'éditeur** (pets compris) | Figure + action + direction → image |
| `@vortex/iso` | `room/` + le rendu de `habbo/room` | Plans, objets, visualisations, tri en profondeur, caméra, clic |
| `@vortex/ui` | `core/window` + la partie générique de `habbo/window` | Fenêtres, layouts XML, skins, thèmes, fabrique de widgets |
| `@vortex/kernel` | `core/runtime`, `iid/`, la config | DI, config typée, `defineFeature`, cycle de vie |
| `@vortex/protocol` | `habbo/communication/messages` | Les messages existants, en-têtes générés |
| `@vortex/game` | le reste de `habbo/` | Session, éditeur d'avatar, widgets de jeu, features, RPG |

**Règles :**

1. Les **moteurs** (`common`, `net`, `avatar`, `iso`, `ui`) n'importent jamais `kernel`,
   `protocol` ni `game`. Ils n'utilisent pas le DI : classes à constructeur simple, dépendances
   passées en paramètre (fournisseur d'assets, options typées, résolveur de textes, fabriques de
   canvas et de parser XML). `game` les enveloppe en composants.
2. `iso` PEUT dépendre d'`avatar` (l'avatar affiché dans une room reste dans `iso`). L'inverse est
   interdit.
3. Les features sont des **dossiers** de `game`, pas des paquets. Une feature n'importe pas une
   autre feature, sauf via une interface ou un event déclaré.
4. Les frontières entre paquets sont garanties par les `package.json` (un import non déclaré ne
   se résout pas) ; à l'intérieur de `game`, par une règle ESLint (`no-restricted-imports`).
5. Chaque moteur a un **bac à sable** : une page Vite minimale qui le fait tourner seul.

---

## 4. Brancher une feature — APPROUVÉ

Une feature est un dossier qui se déclare lui-même :

```
game/src/features/fishing/
  feature.ts        ← la déclaration, seul point d'entrée
  FishingManager.ts
  messages/         ← §6
  views/            ← fenêtres et widgets
  layouts/*.xml     ← ses layouts vortex_*
  locale/*.txt      ← ses textes
```

```ts
export const Fishing = defineFeature({
    id: 'fishing',
    provides: IID_Fishing,
    config: z.object({ maxCastsPerMinute: z.number().default(20) }),   // §5
    map: FishingMap,                                                   // §6
    create: ctx => new FishingManager(ctx),
    images: ['fish*'],                              // remplace LIBRARY_IMAGE_NAMES
    roomLogics: { fishing_spot: FishingSpotLogic }, // remplace le switch de RoomObjectFactory
    roomWidgets: { fishing: FishingWidget },        // remplace RoomDesktop + RoomWidgetFactory
    chatCommands: { ':fish': openFishing },         // remplace le switch de ChatInputWidgetHandler
});
```

```ts
// game/src/features.ts — la liste explicite des features branchées
export const FEATURES = [Catalog, Inventory, FriendList, Fishing /* … */];
```

- **Les `switch` deviennent des points d'extension** : registres de logiques d'objet et de
  visualisations (`iso`), de widgets de fenêtre (`ui`), de widgets de room, de commandes de chat
  et d'images (`kernel`/`game`).
- **L'ordre d'attache n'a pas d'importance** : `ComponentDependency` résout déjà dans n'importe
  quel ordre, on le garde.
- **Une dépendance manquante fait échouer le démarrage**, avec le nom de la feature et de ce qui
  manque (aujourd'hui le composant reste verrouillé en silence).
- **Les features se parlent par events typés** (`CombatTargetChanged`, `QuestProgressUpdated`…).
- **Exception à la colocation :** les layouts Habbo d'origine, copiés tels quels du dump, restent
  où ils sont ; seuls les layouts `vortex_*` vont dans leur feature.

**Critère de réussite :** ajouter une feature = un dossier + une ligne dans `FEATURES` ; la
retirer = supprimer le dossier + la ligne, et tout compile.

---

## 5. Configuration — APPROUVÉ

La config est **typée, chargée une seule fois, validée, puis figée** avant qu'aucune feature ne
démarre. Validation par **Zod** (type, défaut et message d'erreur en un seul endroit).

1. **Les moteurs ne lisent aucune clé** : ils reçoivent un objet d'options typé
   (`new AvatarRenderer({ assets, figureDataUrl, figureMapUrl, libraryUrl, … })`).
2. **Chaque feature déclare sa section** (`config` dans `defineFeature`) avec ses défauts, et ne
   voit **que** sa section (`this.config.maxCastsPerMinute`). Le schéma global = une section
   `app` (URLs, serveur) + une section par feature.
3. **Chaque section reçoit un champ `enabled`** (vrai par défaut) : `"fishing": { "enabled": false }`
   désactive la feature sans toucher au code. Si une feature active en dépend obligatoirement, le
   démarrage échoue avec un message clair.
4. **Trois sources, ordre fixe, fusionnées une fois :** défauts des schémas → `config.json` du
   déploiement (remplace `common_configuration_txt`, `external_variables` et l'hôte en dur de
   `index.html`) → paramètres d'URL listés (`?sso=`, `?link=`).
5. **Config invalide = démarrage arrêté** sur un écran qui liste les champs fautifs.
6. **Section inconnue dans `config.json`** (feature retirée) = avertissement au démarrage.

```json
{
  "app":     { "baseUrl": "https://jeu.exemple.fr", "server": "wss://jeu.exemple.fr/ws" },
  "fishing": { "maxCastsPerMinute": 30 }
}
```

**Disparaissent :** le `Map<string,string>`, les défauts éparpillés, les clés persistantes ou en
lecture seule, les deux mécanismes d'environnement, le second téléchargement, l'ordre par
microtâche, la liste de clés réservées, l'interpolation `${…}` (une `baseUrl` suffit ; les gabarits
`%param%` restent où ils servent, par exemple les noms de bibliothèques d'avatar).

**Migration :** l'ancien format `clé=valeur` est chargé dans une section `legacy`, lue par un
`getProperty(clé)` de compatibilité ; les ~270 appels continuent de marcher. Chaque feature migrée
retire ses clés. Quand `legacy` est vide, l'adaptateur est supprimé.

---

## 6. Réseau — APPROUVÉ

**`@vortex/net`** reprend `core/communication` tel quel (connexion, chiffrement, format, registre).

**Nouveaux messages : le découpage du serveur, sens inversés.** Le serveur a
`Vortex.Protocol/Messages/{Incoming,Outgoing}` (données pures), `Revision…/Parsers`,
`Revision…/Serializers`, `Revision…/Maps/<Domaine>Map.cs` et `Vortex.PacketHandlers`
(`IMessageHandler<T>`). Le client fait pareil, dans le dossier de la feature :

```
game/src/features/combat/messages/
  incoming/     SkillCastResultMessage.ts        ← données pures
  outgoing/     SkillCastMessage.ts              ← données pures
  parsers/      SkillCastResultMessageParser.ts  ← fil → message
  serializers/  SkillCastMessageSerializer.ts    ← message → fil
  handlers/     SkillCastResultHandler.ts        ← orchestration, délègue au manager
  CombatMap.ts                                   ← en-têtes ↔ parsers / serializers / handlers
```

```ts
net.send(new SkillCastMessage(skillId, targetId));   // serializer retrouvé par la classe

export class SkillCastResultHandler implements IMessageHandler<SkillCastResultMessage>
{
    handle(message: SkillCastResultMessage): void { this._combat.applyResult(message); }
}
```

- Mêmes noms de champs que le serveur ; un dossier client correspond à un dossier serveur.
- Les handlers et les vues ne voient jamais un `MessageDataWrapper`.
- Pas de niveau « Revision » : le client ne parle qu'à un serveur.

**En-têtes générés depuis le serveur — APPROUVÉ.** `tools/gen-headers.mjs` lit
`vortex-rpg-emulator/Vortex.Revisions/Revision20260701/Headers.cs` (des `public const int Nom = N;`
dans les classes `MessageEvent` et `MessageComposer`) et produit `@vortex/protocol/src/Headers.ts`
(commité) : `MessageComposer` → `Incoming.*`, `MessageEvent` → `Outgoing.*`. Le hook de pré-commit
régénère et refuse le commit en cas d'écart. **L'émulateur devient la source de vérité des
numéros** : la règle « registre WIN63 d'abord » de `CLAUDE.md` est abandonnée.

**Messages existants :** les ~870 restent dans leur style (Event + Parser + Composer) dans
`@vortex/protocol` ; `HabboMessages.ts` les garde et rétrécit (migrations, suppressions). Leurs
numéros passent aux constantes générées. `net` accepte les deux styles. Une feature existante passe
au nouveau style **quand on la retravaille**, jamais en migration de masse. La trentaine de types
que ces messages empruntent à `room`, `inventory` et `catalog` descendent dans `protocol`.

**Hors de cette spec :** regroupement par tick et snapshot/deltas (spec unifiée §3.7) — conception
de messages, tranchée par la spec fille Combat.

---

## 7. Sécurité — APPROUVÉ

Un outil comme G-Earth se place entre client et serveur sur la machine du joueur : il lit,
modifie, injecte et automatise. Le chiffrement RSA/RC4 ne l'arrête pas (le joueur contrôle le
client). **Aucune protection côté client ne tient** ; la défense est l'autorité du serveur
(spec unifiée INV-001, §3.1).

| Attaque | Parade | Où |
|---|---|---|
| Injecter une intention | Revalidation complète : portée, ligne de vue, cooldown, ressources, possession, état | Serveur |
| Modifier une valeur | Le serveur ne lit jamais une valeur qui produit de la richesse ; il la recalcule | Serveur |
| Spammer | Limite de débit par intention (F3) | Serveur |
| Rejouer | Opérations atomiques et idempotentes (INV-005), un propriétaire par ressource | Serveur |
| Lire l'invisible | Ne jamais l'envoyer (filtrage par zone d'intérêt) | Conception des messages |
| Falsifier son propre affichage | Sans conséquence pour les autres | — |
| Automatiser | Cooldowns serveur, métriques par joueur, rendements décroissants | Serveur + observabilité |

**Règles pour le client :**

1. Le client **n'est jamais une barrière de sécurité**. Les types TypeScript protègent contre nos
   bugs, pas contre un attaquant ; l'émulateur revalide chaque champ entrant.
2. **`config.json` est public** : aucun secret (clé, jeton, URL d'administration).
3. **Chaque spec fille liste ce que ses messages révèlent** au client, et justifie qu'il a le droit
   de le savoir.
4. **`wss://` obligatoire en production** (protège contre un tiers sur le réseau, pas contre le
   joueur).
5. Le **chiffrement RC4 est gardé** pour l'instant (`net` le reprend tel quel). Son retrait
   éventuel se décide plus tard, des deux côtés en même temps.
6. Les outils de développement (§8) **ne sont pas dans le build de production** — pour ne pas
   livrer de code inutile, pas comme protection.

---

## 8. Outils — APPROUVÉ

Un outil est une application branchée sur les paquets moteurs, comme Glaze sur `ui` ou l'imager
sur `avatar`. Cette spec fixe les **points d'accroche** et la feuille de route ; chaque outil
autonome aura sa propre spec.

| Outil | Rôle | Construit sur | Débloqué à |
|---|---|---|---|
| Inspecteur de paquets (dev) | Paquets entrants et sortants décodés champ par champ, filtres, rejouer, modifier et renvoyer, injecter un faux message entrant | point d'écoute et d'injection de `net` + `E/core/communication/PacketLogger.ts` existant | J1 |
| Panneau DevTools (dev) | Features chargées et dépendances, config résolue, état de la room | introspection de `kernel` | J5 |
| Studio d'avatar | Figures, actions, directions, effets ; export de planches de sprites | `avatar` (bac à sable J2) | J2 |
| Glaze (existe) | Édition des fenêtres | `ui` seul | J3 |
| World editor | Construction des zones (spec unifiée F4) | `iso` + `avatar` | J4 |

**Points d'accroche dus par les jalons :** `net` expose l'écoute, la modification et l'injection
de paquets (activé en dev seulement) ; `kernel` expose la liste des features, leurs dépendances
et la config résolue ; `iso` est utilisable hors du client (bac à sable, puis World editor).

**Recommandation pour la décision ouverte n° 23 de la spec unifiée** (technologie du World
editor) : avec un `@vortex/iso` autonome, une coquille de bureau (Tauri ou Electron) qui réutilise
le vrai rendu devient l'option la moins chère, et l'éditeur montre exactement ce que verra le
joueur. Décision finale : spec fille du World editor.

---

## 9. Jalons — APPROUVÉ

Règle : **à la fin de chaque jalon, le client compile, démarre et on entre dans une room.** On
extrait de bas en haut. Chaque déplacement est une tâche (`git mv`, vérifications vertes avant le
commit). Les alias `@core`, `@habbo`, `@room`, `@iid` disparaissent au fil des extractions ; un
**codemod** réécrit les imports à chaque étape.

| # | Jalon | Contenu | Preuve |
|---|---|---|---|
| J0 | Préparation | Terminer et merger le M0 client ; réécrire `00-mandate`, `30-as3-traceability`, `CLAUDE.md` (§10) ; générateur d'en-têtes ; contrôle des frontières | Le hook refuse un import interdit ; `Headers.ts` généré et vérifié |
| J1 | `common` + `net` | Extraire `core/utils`, `assets`, `reactive`, puis `core/communication` ; adapter `C/tools/vite-plugin-engine-bundle.mjs` à plusieurs paquets ; point d'écoute de `net` — **fait le 2026-10-07** sous les noms `@ambreia/common` et `@ambreia/net` (bilan `plans/2026-10-07-j1-common-net.bilan.md`) | `pnpm build`, `pnpm dev` OK, rechargement dev pas plus lent qu'avant |
| J2 | `avatar` | Éditeur sorti vers `game` ; constructeur simple, options typées ; fabriques canvas et XML injectées ; `Core.instance` retiré ; imports `@vortex/common` ciblés (pas tous les chargeurs) — **fait le 2026-10-07** sous le nom `@ambreia/avatar` (bilan `plans/2026-10-07-j2-avatar.bilan.md`) ; le shim pixi de l'imager reste pour la room jusqu'à J4 | Un script Node génère un PNG d'avatar en n'important que `@vortex/avatar` (+ `common`) ; l'imager n'a plus de shim pour les avatars |
| J3 | `ui` | `core/window` + partie générique de `habbo/window` ; registre de widgets ; widgets de jeu enregistrés depuis `game` | Bac à sable `ui` qui affiche un layout ; Glaze ne dépend plus que de `ui` |
| J4 | `iso` | `room/` + rendu de `habbo/room` ; les 3 imports de `Vortex.ts` supprimés ; registres de logiques et de visualisations | Bac à sable `iso` qui charge une room ; l'imager rend une room sans faux `Vortex.ts` |
| J5 | `kernel` | DI ; config Zod (sections, `enabled`, `legacy`) ; `defineFeature`, `FEATURES` ; échec bruyant ; introspection | `VortexMain.prepareCore` remplacé, démarrage identique |
| J6 | `protocol` + `game` | Messages existants dans `protocol`, nouveau style réseau disponible ; reste de `habbo/` dans `game` ; features passées à `defineFeature` une par une ; `LIBRARY_IMAGE_NAMES` supprimé | Ajouter / retirer une feature = un dossier + une ligne |

La coupe au noyau (entre J0 et J1) a retiré les modules de l'hôtel avant les extractions : J6 n'a
plus à migrer que les features gardées (room, session, éditeur d'avatar, bulle de nom), et les 60
messages du contrat au lieu de 870.

Ensuite, le RPG reprend à **F1** de la spec unifiée sur cette base.

---

## 10. Règles du dépôt après la refonte — APPROUVÉ

- Les traces `AS3:` restent, comme **provenance** du code.
- La **fidélité à l'AS3 n'est plus obligatoire** pour ce qu'on restructure ou modifie ;
  `00-mandate.md` et `30-as3-traceability.md` sont réécrits en conséquence (lire l'AS3 reste
  recommandé pour comprendre un comportement hérité).
- La **synchro avec `vortex-modern-client` s'arrête** (les chemins divergent).
- Les **numéros de messages viennent de l'émulateur** (§6).
- Des **paquets npm** sont admis quand ils apportent réellement quelque chose (ex. Zod).

---

## 11. Tests et vérifications

À chaque jalon : `pnpm build`, `pnpm lint`, contrôle des frontières, parcours manuel (connexion,
entrée en room, avatar visible, ouverture d'une fenêtre), plus :

| Jalon | Test propre |
|---|---|
| J0 | Le hook refuse un import interdit (cas de test) ; `Headers.ts` identique après régénération |
| J1 | Aller-retour écrivain/lecteur du format filaire (int, short, string, booléen, liste) |
| J2 | Rendu d'avatar dans Node, comparé à une image de référence |
| J3 | Le bac à sable `ui` charge un layout `vortex_*` et un layout Habbo |
| J4 | Le bac à sable `iso` charge une room ; rendu de room par l'imager |
| J5 | Config invalide → erreur listant le champ ; dépendance manquante → erreur nommée ; `enabled: false` respecté |
| J6 | Retirer une feature de démonstration (dossier + ligne) laisse le build vert |

---

## 12. Décisions ouvertes

| # | Décision | Où elle se tranche |
|---|---|---|
| 1 | Nom de portée des paquets (`@vortex/*` proposé) | Plan J0 |
| 2 | Bundle de dev à plusieurs paquets : un esbuild commun ou un par paquet | **Tranché (plan J1)** : un seul esbuild pour le moteur et tous les paquets |
| 3 | Frontière exacte « générique / jeu » dans `habbo/window` (widget par widget) | Plan J3 |
| 4 | Frontière exacte « rendu / logique » dans `habbo/room` | Plan J4 |
| 5 | Retrait du chiffrement RC4 | Plus tard, client et serveur ensemble |
| 6 | Technologie du World editor | Spec fille World editor (recommandation §8) |
