# M0 — Ménage client : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** retirer de `vortex-rpg-client` les features que le RPG n'utilisera pas, en gardant à chaque étape un typecheck, un lint et un build verts et un client qui démarre.

**Architecture :** une tâche = une feature retirée entièrement : composant, sous-contrôleurs, messages (events, parsers, composers) et leur enregistrement dans `HabboMessages.ts`, widgets de room, entrées de toolbar, layouts, images et textes. Les features sont retirées des feuilles vers le cœur.

**Tech stack :** TypeScript, PixiJS v8, pnpm workspace (`vortex-engine`, `vortex-client`, `vortex-glaze`, `vortex-imager`).

**Spec :** `vortex-rpg-emulator/docs/superpowers/specs/2026-10-05-habbo-rpg-design.md` (sections 2, 7 et 9). Elle vit dans le fork serveur : `D:\Developpment\Habbo\vortex-rpg-emulator\docs\superpowers\specs\`.

**Plan jumeau :** `vortex-rpg-emulator/docs/superpowers/plans/2026-10-05-m0-menage-serveur.md`. Exécuter **après** lui : la Tâche 11 démarre le client contre le serveur nettoyé.

## Global Constraints

- Une tâche = un commit. Avant chaque commit, les 4 commandes de vérification passent :
  - `pnpm --filter vortex-client exec tsc --noEmit` (couvre client et engine)
  - `pnpm --filter vortex-imager typecheck`
  - `pnpm lint`
  - `pnpm build`
- Il n'existe **aucun test automatisé** dans ce dépôt. La preuve qu'une tâche est finie, c'est : les 4 commandes vertes, le grep de contrôle de la tâche vide, et le démarrage du client (skill `run-vortex-client`) sans erreur dans la console.
- Commits : nommer les chemins (`git add -A -- <chemins>` puis `git commit -m "..." -- <chemins>`). Le hook husky lance `lint-staged` (eslint --fix) : relire le diff s'il a reformaté.
- **Avant de supprimer un appel dans du code gardé, lire le corps de la méthode appelée** (`.claude/rules/00-mandate.md`) : un nom ne prouve pas qu'un appel est inerte.
- Le moteur n'importe jamais le client. Ne jamais surcharger `get events()`. Conventions : accolades Allman, `if(`, exports nommés, `| null`.
- Les fichiers `index.ts` de `messages/` se disent « auto-generated » : il faut quand même les éditer quand un dossier de messages disparaît.
- Les layouts Flash ne sont **pas** dans git : ils sont dans `vortex-client-assets.zip` (`window-layouts/`), extraits par `node install.mjs` et réemballés par `node install.mjs --pack`. Seuls les 17 layouts de `vortex-client/src/vortex-layouts/` sont suivis.
- Les ids de header d'un message gardé ne changent pas.
- Mettre à jour `docs/IMPLEMENTATION_STATUS.md` à chaque tâche (le hook local `check-status-doc` le vérifie s'il est installé).

## Décisions prises par défaut (le propriétaire peut les renverser avant exécution)

1. **Derby de pêche** : gardé, il fait partie de la pêche (futur métier).
2. **Coffre de gains (`catalog/earnings/`, `IID_VaultController`)** : gardé, le serveur le garde.
3. **SnowWar / Game2 (`habbo/game/`, `HabboGameManager`)** : retiré. Le serveur n'héberge pas ce jeu. Freeze, BattleBanzai et Football n'ont pas de module client dédié (ils utilisent des logiques de furni génériques) : rien à retirer pour eux, sauf les types d'action wired `FreezeUser`/`UnfreezeUser` qui partent avec les wired.
4. **Compétitions de room** : gardées, seule la partie vote (rating) est retirée de `RoomCompetitionController`.
5. **Word quiz** : retiré avec les sondages (le serveur les retire ensemble).
6. **Pets** : l'énergie, la faim et la soif s'affichent encore (le serveur envoie toujours le maximum) ; les boutons de nourriture et de supplément, l'élevage et les plantes disparaissent. La personnalisation par furni (`FurniturePetCustomizationLogic`) reste pour la selle.
7. **Club HC (`catalog/clubcenter/`)** : gardé, ce n'est pas le Builders Club.
8. **`room/utils/RoomCamera.ts`** : gardé, c'est la caméra de la vue de room, pas les photos.

## Review Focus

1. **Message reçu sans parser enregistré** après une suppression : le serveur nettoyé n'envoie plus ces messages, mais un oubli côté serveur ferait une erreur à la réception. Vérifié en Tâche 11 (console du client pendant le parcours de fumée).
2. **Composant attaché par IID mais plus construit** : un getter de `VortexMain` qui lève `'[HabboMain] Not initialized'` à la première utilisation. Vérifié en Tâche 11 (ouvrir chaque fenêtre de la toolbar).
3. **Icône de toolbar sans consommateur** : un clic qui ne fait rien ou lève. Vérifié en Tâche 11.
4. **Layout XML retiré du zip mais encore demandé** : fenêtre blanche ou exception au chargement. Vérifié par le grep de la Tâche 10 et en Tâche 11.
5. **Pêche cassée par la suppression des Habbicons** (`FishopediaHubView` importe `HabbiconProgressBarView`). Couvert en Tâche 4, Step 1.

---

### Task 0 : Branche, installation, ligne de base

- [ ] **Step 1 : branche et installation**

```bash
git switch -c m0-menage
node install.mjs
```
Expected : `Ready.` en fin d'installation (le fork a été cloné sans `node_modules`, assets générés ni configuration locale).

- [ ] **Step 2 : ligne de base**

Lancer les 4 commandes de vérification. Expected : toutes vertes. Sinon, s'arrêter et le signaler.

- [ ] **Step 3 : démarrage de référence**

Utiliser le skill `run-vortex-client` contre le serveur `vortex-rpg-emulator` (pas encore nettoyé ou déjà nettoyé, peu importe ici). Garder une capture de l'hôtel et la liste des erreurs console existantes : elles servent de référence en Tâche 11.

---

### Task 1 : Règles du fork

Les règles du dépôt imposent de porter **tous** les fichiers AS3. Le fork en retire volontairement : sans amendement, chaque tâche suivante les contredit.

**Files :**
- Modifier : `.claude/rules/20-architecture.md` (règle 8 « Full port »), `CLAUDE.md`, `docs/CONTEXT.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/CLIENT-SERVER-ARCHITECTURE.md`
- Régénérer : bloc `GENERATED-RULES` de `AGENTS.md` par `pnpm run sync:agents` (ne pas l'éditer à la main)

- [ ] **Step 1 : amender la règle 8**

Dans `.claude/rules/20-architecture.md`, après la règle 8, ajouter :

```markdown
   **Exception du fork RPG :** ce dépôt est le client du RPG Habbo
   (spec : `vortex-rpg-emulator/docs/superpowers/specs/2026-10-05-habbo-rpg-design.md`).
   Les features listées en section 7 de la spec (« Retiré ») sont supprimées volontairement et ne
   doivent pas être re-portées. Tout le reste suit toujours la règle du port complet.
```

- [ ] **Step 2 : documents**

- `CLAUDE.md` : en tête, une ligne « Fork RPG de vortex-modern-client ; voir la spec et `.claude/rules/20-architecture.md` règle 8. »
- `docs/IMPLEMENTATION_STATUS.md` : ajouter une section « Retiré dans le fork RPG » (remplie au fil des tâches).
- `docs/CONTEXT.md`, `docs/CLIENT-SERVER-ARCHITECTURE.md` : une phrase qui renvoie à la spec du fork.

- [ ] **Step 3 : régénérer `AGENTS.md`**

Run : `pnpm run sync:agents` → Expected : le bloc `GENERATED-RULES` contient l'exception.

- [ ] **Step 4 : commit**

```bash
git add -A -- .claude/rules CLAUDE.md AGENTS.md docs
git commit -m "m0: les règles du fork autorisent le retrait des features hors RPG" -- .claude/rules CLAUDE.md AGENTS.md docs
```

---

### Task 2 : Wired

Chemins relatifs à `packages/vortex-engine/src/habbo/` sauf mention contraire. « msgs » = `communication/messages/{incoming,outgoing,parser}/`.

**Files :**
- Supprimer : `roomevents/`, `inventory/wired_trading/`, `room/object/variablefx/`, `room/object/visualization/variablefx/`, `room/object/logic/furniture/Furniture{Chest,CoinsChest,FurniChest}Logic.ts` et leurs `*Visualization.ts`, `window/widgets/{I,}ChestItemGridOverlayWidget.ts`, msgs `userdefinedroomevents/`, `iid/IIDHabboUserDefinedRoomEvents.ts`, `IIDWiredMenuController.ts`, `IIDWiredChestController.ts`, `packages/vortex-client/tools/locale-overrides/wired.en.txt`
- À vérifier avant suppression : `room/object/visualization/stacked/` (4 fichiers, probablement wired : lire leurs importeurs)
- Modifier : `packages/vortex-engine/src/VortexMain.ts`, `communication/HabboMessages.ts`, `toolbar/HabboToolbarIconEnum.ts`, `toolbar/BottomBarLeft.ts` et les importeurs du Step 3

- [ ] **Step 1 : constater (test rouge)**

```bash
grep -rlE "roomevents/|IIDHabboUserDefinedRoomEvents|WiredMenu|WiredChest|variablefx|userdefinedroomevents" packages --include=*.ts | grep -v node_modules | wc -l
```
Expected : non nul.

- [ ] **Step 2 : détacher le composant**

Dans `VortexMain.ts` (~l. 915) : retirer la construction de `HabboUserDefinedRoomEvents`, son `attachComponent`, le champ privé et le getter. `HabboUserDefinedRoomEvents.ts` attachait `IID_WiredMenuController` et `IID_WiredChestController` : ils partent avec lui.

- [ ] **Step 3 : couper les importeurs (~29 fichiers)**

Pour chacun, retirer l'usage wired après avoir lu le code appelé :
`RoomEngine.ts`, `IRoomEngineServices.ts`, `RoomMessageHandler.ts`, `HabboToolbar.ts`, `RoomUI.ts`, `RoomDesktop.ts`, `IRoomWidgetHandlerContainer.ts`, `ChatInputWidgetHandler.ts`, `AvatarInfoWidget.ts`, `RoomToolsWidget.ts`, `HabboInventory.ts`, `furni/FurniGridView.ts`, `NotificationMessageHandler.ts`, `HabboQuestEngine.ts`, `seasonalcalendar/CatalogPromo.ts`, `HabboActivityDetection.ts`, `RequestBadgeButtonElementHandler.ts`, `catalog/collectibles/CollectiblesController.ts` (supprimé en Tâche 5 de toute façon : retirer seulement l'import pour garder le build vert).
Variable FX : `IRoomEngine.ts`, `MovingObjectLogic.ts`, `RoomObjectVisualizationFactory.ts`, `RoomObjectFactory.ts`, `AvatarVisualization.ts`, `StackedAdditions.ts`, `VariableFxConfigStore.ts`, `VariableFxVisualizationRoomData.ts`.
Les logiques de coffre retirées : retirer leurs entrées de la fabrique de logiques de furni.

- [ ] **Step 4 : messages et toolbar**

- `HabboMessages.ts` : supprimer les sections `WIRED` (events ~l. 2273, composers ~l. 3041), `VARIABLE FX` (~l. 2309), `WIRED WEB API` (~l. 2327), `WIRED CHESTS` (~l. 2386, ~l. 3086), les entrées `WiredMovements` et `BCPlacement` de `ROOM ENGINE` (le BC part en Tâche 3 ; si l'entrée BC bloque, la laisser jusqu'à la Tâche 3), et les imports correspondants.
- Supprimer les dossiers de messages, mettre à jour les `index.ts` concernés.
- `toolbar/HabboToolbarIconEnum.ts` : retirer `WIRED_MENU` ; `BottomBarLeft.ts` : retirer sa visibilité. Le consommateur (`HabboUserDefinedRoomEvents.ts:746`) est supprimé.

- [ ] **Step 5 : supprimer les fichiers**

Supprimer la liste « Files : Supprimer » ci-dessus.

- [ ] **Step 6 : vérifier**

Relancer la commande du Step 1 → Expected : `0`. Les 4 commandes de vérification → vertes. Démarrer le client, entrer dans une room avec des furni : aucune erreur console nouvelle par rapport à la Tâche 0.
Ajouter « Wired » à la section « Retiré dans le fork RPG » de `docs/IMPLEMENTATION_STATUS.md`.

- [ ] **Step 7 : commit**

```bash
git add -A -- packages docs
git commit -m "m0: retire les wired (éditeur, variables, coffres, messages)" -- packages docs
```

---

### Task 3 : Builders Club

**Files :**
- Supprimer : `catalog/viewer/widgets/Builder{,Addons,Loyalty,Subscription}CatalogWidget.ts`, `catalog/viewer/widgets/events/CatalogWidgetBuilderSubscriptionUpdatedEvent.ts`, `catalog/enum/BuilderFurniPlaceableStatus.ts`, `utils/BuilderClubUtils.ts`, `window/utils/floorplaneditor/BCFloorPlanEditor.ts`, `room/object/visualization/furniture/FurnitureBuilderPlaceholderVisualization.ts`, messages `BuildersClubSubscriptionStatus`, `BuildersClubFurniCount`, `BCPlacementWarning`, `BuildersClubQueryFurniCountMessageComposer`
- Modifier (~25 fichiers) : `HabboCatalog.ts` (dont le clic `BUILDER` → `toggleCatalog(CatalogType.BUILDER)` ~l. 4530), `CatalogType` (`BUILDER`), `RoomEngine`, `SessionDataManager`, `FurnitureData`, `RoomSettingsCtrl`, les fichiers infostand/chooser qui testent le BC, `HabboWindowManager`, `window/utils/floorplaneditor/*` (garder l'éditeur standard), `toolbar/HabboToolbarIconEnum.ts` (`BUILDER`), `toolbar/BottomBarLeft.ts` (~l. 465)
- **Ne pas toucher** `catalog/clubcenter/` (Habbo Club)

- [ ] **Step 1 : constater**

```bash
grep -rliE "builder|BCPlacement|BuildersClub" packages/vortex-engine/src --include=*.ts | grep -v clubcenter
```
Expected : non vide. Lire la liste : `builder` attrape aussi des noms sans rapport (constructeurs de chaînes, `StringBuilder`…), ne traiter que le Builders Club.

- [ ] **Step 2 : supprimer et couper** les fichiers ci-dessus ; retirer les entrées de `HabboMessages.ts` et les imports.

- [ ] **Step 3 : vérifier**

Le grep du Step 1 ne doit plus montrer de fichier Builders Club. 4 commandes vertes. Démarrer : le catalogue s'ouvre, l'éditeur de plan de sol s'ouvre. Mettre à jour `IMPLEMENTATION_STATUS.md`.

- [ ] **Step 4 : commit**

```bash
git add -A -- packages docs
git commit -m "m0: retire le Builders Club" -- packages docs
```

---

### Task 4 : Habbicons et Reward track

**Files :**
- Déplacer d'abord : la vue `HabbiconProgressBarView` (importée par `vortex/fishing/ui/FishopediaHubView.ts:10`) vers `vortex/fishing/ui/ProgressBarView.ts`
- Supprimer (Habbicons) : `habbicons/`, `catalog/habbicons/`, `messenger/habbicons/`, `ui/widget/chatinput/habbiconselector/`, `room/messages/RoomObjectAvatarHabbiconUpdateMessage.ts`, `visualization/avatar/additions/HabbiconBubble.ts`, msgs `habbicons/`, `iid/IIDHabbiconController.ts`
- Supprimer (Reward track) : `quest/rewardtrack/`, `quest/events/UnseenRewardTrackRewardsCountUpdateEvent.ts`, `iid/IIDRewardTrackController.ts`, `packages/vortex-client/src/vortex-layouts/reward_track_main_xml.xml`, `packages/vortex-client/tools/locale-overrides/rewardtrack.en.txt`
- Modifier : `HabboCatalog.ts` (retirer l'attache de `IID_HabbiconController`, ~l. 436-442), `PurchaseConfirmationDialog`, `ProductViewCatalogWidget`, `HabboMessenger`, `messenger/MainView`, `AvatarLogic`, `RoomUI`, `RoomChatInputView`, `IlluminaChatBubbleWidget`, `ProductIconWidget`, `HabboQuestEngine.ts` (retirer l'attache de `IID_RewardTrackController`, ~l. 1042), `IHabboQuestEngine`, `HabboNotifications`, `HabboMessages.ts` (section `REWARD TRACK` ~l. 4002, events RewardTracks ~l. 2690, section Habbicons)

- [ ] **Step 1 : sauver la pêche (Review Focus 5)**

Déplacer `HabbiconProgressBarView` vers `vortex/fishing/ui/ProgressBarView.ts` (renommer la classe en `ProgressBarView`, garder son commentaire de trace AS3 ou passer en `// TS-only:` s'il n'a pas d'équivalent AS3). Mettre à jour l'import de `FishopediaHubView.ts`.
Run : `pnpm --filter vortex-client exec tsc --noEmit` → vert. Démarrer le client, ouvrir la Fishopedia : la barre de progression s'affiche.

- [ ] **Step 2 : supprimer Habbicons et Reward track**, couper les importeurs listés, retirer les entrées de `HabboMessages.ts`.

- [ ] **Step 3 : vérifier**

```bash
grep -rliE "habbicon|rewardtrack|RewardTrack" packages --include=*.ts --include=*.xml | grep -v node_modules
```
Expected : vide. 4 commandes vertes. Démarrer : messagerie, chat, catalogue, quêtes et Fishopedia s'ouvrent. Mettre à jour `IMPLEMENTATION_STATUS.md`.

- [ ] **Step 4 : commit**

```bash
git add -A -- packages docs
git commit -m "m0: retire Habbicons et Reward track ; la pêche garde sa barre de progression" -- packages docs
```

---

### Task 5 : Collectibles et NFT

**Files :**
- Supprimer : `catalog/collectibles/`, `inventory/collectibles/`, `avatar/nft/`, `avatar/wardrobe/NftOutfit.ts`, `room/object/logic/furniture/Furniture{NftCreditLogic,NftRewardBoxLogic}.ts`, msgs `collectibles/`, `nft/`, `nftwardrobe/`, `iid/IIDCollectiblesController.ts`
- **Garder** : `catalog/earnings/` et `iid/IIDVaultController.ts` (décision 2), et dans msgs `collectibles/` les messages de solde **Emerald** et **Silver** (monnaies que le serveur envoie toujours) : les déplacer dans msgs `wallet/` (ou le dossier des autres messages de monnaie) avant de supprimer le dossier
- Modifier : `HabboCatalog.ts` (attache de `IID_CollectiblesController`), `IHabboCatalog`, `PurchaseConfirmationDialog`, `HabboInventory`, `trading/TradingModel` (événements `TradeNft*` ; garder les monnaies si l'échange en gère), `HabboAvatarEditor`, `SessionDataManager`, `NotificationMessageHandler`, `HabboMessages.ts`

- [ ] **Step 1 : déplacer Emerald/Silver**, mettre à jour leurs imports et leur enregistrement. 4 commandes vertes.
- [ ] **Step 2 : supprimer et couper** le reste.
- [ ] **Step 3 : vérifier**

```bash
grep -rliE "nft|collectible" packages --include=*.ts | grep -v node_modules
```
Expected : vide. 4 commandes vertes. Démarrer : l'échange entre deux joueurs s'ouvre, la garde-robe s'ouvre, les soldes de monnaie s'affichent. `IMPLEMENTATION_STATUS.md`.

- [ ] **Step 4 : commit**

```bash
git add -A -- packages docs
git commit -m "m0: retire collectibles et NFT ; Emerald et Silver restent des monnaies" -- packages docs
```

---

### Task 6 : SnowWar / Game2 (décision 3)

**Files :**
- Supprimer : `game/`, msgs `game/`, `room/object/{logic,visualization}/game/` (Snowball, SnowSplash), `GameObjectVisualization.ts`, `GameClickTarget.ts`, `RoomObjectAvatarPlayingGameMessage.ts`, `catalog/viewer/GameTokensOffer.ts`, `friendbar/view/tabs/tokens/GameToken.ts`, `iid/IIDHabboGameManager.ts`
- Modifier : `VortexMain.ts` (construction de `HabboGameManager` ~l. 942), `freeflowchat/{HabboFreeFlowChat,IHabboFreeFlowChat,data/ChatEventHandler}`, `HabboLandingView` (clic `GAMES` ~l. 710), `HabboFriendBarView`, `tabs/Tab`, `tokens/Token`, `RoomEngine` (`'NAVIGATOR_GAMES'` ~l. 8601), `IRoomEngineServices`, `RoomUI`, `RoomDesktop`, `IRoomWidgetHandlerContainer`, `HabboHelp`, `core/utils/BitmapSlot.ts`, `toolbar/HabboToolbarIconEnum.ts` (`GAMES`), `BottomBarLeft.ts`, `HabboMessages.ts` (section `SNOW WAR` ~l. 2697 et ~l. 4039, `GamePlayerValue`/`YouArePlayingGame` ~l. 2088)
- **Garder** : les logiques de furni génériques des jeux de room (`FurniturePushableLogic`, `FurnitureScoreLogic`, `HockeyScore`, `CounterClock`, `HighScore`) : les arènes PvP s'en serviront

- [ ] **Step 1 : supprimer et couper.**
- [ ] **Step 2 : vérifier**

```bash
grep -rlE "HabboGameManager|IIDHabboGameManager|SnowWar|Snowball|Game2" packages --include=*.ts | grep -v node_modules
```
Expected : vide. 4 commandes vertes. Démarrer : la vue d'accueil (landing) et la barre d'amis s'affichent. `IMPLEMENTATION_STATUS.md`.

- [ ] **Step 3 : commit**

```bash
git add -A -- packages docs
git commit -m "m0: retire SnowWar et le gestionnaire de jeux Game2" -- packages docs
```

---

### Task 7 : Jukebox, mystery box, photos, notes de room

**7a — Jukebox / trax**
- Supprimer : `sound/trax/`, `sound/music/{Jukebox,SoundMachine}PlayListController.ts`, `TraxSampleManager.ts`, `sound/IPlayListController.ts`, `sound/events/{PlayListStatus,SongDiskInventoryReceived,TraxSongLoad}Event.ts`, `ui/widget/playlisteditor/`, `ui/handler/PlayListEditorWidgetHandler.ts`, les events et messages `RoomWidgetPlayList*`, `Furniture{Jukebox,SoundMachine,SongDisk}Logic.ts`, `InfoStand{Jukebox,SongDisk}View.ts`, `room/events/RoomEngineSoundMachineEvent.ts`, `catalog/viewer/widgets/{SongDiskProductView,TraxPreview}CatalogWidget.ts`.
- Modifier : `HabboSoundManagerFlash10.ts`, `HabboMusicController.ts` (le gestionnaire de son reste, seule la musique part), `HabboMessages.ts` (`SOUND (Trax)` ~l. 2013 et ~l. 3943, `SOUND` ~l. 3610 : ne retirer que les messages trax/jukebox).
- Contrôle : `grep -rlE "Jukebox|SoundMachine|Trax|PlayList|SongDisk" packages --include=*.ts | grep -v node_modules` → vide.

**7b — Mystery box**
- Supprimer : `ui/widget/furniture/mysterybox/`, `mysterytrophy/`, `FurnitureMysteryTrophyLogic.ts`, `session/events/MysteryBoxKeysUpdateEvent.ts`, msgs `mysterybox/`.
- Modifier : `SessionDataManager`, `FurnitureContextMenuWidgetHandler`, `FurnitureContextMenuWidget`, `HabboMessages.ts` (`MYSTERY BOX` ~l. 2046, ~l. 3367).
- Contrôle : `grep -rliE "mysterybox|mysterytrophy" packages --include=*.ts | grep -v node_modules` → vide.

**7c — Photos (caméra)**
- Supprimer : `ui/widget/camera/`, `ui/handler/{Camera,RoomThumbnailCamera}WidgetHandler.ts`, msgs `camera/`.
- Modifier : `RoomWidgetFactory` (`RWE_CAMERA`, `RWE_ROOM_THUMBNAIL_CAMERA`), `RoomDesktop` (liste des types ~l. 163, `createWidgetHandler` ~l. 1260), `BottomBarLeft` (~l. 473-483), `toolbar/HabboToolbarIconEnum.ts` (`CAMERA`), `PerkType.CAMERA`.
- **Garder** : `room/utils/RoomCamera.ts` (vue de room), `SetRoomCameraPreferences`, `CallForHelpFromPhoto` (le serveur les garde).
- Contrôle : `grep -rlE "RWE_CAMERA|RWE_ROOM_THUMBNAIL_CAMERA|widget/camera|messages/.*/camera/" packages --include=*.ts | grep -v node_modules` → vide.

**7d — Notes de room**
- Supprimer : `RoomRatingMessageEvent` + parser, `VoteForRoomMessageComposer`.
- Modifier : `navigator/{NavigatorData,HabboNavigator,IHabboNavigator,IncomingMessages,inroom/RoomInfoViewCtrl,transitional/LegacyNavigator}`, `RoomToolsWidget` et son handler, `quest/RoomCompetitionController.ts` (retirer seulement le vote, décision 4).
- Le serveur envoie encore `RoomRatingMessageComposer` à l'entrée en room (avec `CanRate = false`). **Garder donc l'event et son parser**, et ne retirer que l'interface de vote et `VoteForRoomMessageComposer`.
- Contrôle : `grep -rlE "VoteForRoom" packages --include=*.ts | grep -v node_modules` → vide.

- [ ] **Step 1 : 7a**, contrôle vide, 4 commandes vertes.
- [ ] **Step 2 : 7b**, idem.
- [ ] **Step 3 : 7c**, idem.
- [ ] **Step 4 : 7d**, idem.
- [ ] **Step 5 : démarrer** : entrer dans une room, ouvrir les infos de room, le menu contextuel d'un furni, la toolbar ; aucune erreur nouvelle. `IMPLEMENTATION_STATUS.md`.
- [ ] **Step 6 : commit**

```bash
git add -A -- packages docs
git commit -m "m0: retire jukebox, mystery box, photos et vote de room" -- packages docs
```

---

### Task 8 : Pets — élevage, plantes, besoins (décision 6)

Le soin des pets est mêlé au cœur (`PetInfo`, `UserData`, `RoomSession`, `OwnPetMenuView`, `PetMenuView`, `InfoStandPetView`, `PetSupplementTypeEnum`, `FurniturePetCustomizationLogic`) : chirurgie membre par membre, pas suppression de dossiers.

**Files :**
- Supprimer : dans avatarinfo `Breed*View`, `ConfirmPetBreedingView`, `NestBreedingSuccessView`, `PetBreedingPermissionEnum` ; `ui/widget/events/*PetBreeding*`, `BreedingRarityCategoryData` ; `session/events/RoomSession*Breeding*` ; contextmenu `MonsterPlantSeed*View` ; `FurnitureMonsterplantSeedLogic` ; les messages d'élevage, de plantes (compost, récolte, graine) et de supplément
- Modifier : `OwnPetMenuView`, `PetMenuView` (retirer nourrir, supplément, élevage, permission d'élevage, actions de plante), `InfoStandPetView` (retirer les infos de plante et d'élevage ; garder énergie/faim/soif en affichage), `PetInfo`, `UserData`, `RoomSession` (handlers d'élevage), `PetSupplementTypeEnum` (ne garder que ce qui sert à la selle s'il y en a), `HabboMessages.ts`
- **Garder** : `FurniturePetCustomizationLogic` (selle), monture, commandes, caresses

- [ ] **Step 1 : constater**

```bash
grep -rliE "breed|monsterplant|supplement|compost|harvest" packages/vortex-engine/src --include=*.ts
```

- [ ] **Step 2 : supprimer et couper.** Pour chaque vue modifiée, lire la vue entière avant de retirer un bouton : les boutons partagent souvent un même handler avec des commandes gardées.

- [ ] **Step 3 : vérifier**

Relancer le grep du Step 1 → Expected : seulement les champs de parser qui lisent `CanBreed`, `CanHarvest`, `HasBreedingPermission` dans les messages d'info et de statut de pet (le serveur les envoie toujours, à `false`). 4 commandes vertes. Démarrer : poser un pet, ouvrir son infostand et son menu, lui donner une commande, le caresser, appliquer une selle et le monter. `IMPLEMENTATION_STATUS.md`.

- [ ] **Step 4 : commit**

```bash
git add -A -- packages docs
git commit -m "m0: pets sans élevage, plantes ni nourriture ; la selle reste" -- packages docs
```

---

### Task 9 : LTD, vouchers, offres ciblées, sondages et word quiz

**9a — LTD / tirages** : supprimer `SoldLtdItemsCatalogWidget.ts` et les events `LtdRaffle*` (~l. 2870, 2873 de `HabboMessages.ts`). Modifier `CatalogPage`, `CatalogWidgetName`, `PurchaseConfirmationDialog`, `FurniGridFilters`, `FurniGridView`. Garder l'affichage des éditions limitées d'un furni possédé (numéro d'édition), c'est une donnée du furni.
Contrôle : `grep -rlE "LtdRaffle|SoldLtd" packages --include=*.ts | grep -v node_modules` → vide.

**9b — Vouchers** : supprimer `RedeemItemCodeCatalogWidget.ts`, `VoucherRedeemOk`/`VoucherRedeemError` (~l. 2921-2922), `RedeemVoucherMessageComposer`. Modifier `HabboCatalog`, `IHabboCatalog`.
Contrôle : `grep -rliE "voucher|RedeemItemCode" packages --include=*.ts | grep -v node_modules` → vide.

**9c — Offres ciblées** : supprimer `catalog/targetedoffers/` et les entrées de `HabboMessages.ts` (~l. 2907-2908, ~l. 3744-3747). Modifier `HabboCatalog.ts` (seul importeur).
Contrôle : `grep -rliE "targetedoffer" packages --include=*.ts | grep -v node_modules` → vide.

**9d — Sondages et word quiz** (décision 5) : supprimer `ui/widget/poll/`, `PollWidgetHandler`, `session/handler/PollHandler.ts`, `RoomSessionPollEvent`, `RoomWidgetPoll*`, `communication/enum/poll/`, `communication/enum/PollQuestionType.ts`, msgs `poll/`, `WordQuizHandler` et l'état word quiz de `RoomSession`.
**Attention** : `FriendRequestWidgetHandler` et `UiHelpBubbleWidgetHandler` renvoient `'RWE_ROOM_POLL'` comme type : c'est un copier-coller volontaire de l'AS3, **ne pas le modifier**.
Contrôle : `grep -rlE "PollHandler|RoomSessionPoll|RoomWidgetPoll|WordQuiz|PollQuestionType|widget/poll" packages --include=*.ts | grep -v node_modules` → vide.

- [ ] **Step 1 : 9a**, contrôle vide, 4 commandes vertes.
- [ ] **Step 2 : 9b**, idem.
- [ ] **Step 3 : 9c**, idem.
- [ ] **Step 4 : 9d**, idem.
- [ ] **Step 5 : démarrer** : catalogue (plusieurs pages), inventaire, room ; aucune erreur nouvelle. `IMPLEMENTATION_STATUS.md`.
- [ ] **Step 6 : commit**

```bash
git add -A -- packages docs
git commit -m "m0: retire LTD, vouchers, offres ciblées, sondages et word quiz" -- packages docs
```

---

### Task 10 : Layouts, images et textes des features retirées

**Files :**
- Modifier : `vortex-client-assets.zip` (par `node install.mjs --pack`), `packages/vortex-client/src/App.ts` (`LIBRARY_IMAGE_NAMES` ~l. 687-830, règle de préfixe d'images ~l. 475)

- [ ] **Step 1 : repérer les layouts orphelins**

Lister les layouts extraits par `install.mjs` (dossier indiqué dans sa sortie, sous `window-layouts/`) dont le nom contient : `wired`, `chest`, `snowwar`, `playlist`, `breed`, `plant`, `monster`, `poll`, `camera`, `mystery`, `targeted`, `builder`, `habbicon`, `rewardtrack`, `nft`, `collectible`, `voucher`, `ltd`, `wordquiz`. Pour chacun, chercher son nom dans le code :

```bash
grep -rl "<nom_du_layout>" packages --include=*.ts | grep -v node_modules
```
Un layout est supprimable seulement si **aucun** fichier ne le référence encore (Review Focus 4). Attention aux faux positifs du mot-clé (`plant` peut viser une déco, `chest` un furni gardé) : décider sur la référence dans le code, pas sur le nom.

- [ ] **Step 2 : retirer et réemballer**

Supprimer les layouts orphelins du dossier extrait, puis `node install.mjs --pack`. Retirer de `LIBRARY_IMAGE_NAMES` les images des features retirées (`breed_pets_preview_bg`, `camera_*`, `icon_nft`, `if_icon_ltd`, et toute image dont plus aucun code ne lit le nom ; vérifier chaque nom par grep). Garder la règle de préfixe `fish`/`derby` (décision 1).

- [ ] **Step 3 : vérifier**

`node install.mjs` (réextraction depuis le zip réemballé) → `Ready.`. 4 commandes vertes. Démarrer : ouvrir chaque fenêtre de la toolbar ; aucune fenêtre blanche ni erreur de layout manquant.

- [ ] **Step 4 : commit**

```bash
git add -A -- vortex-client-assets.zip packages/vortex-client/src/App.ts docs
git commit -m "m0: retire les layouts et images des features supprimées" -- vortex-client-assets.zip packages/vortex-client/src/App.ts docs
```

---

### Task 11 : Validation finale contre le serveur nettoyé

Prérequis : le plan serveur est terminé (Tâche 12 du plan serveur verte).

- [ ] **Step 1 : builds complets**

Les 4 commandes de vérification, plus `pnpm --filter vortex-glaze build` et `pnpm web:build` → Expected : verts.

- [ ] **Step 2 : parcours de fumée** (skill `run-vortex-client`, serveur `vortex-rpg-emulator` démarré sur la base neuve)

1. Connexion → l'hôtel s'affiche ; console sans erreur nouvelle par rapport à la Tâche 0 (Review Focus 1).
2. Ouvrir **chaque** icône de la toolbar et chaque fenêtre qu'elle ouvre (Review Focus 2 et 3).
3. Navigator : Mes rooms, Rooms des amis, Mes groupes ; créer une room ; y entrer.
4. Room : marcher, chatter, poser et ramasser un furni, ouvrir l'infostand d'un furni et d'un avatar.
5. Pet : poser, commande, caresse, selle, monture.
6. Échange de furni entre deux joueurs.
7. Pêche : ouvrir la Fishopedia et le HUD de pêche.
Tout échec : corriger dans la tâche concernée (nouveau commit), puis relancer les Steps 1 et 2.

- [ ] **Step 3 : bilan**

Dans `docs/IMPLEMENTATION_STATUS.md`, section « Retiré dans le fork RPG » complète. Noter le nombre de fichiers `.ts` avant et après :

```bash
git ls-files '*.ts' | wc -l
```

```bash
git add -A -- docs
git commit -m "m0: bilan du ménage client" -- docs
```
