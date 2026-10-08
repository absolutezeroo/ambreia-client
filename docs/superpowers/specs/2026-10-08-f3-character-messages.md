# F3 — premiers messages RPG : le personnage

> **Statut :** proposition, à valider par le propriétaire · **Date :** 2026-10-08 · **Langue :** français
> **Dépôts :** `vortex-rpg-emulator` (serveur, autorité des en-têtes) et `vortex-rpg-client` (HUD).
> **Ancrage :** spec unifiée §3.7 (réseau RPG, ids ≥ 9000, instantané puis deltas) et §16.3 (HUD) ;
> spec Personnage §5 (XP), §6 (stats), §11 (events).

## 1. But

Le HUD du client (feature `hud`, sur `master` depuis le 2026-10-08) affiche aujourd'hui le niveau, l'XP et les barres de PV et de mana à partir d'une démo. Ces messages lui donnent les vraies valeurs du personnage.

**Hors de ce lot :**
- les PV et le mana *courants* (runtime de combat, M1) ;
- la barre d'action et les compétences (spec Combat).

## 2. Messages (serveur → client)

Plage RPG à partir de 9000 (§3.7). Les en-têtes sont générés côté client depuis `Headers.cs` (`pnpm gen:headers`). Les numéros ci-dessous sont indicatifs : c'est le serveur qui les fixe.

Le format réseau Habbo ne transporte que des entiers, des chaînes et des booléens. Le critique et l'esquive passent donc en **pour mille** : 52 = 5,2 %.

### 2.1 `RpgCharacterSnapshotComposer` (~9000) — instantané

Envoyé **à l'entrée en zone et à la reconnexion**.

| Champ | Type | Source serveur |
|---|---|---|
| `classId` | string | id de contenu (`class.warrior`, `class.classless`) |
| `specializationId` | string | `""` si aucune |
| `level` | int | `PlayerCharacter.Level` |
| `maxLevel` | int | `progression.maxLevel` |
| `xp` | int | XP **dans le niveau en cours** (`PlayerCharacter.Xp`) |
| `xpToNext` | int | `progression.xpToNext[level − 1]`, ou 0 au niveau max |
| `strength`, `intelligence`, `agility` | int ×3 | `CharacterStatsSnapshot` |
| `maxHealth`, `maxMana`, `armor` | int ×3 | idem |
| `critPermille`, `dodgePermille` | int ×2 | `round(CritPercent × 10)`, `round(DodgePercent × 10)` |
| `speedPercent`, `power` | int ×2 | idem |

### 2.2 `RpgCharacterXpComposer` (~9001) — XP

Envoyé sur `XpGained`, après les éventuels `LevelUp`.

| Champ | Type |
|---|---|
| `gained` | int (après bonus et plafond) |
| `level` | int |
| `xp` | int |
| `xpToNext` | int |

### 2.3 `RpgCharacterLevelUpComposer` (~9002) — montée de niveau

Un message par niveau passé, sur `LevelUp`, avant l'XP.

| Champ | Type |
|---|---|
| `oldLevel` | int |
| `newLevel` | int |

### 2.4 `RpgCharacterStatsComposer` (~9003) — stats

Envoyé sur `CharacterStatsChanged` (niveau, équipement, contenu). Il contient les 10 stats, dans le même ordre que l'instantané (§2.1).

**Ordre d'un gain d'XP qui fait monter de niveau :** `LevelUp` (un par niveau), puis `Xp`, puis `Stats`.

## 3. Client

- **`@ambreia/protocol`.** Pour chaque message : une classe de message pure, un `IIncomingParser`, et l'en-tête dans `NewStyleHeaders.incoming`.
- **`@ambreia/game`.** La feature `character` installe la `MessageMap` sur la connexion. Ses handlers mettent à jour l'état du personnage :
  - `level`, `xp` et `xpToNext` vont dans `PlayerHudState` ;
  - `hpMax` et `manaMax` y vont aussi ;
  - `hp` et `mana` prennent la valeur max tant que M1 n'existe pas.
- **Évènement client.** La montée de niveau émet `CharacterLevelUp`, pour la future alerte du HUD (`vortex_hud_alert_xml`).
- **Tests :**
  - chaque parser lit les champs dans l'ordre du serializer ;
  - un instantané remplit le HUD ;
  - la séquence niveau → XP → stats laisse le HUD cohérent.

## 4. Décisions à prendre

1. **Numéros d'en-tête** : par le serveur.
2. **PV et mana courants avant M1** : le client affiche le max. Un vrai message `RpgCharacterVitals` arrivera avec M1.
3. **Nom de la classe affiché** : les textes de contenu (`rpg_content_texts`) ne sont pas encore servis au client. Pour l'instant, l'id sert de clé de traduction (`${class.warrior}`).
