# J1 — `@vortex/common` + `@vortex/net` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** sortir du moteur les deux premiers paquets autonomes — `@vortex/common` (utilitaires, logger,
chargement d'assets, réactif) et `@vortex/net` (transport, chiffrement, format filaire, registre) — et
donner à `net` son point d'écoute et d'injection pour l'inspecteur de paquets.

**Architecture :** deux paquets de workspace (`packages/vortex-common`, `packages/vortex-net`) consommés
par leurs sources TypeScript via `exports` (`"./*": "./src/*.ts"`) : pas d'étape de build, pas d'alias
à recopier dans cinq configs. Les fichiers sont déplacés par `git mv` et les ~1 070 imports réécrits par
un codemod testé (`move-modules.mjs`), réutilisable pour J2–J6. Ce qui dépend du DI (`AssetLibrary`,
`AssetLibraryCollection`, `CoreCommunicationManager`) reste dans le moteur, qui enveloppe les paquets.

**Tech Stack :** pnpm 11 workspaces, TypeScript 5 (`moduleResolution: bundler`), esbuild (bundle de
dev), Vite 6, ESLint 10 (`no-restricted-imports`), `node:test` + `tsx`.

**Spec :** `docs/superpowers/specs/2026-10-07-client-architecture-design.md` (§3 règles des paquets,
§6 réseau, §8 points d'accroche, §9 jalon J1, §11 test propre de J1, §12 décision ouverte n° 2).

## Global Constraints

- « À la fin de chaque jalon, le client compile, démarre et on entre dans une room. » (§9)
- « Les moteurs (`common`, `net`, `avatar`, `iso`, `ui`) n'importent jamais `kernel`, `protocol` ni
  `game`. Ils n'utilisent pas le DI : classes à constructeur simple, dépendances passées en paramètre. » (§3)
- `@vortex/common` vient de `core/utils`, `core/assets`, `core/reactive` ; `@vortex/net` de
  `core/communication`, « tel quel (connexion, chiffrement, format, registre) ». (§3, §6)
- J1 preuve : « `pnpm build`, `pnpm dev` OK, rechargement dev pas plus lent qu'avant ». (§9)
- J1 test propre : « Aller-retour écrivain/lecteur du format filaire (int, short, string, booléen,
  liste) ». (§11)
- « `net` expose l'écoute, la modification et l'injection de paquets (activé en dev seulement) ». (§8)
- Les outils de développement ne sont pas dans le build de production. (§7 règle 6)
- Commit par chemins explicites (`git commit -m … -- <chemins>`), jamais de `git commit` nu ; une
  suppression ou un déplacement de masse passe par une liste vérifiée depuis la racine.
- `pnpm check` vert avant chaque commit ; les fichiers `*.generated.ts`, `sources/**`, `.vortex-dev/`
  ne s'éditent pas.
- Les traces `// AS3:` voyagent avec le code déplacé (règle `30-as3-traceability.md`).

## Décisions prises par ce plan

| # | Décision | Pourquoi |
|---|---|---|
| D1 | **Un seul esbuild** pour tous les paquets dans le bundle de dev (§12 n° 2) | Un seul graphe = une seule instance de `Logger`, `FrameTimings`, `ErrorReportStorage` ; `outbase` passe à `packages/`. Un esbuild par paquet dupliquerait ces singletons ou demanderait des externals croisés. |
| D2 | Paquets consommés **par leurs sources** via `exports` | Même modèle que `vortex-engine` (`main: src/index.ts`) ; Vite, esbuild, tsc (`bundler`) et tsx le résolvent tous ; aucune liste d'alias à maintenir. |
| D3 | **Chemins profonds uniquement** (`@vortex/common/utils/Logger`), pas de baril racine | J2 demande des « imports `@vortex/common` ciblés (pas tous les chargeurs) ». Un baril de dossier s'importe par `…/utils/index`. |
| D4 | `AssetLibrary`, `AssetLibraryCollection` (des `Component`) et `CoreCommunicationManager` + son interface **restent dans le moteur** ; leurs barils `core/assets/index.ts` et `core/communication/index.ts` aussi | Règle §3 : pas de DI dans un moteur. Les rendre autonomes demande un fournisseur d'assets injecté — c'est le travail de J2 (avatar) et J5 (kernel). |
| D5 | `IDisposable` descend dans `@vortex/common` | C'est la seule autre dépendance du code déplacé vers `core/runtime`. |
| D6 | Le point d'écoute est une **API** de `IConnection` (`setPacketTap`, `injectIncoming`) ; rien ne l'active en production | L'inspecteur (outil de dev, §8) l'installera ; le build de production ne contient aucun outil (§7.6). |

## Review Focus

1. **Deux instances d'un singleton de `common`** : un fichier client qui importe `@vortex/common/…`
   directement, servi par Vite à côté du bundle esbuild qui en contient une copie → niveaux de log ou
   compteurs de frame séparés. Attendu : une seule instance. Pin : Task 3, step 9 (zéro requête vers
   `vortex-common/src` en dev).
2. **Glaze ou l'imager ne résolvent plus `@vortex/*`** (pnpm strict : dépendance non déclarée).
   Attendu : les deux construisent. Pin : Task 3 step 9 et Task 4 step 8 (`pnpm --filter vortex-glaze
   build`, `pnpm imager:build`).
3. **Un fichier déplacé importe encore le moteur** (codemod incomplet, import relatif oublié).
   Attendu : refus. Pin : `tsc` autonome de chaque paquet (Task 3 step 7, Task 4 step 6) + murs ESLint.
4. **Une injection fait avancer le flux RC4** et désynchronise la vraie connexion. Attendu : un message
   injecté n'est jamais déchiffré. Pin : Task 5, test `an injected message is never deciphered`.
5. **Le rechargement de dev ralentit** (bundle plus gros, plus d'entrées). Attendu : pas plus lent.
   Pin : Task 6 step 2, mesuré contre la base de Task 0.

---

### Task 0 : Préparation et mesures de référence

**Files :** aucun fichier du dépôt ; ledger `.superpowers/sdd/2026-10-07-j1-common-net/progress.md`.

- [ ] **Step 1 :** depuis `master` propre (`git status --porcelain` vide), créer la branche :
  `git checkout -b j1-common-net`.
- [ ] **Step 2 :** `pnpm check` et `pnpm build` verts ; noter dans le ledger le nombre de tests.
- [ ] **Step 3 : mesure du dev.** Lancer `pnpm dev` en arrière-plan, attendre `http://localhost:5173/client/`,
  puis :

```bash
node .claude/skills/run-vortex-client/driver.mjs "goto http://localhost:5173/client/" "wait 6000" \
  "eval JSON.stringify({load: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd), requests: performance.getEntriesByType('resource').length})" \
  "goto http://localhost:5173/client/" "wait 6000" \
  "eval JSON.stringify({load: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd), requests: performance.getEntriesByType('resource').length})"
```

  Expected : deux objets `{load, requests}` (froid puis rechargement). Les écrire au ledger comme base.
  Arrêter `pnpm dev` (et l'imager qu'il lance sur :8081).

---

### Task 1 : Le codemod `move-modules.mjs` (testé)

**Files :**
- Create : `packages/vortex-engine/tools/move-modules.mjs`
- Test : `packages/vortex-engine/tools/move-modules.test.mjs`

**Interfaces :**
- Produces : `planMoves({root, scan, aliases, moves}) → {rewrites: Map<string, {spec: string, next: string}[]>, violations: {file, spec, target}[], moved: [string, string][]}` ;
  `applyMoves(root, plan)` (réécrit puis `git mv`) ; CLI `node packages/vortex-engine/tools/move-modules.mjs <moves.json> [--apply]`.
- Un `move` vaut `{from, to, specifier, except?}` : `from`/`to` sont des chemins depuis la racine
  (fichier ou dossier), `specifier` le nom sous lequel la cible s'importe après le déplacement
  (`@vortex/common/utils` pour un dossier, `@vortex/common/IDisposable` pour un fichier), `except` des
  chemins sous `from` qui restent.

- [ ] **Step 1 : écrire le test.**

```js
// packages/vortex-engine/tools/move-modules.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planMoves } from './move-modules.mjs';

function project(files)
{
    const root = mkdtempSync(join(tmpdir(), 'move-'));
    for(const [path, text] of Object.entries(files))
    {
        mkdirSync(join(root, path, '..'), { recursive: true });
        writeFileSync(join(root, path), text);
    }
    return root;
}

const ALIASES = { '@core': 'eng/src/core' };
const MOVES = [{ from: 'eng/src/core/utils', to: 'common/src/utils', specifier: '@c/utils', except: ['eng/src/core/utils/Stay.ts'] }];
const plan = files => planMoves({ root: project(files), scan: ['eng/src', 'common/src'], aliases: ALIASES, moves: MOVES });
const next = (p, file) => (p.rewrites.get(file) ?? []).map(r => `${r.spec} -> ${r.next}`);

test('an alias import of a moved file becomes the package specifier', () =>
{
    const p = plan({
        'eng/src/a.ts': "import {Logger} from '@core/utils/Logger';\n",
        'eng/src/core/utils/Logger.ts': 'export class Logger {}\n'
    });

    assert.deepEqual(next(p, 'eng/src/a.ts'), ['@core/utils/Logger -> @c/utils/Logger']);
});

test('a relative import from a staying file is rewritten, type and re-export forms included', () =>
{
    const p = plan({
        'eng/src/core/window/W.ts': "import type {L} from '../utils/Logger';\nexport * from '../utils/Logger';\nvoid import('../utils/Logger');\n",
        'eng/src/core/utils/Logger.ts': 'export class L {}\n'
    });

    assert.deepEqual(next(p, 'eng/src/core/window/W.ts'), [
        '../utils/Logger -> @c/utils/Logger', '../utils/Logger -> @c/utils/Logger', '../utils/Logger -> @c/utils/Logger'
    ]);
});

test('relative imports inside the moved folder are left alone; an alias one becomes relative', () =>
{
    const p = plan({
        'eng/src/core/utils/A.ts': "import {B} from './B';\nimport {C} from '@core/utils/sub/C';\n",
        'eng/src/core/utils/B.ts': 'export class B {}\n',
        'eng/src/core/utils/sub/C.ts': 'export class C {}\n'
    });

    assert.deepEqual(next(p, 'eng/src/core/utils/A.ts'), ['@core/utils/sub/C -> ./sub/C']);
});

test('a barrel keeps its explicit /index so the package exports pattern resolves it', () =>
{
    const p = plan({
        'eng/src/core/index.ts': "export * from './utils';\n",
        'eng/src/core/utils/index.ts': "export * from './B';\n",
        'eng/src/core/utils/B.ts': 'export class B {}\n'
    });

    assert.deepEqual(next(p, 'eng/src/core/index.ts'), ['./utils -> @c/utils/index']);
});

test('a moved file that imports a staying file is a violation, and except keeps a file home', () =>
{
    const p = plan({
        'eng/src/core/utils/A.ts': "import {S} from './Stay';\nimport {R} from '../runtime/R';\n",
        'eng/src/core/utils/Stay.ts': 'export class S {}\n',
        'eng/src/core/runtime/R.ts': 'export class R {}\n'
    });

    assert.deepEqual(p.violations.map(v => v.spec), ['./Stay', '../runtime/R']);
    assert.ok(!p.moved.some(([from]) => from.endsWith('Stay.ts')));
});

test('a single-file move maps to its full specifier', () =>
{
    const p = planMoves({
        root: project({
            'eng/src/core/runtime/IDisposable.ts': 'export interface IDisposable {}\n',
            'eng/src/core/runtime/index.ts': "export type {IDisposable} from './IDisposable';\n"
        }),
        scan: ['eng/src'],
        aliases: ALIASES,
        moves: [{ from: 'eng/src/core/runtime/IDisposable.ts', to: 'common/src/IDisposable.ts', specifier: '@c/IDisposable' }]
    });

    assert.deepEqual(next(p, 'eng/src/core/runtime/index.ts'), ['./IDisposable -> @c/IDisposable']);
    assert.deepEqual(p.moved, [['eng/src/core/runtime/IDisposable.ts', 'common/src/IDisposable.ts']]);
});
```

- [ ] **Step 2 :** `node --test packages/vortex-engine/tools/move-modules.test.mjs` → FAIL
  (`Cannot find module …/move-modules.mjs`).

- [ ] **Step 3 : l'outil.**

```js
#!/usr/bin/env node
// Moves source files to another package and rewrites every import that reaches them, so an
// extraction milestone (spec §9) is one reviewed command instead of a thousand hand edits.
// Usage, from the repo root: node packages/vortex-engine/tools/move-modules.mjs <moves.json> [--apply]
// Without --apply it only reports. A violation (a moved file importing one that stays) blocks --apply.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const posix = p => p.split(path.sep).join('/');
const stripTs = p => p.replace(/\.ts$/, '');
// `import … from`, `export … from`, `import('…')` and the bare side-effect `import '…'`.
const SPEC_RE = /(\b(?:import|export)\b[^'";]*?\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"]+)\2/g;

function resolveSpec(root, fromFile, spec, aliases)
{
    let base = null;
    const alias = Object.keys(aliases).find(a => spec === a || spec.startsWith(a + '/'));

    if(alias) base = path.join(root, aliases[alias] + spec.slice(alias.length));
    else if(spec.startsWith('.')) base = path.resolve(path.dirname(path.join(root, fromFile)), spec);

    if(!base) return null;

    for(const candidate of [base + '.ts', path.join(base, 'index.ts')])
    {
        if(fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return posix(path.relative(root, candidate));
    }

    return null;
}

function listFiles(root, dir)
{
    const out = [];
    const abs = path.join(root, dir);

    if(!fs.existsSync(abs)) return out;

    for(const e of fs.readdirSync(abs, { withFileTypes: true }))
    {
        const rel = posix(path.join(dir, e.name));

        if(e.isDirectory())
        {
            if(!['node_modules', 'assets', '.vortex-dev'].includes(e.name)) out.push(...listFiles(root, rel));
        }
        else if(rel.endsWith('.ts') && !rel.endsWith('.d.ts')) out.push(rel);
    }

    return out;
}

export function planMoves({ root, scan, aliases, moves })
{
    const groupOf = file => moves.findIndex(m =>
        (file === m.from || file.startsWith(m.from + '/')) && !(m.except ?? []).includes(file));
    const newPath = file =>
    {
        const g = groupOf(file);
        return g < 0 ? file : moves[g].to + file.slice(moves[g].from.length);
    };
    const specifierFor = target =>
    {
        const m = moves[groupOf(target)];
        return m.specifier + stripTs(newPath(target)).slice(stripTs(m.to).length);
    };
    const relativeTo = (file, target) =>
    {
        const rel = posix(path.relative(path.dirname(newPath(file)), stripTs(newPath(target))));
        return rel.startsWith('.') ? rel : './' + rel;
    };

    const rewrites = new Map();
    const violations = [];
    const files = [...new Set(scan.flatMap(dir => listFiles(root, dir)))];

    for(const file of files)
    {
        const text = fs.readFileSync(path.join(root, file), 'utf8');
        const gFile = groupOf(file);

        for(const m of text.matchAll(SPEC_RE))
        {
            const spec = m[3];
            const target = resolveSpec(root, file, spec, aliases);

            if(target === null) continue;

            const gTarget = groupOf(target);
            let next = null;

            if(gTarget < 0)
            {
                if(gFile >= 0) violations.push({ file, spec, target });
                continue;
            }

            if(gFile === gTarget) next = spec.startsWith('.') ? null : relativeTo(file, target);
            else next = specifierFor(target);

            if(next !== null && next !== spec)
            {
                if(!rewrites.has(file)) rewrites.set(file, []);
                rewrites.get(file).push({ spec, next });
            }
        }
    }

    const moved = files.filter(f => groupOf(f) >= 0).map(f => [f, newPath(f)]);

    return { rewrites, violations, moved };
}

export function applyMoves(root, plan)
{
    for(const [file, list] of plan.rewrites)
    {
        const abs = path.join(root, file);
        const queue = [...list];
        const text = fs.readFileSync(abs, 'utf8').replace(SPEC_RE, (whole, head, quote, spec) =>
        {
            const i = queue.findIndex(r => r.spec === spec);
            if(i < 0) return whole;
            const [r] = queue.splice(i, 1);
            return `${head}${quote}${r.next}${quote}`;
        });

        fs.writeFileSync(abs, text);
    }

    for(const [from, to] of plan.moved)
    {
        fs.mkdirSync(path.dirname(path.join(root, to)), { recursive: true });
        execFileSync('git', ['mv', from, to], { cwd: root });
    }
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const root = process.cwd();
    const E = 'packages/vortex-engine/src';
    const C = 'packages/vortex-client/src';
    const moves = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const plan = planMoves({
        root,
        moves,
        scan: [E, 'packages/vortex-engine/test', C, 'packages/vortex-glaze/src', 'packages/vortex-imager/src', 'packages/vortex-common/src', 'packages/vortex-net/src'],
        aliases: { '@core': `${E}/core`, '@habbo': `${E}/habbo`, '@room': `${E}/room`, '@iid': `${E}/iid`, '@ui': C, '@': C, '@client': C }
    });
    const count = [...plan.rewrites.values()].reduce((n, l) => n + l.length, 0);

    for(const v of plan.violations) console.log(`VIOLATION ${v.file}: '${v.spec}' -> ${v.target} stays behind`);
    console.log(`${count} import(s) to rewrite in ${plan.rewrites.size} file(s); ${plan.moved.length} file(s) to move; ${plan.violations.length} violation(s)`);

    if(process.argv.includes('--apply'))
    {
        if(plan.violations.length > 0) process.exit(1);
        applyMoves(root, plan);
        console.log('applied');
    }
}
```

- [ ] **Step 4 :** `node --test packages/vortex-engine/tools/move-modules.test.mjs` → PASS 6/6 ;
  `node node_modules/eslint/bin/eslint.js packages/vortex-engine/tools/move-modules.mjs` sans erreur ;
  `pnpm test` vert.
- [ ] **Step 5 : commit.**

```bash
git add packages/vortex-engine/tools/move-modules.mjs packages/vortex-engine/tools/move-modules.test.mjs
git commit -m "j1: codemod move-modules (déplace des fichiers et réécrit leurs imports)" -- packages/vortex-engine/tools/move-modules.mjs packages/vortex-engine/tools/move-modules.test.mjs
```

---

### Task 2 : Murs ESLint des deux paquets (tests d'abord)

**Files :**
- Modify : `packages/vortex-engine/tools/boundaries.test.mjs` (ajouts en fin de fichier)
- Modify : `eslint.config.mjs` (deux blocs avant le bloc `files: ['**/*.mjs']`)

- [ ] **Step 1 : tests.** Ajouter à `boundaries.test.mjs` :

```js
test('common: the engine and every other Vortex package are refused', async () =>
{
    const core = await wallHits("import {Component} from '@core/runtime/Component';\nexport {Component};\n",
        'packages/vortex-common/src/utils/Probe.ts');
    const net = await wallHits("import {ByteArray} from '@vortex/net/util/ByteArray';\nexport {ByteArray};\n",
        'packages/vortex-common/src/utils/Probe.ts');
    const relative = await wallHits("import {Vortex} from '../../../vortex-engine/src/Vortex';\nexport {Vortex};\n",
        'packages/vortex-common/src/utils/Probe.ts');

    assert.equal(core.length, 1);
    assert.equal(net.length, 1);
    assert.equal(relative.length, 1);
});

test('net: common is allowed, the engine is refused', async () =>
{
    const common = await wallHits("import {Logger} from '@vortex/common/utils/Logger';\nexport {Logger};\n",
        'packages/vortex-net/src/connection/Probe.ts');
    const core = await wallHits("import {Component} from '@core/runtime/Component';\nexport {Component};\n",
        'packages/vortex-net/src/connection/Probe.ts');

    assert.equal(common.length, 0);
    assert.equal(core.length, 1);
});
```

- [ ] **Step 2 :** `node --test packages/vortex-engine/tools/boundaries.test.mjs` → FAIL sur les deux
  nouveaux tests (`0 !== 1`).
- [ ] **Step 3 : murs.** Dans `eslint.config.mjs`, avant `{ files: ['**/*.mjs'], … }` :

```js
    {
        files: ['packages/vortex-common/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@vortex/|(^|/)vortex-(engine|net|client)(/|$)',
                    message: `@vortex/common is the bottom package: it imports no other Vortex package (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['packages/vortex-net/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@vortex/(?!common/)|(^|/)vortex-(engine|client)(/|$)',
                    message: `@vortex/net depends on @vortex/common only (${WALLS_SPEC}).`
                }
            )
        }
    },
