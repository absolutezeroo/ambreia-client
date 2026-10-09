# Tout en `.ambreia` — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** les cinq familles d'assets (`clothing`, `effects`, `room`, `pets`, `furniture`) sont servies en
`.ambreia`, reconstruites par une seule commande, et plus aucun `.nitro` n'est lu, ni par le client, ni
par l'imager, ni par la sandbox, ni par le map editor.

**Architecture :**
- `@ambreia/common` ouvre un `AmbreiaDirectory` par famille (`openAssetDirectories`).
- `AssetLibrary.loadPiece(name, directory)` charge une pièce par un `AmbreiaPieceLoader`.
- Chaque chargeur reçoit son dossier :
  - l'avatar : clothing et effects ;
  - `RoomContentLoader` : furniture, pets et room.
- Les icônes de mobi sont le rendu du mobi à la taille 1 (assets `_icon_`). Côté outils, elles passent
  par l'imager (`size=icon`).
- L'ancien chemin (`NitroBundleLoader`, `AssetPacks`, clés `flash.dynamic.*`) n'est retiré qu'à la
  tâche 9, une fois tous les appelants passés. Chaque tâche laisse donc `pnpm check` vert.

**Tech Stack :** TypeScript, PixiJS v8, node:test + tsx, `sharp` (build), WebCrypto (AES-GCM/HKDF).

**Spec :** `docs/superpowers/specs/2026-10-09-ambreia-everything-design.md`, à lire avant de commencer.

## Global Constraints

- **Travailler dans un worktree.** Le propriétaire a du travail non commité dans `RoomEngine.ts`,
  `IsoBackdrop.ts` et d'autres fichiers. Exécuter le plan dans un worktree tiré de `HEAD`
  (superpowers:using-git-worktrees), branche `ambreia-everything`.
- **Commits.** Toujours par chemin : `git commit -m "…" -- <paths>`, jamais un `git commit` nu.
  Messages en français, comme l'historique (`assets : …`).
- **Hook pre-commit en échec (2026-10-09).** `Headers.generated.ts` diverge de l'émulateur (passé à
  9011). Le propriétaire a dit de **ne pas y toucher**. Avant le premier commit, si le hook échoue
  encore, s'arrêter et demander au propriétaire. Jamais `--no-verify`.
- **Clé maître.** `C:/laragon/ambreia.key` (keyId `bbc7431f45afa9ae`). Elle ne va jamais dans le repo
  ni dans un dossier servi. `config.json` (ignoré par git) porte la même clé en base64url dans
  `asset-packs.key`.
- **Couches.** Les engines (`common`, `avatar`, `iso`) n'importent ni `kernel`, ni `protocol`, ni
  `game`. `AmbreiaDirectory` vit dans `@ambreia/common`, donc l'avatar et l'iso peuvent le recevoir.
- **Code hérité.** On garde les lignes `// AS3:` des membres modifiés. Un membre qui change de
  comportement prend `// DEVIATION: …`. `dispose()` reste la dernière méthode de la classe.
- **Logs.**
  - pièce absente → `warn` une fois par pièce ;
  - dossier illisible → `error` une fois par dossier ;
  - jamais de log par frame.
- **Rien n'est supprimé sur le disque** (`www`, Bureau, sources) sans l'accord explicite du propriétaire
  sur la liste exacte (tâche 11).

## Review Focus

1. **Dev ouvert par une IP du réseau local en http.** WebCrypto manque : chaque famille doit écrire un
   `error` lisible, une fois, et rien ne doit planter ni boucler. → Test « clé inutilisable » (tâche 3).
2. **Pièce absente d'une famille** (les 498 libs, les 23 effets connus). Le chargeur émet `ERROR` sans
   retry : pas de 3 requêtes pour un 404. → Test « pièce absente, une seule requête » (tâche 3).
3. **Bundle de salle absent** (`HabboRoomContent`, `TileCursor`…). Le client doit le dire en `error`,
   pas rester bloqué en silence. Le build sort en erreur en amont. → Test « manque bloquant » (tâche 2).
4. **Une entrée `asset-packs` absente de `config.json`.** Erreur au boot qui nomme la famille. → Test
   « famille manquante » (tâche 6).
5. **Mobi à variante de couleur (`sofa_silo*2`).** L'icône rendue à la taille 1 doit porter la couleur
   de la variante. → Vérification manuelle `size=icon&class=…*2` (tâche 1) et capture (tâche 10).

---

### Task 1: L'imager rend un mobi en taille icône (`size=icon`)

Cette tâche valide d'abord l'hypothèse de la spec : la visualisation des mobis sait se rendre à la
taille 1. Elle livre ensuite la route que le map editor utilisera. Elle tourne encore sur les `.nitro`
actuels.

**Files :**
- Modify : `packages/vortex-imager/src/room/FurnitureRequest.ts` (le `SIZE_MAP`, ligne ~138)
- Test : `packages/vortex-imager/test/furniture-request.test.ts` (à créer)

**Interfaces :**
- Produit : `GET /habbo-imaging/furniture?class=<classe>&size=icon` → PNG du mobi à la taille 1.
  C'est la route `/furniture-icon` de la spec, en paramètre de la route existante plutôt qu'en
  route à part.

- [ ] **Step 1 : écrire le test qui échoue**

```ts
// packages/vortex-imager/test/furniture-request.test.ts
// size=icon renders a furni at scale 1, where its visualization draws the `_icon_` assets.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseFurnitureRequest} from '../src/room/FurnitureRequest';

const resolve = (): {type: string; category: number; colorIndex: number} => ({type: 'sofa_silo', category: 10, colorIndex: 2});

test('size=icon builds the request at scale 1, not zoomed', () =>
{
    const request = parseFurnitureRequest({class: 'sofa_silo*2', size: 'icon'}, resolve);

    assert.equal(request.scale, 1);
    assert.equal(request.zoom, 1);
    assert.equal(request.colorIndex, 2);
});

test('an unknown size still falls back to m', () =>
{
    assert.equal(parseFurnitureRequest({class: 'sofa_silo', size: 'huge'}, resolve).scale, 64);
});
```

Vérifier d'abord le type de `ImagerQuery` en tête de `FurnitureRequest.ts`. S'il n'accepte pas un objet
littéral, construire la query comme le font les autres appelants de `parseFurnitureRequest` (grep).

- [ ] **Step 2 : lancer le test, constater l'échec**

Run : `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/vortex-imager/test/furniture-request.test.ts`
Attendu : FAIL sur `scale` (64 au lieu de 1).

- [ ] **Step 3 : implémentation minimale**

Dans `SIZE_MAP` :

```ts
const SIZE_MAP: Record<string, { scale: number; zoom: number }> = {
    // The catalogue icon: at scale 1 a furni's visualization draws its `_icon_` assets, in the
    // colour of its variant (FurnitureVisualization: isIcon = size 1).
    icon: {scale: 1, zoom: 1},
    s: {scale: 32, zoom: 1},
    m: {scale: 64, zoom: 1},
    l: {scale: 64, zoom: 2},
    b: {scale: 64, zoom: 3}
};
```

- [ ] **Step 4 : lancer le test, constater le succès**

Même commande. Attendu : PASS.

- [ ] **Step 5 : vérifier l'hypothèse sur de vrais mobis (bloquant)**

Lancer l'imager (`pnpm dev` le démarre sur :8081), puis :

```bash
curl -s -o /tmp/icon1.png "http://127.0.0.1:8081/habbo-imaging/furniture?class=chair_polyfon&size=icon"
curl -s -o /tmp/icon2.png "http://127.0.0.1:8081/habbo-imaging/furniture?class=sofa_silo*2&size=icon"
curl -s -o /tmp/icon3.png "http://127.0.0.1:8081/habbo-imaging/furniture?class=27_dragonlamp_skream&size=icon"
```

Ouvrir les trois PNG avec Read. Attendu : une petite icône non vide, de la couleur de la variante pour
`sofa_silo*2`. Comparer avec `C:/laragon/www/vortex-assets/dcr/hof_furni/icons/sofa_silo_2_icon.png`.

**Si une image est vide, transparente ou en erreur : s'arrêter.** Rapporter au propriétaire ce qui
sort, et ne pas poursuivre les tâches 6 et 8, qui reposent sur ce rendu.

- [ ] **Step 6 : commit**

```bash
git add packages/vortex-imager/src/room/FurnitureRequest.ts packages/vortex-imager/test/furniture-request.test.ts
git commit -m "imager : size=icon rend un mobi à la taille 1 (ses assets _icon_)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- packages/vortex-imager/src/room/FurnitureRequest.ts packages/vortex-imager/test/furniture-request.test.ts
```

---

### Task 2: Sources, familles et `build:ambreia:all`

**Files :**
- Create : `packages/vortex-client/tools/ambreia-families.mjs` (familles, sélection, couverture : logique pure)
- Create : `packages/vortex-client/tools/ambreia-families.test.mjs`
- Create : `packages/vortex-client/tools/gather-ambreia-sources.mjs` (copie one-shot, relançable)
- Create : `packages/vortex-client/tools/build-ambreia-all.mjs`
- Modify : `packages/vortex-client/package.json` (scripts)

Le manifeste de la spec (`ambreia-families.json`) est la constante `FAMILIES` du module `.mjs`. Un seul
fichier, puisque la logique de sélection l'utilise.

**Interfaces :**
- Produit (`ambreia-families.mjs`) :
  - `FAMILIES: readonly string[]` = `['clothing','effects','room','pets','furniture']`
  - `ROOM_BUNDLES: readonly string[]`
  - `figureMapLibs(xml: string): string[]`, `effectMapLibs(xml: string): string[]`
  - `petNames(legacyDefaults: Record<string,string>): string[]`
  - `gordonSelection({figureLibs, effectLibs, pets, gordonNames}): {clothing: string[], effects: string[], room: string[], pets: string[]}`
  - `coverage({figureLibs, effectLibs, pets, available}): {missing: {clothing, effects, pets, room}, blocking: string[]}`.
    Ici, `available` vaut `{[family]: Set<string>}`.

- [ ] **Step 1 : écrire les tests qui échouent**

```js
// packages/vortex-client/tools/ambreia-families.test.mjs
// Which gordon bundles go to which family, and which names the families still lack.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOM_BUNDLES, coverage, effectMapLibs, figureMapLibs, gordonSelection, petNames} from './ambreia-families.mjs';

test('the figure map and the effect map give their library names, once each', () =>
{
    assert.deepEqual(figureMapLibs('<map><lib id="hh_human_body" revision="1"><part/></lib><lib id="shirt_a"/><lib id="hh_human_body"/></map>'), ['hh_human_body', 'shirt_a']);
    assert.deepEqual(effectMapLibs('<map><effect id="dance.1" lib="Dance1" type="dance"/><effect id="fx.2" lib="Afk"/></map>'), ['Dance1', 'Afk']);
});

test('the pets are the comma list of pet.configuration', () =>
{
    assert.deepEqual(petNames({'pet.configuration': 'dog, cat,croco'}), ['dog', 'cat', 'croco']);
});

test('gordon is split by what reads each bundle; unused old clothes are left behind', () =>
{
    const picked = gordonSelection({
        figureLibs: ['hh_human_body', 'shirt_new'],
        effectLibs: ['Dance1'],
        pets: ['dog'],
        gordonNames: ['hh_human_body', 'acc_old_unused', 'Dance1', 'dog', 'HabboRoomContent', 'TileCursor']
    });

    assert.deepEqual(picked.clothing, ['hh_human_body']);
    assert.deepEqual(picked.effects, ['Dance1']);
    assert.deepEqual(picked.pets, ['dog']);
    assert.deepEqual(picked.room, ['HabboRoomContent', 'TileCursor']);
});

test('a missing base library or room bundle blocks; a missing clothing piece is only listed', () =>
{
    const result = coverage({
        figureLibs: ['hh_human_body', 'hh_human_face', 'shirt_lost'],
        effectLibs: ['Dance1', 'Cat'],
        pets: ['dog'],
        available: {clothing: new Set(['hh_human_body']), effects: new Set(['Dance1']), pets: new Set(['dog']), room: new Set(ROOM_BUNDLES.filter(name => name !== 'TileCursor')), furniture: new Set()}
    });

    assert.deepEqual(result.missing.clothing, ['hh_human_face', 'shirt_lost']);
    assert.deepEqual(result.missing.effects, ['Cat']);
    assert.deepEqual(result.missing.room, ['TileCursor']);
    assert.deepEqual(result.blocking, ['clothing/hh_human_face', 'room/TileCursor']);
});
```

