# Relais émulateur → client : rattraper Objets et Interaction (2026-10-09)

L'émulateur (`../vortex-rpg-emulator`, `main` à `39cf77eee`) a livré et prouvé en direct deux lots
que le client ne consomme pas encore. Les contrats font foi dans les specs de l'émulateur ; cette
note dit seulement quoi faire, dans quel ordre, et comment le prouver.

| Lot | Contrat (source de vérité) | Client aujourd'hui |
|---|---|---|
| F3a personnages | `vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md` §6 | fait (`features/character`) |
| F2 Objets | `…/specs/2026-10-08-rpg-items-design.md` **§17** | rien |
| F3b Interaction | `…/specs/2026-10-09-rpg-interaction-design.md` **§7** (§7.3 = côté client) | rien |

## 0. Avant tout

1. Fermer le chantier en cours (≈ 126 fichiers non commités, « fusion des révisions de
   production ») : le commiter ou l'abandonner. On ne démarre pas un lot sur un arbre ouvert.
2. `pnpm gen:headers` : `Headers.generated.ts` n'a que 9000–9005 ; l'émulateur déclare jusqu'à
   9010 en entrée et 9009 en sortie.

## 1. Objets — fenêtre Sac (I) et onglet Équipement (fenêtre Personnage, C)

Paquets (détail des champs : spec Objets §17) :

| Sens | Id | Message | Champs |
|---|---|---|---|
| → | 9004 | `RpgItemMove` | from, to |
| → | 9005 | `RpgItemSplit` | from, quantity, to |
| → | 9006 | `RpgItemEquip` | bagSlot |
| → | 9007 | `RpgItemUnequip` | equipmentSlot (0–9) |
| → | 9008 | `RpgItemDestroy` | bagSlot, quantity |
| → | 9009 | `RpgItemClaimParcel` | parcel |
| ← | 9006 | `RpgInventory` | bagSize, maxParcels, count × (itemId, definitionId, quantity, durability −1 = inusable, bound, container 0 sac / 1 équipement / 2 colis, slot) |
| ← | 9007 | `RpgItemResult` | action (1–6), code |

Règles qui piègent :
- `RpgInventory` **remplace tout** l'état ; il arrive aussi sans action du joueur (attribution
  serveur). Ne jamais appliquer d'optimisme local : attendre le résultat puis l'inventaire.
- Équiper/déséquiper envoie `RpgCharacterStats` avant `RpgItemResult` : la fenêtre Personnage
  doit déjà l'écouter (F3a).
- Codes à traduire : `ok`, `not_found`, `bag_full`, `slot_occupied`, `wrong_class`,
  `level_too_low`, `not_equipment`, `invalid_quantity`, `failed`.
- Emplacements : 0 tête, 1 torse, 2 jambes, 3 pieds, 4 mains, 5 arme, 6 main secondaire, 7 cou,
  8 anneau 1, 9 anneau 2.
- Nom et description : textes `<definitionId>.name` / `.description`
  (`/api/public/content/texts/{langue}`). Pas d'icône en V1 : on affiche le nom.

## 2. Interaction — décor figé, objets cliquables, cible (spec F3b §7.3)

| Sens | Id | Message | Champs |
|---|---|---|---|
| → | 9010 | `RpgTargetSelect` | objectId (0 = vider) |
| ← | 9008 | `RpgZoneInteractives` | count × (objectId, interaction : `door`, `lever`, `sign`, `teleport`, `sit`, `use`, `interact`) |
| ← | 9009 | `RpgTarget` | objectId (0 = aucune), kind (`player` ou vide), name, level, classId |

- Clic sur un objet listé par `RpgZoneInteractives` → `UseFurniture` comme aujourd'hui ; clic sur
  tout autre décor → rien, et plus d'infobulle Habbo. Curseur « cliquable » sur les objets listés.
- Clic sur un avatar → `RpgTargetSelect(objectId de Users)` ; clic dans le vide ou Échap →
  `RpgTargetSelect(0)`.
- HUD : cadre de cible (nom, niveau, classe traduite) et cercle sous l'avatar visé, tant que
  `RpgTarget` ne l'a pas vidé (le serveur envoie `RpgTarget(0)` quand la cible quitte la room).

## 3. Prouver contre l'émulateur

L'émulateur de la session serveur tourne à côté du tien (le tien sur 40000). Côté émulateur,
`node .claude/skills/run-vortex-emulator/driver.mjs <commande>` sert de référence de ce que le
serveur envoie :
- `items` : attribue une épée et un anneau au premier personnage du compte jetable
  (`POST /api/admin/characters/{id}/items`), puis équipe/déséquipe sur le socket. Pour remplir le
  Sac d'un compte de test du client, c'est la même route admin.
- `travel` : `RpgZoneInteractives` à l'entrée de `proof_a` (`1:door, 2:sign, 3:door`, le trône 4
  est figé).
- `target` : deux comptes dans une zone, choix de cible puis `RpgTarget(0)` au départ de la cible.

Fini = le Sac affiche ce que `items` a attribué, un équipement change les stats de la fenêtre
Personnage, un clic sur un avatar affiche sa cible et le décor non listé ne réagit plus.