```

- [ ] **Step 4 :** `node --test packages/vortex-engine/tools/boundaries.test.mjs` → PASS ; `pnpm test` vert.
- [ ] **Step 5 : commit** `j1: murs ESLint de @vortex/common et @vortex/net` en nommant
  `eslint.config.mjs packages/vortex-engine/tools/boundaries.test.mjs`.

---

### Task 3 : `@vortex/common`

**Files :**
- Create : `packages/vortex-common/package.json`, `packages/vortex-common/tsconfig.json`, `.superpowers/sdd/2026-10-07-j1-common-net/moves-common.json` (non commité)
- Move (codemod) : `packages/vortex-engine/src/core/{utils,reactive}/**`, `core/assets/**` sauf `AssetLibrary.ts`, `AssetLibraryCollection.ts`, `index.ts`, et `core/runtime/IDisposable.ts` → `packages/vortex-common/src/…`
- Modify : les 4 fichiers d'assets qui importent `IDisposable` par le baril ; `package.json` de `vortex-engine`, `vortex-client`, `vortex-glaze`, `vortex-imager` ; `package.json` racine (`typecheck`) ; `packages/vortex-client/tools/vite-plugin-engine-bundle.mjs` ; `pnpm-lock.yaml`
- Modify (codemod) : tous les importeurs

**Interfaces :**
- Produces : le paquet `@vortex/common`, importé en chemins profonds : `@vortex/common/utils/Logger`,
  `@vortex/common/assets/IAssetLibrary`, `@vortex/common/reactive/Signal`, `@vortex/common/IDisposable`,
  barils par `…/utils/index`. Le moteur garde `@core/assets` (baril) avec `AssetLibrary`,
  `AssetLibraryEvents`, `AssetLibraryCollection`.

- [ ] **Step 1 : le paquet.**

```json
// packages/vortex-common/package.json
{
  "name": "@vortex/common",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Logger, utilities, asset loading and reactive primitives shared by every Vortex package",
  "exports": {
    "./*": "./src/*.ts"
  },
  "dependencies": {
    "eventemitter3": "^5.0.1",
    "pako": "^2.1.0",
    "pixi.js": "^8.6.6"
  },
  "devDependencies": {
    "@types/pako": "^2.0.3",
    "typescript": "^5.7.2"
  }
}
```

```json
// packages/vortex-common/tsconfig.json
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "outDir": "dist"
    },
    "include": ["src/**/*"]
}
```

  Ajouter `"@vortex/common": "workspace:*"` aux `dependencies` de `vortex-engine`, `vortex-client`,
  `vortex-glaze` et `vortex-imager`. Puis `pnpm install --offline` → `Done`.

- [ ] **Step 2 : la seule dépendance au runtime qui passe par un baril.** Dans
  `core/assets/AssetLoaderStruct.ts`, `core/assets/IAsset.ts`, `core/assets/IAssetLibrary.ts`,
  `core/assets/loaders/IAssetLoader.ts`, remplacer
  `import type {IDisposable} from '@core/runtime';` par
  `import type {IDisposable} from '@core/runtime/IDisposable';`.

- [ ] **Step 3 : simulation.** Écrire `.superpowers/sdd/2026-10-07-j1-common-net/moves-common.json` :

```json
[
  {"from": "packages/vortex-engine/src/core/runtime/IDisposable.ts", "to": "packages/vortex-common/src/IDisposable.ts", "specifier": "@vortex/common/IDisposable"},
  {"from": "packages/vortex-engine/src/core/utils", "to": "packages/vortex-common/src/utils", "specifier": "@vortex/common/utils"},
  {"from": "packages/vortex-engine/src/core/reactive", "to": "packages/vortex-common/src/reactive", "specifier": "@vortex/common/reactive"},
  {"from": "packages/vortex-engine/src/core/assets", "to": "packages/vortex-common/src/assets", "specifier": "@vortex/common/assets",
   "except": ["packages/vortex-engine/src/core/assets/AssetLibrary.ts", "packages/vortex-engine/src/core/assets/AssetLibraryCollection.ts", "packages/vortex-engine/src/core/assets/index.ts"]}
]
```

  `node packages/vortex-engine/tools/move-modules.mjs .superpowers/sdd/2026-10-07-j1-common-net/moves-common.json`
  Expected : `0 violation(s)`, environ 40 fichiers à déplacer. Toute violation est une dépendance de
  `common` vers le moteur : la régler (règle D5 ou ruling au ledger) avant d'appliquer.

- [ ] **Step 4 : application.** Même commande avec `--apply` → `applied`. Vérifier :
  `git status --porcelain | grep "^R" | wc -l` = le nombre annoncé, et
  `ls packages/vortex-engine/src/core/assets` = `AssetLibrary.ts AssetLibraryCollection.ts index.ts`.

- [ ] **Step 5 : le bundle de dev voit les paquets (décision D1).** Dans
  `packages/vortex-client/tools/vite-plugin-engine-bundle.mjs` :

```js
// Engine and workspace-package specifiers a client file may import. Kept in sync with ALIAS_TARGETS.
const ENGINE_ALIAS_RE = /^(?:@(?:core|habbo|room|iid)|@vortex\/(?:common|net))(\/|$)/;
const ENGINE_SPEC_RE = /from\s*['"]((?:@(?:core|habbo|room|iid)|@vortex\/(?:common|net))(?:\/[^'"]*)?|vortex-engine)['"]|import\s*\(\s*['"]((?:@(?:core|habbo|room|iid)|@vortex\/(?:common|net))(?:\/[^'"]*)?|vortex-engine)['"]\s*\)/g;
```

  et dans `engineBundle()` :

```js
	// One esbuild graph for the engine AND the workspace packages it is being split into
	// (spec §12 n° 2): one graph is one instance of Logger, FrameTimings and the other singletons.
	const PACKAGES = norm(join(options.engineRoot, '..'));

	const ALIAS_TARGETS =
		{
			'@core': ENGINE_SRC + '/core',
			'@habbo': ENGINE_SRC + '/habbo',
			'@room': ENGINE_SRC + '/room',
			'@iid': ENGINE_SRC + '/iid',
			'@vortex/common': PACKAGES + '/vortex-common/src',
			'@vortex/net': PACKAGES + '/vortex-net/src'
		};
	const SOURCE_ROOTS = [ENGINE_SRC, PACKAGES + '/vortex-common/src', PACKAGES + '/vortex-net/src'];
