# AMBREIA — UI/UX MASTER BIBLE

> **Statut** : document maître UI/UX
> **Objectif** : garantir une interface MMORPG cohérente, lisible, réutilisable et extensible pour tout Ambreia.
> **Usage** : référence obligatoire pour les designers, développeurs UI et agents IA qui créent ou modifient une interface.

---

# 0. Vision UI

Ambreia doit donner l'impression d'un **MMORPG isométrique moderne construit autour d'un langage pixel-art maîtrisé**, et non d'un client Habbo sur lequel des fenêtres RPG ont été greffées.

L'interface doit être :

- **cohérente** : les mêmes actions se comportent toujours de la même manière ;
- **lisible** : priorité claire entre information primaire, secondaire et décorative ;
- **dense sans être étouffante** : beaucoup d'information, mais hiérarchisée ;
- **réactive** : hover, pressed, disabled, cooldown, loading, erreur et succès sont toujours visibles ;
- **modulaire** : les fenêtres partagent des composants communs ;
- **MMORPG-first** : combat, social, monde, progression et économie sont prioritaires ;
- **pixel-perfect** : aucun mélange incohérent entre pixel-art, UI web moderne et vieux widgets Habbo ;
- **durable** : toute nouvelle feature doit pouvoir s'insérer sans inventer un nouveau style.

## 0.1 Références produit utilisées

Cette bible consolide :

- les dernières mockups Ambreia ;
- le catalogue fonctionnel MMORPG ;
- la roadmap produit/technique ;
- les features déjà présentes dans le client ;
- les systèmes confirmés : combat, character, inventory, skills, quests, friends, party, guild, achievements, crafting, dungeon, mounts, companions, marketplace, bank, trading, inbox, housing, world map, NPC dialogue, settings, events, etc. ;
- les fonctionnalités encore à implémenter : buffs/debuffs, cast, death/respawn, inspection, fast travel, dungeon lifecycle, advanced equipment, world events, reconnect, etc.

---

# 1. Principes de design non négociables

## 1.1 Une feature = un langage visuel partagé

Ne jamais créer une nouvelle feature avec :

- son propre type de bouton ;
- sa propre scrollbar ;
- ses propres marges arbitraires ;
- ses propres modales ;
- ses propres tooltips ;
- son propre style de liste ;
- son propre code couleur de rareté ;
- son propre comportement de fermeture.

Tout doit réutiliser le **UI Kit Ambreia**.

## 1.2 Hiérarchie en trois niveaux

Chaque fenêtre doit séparer :

1. **Primaire** — information/action essentielle ;
2. **Secondaire** — détails utiles ;
3. **Tertiaire** — lore, metadata, informations avancées.

Exemple pour un objet :

```text
Épée d'Ambre                     ← primaire
Niveau 32 • Épique               ← secondaire
+42 Force • +16 Critique          ← primaire gameplay
Lié quand équipé                  ← secondaire
« Forgée dans les ruines... »     ← tertiaire
```

## 1.3 Une action dangereuse doit être explicite

Toujours demander confirmation pour :

- supprimer un objet rare ;
- quitter une guilde ;
- expulser un joueur ;
- abandonner une quête importante ;
- retirer une amélioration irréversible ;
- acheter un objet cher ;
- dépenser une monnaie rare ;
- téléporter un groupe ;
- réinitialiser un build ;
- supprimer une décoration/housing si perte potentielle.

## 1.4 Le hover informe, le clic agit

Le hover doit expliquer l'action avant qu'elle ne soit exécutée.

Un bouton icône sans texte doit toujours avoir un tooltip.

---

# 2. Langage visuel Ambreia

## 2.1 Direction générale

Le style visuel doit conserver :

- panneaux sombres lisibles ;
- bordures pixel-art nettes ;
- accents ambre/or pour les actions importantes et l'identité Ambreia ;
- bleu pour l'information/navigation ;
- vert pour validation/soin/succès ;
- rouge pour danger/hostile/erreur ;
- violet pour rareté/effets spéciaux selon le système de rareté ;
- surfaces légèrement stratifiées afin de distinguer panneaux, listes et sous-panneaux.

Ne pas multiplier les couleurs décoratives : une couleur doit avoir une **signification stable**.

## 2.2 Tokens à centraliser

Ne jamais hardcoder les valeurs dans chaque écran.

```text
--ui-bg-root
--ui-bg-window
--ui-bg-panel
--ui-bg-panel-raised
--ui-bg-hover
--ui-bg-selected
--ui-border-default
--ui-border-strong
--ui-text-primary
--ui-text-secondary
--ui-text-muted
--ui-accent
--ui-info
--ui-success
--ui-warning
--ui-danger
--ui-disabled
```

Ajouter les tokens fonctionnels :

```text
--rarity-common
--rarity-uncommon
--rarity-rare
--rarity-epic
--rarity-legendary
--rarity-mythic

--role-tank
--role-healer
--role-dps

--relation-friendly
--relation-neutral
--relation-hostile
```

## 2.3 Typographie

Prévoir au minimum :

```text
UI_TITLE_L
UI_TITLE_M
UI_BODY
UI_BODY_SMALL
UI_LABEL
UI_NUMBER
UI_TOOLTIP
UI_COMBAT_NUMBER
```

Règles :

- chiffres de combat très lisibles ;
- pas de textes décoratifs minuscules ;
- contraste fort ;
- alignement cohérent ;
- longueur de texte prévue pour localisation future.

## 2.4 Pixel-perfect

Pour les assets pixel-art :

