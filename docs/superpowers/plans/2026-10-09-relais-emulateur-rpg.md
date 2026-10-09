# Relais émulateur → client : rattraper Objets, Interaction et Chat (2026-10-09)

L'émulateur (`../vortex-rpg-emulator`, `main` à `ac6eab2f2`) a livré et prouvé en direct trois lots
que le client ne consomme pas encore. Les contrats font foi dans les specs de l'émulateur ; cette
note dit seulement quoi faire, dans quel ordre, et comment le prouver.

| Lot | Contrat (source de vérité) | Client aujourd'hui |
|---|---|---|
| F3a personnages | `vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md` §6 | fait (`features/character`) |
| F2 Objets | `…/specs/2026-10-08-rpg-items-design.md` **§17** | fait (`rpg-character` : 96d00598, 6b1fb4d1) |
| F3b Interaction | `…/specs/2026-10-09-rpg-interaction-design.md` **§7** (§7.3 = côté client) | fait (`rpg-character` : 3f705caa, 9afe1f1c, bcec2224) |
| F3c Chat | `…/specs/2026-10-09-rpg-chat-design.md` **§10** (§10.3 = côté client) | fait (`rpg-character` : d932b3c9, 62ca4e04) |

## 0. Avant tout

1. Fermer le chantier en cours (≈ 126 fichiers non commités, « fusion des révisions de
   production ») : le commiter ou l'abandonner. On ne démarre pas un lot sur un arbre ouvert.
2. `pnpm gen:headers` : `Headers.generated.ts` n'a que 9000–9005 ; l'émulateur déclare jusqu'à
   9011 en entrée et 9011 en sortie.

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

## 3. Chat — fenêtre à onglets du HUD, plus de bulles (spec F3c §10.3)

| Sens | Id | Message | Champs |
|---|---|---|---|
| → | 9011 | `RpgChatSend` | channel (chaîne), target (chaîne : un nom pour `whisper`, vide sinon), text (chaîne) |
| ← | 9010 | `RpgChatMessage` | channel, senderId (0 pour `system`), senderName, text (liens `[item:…]` compris), sentAt (secondes Unix UTC), target (pour `whisper` : l'autre joueur de la conversation) |
| ← | 9011 | `RpgChatResult` | channel, code |

- **Plus de bulles** : le chat Habbo de la room (`Chat`, `Shout`, `Whisper`) ne revient pas ;
  retirer les bulles au-dessus des avatars.
- **Canaux** (chaînes, sensibles à la casse) : `general` (la zone), `world` (tout le monde en jeu),
  `whisper` (un joueur nommé), `system` (serveur seulement, jamais envoyé par le client), `group`
  et `guild` (prêts mais inactifs : le serveur répond `not_in_group` / `not_in_guild`).
- **Onglets** : « Général », « Groupe », « Guilde » par défaut ; « + » ouvre un onglet (un privé
  avec un joueur, le Monde, un filtre). Un clic sur un nom ouvre l'onglet privé de ce joueur ;
  écrire dedans envoie `whisper` avec son nom. Un privé reçu se range par `target` (le même champ
  sert pour la copie de l'émetteur et pour le message reçu).
- **Une ligne** : `[hh:mm]` (heure locale de `sentAt`), `[Canal]` traduit et coloré, le nom, le
  texte. Un lien `[item:<id>]` s'affiche `[<id>.name traduit]` (coloré par la rareté si on veut).
  Un message `system` peut être une clé de traduction : la traduire si c'en est une.
- **Pas de réponse en cas de succès** : la ligne revient par son canal (l'émetteur est dans la zone,
  le monde, ou reçoit sa copie du privé). Ne rien afficher de façon optimiste.
- **Codes de `RpgChatResult`** à traduire, affichés dans l'onglet actif : `empty`, `too_long`,
  `rate_limited`, `not_in_zone`, `player_not_found`, `player_offline`, `not_in_group`,
  `not_in_guild`, `unknown_channel`, `refused`.
- **Limites** : 200 caractères (le serveur refuse au-delà, il ne coupe pas) ; 1 message/s en
  Général et en privé, 1 toutes les 10 s en Monde ; au plus 5 liens.

## 4. Prouver contre l'émulateur

L'émulateur de la session serveur tourne à côté du tien (le tien sur 40000). Côté émulateur,
`node .claude/skills/run-vortex-emulator/driver.mjs <commande>` sert de référence de ce que le
serveur envoie :
- `items` : attribue une épée et un anneau au premier personnage du compte jetable
  (`POST /api/admin/characters/{id}/items`), puis équipe/déséquipe sur le socket. Pour remplir le
  Sac d'un compte de test du client, c'est la même route admin.
- `travel` : `RpgZoneInteractives` à l'entrée de `proof_a` (`1:door, 2:sign, 3:door`, le trône 4
  est figé).
- `target` : deux comptes dans une zone, choix de cible puis `RpgTarget(0)` au départ de la cible.
- `chat` : deux comptes ; Général dans la zone, Monde hors de la room, privé par le nom (en
  majuscules) avec sa copie, `not_in_zone`, `not_in_guild`, un lien d'objet inventé retiré,
  `rate_limited`, `player_not_found`, `player_offline`.

Fini = le Sac affiche ce que `items` a attribué, un équipement change les stats de la fenêtre
Personnage, un clic sur un avatar affiche sa cible et le décor non listé ne réagit plus, et deux
clients se parlent en Général, en Monde et en privé dans la fenêtre de chat, sans bulle.