```

  `resolveEngineSpec()` : remplacer le calcul de `key` par
  `const key = Object.keys(ALIAS_TARGETS).find((k) => spec === k || spec.startsWith(k + '/'));` et
  `if (!ALIAS_TARGETS[key]) return null;` par `if (!key) return null;`.
  `rebuildContext()` : `outbase: PACKAGES` et
  `nextOutputs.set(spec, OUT_DIR + '/' + norm(relative(PACKAGES, file)).replace(/\.ts$/, '.js'));`.
  `resolveId()` : `if (importer && SOURCE_ROOTS.some((root) => norm(importer).startsWith(root))) return null;`.
  Mettre à jour le commentaire de tête (« every `@core`/`@habbo`/`@room`/`@iid`/`@vortex/*`… »).

- [ ] **Step 6 : barils et script.** `packages/vortex-engine/src/core/assets/index.ts` exporte déjà
  le reste par `@vortex/common/assets/…` (réécrit par le codemod) : le relire, il doit garder
  `AssetLibrary`, `AssetLibraryEvents`, `AssetLibraryCollection`. Dans le `package.json` racine,
  ajouter à `typecheck` : `&& pnpm --filter @vortex/common exec tsc --noEmit`.

- [ ] **Step 7 :** `pnpm --filter @vortex/common exec tsc --noEmit` → 0 erreur (prouve qu'aucun
  fichier de `common` n'atteint le moteur) ; `pnpm typecheck` → 0 erreur ;
  `node node_modules/eslint/bin/eslint.js "packages/*/src/**/*.ts"` → 0 erreur.