- alignement sur pixels entiers ;
- éviter scaling fractionnaire ;
- éviter blur/filter CSS incompatible ;
- privilégier 9-slice / sprites adaptés ;
- ne pas utiliser un shadow moderne très diffus sur un composant pixel-art ;
- garder des angles/bordures cohérents sur toutes les fenêtres.

---

# 3. Anatomie standard d'une fenêtre

Toute fenêtre Ambreia devrait suivre cette structure lorsque pertinente :

```text
┌───────────────────────────────────┐
│ Icône  TITRE              [?] [X] │ ← header
├───────────────────────────────────┤
│ tabs / filtres / recherche        │ ← navigation locale
├───────────────┬───────────────────┤
│ liste         │ détail            │ ← contenu principal
│               │                   │
├───────────────┴───────────────────┤
│ statut / coût       ACTION        │ ← footer contextuel
└───────────────────────────────────┘
```

## 3.1 Header

Peut contenir :

- icône de domaine ;
- titre ;
- compteur pertinent ;
- aide contextuelle ;
- réduction/minimisation si supportée ;
- fermeture.

## 3.2 Footer

Le footer ne doit pas être obligatoire.

Utiliser uniquement lorsqu'il existe :

- une action principale ;
- un coût ;
- une validation ;
- une pagination ;
- un résumé de sélection.

## 3.3 Fenêtres redimensionnables

À réserver aux interfaces où l'espace supplémentaire apporte réellement de la valeur :

- chat ;
- guild roster ;
- marketplace ;
- inventory éventuellement ;
- combat log ;
- world map.

---

# 4. États obligatoires des composants

Tout composant interactif doit pouvoir représenter :

```text
DEFAULT
HOVER
PRESSED
SELECTED
FOCUSED
DISABLED
LOADING
ERROR
SUCCESS
NEW / UNREAD
LOCKED
COOLDOWN
```

## 4.1 Boutons

Types standards :

- `PrimaryButton`
- `SecondaryButton`
- `DangerButton`
- `GhostButton`
- `IconButton`
- `ToggleButton`

Ne jamais créer 15 variantes arbitraires.

## 4.2 Slots

Un slot doit gérer :

- vide ;
- rempli ;
- hover ;
- sélectionné ;
- verrouillé ;
- indisponible ;
- cooldown ;
- quantité ;
- qualité/rareté ;
- bind ;
- nouveau ;
- broken/durability warning ;
- comparaison.

## 4.3 List rows

États :

- normal ;
- hover ;
- selected ;
- disabled ;
- unread ;
- online/offline ;
- warning ;
- hostile/friendly si besoin.

---

# 5. Composants partagés obligatoires

Construire ces composants une seule fois.

## 5.1 Navigation

- `WindowShell`
- `Tabs`
- `SubTabs`
- `Breadcrumbs`
- `SearchField`
- `FilterDropdown`
- `Pagination`
- `CategorySidebar`

## 5.2 Items / RPG

- `ItemSlot`
- `ItemTooltip`
- `ItemComparisonTooltip`
- `EquipmentSlot`
- `RewardCard`
- `CurrencyDisplay`
- `RarityFrame`
- `DurabilityBar`
- `StatDelta`

## 5.3 Joueurs

- `PlayerPortrait`
- `PlayerNameplate`
- `PlayerCard`
- `RoleBadge`
- `PresenceIndicator`
- `PlayerContextMenu`

## 5.4 Combat

- `HealthBar`
- `ResourceBar`
- `CastBar`
- `StatusEffectIcon`
- `CooldownOverlay`
- `TargetFrame`
- `ThreatIndicator`
- `FloatingCombatText`

## 5.5 Quêtes / monde

- `QuestRow`
- `ObjectiveRow`
- `MapMarker`
- `ZoneBanner`
- `WorldEventTracker`
- `NPCServiceButton`

## 5.6 Feedback

- `Tooltip`
- `Toast`
- `Banner`
- `Modal`
- `ConfirmModal`
- `ErrorState`
- `EmptyState`
- `LoadingState`
- `ProgressOverlay`

---

# 6. Gestion globale des fenêtres

## 6.1 Focus

- cliquer une fenêtre la place au premier plan ;
- une seule fenêtre reçoit les raccourcis clavier contextuels ;
- ESC ferme d'abord la modale supérieure, puis la fenêtre active, puis ouvre le menu ESC.

## 6.2 Modales

Maximum recommandé : **une vraie modale bloquante à la fois**.

Ne pas empiler :

```text
Modal
→ Modal
→ Modal
→ Modal
```

Préférer une progression dans la même modale.

## 6.3 Persistance

Certaines fenêtres peuvent mémoriser :

- position ;
- taille ;
- dernier onglet ;
- filtres ;
- tri ;
- catégorie ouverte.

Ne pas mémoriser une confirmation ou une modale temporaire.

---

# 7. HUD principal

Le HUD ne doit pas devenir une collection permanente de fenêtres.

## 7.1 Éléments permanents

- joueur : HP / ressource ;
- action bar ;
- mini tracker de quête ;
- minimap/mini-navigation si conservée ;
- raccourcis de menus principaux ;
- indicateurs réseau importants ;
- buffs/debuffs importants ;
- cible active lorsqu'elle existe.

## 7.2 Éléments contextuels

- cast bar ;
- target-of-target ;
- boss health bar ;
- world event tracker ;
- party frames ;
- interaction prompt ;
- dungeon objective ;
- PvP scoreboard ;
- zone discovery banner.