- [ ] **Step 2 : lancer, constater l'échec**

Run : `node --test packages/vortex-client/tools/ambreia-families.test.mjs`
Attendu : FAIL, module introuvable.

- [ ] **Step 3 : écrire `ambreia-families.mjs`**

```js
// packages/vortex-client/tools/ambreia-families.mjs
/**
 * The asset families served as .ambreia directories (spec 2026-10-09-ambreia-everything) and the
 * pure rules that fill them: which source bundle belongs to which family, and which names a family
 * still lacks once built.
 */
export const FAMILIES = ['clothing', 'effects', 'room', 'pets', 'furniture'];

/** The room's own bundles (RoomContentLoader.getObjectContentPieces): without them nothing renders. */
export const ROOM_BUNDLES = ['HabboRoomContent', 'TileCursor', 'SelectionArrow', 'PlaceHolderFurniture', 'PlaceHolderWallItem', 'PlaceHolderPet'];

const unique = names => [...new Set(names)];

export const figureMapLibs = xml => unique([...xml.matchAll(/<lib\s+id="([^"]+)"/g)].map(match => match[1]));

export const effectMapLibs = xml => unique([...xml.matchAll(/<effect\s[^>]*\blib="([^"]+)"/g)].map(match => match[1]));

export const petNames = legacyDefaults => String(legacyDefaults['pet.configuration'] ?? '').split(',').map(name => name.trim()).filter(Boolean);

/** Which of gordon's bundles each family takes; a bundle nothing reads stays behind. */
export function gordonSelection({figureLibs, effectLibs, pets, gordonNames})
{
    const has = new Set(gordonNames);
    const pick = names => unique(names).filter(name => has.has(name));

    return {clothing: pick(figureLibs), effects: pick(effectLibs), room: pick(ROOM_BUNDLES), pets: pick(pets)};
}

/**
 * The names each family lacks. A base library (`hh_*`) or a room bundle missing blocks: no figure or
 * no room draws at all without it. Anything else is only listed (known gaps: spec, out of scope).
 */
export function coverage({figureLibs, effectLibs, pets, available})
{
    const lacking = (names, family) => unique(names).filter(name => !available[family].has(name));
    const missing = {clothing: lacking(figureLibs, 'clothing'), effects: lacking(effectLibs, 'effects'), pets: lacking(pets, 'pets'), room: lacking(ROOM_BUNDLES, 'room')};
    const blocking = [...missing.clothing.filter(name => name.startsWith('hh_')).map(name => `clothing/${name}`), ...missing.room.map(name => `room/${name}`)];

    return {missing, blocking};
}
```

- [ ] **Step 4 : lancer, constater le succès**

Run : `node --test packages/vortex-client/tools/ambreia-families.test.mjs`
Attendu : PASS (4 tests).

- [ ] **Step 5 : écrire `gather-ambreia-sources.mjs`**

```js
#!/usr/bin/env node
/**
 * Copies the .nitro sources of every family into one place nothing serves (spec
 * 2026-10-09-ambreia-everything, §1): build-ambreia-all reads them from there. Re-runnable: a file is
 * copied only when missing or different in size or older; nothing is ever deleted.
 *
 *   node packages/vortex-client/tools/gather-ambreia-sources.mjs [--out=C:/laragon/ambreia-sources]
 *     [--gordon=<dir>] [--clothing=<dir>] [--furniture=<dir>]
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {effectMapLibs, figureMapLibs, gordonSelection, petNames} from './ambreia-families.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const flag = (name, fallback) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const OUT = flag('out', 'C:/laragon/ambreia-sources');
const GORDON = flag('gordon', 'C:/laragon/www/vortex-assets/gordon/vortex-assets-PRODUCTION-202601121522-867048149');
const CLOTHING = flag('clothing', path.join(process.env.USERPROFILE ?? '', 'Desktop/clothing'));
const FURNITURE = flag('furniture', 'C:/laragon/www/vortex-assets/dcr/hof_furni');
const CONFIGURATIONS = path.resolve(HERE, '../src/assets/configurations');
const LEGACY = path.resolve(HERE, '../../ambreia-game/src/configuration/legacy.defaults.json');

let copied = 0;
let kept = 0;

function copy(source, target)
{
    const from = fs.statSync(source);
    const to = fs.existsSync(target) ? fs.statSync(target) : null;

    if(to && to.size === from.size && to.mtimeMs >= from.mtimeMs) { kept++; return; }

    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.copyFileSync(source, target);
    fs.utimesSync(target, from.atime, from.mtime);
    copied++;
}

/** Every .nitro under `dir`, its subfolders included, kept at the same relative path. */
function copyTree(dir, family)
{
    for(const entry of fs.readdirSync(dir, {withFileTypes: true}))
    {
        const full = path.join(dir, entry.name);

        if(entry.isDirectory()) copyTree(full, path.join(family, entry.name));
        else if(entry.name.endsWith('.nitro')) copy(full, path.join(OUT, family, entry.name));
    }
}

const gordonNames = fs.readdirSync(GORDON).filter(name => name.endsWith('.nitro')).map(name => name.slice(0, -'.nitro'.length));
const picked = gordonSelection({
    figureLibs: figureMapLibs(fs.readFileSync(path.join(CONFIGURATIONS, 'AmbreiaFigureMap.xml'), 'utf8')),
    effectLibs: effectMapLibs(fs.readFileSync(path.join(CONFIGURATIONS, 'AmbreiaEffectMap.xml'), 'utf8')),
    pets: petNames(JSON.parse(fs.readFileSync(LEGACY, 'utf8'))),
    gordonNames
});

copyTree(CLOTHING, 'clothing');

for(const family of ['clothing', 'effects', 'room', 'pets'])
{
    for(const name of picked[family]) copy(path.join(GORDON, `${name}.nitro`), path.join(OUT, family, `${name}.nitro`));
}

// Top level only: icons/ and mp3/ are not furniture bundles (icons: the scale-1 render, spec §2).
for(const name of fs.readdirSync(FURNITURE).filter(name => name.endsWith('.nitro'))) copy(path.join(FURNITURE, name), path.join(OUT, 'furniture', name));

console.log(`${copied} copied, ${kept} already there → ${OUT}`);
console.log(Object.entries(picked).map(([family, names]) => `${family}: ${names.length} from gordon`).join(', '));
```

- [ ] **Step 6 : écrire `build-ambreia-all.mjs`**

```js
#!/usr/bin/env node
/**
 * Builds every family's .ambreia directory from the gathered sources, then checks that the families
 * cover what the client asks for (spec 2026-10-09-ambreia-everything, §1). Exit 1 when a build fails or
 * a blocking name is missing; `.ambreia-build/coverage.json` lists every gap.
 *
 *   pnpm --filter vortex-client build:ambreia:all [--sources=C:/laragon/ambreia-sources]
 *     [--out=C:/laragon/www/vortex-assets/ambreia] [--key-file=C:/laragon/ambreia.key] [--only=room,pets]
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {FAMILIES, coverage, effectMapLibs, figureMapLibs, petNames} from './ambreia-families.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const flag = (name, fallback) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const SOURCES = flag('sources', 'C:/laragon/ambreia-sources');
const OUT = flag('out', 'C:/laragon/www/vortex-assets/ambreia');
const KEY_FILE = flag('key-file', 'C:/laragon/ambreia.key');
const STATE_DIR = flag('state-dir', '.ambreia-build');
const ONLY = flag('only', '').split(',').filter(Boolean);
const TSX = path.resolve(HERE, '../../../node_modules/tsx/dist/cli.mjs');

let failed = false;

for(const family of FAMILIES.filter(name => ONLY.length === 0 || ONLY.includes(name)))
{
    console.log(`\n== ${family}`);

    const run = spawnSync(process.execPath, [TSX, path.join(HERE, 'build-ambreia.ts'), path.join(SOURCES, family), path.join(OUT, family),
        `--key-file=${KEY_FILE}`, `--kind=${family}`, `--state-dir=${STATE_DIR}`], {stdio: 'inherit'});

    if(run.status !== 0) { failed = true; console.error(`${family}: build failed (exit ${run.status})`); }
}

/** The names a family's directory holds: its source bundles minus those its report found unreadable. */
function available(family)
{
    const names = new Set();
    const walk = dir => fs.existsSync(dir) && fs.readdirSync(dir, {withFileTypes: true}).forEach(entry =>
        entry.isDirectory() ? walk(path.join(dir, entry.name)) : entry.name.endsWith('.nitro') && names.add(entry.name.slice(0, -'.nitro'.length)));

    walk(path.join(SOURCES, family));

    const report = path.join(STATE_DIR, `${family}.report.json`);

    if(fs.existsSync(report)) for(const {file} of JSON.parse(fs.readFileSync(report, 'utf8')).unreadable) names.delete(path.basename(file, '.nitro'));

    return names;
}

const configurations = path.resolve(HERE, '../src/assets/configurations');
const result = coverage({
    figureLibs: figureMapLibs(fs.readFileSync(path.join(configurations, 'AmbreiaFigureMap.xml'), 'utf8')),
    effectLibs: effectMapLibs(fs.readFileSync(path.join(configurations, 'AmbreiaEffectMap.xml'), 'utf8')),
    pets: petNames(JSON.parse(fs.readFileSync(path.resolve(HERE, '../../ambreia-game/src/configuration/legacy.defaults.json'), 'utf8'))),
    available: Object.fromEntries(FAMILIES.map(family => [family, available(family)]))
});

fs.mkdirSync(STATE_DIR, {recursive: true});
fs.writeFileSync(path.join(STATE_DIR, 'coverage.json'), JSON.stringify(result, null, 1));
console.log(`\ncoverage: ${Object.entries(result.missing).map(([family, names]) => `${family} −${names.length}`).join(', ')} (details: ${STATE_DIR}/coverage.json)`);

if(result.blocking.length > 0) { failed = true; console.error(`blocking: ${result.blocking.join(' ')}`); }

process.exit(failed ? 1 : 0);
```

Dans `packages/vortex-client/package.json`, à côté de `build:ambreia` :

```json
    "build:ambreia:all": "node ./tools/build-ambreia-all.mjs",
    "gather:ambreia": "node ./tools/gather-ambreia-sources.mjs",
```

`build-ambreia.ts` reçoit des chemins de sortie absolus, mais sa commande `pnpm --filter` tourne dans
`packages/vortex-client`. `--state-dir` doit donc pointer vers le `.ambreia-build/` de la racine :
`build-ambreia-all.mjs` passe `STATE_DIR` tel quel. On le lance depuis la racine avec
`node packages/vortex-client/tools/build-ambreia-all.mjs`, ou via pnpm avec
`--state-dir=../../.ambreia-build`. Choisir l'un des deux et l'écrire dans l'en-tête du script.