- [ ] **Step 8 :** `pnpm check` vert ; `pnpm build` vert ; `pnpm --filter vortex-glaze build` vert ;
  `pnpm imager:build` vert.
- [ ] **Step 9 : une seule instance en dev.** `pnpm dev` puis :

```bash
node .claude/skills/run-vortex-client/driver.mjs "goto http://localhost:5173/client/" "wait 6000" errors \
  "eval performance.getEntriesByType('resource').filter(r => /vortex-(common|net)\/src/.test(r.name)).length"
```

  Expected : `errors` vide ; `0` (tout `common` arrive par `.vortex-dev`, aucun module source servi
  à part). Arrêter `pnpm dev`.
- [ ] **Step 10 : commit** `j1: @vortex/common sort du moteur (utils, assets, reactive, IDisposable)`
  en nommant `packages/vortex-common packages/vortex-engine packages/vortex-client packages/vortex-glaze packages/vortex-imager package.json pnpm-lock.yaml`.

---

### Task 4 : `@vortex/net` et son test d'aller-retour

**Files :**
- Create : `packages/vortex-net/package.json`, `packages/vortex-net/tsconfig.json`, `packages/vortex-net/test/wire-format.test.ts`, `.superpowers/sdd/2026-10-07-j1-common-net/moves-net.json` (non commité)
- Move (codemod) : `packages/vortex-engine/src/core/communication/**` sauf `CoreCommunicationManager.ts`, `ICoreCommunicationManager.ts`, `index.ts` → `packages/vortex-net/src/…`
- Move : `packages/vortex-engine/test/unknown-message-warnings.test.ts` → `packages/vortex-net/test/`
- Modify : `package.json` de `vortex-engine`, `vortex-client`, `vortex-glaze`, `vortex-imager` ; racine (`typecheck`, `test`) ; `pnpm-lock.yaml`