## 7.3 Ne jamais afficher en permanence

- gros inventaire ;
- journal de quêtes ;
- guild roster ;
- marketplace ;
- achievements ;
- character details.

---

# 8. INVENTAIRE MAÎTRE DES INTERFACES

Les sections suivantes définissent les écrans à prévoir.

---

# 9. Personnage & progression

## UI-CHAR-01 — Character Overview

### Contenu

- portrait/avatar ;
- nom ;
- niveau ;
- classe ;
- titre actif ;
- guilde ;
- équipement visible ;
- stats principales ;
- puissance/item level éventuel.

### Onglets

- Aperçu
- Stats
- Équipement
- Titres
- Réputation

### Actions

- modifier titre ;
- ouvrir détail stats ;
- gérer apparence si disponible.

---

## UI-CHAR-02 — Detailed Stats

Catégories :

- offensif ;
- défensif ;
- ressources ;
- vitesse ;
- critique ;
- résistances ;
- métier si pertinent.

Chaque stat complexe doit avoir un tooltip explicatif.

---

## UI-CHAR-03 — Equipment

Slots typiques :

- tête ;
- torse ;
- mains ;
- jambes ;
- pieds ;
- arme principale ;
- secondaire ;
- accessoires ;
- éventuellement cape/amulette/anneaux selon design final.

Fonctions :

- equip ;
- unequip ;
- drag & drop ;
- comparaison ;
- durability ;
- sockets ;
- enchantments ;
- bind status.

---

## UI-CHAR-04 — Inspect Other Player

Afficher :

- personnage ;
- classe ;
- niveau ;
- équipement ;
- guilde ;
- titre ;
- achievements sélectionnés ;
- monture/compagnon affiché si autorisé.

Respecter les paramètres de confidentialité futurs.

---

## UI-CHAR-05 — Titles

- titres débloqués ;
- verrouillés ;
- rareté ;
- condition ;
- aperçu ;
- équiper/déséquiper.

---

## UI-CHAR-06 — Reputation

Pour chaque faction/région :

- niveau de réputation ;
- progression ;
- récompenses ;
- services débloqués ;
- réputation requise pour NPC/quest/travel.

---

## UI-CHAR-07 — Level Up

Popup/overlay événementiel :

- nouveau niveau ;
- stats gagnées ;
- skills débloqués ;
- nouveaux donjons/zones ;
- éventuellement récompense.

Doit être satisfaisant mais court et skippable.

---

# 10. Inventaire, équipement & items

## UI-INV-01 — Inventory

Fonctions :

- grille ;
- catégories ;
- recherche ;
- tri ;
- stack ;
- drag & drop ;
- split stack ;
- use ;
- equip ;
- destroy ;
- favorite/lock optionnel ;
- capacité utilisée/max.

Filtres :

- équipement ;
- consommables ;
- matériaux ;
- quête ;
- divers.

---

## UI-INV-02 — Item Tooltip

Toujours afficher :

- nom ;
- rareté ;
- type ;
- niveau requis ;
- stats ;
- effets ;
- valeur ;
- bind ;
- durability ;
- source ou lore lorsque pertinent.

---

## UI-INV-03 — Item Compare

Deux colonnes :

```text
Équipé           Nouveau
```

Différences positives/négatives clairement visibles.

---

## UI-INV-04 — Reward Choice

Pour récompense de quête :

- afficher toutes les options ;
- choisir 1 ;
- comparaison équipement actuel ;
- confirmer choix.

---

## UI-INV-05 — Blacksmith / Upgrade

Onglets potentiels :

- Réparer
- Améliorer
- Enchanter
- Gemmes

Toujours afficher :

- résultat attendu ;
- coût ;
- chance si système probabiliste ;
- conséquences ;
- ressources manquantes.

---

## UI-INV-06 — Wallet

Liste centralisée des monnaies :

- or ;
- monnaie premium si existante ;
- PvP ;
- donjon ;
- événement ;
- guilde ;
- autres monnaies spécifiques.

Chaque monnaie : source + usage dans tooltip.

---

# 11. Skills & builds

## UI-SKILL-01 — Skill Book

- actives ;
- passives ;
- verrouillées ;
- niveaux ;
- coûts ;
- cooldown ;
- resource cost ;
- assignation hotbar.

---

## UI-SKILL-02 — Specialization / Talent Tree

- branches ;
- prérequis ;
- points disponibles ;
- aperçu avant validation ;
- reset avec confirmation.

---

## UI-SKILL-03 — Hotkey Assignment

- skill ;
- touche ;
- conflit ;
- remplacer raccourci ;
- reset defaults.

---

# 12. Combat HUD & combat support

## UI-COMBAT-01 — Player Combat HUD

- HP ;
- mana/resource ;
- level ;
- class/portrait si retenu ;
- important status.

---

## UI-COMBAT-02 — Target Frame

Afficher :

- nom ;
- niveau ;
- HP ;
- elite/boss icon ;
- distance ;
- buffs/debuffs ;
- cast ;
- relation ;
- target-of-target.

---

## UI-COMBAT-03 — Target of Target

Compact.

But principal :

- savoir qui le monstre attaque ;
- support tank/healer ;
- menace lisible.

---

## UI-COMBAT-04 — Cast Bar

États :

- casting ;
- channeling ;
- interruptible ;
- non interruptible ;
- interrupted ;
- cancelled ;
- failed.

Erreurs associées :

- hors portée ;
- cible invalide ;
- mana insuffisante ;
- cooldown ;
- ligne de vue ;
- mouvement interdit si applicable.