- [ ] **Step 7 : rassembler les sources (sur le disque, rien n'est supprimé)**

Run : `node packages/vortex-client/tools/gather-ambreia-sources.mjs`
Attendu :
- environ 5 538 fichiers dans `clothing` (Bureau) + 9 venus de gordon ;
- environ 218 dans `effects`, 6 dans `room`, 20 dans `pets` ;
- environ 75 700 dans `furniture`.

Relancer : `0 copied`.

- [ ] **Step 8 : mettre de côté les anciens dossiers construits, puis construire**

Les anciens `ambreia/clothing` et `ambreia/furniture` sont **renommés**, pas supprimés : la spec veut
des builds dans des dossiers vides, et la suppression attend l'accord du propriétaire.

```bash
mv /c/laragon/www/vortex-assets/ambreia/clothing /c/laragon/www/vortex-assets/ambreia-old-clothing
mv /c/laragon/www/vortex-assets/ambreia/furniture /c/laragon/www/vortex-assets/ambreia-old-furniture
node packages/vortex-client/tools/build-ambreia-all.mjs --only=room,pets,effects,clothing
```

Lancer `furniture` à part, en arrière-plan : environ 1,9 Go de sources, donc long.

```bash
node packages/vortex-client/tools/build-ambreia-all.mjs --only=furniture
```

Attendu :
- chaque famille affiche `N written … 0 difference(s)` ;
- la couverture donne environ `clothing −498`, `effects −23`, `pets −0`, `room −0` ;
- aucun manque bloquant ;
- code de sortie 0.

Si `clothing/hh_*` est bloquant, vérifier que les 9 libs de base sont bien dans `ambreia-sources/clothing`.

- [ ] **Step 9 : commit**

```bash
git add packages/vortex-client/tools/ambreia-families.mjs packages/vortex-client/tools/ambreia-families.test.mjs packages/vortex-client/tools/gather-ambreia-sources.mjs packages/vortex-client/tools/build-ambreia-all.mjs packages/vortex-client/package.json
git commit -m "assets : sources rassemblées hors www et build:ambreia:all pour les cinq familles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- packages/vortex-client/tools/ambreia-families.mjs packages/vortex-client/tools/ambreia-families.test.mjs packages/vortex-client/tools/gather-ambreia-sources.mjs packages/vortex-client/tools/build-ambreia-all.mjs packages/vortex-client/package.json
```

---

### Task 3: `@ambreia/common` — dossiers par famille et `AmbreiaPieceLoader`

Cette tâche est additive : `NitroBundleLoader` et `AssetPacks` restent jusqu'à la tâche 9.

**Files :**
- Create : `packages/ambreia-common/src/assets/pack/AssetDirectories.ts`
- Create : `packages/ambreia-common/src/assets/loaders/AmbreiaPieceLoader.ts`
- Modify : `packages/ambreia-common/src/assets/IAssetLibrary.ts` (ajout de `loadPiece`)
- Modify : `packages/ambreia-common/src/assets/AssetLibrary.ts` (`loadPiece`, branche `instanceof` dans `handleAssetLoadEvent`)
- Modify : `packages/ambreia-common/src/assets/AssetLibraryCollection.ts` (`loadPiece` → `binLibrary`)
- Modify : `packages/ambreia-common/src/assets/NitroAsset.ts` (accepte aussi `AmbreiaPieceLoader`)
- Modify : `packages/ambreia-common/src/assets/loaders/index.ts` (export)
- Test : `packages/ambreia-common/test/asset-directories.test.ts` (à créer)

**Interfaces :**
- Produit (`AssetDirectories.ts`) :

```ts
export const ASSET_FAMILIES = ['clothing', 'effects', 'room', 'pets', 'furniture'] as const;
export type AssetFamily = typeof ASSET_FAMILIES[number];
export type IAssetDirectories = Readonly<Record<AssetFamily, AmbreiaDirectory>>;
export interface IAssetPacksSettings { key?: string; clothing?: string; effects?: string; room?: string; pets?: string; furniture?: string }
export function openAssetDirectories(settings: IAssetPacksSettings, interpolate?: (text: string) => string, fetch?: FetchBytes): IAssetDirectories;
```

- Produit (`AmbreiaPieceLoader`) : `new AmbreiaPieceLoader(mimeType)`, puis `loadPiece(directory, name)`.
  Mêmes getters que `NitroBundleLoader` : `jsonData`, `textures`, `spritesheet`, `baseTexture`,
  `transferOwnership()`, `getTexture()`.
- Produit (`IAssetLibrary`) : `loadPiece(name: string, directory: AmbreiaDirectory, id?: number): AssetLoaderStruct`.
- Constante : `AmbreiaPieceLoader.MIME_TYPE = 'application/x-ambreia-piece'`.

- [ ] **Step 1 : écrire les tests qui échouent**

```ts
// packages/ambreia-common/test/asset-directories.test.ts
// One .ambreia directory per family, and pieces loaded through AssetLibrary.loadPiece (spec
// 2026-10-09-ambreia-everything §2): no .nitro anywhere, a missing piece is one request and an error.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openAssetDirectories, ASSET_FAMILIES} from '../src/assets/pack/AssetDirectories';
import {AmbreiaDirectory} from '../src/assets/pack/AmbreiaDirectory';
import type {FetchBytes} from '../src/assets/pack/AmbreiaDirectory';
import {compressManifest, encodePiece} from '../src/assets/pack/AmbreiaPiece';
import {encodeMasterKey, encryptedLayout, generateMasterKey, plainLayout} from '../src/assets/pack/AmbreiaLayout';
import type {IAmbreiaLayout} from '../src/assets/pack/AmbreiaLayout';
import {AssetLibrary} from '../src/assets/AssetLibrary';
import {AssetLoaderEventType} from '../src/assets/loaders/AssetLoaderEvent';
import {BROWSER_PLATFORM, setPlatform} from '../src/platform/Platform';

const DICTIONARY = new TextEncoder().encode('"spritesheet":{"frames":{"');
const DICTIONARY_ID = '0123456789abcdef';
const DIR = 'http://assets/ambreia/furniture/';
const manifest = (name: string): Record<string, unknown> => ({
    name, type: 'throne', assets: {a: {x: 0, y: 0}},
    spritesheet: {frames: {[`${name}_a`]: {frame: {x: 0, y: 0, w: 4, h: 4}, rotated: false, trimmed: false, spriteSourceSize: {x: 0, y: 0, w: 4, h: 4}, sourceSize: {w: 4, h: 4}}}, meta: {image: `${name}.png`, format: 'RGBA8888', size: {w: 4, h: 4}, scale: '1'}}
});

async function served(pieces: string[], layout: IAmbreiaLayout = plainLayout()): Promise<{fetch: FetchBytes; requested: string[]}>
{
    const files = new Map<string, Uint8Array>();
    const put = async (logical: Parameters<IAmbreiaLayout['path']>[0], bytes: Uint8Array): Promise<void> => { files.set(DIR + await layout.path(logical), await layout.seal(logical, bytes)); };

    files.set(`${DIR}ambreia.json`, new TextEncoder().encode(JSON.stringify({v: 1, kind: 'furniture', dictionary: DICTIONARY_ID, encrypted: layout.encrypted, keyId: layout.keyId})));
    await put({kind: 'dictionary', id: DICTIONARY_ID}, DICTIONARY);

    for(const name of pieces) await put({kind: 'piece', name}, encodePiece({dictionaryId: DICTIONARY_ID, manifest: compressManifest(manifest(name), DICTIONARY), images: [{entryName: `${name}.png`, format: 'webp', bytes: new Uint8Array([1])}]}, name));

    const requested: string[] = [];

    return {requested, fetch: async url => { requested.push(url); return files.get(url) ?? null; }};
}

function load(library: AssetLibrary, name: string, directory: AmbreiaDirectory): Promise<boolean>
{
    return new Promise(resolve =>
    {
        const struct = library.loadPiece(name, directory);

        struct.events.on('event', (event: {type: string}) =>
        {
            if(event.type === AssetLoaderEventType.COMPLETE) resolve(true);
            else if(event.type === AssetLoaderEventType.ERROR) resolve(false);
        });
    });
}

test('every family gets its directory, ${…} resolved; a family left out is named', () =>
{
    const urls = Object.fromEntries(ASSET_FAMILIES.map(family => [family, `\${url.prefix}/ambreia/${family}/`]));
    const directories = openAssetDirectories(urls, text => text.replace('${url.prefix}', 'http://assets'));

    assert.equal(directories.pets.url, 'http://assets/ambreia/pets/');
    assert.equal(directories.furniture.url, 'http://assets/ambreia/furniture/');
    assert.throws(() => openAssetDirectories({...urls, effects: undefined}), /effects/);
});

test('loadPiece registers the piece under its name, its textures parsed, never fetching a .nitro', async () =>
{
    const {fetch, requested} = await served(['throne']);
    const library = new AssetLibrary('pieces');

    setPlatform({...BROWSER_PLATFORM, decodeImage: async () => ({width: 4, height: 4}) as unknown as CanvasImageSource});

    try
    {
        assert.equal(await load(library, 'throne', new AmbreiaDirectory(DIR, fetch)), true);
        assert.equal(library.hasAsset('throne'), true);
        assert.ok(requested.every(url => !url.endsWith('.nitro')), requested.join(' '));
    }
    finally
    {
        setPlatform(BROWSER_PLATFORM);
    }
});

test('a piece the directory lacks is an error after one request, not three', async () =>
{
    const {fetch, requested} = await served(['throne']);

    assert.equal(await load(new AssetLibrary('missing'), 'chair', new AmbreiaDirectory(DIR, fetch)), false);
    assert.equal(requested.filter(url => url.endsWith('.ambreia')).length, 1);
});

test('a key that cannot be used makes the family unreadable: an error, no retry loop', async () =>
{
    const key = generateMasterKey();
    const {fetch, requested} = await served(['throne'], await encryptedLayout(key));
    const directories = openAssetDirectories(
        Object.fromEntries(ASSET_FAMILIES.map(family => [family, DIR])) as Record<string, string>,
        text => text, fetch);
    const wrong = openAssetDirectories({...Object.fromEntries(ASSET_FAMILIES.map(family => [family, DIR])), key: encodeMasterKey(generateMasterKey())}, text => text, fetch);

    assert.equal(await load(new AssetLibrary('nokey'), 'throne', directories.furniture), false);
    assert.equal(await load(new AssetLibrary('wrongkey'), 'throne', wrong.furniture), false);
    assert.equal(directories.furniture.broken && wrong.furniture.broken, true);
    assert.ok(requested.filter(url => url.endsWith('ambreia.json')).length <= 2, requested.join(' '));
});
```

- [ ] **Step 2 : lancer, constater l'échec**

Run : `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-common/test/asset-directories.test.ts`
Attendu : FAIL, `AssetDirectories` introuvable.

- [ ] **Step 3 : écrire `AssetDirectories.ts`**

```ts
// packages/ambreia-common/src/assets/pack/AssetDirectories.ts
import {AmbreiaDirectory, httpBytes} from './AmbreiaDirectory';
import type {FetchBytes} from './AmbreiaDirectory';
import {decodeMasterKey, encryptedLayout} from './AmbreiaLayout';

/** The families served as .ambreia directories (spec 2026-10-09-ambreia-everything). */
export const ASSET_FAMILIES = ['clothing', 'effects', 'room', 'pets', 'furniture'] as const;

export type AssetFamily = typeof ASSET_FAMILIES[number];

export type IAssetDirectories = Readonly<Record<AssetFamily, AmbreiaDirectory>>;

/** config.json → `asset-packs`: a directory URL per family and the master key of encrypted ones. */
export type IAssetPacksSettings = Partial<Record<AssetFamily, string>> & {key?: string};

/**
 * One AmbreiaDirectory per family. Every family is required: there is no .nitro to fall back on, so a
 * missing one would draw nothing, silently. The key's layout is shared; a key WebCrypto cannot use
 * (no secure origin) makes every encrypted directory unreadable, which each loader reports once.
 */
export function openAssetDirectories(settings: IAssetPacksSettings, interpolate: (text: string) => string = text => text, fetch: FetchBytes = httpBytes): IAssetDirectories
{
    const missing = ASSET_FAMILIES.filter(family => !settings[family]);

    if(missing.length > 0) throw new Error(`asset-packs: no directory for ${missing.join(', ')}`);

    const layout = settings.key ? encryptedLayout(decodeMasterKey(settings.key)) : null;

    // Handled here so a key that cannot be used is not also an unhandled rejection; the directories
    // still await the original promise and fail with its reason.
    layout?.catch(() => undefined);

    return Object.fromEntries(ASSET_FAMILIES.map(family => [family, new AmbreiaDirectory(interpolate(settings[family]!), fetch, layout)])) as unknown as IAssetDirectories;
}
```

- [ ] **Step 4 : écrire `AmbreiaPieceLoader.ts`**

Partir de `NitroBundleLoader.ts`. On reprend tel quel :
- les interfaces `IAssetData`, `ISpritesheetData`, `IFrameInfo`, `IAssetInfo`, `IAssetAlias` ;
- les getters, `transferOwnership`, `getTexture`, `releaseTextures` ;
- `parseSpritesheet`, et `parseBundle` renommé `parsePiece`.

On ne reprend pas : `extractFiles`, `validateNotHtmlResponse`, `fallBackToNitro`, l'import de
`AssetPacks`, `pako`. Le squelette qui change :

```ts
import {Spritesheet, type Texture} from 'pixi.js';
import {BaseFileLoader} from './BaseFileLoader';
import {platform} from '../../platform/Platform';
import {textureFromCanvas} from '../../graphics/textureFromCanvas';
import {Logger} from '../../utils/Logger';
import type {AmbreiaDirectory} from '../pack/AmbreiaDirectory';

const log = Logger.getLogger('core.assets.loaders.AmbreiaPieceLoader');

/**
 * Loads one piece of an .ambreia directory (spec 2026-10-09-ambreia-everything): its manifest and
 * images, the spritesheet cut into textures. Pieces come only through loadPiece(); there is no URL to
 * load and no .nitro to fall back on.
 */
export class AmbreiaPieceLoader extends BaseFileLoader
{
    static readonly MIME_TYPE = 'application/x-ambreia-piece';

    private _directory: AmbreiaDirectory | null = null;
    private _name = '';
    private _files: Array<{name: string; data: Uint8Array}> | null = null;
    // A piece the directory does not have stays missing: no retry.
    private _missing = false;
    private _ownershipTransferred = false;
    private _jsonData: IAssetData | null = null;
    private _textures: Map<string, Texture> = new Map();
    private _spritesheet: Spritesheet | null = null;
    private _baseTexture: Texture | null = null;

    // … getters jsonData, textures, spritesheet, baseTexture, content (= jsonData), bytes (= null),
    //   getTexture(), transferOwnership() : copiés de NitroBundleLoader …

    /** `${directory}${name}`: the key AssetLibrary tracks a pending piece under. */
    static key(directory: AmbreiaDirectory, name: string): string
    {
        return `${directory.url}${name}`;
    }

    loadPiece(directory: AmbreiaDirectory, name: string): void
    {
        this._directory = directory;
        this._name = name;
        this._url = AmbreiaPieceLoader.key(directory, name);
        this._files = null;
        this._missing = false;
        this._errorCode = 0;
        this.handleLoadEvent('open');

        // Two-argument then(): a throw in a listener of the success path must not count as a failed read.
        directory.read(name).then((files) =>
        {
            if(this._disposed) return;

            if(!files)
            {
                this._missing = true;
                log.once(`missing:${this._url}`).warn(`${name}: not in ${directory.url} — it will not display`);
                this.handleLoadEvent('ioError', 404);

                return;
            }

            this._files = files;
            this._status = 200;
            this._bytesLoaded = files.reduce((total, file) => total + file.data.length, 0);
            this.handleLoadEvent('complete');
        }, (error: unknown) =>
        {
            if(this._disposed) return;

            // pako throws strings; WebCrypto, DOMExceptions.
            const reason = String((error as Error | null)?.message ?? error);

            if(directory.broken) log.once(`broken:${directory.url}`).error(`${directory.url} cannot be read (${reason}): nothing from it will display`);
            else log.warn(`${name}: ${reason}`);

            this.handleLoadEvent('ioError');
        });
    }

    /** Pieces are never loaded by URL. */
    load(url: string): void
    {
        log.error(`AmbreiaPieceLoader.load(${url}): pieces load through AssetLibrary.loadPiece()`);
        this.handleLoadEvent('ioError');
    }

    /** A missing piece or a broken directory stays so: only a failed request is worth another go. */
    protected override retry(): boolean
    {
        if(this._missing || this._directory === null || this._directory.broken) return false;
        if(this._disposed || ++this._retryCount > BaseFileLoader.MAX_RETRIES) return false;

        this.loadPiece(this._directory, this._name);

        return true;
    }

    protected override handleLoadEvent(type: string, httpStatus?: number): void
    {
        if(type === 'complete' && this._files)
        {
            this.parsePiece(this._files).then(() => super.handleLoadEvent('complete', httpStatus), (error: unknown) =>
            {
                if(this._disposed) return;

                // An image the browser refuses: the same bytes would be refused again.
                this._missing = true;
                this.releaseTextures();
                log.warn(`${this._name}: the piece does not decode (${String((error as Error | null)?.message ?? error)})`);
                super.handleLoadEvent('ioError', httpStatus);
            });

            return;
        }

        super.handleLoadEvent(type, httpStatus);
    }

    // … parsePiece(files) = l'ancien parseBundle() sans la branche .nitro, parseSpritesheet(), releaseTextures() …

    override dispose(): void
    {
        if(this._disposed) return;

        this._files = null;
        this._directory = null;
        // … le corps de NitroBundleLoader.dispose() : textures détruites seulement sans transferOwnership …
        super.dispose();
    }
}
```

Avant d'écrire `load()`, vérifier que `BaseFileLoader` déclare bien `abstract load(url)` (oui, ligne 130)
et `abstract get content()/bytes()` : `AmbreiaPieceLoader` doit les définir.

- [ ] **Step 5 : brancher `loadPiece` dans `AssetLibrary`, `IAssetLibrary`, `AssetLibraryCollection`, `NitroAsset`**

`IAssetLibrary.ts`, sous `loadAssetFromFile` :

```ts
    /** Loads one piece of an .ambreia directory under `name` (AmbreiaPieceLoader). */
    loadPiece(name: string, directory: AmbreiaDirectory, id?: number): AssetLoaderStruct;
```

Avec `import type {AmbreiaDirectory} from './pack/AmbreiaDirectory';`.

`AssetLibrary.ts` :
- extraire la fin de `loadAssetFromFile` (de `const struct = new AssetLoaderStruct(...)` au
  `return struct;`) dans `private track(name: string, loader: IAssetLoader, declaration: AssetTypeDeclaration): AssetLoaderStruct`,
  qui fait `this._pendingLoads.set(loader.url, struct)` et branche COMPLETE/ERROR/PROGRESS
  exactement comme avant ;
- `loadAssetFromFile` appelle alors `this.track(name, loader, declaration)` ;
- ajouter :

```ts
    // TS-only: .ambreia pieces (spec 2026-10-09-ambreia-everything) — a name in a directory, not a URL.
    loadPiece(name: string, directory: AmbreiaDirectory, id: number = -1): AssetLoaderStruct
    {
        if(this.hasAsset(name)) throw new Error(`Asset with name ${name} already exists`);

        const key = AmbreiaPieceLoader.key(directory, name);
        const pending = this._pendingLoads.get(key);

        if(pending && pending.assetName === name) return pending;

        const declaration = this.getAssetTypeDeclarationByMimeType(AmbreiaPieceLoader.MIME_TYPE, true)!;
        const loader = new AmbreiaPieceLoader(AmbreiaPieceLoader.MIME_TYPE, undefined, id);
        const struct = this.track(name, loader, declaration);

        loader.loadPiece(directory, name);

        return struct;
    }
```

Attention : `track` lit `loader.url` pour la clé, et l'URL n'est fixée que par `loadPiece`. Dans
`loadPiece` d'`AssetLibrary`, passer donc la clé explicitement : `track(name, loader, declaration, key)`,
avec un paramètre `key = loader.url` par défaut. `handleAssetLoadEvent` supprime l'entrée par
`loader.url`, qui vaut la clé une fois `loadPiece` lancé.

- dans `initSharedTypes` (à côté de la déclaration nitro), enregistrer :

```ts
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration(AmbreiaPieceLoader.MIME_TYPE, NitroAsset as AssetClass, AmbreiaPieceLoader as unknown as AssetLoaderClass),
            true
        );
```

  Vérifier la signature d'`AssetTypeDeclaration` : les extensions sont un rest parameter, donc aucune
  extension ici, puisque rien ne doit résoudre une URL vers ce type.
- dans `handleAssetLoadEvent` : `if(loader instanceof NitroBundleLoader || loader instanceof AmbreiaPieceLoader)`.

`AssetLibraryCollection.ts`, à côté de `loadAssetFromFile` :

```ts
    loadPiece(name: string, directory: AmbreiaDirectory, id?: number): AssetLoaderStruct
    {
        return this.binLibrary.loadPiece(name, directory, id);
    }
```

`NitroAsset.ts` : les deux `instanceof NitroBundleLoader` deviennent
`instanceof NitroBundleLoader || content instanceof AmbreiaPieceLoader` (resp. `this._unknown`).

`loaders/index.ts` : `export {AmbreiaPieceLoader} from './AmbreiaPieceLoader';`.

- [ ] **Step 6 : lancer les tests, constater le succès**

Run : `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-common/test/asset-directories.test.ts packages/ambreia-common/test/asset-pack.test.ts`
Attendu : PASS. Les anciens tests de `asset-pack.test.ts` passent encore, puisque rien n'est retiré.

- [ ] **Step 7 : `pnpm check`**

Run : `pnpm check`. Attendu : vert. Montrer les dernières lignes.

- [ ] **Step 8 : commit**

```bash
git commit -m "assets : un dossier .ambreia par famille et AssetLibrary.loadPiece

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- packages/ambreia-common/src/assets/pack/AssetDirectories.ts packages/ambreia-common/src/assets/loaders/AmbreiaPieceLoader.ts packages/ambreia-common/src/assets/loaders/index.ts packages/ambreia-common/src/assets/IAssetLibrary.ts packages/ambreia-common/src/assets/AssetLibrary.ts packages/ambreia-common/src/assets/AssetLibraryCollection.ts packages/ambreia-common/src/assets/NitroAsset.ts packages/ambreia-common/test/asset-directories.test.ts
```

(`git add` des deux fichiers créés avant le commit.)

---

### Task 4: `@ambreia/avatar` — vêtements et effets depuis leurs dossiers

**Files :**
- Modify : `packages/ambreia-avatar/src/IAvatarRenderOptions.ts`
- Modify : `packages/ambreia-avatar/src/AvatarRenderManager.ts` (`initDownloadManagers`, l. ~493)
- Modify : `packages/ambreia-avatar/src/AvatarAssetDownloadManager.ts` (constructeur, `_downloadUrl`, l. ~71/82/322)
- Modify : `packages/ambreia-avatar/src/AvatarAssetDownloadLibrary.ts` (constructeur, `startDownloading`, l. ~31-130)
- Modify : `packages/ambreia-avatar/src/EffectAssetDownloadManager.ts` (constructeur, `addEffectLibrary`, l. ~50/65/252)
- Modify : `packages/ambreia-avatar/src/EffectAssetDownloadLibrary.ts` (constructeur, téléchargement, l. ~35-130)
- Modify : `packages/ambreia-avatar/tools/render-avatar.mjs`
- Modify : `packages/ambreia-avatar/test/avatar-render-options.test.ts`
**Ordre :** les tâches 4 à 8 changent des signatures que leurs appelants partagent : options
d'avatar, `RoomContentLoader.initialize`, `IsoStage.create`. Le typecheck ne repasse vert qu'une fois
les cinq faites. On les fait donc d'affilée, puis un seul `pnpm check`, puis cinq commits dans l'ordre
4, 5, 6, 7, 8. Les appelants des options d'avatar sont mis à jour dans leur tâche : jeu (6), sandbox
(5), imager (7).

**Interfaces :**
- Consomme : `IAssetDirectories`, `AmbreiaDirectory`, `IAssetLibrary.loadPiece` (tâche 3).
- Produit : `IAvatarRenderOptions` perd `downloadUrl` et `downloadNameTemplate`, et gagne
  `clothing: AmbreiaDirectory; effects: AmbreiaDirectory`.

- [ ] **Step 1 : faire échouer le test d'options**

Dans `avatar-render-options.test.ts`, remplacer `downloadUrl: '', downloadNameTemplate: ''` par :

```ts
clothing: new AmbreiaDirectory('http://assets/ambreia/clothing/', async () => null),
effects: new AmbreiaDirectory('http://assets/ambreia/effects/', async () => null)
```

Avec `import {AmbreiaDirectory} from '@ambreia/common/assets/pack/AmbreiaDirectory';`.

Ajouter un test : une lib de la figuremap se charge par `loadPiece` dans clothing, un effet dans effects.

```ts
test('a figure library is asked of the clothing directory and an effect of the effects one', async () =>
{
    setPlatform({...BROWSER_PLATFORM, parseXml: () => EMPTY_DOCUMENT});

    const asked: string[] = [];
    const record = (family: string): AmbreiaDirectory => new AmbreiaDirectory(`http://assets/ambreia/${family}/`, async url => { asked.push(url); return null; });
    const library = new AvatarAssetDownloadLibrary('hh_human_body', '1', record('clothing'), new AssetLibrary('a'));
    const effect = new EffectAssetDownloadLibrary('Dance1', '1', record('effects'), new AssetLibrary('e'));

    try
    {
        library.startDownloading();
        effect.startDownloading();
        await new Promise(resolve => setTimeout(resolve, 0));

        assert.ok(asked.includes('http://assets/ambreia/clothing/ambreia.json'), asked.join(' '));
        assert.ok(asked.includes('http://assets/ambreia/effects/ambreia.json'), asked.join(' '));
        assert.ok(asked.every(url => !url.endsWith('.nitro')));
    }
    finally
    {
        setPlatform(BROWSER_PLATFORM);
    }
});
```

Vérifier les noms réels des méthodes de lancement (`startDownloading` ou autre) dans les deux classes
`*DownloadLibrary` avant d'écrire ce test (grep `public .*()`), et importer les deux classes.

- [ ] **Step 2 : lancer, constater l'échec**

Run : `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-avatar/test/avatar-render-options.test.ts`
Attendu : FAIL de typage ou d'exécution sur `clothing`.

- [ ] **Step 3 : implémenter**

`IAvatarRenderOptions.ts` :

```ts
    /** The clothing family's .ambreia directory: every figure-map library is a piece of it. */
    clothing: AmbreiaDirectory;
    /** The effects family's directory: every effect-map library is a piece of it. */
    effects: AmbreiaDirectory;