**Interfaces :**
- Consumes : `@vortex/common` (Task 3), le plugin déjà configuré pour `@vortex/net` (Task 3 step 5).
- Produces : `@vortex/net/connection/SocketConnection`, `@vortex/net/connection/IConnection`,
  `@vortex/net/wireformat/WireFormatter`, `@vortex/net/messages/*`, `@vortex/net/util/ByteArray`, etc.

- [ ] **Step 1 : le test (rouge tant que le paquet n'existe pas).**

```ts
// packages/vortex-net/test/wire-format.test.ts
// Spec §11, J1: what the client writes, the client reads back — int, short, string, boolean, list.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WireFormatter} from '../src/wireformat/WireFormatter';
import {Short} from '../src/util/Short';
import type {IConnection} from '../src/connection/IConnection';

const PLAIN = {getServerToClientEncryption: () => null} as unknown as IConnection;

test('a frame written by the formatter reads back field by field', () =>
{
    const formatter = new WireFormatter();
    const frame = formatter.encode(1234, [42, new Short(-7), 'héllo', true, false, [3, 'a']]);

    frame.position = 0;

    const [wrapper] = formatter.splitMessages(frame, PLAIN);

    assert.equal(wrapper.getMessageId(), 1234);
    assert.equal(wrapper.readInt(), 42);
    assert.equal(wrapper.readShort(), -7);
    assert.equal(wrapper.readString(), 'héllo');
    assert.equal(wrapper.readBoolean(), true);
    assert.equal(wrapper.readBoolean(), false);
    assert.equal(wrapper.readInt(), 2);
    assert.equal(wrapper.readInt(), 3);
    assert.equal(wrapper.readString(), 'a');
    assert.equal(wrapper.bytesAvailable, 0);
});

test('two frames in one buffer split into two messages, a partial third waits', () =>
{
    const formatter = new WireFormatter();
    const a = formatter.encode(1, [1]);
    const b = formatter.encode(2, ['x']);
    const c = formatter.encode(3, [9, 9]);
    const buffer = a.clone();

    buffer.position = buffer.length;
    b.position = 0;
    buffer.writeBytes(b);
    c.position = 0;
    buffer.writeBytes(c, 0, 5);
    buffer.position = 0;

    const messages = formatter.splitMessages(buffer, PLAIN);

    assert.deepEqual(messages.map(m => m.getMessageId()), [1, 2]);
    assert.equal(buffer.length, 5);
});
```

  `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/vortex-net/test/wire-format.test.ts`
  Expected : FAIL, `Cannot find module …/vortex-net/src/wireformat/WireFormatter`.

- [ ] **Step 2 : le paquet.**

```json
// packages/vortex-net/package.json
{
  "name": "@vortex/net",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "WebSocket transport, encryption, wire format and message registry of the Vortex client",
  "exports": {
    "./*": "./src/*.ts"
  },
  "dependencies": {
    "@vortex/common": "workspace:*",
    "eventemitter3": "^5.0.1"
  },
  "devDependencies": {
    "typescript": "^5.7.2"
  }
}
```

  `tsconfig.json` identique à celui de `common`. Ajouter `"@vortex/net": "workspace:*"` aux
  `dependencies` de `vortex-engine`, `vortex-client`, `vortex-glaze`, `vortex-imager` ;
  `pnpm install --offline`.

- [ ] **Step 3 : simulation puis application.**

```json
[
  {"from": "packages/vortex-engine/src/core/communication", "to": "packages/vortex-net/src", "specifier": "@vortex/net",
   "except": ["packages/vortex-engine/src/core/communication/CoreCommunicationManager.ts", "packages/vortex-engine/src/core/communication/ICoreCommunicationManager.ts", "packages/vortex-engine/src/core/communication/index.ts"]}
]
```

  Sans `--apply` : `0 violation(s)`, environ 30 fichiers à déplacer, environ 760 imports. Puis
  `--apply`. Vérifier `ls packages/vortex-engine/src/core/communication` =
  `CoreCommunicationManager.ts ICoreCommunicationManager.ts index.ts`.

- [ ] **Step 4 : le test de la coupe suit son code.**
  `git mv packages/vortex-engine/test/unknown-message-warnings.test.ts packages/vortex-net/test/` ;
  remplacer dans ce fichier chaque `'@vortex/net/` par `'../src/` (le codemod a réécrit ses imports
  relatifs en spécificateurs du paquet) ; supprimer `packages/vortex-engine/test` s'il est vide.

- [ ] **Step 5 :** `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test "packages/vortex-net/test/*.test.ts"`
  → PASS 4/4.
- [ ] **Step 6 :** ajouter `&& pnpm --filter @vortex/net exec tsc --noEmit` au `typecheck` racine ;
  `pnpm --filter @vortex/net exec tsc --noEmit` → 0 erreur ; `pnpm typecheck` → 0 ; eslint sur
  `packages/*/src/**/*.ts` → 0 erreur.
- [ ] **Step 7 :** `pnpm check` vert (la commande `test` racine prend déjà `packages/*/test/**/*.test.ts`).
- [ ] **Step 8 :** `pnpm build`, `pnpm --filter vortex-glaze build`, `pnpm imager:build` verts ; `pnpm dev`
  + driver comme Task 3 step 9 → `errors` vide, `0`.
- [ ] **Step 9 : commit** `j1: @vortex/net sort du moteur (transport, chiffrement, format, registre)`
  en nommant `packages/vortex-net packages/vortex-engine packages/vortex-client packages/vortex-glaze packages/vortex-imager package.json pnpm-lock.yaml`.

---

### Task 5 : Point d'écoute et d'injection de `net`

**Files :**
- Create : `packages/vortex-net/src/connection/IPacketTap.ts`
- Modify : `packages/vortex-net/src/connection/IConnection.ts`, `packages/vortex-net/src/connection/SocketConnection.ts`
- Test : `packages/vortex-net/test/packet-tap.test.ts`

**Interfaces :**
- Produces :

```ts
export interface IPacketTap
{
    outgoing?(messageId: number, values: unknown[]): unknown[] | null;
    incoming?(wrapper: IMessageDataWrapper): IMessageDataWrapper | null;
}
// IConnection
setPacketTap(tap: IPacketTap | null): void;
injectIncoming(messageId: number, values: unknown[]): void;
```

- [ ] **Step 1 : les tests.**

```ts
// packages/vortex-net/test/packet-tap.test.ts
// Spec §8: net lets a dev tool listen to, edit, drop and inject packets.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SocketConnection} from '../src/connection/SocketConnection';
import {MessageEvent} from '../src/messages/MessageEvent';
import {MessageComposer} from '../src/messages/MessageComposer';
import {MessageDataWrapper} from '../src/messages/MessageDataWrapper';
import {WireFormatter} from '../src/wireformat/WireFormatter';
import {ByteArray} from '../src/util/ByteArray';
import type {IEncryption} from '../src/encryption/IEncryption';
import type {IConnection} from '../src/connection/IConnection';
import type {IMessageDataWrapper} from '../src/messages/IMessageDataWrapper';

class ValueParser
{
    value = 0;

    flush(): boolean
    {
        this.value = 0;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        this.value = wrapper.readInt();
        return true;
    }
}

const received: number[] = [];

class ValueEvent extends MessageEvent
{
    constructor()
    {
        super(event => received.push((event.parser as ValueParser).value), ValueParser);
    }
}

class ValueComposer extends MessageComposer<[number]>
{
    constructor(private readonly _value: number)
    {
        super();
    }

    getMessageArray(): [number]
    {
        return [this._value];
    }
}

const PLAIN = {encipher: () => undefined, decipher: () => undefined} as unknown as IEncryption;
const THROWS = {encipher: () => undefined, decipher: () => { throw new Error('deciphered'); }} as unknown as IEncryption;

function connection(serverToClient: IEncryption = PLAIN): {connection: SocketConnection; sent: ArrayBuffer[]}
{
    const c = new SocketConnection();
    const sent: ArrayBuffer[] = [];

    c.registerMessageClasses({events: new Map([[100, ValueEvent]]), composers: new Map([[200, ValueComposer]])});
    c.addMessageEvent(new ValueEvent());
    c.setEncryption(PLAIN, serverToClient);
    // A socket that is open and records what it is given; SocketConnection.init() would dial out.
    (c as unknown as {_socket: unknown})._socket = {readyState: WebSocket.OPEN, send: (data: ArrayBuffer) => sent.push(data)};

    return {connection: c, sent};
}

function sentValue(buffer: ArrayBuffer): number
{
    const [wrapper] = new WireFormatter().splitMessages(new ByteArray(buffer), {getServerToClientEncryption: () => null} as unknown as IConnection);

    return wrapper.readInt();
}

test('an injected message reaches its handler with its values', () =>
{
    received.length = 0;
    connection().connection.injectIncoming(100, [7]);

    assert.deepEqual(received, [7]);
});

test('an injected message is never deciphered', () =>
{
    received.length = 0;
    connection(THROWS).connection.injectIncoming(100, [8]);

    assert.deepEqual(received, [8]);
});

test('the tap can drop or replace an incoming message', () =>
{
    const {connection: c} = connection();

    received.length = 0;
    c.setPacketTap({incoming: () => null});
    c.injectIncoming(100, [1]);
    c.setPacketTap({incoming: () =>
    {
        const data = new WireFormatter().encode(100, [99]);
        const body = new ByteArray(data.length - 4);

        data.position = 4;
        data.readBytes(body, 0, data.length - 4);
        body.position = 2;

        return new MessageDataWrapper(100, body);
    }});
    c.injectIncoming(100, [1]);

    assert.deepEqual(received, [99]);
});

test('the tap sees outgoing values, can edit them or drop the message', () =>
{
    const {connection: c, sent} = connection();
    const seen: unknown[][] = [];

    c.setPacketTap({outgoing: (id, values) =>
    {
        seen.push([id, ...values]);
        return values[0] === 2 ? null : [Number(values[0]) * 10];
    }});

    assert.equal(c.send(new ValueComposer(1)), true);
    assert.equal(c.send(new ValueComposer(2)), false);
    assert.deepEqual(seen, [[200, 1], [200, 2]]);
    assert.deepEqual(sent.map(sentValue), [10]);
});
```

- [ ] **Step 2 :** `node node_modules/tsx/dist/cli.mjs --tsconfig packages/vortex-engine/tsconfig.json --test packages/vortex-net/test/packet-tap.test.ts`
  → FAIL (`injectIncoming is not a function`).

- [ ] **Step 3 : l'interface.**

```ts
// packages/vortex-net/src/connection/IPacketTap.ts
import type {IMessageDataWrapper} from '../messages/IMessageDataWrapper';

/**
 * A development hook on the wire (spec §8): the packet inspector sees every message after
 * decryption and before encoding, and may edit or drop it. Nothing installs one in production.
 */
export interface IPacketTap
{
    /** Values about to be encoded for `messageId`: return them (edited or not), or null to drop the message. */
    outgoing?(messageId: number, values: unknown[]): unknown[] | null;

    /** A decrypted incoming message: return the wrapper to handle (edited or not), or null to drop it. */
    incoming?(wrapper: IMessageDataWrapper): IMessageDataWrapper | null;
}
```

  Dans `IConnection.ts`, importer `import type {IPacketTap} from './IPacketTap';` et ajouter :

```ts
    // TS-only: the packet inspector's hook (spec §8); null removes it.
    setPacketTap(tap: IPacketTap | null): void;

    // TS-only: hands a message to the handlers as if the server had sent it, without touching the cipher.
    injectIncoming(messageId: number, values: unknown[]): void;
```

- [ ] **Step 4 : l'implémentation** dans `SocketConnection.ts` (imports : `IPacketTap` en type,
  `MessageDataWrapper` déjà importable depuis `../messages/MessageDataWrapper`, `ByteArray` depuis
  `../util/ByteArray`) :