---

## UI-COMBAT-05 — Buff/Debuff Bar

Chaque effet :

- icône ;
- durée ;
- stacks ;
- positif/négatif ;
- tooltip ;
- dispellable éventuellement.

---

## UI-COMBAT-06 — Floating Combat Text

Catégories visuelles distinctes :

- dégâts ;
- critique ;
- soin ;
- esquive ;
- blocage ;
- absorb ;
- XP ;
- réputation.

Option désactivable dans settings.

---

## UI-COMBAT-07 — Combat Log

Canal/tab dédié :

- dégâts ;
- soins ;
- critiques ;
- miss/dodge/block ;
- buffs appliqués/retirés ;
- morts ;
- interrupts.

Filtres possibles.

---

## UI-COMBAT-08 — Death / KO

Actions possibles :

- Réapparaître ;
- choisir checkpoint ;
- attendre résurrection ;
- retour checkpoint de donjon.

Afficher clairement :

- conséquence éventuelle ;
- timer ;
- proposition de résurrection reçue.

---

## UI-COMBAT-09 — Player Resurrection Request

- joueur qui ressuscite ;
- lieu ;
- accepter/refuser ;
- timer ;
- état de combat.

---

## UI-COMBAT-10 — Threat / Aggro

V1 :

- indicateur de cible du monstre ;
- changement d'aggro visible.

Extension :

- threat meter par joueur.

---

# 13. Quêtes

## UI-QUEST-01 — Quest Tracker

HUD compact :

- quête ;
- objectifs ;
- progression ;
- distance ;
- pin/unpin ;
- collapse.

---

## UI-QUEST-02 — Quest Journal

Catégories :

- principale ;
- secondaire ;
- quotidienne/hebdo ;
- terminée ;
- région.

Détail :

- lore ;
- objectifs ;
- récompenses ;
- zone ;
- niveau ;
- abandon ;
- suivre.

---

## UI-QUEST-03 — Quest Accept

- NPC/source ;
- description ;
- objectifs ;
- récompenses ;
- prérequis ;
- accepter/refuser.

---

## UI-QUEST-04 — Quest Complete

- résumé ;
- XP ;
- réputation ;
- monnaie ;
- objets ;
- choix de récompense si applicable.

---

# 14. NPC & services

## UI-NPC-01 — Dialogue NPC

Supporte :

- texte scénarisé ;
- portrait/name ;
- réponses multiples ;
- choix conditionnels ;
- continue/back/exit ;
- états de quête.

États quêtes :

- disponible ;
- en cours ;
- prête à rendre ;
- terminée ;
- verrouillée.

---

## UI-NPC-02 — NPC Service Hub

Services possibles :

- parler ;
- boutique ;
- réparer ;
- craft ;
- métier ;
- téléportation ;
- banque ;
- quête.

Les services indisponibles doivent montrer **pourquoi**.

Exemple :

```text
Téléportation vers Fort-Ambre
🔒 Réputation : Honoré requise
```

---

# 15. Monde, carte & voyage

## UI-WORLD-01 — World Map

Hiérarchie :

```text
Monde
→ Région
→ Zone
→ Local
```

Fonctions :

- zoom ;
- pan ;
- filtres ;
- points de voyage ;
- villes ;
- quêtes ;
- donjons ;
- world events ;
- marqueurs personnalisés.

---

## UI-WORLD-02 — Fast Travel

Afficher :

- destination ;
- coût ;
- état débloqué ;
- niveau/condition ;
- confirmation ;
- channeling éventuel.

---

## UI-WORLD-03 — Zone Discovery

Bandeau court :

```text
FORÊT D'AMBRE
Niveau conseillé 15–25
Zone sûre
+250 XP découverte
```

Variantes :

- Safe
- PvP
- Dungeon
- Elite
- Event

---

## UI-WORLD-04 — Interaction Prompt

Exemples :

```text
[E] Parler
[E] Récolter
[E] Ouvrir
[E] Utiliser
[E] Voyager
```

Doit s'adapter à la touche configurée.

---

# 16. Gathering & professions

## UI-PROF-01 — Gathering Feedback

- nom ressource ;
- outil requis ;
- profession requise ;
- progress bar ;
- quantité reçue ;
- XP métier.

---

## UI-PROF-02 — Crafting

- métier ;
- niveau ;
- recettes ;
- recherche ;
- filtres ;
- ingrédients ;
- résultat ;
- quantité ;
- craft queue ;
- recettes favorites.

---

## UI-PROF-03 — Profession Overview

- professions connues ;
- niveau ;
- XP ;
- spécialisations ;
- recettes débloquées ;
- progression.

---

## UI-PROF-04 — Fishing

Mini-système spécifique :

- lancer ;
- attente ;
- signal de touche ;
- interaction ;
- résultat ;
- qualité ;
- compétence/progression.

---

# 17. Social

## UI-SOC-01 — Player Context Menu

Menu universel :

- Profil
- Chuchoter
- Inviter groupe
- Échanger
- Duel
- Ajouter ami
- Inspecter
- Inviter guilde si permission
- Signaler
- Bloquer

Disponibilité dynamique selon contexte.

---

## UI-SOC-02 — Friends

Onglets :

- amis ;
- invitations ;
- bloqués.

Fonctions :

- présence ;
- zone actuelle si autorisée ;
- whisper ;
- group invite ;
- remove ;
- block.

---

## UI-SOC-03 — Whisper / Private Chat

