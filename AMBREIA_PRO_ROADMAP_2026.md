# AMBREIA — Roadmap produit & technique professionnelle

**Version :** 1.1  
**Date :** 2026-10-11, état legacy mesuré le 2026-10-13  
**Statut :** baseline de planification / source de vérité roadmap  
**Produit :** Ambreia — MMORPG isométrique pixel-art  
**Portée :** client + contrats protocole + runtime + tooling + purge du legacy Habbo

---

# 0. Pourquoi cette roadmap existe

Ambreia n'est plus un « client Habbo auquel on ajoute du RPG ». La cible produit est désormais un **MMORPG isométrique complet**, avec :

- combat à compétences ;
- classes, spécialisations et progression ;
- monde en zones et instances ;
- quêtes, PNJ, réputation et découverte ;
- groupes, guildes, amis, whispers et inspection joueur ;
- donjons, arènes, world bosses et événements ;
- économie, banque, marché, commerce et courrier ;
- métiers, récolte et crafting ;
- montures et compagnons ;
- succès, badges, titres et collections ;
- housing, salles de guilde et décoration ;
- UX MMORPG complète : paramètres, accessibilité, reconnexion, notifications, codex, modération.

La base technique reste issue d'un client Habbo historique. La roadmap doit donc piloter **deux transformations en parallèle** :

1. construire les boucles MMORPG natives d'Ambreia ;
2. réduire puis supprimer les domaines Habbo devenus inutiles sans casser les briques moteur encore utiles.

---

# 1. Méthode de roadmap retenue

Cette roadmap suit une approche **outcome-based** et non une simple liste de features.

## 1.1 Horizons

Les initiatives sont classées en :

- **NOW** — nécessaire pour obtenir une verticale RPG saine et supprimer les premiers gros blocs legacy ;
- **NEXT** — complète les boucles MMORPG principales ;
- **LATER** — différenciation, live-ops et profondeur long terme.

Les dates calendaires précises ne sont pas figées tant qu'une vélocité réelle n'a pas été mesurée sur 2 à 3 milestones. Les engagements sont faits par **gates de sortie** et dépendances, puis les dates pourront être ajoutées sans fausse précision.

## 1.2 Chaque initiative possède

- **Outcome** : résultat attendu pour le joueur / produit ;
- **Scope** : fonctionnalités incluses ;
- **Dépendances** ;
- **Legacy déplacé/supprimé** ;
- **Exit criteria** : critères objectifs pour considérer le milestone terminé ;
- **Risque** : niveau de risque technique / produit.

## 1.3 Quatre workstreams parallèles

| Track | Rôle |
|---|---|
| **P — Product / Gameplay** | Boucles MMORPG visibles par le joueur |
| **E — Engine / Runtime** | performance, rendu, scène, input, navigation, transitions |
| **X — Experience / Platform** | UX globale, social, settings, accessibilité, reconnexion, notifications |
| **L — Legacy Displacement** | remplacement puis suppression du vieux comportement Habbo |

Le legacy n'est donc pas un « grand ménage final » : il est retiré **au moment où son remplacement RPG est prêt**.

---

# 2. North Star produit

> **Ambreia doit offrir l'expérience d'un vrai MMORPG isométrique tactique et social, avec une forte identité pixel-art et un système de housing/décoration qui conserve le meilleur ADN créatif de Habbo sans conserver ses contraintes métier historiques.**

## Piliers produit

### P1 — Combat lisible et tactique
Le joueur doit immédiatement comprendre : cible, menace, buffs/debuffs, casts, cooldowns, dégâts, soins, danger et résultat de ses actions.

### P2 — Monde et progression cohérents
Explorer une zone, parler à un PNJ, prendre une quête, voyager, combattre, obtenir du loot et progresser doit former une boucle fluide.

### P3 — MMO social réel
Amis, whispers, groupe, guilde, inspection, commerce, matchmaking, événements publics et interactions joueur doivent être des systèmes centraux.

### P4 — Économie et professions
Objets, craft, récolte, banque, marketplace, trade et monnaies doivent former une économie cohérente et extensible.

### P5 — Identité et collection
Personnage, équipement, titres, succès, réputation, montures, compagnons et apparences donnent une identité longue durée.

### P6 — Housing comme différenciateur
Le placement de mobilier, les espaces privés et salles de guilde deviennent une feature RPG native — pas un retour au Navigator Habbo.

### P7 — Client robuste et industrialisable
Reconnexion, loading, accessibilité, performance, architecture modulaire, tests, outillage et règles de dépendances sont non négociables.

---

# 3. État de référence au début de cette roadmap

## Architecture

