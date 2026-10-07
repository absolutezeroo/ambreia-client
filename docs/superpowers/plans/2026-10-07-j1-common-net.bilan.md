# Bilan — J1 : `@ambreia/common` + `@ambreia/net` (2026-10-07)

Plan : `2026-10-07-j1-common-net.md`. Branche `j1-common-net`, partie de `master` 08988380.

## Nom

Le propriétaire a nommé le projet **Ambreia** (le MMORPG) pendant J1. Les deux nouveaux paquets ont
donc pris la portée `@ambreia/` (dossiers `packages/ambreia-common`, `packages/ambreia-net`) au lieu
du `@vortex/` de la spec. Les paquets existants (`vortex-engine`, `vortex-client`, `vortex-glaze`,
`vortex-imager`), la classe `Vortex`, les dépôts et l'émulateur gardent leur nom : leur renommage est
une passe à part.

## Ce qui a bougé

| Paquet | Vient de | Fichiers | Imports réécrits |
|---|---|---|---|
| `@ambreia/common` | `core/utils`, `core/reactive`, `core/assets` (sauf 2 classes), `core/runtime/IDisposable.ts` | 39 | 290 (dans 189 fichiers) |
| `@ambreia/net` | `core/communication` (sauf le gestionnaire DI) | 30 | 770 (dans 447 fichiers) |

Les déplacements et les réécritures sont faits par `packages/vortex-engine/tools/move-modules.mjs`
(testé, 8 cas), réutilisable pour J2–J6. Les paquets sont consommés par leurs sources via `exports`
(`"./*": "./src/*.ts"`), en chemins profonds, sans baril racine.

**Restent dans le moteur, parce qu'ils sont des composants DI** (règle §3 : pas de DI dans un
moteur) : `AssetLibrary`, `AssetLibraryCollection` (`core/assets/`) et `CoreCommunicationManager` +
`ICoreCommunicationManager` (`core/communication/`). Leurs barils restent et réexportent le reste
depuis les paquets, donc `@core/assets` et `@core/communication` marchent toujours. Les rendre
autonomes demande un fournisseur d'assets injecté (J2) et le kernel (J5).

## Point d'écoute de `net` (spec §8)

`IConnection.setPacketTap(tap)` : `tap.outgoing(id, values)` voit, modifie ou bloque chaque message
avant encodage ; `tap.incoming(wrapper)` chaque message reçu après déchiffrement.
`IConnection.injectIncoming(id, values)` remet un message aux handlers comme si le serveur l'avait
envoyé, sans toucher au chiffrement (le flux RC4 n'avance pas). Rien ne l'installe en production ;
l'inspecteur de paquets le fera, en dev.

## Preuves

- `pnpm check` : 45 tests outils + 8 tests TypeScript (dont l'aller-retour du format filaire du §11
  et les 4 du point d'écoute) ; `tsc` autonome de chaque paquet à 0 erreur (aucun n'atteint le moteur) ;
  murs ESLint testés (`common` n'importe rien d'Ambreia, `net` seulement `common`).
- `pnpm build`, build de Glaze, build de l'imager : verts.
- Dev : un seul esbuild pour le moteur et les paquets (décision ouverte n° 2 tranchée) ; aucun module
  source des paquets servi à côté du bundle, donc une seule instance de `Logger`.
- **Rechargement de dev** (`domContentLoadedEventEnd`, page sans ticket) : avant 272–612 ms, médiane
  ~316 ms ; après 198–350 ms, médiane 311 ms. Pas plus lent.
- **Règle du jalon**, contre l'émulateur local : entrée en room par `RoomForward`, marche, bulle de
  nom, éditeur d'avatar sur la figure du joueur ; aucune erreur ; non traités = `RoomEntryInfo`,
  `RoomRating`, comme décidé à la coupe. Avec les mêmes contournements d'environnement qu'à la coupe
  (paire RSA jetable, hôte surchargé dans une copie du driver, WebApi publiée dans `%TEMP%`, salle et
  ticket insérés puis supprimés de `vortex_m0bis_check`), rien de commité.

## Corrections trouvées en route

- Le codemod sautait tout dossier nommé `assets` (exclusion héritée de `find-orphans`, pensée pour
  les assets du client) : il ne voyait pas `core/assets`. Corrigé et testé.
- Deux déplacements d'un même lancement se liaient par le nom du paquet (`@ambreia/common/…` depuis
  `@ambreia/common`), ce que `tsc` refuse sans `rootDir` (TS2209). Ils se lient maintenant en relatif ;
  testé.
- Sans ticket SSO, `App.ts` redirige vers `/` que Vite renvoie vers `/client/` : la page boucle. C'est
  antérieur à J1 ; les vérifications de démarrage passent un ticket factice.

## Ce qui reste dû

- Renommer le reste du projet en Ambreia (paquets, classes `Vortex*`, dépôts, émulateur).
- L'environnement de dev local ne marche toujours pas sans contournements (clé RSA, hôte, chemin du
  plugin WebApi, base en retard) : voir le bilan de la coupe.