- tabs/conversations ;
- historique ;
- unread ;
- offline ;
- context menu sur nom ;
- timestamp optionnel.

---

## UI-SOC-04 — Player Search

Recherche globale :

- nom ;
- statut ;
- niveau ;
- classe ;
- guilde si visible ;
- actions sociales.

---

## UI-SOC-05 — Party

Afficher :

- leader ;
- Tank / Heal / DPS ;
- niveau ;
- HP ;
- statut ;
- ready ;
- range/zone éventuellement.

Actions leader :

- kick ;
- promote ;
- ready check ;
- loot rules ;
- queue dungeon.

---

## UI-SOC-06 — Ready Check

- membres ;
- rôle ;
- accepté/refusé/en attente ;
- timer.

---

## UI-SOC-07 — Guild

Onglets :

- Aperçu
- Membres
- Chat
- Activité
- Banque si implémentée
- Événements
- Permissions
- Paramètres

---

## UI-SOC-08 — Duel Request

- challenger ;
- accepter/refuser ;
- countdown ;
- résultat.

---

## UI-SOC-09 — Trade Player

Deux colonnes :

```text
VOUS                 JOUEUR
```

Afficher :

- items proposés ;
- monnaie ;
- verrouillage ;
- confirmation en deux phases ;
- changement après validation = reset confirmation.

---

# 18. Dungeons, raids & PvE instancié

## UI-DUN-01 — Dungeon Browser

- liste ;
- niveau ;
- rôles ;
- difficultés ;
- rewards ;
- disponibilité ;
- lockout.

---

## UI-DUN-02 — Dungeon Entry Confirmation

- nom ;
- difficulté ;
- niveau recommandé ;
- composition ;
- récompenses ;
- verrouillage ;
- Entrer / Annuler.

---

## UI-DUN-03 — Matchmaking Queue

- donjon ;
- rôle ;
- temps estimé ;
- temps en file ;
- quitter file.

---

## UI-DUN-04 — Group Found

- joueurs/rôles ;
- accepter/refuser ;
- timer ;
- pénalité éventuelle de refus à spécifier.

---

## UI-DUN-05 — Dungeon Objectives HUD

- objectif actuel ;
- boss ;
- progression ;
- timer éventuel ;
- deaths éventuelles selon mode.

---

## UI-DUN-06 — Dungeon Results

- durée ;
- boss vaincus ;
- morts ;
- score ;
- XP ;
- loot ;
- réputation ;
- rang éventuel ;
- replay/leave.

---

## UI-DUN-07 — Wipe / Failure

- cause/résumé minimal ;
- recommencer ;
- checkpoint ;
- quitter.

---

## UI-DUN-08 — Boss / Dungeon Journal

À intégrer de préférence au Bestiary :

- boss ;
- mechanics ;
- abilities ;
- difficulties ;
- known drops ;
- discovered/unknown states.

---

# 19. Bestiary

## UI-BEST-01 — Bestiary Browser

- régions ;
- type ;
- recherche ;
- découvert/inconnu.

Détail :

- portrait ;
- niveau ;
- type ;
- resistances ;
- abilities ;
- drops ;
- lieux ;
- lore.

---

# 20. Arena & PvP

## UI-PVP-01 — Arena Browser / Queue

- mode ;
- team size ;
- rewards ;
- rank éventuel ;
- queue.

---

## UI-PVP-02 — PvP HUD

- équipes ;
- score ;
- timer ;
- objectifs ;
- kills/deaths si pertinent.

---

## UI-PVP-03 — PvP Results

- gagnant ;
- score ;
- contribution ;
- récompenses ;
- rank change éventuel.

---

# 21. Mounts

## UI-MOUNT-01 — Mount Collection

- collection ;
- filtres ;
- mount active ;
- verrouillé ;
- source ;
- favorites.

---

## UI-MOUNT-02 — Mount Detail

- modèle/preview ;
- vitesse/bonus si applicable ;
- apparence ;
- equipment éventuel ;
- summon.

---

# 22. Companions

## UI-COMP-01 — Companion Collection

- collection ;
- active ;
- level/progression si retenu ;
- rôle ;
- rareté.

---

## UI-COMP-02 — Companion Detail

- stats ;
- skills ;
- équipement si applicable ;
- affection/care ;
- apparence ;
- summon/dismiss.

---

## UI-COMP-03 — Companion Team

Si plusieurs slots :

- composition ;
- ordre ;
- rôle ;
- quick swap.

---

# 23. Achievements, badges & collection

## UI-ACH-01 — Achievements

- catégories ;
- progression ;
- points ;
- locked ;
- completed ;
- pin ;
- reward.

---

## UI-ACH-02 — Achievement Popup

Court et non bloquant :

- nom ;
- icon ;
- récompense ;
- catégorie.

---

## UI-ACH-03 — Badges / Collection

- collection ;
- rareté ;
- source ;
- display slots éventuels.

---

# 24. Economy

## UI-ECO-01 — NPC Vendor

- Buy
- Sell
- Buyback

Fonctions :

- catégorie ;
- recherche ;
- quantité ;
- prix ;
- comparaison.

---

## UI-ECO-02 — Bank

- stockage ;
- drag & drop ;
- recherche ;
- catégories ;
- stack ;
- capacité.

---

## UI-ECO-03 — Marketplace / Auction House

- browse ;
- search ;
- filters ;
- sort ;
- listing ;
- sell item ;
- historique ;
- prix ;
- commission ;
- durée ;
- retrait.

Important : l'information prix doit être extrêmement lisible.

