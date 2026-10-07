# Packs `.ambreia` (vêtements, mobis) — plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal :** un fichier `.ambreia` par famille (`clothing.ambreia`, `furniture.ambreia`) remplace des milliers de `.nitro`. Il est plus petit, sans perte, et le client y lit une pièce à la fois par requête Range.

**Mesures (2026-10-08, scripts jetables, lecture seule) :**

| Famille | Aujourd'hui | Mesuré |
|---|---|---|
| Vêtements (`Desktop/clothing`, 5 538 `.nitro`) | 70,2 Mo | ≈ 18,7 Mo |
| Mobis (`vortex-assets/dcr/hof_furni`, 75 722 `.nitro`) | 1 867 Mo | ≈ 513 Mo |

- **Images.** On passe en WebP sans perte : −72 à −74 %. Chaque image est vérifiée, avec l'alpha identique partout et la couleur identique sur tout pixel visible. Les doublons sont supprimés.
- **Manifestes.** Un encodage compact exactement réversible (aller-retour vérifié sur 100 %), puis deflate.

**Architecture :**
- `@ambreia/common/assets/pack/` : le format, le codec des manifestes, le lecteur par Range et le registre des montages.
- `NitroBundleLoader` : quand une URL `.nitro` tombe dans un dossier remplacé par un pack, et que le nom y est, il lit le pack. Sinon, il garde le chemin actuel.
- L'outil de build (`vortex-client/tools/build-asset-pack.ts`, `sharp`) écrit le pack et un rapport.
- La feature `asset-packs` (dans `@ambreia/game`) monte les packs une fois la configuration chargée, avant le moteur d'avatar.

## Format v1

```
0   "AMBR"             magic
4   u16 version = 1, u16 flags = 0          (big-endian partout)
8   u32 indexLength    longueur de la zone qui suit (index + dictionnaire)
12  u32 indexDeflated  octets de l'index compressé (deflate-raw)
16  index (deflate-raw de JSON)
..  u32 dictLength, dictionnaire deflate (≤ 32 Ko, brut)
..  données : pour chaque pièce, son manifeste (deflate-raw avec le dictionnaire), puis ses images
    qui n'ont pas encore été écrites (WebP, ou PNG gardé tel quel si la vérification échoue)
```

L'index, après décompression, est un JSON :

```
{ v: 1, kind, dataStart, items: { <nom>: [manifestOffset, manifestLength, [[entryName, imageIndex], …]] },
  images: [[offset, length, "webp" | "png"], …] }
```

Les offsets sont relatifs à `dataStart`. Une pièce dont les images suivent son manifeste se lit en une seule requête Range.

## Décisions

- **D1 — Requête Range.** Si le serveur répond 200 au lieu de 206, le pack est marqué inutilisable et le client revient aux `.nitro`. On ne télécharge jamais 500 Mo par accident.
- **D2 — Index.** Il est lu à la première pièce demandée : un Range sur l'en-tête, puis un sur l'index. Ensuite, il est gardé en mémoire.
- **D3 — Pièce absente du pack** ou pack illisible : on revient au `.nitro`, avec un avertissement unique.
- **D4 — Fichiers cassés** (pages HTML, bundles illisibles) : l'outil les saute et les liste dans le rapport.
- **D5 — Hors v1 :** blocs Range alignés pour un CDN, cache persistant (Cache API), dictionnaire entraîné. Ils seront mesurés après.

## Tâches

- [ ] **T1 — `@ambreia/common/assets/pack`.**
  - Contenu :
    - `ManifestCodec` (encode/decode exacts) ;
    - `AssetPackFormat` (écrire l'en-tête et l'index, les relire) ;
    - `AssetPack` (lecteur Range) ;
    - `AssetPacks` (montages préfixe → pack).
  - Tests :
    - aller-retour du codec ;
    - pack écrit puis relu avec un `fetch` factice qui sert des Range ;
    - serveur sans Range : pack refusé ;
    - pièce absente : `null` ;
    - préfixe et nom tirés de l'URL.
- [ ] **T2 — `NitroBundleLoader`.**
  - Il lit le pack quand il y est monté, et décode `.webp` comme `.png`.
  - Test : un chargement d'une URL montée ne touche pas l'URL `.nitro`.
- [ ] **T3 — Outil de build.**
  - Fonctionnement :
    - lit un dossier de `.nitro` ;
    - convertit les images avec vérification au pixel ;
    - dédoublonne ;
    - entraîne un dictionnaire simple ;
    - écrit le pack en flux, sans tout garder en mémoire ;
    - écrit un rapport JSON.
  - Packs à produire : vêtements, mobis, et `gordon` (les bibliothèques d'avatar que le client charge au démarrage, pour la vérification en direct).
- [ ] **T4 — Feature `asset-packs`.**
  - Config `{clothing?, furniture?}` : des URL, `${…}` interpolé par la configuration.
  - Elle monte les packs sur `flash.dynamic.avatar.download.url` et `flash.dynamic.download.url`.
  - Vérification en direct : le démarrage charge les bibliothèques d'avatar par le pack (requêtes réseau, aucun `.nitro`), et le bac à sable iso affiche une room identique, mobis lus dans le pack.
- [ ] **T5 — Documentation, revue finale, fusion.**