- nettoyage dependency-cruiser effectué ;
- cycles source supprimés dans la passe d'architecture ;
- gros monolithes legacy identifiés ;
- système features/contracts déjà présent ;
- Engine 2 spécifié mais encore à exécuter progressivement ;
- `RoomEngine` doit rester une façade/orchestrateur pendant l'extraction, pas être réécrit d'un bloc ;
- M0 est largement exécuté sur `engine-v2-baseline` (commits `11b6d7c3`, `a821b931`, `88e2ac8e`, puis la passe du 2026-10-13) : voir le registre du §11 ;
- le fence existe déjà : `wall()` dans `eslint.config.mjs` (couches) et les tests `incoming-registered` / `outgoing-registered` (messages enregistrés) ; le contrat réseau est figé à 60 messages dans `HabboMessages.ts`, alignés sur l'émulateur ;
- référence architecture : `docs/superpowers/specs/2026-10-07-client-architecture-design.md` et les plans J1–J6 dans `docs/superpowers/plans/`.

## Mockups RPG déjà disponibles

La direction visuelle/fonctionnelle couvre déjà notamment :

- personnage ;
- compétences actives/passives/spécialisations/raccourcis ;
- inventaire ;
- HUD et combat ;
- succès/titres/réputation ;
- quêtes ;
- donjons ;
- arène ;
- bestiaire ;
- groupe ;
- amis ;
- guilde ;
- crafting/métiers ;
- banque ;
- marketplace ;
- boutique ;
- trade ;
- inbox ;
- montures ;
- compagnons ;
- paramètres/keybinds/accessibilité ;
- aide/codex/report/reconnect/AFK/notifications ;
- calendrier/events/world boss/wallet ;
- buffs/debuffs/target/cast/combat log ;
- profil/inspection/menu contextuel/whispers ;
- dialogues PNJ/services ;
- housing/décoration ;
- world map/voyage/découverte ;
- dungeon matchmaking/ready check/results/boss journal ;
- mort/résurrection/level-up/reward choice/wipe.

---

# 4. Règle de Definition of Done d'une feature Ambreia

Une feature n'est **pas terminée** parce qu'une fenêtre existe.

Elle est considérée DONE lorsque les points pertinents sont couverts :

1. contrat serveur/protocole défini ;
2. état client autoritaire clairement défini ;
3. feature/domain isolé ;
4. UI normale + hover + disabled + loading + empty + error ;
5. clavier / souris / raccourcis cohérents ;
6. reconnexion / resync évalués ;
7. permissions / conditions / validation serveur ;
8. accessibilité minimale ;
9. tests métier et/ou protocole ;
10. instrumentation debug/telemetry utile ;
11. docs techniques mises à jour ;
12. si la feature remplace du legacy : **ancien chemin désactivé et supprimé** ;
13. `pnpm check` et architecture checks verts.

---

# 5. ROADMAP — NOW

# M0 — Product Lock & Legacy Fence

**Outcome :** empêcher Ambreia de recréer de la dette Habbo pendant le développement RPG.

**Effort :** S  
**Risque :** faible  
**Type :** gouvernance + architecture

## Scope

- adopter ce document comme roadmap maître ;
- maintenir un catalogue feature RPG unique ;
- créer un registre Legacy officiel ;
- marquer les packages/dossiers legacy `DEPRECATED` ;
- règle : aucune nouvelle feature RPG ne doit importer un domaine legacy interdit ;
- ajouter progressivement des règles dependency-cruiser/ESLint pour empêcher les nouveaux couplages ;
- inventorier les messages protocole legacy enregistrés au runtime.

## Legacy supprimable immédiatement après vérification de callers

Fait au 2026-10-13 (§11) : HotLooks, Respect, HabboClub / HC, perks, et les messages `users` /
`friendlist` / `moderation` / `preferences` / `tracking` que `HabboMessages.ts` n'enregistrait plus.
Reste à faire dans M0 : rien ; les domaines restants ont chacun leur milestone.

## Exit criteria

- registre Legacy présent et versionné ;
- chaque domaine legacy a un owner/action : DELETE / REPLACE / KEEP TECH / REINTERPRET ;
- aucune nouvelle PR ne peut introduire un nouvel import vers les domaines `DELETE` ;
- checks existants verts.

---

# M1 — Combat Vertical Slice 2.0

**Outcome :** obtenir une rencontre RPG complète, lisible et jouable de bout en bout.

**Effort :** XL  
**Risque :** élevé  
**Tracks :** P + E + X + L

## Scope gameplay

- système de cible complet ;
- cible de la cible ;
- elite/boss states ;
- distance et portée ;
- buffs/debuffs/status effects ;
- durée/stacks/tooltips ;
- casts et channeling ;
- interruptions ;
- GCD / cooldown states ;
- erreurs : hors portée, manque de mana, cooldown ;
- floating combat text ;
- combat log ;
- menace/aggro MVP ;
- death / KO ;
- résurrection joueur ;
- respawn/checkpoint ;
- level-up ;
- notification de progression ;
- quest reward choice avec comparaison équipement.