```ts
    private _tap: IPacketTap | null = null;

    // TS-only: see IConnection.setPacketTap().
    setPacketTap(tap: IPacketTap | null): void
    {
        this._tap = tap;
    }

    // TS-only: see IConnection.injectIncoming(). Encoded by the formatter the server's bytes go
    // through, but never deciphered: an injected message must not advance the real stream's keystream.
    injectIncoming(messageId: number, values: unknown[]): void
    {
        if(this._disposed) return;

        const frame = this._wireFormatter.encode(messageId, values);
        const body = new ByteArray(frame.length - 4);

        frame.position = 4;
        frame.readBytes(body, 0, frame.length - 4);
        body.position = 2;

        this.handleReceivedMessage(new MessageDataWrapper(messageId, body));
    }
```

  `send()` : remplacer
  `const encoded = this._wireFormatter.encode(messageId, composer.getMessageArray());` par

```ts
        let values: unknown[] = composer.getMessageArray();

        if(this._tap?.outgoing)
        {
            const edited = this._tap.outgoing(messageId, values);

            if(edited === null) return false;

            values = edited;
        }

        const encoded = this._wireFormatter.encode(messageId, values);
```

  `handleReceivedMessage(wrapper)` : renommer le paramètre `received`, et en tête de méthode :

```ts
        let wrapper = received;

        if(this._tap?.incoming)
        {
            const edited = this._tap.incoming(wrapper);

            if(edited === null) return;

            wrapper = edited;
        }
```

