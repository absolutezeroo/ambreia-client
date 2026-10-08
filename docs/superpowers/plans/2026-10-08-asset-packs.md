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

## Révision (2026-10-08) : un fichier par pièce, pas un gros pack

Le propriétaire a choisi un fichier par pièce après la mesure du pack.
- **D'où vient le gain.** Les −72 % viennent de la conversion (WebP sans perte, manifestes compacts, doublons), pas du regroupement.
- **Ce que le gros pack ne fait pas.** Il n'ôte aucune requête : une plage par pièce, comme un fichier par pièce.
- **Ce que le gros pack coûte :**
  - une mise à jour reconstruit et redéploie 491 Mo ;
  - le navigateur et le CDN cachent mal des plages ;
  - le premier accès lit un index (1,65 Mo avant le découpage) ;
  - le serveur doit gérer les requêtes Range.

**Format (dossier `.ambreia` d'une famille) :**

```
<dir>/ambreia.json             { v, kind, dictionary: "<id>" } — lu une fois ; absent → retour aux .nitro
<dir>/dictionary/<id>.bin      dictionnaire deflate des manifestes (lu une fois)
<dir>/<nom>.ambreia            une pièce : "AMBP", u16 version, u16 flags, 8 octets id du dictionnaire,
                               u32 + manifeste (deflate-raw avec le dictionnaire), u16 nombre d'images, puis par image :
                               u8 flags (1 = nom ≠ <nom>.png, 2 = PNG gardé, 4 = image partagée),
                               [u16 + nom], puis u32 + octets (image propre) ou 20 octets sha1 (image partagée)
<dir>/images/<sha1>.webp|png   une image utilisée par plusieurs pièces, stockée une fois
```

- **Image partagée** = utilisée par au moins deux pièces au moment du build. Sinon, elle est dans la pièce : une seule requête.
- **Build incrémental :**
  - une pièce plus récente que son `.nitro` est gardée ;
  - le dictionnaire existant est réutilisé, et seul `--force` en crée un nouveau ;
  - une image déjà présente dans `images/` est référencée.
- **Repli.** `ambreia.json` absent : le dossier est ignoré et tout passe par les `.nitro`. Pièce absente (404) : son `.nitro`.
- **Le gros pack et ses requêtes Range sont retirés du code.** Le codec des manifestes, la conversion vérifiée, le montage et la feature restent.

## Protection (2026-10-08) : chiffrement et noms opaques (choix 1 et 3 du propriétaire)

- **Clé maîtresse.** 32 octets aléatoires, dans un fichier de clé hors du dossier servi (`--key-file`).
- **Dérivation par HKDF-SHA256** (WebCrypto, identique dans Node et dans le navigateur) :
  - une clé AES-256-GCM par fichier ;
  - une clé HMAC pour les noms ;
  - un identifiant de clé.
- **Fichier chiffré :** `iv (12 octets) ‖ texte chiffré ‖ tag`. Les données associées sont le chemin logique (`piece/<nom>`, `image/<sha1>`, `dictionary/<id>`) : un fichier servi sous le nom d'un autre ne se déchiffre pas.
- **Noms opaques :** `hex(HMAC(nom logique))[0..32]`. Fichiers obtenus :
  - `<h>.ambreia` (pièces) ;
  - `images/<h>.bin` ;
  - `dictionary/<h>.bin`.

  Sans la clé, on ne sait pas quoi demander.
- **`ambreia.json` reste en clair** : `{ v, kind, dictionary, encrypted, keyId }`. Il ne contient aucun secret.
- **Repli.** Un dossier chiffré sans clé, ou avec la mauvaise (`keyId`), est ignoré : retour aux `.nitro`, avec un avertissement unique.
- **Livraison de la clé, provisoire :** `config.json` → `asset-packs.key`. Ce fichier est public : le chiffrement n'y arrête que l'ouverture directe d'une URL et l'énumération. La vraie protection demande une clé envoyée par le serveur après connexion (point 2, non retenu pour l'instant).