## Legacy déplacé

### REPLACE
- anciens `AvatarEffect*` → `StatusEffects + Combat VFX + Cosmetics` ;
- ancien avatar effects editor/runtime métier → nouveau domain combat/status ;
- ancien texte/bulle de feedback Habbo → toasts/combat feedback RPG.

### DELETE après cutover
- protocol events/composers `AvatarEffectAdded/Activated/Expired/Selected` non utilisés par la nouvelle architecture ;
- vieux models/views d'effets avatar Habbo sans usage cosmétique valide.

## Exit criteria

Scénario golden path automatisable/manuellement reproductible :

> zone → ciblage ennemi → cast → buff/debuff → interruption → dégâts/soins → mort → résurrection → victoire → XP → level-up → choix de récompense.

En plus :
- aucun code combat RPG ne dépend des anciens AvatarEffects ;
- combat log et status state se reconstruisent proprement après resync ;
- tests protocol/state verts.

---

# M2 — World Interaction Loop

**Outcome :** le joueur peut réellement vivre dans le monde Ambreia et progresser sans Navigator Habbo.

**Effort :** XL  
**Risque :** élevé

## Scope

### Dialogue PNJ complet
- texte et réponses multiples ;
- conditions ;
- états de quête ;
- réputation requise ;
- dialogue scénarisé ;
- menu de services PNJ : parler, quête, boutique, téléportation, réparation, craft/métier.

### Monde
- hiérarchie Monde → Région → Zone ;
- carte monde/régionale/locale ;
- points d'intérêt ;
- fast travel ;
- coût / conditions / canalisation ;
- marqueurs de quêtes ;
- marqueurs personnalisés ;
- découverte de zone ;
- niveau recommandé ;
- XP de découverte ;
- Safe/PvP/Dungeon rules ;
- loading transition ;
- reprise après perte réseau.

## Legacy déplacé

### DELETE
- Navigator Habbo public/guest-room discovery ;
- favourites/categories/official-room browsing historiques ;
- room ratings/events propres au modèle hôtel si non réutilisés.

### KEEP TECH
- `roomId` comme unité technique ;
- chargement d'une room/map ;
- transitions ;
- collision/rendu/objets.

### REINTERPRET
- navigation d'espaces privés sera reconstruite plus tard pour Housing, séparée de la navigation World.

## Exit criteria

Golden path :

> ville → PNJ → accepte quête → ouvre carte → voyage → découvre zone → suit objectif → revient au PNJ → reçoit récompense.

Et :
- aucune UI de progression world n'appelle l'ancien Navigator ;
- les transitions sont pilotées par World/Zone services ;
- reconnexion dans une zone testée.

---

# M3 — Social MMO Foundation

**Outcome :** les joueurs peuvent se trouver, communiquer et former des groupes avec des primitives sociales cohérentes.

**Effort :** L  
**Risque :** moyen

## Scope

- menu clic droit joueur universel ;
- profile joueur ;
- inspection équipement ;
- whisper / PM ;
- recherche joueur globale ;
- friend requests / block ;
- invitations party ;
- rôles Tank/Heal/DPS ;
- party leader ;
- ready check générique ;
- loot rules ;
- duel sauvage ;
- report joueur ;
- présence : online/offline/AFK/group/dungeon.

## Legacy déplacé

### REPLACE
- Habbo Messenger / friendlist → Social/Friends/Whispers ;
- anciens Habbo Group infos → Party + Guild séparés ;
- anciennes interactions profil Habbo → PlayerContextAction registry.

### DELETE après migration
- events/composers friendship/group uniquement Habbo ;
- context menus historiques redondants ;
- vieux chat bubbles si le nouveau chat n'en utilise plus.

## Exit criteria

- rechercher un joueur → voir profil → ajouter ami → whisper → inviter groupe → trade/duel/report depuis la même action registry ;
- aucun nouveau module RPG ne dépend d'un manager Habbo social spécifique.

---

# 6. ROADMAP — NEXT

# M4 — Dungeon & Instance Lifecycle

**Outcome :** offrir une vraie boucle PvE de groupe réutilisable pour les futurs contenus.

**Effort :** XL  
**Risque :** élevé

## Scope

- browser/listing de donjons ;
- difficultés Normal/Heroic/Mythic ;
- prérequis ;
- récompenses preview ;
- matchmaking ;
- groupe trouvé ;
- accept/refuse timer ;
- ready check ;
- transfert vers instance ;
- boss state ;
- wipe ;
- checkpoint ;
- sortie/retry ;
- results screen ;
- temps, morts, score, XP, loot, réputation ;
- weekly lockouts ;
- journal boss/dungeon intégré au Bestiary si possible.