```

`AvatarRenderManager.initDownloadManagers()` :

```ts
        const {clothing, effects, data} = this._options;

        this._aliasCollection.setAssetLibrary(this._options.assets);

        this._avatarAssetDownloadManager = new AvatarAssetDownloadManager(
            clothing,
            // … le reste inchangé
        );
        this._effectAssetDownloadManager = new EffectAssetDownloadManager(
            effects,
            // … inchangé
        );
```

La ligne `libraryUrl` (garde-fou `${`) disparaît : un dossier n'a pas de template.

Dans les deux managers, `downloadUrl: string` devient `directory: AmbreiaDirectory`, et le champ
`_downloadUrl` devient `_directory`. On garde la ligne `// AS3:` du champ et on ajoute :
`// DEVIATION: AS3 holds a URL template; the port holds the family's .ambreia directory (spec 2026-10-09).`

Les libraries reçoivent `this._directory`.

Dans les deux `*DownloadLibrary`, le corps de téléchargement devient :

```ts
        log.debug(`Downloading: ${this._libraryName} from ${this._directory.url}`);

        try
        {
            const loader = this._assetLibrary.loadPiece(this._libraryName, this._directory);
            // … listeners COMPLETE / ERROR inchangés
```

Les branches `url === this._downloadUrl` (« No valid download URL ») disparaissent.

`render-avatar.mjs` :
- lire la section `asset-packs` de `packages/vortex-client/public/config.json` (chemin surchargeable
  par `AMBREIA_CLIENT_CONFIG`) ;
- résoudre `${url.prefix}` avec `assetsBase` ;
- passer `clothing` et `effects` d'`openAssetDirectories(section, text => text.replace('${url.prefix}', assetsBase))`.

Si le fichier manque, sortir avec un message :
`config.json introuvable : copie config.example.json et remplis asset-packs`.

- [ ] **Step 4 : lancer le test, constater le succès**

Même commande. Attendu : PASS. Enchaîner les tâches 5 à 8 avant `pnpm check` (voir « Ordre »).

- [ ] **Step 5 : commit (après le `pnpm check` vert des tâches 4 à 8)**

```bash
git commit -m "avatar : vêtements et effets lus dans leurs dossiers .ambreia

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- packages/ambreia-avatar/src/IAvatarRenderOptions.ts packages/ambreia-avatar/src/AvatarRenderManager.ts packages/ambreia-avatar/src/AvatarAssetDownloadManager.ts packages/ambreia-avatar/src/AvatarAssetDownloadLibrary.ts packages/ambreia-avatar/src/EffectAssetDownloadManager.ts packages/ambreia-avatar/src/EffectAssetDownloadLibrary.ts packages/ambreia-avatar/tools/render-avatar.mjs packages/ambreia-avatar/test/avatar-render-options.test.ts
```

---

### Task 5: `@ambreia/iso` — le contenu de salle par famille et nom de pièce

**Files :**
- Modify : `packages/ambreia-iso/src/scene/RoomContentLoader.ts`
- Modify : `packages/ambreia-iso/src/IRoomContentLoader.ts` (si `getObjectUrl`/`loadThumbnailContent`/`iconAssets` y sont déclarés : les retirer)
- Modify : `packages/ambreia-iso/src/scene/IRoomContentListener.ts` (`iconLoaded` retiré)
- Modify : `packages/ambreia-iso/src/IsoStage.ts` (option `directories`)
- Modify : `packages/ambreia-iso/test/iso-stage.test.ts`
- Modify : `packages/ambreia-iso/sandbox/main.ts`, `packages/ambreia-iso/sandbox/vite.config.ts`
- Create : `packages/ambreia-iso/src/scene/IRoomContentDirectories.ts`

**Interfaces :**
- Consomme : `IAssetDirectories`, `openAssetDirectories` (tâche 3).
- Produit :

```ts
// IRoomContentDirectories.ts
import type {IAssetDirectories} from '@ambreia/common/assets/pack/AssetDirectories';
/** The families the room content comes from: furniture (and wall items), pets, the room's own bundles. */
export type IRoomContentDirectories = Pick<IAssetDirectories, 'furniture' | 'pets' | 'room'>;
```

  - `RoomContentLoader.initialize(stateEvents, configurationManager, directories: IRoomContentDirectories): void`
  - `IIsoStageOptions.directories: IRoomContentDirectories`

- [ ] **Step 1 : faire échouer le test hors ligne d'`iso-stage`**

Dans `iso-stage.test.ts`, test « a boot that times out » : remplacer
`property: key => (key === 'pet.dynamic.download.url' ? 'http://content.invalid/' : '')` par
`property: () => ''`, et ajouter :

```ts
            directories: openAssetDirectories(Object.fromEntries(ASSET_FAMILIES.map(family => [family, `http://content.invalid/${family}/`]))),
```

Le `fetch` global ne répond jamais, donc le boot expire comme avant.

Les trois tests réseau (`skip: SKIP`) remplacent leurs `properties` `.nitro` par un `directories` lu dans
le `config.json` du client : un helper `testDirectories(base)` en tête du fichier, qui lit
`packages/vortex-client/public/config.json` → `asset-packs` et remplace `${url.prefix}` par `base`.
Ils restent skippés sans `AMBREIA_ASSETS`.

Ajouter un test hors ligne : la salle demande ses six bundles à `room`, et un mobi à `furniture`.

```ts
test('the room asks the room directory for its own bundles, never a .nitro', {timeout: 30_000}, async () =>
{
    setPlatform(nodePlatform());

    const asked: string[] = [];
    const record: FetchBytes = async url => { asked.push(url); return null; };
    const directories = openAssetDirectories(Object.fromEntries(ASSET_FAMILIES.map(family => [family, `http://assets/ambreia/${family}/`])), text => text, record);

    await assert.rejects(IsoStage.create({assets: new AssetLibrary('iso-room-dirs'), property: () => '', furniData: [], directories, bootTimeoutMs: 500}));

    assert.ok(asked.some(url => url.startsWith('http://assets/ambreia/room/')), asked.join(' '));
    assert.ok(asked.every(url => !url.endsWith('.nitro')));
});
```

Le descripteur répond `null`, donc le dossier est cassé, la salle ne charge pas et `create` rejette.
Ce qui compte ici, c'est l'adresse demandée. Si `create` rejette autrement (erreur critique de
placeholder levée par `onContentLoadError`), adapter le `rejects` à ce message, et le noter.

- [ ] **Step 2 : lancer, constater l'échec**

Run : `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-iso/test/iso-stage.test.ts`
Attendu : FAIL de typage sur `directories`.

- [ ] **Step 3 : implémenter `RoomContentLoader`**

1. Les champs `_furnitureDownloadUrl`, `_furnitureDownloadNameTemplate`,
   `_furnitureIconDownloadNameTemplate`, `_petDownloadUrl` et `_petDownloadNameTemplate`
   (l. 184-188) laissent la place à :

```ts
    // DEVIATION: AS3 reads five URL/template properties here (var_4646…var_4790); the port reads
    // pieces from the families' .ambreia directories (spec 2026-10-09-ambreia-everything).
    private _directories: IRoomContentDirectories | null = null;
```

2. `initialize(stateEvents, configurationManager, directories: IRoomContentDirectories)` : les cinq
   `getProperty('flash.dynamic…' / 'pet.dynamic…')` sont remplacés par `this._directories = directories;`.

3. Ajouter près des types du fichier :

```ts
/** A piece of room content: which family's directory, and the piece's name in it. */
interface IContentPiece
{
    directory: AmbreiaDirectory;
    name: string;
}
```

4. `getObjectContentURLs(type, param, icon)` devient `getObjectContentPieces(type)`. On garde sa ligne
   `// AS3:` et on ajoute `// DEVIATION: a piece in a family's directory instead of a URL.`

```ts
    private getObjectContentPieces(type: string): IContentPiece[]
    {
        const directories = this._directories;

        if(directories === null) return [];

        const contentType = this.getContentType(type);
        const room = (name: string): IContentPiece[] => [{directory: directories.room, name}];

        switch(contentType)
        {
            case RoomContentLoader.PLACE_HOLDER_FURNITURE: return room('PlaceHolderFurniture');
            case RoomContentLoader.PLACE_HOLDER_WALL_ITEM: return room('PlaceHolderWallItem');
            case RoomContentLoader.PLACE_HOLDER_PET: return room('PlaceHolderPet');
            case RoomContentLoader.ROOM_CONTENT: return room('HabboRoomContent');
            case RoomContentLoader.TILE_CURSOR: return room('TileCursor');
            case RoomContentLoader.SELECTION_ARROW: return room('SelectionArrow');
            default:
            {
                const category = this.getObjectCategory(contentType);

                if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE || category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
                {
                    return [{directory: directories.furniture, name: this.getRoomObjectAlias(contentType)}];
                }

                if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) return [{directory: directories.pets, name: contentType}];
            }
        }

        return [];
    }
```

`resolveLocalOrAssetBaseUrl` disparaît.

5. `loadObjectContent` (l. ~744) : `const pieces = this.getObjectContentPieces(multiType ?? type);`,
   puis `this.loadObjectContentPieces(type, pieces, events, assetLibrary)`.

6. `loadObjectContentFromUrls` devient `loadObjectContentPieces(type, pieces: IContentPiece[], …)`, avec le
   même corps à deux différences près :
   - `assetLibrary.loadPiece(type, piece.directory, piece.name)` remplace `loadAssetFromFile(type, url)` ;
   - `onContentLoadError(type, piece)` remplace `onContentLoadError(type, url)`.

   On garde le long commentaire sur le throw synchrone.

7. `onContentLoadError(type, failed: IContentPiece)` :

```ts
        for(const placeHolderType of this.getPlaceHolderTypes())
        {
            const [placeHolder] = this.getObjectContentPieces(placeHolderType);

            if(placeHolder && placeHolder.directory === failed.directory && placeHolder.name === failed.name)
            {
                throw new Error(`Failed to load critical room content: ${failed.name} from ${failed.directory.url}`);
            }
        }

        log.warn(`Failed to load content ${type}: ${failed.name} from ${failed.directory.url}`);
```

8. Supprimer les icônes de contenu, qui sont rendues à la taille 1 (tâche 6) :
   - `_iconAssets`, `_iconListener` et leurs setters (l. 189-195, 237-252) ;
   - `loadThumbnailContent` (l. ~857-905) ;
   - `getObjectUrl` (l. ~833-850) ;
   - les deux lignes de `dispose()` (l. 365-366) ;
   - `iconLoaded` dans `IRoomContentListener.ts`.

   Retirer les imports devenus inutiles (`IAssetLibrary` si plus utilisé : laisser ESLint le dire).

- [ ] **Step 4 : `IsoStage`**

`IIsoStageOptions` gagne :

```ts
    /** Where the room content comes from: the furniture, pets and room .ambreia directories. */
    directories: IRoomContentDirectories;
```

`loader.initialize(new EventEmitter(), {getProperty: …}, options.directories);`.

Corriger le commentaire de `property` : il ne parle plus de `flash.dynamic.download.url`, mais de
`gpu.ignored_furni`, `pet.configuration`…

- [ ] **Step 5 : sandbox**

`sandbox/vite.config.ts` :
- lire `../../vortex-client/public/config.json` s'il existe ;
- `define: {__AMBREIA_ASSET_PACKS__: JSON.stringify(section ?? {})}`, en remplaçant `${url.prefix}`
  par `''` : les URL deviennent `/ambreia/<famille>/`, déjà proxifiées ;
- retirer les proxies `/dcr` et `/gordon`, et garder `/gamedata` et `/ambreia`.

`sandbox/main.ts` :
- supprimer `PROPERTIES`, `key`, `?pack=1` et l'import d'`AssetPacks` ;
- ajouter :

```ts
declare const __AMBREIA_ASSET_PACKS__: IAssetPacksSettings;

// The client's config.json → asset-packs, read by vite.config.ts (key included: a local tool).
const directories = openAssetDirectories(__AMBREIA_ASSET_PACKS__);
```

- `IsoStage.create({… property: () => '', directories, …})` ;
- l'avatar de la sandbox : `clothing: directories.clothing, effects: directories.effects`.

- [ ] **Step 6 : lancer les tests, constater le succès**

Run : `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-iso/test/iso-stage.test.ts`
Attendu : PASS, les tests réseau skippés. Avec les assets construits (tâche 2), relancer avec
`AMBREIA_ASSETS=http://vortex-assets.local` : les tests réseau passent aussi.

- [ ] **Step 7 : `pnpm check` après les tâches 6 à 8**

`RoomEngine` (jeu), `RoomStack` (imager) et `IsoBackdrop` (map editor) appellent `initialize` /
`IsoStage.create`. Le typecheck ne repasse vert qu'avec eux : faire les tâches 6, 7 et 8, puis un
`pnpm check`, puis les commits dans l'ordre 4, 5, 6, 7, 8.

```bash
git commit -m "iso : le contenu de salle lu par famille et nom de pièce, plus d'icônes PNG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- packages/ambreia-iso/src/scene/RoomContentLoader.ts packages/ambreia-iso/src/scene/IRoomContentDirectories.ts packages/ambreia-iso/src/scene/IRoomContentListener.ts packages/ambreia-iso/src/IRoomContentLoader.ts packages/ambreia-iso/src/IsoStage.ts packages/ambreia-iso/test/iso-stage.test.ts packages/ambreia-iso/sandbox/main.ts packages/ambreia-iso/sandbox/vite.config.ts
```

---

### Task 6: `@ambreia/game` — la feature ouvre les cinq dossiers, icônes rendues à la taille 1

**Files :**
- Modify : `packages/ambreia-game/src/features/asset-packs/feature.ts` (réécrit)
- Modify : `packages/ambreia-game/src/features/index.ts` (`IEngineManagers.assetDirectories`, `emptyManagers`, `AvatarRenderer`, `RoomEngines`)
- Modify : `packages/ambreia-game/src/room/RoomEngine.ts`
- Modify : `packages/ambreia-game/src/room/IRoomEngine.ts`
- Modify : `packages/ambreia-game/src/session/FurniIconImageManager.ts`
- Modify : `packages/ambreia-game/test/asset-packs-feature.test.ts` (réécrit)
- Modify : `packages/vortex-client/public/config.example.json` (et le `config.json` local, ignoré par git, à la main)

**Interfaces :**
- Consomme : `openAssetDirectories`, `IAssetDirectories`, `IAssetPacksSettings` (tâche 3) ; `IRoomContentDirectories` (tâche 5) ; options d'avatar (tâche 4).
- Produit :
  - `IEngineManagers.assetDirectories: IAssetDirectories | null` ;
  - `new RoomEngine(context, assets, renderer, directories: () => IRoomContentDirectories | null)`.

- [ ] **Step 1 : réécrire le test de la feature (échec attendu)**

```ts
// packages/ambreia-game/test/asset-packs-feature.test.ts
// The asset-packs feature (spec 2026-10-09-ambreia-everything): once the configuration is loaded it
// opens one .ambreia directory per family for the avatar renderer and the room engine.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ConfigError, loadConfig} from '@ambreia/kernel/config/loadConfig';
import {featureSections} from '@ambreia/kernel/feature/defineFeature';
import {AssetPacksFeature} from '../src/features/asset-packs/feature';
import {emptyManagers} from '../src/features/index';
import type {IEngineHost} from '../src/features/index';

const PROPERTIES: Record<string, string> = {'url.prefix': 'http://assets'};
const ALL = {clothing: '${url.prefix}/ambreia/clothing/', effects: '${url.prefix}/ambreia/effects/', room: '${url.prefix}/ambreia/room/', pets: '${url.prefix}/ambreia/pets/', furniture: '${url.prefix}/ambreia/furniture/'};

function host(initialized: boolean): {host: IEngineHost; complete: () => void}
{
    let onComplete: (() => void) | null = null;
    const configuration = {
        isInitialized: () => initialized,
        getProperty: (key: string) => PROPERTIES[key] ?? '',
        interpolate: (text: string) => text.replace(/\$\{([^}]+)\}/g, (_, key: string) => PROPERTIES[key] ?? ''),
        events: {once: (_event: string, listener: () => void) => { onComplete = listener; }}
    };

    return {host: {made: {...emptyManagers(), configuration}} as unknown as IEngineHost, complete: () => onComplete?.()};
}

const create = (config: Record<string, unknown>, made: IEngineHost): unknown =>
    AssetPacksFeature.create({context: null as never, config: {enabled: true, ...config}, app: {} as never, host: made});

test('the five directories are opened once the configuration completes, ${url.prefix} resolved', () =>
{
    const {host: made, complete} = host(false);

    create(ALL, made);
    assert.equal(made.made.assetDirectories, null);

    complete();

    assert.equal(made.made.assetDirectories?.room.url, 'http://assets/ambreia/room/');
    assert.equal(made.made.assetDirectories?.furniture.url, 'http://assets/ambreia/furniture/');
});

test('a family left out of config.json is an error that names it, and nothing is opened', () =>
{
    const {host: made} = host(true);
    const {pets: _pets, ...withoutPets} = ALL;

    assert.throws(() => create(withoutPets, made), /pets/);
    assert.equal(made.made.assetDirectories, null);
});

test('a misspelt family key is a configuration error, not a silently unused directory', () =>
{
    const sources = [{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}, {name: 'config.json', values: {'asset-packs': {...ALL, furnture: 'x'}}}];

    assert.throws(() => loadConfig(sources, featureSections([AssetPacksFeature])), ConfigError);
});

test('a key that is not 32 bytes of base64url is a configuration error', () =>
{
    const sources = [{name: 'defaults', values: {app: {server: {host: 'ws://test'}}}}, {name: 'config.json', values: {'asset-packs': {...ALL, key: 'too-short'}}}];

    assert.throws(() => loadConfig(sources, featureSections([AssetPacksFeature])), ConfigError);
});
```

Vérifier que le schéma Zod de la feature est bien `strict` : le test « misspelt » existait déjà et
passait, donc oui.

- [ ] **Step 2 : lancer, constater l'échec**

Run : `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-game/test/asset-packs-feature.test.ts`
Attendu : FAIL (`assetDirectories` inconnu).

- [ ] **Step 3 : réécrire la feature**

```ts
// packages/ambreia-game/src/features/asset-packs/feature.ts
import {z} from 'zod';
import {Logger} from '@ambreia/common/utils/Logger';
import {openAssetDirectories, ASSET_FAMILIES} from '@ambreia/common/assets/pack/AssetDirectories';
import type {IAssetPacksSettings} from '@ambreia/common/assets/pack/AssetDirectories';
import type {IGameFeature} from '../GameFeature';

const log = Logger.getLogger('habbo.features.AssetPacks');

/**
 * Every asset family as an .ambreia directory (spec 2026-10-09-ambreia-everything): clothing,
 * effects, room, pets, furniture. Opened once the configuration is loaded (a URL may use its `${…}`
 * variables), before the avatar renderer and the room engine read them from `made.assetDirectories`.
 * There is no .nitro left to fall back on: a family missing from config.json is an error at boot.
 */
export const AssetPacksFeature: IGameFeature = {
    id: 'asset-packs',
    config: z.object({
        ...Object.fromEntries(ASSET_FAMILIES.map(family => [family, z.string().min(1).optional()])),
        /**
         * The master key of encrypted directories (base64url, 32 bytes). Provisional: config.json is
         * public, so this only keeps out a direct look at an URL and the guessing of names; the key
         * belongs in a server message after login (plan 2026-10-08-asset-packs, protection).
         */
        key: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'a 32-byte key in base64url (43 characters)').optional()
    }),
    create: ({config, host}) =>
    {
        const settings = config as IAssetPacksSettings;
        const configuration = host.made.configuration;

        if(!configuration)
        {
            log.error('asset-packs: no configuration — no asset will load');

            return null;
        }

        const open = (): void =>
        {
            try
            {
                host.made.assetDirectories = openAssetDirectories(settings, text => configuration.interpolate(text));
                log.info(`asset-packs: ${ASSET_FAMILIES.map(family => host.made.assetDirectories![family].url).join(', ')}`);
            }
            catch (error)
            {
                log.error(`${(error as Error).message} in config.json: nothing from those families will display`);

                throw error;
            }
        };

        if(configuration.isInitialized()) open();
        else configuration.events.once('complete', open);

        return null;
    }
};
```

Vérifier que le schéma `z.object({...})` reste strict comme avant. Si le kernel applique `.strict()`
lui-même (`featureSections`), rien à faire. Sinon, garder la même forme que l'ancien schéma.

- [ ] **Step 4 : `features/index.ts`**

- `IEngineManagers` :

```ts
    /** One .ambreia directory per asset family (features/asset-packs); null until the configuration completes. */
    assetDirectories: IAssetDirectories | null;
```

- `emptyManagers()` : ajouter `assetDirectories: null`.
- `RoomEngines` : `new RoomEngine(context, host.assets, () => host.renderer(), () => host.made.assetDirectories)`.
- `AvatarRenderer.start()` :

```ts
            const directories = made.assetDirectories;

            if(made.avatarRenderer !== null || configuration === null) return;

            if(directories === null)
            {
                log.error('No .ambreia directories (asset-packs): avatars cannot load');

                return;
            }

            made.avatarRenderer = new AvatarRenderManager({
                assets: host.assets,
                data: host.avatarData,
                clothing: directories.clothing,
                effects: directories.effects,
                onLibraryLoaded: name => Core.instance?.updateLoadingProcess(name, 'complete')
            });
```

`AssetPacksFeature` est avant `AvatarRenderer` dans `GAME_FEATURES` : son écouteur `complete` passe
donc en premier. Vérifier qu'un `log` existe dans `index.ts`, sinon utiliser celui du fichier.

- [ ] **Step 5 : `RoomEngine`**

1. Le constructeur prend un quatrième paramètre, qu'on stocke :

```ts
    // TS-only: the room content's .ambreia directories (spec 2026-10-09-ambreia-everything), read when
    // the content loader starts — after features/asset-packs opened them.
    private readonly _directories: () => IRoomContentDirectories | null;

    constructor(context: IContext, assetLibrary: IAssetLibrary | null = null, renderer: () => Renderer | null = () => null,
        directories: () => IRoomContentDirectories | null = () => null)
```

2. Dans l'initialisation du content loader (l. ~10005-10025) :
   - supprimer `this._contentLoader.iconAssets = this.assets;` et `this._contentLoader.iconListener = this;`
     avec leurs commentaires ;
   - écrire :

```ts
        const directories = this._directories();

        if(directories === null)
        {
            log.error('No .ambreia directories (asset-packs): the room content cannot load');

            return;
        }

        // AS3: var_1634.initialize(events, this)
        this._contentLoader.initialize(this.events, this._configurationManager, directories);
```

   Placer ce bloc **avant** `this._contentLoaderInitialized = true;`, pour qu'un second passage réessaie
   si les dossiers manquaient.

3. Icônes : `getGenericRoomObjectThumbnail` (l. ~7240) devient un rendu à la taille 1. On garde sa
   ligne `// AS3:`, et le corps devient :

```ts
        // DEVIATION: AS3 downloads the catalogue icon PNG (icons/<type>_icon.png). The port renders
        // the furni at scale 1, where its visualization draws the `_icon_` assets of its piece in its
        // variant's colour: the icon PNGs are gone (spec 2026-10-09-ambreia-everything §2).
        return this.getGenericRoomObjectImage(type, param, new Vector3d(), 1, listener, 0, extraData, stuffData);
```

   Renommer `_extraData` / `_stuffData` en `extraData` / `stuffData`. Vérifier l'ordre des paramètres
   de `getGenericRoomObjectImage` à sa déclaration (grep `getGenericRoomObjectImage(`) et adapter.

4. Supprimer :
   - `iconLoaded` (l. ~1880) ;
   - `_pendingThumbnailListeners`, s'il n'a plus de lecteur ;
   - `_thumbnailIdBank` et `THUMBNAIL_ID_POOL_SIZE`, s'ils n'ont plus de lecteur (grep après l'étape 3) ;
   - `getFurnitureIconUrl` et `getWallItemIconUrl` (l. ~2058-2075), avec leurs déclarations dans
     `IRoomEngine.ts`, puisqu'ils lisaient `getObjectUrl`, supprimé à la tâche 5.

   Pour chaque suppression, faire d'abord un grep sur tout `packages/` pour confirmer qu'il n'y a aucun
   appelant (le 2026-10-09 : aucun hors de `RoomEngine.ts`).

- [ ] **Step 6 : `FurniIconImageManager`**

Son téléchargement d'icône lit `flash.dynamic.download.url` + `flash.dynamic.icon.download.name.template`
(l. ~176-190), deux clés qui disparaissent à la tâche 9. Son seul chemin d'entrée est
`requestFurniIconAsset`, sur `RoomObjectFurniIconAssetEvent.LOAD_FURNI_ICON`, qu'aucun objet n'émet
dans le portage (grep le 2026-10-09).

Dans `getFurniIconImageInternal`, remplacer le bloc qui construit `url` et appelle `loadFurniIconImage`
par :

```ts
        // DEVIATION: AS3 downloads icons/<class>_icon.png. Those PNGs are gone (spec
        // 2026-10-09-ambreia-everything §2) and nothing in the port asks for this icon today
        // (no visualization emits LOAD_FURNI_ICON): the placeholder stays.
        log.once(`furni-icon:${assetName}`).warn(`Furni icon ${assetName} asked for: furni icons are the room engine's scale-1 render now`);

        return null;
```

Supprimer `loadFurniIconImage`, `onFurniIconImageReady` et `_loadingInfo` s'ils n'ont plus de
lecteur. `_configuration` aussi, si plus rien ne le lit : voir alors son injection dans
`SessionDataManager` et la retirer.

- [ ] **Step 7 : configuration**

`config.example.json`, section `asset-packs` :

```json
  "asset-packs": {
    "clothing": "${url.prefix}/ambreia/clothing/",
    "effects": "${url.prefix}/ambreia/effects/",
    "room": "${url.prefix}/ambreia/room/",
    "pets": "${url.prefix}/ambreia/pets/",
    "furniture": "${url.prefix}/ambreia/furniture/",
    "key": "<32 octets en base64url : le contenu de C:/laragon/ambreia.key>"
  }
```

Le `config.json` local (ignoré) reçoit les trois mêmes entrées `effects`, `room` et `pets`. Ne pas le
commiter.

- [ ] **Step 8 : lancer les tests, puis `pnpm check` (tâches 4 à 8)**

Run :
- `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-game/test/asset-packs-feature.test.ts`
- puis, une fois les tâches 7 et 8 faites, `pnpm check`.

Attendu : PASS, puis vert. Montrer les dernières lignes.

- [ ] **Step 9 : commit**

```bash
git commit -m "jeu : la feature asset-packs ouvre les cinq familles, icônes rendues à la taille 1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- packages/ambreia-game/src/features/asset-packs/feature.ts packages/ambreia-game/src/features/index.ts packages/ambreia-game/src/room/RoomEngine.ts packages/ambreia-game/src/room/IRoomEngine.ts packages/ambreia-game/src/session/FurniIconImageManager.ts packages/ambreia-game/test/asset-packs-feature.test.ts packages/vortex-client/public/config.example.json
```

Ajouter `SessionDataManager.ts` s'il a été touché à l'étape 6.

---

### Task 7: L'imager lit les familles en `.ambreia`

**Files :**
- Modify : `packages/vortex-imager/src/config.ts` (`assetPacks`, depuis le `config.json` du client)
- Modify : `packages/vortex-imager/src/avatar/AvatarRenderService.ts` (l. ~400-410, getter `assetDirectories`)
- Modify : `packages/vortex-imager/src/room/RoomStack.ts` (`boot(…, directories)`, l. ~96-126)
- Modify : `packages/vortex-imager/src/index.ts` (`bootRooms` passe les dossiers)

**Interfaces :**
- Consomme : `openAssetDirectories`, `IAssetPacksSettings` (tâche 3) ; options d'avatar (tâche 4) ; `initialize(…, directories)` (tâche 5).
- Produit :
  - `IImagerConfig.assetPacks: IAssetPacksSettings` ;
  - `AvatarRenderService.assetDirectories: IAssetDirectories | null` ;
  - `RoomStack.boot(context, assetLibrary, configuration, directories: IRoomContentDirectories)`.

- [ ] **Step 1 : `config.ts`**

```ts
    /**
	 * The client's config.json → `asset-packs`: the families' .ambreia directories and their key. The
	 * same file the client reads, so the imager never renders from other assets than the game.
	 */
    assetPacks: IAssetPacksSettings;
```

Lecture : `env('IMAGER_CLIENT_CONFIG', resolve(HERE, '../../vortex-client/public/config.json'))`, puis
`JSON.parse(readFileSync(...))['asset-packs'] ?? {}`. Un fichier absent donne une erreur au démarrage :
`IMAGER_CLIENT_CONFIG: <chemin> introuvable — copie config.example.json et remplis asset-packs`.

- [ ] **Step 2 : `AvatarRenderService`**

Après `createConfiguration` :

```ts
        // `${url.prefix}` is the asset host here (createConfiguration), as in the client.
        const directories = openAssetDirectories(this._config.assetPacks, text => configuration.interpolate(text));

        this._assetDirectories = directories;
```

Puis `new AvatarRenderManager({assets, data: …, clothing: directories.clothing, effects: directories.effects})`.

Supprimer la ligne `log.debug('Avatar libraries: …flash.dynamic…')`, et logger plutôt les URL des deux
dossiers. Ajouter le getter `get assetDirectories(): IAssetDirectories | null`.

Vérifier que `HabboConfigurationManager.interpolate` est public (l. ~170). Sinon, utiliser `getProperty`
sur une clé temporaire, ou remplacer `${url.prefix}` à la main par `this._config.assetsBaseUrl`.

- [ ] **Step 3 : `RoomStack` et `index.ts`**

- `RoomStack.boot(context, assetLibrary, configuration, directories: IRoomContentDirectories)` ;
- `contentLoader.initialize(new EventEmitter(), configuration, directories);` ;
- dans `index.ts` → `bootRooms()`, lire `avatars.assetDirectories`. S'il vaut null, le dire en `error`
  et renvoyer null : les routes répondent 503, comme pour une autre panne de boot.

- [ ] **Step 4 : vérifier à la main (assets de la tâche 2 construits)**

Lancer l'imager (`pnpm dev`), puis :

```bash
curl -s -o /tmp/a.png "http://127.0.0.1:8081/habbo-imaging/avatarimage?figure=hd-180-1.ch-210-66.lg-270-82&size=l"
curl -s -o /tmp/f.png "http://127.0.0.1:8081/habbo-imaging/furniture?class=chair_polyfon"
curl -s -o /tmp/i.png "http://127.0.0.1:8081/habbo-imaging/furniture?class=sofa_silo*2&size=icon"
```

Ouvrir les trois PNG avec Read : un avatar habillé, une chaise, l'icône colorée.

Ne pas utiliser `IMAGER_CACHE_DIR` pour cette vérification : un rendu en cache disque ne prouverait
rien. Désactiver le cache, ou changer de figure.

Dans le terminal de l'imager : aucune URL `.nitro`.

- [ ] **Step 5 : commit (après le `pnpm check` des tâches 4 à 8)**

```bash
git commit -m "imager : avatars, mobis, pets et salle lus dans les dossiers .ambreia du client

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- packages/vortex-imager/src/config.ts packages/vortex-imager/src/avatar/AvatarRenderService.ts packages/vortex-imager/src/room/RoomStack.ts packages/vortex-imager/src/index.ts
```

---

### Task 8: Map editor — salle en `.ambreia`, vignettes par l'imager

**Files :**
- Modify : `packages/ambreia-map-editor/src/view/IsoBackdrop.ts` (`PROPERTIES` l. ~28-35, `IsoStage.create` l. ~76)
- Modify : `packages/ambreia-map-editor/src/view/FurnitureSprites.ts` (`thumbnail()`, l. ~34-41)
- Modify : `packages/ambreia-map-editor/vite.config.ts`
- Modify : `packages/ambreia-map-editor/src/vite-env.d.ts`
- Test : `packages/ambreia-map-editor/test/` : ajouter un test de `FurnitureSprites.thumbnail` s'il existe un dossier de tests TS que `pnpm test` ramasse ; sinon, vérification manuelle (étape 4).

Le propriétaire a du travail non commité dans `IsoBackdrop.ts` sur sa copie principale. Dans le
worktree, la fusion se fera plus tard. Ne toucher qu'au bloc `PROPERTIES` et à l'appel `create`.

**Interfaces :**
- Consomme : `openAssetDirectories` (tâche 3), `IIsoStageOptions.directories` (tâche 5), `size=icon` (tâche 1).

- [ ] **Step 1 : `vite.config.ts` et `vite-env.d.ts`**

Dans `vite.config.ts` :
- lire `../vortex-client/public/config.json` s'il existe ;
- `define: {__AMBREIA_ASSET_PACKS__: JSON.stringify(section ?? {})}`, en remplaçant `${url.prefix}`
  par `''` ;
- ajouter le proxy `'/ambreia': {target: process.env.AMBREIA_ASSETS ?? 'http://vortex-assets.local', changeOrigin: true}` ;
- retirer `/dcr` et `/gordon`.

Dans `vite-env.d.ts` :

```ts
/** The client's config.json → asset-packs (vite.config.ts): the .ambreia directories and their key. */
declare const __AMBREIA_ASSET_PACKS__: import('@ambreia/common/assets/pack/AssetDirectories').IAssetPacksSettings;
```

Tauri en build : si le map editor est un jour construit pour Tauri, la clé sera embarquée dans le
binaire. C'est accepté pour un outil local, et l'en-tête de `vite.config.ts` le dit.

- [ ] **Step 2 : `IsoBackdrop.ts`**

- retirer les entrées `flash.dynamic.*` et `pet.dynamic.*` de `PROPERTIES` (garder les autres s'il y en
  a, par exemple l. 32) ;
- dans `create()` : `directories: openAssetDirectories(__AMBREIA_ASSET_PACKS__)` dans les options de
  `IsoStage.create`.

`openAssetDirectories` peut lever une erreur (famille absente). Elle tombe dans le `catch` existant,
qui logge en `warn`, et l'éditeur dessine la salle sans l'iso. C'est le comportement voulu.

- [ ] **Step 3 : `FurnitureSprites.thumbnail()`**

```ts
    /**
     * The catalogue's small picture of a furni: the imager's render at scale 1, which draws the
     * furni's `_icon_` assets in its variant's colour (the hotel's icon PNGs are gone, spec
     * 2026-10-09-ambreia-everything §3). Cached by the imager on disk.
     */
    static thumbnail(className: string): string
    {
        return `${IMAGING}/furniture?class=${encodeURIComponent(className)}&size=icon`;
    }
```

- [ ] **Step 4 : vérifier à la main**

Lancer le map editor (`pnpm --filter @ambreia/map-editor dev`, voir son `package.json`), ouvrir une zone
avec du décor et le panneau Décor. Attendu :
- la vue isométrique affiche les mobis ;
- les vignettes du panneau sont des icônes ;
- l'onglet réseau ne montre aucun `.nitro` ni `/dcr/hof_furni/icons/`.

Prendre une capture.

- [ ] **Step 5 : `pnpm check` (tâches 4 à 8), puis les commits dans l'ordre 4, 5, 6, 7, 8**

```bash
git commit -m "map editor : salle en .ambreia et vignettes rendues par l'imager

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- packages/ambreia-map-editor/src/view/IsoBackdrop.ts packages/ambreia-map-editor/src/view/FurnitureSprites.ts packages/ambreia-map-editor/vite.config.ts packages/ambreia-map-editor/src/vite-env.d.ts
```

---

### Task 9: Retrait de l'ancien chemin `.nitro`

**Files :**
- Delete : `packages/ambreia-common/src/assets/loaders/NitroBundleLoader.ts`
- Delete : `packages/ambreia-common/src/assets/pack/AssetPacks.ts`
- Modify : `packages/ambreia-common/src/assets/AssetLibrary.ts` (déclaration `application/x-nitro-bundle`, branche `instanceof`)
- Modify : `packages/ambreia-common/src/assets/NitroAsset.ts` (n'accepte plus qu'`AmbreiaPieceLoader`)
- Modify : `packages/ambreia-common/src/assets/loaders/index.ts`
- Modify : `packages/ambreia-common/test/asset-pack.test.ts` (tests `AssetPacks` / `NitroBundleLoader` retirés)
- Modify : `packages/ambreia-common/src/assets/pack/AmbreiaDirectory.ts` (commentaires « the .nitro files load »)
- Modify : `packages/ambreia-game/src/configuration/legacy.defaults.json` (7 clés)
- Modify : `packages/ambreia-game/src/configuration/enum/HabboProperty.ts` (`DYNAMIC_DOWNLOAD_*`, `DYNAMIC_AVATAR_DOWNLOAD_URL`)
- Modify : `packages/ambreia-iso/src/scene/IRoomContentConfiguration.ts`, `packages/ambreia-game/src/room/RoomEngine.ts` (commentaire l. ~7922 qui nomme `NitroBundleLoader`)

- [ ] **Step 1 : vérifier qu'il ne reste aucun lecteur**

```bash
grep -rn "NitroBundleLoader\|AssetPacks\b\|x-nitro-bundle\|flash\.dynamic\.\(avatar\.\)\?download\|flash\.dynamic\.icon\|pet\.dynamic\.download\|DYNAMIC_DOWNLOAD\|DYNAMIC_AVATAR_DOWNLOAD_URL" packages --include=*.ts --include=*.mjs --include=*.json | grep -v node_modules
```

Attendu : seulement les fichiers listés ci-dessus. Un autre lecteur se fait passer en `.ambreia` avant
de continuer. `DYNAMIC_AVATAR_DOWNLOAD_CONFIGURATION` n'est pas concerné : regarder s'il a un lecteur,
et ne le retirer que s'il n'en a aucun.

- [ ] **Step 2 : retirer**

- supprimer les deux fichiers (`git rm` par chemin, depuis la racine du worktree) ;
- retirer :
  - la déclaration `application/x-nitro-bundle` ;
  - les `|| … instanceof NitroBundleLoader` ;
  - l'export ;
  - les 7 clés de `legacy.defaults.json` (`flash.dynamic.avatar.download.name.template`,
    `flash.dynamic.avatar.download.url`, `flash.dynamic.download.name.template`,
    `flash.dynamic.download.url`, `flash.dynamic.icon.download.name.template`,
    `pet.dynamic.download.name.template`, `pet.dynamic.download.url`) ;
  - les constantes de `HabboProperty`.
- `flash.client.url` reste : `DiskCache` de l'imager et la démo de communication le lisent.

Dans `asset-pack.test.ts`, retirer les tests qui montent `AssetPacks` ou instancient `NitroBundleLoader` :

- « a mounted directory answers… » ;
- « NitroBundleLoader reads… » ;
- « a piece missing from the mounted directory loads from its .nitro… » ;
- « a piece that downloads but does not decode falls back… ».

Supprimer aussi le helper `loadThroughLoader` et les imports devenus inutiles.

Renommer les titres qui parlent encore de `.nitro` :
- « a directory without its descriptor is unusable: every piece loads from its .nitro » → « … is
  unusable » ;
- « …without the key… : the .nitro files load » → « … is unusable ».

- [ ] **Step 3 : `pnpm check`**

Attendu : vert. Montrer les dernières lignes.

- [ ] **Step 4 : commit**

```bash
git commit -m "assets : plus aucun .nitro — NitroBundleLoader, AssetPacks et les clés de téléchargement retirés

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- packages/ambreia-common/src/assets/loaders/NitroBundleLoader.ts packages/ambreia-common/src/assets/pack/AssetPacks.ts packages/ambreia-common/src/assets/AssetLibrary.ts packages/ambreia-common/src/assets/NitroAsset.ts packages/ambreia-common/src/assets/loaders/index.ts packages/ambreia-common/src/assets/pack/AmbreiaDirectory.ts packages/ambreia-common/test/asset-pack.test.ts packages/ambreia-game/src/configuration/legacy.defaults.json packages/ambreia-game/src/configuration/enum/HabboProperty.ts packages/ambreia-iso/src/scene/IRoomContentConfiguration.ts packages/ambreia-game/src/room/RoomEngine.ts
```

---

### Task 10: Docs et vérification dans le client

**Files :**
- Modify : `.claude/rules/assets.md` (puce « `.ambreia` directories » et puce « Encrypted »)
- Modify : `docs/superpowers/plans/2026-10-08-asset-packs.bilan.md` (une ligne de renvoi en tête)
- Regenerate : `AGENTS.md`, `copilot-instructions.md` (`pnpm sync:agents`)

- [ ] **Step 1 : `.claude/rules/assets.md`**

Remplacer la puce « **`.ambreia` directories stand in for directories of `.nitro`** … falls back to the
`.nitro` when it is missing … » par :

```md
- **Every asset family is an `.ambreia` directory, and nothing reads a `.nitro`** (spec
  `docs/superpowers/specs/2026-10-09-ambreia-everything-design.md`): `ambreia/{clothing,effects,room,pets,furniture}/`
  on the asset server, one `<name>.ambreia` per bundle, images used by several pieces once in
  `images/<sha1>`, the manifests deflated with `dictionary/<id>.bin`, `ambreia.json` at the root. The
  `.nitro` sources live outside anything served (`C:/laragon/ambreia-sources/<family>/`, filled by
  `tools/gather-ambreia-sources.mjs`); `build:ambreia:all` builds the five families
  (`build-ambreia.ts`, incremental, every piece checked) and writes `.ambreia-build/coverage.json`
  (figure-map and effect-map libraries, pets, room bundles with no piece; a missing `hh_*` or room
  bundle fails it). The `asset-packs` feature opens the five directories from `config.json` →
  `asset-packs.{clothing,effects,room,pets,furniture,key}` (all required) into
  `made.assetDirectories`; the avatar renderer and `RoomContentLoader` load pieces with
  `AssetLibrary.loadPiece(name, directory)`. A missing piece warns once and does not display. Furni
  icons are the furni rendered at scale 1 (its `_icon_` assets); tools get them from the imager
  (`/habbo-imaging/furniture?class=…&size=icon`). The imager, the iso sandbox and the map editor read
  the same `config.json` section.
```

Dans la puce « Encrypted `.ambreia` directories », remplacer « the client gets it from
`asset-packs.key` » par « the client, the imager and the dev tools get it from `config.json` →
`asset-packs.key` ».

- [ ] **Step 2 : bilan du 2026-10-08**

Sous le titre, ajouter :
`> **Suite (2026-10-09) :** toutes les familles en .ambreia et plus aucun .nitro, voir docs/superpowers/specs/2026-10-09-ambreia-everything-design.md.`

- [ ] **Step 3 : `pnpm sync:agents`, puis `pnpm check`**

Attendu : vert. Montrer les dernières lignes.

- [ ] **Step 4 : vérifier dans le client (skill `run-vortex-client`)**

Avec les cinq dossiers construits (tâche 2) et `config.json` à jour (tâche 6) :
1. Charger le client, entrer dans une zone.
2. Captures :
   - la salle ;
   - l'avatar habillé ;
   - une danse (effet) ;
   - un pet, s'il y en a un dans une zone accessible, sinon le dire ;
   - un mobi posé (l'aperçu de pose montre une icône ; prendre une variante de couleur si possible).
3. Réseau, d'après les requêtes du skill :
   - **aucune** URL en `.nitro`, aucune vers `/dcr/hof_furni/icons/` ;
   - les 404 sur `ambreia/*` ne correspondent qu'aux manques de `.ambreia-build/coverage.json`.
4. Console : aucun `error` d'asset-packs.
5. Comparer avec des captures prises **avant**. Pour cela, en tout début d'exécution, prendre ces
   mêmes captures sur `master` (copie principale du propriétaire, sans rien modifier).

Écrire dans le rapport ce qui n'a pas pu être vérifié (pet absent, etc.).

- [ ] **Step 5 : commit**

```bash
git commit -m "docs : tout en .ambreia (règle assets, renvoi depuis le bilan du 2026-10-08)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- .claude/rules/assets.md docs/superpowers/plans/2026-10-08-asset-packs.bilan.md AGENTS.md copilot-instructions.md
```

Vérifier les chemins réels des fichiers générés par `sync:agents` avec `git status`.

---

### Task 11: Retrait des anciens dossiers servis (accord du propriétaire requis)

Rien n'est supprimé dans cette tâche sans un « oui » explicite du propriétaire **sur la liste exacte**.

- [ ] **Step 1 : vérifier que plus rien ne lit ces dossiers**

```bash
grep -rn "gordon/\|dcr/hof_furni\|hof_furni" packages --include=*.ts --include=*.mjs --include=*.json --include=*.html | grep -v node_modules
```

Attendu : plus aucun chemin de chargement. Les commentaires historiques sont tolérés : les lister au
propriétaire.

Pour les fichiers de gordon qui ne sont pas des `.nitro`, vérifier un par un qu'aucun lecteur n'existe
(grep du nom) : `effectmap.xml`, `HabboAvatarActions.xml`, `web.config`.

- [ ] **Step 2 : proposer la liste exacte, avec les tailles**

Présenter au propriétaire, avec `du -sh` pour chaque ligne :
- `C:/laragon/www/vortex-assets/gordon/vortex-assets-PRODUCTION-202601121522-867048149/` ;
- `C:/laragon/www/vortex-assets/dcr/hof_furni/*.nitro` et `dcr/hof_furni/icons/` (`mp3/` reste) ;
- `C:/laragon/www/vortex-assets/ambreia-old-clothing/` et `ambreia-old-furniture/` (mis de côté à la
  tâche 2).

Rappeler que les sources sont dans `C:/laragon/ambreia-sources/`, et `Desktop/clothing` toujours sur
le Bureau.

- [ ] **Step 3 : seulement après le « oui »**

Supprimer exactement la liste approuvée, puis recharger le client une fois (tâche 10, étape 4, en
version courte : salle + avatar + réseau) pour confirmer que rien ne manque.

- [ ] **Step 4 : mémoire**

Mettre à jour la mémoire `idea-ambreia-asset-packs.md` : cinq familles, sources hors `www`, plus aucun
`.nitro`. Reste dû : la clé envoyée par le serveur, les 498 libs et les 23 effets.