- [ ] **Step 5 :** les tests de Step 2 → PASS 4/4 ; `pnpm check` vert ; eslint sur les trois fichiers sans erreur.
- [ ] **Step 6 : commit** `j1: point d'écoute et d'injection de @vortex/net (outil de paquets, dev)`
  en nommant `packages/vortex-net/src/connection/IPacketTap.ts packages/vortex-net/src/connection/IConnection.ts packages/vortex-net/src/connection/SocketConnection.ts packages/vortex-net/test/packet-tap.test.ts`.

---

### Task 6 : Validation du jalon et documentation

**Files :**
- Modify : `CLAUDE.md` (carte, alias), `.claude/rules/vite-dev.md`, `.claude/rules/communication.md`
  (chemins `core/communication/` → `packages/vortex-net/`), `docs/superpowers/specs/2026-10-07-client-architecture-design.md`
  (§9 J1 fait, §12 n° 2 tranchée), `AGENTS.md` + `.github/copilot-instructions.md` (générés)
- Create : `docs/superpowers/plans/2026-10-07-j1-common-net.bilan.md`

- [ ] **Step 1 : la règle du jalon.** Client en dev contre l'émulateur local : connexion, entrée en
  room, marche, bulle de nom, éditeur d'avatar ; `errors` vide ; `__packets.unhandled()` =
  `RoomEntryInfo`, `RoomRating`. Si l'environnement local n'a pas été réparé entre-temps, suivre le
  contournement décrit dans `2026-10-07-coupe-noyau-client.bilan.md` → « Validation réelle » (paire RSA
  jetable, hôte surchargé dans une copie du driver, WebApi publiée dans `%TEMP%`, ticket et zone
  insérés puis retirés) et le noter au ledger ; si un de ces contournements devient impossible,
  s'arrêter et noter la validation comme due.