## Dépendances

- M1 Combat ;
- M3 Party ;
- M2 transitions World/Instance.

## Exit criteria

> matchmaking 5 joueurs → ready → chargement → combat boss → wipe/retry ou clear → résultats → retour monde.

---

# M5 — Economy & Itemization Core

**Outcome :** créer une économie MMORPG unifiée et supprimer les derniers modèles d'objets/inventaires hérités qui n'ont plus de raison d'exister.

**Effort :** XL  
**Risque :** élevé

## Scope économie

- NPC vendor ;
- buy/sell/buyback ;
- bank/storage ;
- marketplace/auction house ;
- player trade ;
- inbox/mail rewards ;
- wallet / currencies ;
- économie transactionnelle serveur-authoritative.

## Scope équipement

- rarity ;
- durability ;
- repair ;
- binding ;
- comparaison détaillée ;
- upgrades ;
- enchantments ;
- sockets/gems — peut être activé progressivement ;
- blacksmith UI.

## Legacy déplacé

### REPLACE
- Habbo Inventory → RPG Inventory ;
- Wardrobe Habbo → Appearance / Equipment / Transmog ;
- Catalog Habbo → NPC Vendor + Housing Furniture Catalog + services spécifiques ;
- anciennes currencies hotel → Wallet RPG.

### DELETE après cutover
- wardrobe protocol/events historiques ;
- vieux inventory events non utilisés ;
- catalog pages/services hôtel non réinterprétés ;
- hand-items Habbo métier.

## Exit criteria

Un item peut suivre un cycle complet :

> loot → inventory → inspect → equip → damage/durability → repair → sell/trade/market → bank.

Transactions idempotentes et resync testés.

---

# M6 — Professions, Gathering & Crafting

**Outcome :** permettre une boucle économique non-combat complète.

**Effort :** L  
**Risque :** moyen

## Scope

- professions ;
- profession levels ;
- recipes ;
- specializations ;
- craft queue ;
- public/guild orders ;
- gathering nodes : ore/herb/tree/etc. ;
- progress interaction ;
- tool requirement ;
- gathering loot feedback ;
- fishing subsystem ;
- crafting stations ;
- blacksmith integration avec M5.

## Exit criteria

> découvre ressource → récolte → progression métier → débloque recette → craft → vend / équipe.

---

# M7 — Identity, Achievements & Collection

**Outcome :** donner une progression longue durée et une identité visible aux personnages.

**Effort :** L  
**Risque :** moyen

## Scope

- achievements ;
- collections ;
- badges ;
- titles ;
- reputation ;
- title display ;
- profile highlights ;
- rare/epic/legendary unlocks ;
- achievements notifications ;
- mount/companion collection hooks.

## Legacy déplacé

### REPLACE
- Habbo achievements score/events → RPG Achievements ;
- Habbo user badges → RPG Badge/Title representation ;
- Habbo group badges → Guild emblem/identity.

### KEEP TECH éventuel
- image loading/cache générique de badges/icons si reusable et renommé.

## Exit criteria

- aucune logique de progression dépend de score/badges Habbo historiques ;
- achievements alimentés par événements gameplay RPG.

---

# M8 — Mounts & Companions

**Outcome :** remplacer complètement le système Pet Habbo par deux domaines RPG distincts.

**Effort :** XL  
**Risque :** élevé

## Mounts

- collection ;
- summon/mount/dismount ;
- movement modifier ;
- terrain bonuses ;
- stable ;
- affection si conservée ;
- appearances ;
- saddle/equipment ;
- restrictions de zone/dungeon.

## Companions

- collection ;
- active companion ;
- team slots ;
- support/tank/DPS/utility roles ;
- skills ;
- energy ;
- affection/care ;
- appearances ;
- progression/evolution si conservée.

## Legacy déplacé

### DELETE
- room/pet protocol Habbo ;
- PetRespect ;
- pet commands historiques ;
- old ride permission ;
- pet product behavior ;
- old pet visualization special cases qui ne servent pas au nouveau runtime.

### KEEP/ADAPT
- animation/visual actor primitives génériques ;
- pathing primitives génériques.

## Exit criteria

- aucune feature Mount/Companion ne dépend de `Pet*` legacy métier ;
- ancien protocole pet retiré du registry.

---

# 7. ROADMAP — LATER / SCALE

# M9 — Live Ops: Events, Calendar & Public World

**Outcome :** créer les premières boucles live-service MMORPG sans tomber dans un design mobile agressif.

**Effort :** L

## Scope