---

## UI-ECO-04 — Inbox / Mail

- inbox ;
- unread ;
- sender ;
- subject ;
- attachment ;
- currency ;
- claim all si autorisé ;
- delete.

---

# 25. Events & live world

## UI-EVENT-01 — Calendar

- mois/semaine ;
- server events ;
- guild events ;
- world boss ;
- daily/weekly reset.

---

## UI-EVENT-02 — World Event Tracker

HUD contextuel :

- nom ;
- objectif ;
- progression ;
- participants ;
- temps restant ;
- contribution.

---

## UI-EVENT-03 — World Event Results

- participation ;
- contribution ;
- récompenses ;
- bonus rank/tier si utilisé.

---

## UI-EVENT-04 — Daily / Weekly Rewards

- calendrier/progression ;
- claimed ;
- current ;
- locked ;
- chest/reward preview.

Éviter le langage mobile/FOMO agressif.

---

# 26. Housing & Guild Hall

## UI-HOUSE-01 — Housing Browser

C'est **un système RPG neuf**, pas le Navigator Habbo.

Catégories :

- Mes logements
- Amis
- Guilde
- Favoris
- Populaires

Informations :

- propriétaire ;
- type ;
- visiteurs ;
- permissions ;
- preview.

---

## UI-HOUSE-02 — Housing Management

- nom ;
- description ;
- privacy ;
- permissions ;
- visitors ;
- storage ;
- trophies ;
- reset options.

---

## UI-HOUSE-03 — Decoration Mode

Toolbar dédiée :

- placer ;
- déplacer ;
- tourner ;
- récupérer ;
- stocker ;
- supprimer ;
- grille ;
- alignement ;
- undo/redo si possible.

Le feedback valide/invalide de placement doit être instantané.

---

## UI-HOUSE-04 — Furniture Catalog

- catégorie ;
- recherche ;
- owned/not owned ;
- preview ;
- quantity ;
- place.

---

## UI-HOUSE-05 — Guild Hall

Réutilise les composants housing mais avec :

- permissions de guilde ;
- rangs ;
- communal storage ;
- trophées de guilde ;
- services éventuels.

---

# 27. Chat

## UI-CHAT-01 — Main Chat

Canaux possibles :

- Local
- Groupe
- Guilde
- Whisper
- Combat
- System

Fonctions :

- tabs ;
- timestamps ;
- mute channel ;
- clickable names ;
- links items ;
- scroll history ;
- unread markers.

Pas de retour aux anciennes bulles de chat Habbo comme système principal.

---

# 28. Notifications & system feedback

## UI-SYS-01 — Toasts

Catégories :

- info ;
- success ;
- warning ;
- danger ;
- loot ;
- achievement.

Limiter le spam et fusionner les événements répétitifs.

---

## UI-SYS-02 — Notification Center

Historique :

- loot rare ;
- XP ;
- reputation ;
- discovery ;
- skill learned ;
- achievement ;
- new mail ;
- guild/system event.

---

## UI-SYS-03 — Error Feedback

Une erreur gameplay ne doit pas ouvrir une grosse modale.

Préférer :

```text
Pas assez de mana
Hors portée
Cible invalide
Action impossible en combat
```

sous forme de feedback court près du HUD.

---

# 29. Main menu, settings & accessibility

## UI-SYSTEM-01 — ESC Menu

- Reprendre
- Paramètres
- Raccourcis
- Aide / Codex
- Signaler un problème
- Changer personnage
- Déconnexion

---

## UI-SYSTEM-02 — Settings

Onglets :

### Audio
- master
- music
- ambience
- effects
- voice if ever used

### Graphics
- quality preset
- resolution/render scale if relevant
- effects
- shadows
- particles
- damage numbers

### Interface
- UI scale
- names
- HP bars
- tooltips
- combat text
- quest tracker

### Notifications
- categories
- sounds
- banners

### Chat
- timestamps
- filters
- profanity options if exposed
- channel behavior

### Accessibility
- font size
- contrast
- colorblind alternatives
- screen shake
- flashing effects reduction
- hold/toggle options where useful

---

## UI-SYSTEM-03 — Keybinds

Groupes :

- movement
- combat
- action bars
- windows
- targeting
- social
- housing/editor

Actions globales minimum :

- Inventory
- Character
- Skills
- Map
- Quests
- Guild
- Friends
- Mounts
- Companion
- Bestiary
- Achievements
- Housing
- ESC

Détecter les conflits de touches.

---

## UI-SYSTEM-04 — Help / Codex

Catégories :

- stats ;
- combat ;
- roles ;
- buffs/debuffs ;
- items/rarity ;
- professions ;
- currencies ;
- social ;
- dungeons ;
- housing.

Doit être searchable.

---

## UI-SYSTEM-05 — Contextual Tutorial

- première ouverture ;
- petite bulle ciblée ;
- dismiss ;
- ne jamais bloquer inutilement ;
- accessible à nouveau via Codex.

---

## UI-SYSTEM-06 — Reconnect

États :

```text
Connexion instable
Reconnexion...
Tentative 2/5
Reconnecté
Échec de reconnexion
```

Si le joueur était :

- en groupe ;
- en donjon ;
- dans un event ;

le client doit expliquer l'état de restauration.

---

## UI-SYSTEM-07 — Loading Screen

Utilisée pour :

- entrée personnage ;
- téléportation ;
- dungeon/instance ;
- transitions lourdes.

Contenu possible :

- artwork ;
- zone ;
- tip ;
- progression seulement si réellement mesurable.

