# Bilan — J6 : `@ambreia/protocol` + `@ambreia/game` (2026-10-08)

Plan : `2026-10-07-j6-protocol-game.md`. Branche `j6-protocol-game`, partie de `master` 264e2c67 (J5 fusionné).

## Ce qui a bougé

| Quoi | Où | Comment |
|---|---|---|
| Messages, parsers, composers, `Headers.generated.ts`, `HabboMessages.ts` | `habbo/communication/messages` → `packages/ambreia-protocol/src/` (`incoming/`, `outgoing/`, `parser/`) | `move-modules`, 464 fichiers |
| `habbo/*`, `iid/`, `core/` (enveloppes et barrels), `features/`, `hurlant/` | → `packages/ambreia-game/src/` | `move-modules`, 373 fichiers |
| `vortex-engine` | ne garde que `Vortex`, `VortexMain`, leurs interfaces et son index | coquille d'hôte jusqu'au renommage |
| Alias `@core`, `@habbo`, `@iid` | supprimés (tsconfig, vite, plugin de bundle, codemod) | on importe `@ambreia/game/…` |
| `pnpm gen:headers` | écrit `packages/ambreia-protocol/src/Headers.generated.ts` | le hook de pré-commit suit |

## Nouveau style réseau (spec §6)

`@ambreia/net/style/MessageMap` :

- **La table d'un domaine.** Elle lie un en-tête à un `IIncomingParser` et un `IMessageHandler`, et la classe d'un message pur à un `IOutgoingSerializer`.
- **`map.install(connection)`** abonne tout ou rien et rend la désinscription. L'installation refuse, en le nommant, un en-tête déjà servi par un événement hérité ou par une autre table : un message n'a jamais deux lecteurs.
- **`map.send(connection, message)`** retrouve le serializer par la classe du message.
- **La connexion** gagne `handleIncoming` et `sendValues`. Sa file d'avant configuration garde l'ordre des deux styles : elle contient maintenant des envois différés.
- **Ce que le style ne fait pas encore.** Aucun message existant n'y est passé : ils restent dans `protocol`, dans l'ancien style. Un message nouveau prend le nouveau (règle `communication`, point 6).

## Points d'extension des features (spec §4)

- **`IGameFeature`** (`game/src/features/GameFeature.ts`) ajoute deux champs :
  - `images` : les images de la bibliothèque lues par nom, décodées au chargement (`featureImages`) ;
  - `roomWidgets` : les types `RWE_…`, chacun avec son handler et son widget éventuel.
- **`RoomWidgetRegistry` remplace les deux `switch`** d'AS3, celui de `RoomDesktop` pour le handler et celui de `RoomWidgetFactory` pour le widget. Le registre est construit avant le démarrage, à partir des features actives seulement. Une feature coupée n'apporte rien, et un type déclaré par deux features est une erreur qui les nomme.
- **Trois features déclarent des widgets :**
  - `avatar-info` (la bulle de nom) ;
  - `loading-bar`, la feature de démonstration, dont le widget et le handler sont dans son dossier ;
  - `room-ui`, qui déclare `RWE_LOCATION_WIDGET`.
- **`LIBRARY_IMAGE_NAMES` est supprimé.** Ses 85 noms ont été relevés deux fois, en mots entiers puis en racines construites. On ne les trouve que dans d'anciennes mises en page Habbo, que la règle `layoutNames` couvre déjà, ou comme mots sans rapport. Aucun n'était lu depuis la coupe.
- **`ENGINE_FEATURES` devient `GAME_FEATURES`.**
- **`RoomEngine` ne lit plus `Vortex.instance`.** Le renderer vient de l'hôte (`IEngineHost.renderer`), et la conversion de texture passe par `extractCanvas` d'iso.

## Murs (spec §3)

- **`protocol`** n'admet que `common`, `net` et `iso`.
- **`game`** admet tout `@ambreia/*`, et aucun paquet `vortex-*`.
- **Le `core/` du jeu** ne sort jamais de `core/`. La règle compte la remontée selon la profondeur, parce que ses dossiers portent les mêmes noms que ceux du jeu.
- **Les moteurs et le kernel** refusent `protocol` et `game`.
- Les tests de frontières passent de 19 à 23.

## Preuve (§9, §11)

- **Retrait de la feature de démonstration**, scripté (`j6-removal-proof.py`) :
  1. `features/loading-bar/` sort de l'arbre, avec sa ligne d'import et son entrée dans `GAME_FEATURES` ;
  2. `pnpm typecheck` et `pnpm build` restent verts ;
  3. le client démarre avec 13 features ;
  4. tout est remis et `git status` est propre.

  Seul le test `feature-extensions`, qui la nomme, échouerait sans elle.
- **Démarrage identique** à J5 après chaque tâche :
  - même ordre d'attache ;
  - aucun composant verrouillé ;
  - les 766 propriétés ;
  - les mêmes étapes de chargement ;
  - 14 features `ready`.

  La capture est la même qu'en J5.
- **Tests :**
  - `pnpm check` : 83 pass, 4 skipped (contre 75 en J5) ;
  - `incoming-registered` : chaque en-tête entrant a son événement ; on l'a vu échouer en retirant `PingMessageEvent` ;
  - `message-map` 7/7 ;
  - `feature-extensions` 4/4 ;
  - frontières 23/23.
- **Builds** du client, de l'imager et de Glaze verts.

## Non vérifié

- **Entrée en room**, donc la bulle de nom et la barre de chargement à l'écran. Aucun émulateur n'écoutait sur 40001, et le ticket dans `ambreia-database` n'a toujours pas d'accord.
- **Captures d'écran de la room** : non vérifiées. `RoomEngine` prend le renderer de l'hôte, et ce chemin n'a pas été exercé.
- **`external_variables` reste la source de `legacy`.** La spec de J5 l'attendait « en attendant J6 », mais aucune feature n'a encore migré ses clés.

## Écarts au plan

- **Noms du nouveau style.** On a `IIncomingParser` et `IOutgoingSerializer` : `net` exporte déjà l'`IMessageParser` hérité. `install` et `send` sont des méthodes de `MessageMap`.
- **Une entrée de widget** est `{handler, widget?}`. `RWE_LOCATION_WIDGET` n'a pas de widget, et la fabrique gagne `createHandler`.
- **Le widget d'`avatar-info` reste sous `ui/`.** `RoomDesktop.showGamePlayerName` le type.
- **Les tests du moteur restent dans `packages/vortex-engine/test`**, réécrits vers `@ambreia/game`.
- **Le préfixe des modules retirés reste** dans la règle des images (`ctlg_`, `fish`, `derby`, `badge_part_`, `color_chooser_`, `position_`).
- **Un type de widget inconnu** est désormais un avertissement unique, au lieu d'un `debug`.
- **Incident.** Un `git stash` lancé par erreur a mis de côté le déplacement non commité de la tâche 3. Il a été restauré tout de suite par `git stash pop --index`, et les 410 chemins ont été vérifiés.