- event calendar ;
- server events ;
- guild events ;
- world boss ;
- public objectives ;
- participation/contribution ;
- event rewards ;
- daily/weekly missions ;
- reset timers ;
- reward claims ;
- event currencies ;
- notification center integration.

## Exit criteria

- un world event complet peut être configuré et exécuté sans patch client ;
- calendrier et reset state sont serveur-authoritative.

---

# M10 — Housing & Guild Hall — Differentiator

**Outcome :** transformer l'héritage créatif Habbo en avantage différenciant MMORPG.

**Effort :** XXL  
**Risque :** très élevé

## Scope

- logements privés ;
- salles de guilde ;
- private-space browser ;
- ownership ;
- visitors ;
- permissions ;
- co-owners ;
- storage ;
- trophies ;
- furniture catalog ;
- decoration inventory ;
- placement mode ;
- move/rotate/grid/align ;
- pick up/store/delete ;
- crafting stations ;
- lighting/decorations ;
- favorites/popular/private-space discovery.

## Legacy déplacé / réinterprété

### REINTERPRET
- room/furni primitives ;
- placement ;
- ownership/permissions utiles ;
- object rendering.

### DO NOT REUSE AS PRODUCT
- Navigator Habbo ;
- hotel public room directory ;
- room ratings/events historiques ;
- Habbo Catalog métier.

Le browser Housing doit être un nouveau domain `housing`, même s'il réutilise des briques techniques.

## Exit criteria

> créer logement → placer mobilier → définir permissions → inviter ami → visiter → sauvegarder/recharger identiquement.

---

# M11 — Alpha Readiness / Product Hardening

**Outcome :** faire passer Ambreia d'un ensemble de systèmes fonctionnels à un produit testable à grande échelle.

**Effort :** XL

## UX / platform

- paramètres complets ;
- keybind editor ;
- accessibilité ;
- chat settings ;
- graphics settings ;
- HUD scaling ;
- ESC menu ;
- help/codex ;
- contextual tutorial ;
- reporting ;
- AFK ;
- reconnect ;
- loading screens ;
- change character ;
- error recovery ;
- notification center.

## Quality

- crash triage ;
- connection fault injection ;
- packet replay/debug ;
- golden paths ;
- performance baselines ;
- content validation ;
- migration tests ;
- save/state compatibility ;
- accessibility pass ;
- localization pass.

---

# 8. Track technique parallèle — Engine 2

Engine 2 ne doit pas devenir une réécriture bloquant le produit. Il suit une migration incrémentale.

## E0 — Baseline

- scènes déterministes ;
- screenshots/reference scenes ;
- timings ;
- dependency graph ;
- performance counters.

## E1 — Dirty-driven Scene Runtime

- SceneDirty flags ;
- observation des update IDs ;
- wake scheduler ;
- statiques dormants ;
- visual update uniquement si dirty/animating.

## E2 — Pointer + Spatial

- éviter les hit-tests idle ;
- spatial index ;
- chunk manager ;
- visibility invalidation.

## E3 — Depth / Occlusion / Lighting

- local depth islands ;
- depth recompute only when dirty ;
- chunk broad phase ;
- occlusion/lighting dirty state.

## E4 — RoomEngine façade

Extraction progressive vers :

- WorldRuntime ;
- SceneRuntime ;
- RoomObjectService ;
- CameraService ;
- SelectionService ;
- SpatialIndex ;
- DepthSystem ;
- OcclusionSystem ;
- LightingSystem ;
- RenderBridge.

## E5 — Fixed Update / Navigation / Workers

- fixed timestep ;
- interpolation ;
- navigation package ;
- workers uniquement pour jobs purs ;
- A* / éventuellement JPS après benchmark.

## Engine 2 acceptance gates

- 500 furni statiques : quasi zéro CPU world/visual après warm-up ;
- souris immobile + scène immobile : 0 hit-test/frame ;
- caméra immobile : 0 recompute visibilité ;
- objet unique déplacé : invalidation locale ;
- 40 avatars en mouvement : seuls dynamiques/animés réveillés ;
- offscreen dormant : 0 visual update ;
- pas de changement depth : 0 global sort ;
- room A → B → A : réutilisation assets chauds ;
- frame times stables en zone dense.

---

# 9. LEGACY DISPLACEMENT ROADMAP

La suppression suit une règle stricte : **on ne conserve ni ne réimplémente automatiquement un comportement juste parce qu'il existait dans Habbo**.

## 9.1 Matrice de décision

