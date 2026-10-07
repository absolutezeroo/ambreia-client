# Bilan — coupe au noyau du client (2026-10-07)

Plan : `2026-10-07-coupe-noyau-client.md`. Branche `coupe-noyau`, partie de `master` 802b9650 ; l'état
d'avant est sous le tag `pre-noyau-client`.

## Avant / après

| | Avant (tag `pre-noyau-client`) | Après |
|---|---|---|
| Fichiers `.ts` du moteur | 4 086 | 1 743 |
| Lignes du moteur | 538 753 | 233 953 |
| Modules `habbo/` | 33 | 10 : `avatar`, `communication`, `configuration`, `localization`, `perf`, `room`, `session`, `ui`, `utils`, `window` |
| Messages enregistrés | 436 events + 434 composers | 46 events + 14 composers, 1:1 avec le serveur coupé |
| Orphelins (fichiers que rien n'atteint) | 294 | 212, tous génériques ou antérieurs à la coupe |

Partis : catalogue, inventaire, navigateur (ancien et nouveau), messagerie, amis (liste et barre),
groupes, aide, modération, classification, téléphone, Discord, quêtes, NUX, campagnes, publicité,
tracking, son, notifications, freeflowchat, pêche et éditeur de meubles (`habbo/vortex`), barre
d'outils, onboarding HC (client), et tous les widgets de room sauf `avatarinfo` et `loadingbar`.

Gardés par décision : l'éditeur d'avatar ; au clic sur un avatar, la seule bulle de nom
(`UserNameView`) ; les layouts du dump.

## Décisions de la Task 6 (un écouteur par événement gardé)

| Événement | Décision |
|---|---|
| `RoomForward` | **Branché** dans `RoomSessionHandler` → `gotoRoom`. Le serveur l'envoie juste après le SSO et ne fait jamais entrer le joueur lui-même ; sans le navigateur, plus rien n'entrait en room. |
| `CantConnect` | `RoomSessionHandler` envoie `Quit` et abandonne la session en attente ; `RoomUI` affiche la raison (textes du navigateur AS3). |
| `NotificationDialog` | `RoomUI` affiche une alerte de son paramètre `message` (DEVIATION : pas de choix bulle/fenêtre par type). |
| `RoomRating`, `RoomEntryInfo` | **Ignorés volontairement** : seuls le navigateur, l'inventaire, les groupes, l'aide, la modération, les quêtes et le tracking les lisaient. |

## Validation réelle (Task 8)

Faite le 2026-10-07 contre l'émulateur local (`Vortex.Main`, base `vortex_m0bis_check`), le serveur
d'assets et `pnpm dev`, avec le driver `run-vortex-client` :

- handshake, SSO, `AuthenticationOK`, `UserObject` : OK ;
- `RoomForward` → entrée dans la room de départ, sol, murs et avatar rendus ;
- clic sur une case : l'avatar marche ;
- clic sur l'avatar : la bulle de nom s'affiche, rien d'autre ;
- `Vortex.instance.openAvatarEditor()` : l'éditeur s'ouvre sur la figure du joueur (corrigé pendant la
  validation : il s'ouvrait sur la figure par défaut, faute d'appeler `loadOwnAvatarInEditor`) ;
- `errors` vide, aucune requête en échec ; `__packets.unhandled()` = `RoomEntryInfo`, `RoomRating`,
  exactement les deux ignorés.

Pour y arriver, l'environnement a dû être contourné, **sans rien committer** de ces contournements :

1. **Clé RSA.** Le client porte le module de l'hôtel distant (commit 43955f63), l'émulateur local
   une autre clé (`appsettings.Development.json`, non suivi). Validation faite avec une paire jetable
   passée à l'émulateur par variables d'environnement et le module remplacé temporairement dans
   `RSA.ts`, puis restauré.
2. **Hôte.** `index.html` envoie `localhost` vers l'hôtel distant (commit 5a8b0d5e, voulu) : la
   connexion a été surchargée par `window.VortexConfig` dans une copie jetable du driver.
3. **Plugin WebApi.** `DevPluginPaths` pointe vers `Vortex.Dashboard.API`, qui n'existe plus : la
   WebApi a été publiée dans `%TEMP%\vortex-run\webapi` et passée par variable d'environnement.
4. **Base.** `vortex_m0bis_check` est en retard sur le modèle : `players.profile_visible` existe sans
   défaut (l'API ne peut plus créer d'avatar), pas de joueur `__world__`, pas de zone de départ. Le
   ticket SSO, une room et `world.start_room_id` ont été insérés pour le test, puis supprimés.

## Ce qui reste dû

- **Sauvegarde de l'éditeur** : « Save changes » envoie `UpdateFigureData`, que le serveur coupé
  n'accepte pas (absent des 14 composers du contrat). À ajouter côté serveur, puis régénérer les
  en-têtes.
- **Environnement de dev** (propriétaire) : aligner la clé RSA client/émulateur pour le dev local,
  corriger `DevPluginPaths`, recréer ou migrer la base de dev puis appliquer `dev_zone.sql`.
- **Code mort connu** (relevé par la revue finale) : environ 95 abonnements du code gardé visent des
  événements hors contrat (`SessionDataManager`, les handlers de session, `AvatarEditorMessageHandler`,
  `BlockedUsersManager`/`IgnoredUsersManager`, `demo/IncomingMessages`, `BadgeImageWidget`, `RoomDesktop`
  à chaque entrée en room), et environ 93 composers hors contrat restent envoyés (clic sur avatar ou
  meuble, listes de blocage et d'ignorés au démarrage, double-clic sur meuble, éditeur). Chaque classe
  ne prévient plus qu'une fois (`log.once`) ; le nettoyage se fait feature par feature. 211 orphelins
  génériques, à trier pendant J1.
- **Meubles** : le Ctrl+clic (ramassage) ne retire plus le meuble localement quand la demande ne part
  pas. Le déplacement par Alt+glisser, réservé à qui a des droits sur la room, laisse encore le meuble à
  sa nouvelle place côté client alors que `MoveObject` est hors contrat.
- **Affichages perdus, assumés** : panneaux publicitaires vides, animation de ramassage vers
  l'inventaire retirée, vêtements à vendre masqués dans l'éditeur (pas d'inventaire). Après un
  `CantConnect`, l'alerte s'affiche mais il n'y a plus de vue de l'hôtel où revenir : écran vide jusqu'au
  rechargement. Le compte à rebours de maintenance a disparu avec les notifications.
