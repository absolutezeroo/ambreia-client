// Map editor spec §2: the core is pure TypeScript — no engine, no client, no DOM framework — and its
// generated zone types match the emulator's schema.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');

const sources = (dir: string): string[] => readdirSync(dir, {withFileTypes: true}).flatMap(e =>
    e.isDirectory() ? sources(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : []);

test('the core imports only itself and @ambreia/common', () =>
{
    const bad = sources(join(root, 'src')).flatMap(file =>
        [...readFileSync(file, 'utf8').matchAll(/from\s+'([^']+)'/g)]
            .map(m => m[1])
            .filter(spec => !spec.startsWith('.') && !spec.startsWith('@ambreia/common/'))
            .map(spec => `${file}: ${spec}`));

    assert.deepEqual(bad, []);
});

test('Zone.generated.ts matches the emulator schema', {skip: !existsSync(resolve(root, '../../../vortex-rpg-emulator/schemas/zone.schema.json'))}, async () =>
{
    // @ts-expect-error -- plain .mjs tool, no declarations
    const {generate} = await import('../tools/gen-zone-types.mjs');
    const schema = JSON.parse(readFileSync(resolve(root, '../../../vortex-rpg-emulator/schemas/zone.schema.json'), 'utf8'));

    // Git may check the file out with CRLF: only the content counts.
    assert.equal(await generate(schema), readFileSync(join(root, 'src/zone/Zone.generated.ts'), 'utf8').replace(/\r\n/g, '\n'),
        'stale: run pnpm --filter @ambreia/map-editor-core gen:types');
});