| Legacy | Décision | Replacement / justification | Milestone de retrait |
|---|---|---|---|
| HotLooks | **DELETE** | aucun besoin MMORPG | fait |
| Respect | **DELETE** | aucun besoin produit | fait |
| HC / HabboClub | **DELETE** | aucun abonnement club Habbo | fait |
| Perks HC/Habbo | **DELETE** | future progression RPG explicite | fait |
| Navigator public/guest | **DELETE** | World Map / Zones | fait (coupe noyau) |
| Navigator private rooms | **REPLACE** | Housing browser | M10 |
| AvatarEffect lifecycle | **REPLACE** | StatusEffects/VFX/Cosmetics | fait (M1) |
| Wardrobe Habbo | **REPLACE** | supprimé ; Appearance/Equipment/Transmog à construire | M5 |
| Pets Habbo | **REPLACE** | Mounts + Companions | M8 |
| Pet Respect | **DELETE** | Affection RPG si besoin | M8 |
| Habbo Inventory | **REPLACE** | supprimé (coupe noyau) ; `features/inventory` RPG existe | M5 |
| Habbo Catalog | **REPLACE** | supprimé (coupe noyau) ; Vendor + Housing catalog à construire | M5/M10 |
| Habbo Quests | **REPLACE** | supprimé (coupe noyau) ; RPG Quest domain à construire | M2 |
| Habbo Messenger | **REPLACE** | supprimé (messenger, friendlist, ignore/block) ; Social/Friends/Whispers à construire | M3 |
| Habbo Groups | **REPLACE** | supprimé (group info, group badges) ; Party + Guild à construire | M3 |
| Habbo Achievements | **REPLACE** | RPG Achievements | M7 |
| Habbo Badges | **REPLACE** | RPG Badges/Titles/Guild identity | M7 |
| Chat bubbles Habbo | **DELETE** si nouveau chat sans bulles | chat RPG / combat feedback | M3 |
| Old hand-items/carry | **DELETE/REPLACE** | réception supprimée ; `HanditemConfiguration` + carry `AvatarLogic` restent | M5 |
| Hotel room discovery/rating | **DELETE** | monde + housing spécialisé | M2/M10 |
| Room engine/rendering | **KEEP TECH** | moteur de scène/instance | Engine 2 |
| Furni/object rendering | **KEEP/GENERALIZE** | world props + housing props | E1-M10 |
| Window/layout engine | **KEEP TECH** | UI runtime | continu |
| Networking | **KEEP TECH** | protocole RPG | continu |
| Localization | **KEEP TECH** | localisation jeu | continu |
| Asset pipeline | **KEEP TECH** | contenu Ambreia | continu |
| Moderation primitives | **KEEP/REBUILD UI** | reports/admin | M11 |

---

# 10. Procédure professionnelle de suppression d'un domaine legacy

Pour chaque domaine :

## Étape A — Inventory

- fichiers ;
- exports ;
- packet registrations ;
- handlers ;
- managers ;
- UI ;
- assets ;
- tests ;
- config ;
- server counterpart.

## Étape B — Freeze

- marquer `deprecated` ;
- interdire nouveaux imports ;
- ne plus ajouter de comportement.

## Étape C — Replacement seam

- créer contrat RPG ;
- adapter temporaire uniquement si nécessaire ;
- déplacer callsites vers le nouveau domain.

## Étape D — Cutover

- nouvelle feature autoritaire ;
- ancien handler non enregistré ;
- feature flag temporaire uniquement si migration risquée.

## Étape E — Delete

Supprimer toute la chaîne :

`protocol → parser/serializer → handler → manager/session → UI → assets → tests → exports`

## Étape F — Verify

- grep symbole/domaine = 0 sauf migration doc ;
- dependency-cruiser = vert ;
- typecheck/tests = vert ;
- golden path = vert ;
- aucune route protocole legacy enregistrée.

---

# 11. Registre legacy — état mesuré au 2026-10-13

> Mesuré sur la branche `engine-v2-baseline` par grep sur `packages/*/src`, pas estimé. Ce registre
> remplace le `LEGACY_REGISTER.md` prévu : il est tenu à jour ici, à chaque retrait.

## Supprimé

HotLooks, Perks, HC / HabboClub, Respect, Wardrobe, Navigator, Catalog, Messenger / friendlist,
Groups, Quests Habbo, et les dossiers protocole `users`, `friendlist`, `moderation`, `preferences`,
`tracking` avec leurs consommateurs (ignore/block list, group badges, selected badges, hand-item
reçu, chat styles NFT, daily tasks, UI flags, event log, visit user, classification, extended
profile). Les AvatarEffects aussi (M1) : le message 2624, sa chaîne moteur et logique, la
prévisualisation d'effet et neuf layouts ; la danse garde ses quatre bibliothèques sous
`AvatarAnimationAssets` / `AmbreiaAnimationMap.xml`, et les statuts, auras et VFX de combat viennent
du contenu. Il ne reste que des commentaires qui documentent le retrait.

## Restant