- [ ] **Step 2 : la preuve du §9.** Refaire la mesure de Task 0 step 3. Expected : `load` du
  rechargement ≤ base + 10 % (bruit de mesure) ; le nombre de requêtes peut varier de quelques
  unités. Écrire les deux mesures au bilan.
- [ ] **Step 3 : documentation.**
  - `CLAUDE.md`, table « Map » : deux lignes `packages/vortex-common` (« Logger, utilities, asset
    loading, reactive — imports nothing from Vortex ») et `packages/vortex-net` (« WebSocket transport,
    encryption, wire format, registry, packet tap — imports `@vortex/common` only ») ; paragraphe des
    alias : « `@vortex/common/*` and `@vortex/net/*` are real workspace packages (deep imports, no root
    barrel) ».
  - `.claude/rules/vite-dev.md` : le bundle couvre aussi `@vortex/common` et `@vortex/net` (un seul
    esbuild, `outbase` = `packages/`) ; ajouter `packages/vortex-*/package.json` au déclencheur `paths`.
  - `.claude/rules/communication.md` : la ligne de tête cite `packages/vortex-net/` au lieu de
    `core/communication/` ; ajouter ce chemin à ses `paths`.
  - Spec : §9 ligne J1 suivie de « — fait le 2026-10-07 (bilan …) » ; §12 n° 2 : « Tranché (plan J1) :
    un seul esbuild pour tous les paquets ».
  - `pnpm sync:agents`.
- [ ] **Step 4 : bilan** `docs/superpowers/plans/2026-10-07-j1-common-net.bilan.md` : fichiers déplacés
  par paquet, imports réécrits, mesures avant/après, ce qui reste dans le moteur et pourquoi (D4),
  rulings du ledger, ce qui n'a pas pu être validé.
- [ ] **Step 5 :** `pnpm check` vert ; commit `j1: validation, documentation et bilan` en nommant
  les fichiers ci-dessus.
