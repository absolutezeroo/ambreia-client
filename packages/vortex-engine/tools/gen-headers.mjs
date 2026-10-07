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
