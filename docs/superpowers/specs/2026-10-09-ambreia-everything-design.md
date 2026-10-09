# Tout en `.ambreia` — conception

**Date :** 2026-10-09. **Suite de :** `docs/superpowers/plans/2026-10-08-asset-packs.md` (et son bilan).

## Pourquoi

Le pack `ambreia/clothing/` a été construit depuis `Desktop/clothing` (5 531 pièces). Le client le
monte sur `gordon/vortex-assets-PRODUCTION-202601121522-867048149/`, mais **aucun** des 1 053
`.nitro` de gordon n'est dedans. Tout ce qui vient de gordon paie donc un 404 sur le pack, puis
retombe sur son `.nitro` :

- les 9 libs de base de la figuremap (`hh_human_body`, `face`, `hair`, `hats`, `item`, `leg`,
  `shirt`, `shoe`, `hh_people_pool`) ;
- les effets, 218 des 241 de `AmbreiaEffectMap.xml` ;
- le contenu de salle (`HabboRoomContent`, `TileCursor`, `SelectionArrow`, `PlaceHolderFurniture`,
  `PlaceHolderWallItem`, `PlaceHolderPet`) ;
- les 20 pets de `pet.configuration`.

L'imager et la sandbox iso lisent eux aussi des `.nitro` en HTTP. Le map editor affiche ses vignettes
depuis `dcr/hof_furni/icons/` : 78 267 PNG (323 Mo), qui doublonnent l'icône que chaque pièce de mobi
porte déjà (`<mobi>_icon_a`).

**But :** toutes les familles sont en `.ambreia`, reconstruites proprement par une seule commande, et
plus aucun `.nitro` n'est lu, ni par le client, ni par l'imager, ni par la sandbox.

## Décisions prises avec le propriétaire

| Sujet | Choix |
|---|---|
| Pièce absente | Plus aucun repli `.nitro` : la pièce ne s'affiche pas, `warn` une fois |
| Rangement | Un dossier par famille : `ambreia/{clothing,effects,room,pets,furniture}/` |
| Sources | Hors `www` : `C:/laragon/ambreia-sources/<famille>/` |
| Chargement | Chaque chargeur reçoit son `AmbreiaDirectory` ; fin du registre URL → pack |
| Icônes | `icons/` supprimé ; en jeu, rendu du mobi à la taille icône ; outils, via l'imager |

## 1. Sources et build

**Sources.** Elles sont copiées une fois dans `C:/laragon/ambreia-sources/`, qui n'est pas servi :

| Famille | Contenu |
|---|---|
| `clothing/` | `Desktop/clothing` (avec ses sous-dossiers) + les 9 libs de base de gordon |
| `effects/` | les bundles de gordon nommés par un `lib=` de `AmbreiaEffectMap.xml` |
| `room/` | les 6 bundles de salle cités plus haut |
| `pets/` | les bundles de gordon nommés dans `pet.configuration` |
| `furniture/` | les `.nitro` de `dcr/hof_furni/` (sans `icons/` ni `mp3/`) |

Les 1 044 vieux vêtements de gordon que la figuremap n'utilise pas ne sont pas copiés.

`packages/vortex-client/tools/gather-ambreia-sources.mjs` fait cette copie. Le script est relançable :
il ne copie que les fichiers absents ou différents, et ne supprime rien.

**Manifeste.** `packages/vortex-client/tools/ambreia-families.json` est versionné. Pour chaque famille,
il donne le dossier source et le dossier de sortie. Les racines (`C:/laragon/ambreia-sources`,
`C:/laragon/www/vortex-assets/ambreia`) et la clé (`C:/laragon/ambreia.key`) sont surchargeables en
ligne de commande.

**Commande.** `pnpm --filter vortex-client build:ambreia:all` :

1. lance `build-ambreia.ts` pour chaque famille, avec `--kind=<famille>` et `--key-file`. L'état
   (`.ambreia-build/<famille>.sources.json`) et le rapport sont propres à chaque famille ;