Ne jamais afficher une fausse progress bar aléatoire.

---

# 30. Reporting & moderation côté joueur

## UI-MOD-01 — Report Player

- joueur ;
- catégorie ;
- description ;
- message context si pertinent ;
- spam ;
- triche ;
- harcèlement ;
- nom/contenu inapproprié.

Confirmation :

```text
Signalement envoyé
```

Ne pas révéler les détails internes de traitement/modération.

---

# 31. Écrans transversaux obligatoires

Chaque grande fenêtre doit prévoir :

## Loading

```text
Skeleton / spinner / progress
```

## Empty

Exemple :

```text
Aucun ami pour le moment.
Rechercher un joueur
```

## Error

```text
Impossible de charger le marché.
[Réessayer]
```

## Offline / unavailable

```text
Service temporairement indisponible
```

## Locked

Toujours afficher la raison :

```text
Niveau 30 requis
Réputation Honoré requise
Terminez « Le Passage »
```

---

# 32. Drag & Drop

Le drag & drop doit avoir un langage global.

## Source

Pendant le drag :

- slot source atténué ;
- preview de l'item ;
- quantité visible.

## Destination valide

- highlight positif.

## Destination invalide

- highlight interdit ;
- raison tooltip si possible.

Concerne :

- inventory ;
- equipment ;
- bank ;
- trade ;
- action bar ;
- housing ;
- companion slots éventuels.

---

# 33. Tooltips

Ordre de priorité :

1. nom ;
2. type ;
3. fonction ;
4. chiffres ;
5. conditions ;
6. raccourci ;
7. lore.

Le tooltip ne doit jamais recouvrir systématiquement le contenu que l'utilisateur tente de comparer.

Prévoir placement automatique selon les bords de l'écran.

---

# 34. Notifications sonores

Ne pas jouer un son pour chaque micro-action.

Sons distinctifs uniquement pour :

- level-up ;
- achievement ;
- group found ;
- ready check ;
- rare loot ;
- mail important ;
- warning danger ;
- confirmation forte.

Tous désactivables selon catégorie si nécessaire.

---

# 35. Règles de cohérence des icônes

Une icône doit avoir :

- une silhouette lisible ;
- une taille standard ;
- une famille graphique homogène ;
- suffisamment de contraste ;
- pas de détails inutiles illisibles à petite taille.

Tailles de référence à prévoir :

```text
16x16   micro status
20/24   actions compactes
32/36   menus/features
48+     item/skill showcase selon fenêtre
```

Ne pas upscale une icône floue pour remplir un gros emplacement.

---

# 36. Rareté & qualité

La rareté ne doit pas reposer uniquement sur la couleur.

Utiliser combinaison :

- couleur ;
- border/frame ;
- label textuel ;
- éventuel petit symbole.

Ceci améliore aussi l'accessibilité.

---

# 37. Écrans à haute densité

Pour :

- Marketplace
- Guild roster
- Bestiary
- Achievements
- Crafting
- Inventory

Toujours prévoir :

- search ;
- filter ;
- sort ;
- persistent selection ;
- sensible empty states.

---

# 38. Ordre de priorité UI selon roadmap

## UI P0 — indispensable boucle de jeu

- HUD
- Target Frame
- Cast Bar
- Buff/Debuff
- Inventory
- Character
- Equipment
- Skills
- Quest Tracker
- Quest Journal
- NPC Dialogue
- World Map
- Death / Respawn
- Settings / Keybinds
- Reconnect

## UI P1 — boucle MMO complète

- Friends
- Whisper
- Player Context Menu
- Inspect
- Party
- Ready Check
- Guild
- Dungeon Browser
- Matchmaking
- Dungeon Results
- Vendor
- Bank
- Marketplace
- Trade

## UI P2 — progression / retention

- Achievements
- Titles
- Reputation
- Bestiary
- Calendar
- World Events
- Daily/Weekly
- Wallet
- Mail
- Mounts
- Companions

## UI P3 — différenciation

- Housing Browser
- Housing Management
- Decoration Mode
- Furniture Catalog
- Guild Hall
- advanced item upgrade flows

---

# 39. Template obligatoire pour toute nouvelle UI

Toute spec UI nouvelle doit suivre ce format :

```md
# UI-XXX — Nom

## But utilisateur
Que veut accomplir le joueur ?

## Point d'entrée
Raccourci / bouton / contexte.

## Contenu principal
Liste des informations.

## Actions primaires
Actions les plus importantes.

## Actions secondaires
Actions annexes.

## États
- default
- hover
- selected
- loading
- empty
- disabled
- error
- locked

## Tooltips
Informations requises.

## Modales
Confirmations éventuelles.

## Raccourcis
Touches associées.

## Network states
Que faire si request pending/error/reconnect ?

## Responsive/window behavior
Drag, resize, focus, close.

## Shared components
Composants du UI kit utilisés.

## Acceptance criteria
Critères testables.
```

---

# 40. Acceptance criteria UI génériques

Une UI n'est pas terminée tant que :