| Domaine | Où | Décision | Milestone |
|---|---|---|---|
| Pets Habbo | `protocol/{incoming,outgoing,parser}/room/pet` (16 fichiers), `iso/avatar/pet`, `game/room/object/visualization/pet` | REPLACE | M8 |
| Achievements score / badges | `AchievementsScoreMessageEvent`, `BadgeImageManager`, `BadgeImageWidget` | REPLACE | M7 |
| Chat bubbles Habbo | `IlluminaChatBubbleWidget`, `RoomChatHandler` ; le journal de combat existe (M1, touche L) | DELETE si chat RPG sans bulles | M3 |
| Hand-items / carry | `HanditemConfigurationMessageEvent`, carry dans `AvatarLogic` | DELETE/REPLACE | M5 |
| Moderation primitives | `RoomSession.ambassadorAlert`, mute/kick/ban composers | KEEP / REBUILD UI | M11 |

## Le vérifier

- `node .claude/scripts/find-orphans.mjs` : fichiers qu'aucun point d'entrée n'atteint ;
- `pnpm test` : `incoming-registered` / `outgoing-registered` listent les messages servis par aucun style ;
- `grep -rlw <Domaine> packages/*/src` doit retomber à zéro hors commentaires à chaque retrait.

---

# 12. Dependency map des grands milestones

```text
M0 Product Lock / Legacy Fence
   |
   +--------------------+
   |                    |
   v                    v
M1 Combat            M2 World/NPC
   |                    |
   +---------+----------+
             |
             v
          M3 Social
             |
        +----+----+
        |         |
        v         v
      M4 PvE    M5 Economy
        |         |
        |         +------> M6 Professions
        |
        +---------------> M7 Identity
                           |
                           +----> M8 Mounts/Companions

M2 + M5 + M7 + Engine2 ----------> M10 Housing
M4 + M7 + M3 --------------------> M9 Live Ops
Tous --------------------------------> M11 Alpha Hardening
```

---

# 13. Priorisation

## P0 — Blockers / architecture produit

- M0 legacy fence ;
- M1 combat support ;
- M2 world/NPC ;
- reconnect/loading minimal ;
- Engine 2 baseline + dirty-driven migration.

## P1 — Boucle MMO complète

- M3 social ;
- M4 dungeon lifecycle ;
- M5 economy/itemization ;
- M6 professions.

## P2 — Retention / identity

- M7 achievements/reputation ;
- M8 mounts/companions ;
- M9 events/live ops.

## P3 — Différenciation profonde

- M10 housing/guild halls ;
- systèmes avancés d'itemization ;
- plus de profondeur collections/cosmetics.

---

# 14. Risques principaux

## R1 — Scope explosion

Ambreia couvre déjà le périmètre d'un MMO important.

**Mitigation :** vertical slices, gates, V1/V1.5/Later, pas de feature commencée sans outcome et exit criteria.

## R2 — Mockup ≠ feature terminée

Les mockups décrivent très bien l'UX mais pas toujours les règles serveur.

**Mitigation :** chaque feature doit posséder une mini-spec métier avant implémentation.

## R3 — Legacy semantics leak

Renommer `HabboPet` en `Companion` sans refaire le modèle métier conserve la dette.

**Mitigation :** remplacement par domain RPG + suppression du protocole historique.

## R4 — Engine rewrite trap

Une réécriture Engine 2 globale pourrait geler le produit.

**Mitigation :** strangler/extraction incrémentale, benchmarks, façade `RoomEngine`.

## R5 — Client/server drift

Client mockup avancé mais backend pas aligné.

**Mitigation :** contrats versionnés, protocol ownership, tests de messages, docs client/server synchronisées.

## R6 — Housing devient un second jeu

Housing + mobilier + permissions + stockage + navigateur + guilde est énorme.

**Mitigation :** le conserver en milestone différenciateur après les boucles MMORPG principales.

## R7 — Content throughput

Même un bon moteur ne crée pas zones/quêtes/donjons automatiquement.

**Mitigation :** Map Editor, validators, templates, data-driven configs, playtest tools.

---

# 15. Cadence de gestion de roadmap

## À chaque milestone

- vérifier outcome ;
- mesurer ce qui est réellement livré ;
- mettre à jour dépendances ;
- retirer le legacy déplacé ;
- mettre à jour risques ;
- reclasser NOW/NEXT/LATER si nécessaire.

## Toutes les 2–4 semaines

Roadmap review courte :

1. Qu'avons-nous rendu jouable ?
2. Quelle dette a été supprimée ?
3. Quel blocker est apparu ?
4. Est-ce qu'un milestone doit être réduit ?
5. Le prochain milestone maximise-t-il toujours la valeur et la réduction de risque ?

## Après 2–3 milestones mesurés

Ajouter une roadmap calendaire réaliste :