2. vérifie la couverture et l'écrit dans `.ambreia-build/coverage.json` :
   - libs de `AmbreiaFigureMap.xml` sans pièce dans clothing (498 aujourd'hui) ;
   - effets de `AmbreiaEffectMap.xml` sans pièce dans effects (23 aujourd'hui) ;
   - pets de `pet.configuration` sans pièce dans pets ;
   - les 6 noms de salle ;
3. sort en erreur si une lib de base `hh_*` de la figuremap ou un bundle de salle manque, parce que
   ces trous-là empêchent tout rendu. Les autres manques sont seulement listés.

**Sortie.** Elle va dans `C:/laragon/www/vortex-assets/ambreia/<famille>/`. Les cinq dossiers sont
construits vides, avec la même clé maître : `asset-packs.key` ne change pas. Les dossiers actuels
`ambreia/clothing` et `ambreia/furniture` sont déplacés de côté avant le build et ne sont supprimés
qu'avec l'accord du propriétaire (voir §4).

## 2. Le client ne lit plus que des `.ambreia`

**Configuration.** `config.json` → `asset-packs` = `{key, clothing, effects, room, pets, furniture}`,
une URL de dossier par famille, `${…}` accepté. Les cinq dossiers sont obligatoires : s'il en manque
un, `error` au boot, qui le nomme.

**Feature `asset-packs`.** Elle ouvre un `AmbreiaDirectory` par famille avec la clé et les expose sous
`host.made.assetDirectories`. Les features qui créent le moteur d'avatar et le moteur de salle les
lisent là.

**`@ambreia/common`.**
- `NitroBundleLoader` devient `AmbreiaPieceLoader`. Il garde le même résultat (`jsonData`, textures,
  spritesheet, `baseTexture`, `transferOwnership`), donc `NitroAsset` et ses utilisateurs ne bougent
  pas.
- Disparaissent : l'analyse du format `.nitro` (`extractFiles`), `validateNotHtmlResponse`, le repli
  (`fallBackToNitro`) et le registre global `AssetPacks`.
- `AssetLibrary.loadPiece(name, directory)` crée le chargeur avec son dossier et renvoie le même
  `AssetLoaderStruct` que `loadAssetFromFile`.

**Chargeurs.** Chacun reçoit son dossier à la place d'une URL et d'un template de nom :
- `AvatarAssetDownloadManager` / `AvatarAssetDownloadLibrary` : clothing ;
- `EffectAssetDownloadManager` / `EffectAssetDownloadLibrary` : effects ;
- `RoomContentLoader` : furniture, pets et room. `getObjectContentURLs()` devient une résolution
  « famille + nom de pièce ». La pièce d'un mobi porte le nom de son alias, comme le `.nitro` avant.

**Clés legacy retirées** (defaults, imager, sandbox) : `flash.dynamic.avatar.download.url`,
`flash.dynamic.avatar.download.name.template`, `flash.dynamic.download.url`,
`flash.dynamic.download.name.template`, `flash.dynamic.icon.download.name.template`,
`pet.dynamic.download.url`, `pet.dynamic.download.name.template`.

Avant de retirer chacune, je cherche tous ses lecteurs, par exemple
`FurniIconImageManager`, `DiskCache` de l'imager (qui lit `flash.client.url`, conservé) et la démo
de communication.

**Icônes en jeu.** `getFurnitureIcon`, `getWallItemIcon` et `loadThumbnailContent` ne téléchargent
plus de PNG. L'icône est le rendu du mobi à la taille icône (scale 1), comme Habbo le fait avec les
assets `_icon_` du bundle, couleur de variante comprise.

**Première étape du plan :** vérifier que la visualisation des mobis gère la taille 1. Si ce n'est pas
le cas, on s'arrête et on revoit ce point avec le propriétaire.

**Erreurs.**
- **Pièce absente (404)** : le chargeur émet `ioError` et le chemin d'échec existant s'applique.
  `warn` une fois par pièce, parce que l'objet ne s'affiche pas.
- **Dossier illisible** (descripteur absent, mauvaise clé, pas de WebCrypto hors https/localhost) :
  `error` une fois par famille, en disant pourquoi. Il n'y a plus de repli : un client de dev ouvert
  par une IP du réseau local en http n'affiche plus rien, et le message le dit.

## 3. Outils

- **Imager.** Il ouvre les cinq dossiers par HTTP (`httpBytes`, Node 22) avec la clé de la même
  section `asset-packs`, et charge par `loadPiece`. Nouvelle route `/furniture-icon?class=…` : le rendu
  du mobi à la taille icône, mis en cache disque comme les autres rendus.
- **Map editor.** `FurnitureSprites.thumbnail()` → `${IMAGING}/furniture-icon?class=…`. Un futur
  dashboard utilisera la même URL.
- **Sandbox iso.** `?pack=1` et le montage sur `/dcr/hof_furni/` disparaissent. Elle reçoit
  `ambreia/furniture` et `ambreia/room` comme le client.
- **Docs.**
  - `.claude/rules/assets.md` : familles, manifeste, `build:ambreia:all`, plus de `.nitro`.
  - Une note de renvoi dans le bilan du 2026-10-08.
  - `pnpm sync:agents`.

## 4. Vérification, puis retrait

« Done » veut dire vérifié :

1. `pnpm check` vert (dernières lignes montrées).
2. `build:ambreia:all` passe, et son rapport de couverture ne contient aucun manque bloquant.
3. Avec `run-vortex-client`, on charge :
   - une salle ;
   - un avatar habillé ;
   - un effet (danse) ;
   - un pet ;
   - un mobi posé, aperçu d'icône compris.

   Dans le réseau : **aucune requête `.nitro`**, aucun 404 sur `ambreia/*` hors manques connus du
   rapport. Captures avant/après comparées.
4. Le map editor affiche ses vignettes via l'imager.
5. Tests : `asset-pack.test.ts` sur `loadPiece` avec un faux `FetchBytes` (pièce présente, absente,
   mauvaise clé) ; le test de la feature vérifie les cinq dossiers exposés et l'erreur quand une
   entrée manque.

**Retrait, en dernier et seulement avec l'accord explicite du propriétaire sur la liste exacte :**
- `www/vortex-assets/gordon/vortex-assets-…/`. Les fichiers qui ne sont pas des `.nitro`
  (`effectmap.xml`, `HabboAvatarActions.xml`, `web.config`) ont des équivalents `Ambreia*` locaux ;
  vérifier qu'aucun lecteur n'en dépend avant de les proposer.
- `www/vortex-assets/dcr/hof_furni/` (`.nitro` + `icons/`). `mp3/` reste, il est hors périmètre.
- Les anciens dossiers `ambreia/clothing` et `ambreia/furniture` mis de côté.

Les sources restent dans `ambreia-sources/`.

## Révision (2026-10-09, pendant l'exécution) : les icônes de l'hôtel restent

La prémisse « `icons/` doublonne l'icône de chaque pièce » était fausse. Sur 300 mobis tirés dans le
catalogue, 218 sont dans le furnidata. Parmi eux, environ 60 % ont un rendu à la taille 1 identique
(ou à 1-2 pixels près), et environ 40 % ont une autre image : des mobis custom dont l'icône a été
dessinée à part, ou des calques colorés que le rendu ne reproduit pas.

Décision du propriétaire : une sixième famille, `icons`, facultative.
- Chaque PNG est emballé en bundle par `gather-ambreia-sources.mjs` (`iconBundle`), puis construit
  comme les autres familles.
- L'imager sert l'icône d'origine sur `size=icon` (`FurnitureIcon.ts`) et ne fait le rendu à la
  taille 1 que si elle manque.
- Le client n'en a pas besoin : en jeu, l'icône reste le rendu à la taille 1.

## Hors périmètre

- La clé envoyée par le serveur après connexion : toujours due.
- Les 498 libs et 23 effets introuvables : ils sont signalés, pas résolus.
- `mp3/`, les XML/JSON de `gamedata`.