- [ ] tous les états principaux existent ;
- [ ] hover/pressed/focus sont visibles ;
- [ ] clavier fonctionne lorsque pertinent ;
- [ ] ESC fonctionne ;
- [ ] aucun bouton icône ambigu n'est sans tooltip ;
- [ ] loading state existe ;
- [ ] empty state existe ;
- [ ] error state existe ;
- [ ] disabled state explique pourquoi ;
- [ ] aucune information critique dépend uniquement de la couleur ;
- [ ] les textes longs ne cassent pas la fenêtre ;
- [ ] les nombres importants restent lisibles ;
- [ ] drag & drop montre destination valide/invalide ;
- [ ] les actions destructives demandent confirmation ;
- [ ] les appels réseau ne bloquent pas silencieusement l'UI ;
- [ ] les composants réutilisent les tokens et le UI Kit ;
- [ ] l'interface est cohérente avec les autres fenêtres Ambreia ;
- [ ] aucun pattern Habbo obsolète n'est réintroduit par facilité.

---

# 41. Règles spécifiques pour les agents IA

Lorsqu'une IA reçoit la tâche de créer/modifier une UI Ambreia :

1. **Ne pas inventer un nouveau style graphique.**
2. Réutiliser `WindowShell`, buttons, slots, tabs, tooltips et états existants.
3. Ne pas fusionner plusieurs grosses features dans une fenêtre géante.
4. Ne pas cacher une mécanique complexe derrière un simple bouton sans feedback.
5. Toujours implémenter au minimum : default, hover, selected, disabled, loading, empty et error.
6. Ne pas hardcoder des couleurs si un token existe.
7. Ne pas utiliser les anciens termes Habbo (`Navigator`, `HC`, `Respect`, etc.) pour une feature RPG neuve.
8. Ne pas recréer un ancien système legacy parce qu'un composant historique existe encore dans le repo.
9. Garder une séparation stricte entre UI, état de feature et réseau.
10. Si une mockup et cette bible divergent, documenter le conflit avant de choisir silencieusement.

---

# 42. Architecture UI recommandée

Chaque domaine devrait suivre approximativement :

```text
feature/
  contracts/
  state/
  services/
  ui/
    components/
    windows/
    overlays/
  adapters/
```

Une fenêtre ne devrait pas :

- parser directement un message réseau ;
- contenir la logique métier serveur ;
- connaître les détails du transport ;
- modifier directement un autre domaine.

Flux recommandé :

```text
Protocol/Event
    ↓
Feature service/state
    ↓
ViewModel / selector
    ↓
UI component
```

Et pour une action :

```text
UI Action
    ↓
Feature command/service
    ↓
Network / local state
    ↓
result
    ↓
UI feedback
```

---

# 43. Legacy UI — règle de migration

Lorsqu'une ancienne UI Habbo est rencontrée :

```text
Est-elle encore une feature produit Ambreia ?
        │
   ┌────┴────┐
   Non       Oui mais concept RPG différent
   │          │
 DELETE       REBUILD RPG
```

Ne pas faire :

```text
HabboWindow → rename → RPGWindow
```

si la sémantique est différente.

Exemples :

```text
Navigator Habbo      → DELETE
World Map            → NEW RPG UI
Housing Browser      → NEW RPG UI

Wardrobe Habbo       → DELETE
Equipment/Appearance → RPG UI

Avatar Effect inventory → DELETE
Status Effects HUD       → RPG UI
```

---

# 44. Carte fonctionnelle globale de l'UI

```text
AMBREIA UI
│
├── HUD
│   ├── Player status
│   ├── Target / target-of-target
│   ├── Action bars
│   ├── Buffs/debuffs
│   ├── Quest tracker
│   ├── Party
│   ├── World event
│   └── Context prompts
│
├── Character
│   ├── Overview
│   ├── Stats
│   ├── Equipment
│   ├── Titles
│   ├── Reputation
│   ├── Achievements
│   └── Inspection
│
├── Progression
│   ├── Skills
│   ├── Talents
│   ├── Level up
│   ├── Bestiary
│   └── Collection
│
├── Inventory & Economy
│   ├── Inventory
│   ├── Wallet
│   ├── Vendor
│   ├── Bank
│   ├── Marketplace
│   ├── Trade
│   ├── Mail
│   └── Blacksmith
│
├── World
│   ├── World map
│   ├── Fast travel
│   ├── NPC dialogue
│   ├── Zone discovery
│   ├── Gathering
│   └── Events
│
├── Quests
│   ├── Journal
│   ├── Tracker
│   ├── Accept
│   └── Reward
│
├── Social
│   ├── Friends
│   ├── Whisper
│   ├── Party
│   ├── Guild
│   ├── Search
│   ├── Context menu
│   └── Report
│
├── Instances
│   ├── Dungeon browser
│   ├── Queue
│   ├── Ready check
│   ├── Objectives
│   ├── Results
│   └── Boss journal
│
├── Collections
│   ├── Mounts
│   ├── Companions
│   ├── Achievements
│   └── Badges
│
├── Housing
│   ├── Browser
│   ├── Management
│   ├── Decoration
│   ├── Catalog
│   └── Guild Hall
│
└── System
    ├── ESC
    ├── Settings
    ├── Keybinds
    ├── Codex
    ├── Tutorial
    ├── Notifications
    ├── Loading
    └── Reconnect
```

---

# 45. Définition finale d'une UI Ambreia réussie

Une belle UI Ambreia n'est pas seulement une jolie fenêtre.

Elle doit donner au joueur :

- la bonne information ;
- au bon moment ;
- avec la bonne importance ;
- sans bruit inutile ;
- avec un feedback immédiat ;
- tout en restant visuellement identifiable comme faisant partie du même jeu.

Le résultat cible est :

> **un MMORPG dense et complet, mais dont chaque système semble appartenir à la même interface et au même univers.**

Cette bible devient la référence pour toutes les futures mockups et implémentations UI d'Ambreia.