- capacité moyenne ;
- durée P50/P80 des initiatives ;
- dates prévisionnelles par release ;
- marge explicite pour bugs/refactor/content.

Ne pas utiliser des dates inventées avant d'avoir cette vélocité.

---

# 16. Release gates proposées

## Gate A — RPG Core Playable

- combat support complet ;
- quest + NPC ;
- world map/travel ;
- inventory/equipment stable ;
- death/respawn ;
- reconnect minimal ;
- ancien Navigator public et AvatarEffects métier retirés.

## Gate B — MMO Loop Playable

- social ;
- party/guild ;
- dungeon full lifecycle ;
- trade/market/bank ;
- player inspection/whispers.

## Gate C — Progression Loop Playable

- professions ;
- reputation ;
- achievements/titles ;
- mounts/companions ;
- economy stable.

## Gate D — Content Scale Ready

- world events ;
- content authoring stable ;
- map editor validators ;
- dungeon templates ;
- NPC/quest tooling ;
- telemetry/debugging.

## Gate E — Alpha Ready

- UX/platform hardening ;
- accessibilité ;
- settings/keybinds ;
- reporting ;
- reconnect ;
- performance targets ;
- legacy critique restant = 0 ou explicitement justifié.

## Gate F — Differentiated Alpha/Beta

- housing MVP ;
- guild hall ;
- decoration ;
- private-space browser ;
- live event readiness.

---

# 17. KPI / indicateurs à suivre

## Produit / gameplay

- temps nécessaire pour atteindre la première boucle combat complète ;
- taux d'échec des interactions importantes ;
- temps de formation d'un groupe ;
- abandon du matchmaking ;
- wipes/clear par donjon et difficulté ;
- utilisation des systèmes world/travel ;
- économie : création/destruction de monnaie et volumes marché ;
- progression métiers / achievements / réputation.

## Technique

- crash-free sessions ;
- reconnect success rate ;
- packet/state resync failures ;
- frame time P50/P95 en zone dense ;
- CPU world/render idle ;
- mémoire room/zone ;
- temps de transition zone/instance ;
- tests et architecture checks ;
- nombre de dépendances vers legacy ;
- nombre de packet handlers legacy encore enregistrés.

## Legacy burn-down

Maintenir un dashboard simple :

```text
Legacy domains total
Legacy domains frozen
Legacy domains replacement-ready
Legacy domains deleted
Legacy protocol handlers remaining
Legacy imports remaining
```

La progression architecture doit être visible comme une métrique produit, pas un travail invisible.

---

# 18. Prochaine action concrète

La prochaine étape n'est **pas** de commencer dix milestones.

Ordre immédiat recommandé :

1. valider cette roadmap ;
2. ~~créer `LEGACY_REGISTER.md`~~ — le registre est le §11, tenu à jour à chaque retrait ;
3. ~~supprimer M0~~ — fait le 2026-10-13 ;
4. ~~figer les imports legacy~~ — `wall()` et les tests de registre le font déjà ;
5. ~~spécifier M1 Combat Support en détail~~ — `docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md` ;
6. ~~implémenter M1 en vertical slice~~ — livré le 2026-10-13, serveur et client ; le parcours live à deux comptes reste à faire ;
7. ~~supprimer AvatarEffects au cutover~~ — fait ;
8. **prochain : M2 World/NPC**, avec les quêtes qui portent les récompenses de combat.

Cela donne un développement lisible, mesurable et réversible, au lieu d'un grand rewrite et d'une suppression massive risquée.

---

# 19. Références méthodologiques ayant inspiré la structure

- Atlassian — Product Roadmaps / Agile Roadmaps : roadmap comme source partagée de vision, direction, priorités et progrès ; usage d'horizons plus larges et de `Now / Next / Later` lorsque les dates exactes seraient artificielles.
- Productboard — roadmap orientée objectifs et outcomes, puis priorisation des initiatives servant ces objectifs.
- Martin Fowler / Thoughtworks — Strangler Fig : modernisation incrémentale, découpage du legacy en parties remplaçables plutôt qu'un rewrite global.
- Microsoft Azure Architecture Center — Strangler Fig : conserver l'ancien système opérationnel pendant la migration, déplacer progressivement les responsabilités, puis désaffecter le legacy lorsque toutes les dépendances ont migré.

---

# 20. Décision de gouvernance finale

> **Toute nouvelle feature Ambreia doit être conçue dans son domaine RPG cible. Le legacy Habbo peut uniquement servir temporairement d'implémentation technique ou de compatibilité documentée. Aucun nouveau besoin MMORPG ne doit prolonger un domaine legacy destiné à disparaître.**

Cette règle évite que le projet reste indéfiniment « entre Habbo et MMORPG ».
