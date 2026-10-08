# Bilan — `.ambreia` (vêtements, mobis) (2026-10-08)

Plan : `2026-10-08-asset-packs.md` (avec ses deux révisions). Branche `asset-packs`, partie de `master` c2dcff63.

## Ce qui existe

- **`@ambreia/common/assets/pack/`** :
  - `ManifestCodec` : manifeste compact, exactement réversible ;
  - `AmbreiaPiece` : format d'une pièce ;
  - `AmbreiaLayout` : en clair ou chiffré, AES-256-GCM et noms HMAC par WebCrypto ;
  - `AmbreiaDirectory` : lecteur d'un dossier ;
  - `AssetPacks` : montage d'un dossier `.ambreia` à la place d'un dossier de `.nitro`.
- **`NitroBundleLoader`** lit une pièce montée et décode le WebP. Si la pièce manque, ou si le dossier est illisible ou sans la bonne clé, il charge le `.nitro` comme avant.
- **Feature `asset-packs`** : `config.json` → `asset-packs.{clothing, furniture, key}`. Elle est montée une fois la configuration chargée, avant le moteur d'avatar.
- **Outil `pnpm --filter vortex-client build:ambreia <dossier .nitro> <dossier sortie> [--key-file=…]`** :
  - incrémental, et il reprend après un arrêt ;
  - images partagées stockées une fois ;
  - vérifications : WebP sans perte comparé au pixel, manifeste relu, relecture complète par le lecteur du client ;
  - bundles illisibles listés dans `report.json`.

## Mesures

| Famille | `.nitro` | `.ambreia` chiffré | Pièces | Illisibles |
|---|---|---|---|---|
| Vêtements (`Desktop/clothing`) | 70,2 Mo | 21,4 Mo (−69,6 %) | 5 531 | 7 |
| Mobis (`dcr/hof_furni`) | 1 866,8 Mo | 494,1 Mo (−73,5 %) | 75 432, dont 3 979 images partagées | 290, dont 287 pages HTML |

- **Room du bac à sable** (`?pack=1&key=…`) :
  - identique au pixel près : 0 valeur différente sur 4 096 000 ;
  - aucun `.nitro` demandé ;
  - 9 requêtes aux noms opaques, 46 Ko dont 32 Ko de dictionnaire lu une fois par session, contre 6 requêtes et 36 Ko en `.nitro`.
- **Avatars** (12 rendus, `@ambreia/avatar` dans Node) :
  - les 36 bibliothèques de vêtements viennent du dossier chiffré ;
  - 4 rendus sont identiques ;
  - ailleurs, l'écart affiché va jusqu'à 1,44/255 (1/255 sur les pixels opaques).

  Les octets sont identiques. Ce sont Skia et les navigateurs qui prémultiplient l'alpha d'un PNG et d'un WebP avec des arrondis différents, sur les seuls pixels semi-transparents : mesuré dans Node et dans Edge.
- **Tests :** `pnpm check` donne 103 pass et 4 skipped. Les tests couvrent :
  - le codec ;
  - le format ;
  - l'image partagée lue une fois ;
  - le dictionnaire lu une fois ;
  - la pièce absente ;
  - le dossier sans descripteur ;
  - un autre dictionnaire ;
  - le chiffrement : relecture, bruit, refus sans clé ou avec une autre clé, fichier échangé ;
  - le chargeur : pack, ou repli sur le `.nitro` ;
  - la feature : montage, rien sans config, clé mal formée.

## Parcours

1. **Un gros pack lu par requêtes Range.** Il a d'abord été construit, puis mesuré : son index de 1,65 Mo était lu en entier au premier mobi. Il a été découpé en shards.
2. **Abandon pour un fichier par pièce,** au choix du propriétaire. Le gain vient de la conversion, pas du regroupement. Le pack n'ôtait aucune requête, coûtait une reconstruction de 491 Mo à chaque mise à jour, cachait mal ses plages et exigeait les requêtes Range.
3. **Chiffrement et noms opaques** (choix 1 et 3 du propriétaire).

## Non vérifié, et limites

- **Le vrai client avec une session.** Sans connexion, il ne charge aucun vêtement ni mobi. Les chemins sont vérifiés dans le bac à sable iso (mobis) et par `@ambreia/avatar` (vêtements), avec le même chargeur.
- **La clé est dans `config.json`,** qui est public. Le chiffrement arrête l'ouverture directe d'une URL et la devinette des noms, pas quelqu'un qui lit la config. La vraie protection demande une clé envoyée par l'émulateur après connexion (point 2 de la discussion, non retenu).
- **Les effets d'avatar** (`Dance1`…) ne sont pas dans le dossier des vêtements : 404, puis leur `.nitro`.
- **À reprendre plus tard :**
  - cache persistant (Cache API) ;
  - réglage `--max` pour la livraison (environ −3 %) ;
  - taille du dictionnaire (32 Ko à la première room) ;
  - JPEG XL quand Chrome le lira.
