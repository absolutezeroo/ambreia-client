# J0 — Préparation de la refonte du client : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser les garde-fous de la refonte avant de déplacer le moindre fichier : en-têtes réseau générés depuis l'émulateur et vérifiés au commit, murs entre couches vérifiés par ESLint, règles du dépôt réécrites pour le nouveau régime.

**Architecture:** Un générateur Node (`packages/vortex-engine/tools/gen-headers.mjs`, logique pure dans `tools/lib/headers.mjs`) lit `Headers.cs` de l'émulateur et écrit `Headers.generated.ts` ; son mode `--check` tourne dans le hook de pré-commit. Les murs sont des blocs `no-restricted-imports` dans `eslint.config.mjs`, limités à ceux qui tiennent déjà aujourd'hui. Les tests utilisent `node:test`, sans nouvelle dépendance.

**Tech Stack:** Node 24 (`node:test`, `node:assert/strict`), ESLint 10 (flat config), husky 9, TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-07-client-architecture-design.md` (§3 règles 4, §6 en-têtes, §9 J0, §10 règles du dépôt, §11 tests J0).

## Global Constraints

- Les numéros de messages viennent de `vortex-rpg-emulator/Vortex.Revisions/Revision20260701/Headers.cs` ; `MessageComposer` du serveur → `Incoming`, `MessageEvent` du serveur → `Outgoing` (spec §6).
- Les moteurs n'importent jamais le client ; `core/` n'importe ni `habbo/` ni `room/` ; `room/` n'importe pas `habbo/` (spec §3, murs qui tiennent déjà, mesurés le 2026-10-07).
- Aucune nouvelle dépendance npm dans ce jalon.
- Conventions du dépôt : accolades Allman, `if(` sans espace, `| null` jamais `| undefined`, exports nommés.
- **Commits par chemins explicites** (`git commit -- <fichiers>`) : l'index peut contenir du travail en cours du propriétaire.
- Les règles `.claude/rules/*.md` et `CLAUDE.md` restent en anglais ; les docs `docs/superpowers/` en français.

## Préconditions (hors de ce plan)

1. Le M0 client (`docs/superpowers/plans/2026-10-05-m0-menage-client.md`, branche `m0-menage`) est terminé et mergé dans `main`. **En particulier** : le patch `svelte-spa-router@4.0.2` ne vise plus de paquet depuis la suppression de `packages/vortex-web` ; tant qu'il est déclaré, toute commande `pnpm <script>` échoue avec `ERR_PNPM_UNUSED_PATCH`. Le M0 doit retirer sa déclaration (`patchedDependencies`) et le fichier `patches/svelte-spa-router@4.0.2.patch`.
2. Branche de travail `refonte/j0` créée depuis `main`, avec la spec et ce plan mergés : `git switch -c refonte/j0 main && git merge docs/client-architecture`. Si des copies non suivies de la spec ou de ce plan traînent dans le dossier de travail (elles y ont été posées pour relecture), les supprimer d'abord : elles sont identiques à celles de la branche, et Git refuse le merge tant qu'elles existent.
3. L'émulateur est cloné à côté : `../vortex-rpg-emulator/Vortex.Revisions/Revision20260701/Headers.cs` existe.

Toutes les commandes de ce plan s'exécutent depuis la racine du dépôt et appellent `node` directement (pas `pnpm <script>`), pour ne pas dépendre de la précondition 1 pendant le développement.

## Review Focus

1. **L'émulateur est sur une autre branche que prévu** → `--check` échoue ; le message doit dire quoi faire (`pnpm gen:headers`) et nommer le fichier source. Test : Task 1, `cli: stale target fails the check and says how to fix it`.
2. **Un clone sans l'émulateur à côté** → le commit doit passer (contrôle sauté et annoncé), mais la génération doit échouer franchement. Tests : Task 1, `cli: missing emulator skips the check` et `cli: missing emulator fails generation`.
3. **Copie de travail en CRLF** (Windows, `core.autocrlf`) → le fichier généré, relu en CRLF, ne doit pas être déclaré périmé. Test : Task 1, `sameContent ignores CRLF vs LF`.
4. **Import `import type` interdit** → un import de type seul depuis `habbo/` dans `core/` doit être refusé comme un import de valeur. Test : Task 2, `core: type-only import of habbo is refused`.
5. **Ordre des blocs ESLint** → en flat config, un bloc plus bas remplace les options d'une règle pour les fichiers qu'il vise ; le mur « le moteur n'importe pas le client » ne doit pas disparaître dans `core/`. Test : Task 2, `core: the client wall still holds inside core`.

---

### Task 1: Générateur d'en-têtes et contrôle au pré-commit

**Files:**
- Create: `packages/vortex-engine/tools/lib/headers.mjs`
- Create: `packages/vortex-engine/tools/lib/headers.test.mjs`
- Create: `packages/vortex-engine/tools/gen-headers.mjs`
- Create: `packages/vortex-engine/tools/gen-headers.test.mjs`
- Create (généré): `packages/vortex-engine/src/habbo/communication/Headers.generated.ts`
- Modify: `package.json` (scripts)
- Modify: `.husky/pre-commit`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `parseHeadersCs(text: string): { incoming: Map<string, number>, outgoing: Map<string, number> }` — lève une `Error` sur classe inconnue, constante hors classe, nom ou id en double dans un même sens.
  - `renderHeadersTs(parsed): string` — sortie déterministe, triée par nom, terminée par `\n`.
  - `sameContent(a: string, b: string): boolean` — égalité aux fins de ligne près.
  - `Headers.generated.ts` exporte `Incoming` et `Outgoing` (`as const`), consommés à partir de J6.
  - Scripts racine : `pnpm test`, `pnpm gen:headers`.

- [ ] **Step 1: Écrire les tests de la logique pure**

Create `packages/vortex-engine/tools/lib/headers.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHeadersCs, renderHeadersTs, sameContent } from './headers.mjs';

const FIXTURE = `namespace Vortex.Revisions.Revision20260701;

internal static class MessageEvent
{
    // internal static class NotAClass mentioned in a comment must not switch direction
    public const int ZetaEvent = 20; // trailing comment
    public const int AlphaEvent = 10;
    public const int DeadEvent = -1;
    public const int OtherDeadEvent = -1;
}

internal static class MessageComposer
{
    public const int AlphaComposer = 10;
}
`;

test('maps the server MessageComposer to Incoming and MessageEvent to Outgoing', () =>
{
    const parsed = parseHeadersCs(FIXTURE);

    assert.deepEqual([...parsed.incoming], [['AlphaComposer', 10]]);
    assert.deepEqual([...parsed.outgoing].sort(), [['AlphaEvent', 10], ['ZetaEvent', 20]]);
});

test('drops negative ids, which the server declares but does not wire', () =>
{
    const parsed = parseHeadersCs(FIXTURE);

    assert.equal(parsed.outgoing.has('DeadEvent'), false);
    assert.equal(parsed.outgoing.has('OtherDeadEvent'), false);
});

test('the same id in both directions is legal', () =>
{
    const parsed = parseHeadersCs(FIXTURE);

    assert.equal(parsed.incoming.get('AlphaComposer'), parsed.outgoing.get('AlphaEvent'));
});

test('two names on one id in the same direction is a wire collision', () =>
{
    const text = FIXTURE.replace('public const int ZetaEvent = 20;', 'public const int ZetaEvent = 10;');

    assert.throws(() => parseHeadersCs(text), /ZetaEvent and AlphaEvent share outgoing id 10|AlphaEvent and ZetaEvent share outgoing id 10/);
});

test('a name declared twice in the same direction is refused', () =>
{
    const text = FIXTURE.replace('public const int ZetaEvent = 20;', 'public const int AlphaEvent = 20;');

    assert.throws(() => parseHeadersCs(text), /AlphaEvent declared twice in outgoing/);
});

test('an unexpected class is refused rather than guessed', () =>
{
    const text = FIXTURE.replace('internal static class MessageComposer', 'internal static class SomethingElse');

    assert.throws(() => parseHeadersCs(text), /unexpected class SomethingElse/);
});

test('renders sorted, const, deterministic TypeScript ending with a newline', () =>
{
    const out = renderHeadersTs(parseHeadersCs(FIXTURE));

    assert.match(out, /export const Incoming = \{\n {4}AlphaComposer: 10,\n\} as const;/);
    assert.match(out, /export const Outgoing = \{\n {4}AlphaEvent: 10,\n {4}ZetaEvent: 20,\n\} as const;/);
    assert.match(out, /^\/\/ GENERATED by packages\/vortex-engine\/tools\/gen-headers\.mjs/);
    assert.ok(out.endsWith('\n'));
    assert.equal(out, renderHeadersTs(parseHeadersCs(FIXTURE)));
});

test('sameContent ignores CRLF vs LF', () =>
{
    assert.equal(sameContent('a\r\nb\r\n', 'a\nb\n'), true);
    assert.equal(sameContent('a\nb\n', 'a\nc\n'), false);
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `node --test packages/vortex-engine/tools/lib/headers.test.mjs`
Expected: FAIL — `Cannot find module '.../tools/lib/headers.mjs'`.

- [ ] **Step 3: Écrire la logique pure**

Create `packages/vortex-engine/tools/lib/headers.mjs`:

```js
// Parses the emulator's Headers.cs and renders the client's Headers.generated.ts.
// The emulator is the source of truth for message ids:
// docs/superpowers/specs/2026-10-07-client-architecture-design.md §6.

const CLASS_RE = /^\s*(?:internal|public)\s+static\s+class\s+(\w+)/;
const CONST_RE = /^\s*public\s+const\s+int\s+(\w+)\s*=\s*(-?\d+)\s*;/;

// What the server composes, the client receives; what the server handles, the client sends.
const DIRECTION_BY_CLASS = { MessageComposer: 'incoming', MessageEvent: 'outgoing' };

const HEADER_COMMENT = [
    '// GENERATED by packages/vortex-engine/tools/gen-headers.mjs from',
    '// vortex-rpg-emulator/Vortex.Revisions/Revision20260701/Headers.cs. Do not edit: run `pnpm gen:headers`.',
    '// Spec: docs/superpowers/specs/2026-10-07-client-architecture-design.md §6.',
    ''
].join('\n');

export function parseHeadersCs(text)
{
    const parsed = { incoming: new Map(), outgoing: new Map() };
    const nameById = { incoming: new Map(), outgoing: new Map() };
    let direction = null;

    for(const line of text.split(/\r?\n/))
    {
        const classMatch = line.match(CLASS_RE);

        if(classMatch)
        {
            direction = DIRECTION_BY_CLASS[classMatch[1]] ?? null;

            if(direction === null)
            {
                throw new Error(`Headers.cs: unexpected class ${classMatch[1]}`);
            }

            continue;
        }

        const constMatch = line.match(CONST_RE);

        if(!constMatch)
        {
            continue;
        }

        const [, name, rawId] = constMatch;

        if(direction === null)
        {
            throw new Error(`Headers.cs: constant ${name} outside MessageEvent/MessageComposer`);
        }

        const id = Number(rawId);

        // -1 marks a header the server keeps declared but does not wire.
        if(id < 0)
        {
            continue;
        }

        if(parsed[direction].has(name))
        {
            throw new Error(`Headers.cs: ${name} declared twice in ${direction}`);
        }

        const owner = nameById[direction].get(id);

        if(owner !== undefined)
        {
            throw new Error(`Headers.cs: ${name} and ${owner} share ${direction} id ${id}`);
        }

        parsed[direction].set(name, id);
        nameById[direction].set(id, name);
    }

    return parsed;
}

function renderBlock(exportName, doc, entries)
{
    const sorted = [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const lines = sorted.map(([name, id]) => `    ${name}: ${id},`);

    return `/** ${doc} */\nexport const ${exportName} = {\n${lines.join('\n')}\n} as const;\n`;
}

export function renderHeadersTs(parsed)
{
    return [
        HEADER_COMMENT,
        renderBlock('Incoming', 'Server to client: the emulator\'s MessageComposer constants.', parsed.incoming),
        renderBlock('Outgoing', 'Client to server: the emulator\'s MessageEvent constants.', parsed.outgoing)
    ].join('\n');
}

export function sameContent(a, b)
{
    return a.replace(/\r\n/g, '\n') === b.replace(/\r\n/g, '\n');
}
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `node --test packages/vortex-engine/tools/lib/headers.test.mjs`
Expected: PASS — `# pass 8`, `# fail 0`.

- [ ] **Step 5: Écrire les tests de la ligne de commande**

Create `packages/vortex-engine/tools/gen-headers.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = join(dirname(fileURLToPath(import.meta.url)), 'gen-headers.mjs');

function run(args, emulatorDir)
{
    return spawnSync(process.execPath, [CLI, ...args], {
        encoding: 'utf8',
        env: { ...process.env, VORTEX_EMULATOR_DIR: emulatorDir }
    });
}

test('cli: missing emulator skips the check', () =>
{
    const result = run(['--check'], mkdtempSync(join(tmpdir(), 'no-emulator-')));

    assert.equal(result.status, 0);
    assert.match(result.stdout, /check skipped/);
});

test('cli: missing emulator fails generation', () =>
{
    const result = run([], mkdtempSync(join(tmpdir(), 'no-emulator-')));

    assert.equal(result.status, 1);
    assert.match(result.stderr, /not found/);
});

test('cli: stale target fails the check and says how to fix it', () =>
{
    const emulator = mkdtempSync(join(tmpdir(), 'fake-emulator-'));
    const revision = join(emulator, 'Vortex.Revisions', 'Revision20260701');

    mkdirSync(revision, { recursive: true });
    writeFileSync(join(revision, 'Headers.cs'),
        'internal static class MessageComposer\n{\n    public const int OnlyInThisFixture = 1;\n}\n');

    const result = run(['--check'], emulator);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /pnpm gen:headers/);
    assert.match(result.stderr, /Headers\.cs/);
});
```

- [ ] **Step 6: Vérifier qu'ils échouent**

Run: `node --test packages/vortex-engine/tools/gen-headers.test.mjs`
Expected: FAIL — les trois tests, `status` vaut 1 avec `Cannot find module '.../gen-headers.mjs'` (le premier attend 0).

- [ ] **Step 7: Écrire la ligne de commande**

Create `packages/vortex-engine/tools/gen-headers.mjs`:

```js
#!/usr/bin/env node
// Writes src/habbo/communication/Headers.generated.ts from the emulator's Headers.cs, or with
// --check verifies the committed copy still matches it (run by .husky/pre-commit).
// docs/superpowers/specs/2026-10-07-client-architecture-design.md §6.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHeadersCs, renderHeadersTs, sameContent } from './lib/headers.mjs';

const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(ENGINE, '..', '..');
const EMULATOR = process.env.VORTEX_EMULATOR_DIR ?? resolve(REPO, '..', 'vortex-rpg-emulator');
const SOURCE = join(EMULATOR, 'Vortex.Revisions', 'Revision20260701', 'Headers.cs');
const TARGET = join(ENGINE, 'src', 'habbo', 'communication', 'Headers.generated.ts');
const check = process.argv.includes('--check');

if(!existsSync(SOURCE))
{
    // A clone without the emulator beside it cannot regenerate: let it commit, refuse to generate.
    if(check)
    {
        console.log(`gen-headers: ${SOURCE} not found, check skipped.`);
        process.exit(0);
    }

    console.error(`gen-headers: ${SOURCE} not found. Clone vortex-rpg-emulator next to this repo or set VORTEX_EMULATOR_DIR.`);
    process.exit(1);
}

const parsed = parseHeadersCs(readFileSync(SOURCE, 'utf8'));
const rendered = renderHeadersTs(parsed);

if(check)
{
    const current = existsSync(TARGET) ? readFileSync(TARGET, 'utf8') : '';

    if(!sameContent(current, rendered))
    {
        console.error(`gen-headers: Headers.generated.ts does not match ${SOURCE}.`);
        console.error('Run `pnpm gen:headers` and commit the result (or check out the emulator branch this client targets).');
        process.exit(1);
    }

    process.exit(0);
}

writeFileSync(TARGET, rendered);
console.log(`gen-headers: wrote ${parsed.incoming.size} incoming and ${parsed.outgoing.size} outgoing headers.`);
```

- [ ] **Step 8: Vérifier que tous les tests passent**

Run: `node --test "packages/*/tools/**/*.test.mjs"`
Expected: PASS — `# pass 11`, `# fail 0`.

- [ ] **Step 9: Générer le fichier réel**

Run: `node packages/vortex-engine/tools/gen-headers.mjs`
Expected: `gen-headers: wrote 280 incoming and 303 outgoing headers.` (comptes mesurés le 2026-10-07 sur la branche `noyau` de l'émulateur ; un autre compte n'est pas une erreur si l'émulateur a bougé, mais doit être relu.)

Puis : `node packages/vortex-engine/tools/gen-headers.mjs --check; echo "exit=$?"`
Expected: `exit=0`.

Puis vérifier que TypeScript l'accepte : `node node_modules/typescript/bin/tsc -p packages/vortex-engine/tsconfig.json --noEmit 2>&1 | grep Headers.generated; echo "grep-exit=$?"`
Expected: `grep-exit=1` (aucune erreur dans le fichier généré).

- [ ] **Step 10: Brancher les scripts et le hook**

Dans `package.json`, bloc `"scripts"`, ajouter après `"lint:fix"` :

```json
    "test": "node --test \"packages/*/tools/**/*.test.mjs\"",
    "gen:headers": "node packages/vortex-engine/tools/gen-headers.mjs",
```

Dans `.husky/pre-commit`, insérer juste après la ligne `npx lint-staged` :

```sh

# Message ids come from the emulator (docs/superpowers/specs/2026-10-07-client-architecture-design.md §6).
# Unlike the optional checks below, this one is shared tooling and blocks the commit.
node packages/vortex-engine/tools/gen-headers.mjs --check || exit 1
```

- [ ] **Step 11: Vérifier le hook**

Run: `sh .husky/pre-commit; echo "exit=$?"` (avec un index sans fichier `.ts` : lint-staged n'a rien à faire)
Expected: `exit=0`.

Puis simuler un fichier périmé : `printf '// stale\n' >> packages/vortex-engine/src/habbo/communication/Headers.generated.ts && sh .husky/pre-commit; echo "exit=$?"`
Expected: message `Headers.generated.ts does not match …` et `exit=1`.
Puis restaurer : `node packages/vortex-engine/tools/gen-headers.mjs`.

- [ ] **Step 12: Commit**

```bash
git add packages/vortex-engine/tools/lib/headers.mjs packages/vortex-engine/tools/lib/headers.test.mjs packages/vortex-engine/tools/gen-headers.mjs packages/vortex-engine/tools/gen-headers.test.mjs packages/vortex-engine/src/habbo/communication/Headers.generated.ts package.json .husky/pre-commit
git commit -m "j0: en-têtes réseau générés depuis Headers.cs de l'émulateur, vérifiés au pré-commit" -- packages/vortex-engine/tools/lib/headers.mjs packages/vortex-engine/tools/lib/headers.test.mjs packages/vortex-engine/tools/gen-headers.mjs packages/vortex-engine/tools/gen-headers.test.mjs packages/vortex-engine/src/habbo/communication/Headers.generated.ts package.json .husky/pre-commit
```

---

### Task 2: Murs entre couches dans ESLint

**Files:**
- Modify: `eslint.config.mjs` (bloc `ignores` en tête ; nouveaux blocs après le bloc principal `files: ['packages/*/src/**/*.ts']`)
- Create: `packages/vortex-engine/tools/boundaries.test.mjs`

**Interfaces:**
- Consumes: le script `pnpm test` de Task 1 (glob `packages/*/tools/**/*.test.mjs`, qui ramasse ce nouveau test).
- Produces: la règle `no-restricted-imports` active sur `packages/vortex-engine/src/**`, avec une fonction `wall(...patterns)` dans `eslint.config.mjs` que J1–J6 réutilisent pour ajouter les murs de chaque paquet extrait.

- [ ] **Step 1: Écrire les tests**

Create `packages/vortex-engine/tools/boundaries.test.mjs`:

```js
// The layer walls of docs/superpowers/specs/2026-10-07-client-architecture-design.md §3, as enforced
// by eslint.config.mjs. Each probe lints a one-line file at a path that does not exist on disk.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const eslint = new ESLint({ cwd: REPO });

async function wallHits(code, relativePath)
{
    const [result] = await eslint.lintText(code, { filePath: join(REPO, relativePath) });

    return result.messages.filter(m => m.ruleId === 'no-restricted-imports');
}

test('core: alias import of habbo is refused', async () =>
{
    const hits = await wallHits("import {RoomEngine} from '@habbo/room/RoomEngine';\nexport {RoomEngine};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');

    assert.equal(hits.length, 1);
});

test('core: relative import of habbo is refused', async () =>
{
    const hits = await wallHits("import {RoomEngine} from '../../habbo/room/RoomEngine';\nexport {RoomEngine};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');

    assert.equal(hits.length, 1);
});

test('core: type-only import of habbo is refused', async () =>
{
    const hits = await wallHits("import type {IRoomEngine} from '@habbo/room/IRoomEngine';\nexport type {IRoomEngine};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');

    assert.equal(hits.length, 1);
});

test('core: room/ and the Vortex entry points are refused', async () =>
{
    const room = await wallHits("import {Vector3d} from '@room/utils/Vector3d';\nexport {Vector3d};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');
    const entry = await wallHits("import {Vortex} from '../Vortex';\nexport {Vortex};\n",
        'packages/vortex-engine/src/core/Probe.ts');

    assert.equal(room.length, 1);
    assert.equal(entry.length, 1);
});

test('core: the client wall still holds inside core', async () =>
{
    const hits = await wallHits("import {X} from '@ui/window/X';\nexport {X};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');

    assert.equal(hits.length, 1);
});

test('room: habbo is refused', async () =>
{
    const hits = await wallHits("import {RoomEngine} from '@habbo/room/RoomEngine';\nexport {RoomEngine};\n",
        'packages/vortex-engine/src/room/object/Probe.ts');

    assert.equal(hits.length, 1);
});

test('habbo: the client is refused', async () =>
{
    const hits = await wallHits("import {App} from '@/App';\nexport {App};\n",
        'packages/vortex-engine/src/habbo/room/Probe.ts');

    assert.equal(hits.length, 1);
});

test('habbo: core and room are allowed', async () =>
{
    const hits = await wallHits("import {Logger} from '@core/utils/Logger';\nimport {Vector3d} from '@room/utils/Vector3d';\nexport {Logger, Vector3d};\n",
        'packages/vortex-engine/src/habbo/room/Probe.ts');

    assert.equal(hits.length, 0);
});
```

- [ ] **Step 2: Vérifier qu'ils échouent**

Run: `node --test packages/vortex-engine/tools/boundaries.test.mjs`
Expected: FAIL — 7 tests échouent (`0 !== 1`), seul `habbo: core and room are allowed` passe.

- [ ] **Step 3: Ajouter les murs**

Dans `eslint.config.mjs`, juste après les imports, ajouter :

```js
// Layer walls: docs/superpowers/specs/2026-10-07-client-architecture-design.md §3. Only the walls that
// already hold are listed (measured 2026-10-07); each extraction milestone J1-J6 adds its package's
// own with `wall()`. Flat config replaces a rule's options when a later block matches the same file,
// so `wall()` always carries the engine-wide wall instead of relying on the block above it.
const WALLS_SPEC = 'docs/superpowers/specs/2026-10-07-client-architecture-design.md §3';
const ENGINE_NEVER_IMPORTS_CLIENT = {
    regex: '^(@ui|@)/|^vortex-client(/|$)',
    message: `The engine never imports the client (${WALLS_SPEC}).`
};
const wall = (...patterns) => ['error', { patterns: [ENGINE_NEVER_IMPORTS_CLIENT, ...patterns] }];
```

Dans le tableau `ignores` du premier bloc, remplacer la dernière entrée :

```js
            '**/*.generated.ts'
```

par :

```js
            '**/*.generated.ts',
            // The dev server's esbuild output of the engine (vite-plugin-engine-bundle.mjs), gitignored.
            // It held 1,821 of the 1,828 errors `eslint .` reported on 2026-10-07.
            '**/.vortex-dev/**'
```

Puis, juste après la fermeture du bloc principal `files: ['packages/*/src/**/*.ts']` (avant le bloc `files: ['**/*.mjs']`), insérer :

```js
    {
        files: ['packages/vortex-engine/src/**/*.ts'],
        rules: { 'no-restricted-imports': wall() }
    },
    {
        files: ['packages/vortex-engine/src/core/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(habbo|room)(/|$)|(^|/)(habbo|room)/',
                    message: `core/ is the bottom layer: it never imports habbo/ or room/ (${WALLS_SPEC}).`
                },
                {
                    regex: '(^|/)Vortex(Main)?$',
                    message: `core/ never imports the Vortex entry points (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['packages/vortex-engine/src/room/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@habbo(/|$)|(^|/)habbo/',
                    message: `room/ is the generic engine: it never imports habbo/ (${WALLS_SPEC}).`
                }
            )
        }
    },
```

Note : `room/` importe encore `Vortex.ts` (`room/object/visualization/RoomObjectSpriteVisualization.ts:21`) ; ce mur-là n'est pas posé, J4 le supprime puis l'ajoute.

- [ ] **Step 4: Vérifier que les tests passent**

Run: `node --test packages/vortex-engine/tools/boundaries.test.mjs`
Expected: PASS — `# pass 8`, `# fail 0`.

- [ ] **Step 5: Vérifier que le code existant respecte déjà les murs**

Run: `node node_modules/eslint/bin/eslint.js "packages/*/src/**/*.ts" 2>&1 | tail -3; echo "exit=${PIPESTATUS[0]}"`
Expected: `exit=0` et aucune ligne `no-restricted-imports` (avant ce plan : 0 erreur dans `packages/*/src`, mesuré le 2026-10-07).

Run: `node node_modules/eslint/bin/eslint.js . 2>&1 | tail -2`
Expected: plus aucune erreur sous `.vortex-dev` ; il reste au plus 7 erreurs préexistantes, hors périmètre (6 dans `packages/vortex-client/tools/`, 1 dans `.claude/skills/run-vortex-client/`).

Run: `node --test "packages/*/tools/**/*.test.mjs"`
Expected: PASS — `# pass 19`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add eslint.config.mjs packages/vortex-engine/tools/boundaries.test.mjs
git commit -m "j0: murs entre couches vérifiés par ESLint (core, room, client)" -- eslint.config.mjs packages/vortex-engine/tools/boundaries.test.mjs
```

---

### Task 3: Règles du dépôt réécrites pour le nouveau régime

**Files:**
- Modify: `.claude/rules/00-mandate.md` (tout ce qui précède `## Before you delete or replace existing TypeScript`)
- Modify: `.claude/rules/20-architecture.md` (règles 1, 2, 8 ; nouvelle règle 10)
- Modify: `.claude/rules/30-as3-traceability.md` (nouveau paragraphe d'ouverture)
- Modify: `.claude/rules/communication.md` (règle 3 ; nouvelle règle 5)
- Modify: `CLAUDE.md` (ligne 3 ; bloc `## Commands` ; paragraphe « Header source-of-truth order »)
- Regenerate: `AGENTS.md`, `.github/copilot-instructions.md` (par `scripts/sync-agent-docs.mjs` s'il existe)

**Interfaces:**
- Consumes: `pnpm test`, `pnpm gen:headers` (Task 1) ; murs ESLint et `wall()` (Task 2).
- Produces: le texte de règles que tout agent charge à partir de J1.

- [ ] **Step 1: Réécrire l'en-tête de `00-mandate.md`**

Remplacer tout le texte du fichier situé **avant** la ligne `## Before you delete or replace existing TypeScript` par :

```markdown
# Before you code

This repository is the client of the Habbo RPG fork. Since 2026-10-07 it follows
`docs/superpowers/specs/2026-10-07-client-architecture-design.md`: the engine is being split into
packages (`@vortex/common`, `net`, `avatar`, `iso`, `ui`, `kernel`, `protocol`, `game`), and the
code no longer has to stay faithful to the AS3. The AS3 remains the best explanation of *why*
inherited code behaves the way it does.

Before writing implementation code:

1. **Read the spec and the plan** of the milestone you are working on (`docs/superpowers/specs/`,
   `docs/superpowers/plans/`).
2. **Read the code you change, and its AS3 origin when it has one.** The `AS3:` trace above a
   declaration points to it (primary tree `sources/WIN63-202607011411-782849652/`). Read it to
   understand inherited behaviour before changing it, not to copy it line by line.
3. **Respect the layer walls** (spec §3). `eslint.config.mjs` enforces the ones that exist; a
   `no-restricted-imports` error means the design is wrong, not the rule.
4. **Check `docs/PATTERNS.md`** before adding a Composer, Parser, Event, Manager or window.
5. **Read `docs/CLIENT-SERVER-ARCHITECTURE.md`** before touching anything that sends or receives
   network messages. Message ids come from the emulator (`pnpm gen:headers`), never from the AS3.

```

Les deux sections suivantes (`## Before you delete or replace existing TypeScript` et `## Before you act on a finding from an audit or an agent`) restent inchangées.

- [ ] **Step 2: Modifier `20-architecture.md`**

Remplacer la ligne de la règle 1 :

```markdown
1. **AS3 is the source of truth** — Never invent code. Read `sources/WIN63-202607011411-782849652/` first, cross-referencing `sources/win63_version/` when identifiers there are obfuscated
```

par :

```markdown
1. **AS3 explains inherited behaviour** — before changing inherited code, read its AS3 origin (the `AS3:` trace). Fidelity is no longer required (spec `2026-10-07-client-architecture-design.md` §10); understanding still is
```

Remplacer la ligne de la règle 2 :

```markdown
2. **Never simplify AS3 architecture** — If AS3 has handlers/interfaces/delegation, implement them exactly
```

par :

```markdown
2. **Restructure on purpose, not by accident** — the package split (spec §3) is the plan. Outside it, do not flatten handlers/interfaces/delegation without writing the reason at the declaration
```

Remplacer la ligne de la règle 8 (`8. **Full port**: …`) **et** les lignes de son exception (`**Exception du fork RPG :** …` jusqu'à `… suit toujours la règle du port complet.`) par :

```markdown
8. **No re-port of removed features** — the features listed in section 7 of the RPG spec
   (`vortex-rpg-emulator/docs/superpowers/specs/2026-10-05-habbo-rpg-design.md`) stay removed, except the
   fishing derby (M0 client plan, decision 1). Everything else inherited is kept and restructured, not re-ported.
```

Ajouter à la fin de la liste :

```markdown
10. **Layer walls** — the engines (`common`, `net`, `avatar`, `iso`, `ui`) never import `kernel`, `protocol` or `game`; `iso` may import `avatar`, never the reverse; features are folders of `game` and talk through declared interfaces or events (spec §3). Walls are enforced by `package.json` dependencies between packages and by `no-restricted-imports` in `eslint.config.mjs` (add new ones with `wall()`).
```

- [ ] **Step 3: Ouvrir `30-as3-traceability.md` sur le nouveau régime**

Juste après le titre `# AS3 traceability`, insérer :

```markdown
**Since 2026-10-07 the trace is provenance, not a fidelity contract**
(`docs/superpowers/specs/2026-10-07-client-architecture-design.md` §10). It records where inherited
code came from. Three consequences:

- **Keep the `AS3:` line when you move, rename or restructure a member.** Losing it loses the only
  pointer to the code that explains the behaviour.
- **A member that now behaves differently from its origin keeps its `AS3:` line.** A
  `// DEVIATION:` note is recommended when the difference would surprise someone reading the AS3,
  and no longer required.
- **New code needs no marker.** RPG features and new packages carry neither `AS3:` nor `TS-only:`;
  `TS-only:` is only for a member added to a class that was ported from the AS3.

The rest of this file describes how the traces were written during the port; it still applies to
reading and keeping them.

```

Dans le même fichier, remplacer le paragraphe :

```markdown
Incomplete members still require a compatible TypeScript signature and a `TODO(AS3)` comment with source path, class/member name, and exact remaining behavior. Never silently omit an AS3 member because it is currently unused; incomplete behavior must be visible as a TODO/stub, not missing from the interface.
```

par :

```markdown
An inherited member left half-done keeps a compatible TypeScript signature and a `TODO(AS3)` comment with source path, class/member name, and exact remaining behavior. A member deliberately removed during the refactor simply goes, with the reason in the commit message.
```

Et remplacer, au début de `## A faithful line is not a faithful port`, les lignes :

```markdown
AS3 is the source of truth. That is not in question, and none of what follows is licence to
deviate — every time this port *departed* from the AS3 it got worse (`AvatarInfoWidget.positionView()`
```

par :

```markdown
This section was written during the port, when the AS3 was the contract. Its lesson outlives that
contract and applies to every change of inherited code: during the port, every *accidental*
departure from the AS3 made things worse (`AvatarInfoWidget.positionView()`
```

- [ ] **Step 4: Modifier `communication.md`**

Remplacer la règle 3 :

```markdown
3. `Parser.parse()` read order and `Composer.getMessageArray()` field order MUST match the AS3 exactly; reordering silently breaks the wire format.
```

par :

```markdown
3. `Parser.parse()` read order and `Composer.getMessageArray()` field order MUST match the emulator's serializer/parser for that message (`vortex-rpg-emulator/Vortex.Revisions/Revision20260701/{Serializers,Parsers}/`); reordering silently breaks the wire format.
```

Ajouter à la fin de la liste :

```markdown
5. **Message ids come from `Headers.generated.ts`**, written by `pnpm gen:headers` from the emulator's `Headers.cs` and checked by the pre-commit hook. New registrations use `Incoming.X` / `Outgoing.X`; never type an id by hand, never take one from the AS3 registry.
```

- [ ] **Step 5: Modifier `CLAUDE.md`**

Remplacer la ligne 3 :

```markdown
Fork RPG de vortex-modern-client ; voir la spec et `.claude/rules/20-architecture.md` règle 8.
```

par :

```markdown
Fork RPG de vortex-modern-client ; voir la spec et `.claude/rules/20-architecture.md` règle 8.
Depuis le 2026-10-07, l'architecture cible est `docs/superpowers/specs/2026-10-07-client-architecture-design.md`
(moteurs en paquets, features branchables, config typée) ; la synchro avec `vortex-modern-client` est
arrêtée et la fidélité à l'AS3 n'est plus exigée (`.claude/rules/00-mandate.md`).
```

Dans le bloc de code de `## Commands`, ajouter après la ligne `pnpm lint …` :

```bash
pnpm test         # node:test over packages/*/tools/**/*.test.mjs (header generator, layer walls)
pnpm gen:headers  # Regenerate Headers.generated.ts from ../vortex-rpg-emulator's Headers.cs
```

Remplacer le paragraphe :

```markdown
Header source-of-truth order stays: WIN63's own registry
(`.../habbo/communication/_SafeCls_2046.as`) first, then the emulator as corroboration — never the
emulator alone.
```

par :

```markdown
Header source of truth is **the emulator** (since 2026-10-07): `pnpm gen:headers` writes
`packages/vortex-engine/src/habbo/communication/Headers.generated.ts` from
`../vortex-rpg-emulator/Vortex.Revisions/Revision20260701/Headers.cs`, and the pre-commit hook refuses
a stale copy. The WIN63 registry (`.../habbo/communication/_SafeCls_2046.as`) is history: read it to
understand an inherited message, never to pick a number.
```

- [ ] **Step 6: Vérifier qu'il ne reste pas d'injonction de l'ancien régime**

Run: `grep -nE "source of truth\*\*|AS3 is the source of truth|implement them exactly|No exceptions|licence to|Never silently omit|MUST match the AS3|Header source-of-truth order stays|ALL AS3 files are ported" .claude/rules/*.md CLAUDE.md; echo "grep-exit=$?"`
Expected: `grep-exit=1` (aucune ligne).

Run: `grep -c "2026-10-07-client-architecture-design" .claude/rules/00-mandate.md .claude/rules/20-architecture.md .claude/rules/30-as3-traceability.md CLAUDE.md`
Expected: chaque fichier ≥ 1.

- [ ] **Step 7: Régénérer les docs d'agents**

Run: `[ -f scripts/sync-agent-docs.mjs ] && node scripts/sync-agent-docs.mjs; git status --short AGENTS.md .github/copilot-instructions.md`
Expected: les deux fichiers apparaissent modifiés si le script existe ; sinon rien (le script est local, le hook le relancera chez qui l'a).

- [ ] **Step 8: Commit**

```bash
git add .claude/rules/00-mandate.md .claude/rules/20-architecture.md .claude/rules/30-as3-traceability.md .claude/rules/communication.md CLAUDE.md AGENTS.md .github/copilot-instructions.md
git commit -m "j0: règles du dépôt pour la refonte (AS3 = provenance, en-têtes de l'émulateur, murs)" -- .claude/rules/00-mandate.md .claude/rules/20-architecture.md .claude/rules/30-as3-traceability.md .claude/rules/communication.md CLAUDE.md AGENTS.md .github/copilot-instructions.md
```

(Si `AGENTS.md` et `.github/copilot-instructions.md` n'ont pas changé, les retirer des deux listes.)

---

## Fin de J0

- [ ] `node --test "packages/*/tools/**/*.test.mjs"` → `# pass 19`, `# fail 0`.
- [ ] `node packages/vortex-engine/tools/gen-headers.mjs --check` → exit 0.
- [ ] `node node_modules/eslint/bin/eslint.js "packages/*/src/**/*.ts"` → exit 0.
- [ ] `pnpm build` → succès (rien dans ce plan ne touche au code applicatif ; le fichier généré n'est encore importé par personne).
- [ ] Parcours manuel (spec §11) : `pnpm dev`, connexion, entrée en room, avatar visible, ouverture d'une fenêtre.
- [ ] Le plan J1 (`common` + `net`) peut commencer.
